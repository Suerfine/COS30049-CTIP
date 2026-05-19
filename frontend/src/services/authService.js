import { Platform } from "react-native";
import apiClient from "../config/apiConfig";

export const decodeJwtPayload = (token) => {
  const tokenParts = String(token || "").split(".");
  if (tokenParts.length !== 3) {
    return {};
  }

  const normalized = tokenParts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  if (typeof globalThis.atob !== "function") {
    return {};
  }

  try {
    const payloadJson = globalThis.atob(padded);
    return JSON.parse(payloadJson);
  } catch {
    return {};
  }
};

export const authService = {
  async login(email, password) {
    try {
      const response = await apiClient.post("/token", {
        username: email,
        password,
      });

      if (response.data.requires_totp) {
        return {
          requires_totp: true,
          totp_session_token: response.data.totp_session_token,
          email,
        };
      }

      const { access_token, token_type, must_change_password } = response.data;
      const payload = decodeJwtPayload(access_token);
      return {
        access_token,
        token_type,
        must_change_password: must_change_password ?? false,
        user: {
          id: payload?.id,
          role: payload?.role || "park_guide",
          personal_email: email,
        },
      };
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401) {
          throw new Error("* Incorrect email or password");
        }
        throw new Error(error.response.data?.message || "Login failed");
      }
      throw new Error(
        "Unable to connect to server. Please check backend is running.",
      );
    }
  },

  async verifyTotp(totp_session_token, code) {
    try {
      const response = await apiClient.post("/token/totp", {
        totp_session_token,
        code,
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data?.message || "Verification failed");
      }
      throw new Error("Unable to connect to server.");
    }
  },

  async requestPasswordReset(email) {
    try {
      const response = await apiClient.post("/forgot-password", {
        email,
      });

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(
          error.response.data?.message || "Failed to request password reset",
        );
      }

      throw new Error(
        "Unable to connect to server. Please check backend is running.",
      );
    }
  },

  async changeFirstTimePassword(currentPassword, newPassword) {
    try {
      const response = await apiClient.post("/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(
          error.response.data?.message || "Failed to change password",
        );
      }
      throw new Error(
        "Unable to connect to server. Please check backend is running.",
      );
    }
  },

  async resetPassword(token, password) {
    try {
      const response = await apiClient.post("/reset-password", {
        token,
        password,
      });

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(
          error.response.data?.message || "Failed to reset password",
        );
      }

      throw new Error(
        "Unable to connect to server. Please check backend is running.",
      );
    }
  },
};
