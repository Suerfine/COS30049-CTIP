import { Request, Response, NextFunction } from "express";
import { ChatSession } from "@google/generative-ai";
import { getChatSession } from "../services/chatbot";

export const sendMessage = async (
  req: Request<{}, {}, { message: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Check if userId is provided
    const userId = req.user!.id;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    // Create or retrieve the chat session for the user and send the message
    const chat = getChatSession(userId);
    const result = await chat.sendMessage(req.body.message);
    return res.status(200).json({ data: result.response.text() });
  } catch (err) {
    next(err);
  }
};
