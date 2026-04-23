import { Router, Request, Response } from "express";
import * as UserController from "../controllers/UserController";
import { auth } from "../middelware/Auth";

const userRouter = Router();

// Create user
userRouter.post("/", (_req: Request, res: Response) => {
	res.status(501).json({ message: "Not implemented" });
});

// Read all users
userRouter.get("/",auth, UserController.getAllUsers);

// Read single user
userRouter.get("/:id", auth, UserController.getUserById);

// Update user
userRouter.put("/:id", auth, UserController.upsertUser);

// Delete user
userRouter.delete("/:id", auth, (_req: Request, res: Response) => {
	res.status(501).json({ message: "Not implemented" });
});

export default userRouter;

