import { Request, Response, NextFunction } from "express";
import { AnomalyEvent, SensorLog, Sensor, User } from "../models";
import { formatPaginateResponse, paginateModel } from "../utils/paginate";
import { PaginateRequestParams, PaginateResponse } from "../types/common";
import {
  SensorLogResponse,
  CreateSensorLogRequest,
  UpdateSensorLogRequest,
} from "../types/SensorLog";
import { parseId, parseJsonField } from "../utils/parseRequest";
import { UserRoles } from "../enum/UserRoles";
import { SensorStatus } from "../enum/SensorStatus";
import { sendNotification } from "../utils/sendNotification";
import { NotificationCategory } from "../enum/NotificationCategory";
import sequelize from "../config/Database";

const IOT_ANOMALY_TYPES = [
  "forest_fire",
  "flooding",
  "loud_noise",
  "trespassing",
] as const;

type IotAnomalyType = (typeof IOT_ANOMALY_TYPES)[number];

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function toSensorLogResponse(log: SensorLog): SensorLogResponse {
  return {
    id: log.id,
    sensor_id: log.sensor_id as unknown as number,
    status: log.status,
    data: log.data as unknown as Record<string, unknown>,
    created_at: log.created_at,
  };
}

function resolveSensorAnomalyType(
  sensor: Sensor,
  data: Record<string, unknown>,
): IotAnomalyType {
  const explicitType = String(data.event_type || data.anomaly_type || "");
  if (IOT_ANOMALY_TYPES.includes(explicitType as IotAnomalyType)) {
    return explicitType as IotAnomalyType;
  }

  const searchable = `${sensor.type} ${sensor.name}`.toLowerCase();
  if (searchable.includes("fire") || searchable.includes("smoke") || searchable.includes("temperature")) {
    return "forest_fire";
  }
  if (searchable.includes("flood") || searchable.includes("water") || searchable.includes("level")) {
    return "flooding";
  }
  if (searchable.includes("noise") || searchable.includes("sound")) {
    return "loud_noise";
  }

  return "trespassing";
}

async function resolveSystemUserId(transaction: any): Promise<number | null> {
  const admin = await User.findOne({
    where: { role: UserRoles.ADMIN },
    transaction,
    order: [["id", "ASC"]],
  });

  if (admin) {
    return admin.id;
  }

  const firstUser = await User.findOne({
    transaction,
    order: [["id", "ASC"]],
  });

  return firstUser?.id ?? null;
}

export const createLog = async (
  req: Request<{ sensor_id: string }, any, CreateSensorLogRequest>,
  res: Response<SensorLogResponse | { message: string }>,
  next: NextFunction,
) => {
  const transaction = await sequelize.transaction();
  try {
    // Checking if its a valid sensor
    const sensorId = parseId(req.params.sensor_id);
    if (sensorId === null) {
      throw new HttpError(400, "Invalid sensor_id");
    }
    const sensor = await Sensor.findByPk(sensorId);
    if (!sensor) {
      throw new HttpError(404, "Sensor not found");
    }

    // Validate request body
    const body = (req.body ?? {}) as Partial<CreateSensorLogRequest>;
    if (!body.status || typeof body.status !== "string") {
      throw new HttpError(400, "status is required");
    }
    if (!Object.values(SensorStatus).includes(body.status as SensorStatus)) {
      throw new HttpError(400, "Invalid sensor status");
    }
    const parsedData = parseJsonField(body.data ?? {});
    if (parsedData === null) {
      throw new HttpError(400, "Invalid data payload");
    }

    // Create log entry and update the sensor state
    const log = await SensorLog.create(
      {
        sensor_id: sensorId,
        status: body.status as SensorStatus,
        data: parsedData as any,
      },
      { transaction },
    );

    await sensor.update(
      { current_status: body.status as SensorStatus },
      { transaction },
    );

    if (body.status === SensorStatus.ALERTING) {
      const eventType = resolveSensorAnomalyType(
        sensor,
        parsedData as Record<string, unknown>,
      );
      const systemUserId = req.user?.id ?? (await resolveSystemUserId(transaction));

      if (systemUserId !== null) {
        await AnomalyEvent.create(
          {
            user_id: systemUserId,
            event_type: eventType,
            latitude: Number(sensor.latitude),
            longitude: Number(sensor.longitude),
            metadata: {
              source: "iot_sensor",
              sensor_id: sensor.id,
              sensor_name: sensor.name,
              sensor_type: sensor.type,
              sensor_status: body.status,
              sensor_log_id: log.id,
              sensor_data: parsedData,
            },
          },
          { transaction },
        );
      }

      const title = `Sensor Alert: ${sensor.name}`;
      const message = `Sensor "${sensor.name}" (${sensor.type}) is in alerting state.`;
      const url = `/anomaly-events`;

      await sendNotification(
        "admin",
        title,
        message,
        transaction,
        undefined,
        false,
        NotificationCategory.ANOMALY_ALERT,
        url,
      );
      await sendNotification(
        "park_guides",
        title,
        message,
        transaction,
        undefined,
        false,
        NotificationCategory.ANOMALY_ALERT,
        url,
      );
    }

    await transaction.commit();
    return res.status(201).json(toSensorLogResponse(log));
  } catch (err) {
    await transaction.rollback();
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
  }
};

