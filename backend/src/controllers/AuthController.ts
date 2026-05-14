import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User";
import PasswordResetToken from "../models/PasswordResetToken";
import { Op } from "sequelize";
import { hashPassword, isBcryptHash, verifyPassword } from "../utils/password";
import { DatabaseError } from "sequelize/lib/errors/index";
import { sendPasswordResetEmail, sendPasswordChangedEmail } from "../utils/mailer";

type TokenRequestBody = {
  username?: string;
  password?: string;
};

type ChangePasswordRequestBody = {
  current_password?: string;
  new_password?: string;
};

type ForgotPasswordRequestBody = {
  email?: string;
};

type ResetPasswordRequestBody = {
  token?: string;
  password?: string;
};

const SFC_EMAIL_DOMAIN = "sfc.gov.my";

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
        username: identificationFromEmail,
      },
    });

    if (!user) {
      res.status(401).json({ message: "Incorrect username or password" });
      return;
    }

    const isValidPassword = verifyPassword(password, user.password_hash);

    if (!isValidPassword) {
      res.status(401).json({ message: "Incorrect username or password" });
      return;
    }

    if (!isBcryptHash(user.password_hash)) {
      user.password_hash = hashPassword(password);
      await user.save();
    }

    const jwtSecret = process.env.JWT_SECRET;

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
      must_change_password: user.must_change_password ?? false,
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
      // generate a random token, store its hash in DB with expiry, and email the plaintext token
      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      await PasswordResetToken.create({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      });

      const resetUrl = buildPasswordResetUrl(token);

      try {
        await sendPasswordResetEmail({
          to: user.personal_email,
          firstname: user.firstname,
          lastname: user.lastname,
          resetUrl,
        });
      } catch (emailError) {
        // Log the error but don't fail the request (don't leak email existence)
        console.warn("Failed to send password reset email:", emailError instanceof Error ? emailError.message : emailError);
      }
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

    // verify token via DB lookup

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const tokenRecord = await PasswordResetToken.findOne({ where: { token_hash: tokenHash } });

    if (!tokenRecord) {
      res.status(400).json({ message: "Invalid or expired reset token" });
      return;
    }

    if (tokenRecord.used_at) {
      res.status(400).json({ message: "Reset token has already been used" });
      return;
    }

    if (tokenRecord.expires_at.getTime() < Date.now()) {
      res.status(400).json({ message: "Invalid or expired reset token" });
      return;
    }

    const user = await User.findByPk(tokenRecord.user_id);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (verifyPassword(password, user.password_hash)) {
      res.status(400).json({ message: "New password must be different from your current password" });
      return;
    }

    user.password_hash = hashPassword(password);
    user.updated_at = new Date();
    await user.save();

    tokenRecord.used_at = new Date();
    await tokenRecord.save();

    // send confirmation email to user (best effort, don't fail if email fails)
    try {
      await sendPasswordChangedEmail({
        to: user.personal_email,
        firstname: user.firstname,
        lastname: user.lastname,
      });
    } catch (emailError) {
      console.warn("Failed to send password changed confirmation email:", emailError instanceof Error ? emailError.message : emailError);
    }

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

export const changePassword = async (
  req: Request & { user?: User },
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { current_password, new_password } = req.body as ChangePasswordRequestBody;

    if (!current_password || !new_password) {
      res.status(400).json({ message: "Current password and new password are required" });
      return;
    }

    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const isValid = verifyPassword(current_password, user.password_hash);
    if (!isValid) {
      res.status(401).json({ message: "Current password is incorrect" });
      return;
    }

    if (verifyPassword(new_password, user.password_hash)) {
      res.status(400).json({ message: "New password must be different from your current password" });
      return;
    }

    user.password_hash = hashPassword(new_password);
    user.must_change_password = false;
    user.updated_at = new Date();
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    if (error instanceof DatabaseError) {
      const dbMessage =
        (error.parent as { message?: string } | undefined)?.message ?? error.message;
      console.log("Database error during password change:", dbMessage);
      res.status(500).json({ message: "Database error during password change" });
      next();
      return;
    }
    next(error);
  }
};
