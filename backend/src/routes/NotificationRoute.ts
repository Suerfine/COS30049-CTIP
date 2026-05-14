import { Router } from "express";
import * as NotificationController from "../controllers/NotificationController";
import { auth } from "../middelware/Auth";
import { body } from "express-validator";
import { validate } from "../middelware/Validate";

const NotificationRouter = Router();

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: Create notification
 *     tags: [Notifications]
 *     security:
 *       - OAuth2: ["all"]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, message, target_user_ids]
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               url:
 *                 type: string
 *               for_all_park_guides:
 *                 type: boolean
 *               target_user_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       201:
 *         description: Notification created successfully
 */
NotificationRouter.post(
  "/",
  auth,
  // [
  //   body("title").isString().notEmpty(),
  //   body("message").isString().notEmpty(),
  //   body("url").optional().isString(),
  //   body("for_all_park_guides").optional().isBoolean(),
  //   body("target_user_ids")
  //     .isArray({ min: 1 })
  //     .withMessage("target_user_ids must be a non-empty array of user IDs"),
  //   body("target_user_ids.*")
  //     .isInt()
  //     .withMessage("Each user ID in target_user_ids must be an integer"),
  // ],
  // validate,
  NotificationController.createNotification,
);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get all notifications
 *     tags: [Notifications]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 10
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           example: created_at desc
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 */
NotificationRouter.get("/", auth, NotificationController.getAllNotifications);

/**
 * @swagger
 * /api/notifications/me:
 *   get:
 *     summary: Get my notifications
 *     tags: [Notifications]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 10
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           example: created_at desc
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *       - in: query
 *         name: includeDismissed
 *         schema:
 *           type: boolean
 *           example: false
 *         description: Include dismissed notifications when set to true
 *     responses:
 *       200:
 *         description: My notifications retrieved successfully
 */
NotificationRouter.get(
  "/me",
  auth,
  NotificationController.getAllMyNotifications,
);

NotificationRouter.get(
  "/preferences",
  auth,
  NotificationController.getMyNotificationPreferences,
);

NotificationRouter.put(
  "/preferences",
  auth,
  NotificationController.updateMyNotificationPreferences,
);

/**
 * @swagger
 * /api/notifications/{id}:
 *   put:
 *     summary: Update notification
 *     tags: [Notifications]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               url:
 *                 type: string
 *               dismissed_at:
 *                 type: string
 *     responses:
 *       200:
 *         description: Notification updated successfully
 */
NotificationRouter.put("/:id", auth, NotificationController.updateNotification);

/**
 * @swagger
 * /api/notifications/{id}/dismiss:
 *   put:
 *     summary: Dismiss a notification
 *     tags: [Notifications]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               dismissed_at:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Notification dismissed successfully
 */
NotificationRouter.put(
  "/:id/dismiss",
  auth,
  NotificationController.dismissNotification,
);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete notification
 *     tags: [Notifications]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 */
NotificationRouter.delete(
  "/:id",
  auth,
  NotificationController.deleteNotification,
);

export default NotificationRouter;
