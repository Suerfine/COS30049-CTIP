import apiClient from "../config/apiConfig";
import { API_ENDPOINTS } from "../config/ApiEndpoints";

export const chatbotService = {
  sendMessage: async (message) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.CHATBOT.SEND, {
        message,
      });
      return response.data;
    } catch (err) {
      console.error("Chatbot Service Error:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to get chatbot response.";
      return Promise.reject(errorMessage);
    }
  },
};

export default chatbotService;
