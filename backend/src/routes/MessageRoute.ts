import { Router } from "express";
import * as MessageController from "../controllers/MessageController";
import { auth } from "../middelware/Auth";
import { validate } from "../middelware/Validate";
import { body } from "express-validator";

const messageRouter = Router({ mergeParams: true });

/**
 * @swagger
 * /api/discussion/{discussion_id}/messages:
 *   post:
 *     summary: Create a new message
 *     description: Creates a new message in a discussion thread.
 *     tags: [Messages]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: discussion_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the discussion.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: "This is my message response"
 *     responses:
 *       201:
 *         description: Message created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       400:
 *         description: Invalid request data or IDs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
messageRouter.post(
  "/discussion/:discussion_id/messages",
  auth,
  [body("content").isString().notEmpty()],
  validate,
  MessageController.createMessage,
);

/**
 * @swagger
 * /api/discussion/{discussion_id}/messages:
 *   get:
 *     summary: Get all messages in a discussion
 *     description: Returns a paginated list of messages for a specific discussion with optional filtering and sorting.
 *     tags: [Messages]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: discussion_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the discussion.
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *         description: Page number to retrieve.
 *       - in: query
 *         name: size
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 10
 *         description: Number of records per page.
 *       - in: query
 *         name: orderBy
 *         required: false
 *         schema:
 *           type: string
 *           example: created_at desc
 *         description: Sort expression format "attribute asc|desc".
 *       - in: query
 *         name: filter
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter expression parsed by backend pagination utility.
 *       - in: query
 *         name: isDeleted
 *         required: false
 *         schema:
 *           type: boolean
 *           default: false
 *         description: When true, include soft-deleted messages in the result set.
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 size:
 *                   type: integer
 *                   example: 10
 *                 totalElements:
 *                   type: integer
 *                   example: 25
 *                 totalPages:
 *                   type: integer
 *                   example: 3
 *                 _links:
 *                   type: object
 *                   additionalProperties:
 *                     type: string
 *                     nullable: true
 *       400:
 *         description: Invalid course or discussion ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
messageRouter.get(
  "/discussion/:discussion_id/messages",
  auth,
  MessageController.getAllMessages,
);

/**
 * @swagger
 * /api/message/{message_id}:
 *   get:
 *     summary: Get message by ID
 *     description: Retrieves a specific message from a discussion.
 *     tags: [Messages]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: message_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the message to retrieve.
 *     responses:
 *       200:
 *         description: Message retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       400:
 *         description: Invalid course, discussion, or message ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Message not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
messageRouter.get(
  "messages/:message_id",
  auth,
  MessageController.getMessageById,
);

/**
 * @swagger
 * /api/message/{message_id}:
 *   put:
 *     summary: Update message
 *     description: Updates an existing message in a discussion.
 *     tags: [Messages]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: message_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the message to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 example: "Updated message content"
 *     responses:
 *       200:
 *         description: Message updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       400:
 *         description: Invalid course, discussion, or message ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Message not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
messageRouter.put(
  "messages/:message_id",
  auth,
  [body("content").optional().isString().notEmpty()],
  validate,
  MessageController.updateMessage,
);

/**
 * @swagger
 * /api/message/{message_id}:
 *   delete:
 *     summary: Delete message
 *     description: Soft deletes a message from a discussion.
 *     tags: [Messages]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: message_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the message to delete.
 *     responses:
 *       200:
 *         description: Message deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Message deleted successfully"
 *       400:
 *         description: Invalid course, discussion, or message ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Message not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
messageRouter.delete(
  "messages/:message_id",
  auth,
  MessageController.deleteMessage,
);

export default messageRouter;
