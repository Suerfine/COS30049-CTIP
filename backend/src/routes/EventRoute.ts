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
 *     description: Creates a new event (normal task or workshop)
 *     tags:
 *       - Events
 *     security:
 *       - OAuth2: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - event_start_at
 *             properties:
 *               title:
 *                 type: string
 *                 example: First Aid Workshop
 *               description:
 *                 type: string
 *                 example: Mandatory training session
 *               type:
 *                 type: string
 *                 enum: [normal, workshop]
 *                 example: normal
 *               event_start_at:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-05-20T09:00:00Z
 *               event_end_at:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-05-20T11:00:00Z
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 type:
 *                   type: string
 *                 event_start_at:
 *                   type: string
 *                 event_end_at:
 *                   type: string
 *                 status:
 *                   type: string
 */
eventRouter.post(
  "/",
  auth,
  [
    body("title").isString().notEmpty(),
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
 *     description: Returns all events for authenticated user
 *     tags:
 *       - Events
 *     security:
 *       - OAuth2: []
 *     responses:
 *       200:
 *         description: List of events retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   type:
 *                     type: string
 *                   status:
 *                     type: string
 *                   event_start_at:
 *                     type: string
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 type:
 *                   type: string
 *                 status:
 *                   type: string
 *       404:
 *         description: Event not found
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
 *         application/json:
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
    body("description").optional().isString(),
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
 *     description: Change event status (pending/completed/etc)
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
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
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
 *       404:
 *         description: Event not found
 */
eventRouter.delete("/:id", auth, EventController.deleteEvent);

export default eventRouter;
