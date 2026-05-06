const BASE_URL = "http://localhost:4000/api/submissions";
import apiClient from "../config/apiConfig";

export const submissionService = {
  // GET: fetch all submissions
  getAll: async () => {
      try {
          const res = await apiClient.get("/submission");
          return res.data;
      } catch (error) {
          console.error("Fetch Submissions Error:", error.response?.data || error.message);
          throw error;
      }
  },

  // POST: create submissions
  create: async (payload) => {
      try {
          const res = await apiClient.post("/submission", payload);
          console.log(payload);
          return res.data;
      } catch (error) {
          console.error("Create Submission Error:", error.response?.data || error.message);
          throw error;
      }
  },
};
