import apiClient from "../config/apiConfig";

export const AnomalyService = {
  // GET: fetch all anomalies/compliance events
  getAll: async (page = 1, size = 10, searchQuery = "", sortConfig) => {
    try {
      const params = { page, size };
      let filters = [];

      if (searchQuery.trim()) {
        const q = searchQuery.trim();
        filters.push(`event_type like "%${q}%" or description like "%${q}%"`);
      }

      if (filters.length > 0) {
        params.filter = filters.join(" and ");
      }

      if (sortConfig?.key) {
        params.orderBy = `${sortConfig.key} ${sortConfig.direction}`;
      } else {
        // Default: sort by created_at descending (most recent first)
        params.orderBy = "created_at desc";
      }

      const response = await apiClient.get("/compliance-events", { params });
      return response.data;
    } catch (error) {
      console.error("Get Anomalies Error:", error);
      throw error;
    }
  },

  // GET: get anomaly statistics
  getStatistics: async () => {
    try {
      const response = await apiClient.get("/compliance-events/statistics");
      return response.data;
    } catch (error) {
      console.error("Get Anomaly Statistics Error:", error);
      throw error;
    }
  },
};
