import { Router } from "express";
import * as ChatbotController from "../controllers/ChatbotController";
import { auth } from "../middelware/Auth";
import { validate } from "../middelware/Validate";
import { body } from "express-validator";

const ChatbotRouter = Router();

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
