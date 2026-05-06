import { Request, Response, NextFunction } from "express";
import {
  CreateNotificationRequest,
  NotificationResponse,
  UpdateNotificationRequest,
} from "../types/Notification";
import Notification from "../models/Notification";
import { parseBooleanField } from "../utils/parseRequest";
import { PaginateRequestParams, PaginateResponse } from "../types/common";
import { formatPaginateResponse, paginateModel } from "../utils/paginate";
import { format } from "node:path";
import { UserRoles } from "../enum/UserRoles";
import User from "../models/User";
import sequelize from "../config/Database";
import { where } from "sequelize";

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Route for admin to manually send notification to either a specific user / group
 * of users or all ParkGuides.
 */
export const createNotification = async (
  req: Request<any, any, CreateNotificationRequest>,
  res: Response<NotificationResponse | { message: string }>,
  next: NextFunction,
) => {
  const transaction = await sequelize.transaction();
  try {
    // Only admin can manually create notifications
    if (!req.user || req.user.role !== UserRoles.ADMIN) {
      throw new HttpError(403, "Forbidden");
    }

    // Setting up target_users array based on the request body.
    let targetUserIds: number[] = [];
    if (req.body.for_all_park_guides) {
      // If for_all_park_guides is true, we will send the notification to all ParkGuides.
      targetUserIds = await User.findAll({
        where: {
          role: UserRoles.PARK_GUIDE,
        },
        attributes: ["id"],
      }).then((users) => users.map((user) => user.id));
    } else {
      // Check if the array of target_user_ids is provided and valid ids
      if (
        !req.body.target_user_ids ||
        !Array.isArray(req.body.target_user_ids)
      ) {
        throw new HttpError(
          400,
          "target_user_ids must be provided as an array of user IDs",
        );
      }
      for (const userId of req.body.target_user_ids) {
        if (typeof userId !== "number") {
          throw new HttpError(
            400,
            "Each user ID in target_user_ids must be a number",
          );
        }
        if (!(await User.findByPk(userId))) {
          throw new HttpError(400, `User with ID ${userId} does not exist`);
        }
      }
      targetUserIds = req.body.target_user_ids;
    }

    // Create the notification
    for (const targetUserId of targetUserIds) {
      await Notification.create(
        {
          user_id: targetUserId,
          title: req.body.title,
          message: req.body.message,
          url: req.body.url || null,
        },
        { transaction },
      );
    }
    transaction.commit();

    return res
      .status(201)
      .json({ message: "Notification(s) created successfully" });
  } catch (err) {
    transaction.rollback();
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
    next(err);
  }
};

/**
 * Route for admin to retrieve all notifications with pagination, filtering and
 * sorting options. This is for admin to see if which ParkGuide hasnt seen the
 * notification.
 */
export const getAllNotifications = async (
  req: Request<PaginateRequestParams, any, any>,
  res: Response<PaginateResponse<NotificationResponse> | { message: string }>,
  next: NextFunction,
) => {
  try {
    // Checking if the user is allowed to access this endpoint (admin only)
    if (!req.user || req.user.role !== UserRoles.ADMIN) {
      throw new HttpError(403, "Forbidden");
    }

    // Retrieve all notifications with pagination, filtering and sotring
    const notifications = await paginateModel(Notification, req.query);

    // Formatting the response to match the NotificationResponse interface and include pagination metadata
    const baseUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    const formattedResponse = formatPaginateResponse(
      notifications.data.map((notification) => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        url: notification.url,
        dismissed_at: notification.dismissed_at,
        created_at: notification.created_at,
        updated_at: notification.updated_at,
      })),
      req.query,
      true,
      {
        page: notifications.page,
        size: notifications.size,
        totalElements: notifications.totalElements,
        totalPages: notifications.totalPages,
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
    next(err);
  }
};

