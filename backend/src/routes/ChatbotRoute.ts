import { Router } from "express";
import * as ChatbotController from "../controllers/ChatbotController";
import { auth } from "../middelware/Auth";
import { validate } from "../middelware/Validate";
import { body } from "express-validator";

const ChatbotRouter = Router();

/**
 * @swagger
 * /api/chatbot/create-session:
 *   post:
 *     summary: Create a new chatbot session with initial context
 *     description: Initialize a new chat session with the AI chatbot, providing a page ID and initial message. The chatbot will use course information as context.
 *     tags: [Chatbot]
 *     security:
 *       - OAuth2: ["all"]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pageId
 *               - firstMessage
 *             properties:
 *               pageId:
 *                 type: integer
 *                 description: The ID of the page the user is currently viewing
 *                 example: 1
 *               firstMessage:
 *                 type: string
 *                 description: The initial message to send to the chatbot
 *                 example: "Can you help me with this course content?"
 *     responses:
 *       200:
 *         description: Chat session created and first message processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: string
 *                   description: The chatbot's response text
 *                   example: "I'd be happy to help! Here's the course information..."
 *       400:
 *         description: Bad request - missing or invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "userId is required"
 *       401:
 *         description: Unauthorized - authentication token missing or invalid
 */
ChatbotRouter.post(
  "/create-session",
  auth,
  [
    body("pageId").isInt().notEmpty(),
    body("firstMessage").isString().notEmpty(),
  ],
  validate,
  ChatbotController.createSession,
);

/**
 * @swagger
 * /api/chatbot:
 *   post:
 *     summary: Send a message to the chatbot
 *     description: Send a message to the AI chatbot and receive a response. Maintains a persistent chat session per user.
 *     tags: [Chatbot]
 *     security:
 *       - OAuth2: ["all"]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: The message to send to the chatbot
 *                 example: "What is this course about?"
 *     responses:
 *       200:
 *         description: Chatbot response received successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: string
 *                   description: The chatbot's response text
 *                   example: "This course covers advanced topics in web development and AI integration..."
 *       400:
 *         description: Bad request - missing or invalid message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "userId is required"
 *       401:
 *         description: Unauthorized - authentication token missing or invalid
 */
ChatbotRouter.post(
  "/",
  auth,
  [body("message").isString().notEmpty()],
  validate,
  ChatbotController.sendMessage,
);
export default ChatbotRouter;
