import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { verifyPassword } from "../utils/password";

type TokenRequestBody = {
  personal_email?: string;
  password?: string;
};

export const token = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { personal_email, password } = req.body as TokenRequestBody;

    if (!personal_email || !password) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const user = await User.findOne({ where: { personal_email } });

    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const isValidPassword = verifyPassword(password, user.password_hash);

    if (!isValidPassword) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      res.status(500).json({ message: "JWT secret is not configured" });
      return;
    }

    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      jwtSecret,
      { expiresIn: "1h" },
    );

    user.updated_at = new Date();
    await user.save();

    res.status(200).json({
      access_token: accessToken,
      token_type: "Bearer",
    });
  } catch (error) {
    next(error);
  }
};
