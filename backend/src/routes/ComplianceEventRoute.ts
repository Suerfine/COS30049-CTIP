import { Router } from "express";
import * as ComplianceEventController from "../controllers/ComplianceEventController";
import { body, param } from "express-validator";
import { validate } from "../middelware/Validate";

const complianceEventRouter = Router();

/**
 * @swagger
 * /api/compliance-events:
 *   post:
 *     summary: Create a new compliance event
 *     description: Creates a compliance event record from the AI inference server.
 *     tags: [Compliance Events]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - event_type
 *               - severity
 *               - description
 *             properties:
 *               user_id:
 *                 type: integer
 *                 example: 1
 *               event_type:
 *                 type: string
 *                 enum: [plucking, animal_strike, extended_touch, other]
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high]
 *               description:
 *                 type: string
 *               metadata:
 *                 type: object
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       201:
 *         description: Compliance event created successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
complianceEventRouter.post(
  "/",
  [
    body("user_id").isInt({ min: 1 }),
    body("event_type").isIn([
      "plucking",
      "animal_strike",
      "extended_touch",
      "other",
    ]),
    body("severity").isIn(["low", "medium", "high"]),
    body("description").isString().notEmpty(),
    body("metadata").optional().isObject(),
    body("latitude").optional().isFloat(),
    body("longitude").optional().isFloat(),
  ],
  validate,
  ComplianceEventController.createComplianceEvent,
);

/**
 * @swagger
 * /api/compliance-events:
 *   get:
 *     summary: List all compliance events
 *     description: Retrieve all compliance events with pagination support.
 *     tags: [Compliance Events]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           default: created_at desc
 *           description: Format - "attribute asc|desc" (e.g. "created_at desc")
 *     responses:
 *       200:
 *         description: List of compliance events
 *       500:
 *         description: Server error
 */
complianceEventRouter.get("/", ComplianceEventController.getComplianceEvents);

/**
 * @swagger
 * /api/compliance-events/stats/{userId}:
 *   get:
 *     summary: Get compliance statistics for a user
 *     description: Retrieve aggregated compliance statistics for a specific user.
 *     tags: [Compliance Events]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Compliance statistics
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
complianceEventRouter.get(
  "/stats/:userId",
  [param("userId").isInt({ min: 1 })],
  validate,
  ComplianceEventController.getUserComplianceStats,
);

/**
 * @swagger
 * /api/compliance-events/{userId}:
 *   get:
 *     summary: Get compliance events for a user
 *     description: Retrieve compliance events for a specific user with pagination support.
 *     tags: [Compliance Events]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           default: created_at desc
 *     responses:
 *       200:
 *         description: List of user's compliance events
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
complianceEventRouter.get(
  "/:userId",
  [param("userId").isInt({ min: 1 })],
  validate,
  ComplianceEventController.getUserComplianceEvents,
);

export default complianceEventRouter;
