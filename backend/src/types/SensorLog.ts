import { SensorStatus } from "../enum/SensorStatus";

export interface SensorLogResponse {
  id: number;
  sensor_id: number;
  status: SensorStatus;
  data: Record<string, unknown>;
  created_at: Date;
}

export interface CreateSensorLogRequest {
  status: SensorStatus;
  data: Record<string, unknown> | string;
}

export interface UpdateSensorLogRequest {
  status?: SensorStatus;
  data?: Record<string, unknown> | string;
}
