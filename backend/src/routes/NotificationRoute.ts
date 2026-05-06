import { Router } from "express";
import * as NotificationController from "../controllers/NotificationController";
import router from ".";
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
router.post(
  "/",
  auth,
  [
    body("title").isString().notEmpty(),
    body("message").isString().notEmpty(),
    body("url").optional().isString(),
    body("for_all_park_guides").optional().isBoolean(),
    body("target_user_ids")
      .isArray({ min: 1 })
      .withMessage("target_user_ids must be a non-empty array of user IDs"),
    body("target_user_ids.*")
      .isInt()
      .withMessage("Each user ID in target_user_ids must be an integer"),
  ],
  validate,
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
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 */
router.get("/", auth, NotificationController.getAllNotifications);

/**
 * @swagger
 * /api/notifications/me:
 *   get:
 *     summary: Get my notifications
 *     tags: [Notifications]
 *     security:
 *       - OAuth2: ["all"]
 *     responses:
 *       200:
 *         description: My notifications retrieved successfully
 */
router.get("/me", auth, NotificationController.getAllMyNotifications);

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
 *     responses:
 *       200:
 *         description: Notification updated successfully
 */
router.put("/:id", auth, NotificationController.updateNotification);

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
router.delete("/:id", auth, NotificationController.deleteNotification);

export default NotificationRouter;
