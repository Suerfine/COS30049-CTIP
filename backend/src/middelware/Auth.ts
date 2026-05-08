import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../models/User";

type DecodedAuthToken = JwtPayload & {
  id?: number;
  role?: string;
};

export const auth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new Error("No authorization header");
    }
    const [tokenType, token] = authHeader.split(" ");
    if (tokenType !== "Bearer" || !token) {
      throw new Error("Invalid authorization header");
    }
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT secret not configured");
    }
    const decoded = jwt.verify(token, jwtSecret) as DecodedAuthToken | string;
    if (typeof decoded === "string" || typeof decoded.id !== "number") {
      throw new Error("Invalid token payload");
    }
    const user = await User.findByPk(decoded.id);
    if (!user) {
      throw new Error("User not found");
    }

    // Update user's last active timestamp
    user.updated_at = new Date();
    await user.save();

    // Attach user to request object for downstream handlers
    req.user = user;
    return next();
  } catch (err) {
    res
      .status(401)
      .json({ message: err instanceof Error ? err.message : "Unauthorized" });
    return;
  }
};
