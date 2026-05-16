import apiClient from "../config/apiConfig";

export const AnomalyService = {
  // GET: fetch all anomalies/compliance events
  getAll: async (page = 1, size = 10, searchQuery = "", sortConfig) => {
    try {
      const params = { page, size };
      let filters = [];

      if (searchQuery.trim()) {
        const q = searchQuery.trim();
        filters.push(`event_type like "%${q}%"`);
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

      const response = await apiClient.get("/Anomaly-events", { params });
      return response.data;
    } catch (error) {
      console.error("Get Anomalies Error:", error);
      throw error;
    }
  },

  // GET: fetch all coordinate-bearing anomalies for map plotting
  getMapEvents: async () => {
    try {
      const response = await apiClient.get("/Anomaly-events/map");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || "";

      if (
        error.response?.status === 404 ||
        message.toLowerCase().includes("validation failed")
      ) {
        return AnomalyService.getMapEventsFromPaginatedList();
      }

      console.error("Get Anomaly Map Events Error:", error);
      throw error;
    }
  },

  // Fallback for older backend processes that do not have /Anomaly-events/map yet.
  getMapEventsFromPaginatedList: async () => {
    try {
      const size = 100;
      const firstPage = await apiClient.get("/Anomaly-events", {
        params: {
          page: 1,
          size,
          filter: "latitude ne null and longitude ne null",
          orderBy: "created_at desc",
        },
      });

      const firstPayload = firstPage.data;
      const totalPages = firstPayload.totalPages || 1;
      const events = [...(firstPayload.data || [])];

      for (let page = 2; page <= totalPages; page += 1) {
        const response = await apiClient.get("/Anomaly-events", {
          params: {
            page,
            size,
            filter: "latitude ne null and longitude ne null",
            orderBy: "created_at desc",
          },
        });

        events.push(...(response.data?.data || []));
      }

      return events;
    } catch (fallbackError) {
      console.error("Get Anomaly Map Events Fallback Error:", fallbackError);
      throw fallbackError;
    }
  },

  // PATCH: mark an anomaly event as resolved
  resolve: async (eventId) => {
    try {
      const response = await apiClient.patch(`/Anomaly-events/${eventId}/resolve`);
      return response.data;
    } catch (error) {
      console.error("Resolve Anomaly Error:", error);
      throw error;
    }
  },

  // GET: get anomaly statistics
  getStatistics: async () => {
    try {
      const response = await apiClient.get("/Anomaly-events/statistics");
      return response.data;
    } catch (error) {
      console.error("Get Anomaly Statistics Error:", error);
      throw error;
    }
  },
};
