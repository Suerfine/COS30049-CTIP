import apiClient from "../config/apiConfig";

export const totpService = {
  async setup() {
    try {
      const response = await apiClient.post("/totp/setup");
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to start 2FA setup");
    }
  },

  async verifySetup(secret, code) {
    try {
      const response = await apiClient.post("/totp/verify-setup", { secret, code });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to verify code");
    }
  },

  async disable(code) {
    try {
      const response = await apiClient.post("/totp/disable", { code });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to disable 2FA");
    }
  },
};
