export interface SensorResponse {
  id: number;
  name: string;
  type: string;
  longitude: number;
  latitude: number;
  location: string | null;
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
  location?: string;
}

export interface UpdateSensorRequest {
  name?: string;
  type?: string;
  longitude?: number;
  latitude?: number;
  location?: string;
}

export interface SensorStatusUpdateRequest {
  status: string;
}
