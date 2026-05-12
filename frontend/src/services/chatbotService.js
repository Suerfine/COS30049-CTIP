import apiClient from "../config/apiConfig";
import { API_ENDPOINTS } from "../config/ApiEndpoints";

export const chatbotService = {
  sendMessage: async (message) => {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.CHATBOT.SEND_MESSAGE,
        {
          message,
        },
      );
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
  createSession: async (pageId, firstMessage = "") => {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.CHATBOT.CREATE_SESSION,
        {
          pageId,
          firstMessage,
        },
      );
      return response.data;
    } catch (err) {
      console.error("Chatbot Service Error:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to create chatbot session.";
      return Promise.reject(errorMessage);
    }
  },
};

export default chatbotService;
