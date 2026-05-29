import { Request, Response } from "express";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../models/User";

const APP_NAME = "SFC Digital Training";

type TotpChallengePayload = JwtPayload & {
  type: string;
  id: number;
};

// POST /api/totp/setup  (requires auth)
// Returns a QR code data URL and the raw base32 secret for the user to scan
export const setup = async (req: Request, res: Response): Promise<void> => {
  const user = req.user as User;

  if (user.totp_enabled) {
    res.status(400).json({ message: "2FA is already enabled" });
    return;
  }

  const generated = speakeasy.generateSecret({
    name: `${APP_NAME} (${user.personal_email})`,
    length: 20,
  });

  const qr_code = await QRCode.toDataURL(generated.otpauth_url as string);

  res.json({ secret: generated.base32, qr_code });
};

// POST /api/totp/verify-setup  (requires auth)
// Body: { secret, code }
// Verifies the code against the pending secret, then saves it permanently
export const verifySetup = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const user = req.user as User;
  const { secret, code } = req.body as { secret?: string; code?: string };

  if (!secret || !code) {
    res.status(400).json({ message: "Secret and code are required" });
    return;
  }

  const isValid = speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token: code,
    window: 1,
  });

  if (!isValid) {
    res.status(400).json({ message: "Invalid code. Please try again." });
    return;
  }

  user.totp_secret = secret;
  user.totp_enabled = true;
  await user.save();

  res.json({ message: "2FA enabled successfully" });
};

// POST /api/totp/disable  (requires auth)
// Body: { code }
// Verifies the current TOTP code before disabling 2FA
export const disable = async (req: Request, res: Response): Promise<void> => {
  const user = req.user as User;
  const { code } = req.body as { code?: string };

  if (!user.totp_enabled || !user.totp_secret) {
    res.status(400).json({ message: "2FA is not enabled" });
    return;
  }

  if (!code) {
    res.status(400).json({ message: "Code is required" });
    return;
  }

  const isValid = speakeasy.totp.verify({
    secret: user.totp_secret,
    encoding: "base32",
    token: code,
    window: 1,
  });

  if (!isValid) {
    res.status(400).json({ message: "Invalid code. Please try again." });
    return;
  }

  user.totp_secret = null;
  user.totp_enabled = false;
  await user.save();

  res.json({ message: "2FA disabled successfully" });
};

// POST /api/token/totp  (no auth required)
// Body: { totp_session_token, code }
// Exchanges a short-lived TOTP challenge token + 6-digit code for a full JWT
export const verifyLogin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { totp_session_token, code } = req.body as {
    totp_session_token?: string;
    code?: string;
  };

  if (!totp_session_token || !code) {
    res.status(400).json({ message: "Session token and code are required" });
    return;
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    res.status(500).json({ message: "JWT is not configured" });
    return;
  }

  let decoded: TotpChallengePayload;
  try {
    decoded = jwt.verify(
      totp_session_token,
      jwtSecret,
    ) as TotpChallengePayload;
  } catch {
    res
      .status(401)
      .json({ message: "Invalid or expired session. Please log in again." });
    return;
  }

  if (decoded.type !== "totp_challenge") {
    res.status(401).json({ message: "Invalid session token" });
    return;
  }

  const user = await User.findByPk(decoded.id);
  if (!user || !user.totp_enabled || !user.totp_secret) {
    res.status(401).json({ message: "User not found or 2FA not configured" });
    return;
  }

  const isValid = speakeasy.totp.verify({
    secret: user.totp_secret,
    encoding: "base32",
    token: code,
    window: 1,
  });

  if (!isValid) {
    res.status(401).json({ message: "Invalid code. Please try again." });
    return;
  }

  const accessToken = jwt.sign({ id: user.id, role: user.role }, jwtSecret, {
    expiresIn: "1h",
  });

  user.last_login_at = new Date();
  await user.save();

  res.json({ access_token: accessToken, token_type: "Bearer" });
};
