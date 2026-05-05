import { Router } from "express";
import userRouter from "./UserRoute";
import registrationRouter from "./RegistrationRoute";
import courseRouter from "./CourseRoute";
import moduleRouter from "./ModuleRoute";
import pageRouter from "./PageRoute";
import messageRouter from "./MessageRoute";
import enrollmentRouter from "./EnrollmentRoute";
import submissionRouter from "./SubmissionRoute";
import tagRouter from "./TagRoute";
import * as AuthController from "../controllers/AuthController";
import elementRouter from "./ElementRoute";
// import sensorRouter from "./SensorRoute";
// import sensorLogRouter from "./SensorLogRoute";
import * as ElementController from "../controllers/ElementController";
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
 *     description: Authenticate with username and password to receive a JWT access token for OAuth2 authentication. The username is matched against the personal_email column.
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
 *                 description: Your personal email address.
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
=     ENROLLMENT ROUTES        =
===============================*/
router.use("/enrollments", enrollmentRouter);

/*===============================
=        COURSE ROUTES         =
===============================*/
router.use("/courses", courseRouter);
router.use("/tags", tagRouter);
router.use("/", moduleRouter);
router.use("/", pageRouter);
router.use("/", messageRouter);
router.use("/", enrollmentRouter);
router.use("/", submissionRouter);

/*===============================
=        SENSOR ROUTES         =
===============================*/
// router.use("/sensors", sensorRouter);
// router.use("/", sensorLogRouter);

/*===============================
=        ENROLLMENT ROUTES        =
===============================*/
// TODO: Temporarily adding some of elements routes here to deal with some architecture issues.
router.use("/", elementRouter);

/**
 * @swagger
 * /api/courses/{course_Id}/elements/workshops:
 *   get:
 *     summary: Get all workshops in a course
 *     tags: [Elements]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: course_Id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the course
 *     responses:
 *       200:
 *         description: Successfully retrieved course workshops
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Element'
 */
router.get(
  "/courses/:course_Id/elements/workshops",
  auth,
  ElementController.getCourseWorkshopsSummary,
);

/**
 * @swagger
 * /api/courses/{course_Id}/elements/{element_id}/workshops/join:
 *   post:
 *     summary: Join a workshop in a course
 *     tags: [Elements]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: course_Id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the course
 *       - in: path
 *         name: element_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the element (must be a workshop)
 *     responses:
 *       200:
 *         description: Successfully joined the workshop
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Joined workshop successfully
 */
router.post(
  "/courses/:course_Id/elements/:element_id/workshops/join",
  auth,
  ElementController.joinWorkshop,
);

export default router;
