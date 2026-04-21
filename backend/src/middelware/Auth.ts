import { Request, Response, NextFunction } from "express";

export const auth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization;
  // // TODO: verify JWT
  // if (!token) {
  //   return res.status(401).json({ message: "Unauthorized" });
  // }
  next(); // allow all requests for now
};