export const getAllMyNotifications = async (
  req: Request<
    PaginateRequestParams & { includeDismissed?: boolean },
    any,
    any
  >,
  res: Response<PaginateResponse<NotificationResponse> | { message: string }>,
  next: NextFunction,
) => {
  try {
    // Retrieve notifications for the authenticated user, filtering by dismissed status if includeDismissed is false
    const includeDismissed = parseBooleanField(req.query.includeDismissed);
    const notifications = await paginateModel(Notification, req.query, {
      where: {
        user_id: req.user!.id,
        ...(includeDismissed ? {} : { dismissed_at: null }),
      },
    });

    // Formatting the response to match the NotificationResponse interface and include pagination metadata
    const baseUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    const formattedResponse = formatPaginateResponse(
      notifications.data.map((notification) => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        url: notification.url,
        dismissed_at: notification.dismissed_at,
        created_at: notification.created_at,
        updated_at: notification.updated_at,
      })),
      req.query,
      true,
      {
        page: notifications.page,
        size: notifications.size,
        totalElements: notifications.totalElements,
        totalPages: notifications.totalPages,
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
    next(err);
  }
};

export const getNotificationById = async (
  req: Request<{ id: string }, any, any>,
  res: Response<NotificationResponse | { message: string }>,
  next: NextFunction,
) => {
  try {
    // Retrieve the notification by ID
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) {
      throw new HttpError(404, "Notification not found");
    }

    // Check if the authenticated user is the owner of the notification or an admin
    if (
      notification.user_id !== req.user!.id &&
      req.user!.role !== UserRoles.ADMIN
    ) {
      throw new HttpError(403, "Forbidden");
    }
    return res.status(200).json({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      url: notification.url,
      dismissed_at: notification.dismissed_at,
      created_at: notification.created_at,
      updated_at: notification.updated_at,
    });
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
    next(err);
  }
};

/**
 * Route for admin to update a notification, such as marking it as dismissed or updating the content of the notification.
 */
export const updateNotification = async (
  req: Request<{ id: string }, any, UpdateNotificationRequest>,
  res: Response<NotificationResponse | { message: string }>,
  next: NextFunction,
) => {
  const transaction = await sequelize.transaction();
  try {
    // Only admin can update notifications
    if (!req.user || req.user.role !== UserRoles.ADMIN) {
      throw new HttpError(403, "Forbidden");
    }

    // Find the notification to update
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) {
      throw new HttpError(404, "Notification not found");
    }

    // Update the notification fields based on the request body
    notification.title = req.body.title;
    notification.message = req.body.message;
    notification.url = req.body.url || null;
    notification.dismissed_at = req.body.dismissed_at || null;
    await notification.save({ transaction });
    transaction.commit();
  } catch (err) {
    transaction.rollback();
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
    next(err);
  }
};

/**
 * This is for users to dismiss notifications that they have received. This will
 * set the dismissed_at timestamp of the notification, but will not delete the
 * notification from the database.
 */
export const dismissNotification = async (
  req: Request<{ id: string }, any, any>,
  res: Response<NotificationResponse | { message: string }>,
  next: NextFunction,
) => {
  const transaction = await sequelize.transaction();
  try {
    // Check if the user is authenticated
    if (!req.user) {
      throw new HttpError(401, "Unauthorized");
    }

    // Find the notification to dismiss
    const notification = await Notification.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      transaction,
    });
    if (!notification) {
      throw new HttpError(404, "Notification not found");
    }

    // Set the dismissed_at timestamp
    notification.dismissed_at = new Date();
    await notification.save({ transaction });
    transaction.commit();
    return res.status(200).json({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      url: notification.url,
      dismissed_at: notification.dismissed_at,
      created_at: notification.created_at,
      updated_at: notification.updated_at,
    });
  } catch (err) {
    transaction.rollback();
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
    next(err);
  }
};

/**
 * Route for admin to delete a notification. This will permanently delete the notification from the database.
 */
export const deleteNotification = async (
  req: Request<{ id: string }, any, any>,
  res: Response<{ message: string }>,
  next: NextFunction,
) => {
  const transaction = await sequelize.transaction();
  try {
    // Only admin can delete notifications
    if (!req.user || req.user.role !== UserRoles.ADMIN) {
      throw new HttpError(403, "Forbidden");
    }

    // Delete the notification
    const deletedCount = await Notification.destroy({
      where: { id: req.params.id },
      transaction,
    });
    if (deletedCount === 0) {
      throw new HttpError(404, "Notification not found");
    }

    transaction.commit();
    return res
      .status(200)
      .json({ message: "Notification deleted successfully" });
  } catch (err) {
    transaction.rollback();
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
    next(err);
  }
};
