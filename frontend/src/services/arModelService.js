import apiClient from "../config/apiConfig";
import { API_ENDPOINTS } from "../config/ApiEndpoints";

const appendFile = (formData, fieldName, file) => {
  if (!file) return;

  // 1. Handle standard DOM File objects (Web)
  if (typeof File !== "undefined" && file instanceof File) {
    formData.append(fieldName, file, file.name);
    return;
  }

  // 2. Handle Expo Web DocumentPicker results (the raw file is nested under 'file')
  if (typeof File !== "undefined" && file.file instanceof File) {
    formData.append(fieldName, file.file, file.name);
    return;
  }

  // 3. Handle React Native Mobile (Requires uri, name, and type)
  if (file.uri) {
    formData.append(fieldName, {
      uri: file.uri,
      name: file.name || `${fieldName}.bin`,
      type: file.mimeType || file.type || "application/octet-stream", // Check both mimeType and type
    });
  }
};

export const arModelService = {
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.AR.LIST, {
        params: {
          page: params.page || 1,
          size: params.size || 20,
          filter: params.filter || "",
        },
      });
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to fetch AR models";
      return Promise.reject(message);
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.AR.DETAIL(id));
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to fetch AR model";
      return Promise.reject(message);
    }
  },
  getById: async (id) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.AR.DETAIL(id));
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to fetch AR model";
      return Promise.reject(message);
    }
  },

  delete: async (id) => {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.AR.DETAIL(id));
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to delete AR model";
      return Promise.reject(message);
    }
  },

  create: async ({ title, description, modelFile, patternFile }) => {
    try {
      const formData = new FormData();
      formData.append("title", title);
      if (description) {
        formData.append("description", description);
      }

      appendFile(formData, "model", modelFile);

      const response = await apiClient.post(API_ENDPOINTS.AR.LIST, formData, {
        headers: { 
          Accept: "application/json",
          "Content-Type": "multipart/form-data" // Ensure this is explicitly defined
        },
      });

      if (patternFile) {
        const patternData = new FormData();
        appendFile(patternData, "pattern", patternFile);
        const updated = await apiClient.post(
          API_ENDPOINTS.AR.PATTERN(response.data.id),
          patternData,
          { 
            headers: { 
              Accept: "application/json",
              "Content-Type": "multipart/form-data"
            } 
          },
        );
        return updated.data;
      }

      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to create AR model";
      return Promise.reject(message);
    }
  },
};