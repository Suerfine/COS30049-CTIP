import { NextFunction, Request, Response } from "express";
import { AnomalyEvent as AnomalyEvent, User } from "../models";
import { DatabaseError, Op } from "sequelize";
import { PaginateRequestParams, PaginateResponse } from "../types/common";
import { paginateModel } from "../utils/paginate";
import sequelize from "../config/Database";
import { sendNotification } from "../utils/sendNotification";
import { NotificationCategory } from "../enum/NotificationCategory";
import { UserRoles } from "../enum/UserRoles";

interface CreateAnomalyEventRequest {
  user_id: number;
  event_type:
    | "touching_plant"
    | "touching_animal"
    | "plucking_plants"
    | "hitting_animal"
    | "extended_plant_touch"
    | "extended_animal_touch"
    | "forest_fire"
    | "flooding"
    | "loud_noise"
    | "trespassing";
  metadata?: Record<string, any>;
  latitude?: number;
  longitude?: number;
  annotated_frame_base64?: string;
}

interface AnomalyEventResponse {
  id: number;
  user_id: number;
  event_type: string;
  metadata?: Record<string, any> | null;
  latitude?: number | null;
  longitude?: number | null;
  is_resolved: boolean;
  resolved_at?: Date | null;
  annotated_frame_base64?: string | null;
  created_at: Date;
  updated_at: Date;
}

interface AnomalyMapEventResponse extends AnomalyEventResponse {
  user?: {
    id: number;
    username: string;
    firstname?: string | null;
    lastname?: string | null;
  } | null;
}

interface ResolveAnomalyEventResponse {
  message: string;
  data: AnomalyEventResponse;
}

const isIotAnomalyEvent = (event: AnomalyEvent): boolean =>
  event.metadata?.source === "iot_sensor";

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function toAnomalyEventResponse(
  event: AnomalyEvent,
): AnomalyEventResponse {
  return {
    id: event.id,
    user_id: event.user_id,
    event_type: event.event_type,
    metadata: event.metadata,
    latitude: event.latitude,
    longitude: event.longitude,
    is_resolved: event.is_resolved,
    resolved_at: event.resolved_at,
    annotated_frame_base64: event.annotated_frame_base64,
    created_at: event.created_at,
    updated_at: event.updated_at,
  };
}

/**
 * POST /api/Anomaly-events
 * Create a new Anomaly event (called from AI server)
 */
