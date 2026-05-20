import { Platform } from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { triggerLogout } from "../context/AuthContext";

export const BASE_URL = () => {
  const API_HOST =
    process.env.EXPO_PUBLIC_API_HOST ||
    process.env.API_HOST ||
    Constants?.expoConfig?.hostUri?.split(":")?.[0] ||
    "localhost";

  // Native (Expo Go / device builds) can't trust the mkcert dev cert and has
  // no way to click through a TLS warning, so it talks plain HTTP to the
  // backend's HTTP fallback listener (backend HTTP_FALLBACK_PORT, default 5001).
  // The Expo dev-server host is always reachable from the device since that's
  // where the JS bundle was loaded from, so prefer it over a possibly-stale env.
  if (Platform.OS !== "web") {
    const nativeHost =
      Constants?.expoConfig?.hostUri?.split(":")?.[0] || API_HOST;
    const httpPort = process.env.EXPO_PUBLIC_API_HTTP_PORT || 5001;
    return `http://${nativeHost}:${httpPort}/api`;
  }

  // Web: browsers can accept the mkcert cert, so keep HTTPS.
  const API_PORT = process.env.EXPO_PUBLIC_API_PORT || process.env.API_PORT || 5000;
  const API_PROTOCOL = process.env.EXPO_PUBLIC_API_PROTOCOL || "https";
  return `${API_PROTOCOL}://${API_HOST}:${API_PORT}/api`;
};

const apiClient = axios.create({
  baseURL: BASE_URL(),
});

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.error("Token retrieval error", err);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const errorMessage = error.response?.data?.message;
    if (error.response && errorMessage === "jwt expired") {
      await AsyncStorage.multiRemove(["accessToken", "currentUser"]);
      await triggerLogout();
    }
    return Promise.reject(error);
  },
);

export default apiClient;
