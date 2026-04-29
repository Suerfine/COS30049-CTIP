import { Router } from "express";
import userRouter from "./UserRoute";
import registrationRouter from "./RegistrationRoute";
import * as AuthController from "../controllers/AuthController";
const router = Router();

/*=============================
=         USER ROUTES         =
=============================*/
router.use("/users", userRouter);

/**
 * @openapi
 * /api/token:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Issue JWT access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - personal_email
 *               - password
 *             properties:
 *               personal_email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Access token issued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 access_token:
 *                   type: string
 *                 token_type:
 *                   type: string
 *                   example: Bearer
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid credentials
 */
router.post("/token", AuthController.token);

/*===============================
=     REGISTRATION ROUTES      =
===============================*/
router.use("/registrations", registrationRouter);

export default router;
