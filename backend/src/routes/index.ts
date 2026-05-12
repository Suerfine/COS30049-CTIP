import { Router } from "express";
import userRouter from "./UserRoute";
import registrationRouter from "./RegistrationRoute";
import courseRouter from "./CourseRoute";
import submissionRouter from "./SubmissionRoute";
import * as AuthController from "../controllers/AuthController";
import { auth } from "../middelware/Auth";
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
 *                 description: "Your SFC account email address (example: 050812130827@sfc.gov.my)."
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

/**
 * @openapi
 * /api/forgot-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Request a password reset link
 *     description: Sends a password reset link to the user's registered email address if the account exists.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@sfc.gov.my
 *     responses:
 *       200:
 *         description: Reset link request accepted
 *       400:
 *         description: Email is required
 */
router.post("/forgot-password", AuthController.forgotPassword);

/**
 * @openapi
 * /api/reset-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Reset the account password
 *     description: Accepts a valid password reset token and updates the user's password.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid request or reset token
 *       404:
 *         description: User not found
 */
router.post("/reset-password", AuthController.resetPassword);
router.post("/change-password", auth, AuthController.changePassword);

/*===============================
=     REGISTRATION ROUTES      =
===============================*/
router.use("/registrations", registrationRouter);

/*===============================
=        COURSE ROUTES         =
===============================*/
router.use("/courses", courseRouter);

/*===============================
=      SUBMISSION ROUTES       =
===============================*/
router.use("/submissions", submissionRouter);

export default router;
