import { Router } from "express";

import * as UserController from "../controllers/UserController";

import {auth} from "../middelware/Auth";

const router = Router();

/*=============================
=         USER ROUTES         =
=============================*/
router.get("/users", UserController.getAllUsers);

export default router;