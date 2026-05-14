import { Request, Response, NextFunction } from "express";
import {
  CreateMessageRequest,
  MessageResponse,
  UpdateMessageRequest,
  MessagePaginateRequest,
} from "../types/Message";
import { Message, User, Discussion } from "../models";
import { formatPaginateResponse, paginateModel } from "../utils/paginate";
import { PaginateResponse } from "../types/common";
import sequelize from "../config/Database";
import { sendNotification } from "../utils/sendNotification";
import { NotificationCategory } from "../enum/NotificationCategory";

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const createMessage = async (
  req: Request<{ discussion_id: string }, any, CreateMessageRequest>,
  res: Response<(MessageResponse & { creator?: any } ) | { message: string }>,
  next: NextFunction,
) => {
  const transaction = await sequelize.transaction();
  try {
    const discussion_id = Number(req.params.discussion_id);
    const { content } = req.body;

    if (Number.isNaN(discussion_id)) {
      throw new HttpError(400, "Invalid discussion id");
    }

    if (!req.user) {
      throw new HttpError(401, "Unauthorized");
    }

    // Create the message
    const message = await Message.create(
      {
        discussion_id,
        user_id: req.user.id,
        content,
      },
      { transaction },
    );

    const discussion = await Discussion.findByPk(discussion_id, {
      attributes: ['id', 'course_id', 'title'],
      transaction
    });

    const discussionTopic = discussion?.title || `ID: ${discussion_id}`;
    const discussionUrl = discussion?.course_id
      ? `/courses/${discussion.course_id}/discussion/${discussion_id}`
      : "/discussions";

    // Sending notificationts to whoevers bane was tagged in the message content
    const taggedUsernames =
      content.match(/@(\w+)/g)?.map((tag) => tag.substring(1)) || [];
    //Check if any of the tags is @all, if so send notification to all users in the discussion
    if (taggedUsernames.includes("all")) {
      const usersInDiscussion = await User.findAll({
        include: {
          model: Message,
          where: { discussion_id },
        },
        attributes: ["id"],
      }).then((users) => users.map((user) => user.id));
      
      await Promise.all(
        usersInDiscussion.map((userId) =>
          sendNotification(
            "single",
            `New mention from @${req.user?.username}`,
            `@${req.user?.username} tagged you in "${discussionTopic}".`,
            transaction,
            userId,
            false,
            NotificationCategory.DISCUSSION,
            discussionUrl,
          ),
        ),
      );
    } else {
      for (const taggedUsername of taggedUsernames) {
        // Check if the tagged user exists
        const taggedUser = await User.findOne({
          where: { username: taggedUsername },
          attributes: ["id"],
        });
        if (taggedUser) {
          await sendNotification(
            "single",
            `New mention from @${req.user?.username}`,
            `@${req.user?.username} tagged you in "${discussionTopic}".`,
            transaction,
            taggedUser.id,
            false,
            NotificationCategory.DISCUSSION,
            discussionUrl,
          );
        }
      }
    }

    await transaction.commit();
    
    // Return the created message
    res.status(201).json({
      id: message.id,
      discussion_id: message.discussion_id,
      creator_user_id: message.user_id,
      content: message.content,
      created_at: message.created_at,
      updated_at: message.updated_at,
      creator: {
        id: req.user.id,
        username: req.user.username,
      },
    });
  } catch (err) {
    transaction.rollback();
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
  }
};

export const getAllMessages = async (
  req: Request,
  res: Response<PaginateResponse<MessageResponse> | { message: string }>,
  next: NextFunction,
) => {
  try {
    const discussion_id = Number(
      (req.params as { discussion_id?: string }).discussion_id,
    );

    if (Number.isNaN(discussion_id)) {
      throw new HttpError(400, "Invalid discussion id");
    }

    const messages = await paginateModel(Message, req.query, {
      paranoid: true,
      where: { discussion_id },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username"],
        }
      ]
    });

    const baseUrl = `${req.protocol}://${req.get("host")}${req.baseUrl}${req.path}`;
    const formattedResponse = formatPaginateResponse(
      messages.data.map((message:any) => ({
        id: message.id,
        discussion_id: message.discussion_id,
        creator_user_id: message.user_id,
        content: message.content,
        created_at: message.created_at,
        updated_at: message.updated_at,
        creator: message.user,
      })),
      req.query,
      true,
      {
        page: messages.page,
        size: messages.size,
        totalElements: messages.totalElements,
        totalPages: messages.totalPages,
        baseUrl,
      },
    );

    return res.status(200).json(formattedResponse);
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
  }
};

export const getMessageById = async (
  req: Request<{ message_id: string }>,
  res: Response<(MessageResponse & { creator?: any } ) | { message: string }>,
  next: NextFunction,
) => {
  try {
    const message_id = Number(req.params.message_id);

    if (Number.isNaN(message_id)) {
      throw new HttpError(400, "Invalid message id");
    }

    const message = await Message.findByPk(message_id, {
      include: {
        model: User,
        as: "user",
        attributes: ["id", "username"],
      }
    });

    if (!message) {
      throw new HttpError(404, "Message not found");
    }

    const messageData = message as any;

    res.status(200).json({
      id: message.id,
      discussion_id: message.discussion_id,
      creator_user_id: message.user_id,
      content: message.content,
      created_at: message.created_at,
      updated_at: message.updated_at,
      creator: messageData.user ? {
        id: messageData.user.id,
        username: messageData.user.username,
      } : null,
    });
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
  }
};

export const updateMessage = async (
  req: Request<{ message_id: string }, any, UpdateMessageRequest>,
  res: Response<MessageResponse | { message: string }>,
  next: NextFunction,
) => {
  try {
    const message_id = Number(req.params.message_id);
    const { content } = req.body;

    if (Number.isNaN(message_id)) {
      throw new HttpError(400, "Invalid message id");
    }

    // Check if the message exists or not
    const message = await Message.findByPk(message_id);
    if (!message) {
      throw new HttpError(404, "Message not found");
    }

    // Update the message
    if (content !== undefined && content !== message.content) {
      message.content = content;
    }
    await message.save();

    // Return the updated message
    res.status(200).json({
      id: message.id,
      discussion_id: message.discussion_id,
      creator_user_id: message.user_id,
      content: message.content,
      created_at: message.created_at,
      updated_at: message.updated_at,
    });
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
  }
};

export const deleteMessage = async (
  req: Request<{ message_id: string }>,
  res: Response<{ message: string }>,
  next: NextFunction,
) => {
  try {
    const message_id = Number(req.params.message_id);

    if (Number.isNaN(message_id)) {
      throw new HttpError(400, "Invalid message id");
    }

    // Check if the message exists or not
    const message = await Message.findByPk(message_id);
    
    if (!message) {
      // Debug: List all messages in DB
      const allMessages = await Message.findAll({ attributes: ["id", "discussion_id", "user_id"] });
      console.log("All messages in database:", allMessages.map(m => ({ id: m.id, discussion_id: m.discussion_id, user_id: m.user_id })));
      throw new HttpError(404, "Message not found");
    }

    // Soft delete the message
    await message.destroy();

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
  }
};