export const getAllLogs = async (
  req: Request<PaginateRequestParams, any, any>,
  res: Response<PaginateResponse<SensorLogResponse> | { message: string }>,
  next: NextFunction,
) => {
  try {
    const logs = await paginateModel(
      SensorLog,
      req.query as PaginateRequestParams,
    );

    const baseUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    const formatted = formatPaginateResponse(
      logs.data.map((l) => toSensorLogResponse(l as SensorLog)),
      req.query as PaginateRequestParams,
      true,
      {
        page: logs.page,
        size: logs.size,
        totalElements: logs.totalElements,
        totalPages: logs.totalPages,
        baseUrl,
      },
    );

    return res.json(formatted);
  } catch (err) {
    return res.status(500).json({ message: "Internal server error\n" + err });
  }
};

export const getAllSensorLogs = async (
  req: Request<{ sensor_id: string }, any, any>,
  res: Response<PaginateResponse<SensorLogResponse> | { message: string }>,
  next: NextFunction,
) => {
  try {
    // Checking if its a valid sensor
    const sensorId = parseId(req.params.sensor_id);
    if (sensorId === null) {
      throw new HttpError(400, "Invalid sensor_id");
    }
    const sensor = await Sensor.findByPk(sensorId);
    if (!sensor) {
      throw new HttpError(404, "Sensor not found");
    }

    // Fetch logs for the sensor
    const logs = await paginateModel(
      SensorLog,
      req.query as PaginateRequestParams,
      { where: { sensor_id: sensorId } },
    );

    const baseUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    const formatted = formatPaginateResponse(
      logs.data.map((l) => toSensorLogResponse(l as SensorLog)),
      req.query as PaginateRequestParams,
      true,
      {
        page: logs.page,
        size: logs.size,
        totalElements: logs.totalElements,
        totalPages: logs.totalPages,
        baseUrl,
      },
    );
    return res.json(formatted);
  } catch (err) {
    return res.status(500).json({ message: "Internal server error\n" + err });
  }
};

export const getLogById = async (
  req: Request<{ id: string }>,
  res: Response<SensorLogResponse | { message: string }>,
  next: NextFunction,
) => {
  try {
    const log = await SensorLog.findByPk(req.params.id);
    if (!log) {
      throw new HttpError(404, "Log not found");
    }
    return res.json(toSensorLogResponse(log));
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
  }
};

export const updateLog = async (
  req: Request<{ id: string }, any, UpdateSensorLogRequest>,
  res: Response<SensorLogResponse | { message: string }>,
  next: NextFunction,
) => {
  try {
    if (!req.user || req.user.role !== UserRoles.ADMIN) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const log = await SensorLog.findByPk(req.params.id);
    if (!log) {
      return res.status(404).json({ message: "Log not found" });
    }

    const body = (req.body ?? {}) as Partial<UpdateSensorLogRequest>;
    const updates: Partial<SensorLog> = {};

    if (body.status !== undefined) {
      if (!Object.values(SensorStatus).includes(body.status as SensorStatus)) {
        return res.status(400).json({ message: "Invalid sensor status" });
      }
      updates.status = body.status as any;
    }

    if (body.data !== undefined) {
      const parsed = parseJsonField(body.data as unknown);
      if (parsed === null) {
        return res.status(400).json({ message: "Invalid data payload" });
      }
      updates.data = parsed as any;
    }

    if (Object.keys(updates).length === 0) {
      return res
        .status(400)
        .json({ message: "No valid fields provided to update" });
    }

    await log.update(updates);

    return res.json(toSensorLogResponse(log));
  } catch (err) {
    return res.status(500).json({ message: "Internal server error\n" + err });
  }
};

export const deleteLog = async (
  req: Request<{ id: string }>,
  res: Response<{ message: string }>,
  next: NextFunction,
) => {
  try {
    if (!req.user || req.user.role !== UserRoles.ADMIN) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const log = await SensorLog.findByPk(req.params.id);
    if (!log) {
      return res.status(404).json({ message: "Log not found" });
    }

    await log.destroy();
    return res.json({ message: "Log deleted successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error\n" + err });
  }
};
