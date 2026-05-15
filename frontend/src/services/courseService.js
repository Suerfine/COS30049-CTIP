import apiClient from "../config/apiConfig";
import { API_ENDPOINTS } from "../config/ApiEndpoints";
import { appendFile } from "../utils/AppendFile";

export const courseService = {
  // Get: fetch all course from backend api
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.COURSE.LIST, {
        params: {
          page: params.page || 1,
          size: params.size || 20,
          filter: params.filter || "",
        },
      });
      return response.data;
    } catch (err) {
      console.error("Fetch Courses Error: ", err);
      const errorMessage =
        err.response?.data?.message || "Failed to fetch all courses.";
      return Promise.reject(errorMessage);
    }
  },

  // GET: by id
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/courses/${id}`);
      return response.data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to fetch course details";
      console.error("Unable to fetch course: ", err);
      return Promise.reject(errorMessage);
    }
  },

  // Post: create new course
  create: async (formData) => {
    try {
      const data = new FormData();

      data.append("title", formData.courseTitle);
      data.append("description", formData.description);
      data.append("status", "unreleased");
      data.append("expected_completion_weeks", formData.duration);
      data.append("must_complete_in_weeks", formData.expiryWeeks);
      data.append("badge_expire_in_months", formData.badgeExpiry);
      const costToSend =
        formData.cost && formData.cost !== "" ? formData.cost : "0";
      data.append("cost", costToSend);
      data.append(
        "prerequisite_course_ids",
        JSON.stringify(formData.prerequisites.map((p) => p.id)),
      );
      if (formData.image) {
        appendFile(data, "cover", formData.image);
      }

      if (formData.badgeImage) {
        appendFile(data, "badge", formData.badgeImage);
      }

      const response = await apiClient.post(API_ENDPOINTS.COURSE.LIST, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error) {
      return Promise.reject(
        error.response?.data?.message || "Failed to create a new course.",
      );
    }
  },

  update: async (id, courseData) => {
    try {
      const parsedCost =
        courseData.cost !== undefined && courseData.cost !== null
          ? parseFloat(courseData.cost)
          : undefined;

      const payload = {
        title: courseData.courseTitle,
        description: courseData.description || "",
        status: courseData.status,
        expected_completion_weeks: parseInt(courseData.duration, 10),
        must_complete_in_weeks: parseInt(courseData.expiryWeeks, 10),
        badge_expire_in_months: parseInt(courseData.badgeExpiry, 10),
        cost: Number.isNaN(parsedCost) ? undefined : parsedCost,
        tag_ids: courseData.tags || [],
        prerequisite_course_ids: courseData.prerequisite_course_ids || [],
      };
      const response = await apiClient.put(
        API_ENDPOINTS.COURSE.DETAIL(id),
        payload,
      );

      return response.data;
    } catch (error) {
      return Promise.reject(
        error.response?.data?.message || "Failed to update course.",
      );
    }
  },

  // Delete: delete existing course
  delete: async (id) => {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.COURSE.DETAIL(id));
      return response.data;
    } catch (error) {
      return Promise.reject(
        error.response?.data?.message || "Failed to delete a course.",
      );
    }
  },

  // GET: get all tags
  getAllTags: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.TAGS.LIST);
      return response.data;
    } catch (err) {
      console.error("Fetch Tags Error:", err);
      throw err;
    }
  },

  // POST:create new tags
  createTag: async (tagData) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.TAGS.CREATE, tagData);
      return response.data;
    } catch (error) {
      return Promise.reject(
        error.response?.data?.message || "Failed to create tag.",
      );
    }
  },

  // GET: fetch courses with enrollment status + can enroll courses for the current user
  getUserCourses: async (params = {}) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.COURSE.USER_COURSES, {
        params: {
          page: params.page || 1,
          size: params.size || 100,
          orderBy: params.orderBy || "",
          filter: params.filter || "",
          tags: params.tags,
        },
      });
      return response.data;
    } catch (err) {
      console.error("Fetch User Courses Error:", err);
      return Promise.reject(
        err.response?.data?.message || "Failed to fetch user courses.",
      );
    }
  },
};
