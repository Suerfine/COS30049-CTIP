import { API_ENDPOINTS } from "../config/ApiEndpoints";
import apiClient from "../config/apiConfig";

export const searchService = {
  parkGuide: async (query) => {
    const res = await apiClient.get(API_ENDPOINTS.SEARCH.PARK_GUIDE, {
      params: { q: query },
    });

    return res?.data?.data || [];
  },
};
