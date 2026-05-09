import { Request, Response, NextFunction } from "express";
import {
  CreateDiscussionRequest,
  DiscussionResponse,
  UpdateDiscussionRequest,
  DiscussionPaginateRequest,
} from "../types/Discussion";
import { Discussion, User } from "../models";
import { formatPaginateResponse, paginateModel } from "../utils/paginate";
import { PaginateRequestParams, PaginateResponse } from "../types/common";
import { Op } from "sequelize";
import { sendNotification } from "../utils/sendNotification";
import sequelize from "../config/Database";

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const createDiscussion = async (
  req: Request<{}, any, CreateDiscussionRequest>,
  res: Response<(DiscussionResponse & { creator?: any }) | { message: string }>,
  next: NextFunction,
) => {
  const transaction = await sequelize.transaction();
  try {
    const course_id = Number((req.params as { course_id?: string }).course_id);
    const { title, is_public = false } = req.body;

    if (Number.isNaN(course_id)) {
      throw new HttpError(400, "Invalid course id");
    }

    // Cehcking if the user is logged in just to deal with type error
    if (!req.user) {
      throw new HttpError(401, "Unauthorized");
    }

    // Create the discussion
    const discussion = await Discussion.create({
      course_id,
      user_id: req.user.id,
      title,
      is_public,
    });

    //Return the created discussion
    res.status(201).json({
      id: discussion.id,
      course_id: discussion.course_id,
      creator_user_id: discussion.user_id,
      creator: { username: req.user.username, role: req.user.role },
      title: discussion.title,
      is_public: discussion.is_public,
      created_at: discussion.created_at,
      updated_at: discussion.updated_at,
    });

    // Sending notification to those whom it may concern about the new discussion channel created
    if (discussion.is_public) {
      // If the discussion is public, notify all Park Guides in the course about the new discussion channel
      const ParkGuidePeersIds = await User.findAll({
        where: {
          role: "park_guide",
          "$enrollments.course_id$": course_id,
        },
        include: [
          {
            model: require("../models/Enrollment").default,
            as: "enrollments",
            attributes: [],
          },
        ],
        attributes: ["id"],
      }).then((users) => users.map((user) => user.id));
      await Promise.all(
        ParkGuidePeersIds.map((userId) => {
          return sendNotification(
            "single",
            "New Public Discussion Channel Created",
            `A new public discussion channel "${discussion.title}" has been created in the course you are enrolled in. Check it out now!`,
            transaction,
            userId,
            false,
          );
        }),
      );
    }
    await sendNotification(
      "admin",
      "New Discussion Channel Created",
      `A new discussion channel "${discussion.title}" has been created in course ID ${course_id}. Please review it as soon as possible.`,
      transaction,
      undefined,
      false,
    );
    transaction.commit();
  } catch (err) {
    transaction.rollback();
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
  }
};

