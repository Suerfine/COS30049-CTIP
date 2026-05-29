import apiClient from "../config/apiConfig";
import { API_ENDPOINTS } from "../config/ApiEndpoints";

export const moduleService = {
  // GET: Fetch all modules
  getAll: async (courseId) => {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.COURSE.MODULES(courseId),
      );
      return response.data;
    } catch (err) {
      console.error("Fetch Modules Error: ", err);
      return Promise.reject(
        err.response?.data?.message || "Failed to fetch the modules.",
      );
    }
  },
  // POST: Create new module
  create: async (courseId, moduleData) => {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.COURSE.MODULES(courseId),
        {
          title: moduleData.title,
          order: moduleData.order,
          complete_by_week: moduleData.complete_by_week,
        },
      );
      return response.data;
    } catch (err) {
      console.error("Create Modules Error: ", err);
      return Promise.reject(
        err.response?.data?.message || "Failed to create the modules.",
      );
    }
  },

  // PUT: update the existing module
  update: async (courseId, moduleId, newTitle) => {
    try {
      const response = await apiClient.put(
        API_ENDPOINTS.COURSE.MODULE_DETAIL(courseId, moduleId),
        { title: newTitle },
      );
      return response.data;
    } catch (err) {
      console.error("Update Modules Error: ", err);
      return Promise.reject(
        err.response?.data?.message || "Failed to update the modules.",
      );
    }
  },

  // DELETE: delete the existing module
  delete: async (courseId, moduleId) => {
    try {
      const response = await apiClient.delete(
        API_ENDPOINTS.COURSE.MODULE_DETAIL(courseId, moduleId),
      );
      return response.data;
    } catch (err) {
      console.error("Delete Modules Error: ", err);
      return Promise.reject(
        err.response?.data?.message || "Failed to delete the modules.",
      );
    }
  },
};
