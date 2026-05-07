import { Router } from "express";
import * as EventController from "../controllers/EventController";
import { auth } from "../middelware/Auth";
import { validate } from "../middelware/Validate";
import { body } from "express-validator";

const eventRouter = Router({ mergeParams: true });

/**
 * @swagger
 * /api/events:
 * post:
 * summary: Create a new event or task
 * description: Creates a new event record (normal task or workshop).
 * tags: [Events]
 * security:
 * - OAuth2: ["all"]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - title
 * - description
 * - event_start_at
 * properties:
 * title:
 * type: string
 * example: "First Aid Workshop"
 * description:
 * type: string
 * example: "Mandatory training for SIGMAmed certification."
 * type:
 * type: string
 * enum: [normal, workshop]
 * default: normal
 * event_start_at:
 * type: string
 * format: date-time
 * example: "2026-05-20T09:00:00Z"
 * event_end_at:
 * type: string
 * format: date-time
 * example: "2026-05-20T11:00:00Z"
 * responses:
 * 201:
 * description: Event created successfully
 * 400:
 * description: Invalid request data
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

/**
 * @swagger
 * /api/events:
 * get:
 * summary: Get all events
 * description: Returns a list of events belonging to the authenticated user.
 * tags: [Events]
 * security:
 * - OAuth2: ["all"]
 * responses:
 * 200:
 * description: Events retrieved successfully
 */
eventRouter.get("/", auth, EventController.getAllEvents);

/**
 * @swagger
 * /api/events/{id}:
 * get:
 * summary: Get event by ID
 * tags: [Events]
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * responses:
 * 200:
 * description: Event details retrieved
 * 404:
 * description: Event not found
 */
eventRouter.get("/:id", auth, EventController.getEventById);

/**
 * @swagger
 * /api/events/{id}:
 * put:
 * summary: Update event details
 * tags: [Events]
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * requestBody:
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * title:
 * type: string
 * description:
 * type: string
 * responses:
 * 200:
 * description: Event updated
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

/**
 * @swagger
 * /api/events/{id}/status:
 * patch:
 * summary: Toggle event status (Interswitch)
 * description: Automatically toggles between pending and completed.
 * tags: [Events]
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * responses:
 * 200:
 * description: Status updated successfully
 */
eventRouter.patch("/:id/status", auth, EventController.updateEventStatus);

/**
 * @swagger
 * /api/events/{id}:
 * delete:
 * summary: Delete an event
 * tags: [Events]
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * responses:
 * 200:
 * description: Event deleted
 */
eventRouter.delete("/:id", auth, EventController.deleteEvent);

export default eventRouter;