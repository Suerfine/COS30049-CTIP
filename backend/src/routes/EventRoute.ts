import { Router } from "express";
import * as EventController from "../controllers/EventController";
import { auth } from "../middelware/Auth";
import { validate } from "../middelware/Validate";
import { body } from "express-validator";

const eventRouter = Router();

/*===============================
=         CREATE EVENT          =
===============================*/

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create a new event or task
 *     tags:
 *       - Events
 *     security:
 *       - OAuth2: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - event_start_at
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               event_start_at:
 *                 type: string
 *                 format: date-time
 *               event_end_at:
 *                 type: string
 *                 format: date-time
 *               type:
 *                 type: string
 *                 enum: [normal, workshop]
 *     responses:
 *       201:
 *         description: Event created successfully
 */
eventRouter.post(
  "/",
  auth,
  [
    body("title").isString().notEmpty(),
    body("description").isString().notEmpty(),
    body("event_start_at").isISO8601(),
    body("type").optional().isIn(["normal", "workshop"]),
  ],
  validate,
  EventController.createEvent,
);

/*===============================
=        GET ALL EVENTS         =
===============================*/

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all events
 *     tags:
 *       - Events
 *     security:
 *       - OAuth2: []
 *     responses:
 *       200:
 *         description: List of events retrieved
 */
eventRouter.get("/", auth, EventController.getAllEvents);

/*===============================
=        GET EVENT BY ID        =
===============================*/

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get event by ID
 *     tags:
 *       - Events
 *     security:
 *       - OAuth2: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event found
 */
eventRouter.get("/:id", auth, EventController.getEventById);

/*===============================
=        UPDATE EVENT           =
===============================*/

/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     summary: Update event details
 *     tags:
 *       - Events
 *     security:
 *       - OAuth2: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Event updated successfully
 */
eventRouter.put(
  "/:id",
  auth,
  [
    body("title").optional().isString().notEmpty(),
    body("description").optional().isString().notEmpty(),
  ],
  validate,
  EventController.updateEvent,
);

/*===============================
=     UPDATE EVENT STATUS       =
===============================*/

/**
 * @swagger
 * /api/events/{id}/status:
 *   patch:
 *     summary: Update event status
 *     tags:
 *       - Events
 *     security:
 *       - OAuth2: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: completed
 *     responses:
 *       200:
 *         description: Status updated successfully
 */
eventRouter.patch("/:id/status", auth, EventController.updateEventStatus);

/*===============================
=        DELETE EVENT           =
===============================*/

/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     summary: Delete event
 *     tags:
 *       - Events
 *     security:
 *       - OAuth2: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Event deleted successfully
 */
eventRouter.delete("/:id", auth, EventController.deleteEvent);

export default eventRouter;
