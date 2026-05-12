import { NextFunction, Request, Response } from "express";

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== "admin") {
        res.status(403).json({ message: "Forbidden" });
        return;
    }
    next();
};