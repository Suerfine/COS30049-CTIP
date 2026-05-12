export interface SensorResponse {
  id: number;
  name: string;
  type: string;
  location: string;
  data: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSensorRequest {
  name: string;
  type: string;
  location: string;
}

export interface UpdateSensorRequest {
  name: string;
  type: string;
  location: string;
}

export interface SensorStatusUpdateRequest {
  status: string;
}
