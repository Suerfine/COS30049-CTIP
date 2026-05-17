import apiClient from "../config/apiConfig";
import { API_ENDPOINTS } from "../config/ApiEndpoints";

export const totpService = {
  async setup() {
    try {
      const response = await apiClient.post(API_ENDPOINTS.TOTP.SETUP);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to start 2FA setup");
    }
  },

  async verifySetup(secret, code) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.TOTP.VERIFY_SETUP, { secret, code });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to verify code");
    }
  },

  async disable(code) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.TOTP.DISABLE, { code });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to disable 2FA");
    }
  },
};
