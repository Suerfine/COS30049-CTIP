import { Router } from "express";
import * as AnomalyEventController from "../controllers/AnomalyEventController";
import { body, param } from "express-validator";
import { validate } from "../middelware/Validate";
import { auth } from "../middelware/Auth";

const AnomalyEventRouter = Router();

/**
 * @swagger
 * /api/anomaly-events:
 *   post:
 *     summary: Create a new anomaly event
 *     description: Creates an anomaly event record from the AI inference server.
 *     tags: [Anomaly Events]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - event_type
 *             properties:
 *               user_id:
 *                 type: integer
 *                 description: User ID associated with the event
 *                 example: 260001
 *               event_type:
 *                 type: string
 *                 description: Type of anomaly event detected
 *                 enum:
 *                   - touching_plant
 *                   - touching_animal
 *                   - plucking_plants
 *                   - hitting_animal
 *                   - extended_plant_touch
 *                   - extended_animal_touch
 *                   - forest_fire
 *                   - flooding
 *                   - loud_noise
 *                   - trespassing
 *                 example: plucking_plants
 *               metadata:
 *                 type: object
 *                 description: Optional metadata object
 *               latitude:
 *                 type: number
 *                 description: Latitude coordinate
 *                 example: 1.5533
 *               longitude:
 *                 type: number
 *                 description: Longitude coordinate
 *                 example: 110.3592
 *               location:
 *                 type: string
 *                 description: Human-readable location name or address
 *                 example: Bako National Park, Sarawak
 *     responses:
 *       201:
 *         description: Anomaly event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 user_id:
 *                   type: integer
 *                 event_type:
 *                   type: string
 *                 metadata:
 *                   type: object
 *                 latitude:
 *                   type: number
 *                 longitude:
 *                   type: number
 *                 location:
 *                   type: string
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 */
AnomalyEventRouter.post(
  "/",
  auth,
  [
    body("user_id").isInt({ min: 1 }),

    body("event_type").isIn([
      "touching_plant",
      "touching_animal",
      "plucking_plants",
      "hitting_animal",
      "extended_plant_touch",
      "extended_animal_touch",
      "forest_fire",
      "flooding",
      "loud_noise",
      "trespassing",
    ]),

    body("metadata").optional(),

    body("latitude").optional().isFloat(),

    body("longitude").optional().isFloat(),

    body("location").optional().isString(),
  ],
  validate,
  AnomalyEventController.createAnomalyEvent,
);

/**
 * @swagger
 * /api/anomaly-events:
 *   get:
 *     summary: List all anomaly events
 *     description: Retrieve all anomaly events with pagination support.
 *     tags: [Anomaly Events]
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
 *         description: List of anomaly events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       user_id:
 *                         type: integer
 *                       event_type:
 *                         type: string
 *                       metadata:
 *                         type: object
 *                       latitude:
 *                         type: number
 *                       longitude:
 *                         type: number
 *                       location:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                 page:
 *                   type: integer
 *                 size:
 *                   type: integer
 *                 totalElements:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 */
AnomalyEventRouter.get("/", AnomalyEventController.getAnomalyEvents);

/**
 * @swagger
 * /api/anomaly-events/stats/{userId}:
 *   get:
 *     summary: Get anomaly statistics for a user
 *     description: Retrieve aggregated anomaly statistics for a specific user.
 *     tags: [Anomaly Events]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User anomaly statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalEvents:
 *                   type: integer
 *                 eventsByType:
 *                   type: object
 */
AnomalyEventRouter.get(
  "/stats/:userId",
  [param("userId").isInt({ min: 1 })],
  validate,
  AnomalyEventController.getUserAnomalyStats,
);

/**
 * @swagger
 * /api/anomaly-events/map:
 *   get:
 *     summary: Get anomaly map events
 *     description: Retrieve anomaly events formatted for map visualization.
 *     tags: [Anomaly Events]
 *     responses:
 *       200:
 *         description: Map anomaly events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   event_type:
 *                     type: string
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   location:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 */
AnomalyEventRouter.get(
  "/map",
  AnomalyEventController.getAnomalyMapEvents,
);

/**
 * @swagger
 * /api/anomaly-events/{eventId}/resolve:
 *   patch:
 *     summary: Resolve an anomaly event
 *     description: Mark an anomaly event as resolved.
 *     tags: [Anomaly Events]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Anomaly event resolved successfully
 */
AnomalyEventRouter.patch(
  "/:eventId/resolve",
  auth,
  [param("eventId").isInt({ min: 1 })],
  validate,
  AnomalyEventController.resolveAnomalyEvent,
);

/**
 * @swagger
 * /api/anomaly-events/{eventId}/resolve:
 *   post:
 *     summary: Resolve an anomaly event
 *     description: Mark an anomaly event as resolved.
 *     tags: [Anomaly Events]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Anomaly event resolved successfully
 */
AnomalyEventRouter.post(
  "/:eventId/resolve",
  auth,
  [param("eventId").isInt({ min: 1 })],
  validate,
  AnomalyEventController.resolveAnomalyEvent,
);

/**
 * @swagger
 * /api/anomaly-events/{userId}:
 *   get:
 *     summary: Get anomaly events for a user
 *     description: Retrieve anomaly events for a specific user with pagination support.
 *     tags: [Anomaly Events]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of events per page
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           default: created_at desc
 *         description: Order by field and direction (e.g. "created_at desc")
 *     responses:
 *       200:
 *         description: List of user's anomaly events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       user_id:
 *                         type: integer
 *                       event_type:
 *                         type: string
 *                       metadata:
 *                         type: object
 *                       latitude:
 *                         type: number
 *                       longitude:
 *                         type: number
 *                       location:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                 page:
 *                   type: integer
 *                 size:
 *                   type: integer
 *                 totalElements:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 */
AnomalyEventRouter.get(
  "/:userId",
  [param("userId").isInt({ min: 1 })],
  validate,
  AnomalyEventController.getUserAnomalyEvents,
);

export default AnomalyEventRouter;