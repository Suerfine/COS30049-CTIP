import { Request, Response, NextFunction } from "express";
import { Sensor } from "../models";
import { formatPaginateResponse, paginateModel } from "../utils/paginate";
import { PaginateRequestParams, PaginateResponse } from "../types/common";
import { UserRoles } from "../enum/UserRoles";
import { Op } from "sequelize";
import {
  CreateSensorRequest,
  UpdateSensorRequest,
  SensorResponse,
} from "../types/Sensor";
import { SensorStatus } from "../enum/SensorStatus";

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function toSensorResponse(sensor: Sensor): SensorResponse {
  return {
    id: sensor.id,
    name: sensor.name,
    type: sensor.type,
    longitude: sensor.longitude,
    latitude: sensor.latitude,
    location: (sensor as any).location,
    current_status: sensor.current_status,
    data: {},
    created_at: sensor.created_at,
    updated_at: sensor.updated_at,
  };
}

export const createSensor = async (
  req: Request<any, any, CreateSensorRequest>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, type, longitude, latitude, location } = req.body;

    await Sensor.create({
      name,
      type,
      location: location || null,
      longitude,
      latitude,
      current_status: SensorStatus.DEACTIVATED,
    });
    return res.status(201).json({ message: "Sensor created successfully" });
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    }
  }
};

export const getAllSensors = async (
  req: Request<PaginateRequestParams>,
  res: Response<PaginateResponse<SensorResponse> | { message: string }>,
  next: NextFunction,
) => {
  try {
    const isDeletedRaw = req.query.isDeleted;
    const includeDeleted =
      (typeof isDeletedRaw === "string" &&
        isDeletedRaw.toLowerCase() === "true") ||
      (typeof isDeletedRaw === "boolean" && isDeletedRaw === true);

    const sensors = await paginateModel(Sensor, req.query, {
      paranoid: !includeDeleted,
    });

    const baseUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    const formattedResponse = formatPaginateResponse(
      sensors.data.map((s) => toSensorResponse(s as Sensor)),
      req.query,
      true,
      {
        page: sensors.page,
        size: sensors.size,
        totalElements: sensors.totalElements,
        totalPages: sensors.totalPages,
        baseUrl,
      },
    );

    return res.json(formattedResponse);
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
  }
};

export const getSensorById = async (
  req: Request<{ id: string }>,
  res: Response<SensorResponse | { message: string }>,
  next: NextFunction,
) => {
  try {
    const sensor = await Sensor.findByPk(req.params.id);
    if (!sensor) {
      throw new HttpError(404, "Sensor not found");
    }
    return res.status(200).json(toSensorResponse(sensor));
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
  }
};

export const upsertSensor = async (
  req: Request<{ id: string }, unknown, UpdateSensorRequest>,
  res: Response<SensorResponse | { message: string }>,
  next: NextFunction,
) => {
  try {
    // Only admins may create/update sensors
    if (!req.user || req.user.role !== UserRoles.ADMIN) {
      throw new HttpError(
        403,
        "Forbidden: You do not have permission to perform this action",
      );
    }

    // Check if sensor exists
    const sensor = await Sensor.findByPk(req.params.id);
    if (!sensor) {
      throw new HttpError(404, "Sensor not found");
    }

    // Validate and prepare updates
    const updates: Partial<Sensor> = {};
    if (typeof req.body.name === "string" && req.body.name.trim() !== "") {
      const existing = await Sensor.findOne({
        where: { name: req.body.name, id: { [Op.not]: sensor.id } },
      });
      if (existing) {
        throw new HttpError(400, "A sensor with the same name already exists");
      }
      updates.name = req.body.name;
    }
    if (typeof req.body.type === "string" && req.body.type.trim() !== "") {
      updates.type = req.body.type;
    }
    if (typeof req.body.location === "string") {
      (updates as any).location = req.body.location.trim() === "" ? null : req.body.location;
    }
    if (typeof req.body.longitude === "number") {
      updates.longitude = req.body.longitude;
    }
    if (typeof req.body.latitude === "number") {
      updates.latitude = req.body.latitude;
    }
    if (Object.keys(updates).length === 0) {
      throw new HttpError(400, "No valid fields provided to update");
    }
    await sensor.update(updates);
    return res.json(toSensorResponse(sensor));
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
  }
};

export const deleteSensor = async (
  req: Request<{ id: string }>,
  res: Response<{ message: string }>,
  next: NextFunction,
) => {
  try {
    if (!req.user || req.user.role !== UserRoles.ADMIN) {
      throw new HttpError(
        403,
        "Forbidden: You do not have permission to perform this action",
      );
    }

    const sensor = await Sensor.findByPk(req.params.id);
    if (!sensor) {
      throw new HttpError(404, "Sensor not found");
    }

    await sensor.destroy();

    return res.json({ message: "Sensor deleted successfully" });
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
  }
};