export const createAnomalyEvent = async (
  req: Request<{}, {}, CreateAnomalyEventRequest>,
  res: Response<AnomalyEventResponse | { message: string }>,
  next: NextFunction,
) => {
  const transaction = await sequelize.transaction();
  try {
    // Validate user exists
    const user = req.user
    if (!user) {
      throw new HttpError(404, "User not found" + req.user?.username);
    }

    const event = await AnomalyEvent.create(
      {
        user_id: req.body.user_id,
        event_type: req.body.event_type,
        metadata: req.body.metadata || null,
        latitude: req.body.latitude || null,
        longitude: req.body.longitude || null,
        annotated_frame_base64: req.body.annotated_frame_base64 || null,
      },
      { transaction },
    );

    await sendNotification(
      "admin",
      "New Anomaly Detected",
      `A ${req.body.event_type.replace(/_/g, " ")} anomaly was detected. Please review it on the anomaly dashboard.`,
      transaction,
      undefined,
      false,
      NotificationCategory.ANOMALY_ALERT,
      "/anomaly-events",
    );

    await sendNotification(
      "single",
      "Anomaly Detected",
      `A ${req.body.event_type.replace(/_/g, " ")} anomaly was recorded for your activity.`,
      transaction,
      req.body.user_id,
      false,
      NotificationCategory.ANOMALY_ALERT,
      "/anomaly",
    );

    await transaction.commit();

    res.status(201).json(toAnomalyEventResponse(event));
  } catch (error) {
    await transaction.rollback();
    if (error instanceof HttpError) {
      return res.status(error.status).json({ message: error.message });
    }
    if (error instanceof DatabaseError) {
      return res
        .status(400)
        .json({ message: "Database error: " + error.message });
    }
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * GET /api/Anomaly-events
 * List all Anomaly events with pagination
 */
export const getAnomalyEvents = async (
  req: Request<{}, {}, {}, PaginateRequestParams>,
  res: Response<PaginateResponse<AnomalyEventResponse> | { message: string }>,
  next: NextFunction,
) => {
  try {
    const { page = 1, size = 20, orderBy = "created_at desc", includeResolved = "true" } = req.query as any;
    const shouldIncludeResolved = String(includeResolved).toLowerCase() === "true";

    const result = await paginateModel(AnomalyEvent, {
      page: parseInt(page as string),
      size: parseInt(size as string),
      orderBy: orderBy as string,
      where: shouldIncludeResolved ? {} : { is_resolved: false },
      attributes: [
        "id",
        "user_id",
        "event_type",
        "metadata",
        "latitude",
        "longitude",
        "is_resolved",
        "resolved_at",
        "annotated_frame_base64",
        "created_at",
        "updated_at",
      ],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "firstname", "lastname"],
        },
      ],
    } as any);

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * GET /api/Anomaly-events/map
 * List all anomaly events with valid coordinates for map plotting
 */
export const getAnomalyMapEvents = async (
  req: Request,
  res: Response<AnomalyMapEventResponse[] | { message: string }>,
  next: NextFunction,
) => {
  try {
    const events = await AnomalyEvent.findAll({
      where: {
        latitude: { [Op.ne]: null },
        longitude: { [Op.ne]: null },
        is_resolved: false,
      },
      attributes: [
        "id",
        "user_id",
        "event_type",
        "metadata",
        "latitude",
        "longitude",
        "is_resolved",
        "resolved_at",
        "annotated_frame_base64",
        "created_at",
        "updated_at",
      ],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "firstname", "lastname"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    const response = events.map((event) => {
      const plainEvent = event.get({ plain: true }) as any;

      return {
        id: plainEvent.id,
        user_id: plainEvent.user_id,
        event_type: plainEvent.event_type,
        metadata: plainEvent.metadata,
        latitude: plainEvent.latitude,
        longitude: plainEvent.longitude,
        is_resolved: plainEvent.is_resolved,
        resolved_at: plainEvent.resolved_at,
        annotated_frame_base64: plainEvent.annotated_frame_base64,
        created_at: plainEvent.created_at,
        updated_at: plainEvent.updated_at,
        user: plainEvent.user ?? null,
      };
    });

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * GET /api/Anomaly-events/:userId
 * Get Anomaly events for a specific user
 */
export const getUserAnomalyEvents = async (
  req: Request<{ userId: string }, {}, {}, PaginateRequestParams>,
  res: Response<PaginateResponse<AnomalyEventResponse> | { message: string }>,
  next: NextFunction,
) => {
  try {
    const userId = parseInt(req.params.userId);
    const { page = 1, size = 20, orderBy = "created_at desc", includeResolved = "false" } = req.query as any;
    const shouldIncludeResolved = String(includeResolved).toLowerCase() === "true";

    // Validate user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const result = await paginateModel(AnomalyEvent, {
      page: parseInt(page as string),
      size: parseInt(size as string),
      orderBy: orderBy as string,
      where: shouldIncludeResolved
        ? { user_id: userId }
        : { user_id: userId, is_resolved: false },
      attributes: [
        "id",
        "user_id",
        "event_type",
        "metadata",
        "latitude",
        "longitude",
        "is_resolved",
        "resolved_at",
        "annotated_frame_base64",
        "created_at",
        "updated_at",
      ],
    } as any);

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * GET /api/Anomaly-events/stats/:userId
 * Get Anomaly statistics for a user (event counts by type/severity)
 */
export const getUserAnomalyStats = async (
  req: Request<{ userId: string }, {}, {}>,
  res: Response<any>,
  next: NextFunction,
) => {
  try {
    const userId = parseInt(req.params.userId);

    // Validate user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const stats = await AnomalyEvent.findAll({
      attributes: [
        "event_type",
        [
          // Using sequelize.literal to get count
          (
            await import("sequelize")
          ).literal("COUNT(*)"),
          "count",
        ],
      ],
      where: { user_id: userId },
      group: ["event_type"],
      raw: true,
    });

    // Count total events
    const totalEvents = await AnomalyEvent.count({
      where: { user_id: userId },
    });

    // Count by event type
    const eventTypeCounts = await AnomalyEvent.findAll({
      attributes: [
        "event_type",
        [(await import("sequelize")).literal("COUNT(*)"), "count"],
      ],
      where: { user_id: userId },
      group: ["event_type"],
      raw: true,
    });

    res.json({
      user_id: userId,
      total_events: totalEvents,
      by_type: eventTypeCounts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * PATCH /api/anomaly-events/:eventId/resolve
 * Mark a user's anomaly event as resolved.
 */
export const resolveAnomalyEvent = async (
  req: Request<{ eventId: string }, {}, {}>,
  res: Response<ResolveAnomalyEventResponse | { message: string }>,
) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    const authUser = req.user;

    if (!authUser?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const event = await AnomalyEvent.findByPk(eventId);

    if (!event) {
      return res.status(404).json({ message: "Anomaly event not found" });
    }

    if (isIotAnomalyEvent(event) && authUser.role !== UserRoles.ADMIN) {
      return res.status(403).json({
        message: "Only admins can resolve IoT sensor anomaly events",
      });
    }

    if (!event.is_resolved) {
      event.is_resolved = true;
      event.resolved_at = new Date();
      await event.save();
    }

    res.json({
      message: "Anomaly event marked as resolved",
      data: toAnomalyEventResponse(event),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
