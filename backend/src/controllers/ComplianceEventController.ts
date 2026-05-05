import { NextFunction, Request, Response } from "express";
import { ComplianceEvent, User } from "../models";
import { DatabaseError, Op } from "sequelize";
import { PaginateRequestParams, PaginateResponse } from "../types/common";
import { paginateModel } from "../utils/paginate";

interface CreateComplianceEventRequest {
  user_id: number;
  event_type:
    | "touching_plant"
    | "touching_animal"
    | "plucking_plants"
    | "hitting_animal"
    | "extended_plant_touch"
    | "extended_animal_touch"
    | "forest_fire"
    | "other";
  severity: "low" | "medium" | "high";
  description: string;
  metadata?: Record<string, any>;
  latitude?: number;
  longitude?: number;
}

interface ComplianceEventResponse {
  id: number;
  user_id: number;
  event_type: string;
  severity: string;
  description: string;
  metadata?: Record<string, any> | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at: Date;
  updated_at: Date;
}

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function toComplianceEventResponse(
  event: ComplianceEvent,
): ComplianceEventResponse {
  return {
    id: event.id,
    user_id: event.user_id,
    event_type: event.event_type,
    severity: event.severity,
    description: event.description,
    metadata: event.metadata,
    latitude: event.latitude,
    longitude: event.longitude,
    created_at: event.created_at,
    updated_at: event.updated_at,
  };
}

/**
 * POST /api/compliance-events
 * Create a new compliance event (called from AI server)
 */
export const createComplianceEvent = async (
  req: Request<{}, {}, CreateComplianceEventRequest>,
  res: Response<ComplianceEventResponse | { message: string }>,
  next: NextFunction,
) => {
  try {
    // Validate user exists
    const user = await User.findByPk(req.body.user_id);
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    const event = await ComplianceEvent.create({
      user_id: req.body.user_id,
      event_type: req.body.event_type,
      severity: req.body.severity,
      description: req.body.description,
      metadata: req.body.metadata || null,
      latitude: req.body.latitude || null,
      longitude: req.body.longitude || null,
    });

    res.status(201).json(toComplianceEventResponse(event));
  } catch (error) {
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
 * GET /api/compliance-events
 * List all compliance events with pagination
 */
export const getComplianceEvents = async (
  req: Request<{}, {}, {}, PaginateRequestParams>,
  res: Response<PaginateResponse<ComplianceEventResponse> | { message: string }>,
  next: NextFunction,
) => {
  try {
    const { page = 1, size = 20, orderBy = "created_at desc" } = req.query;

    const result = await paginateModel(ComplianceEvent, {
      page: parseInt(page as string),
      size: parseInt(size as string),
      orderBy: orderBy as string,
      where: {},
      attributes: [
        "id",
        "user_id",
        "event_type",
        "severity",
        "description",
        "metadata",
        "latitude",
        "longitude",
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
 * GET /api/compliance-events/:userId
 * Get compliance events for a specific user
 */
export const getUserComplianceEvents = async (
  req: Request<{ userId: string }, {}, {}, PaginateRequestParams>,
  res: Response<PaginateResponse<ComplianceEventResponse> | { message: string }>,
  next: NextFunction,
) => {
  try {
    const userId = parseInt(req.params.userId);
    const { page = 1, size = 20, orderBy = "created_at desc" } = req.query;

    // Validate user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const result = await paginateModel(ComplianceEvent, {
      page: parseInt(page as string),
      size: parseInt(size as string),
      orderBy: orderBy as string,
      where: { user_id: userId },
      attributes: [
        "id",
        "user_id",
        "event_type",
        "severity",
        "description",
        "metadata",
        "latitude",
        "longitude",
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
 * GET /api/compliance-events/stats/:userId
 * Get compliance statistics for a user (event counts by type/severity)
 */
export const getUserComplianceStats = async (
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

    const stats = await ComplianceEvent.findAll({
      attributes: [
        "event_type",
        "severity",
        [
          // Using sequelize.literal to get count
          (
            await import("sequelize")
          ).literal("COUNT(*)"),
          "count",
        ],
      ],
      where: { user_id: userId },
      group: ["event_type", "severity"],
      raw: true,
    });

    // Count total events
    const totalEvents = await ComplianceEvent.count({
      where: { user_id: userId },
    });

    // Count by event type
    const eventTypeCounts = await ComplianceEvent.findAll({
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
      by_severity: stats,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
