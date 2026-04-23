import { Request, Response, NextFunction } from "express";
import {User} from "../models";

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization;
  // // TODO: verify JWT
  // if (!token) {
  //   return res.status(401).json({ message: "Unauthorized" });
  // }

  // Decode JWT token

  // Retrieve the user from the database based on the token (for demonstration, we just get the first user)
  const logged_in_user = await User.findByPk(1); // Replace with actual user retrieval logic based on token

  if (!logged_in_user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Attach user to request object for downstream handlers
  req.user = logged_in_user;

  next(); // allow all requests for now
};