export const getAllDiscussions = async (
  req: Request,
  res: Response<PaginateResponse<DiscussionResponse> | { message: string }>,
  next: NextFunction,
) => {
  try {
    const course_id = Number((req.params as { course_id?: string }).course_id);
    if (Number.isNaN(course_id)) {
      throw new HttpError(400, "Invalid course id");
    }

    const userAccessFilter: any[] = [{ is_public: true }];

    if (req.user) {
      if (req.user.role === "admin") {
        // Admins can see EVERYTHING in this course
        userAccessFilter.push({ is_public: false });
      } else if (req.user.role === "park_guide") {
        // Park Guide Access:
        userAccessFilter.push({
          [Op.or]: [
            { user_id: req.user.id }, // Their own posts
            { "$user.role$": "admin" }, // Posts created by Admins
          ],
        });
      } else {
        // Standard User Access:
        userAccessFilter.push({ user_id: req.user.id });
      }
    }

    const discussions = await paginateModel(Discussion, req.query, {
      paranoid: !req.query.isDeleted,
      where: {
        course_id,
        [Op.or]: userAccessFilter,
      },
      include: [
        {
          model: require("../models/User").default,
          as: "user",
          attributes: ["username", "role"],
        },
      ],
    });
    const baseUrl = `${req.protocol}://${req.get("host")}${req.baseUrl}${req.path}`;
    const formattedResponse = formatPaginateResponse(
      discussions.data.map((discussion: any) => ({
        id: discussion.id,
        course_id: discussion.course_id,
        creator_user_id: discussion.user_id,
        creator: discussion.user
          ? {
              username: discussion.user.username,
              role: discussion.user.role,
            }
          : null,
        title: discussion.title,
        is_public: discussion.is_public,
        created_at: discussion.created_at,
        updated_at: discussion.updated_at,
      })),
      req.query,
      true,
      {
        page: discussions.page,
        size: discussions.size,
        totalElements: discussions.totalElements,
        totalPages: discussions.totalPages,
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

export const getDiscussionById = async (
  req: Request,
  res: Response<(DiscussionResponse & { creator?: any }) | { message: string }>,
  next: NextFunction,
) => {
  try {
    const params = req.params as {
      course_id?: string;
      discussion_id?: string;
    };
    const course_id = Number(params.course_id);
    const discussion_id = Number(params.discussion_id);

    if (Number.isNaN(course_id) || Number.isNaN(discussion_id)) {
      throw new HttpError(400, "Invalid course or discussion id");
    }

    const discussion = await Discussion.findOne({
      where: { id: discussion_id, course_id },
      include: [
        {
          model: require("../models/User").default,
          as: "user",
          attributes: ["username", "role"],
        },
      ],
    });

    if (!discussion) {
      throw new HttpError(404, "Discussion not found");
    }

    res.status(200).json({
      id: discussion.id,
      course_id: discussion.course_id,
      creator_user_id: discussion.user_id,
      creator: (discussion as any).user
        ? {
            username: (discussion as any).user.username,
            role: (discussion as any).user.role,
          }
        : null,
      title: discussion.title,
      is_public: discussion.is_public,
      created_at: discussion.created_at,
      updated_at: discussion.updated_at,
    });
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
  }
};

export const updateDiscussion = async (
  req: Request<{}, any, UpdateDiscussionRequest>,
  res: Response<DiscussionResponse | { message: string }>,
  next: NextFunction,
) => {
  try {
    const params = req.params as {
      course_id?: string;
      discussion_id?: string;
    };
    const course_id = Number(params.course_id);
    const discussion_id = Number(params.discussion_id);
    const { title, is_public } = req.body;

    if (Number.isNaN(course_id) || Number.isNaN(discussion_id)) {
      throw new HttpError(400, "Invalid course or discussion id");
    }

    //Check if the discussion exists or not
    const discussion = await Discussion.findOne({
      where: { id: discussion_id, course_id },
    });
    if (!discussion) {
      throw new HttpError(404, "Discussion not found");
    }

    // Update the discussion
    if (title !== undefined && title !== discussion.title) {
      discussion.title = title;
    }
    if (is_public !== undefined && is_public !== discussion.is_public) {
      discussion.is_public = is_public;
    }
    await discussion.save();

    // Return the updated discussion
    res.status(200).json({
      id: discussion.id,
      course_id: discussion.course_id,
      creator_user_id: discussion.user_id,
      title: discussion.title,
      is_public: discussion.is_public,
      created_at: discussion.created_at,
      updated_at: discussion.updated_at,
    });
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
  }
};

export const deleteDiscussion = async (
  req: Request,
  res: Response<{ message: string }>,
  next: NextFunction,
) => {
  try {
    const params = req.params as {
      course_id?: string;
      discussion_id?: string;
    };
    const course_id = Number(params.course_id);
    const discussion_id = Number(params.discussion_id);

    if (Number.isNaN(course_id) || Number.isNaN(discussion_id)) {
      throw new HttpError(400, "Invalid course or discussion id");
    }

    // Check if the discussion exists or not
    const discussion = await Discussion.findOne({
      where: { id: discussion_id, course_id },
    });

    if (!discussion) {
      throw new HttpError(404, "Discussion not found");
    }

    // Only the creator of the discussion or admin can delete the discussion
    if (
      !req.user ||
      (req.user.id !== discussion.user_id && req.user.role !== "admin")
    ) {
      throw new HttpError(403, "Forbidden");
    }

    // Soft delete the discussion
    await discussion.destroy();

    res.status(200).json({ message: "Discussion deleted successfully" });
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
  }
};
