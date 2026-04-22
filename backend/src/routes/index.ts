import { Router } from "express";

import * as UserController from "../controllers/UserController";

import {auth} from "../middelware/Auth";

const router = Router();

/*=============================
=         USER ROUTES         =
=============================*/
router.get("/users", auth, UserController.getAllUsers);
// router.get("/users/:id", auth, UserController.getUserById);

export default router;