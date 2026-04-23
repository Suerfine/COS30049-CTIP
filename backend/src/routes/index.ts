import { Router } from "express";
import userRouter from "./UserRoute";

const router = Router();

/*=============================
=         USER ROUTES         =
=============================*/
router.use("/users", userRouter);

export default router;