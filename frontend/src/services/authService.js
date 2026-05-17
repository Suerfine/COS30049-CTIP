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

      const { access_token, token_type } = response.data;
      const payload = decodeJwtPayload(access_token);
      return {
        access_token,
        token_type,
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
};
