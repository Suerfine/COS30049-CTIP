import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { Op } from "sequelize";
import { hashPassword, isBcryptHash, verifyPassword } from "../utils/password";
import { DatabaseError } from "sequelize/lib/errors/index";

type TokenRequestBody = {
  username?: string;
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
