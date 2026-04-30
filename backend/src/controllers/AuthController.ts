import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { verifyPassword } from "../utils/password";
import { DatabaseError } from "sequelize/lib/errors/index";

type TokenRequestBody = {
  personal_email?: string;
  password?: string;
};

export const token = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { personal_email, password } = req.body as TokenRequestBody;
    const normalizedEmail =
      typeof personal_email === "string"
        ? personal_email.trim().toLowerCase()
        : "";

    if (!normalizedEmail || !password) {
      res.status(401).json({ message: "Incorrect email or password" });
      return;
    }

    const user = await User.findOne({
      where: { personal_email: normalizedEmail },
    });

    if (!user) {
      res.status(401).json({ message: "Incorrect email or password" });
      return;
    }

    const isValidPassword = verifyPassword(password, user.password_hash);

    if (!isValidPassword) {
      res.status(401).json({ message: "Incorrect email or password" });
      return;
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
