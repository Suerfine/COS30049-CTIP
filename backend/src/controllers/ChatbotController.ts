import { Request, Response, NextFunction } from "express";
import { getChatSession, createChatSession } from "../services/chatbot";
import { Course, Module, Page } from "../models";
import { getCourseInformationString } from "../utils/getCourseInformation";

export const createSession = async (
  req: Request<{}, {}, { pageId: number; firstMessage: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Check if userId is logged in
    const userId = req.user!.id;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    // Retrieve the course that the page belongs to and get course information as context
    const { pageId, firstMessage } = req.body;

    // Script to look for the course that contains the page with the given id
    const page = await Page.findByPk(pageId, {
      include: [
        {
          model: Module,
          as: "module",
          include: [
            {
              model: Course,
              as: "course",
            },
          ],
        },
      ],
    });

    if (!page) {
      return res.status(404).json({ error: "Page not found" });
    }

    const course = (page as any)?.module?.course;
    if (!course) {
      return res
        .status(404)
        .json({ error: "Course not found for the provided page" });
    }

    let context =
      (await getCourseInformationString(course.id)) +
      "The user is currently on page " +
      pageId +
      ". ";
    const session = createChatSession(userId, context);

    // Create or retrieve the chat session for the user and send the message
    const result = await session.sendMessage(firstMessage);
    return res.status(200).json({ data: result.response.text() });
  } catch (err) {
    next(err);
  }
};

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
    const chat = getChatSession(userId) ?? createChatSession(userId);
    const result = await chat.sendMessage(req.body.message);
    return res.status(200).json({ data: result.response.text() });
  } catch (err) {
    next(err);
  }
};
