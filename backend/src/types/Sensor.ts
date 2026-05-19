export interface SensorResponse {
  id: number;
  name: string;
  type: string;
  longitude: number;
  latitude: number;
  current_status: string;
  data: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSensorRequest {
  name: string;
  type: string;
  longitude: number;
  latitude: number;
}

export interface UpdateSensorRequest {
  name?: string;
  type?: string;
  longitude?: number;
  latitude?: number;
}

export interface SensorStatusUpdateRequest {
  status: string;
}
