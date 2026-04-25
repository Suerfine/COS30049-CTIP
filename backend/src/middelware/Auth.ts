import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../models/User";

type DecodedAuthToken = JwtPayload & {
  id?: number;
  role?: string;
};

export const auth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const [tokenType, token] = authHeader.split(" ");

    if (tokenType !== "Bearer" || !token) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as DecodedAuthToken | string;

    if (typeof decoded === "string" || typeof decoded.id !== "number") {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await User.findByPk(decoded.id);

    if (!user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
  }
};
