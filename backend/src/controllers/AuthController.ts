import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { Op } from "sequelize";
import { hashPassword, isBcryptHash, verifyPassword } from "../utils/password";
import { DatabaseError } from "sequelize/lib/errors/index";
import { sendPasswordResetEmail } from "../utils/mailer";

type TokenRequestBody = {
  username?: string;
  password?: string;
};

type ForgotPasswordRequestBody = {
  email?: string;
};

type ResetPasswordRequestBody = {
  token?: string;
  password?: string;
};

const SFC_EMAIL_DOMAIN = "sfc.gov.my";
const PASSWORD_RESET_EXPIRY = "15m";

function parseSfcLoginEmail(value: string): string | null {
  const email = value.trim().toLowerCase();
  const [localPart, domain] = email.split("@");

  if (!localPart || !domain || domain !== SFC_EMAIL_DOMAIN) {
    return null;
  }

  return localPart;
}

function buildFrontendBaseUrl(): string {
  return (process.env.FRONTEND_URL ?? "").trim().replace(/\/$/, "");
}

function buildPasswordResetUrl(token: string): string {
  const frontendBaseUrl = buildFrontendBaseUrl();

  if (frontendBaseUrl) {
    return `${frontendBaseUrl}/reset-password?token=${encodeURIComponent(token)}`;
  }

  return `parkguide://reset-password?token=${encodeURIComponent(token)}`;
}

export const token = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { username, password } = req.body as TokenRequestBody;
    const normalizedUsername =
      typeof username === "string" ? username.trim().toLowerCase() : "";
    const identificationFromEmail = parseSfcLoginEmail(normalizedUsername);

    if (!identificationFromEmail || !password) {
      res.status(401).json({ message: "Incorrect username or password" });
      return;
    }

    const user = await User.findOne({
      where: {
        [Op.or]: [
          { identification: identificationFromEmail },
          { personal_email: normalizedUsername },
        ],
      },
    });

    if (!user) {
      res.status(401).json({ message: "Incorrect username or password" });
      return;
    }

    const isValidPassword = await verifyPassword(password, user.password_hash);

    if (!isValidPassword) {
      res.status(401).json({ message: "Incorrect username or password" });
      return;
    }

    if (!isBcryptHash(user.password_hash)) {
      user.password_hash = await hashPassword(password);
    }

    const jwtSecret = process.env.JWT_SECRET;
    console.log("JWT Secret:", jwtSecret);

    if (!jwtSecret) {
      res.status(500).json({ message: "JWT is not configured" });
      return;
    }

    const accessToken = jwt.sign({ id: user.id, role: user.role }, jwtSecret, {
      expiresIn: "1h",
    });

    user.last_login_at = new Date();
    user.updated_at = new Date();
    await user.save();

    res.status(200).json({
      access_token: accessToken,
      token_type: "Bearer",
    });
  } catch (error) {
    if (error instanceof DatabaseError) {
      const dbMessage =
        (error.parent as { message?: string } | undefined)?.message ??
        error.message;
      console.log("Database error during authentication:", dbMessage);
      res.status(500).json({ message: "Database error during authentication" });
      next();
    }
    next(error);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email } = req.body as ForgotPasswordRequestBody;
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!normalizedEmail) {
      res.status(400).json({ message: "Email is required" });
      return;
    }

    // Try to parse as SFC email first
    const identificationFromSfcEmail = parseSfcLoginEmail(normalizedEmail);

    const user = await User.findOne({
      where: {
        [Op.or]: [
          { personal_email: normalizedEmail },
          ...(identificationFromSfcEmail ? [{ identification: identificationFromSfcEmail }] : []),
        ],
      },
    });

    if (user) {
      const jwtSecret = process.env.JWT_SECRET;

      if (!jwtSecret) {
        res.status(500).json({ message: "JWT is not configured" });
        return;
      }

      const resetToken = jwt.sign(
        { id: user.id, purpose: "password-reset" },
        jwtSecret,
        { expiresIn: PASSWORD_RESET_EXPIRY },
      );
      const resetUrl = buildPasswordResetUrl(resetToken);

      await sendPasswordResetEmail({
        to: user.personal_email,
        firstname: user.firstname,
        lastname: user.lastname,
        resetUrl,
      });
    }

    res.status(200).json({
      message: "If the email exists, a password reset link will be sent.",
    });
  } catch (error) {
    if (error instanceof DatabaseError) {
      const dbMessage =
        (error.parent as { message?: string } | undefined)?.message ??
        error.message;
      console.log("Database error during password reset request:", dbMessage);
      res.status(500).json({ message: "Database error during password reset request" });
      next();
      return;
    }
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { token, password } = req.body as ResetPasswordRequestBody;

    if (!token || !password) {
      res.status(400).json({ message: "Token and password are required" });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      res.status(500).json({ message: "JWT is not configured" });
      return;
    }

    const payload = jwt.verify(token, jwtSecret) as {
      id?: number;
      purpose?: string;
    };

    if (payload.purpose !== "password-reset" || typeof payload.id !== "number") {
      res.status(400).json({ message: "Invalid or expired reset token" });
      return;
    }

    const user = await User.findByPk(payload.id);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    user.password_hash = await hashPassword(password);
    user.updated_at = new Date();
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    if (error instanceof DatabaseError) {
      const dbMessage =
        (error.parent as { message?: string } | undefined)?.message ??
        error.message;
      console.log("Database error during password reset:", dbMessage);
      res.status(500).json({ message: "Database error during password reset" });
      next();
      return;
    }

    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      res.status(400).json({ message: "Invalid or expired reset token" });
      return;
    }

    next(error);
  }
};
