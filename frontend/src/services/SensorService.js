import apiClient, { BASE_URL } from "../config/apiConfig";
import { API_ENDPOINTS } from "../config/ApiEndpoints";

const buildQuery = (params = {}) => {
  const esc = encodeURIComponent;
  const query = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null)
    .map((key) => `${esc(key)}=${esc(params[key])}`)
    .join("&");

  return query ? `?${query}` : "";
};

export const sensorService = {
  getAll: async (params = {}) => {
    try {
      const url = `${API_ENDPOINTS.SENSOR.LIST}${buildQuery(params)}`;
      const res = await apiClient.get(url);
      return res.data;
    } catch (error) {
      console.error(
        "Fetch Sensors Error:",
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.SENSOR.DETAIL(id));
      return res.data;
    } catch (error) {
      console.error(
        `Fetch Sensor ${id} Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  create: async (payload) => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.SENSOR.LIST, payload);
      return res.data;
    } catch (error) {
      console.error(
        "Create Sensor Error:",
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  update: async (id, payload) => {
    try {
      const res = await apiClient.put(API_ENDPOINTS.SENSOR.DETAIL(id), payload);
      return res.data;
    } catch (error) {
      console.error(
        `Update Sensor ${id} Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const res = await apiClient.delete(API_ENDPOINTS.SENSOR.DETAIL(id));
      return res.data;
    } catch (error) {
      console.error(
        `Delete Sensor ${id} Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  createLog: async (sensorId, payload) => {
    try {
      const res = await apiClient.post(
        API_ENDPOINTS.SENSOR.SENSOR_LOGS(sensorId),
        payload,
      );
      return res.data;
    } catch (error) {
      console.error(
        `Create Sensor Log ${sensorId} Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  getAllLogs: async (params = {}) => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.SENSOR.LOGS, {
        params,
      });
      return res.data;
    } catch (error) {
      console.error(
        "Fetch Sensor Logs Error:",
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  getLogsBySensor: async (sensorId, params = {}) => {
    try {
      const res = await apiClient.get(
        API_ENDPOINTS.SENSOR.SENSOR_LOGS(sensorId),
        { params },
      );
      return res.data;
    } catch (error) {
      console.error(
        `Fetch Sensor ${sensorId} Logs Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  getLogById: async (id) => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.SENSOR.LOG_DETAIL(id));
      return res.data;
    } catch (error) {
      console.error(
        `Fetch Sensor Log ${id} Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  updateLog: async (id, payload) => {
    try {
      const res = await apiClient.put(
        API_ENDPOINTS.SENSOR.LOG_DETAIL(id),
        payload,
      );
      return res.data;
    } catch (error) {
      console.error(
        `Update Sensor Log ${id} Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  deleteLog: async (id) => {
    try {
      const res = await apiClient.delete(API_ENDPOINTS.SENSOR.LOG_DETAIL(id));
      return res.data;
    } catch (error) {
      console.error(
        `Delete Sensor Log ${id} Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },
};

export default sensorService;
