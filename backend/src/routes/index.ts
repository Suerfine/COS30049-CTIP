import { Router } from "express";
import userRouter from "./UserRoute";
import registrationRouter from "./RegistrationRoute";
import courseRouter from "./CourseRoute";
import messageRouter from "./MessageRoute";
import enrollmentRouter from "./EnrollmentRoute";
import submissionRouter from "./SubmissionRoute";
import NotificationRouter from "./NotificationRoute";
import eventRouter from "./EventRoute";
import tagRouter from "./TagRoute";
import anomalyEventRouter from "./AnomalyEventRoute";
import arModelRouter from "./ArModelRoute";
import * as AuthController from "../controllers/AuthController";
import * as TotpController from "../controllers/TotpController";
import progressRouter from "./ProgressRoute";
import sensorLogRouter from "./SensorLogRoute";
import * as ElementController from "../controllers/ElementController";
import { auth } from "../middelware/Auth";
import sensorRouter from "./SensorRoute";
import discussionRouter from "./DiscussionRoute";
import paymentRouter from "./PaymentRoute";
import ChatbotRouter from "./ChatbotRoute";
import searchRouter from "./SearchRoute";
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
router.post("/token/totp", TotpController.verifyLogin);
router.post("/totp/setup", auth, TotpController.setup);
router.post("/totp/verify-setup", auth, TotpController.verifySetup);
router.post("/totp/disable", auth, TotpController.disable);

/*===============================
=     REGISTRATION ROUTES      =
===============================*/
router.use("/registrations", registrationRouter);
router.use("/anomaly-events", anomalyEventRouter);
router.use("/Anomaly-events", anomalyEventRouter);
router.use("/ar-models", arModelRouter);

/*===============================
=          AR MODELS            =
===============================*/
router.use("/ar-models", arModelRouter);

/*===============================
=        COURSE ROUTES         =
===============================*/
router.use("/courses", courseRouter);
router.use("/tags", tagRouter);
router.use("/enrollments", enrollmentRouter);
router.use("/", submissionRouter);
router.use("/progress", progressRouter);
router.use("/courses/:course_id/discussion", discussionRouter);
router.use("/", messageRouter);
router.use("/sensors", sensorRouter);
router.use("/sensors/{sensor_id}/logs", sensorLogRouter);

/*===============================
=     NOTIFICATION ROUTES      =
===============================*/
router.use("/notifications", NotificationRouter);

/*===============================
=     Event ROUTES      =
===============================*/
router.use("/events", eventRouter);

/*===============================
=        PAYMENT ROUTES        =
===============================*/
router.use("/payments", paymentRouter);
router.use("/chatbot", ChatbotRouter);
router.use("/search", searchRouter);

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

/**
 * Debug function to log all route handlers as they are called.
 * @param router The Express router to instrument.
 */
function instrumentRouter(router: Router) {
  const anyRouter = router as any;
  if (!anyRouter.stack || !Array.isArray(anyRouter.stack)) return;

  anyRouter.stack.forEach((layer: any) => {
    if (layer.route && layer.route.stack) {
      layer.route.stack.forEach((routeLayer: any) => {
        if (routeLayer.handle && routeLayer.handle.__instrumented) return;

        const original = routeLayer.handle;
        if (typeof original !== "function") return;

        const wrapped = function (this: any, req: any, res: any, next: any) {
          const handlerName = original.name || "<anonymous>";
          const routePath = `${req.baseUrl || ""}${req.route?.path || ""}`;
          console.log(`[router] ${req.method} ${routePath} -> ${handlerName}`);
          try {
            const result = original.call(this, req, res, next);
            if (result && typeof result.then === "function") {
              result.catch(next);
            }
            return result;
          } catch (err) {
            next(err);
          }
        };

        (wrapped as any).__instrumented = true;
        routeLayer.handle = wrapped;
      });
    }

    if (
      layer.name === "router" &&
      layer.handle &&
      Array.isArray(layer.handle.stack)
    ) {
      instrumentRouter(layer.handle);
    }
  });
}
instrumentRouter(router);
export default router;
