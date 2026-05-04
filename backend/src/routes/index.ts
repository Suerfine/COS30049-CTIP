import { Router } from "express";
import userRouter from "./UserRoute";
import registrationRouter from "./RegistrationRoute";
import courseRouter from "./CourseRoute";
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
 *     description: Authenticate with username and password to receive a JWT access token for OAuth2 authentication. The username must be the SFC account email format {identification}@sfc.gov.my.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 format: email
 *                 description: Your SFC account email address (example: 050812130827@sfc.gov.my).
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

/*===============================
=        COURSE ROUTES         =
===============================*/
router.use("/courses", courseRouter);

export default router;
