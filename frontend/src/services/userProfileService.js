import apiClient from "../config/apiConfig";
import { API_ENDPOINTS } from "../config/ApiEndpoints";

export const userProfileService = {
  update: async (id, form) => {
    try {
      const data = new FormData();

      Object.keys(form).forEach((key) => {
        if (form[key] !== undefined && form[key] !== "") {
          data.append(key, form[key]);
        }
      });

      const res = await apiClient.put(`/users/${id}`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return { success: true, data: res.data };
    } catch (err) {
      return {
        success: false,
        serverError: err.response?.data?.message || "Internal Server Error",
      };
    }
  },
};