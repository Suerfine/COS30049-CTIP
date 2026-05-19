import apiClient from "../config/apiConfig";
import { API_ENDPOINTS } from "../config/ApiEndpoints";
import { Platform } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

export const userProfileService = {
  update: async (id, form) => {
  try {
    const data = new FormData();

    for (const key of Object.keys(form)) {
      const value = form[key];
      if (value === undefined || value === "") continue;

      if (key === "pfp" && value != null) {
          if (Platform.OS !== "web") {
              const uri = typeof value === "string" ? value : value?.uri;
              if (!uri) continue;

              const token = await AsyncStorage.getItem("accessToken");
              const baseURL = apiClient.defaults.baseURL ?? "";

              const formData = new FormData();

              formData.append("pfp", {
                  uri,
                  name: (typeof value === "object" && value?.fileName) ? value.fileName : "avatar.jpg",
                  type: (typeof value === "object" && value?.mimeType) ? value.mimeType : "image/jpeg",
              });
              const response = await fetch(`${baseURL}/users/${id}`, {
                  method: "PUT",
                  headers: {
                      Authorization: `Bearer ${token}`,
                  },
                  body: formData,
              });
              if (!response.ok) {
                  const text = await response.text();
                  throw new Error(`${response.status}: ${text}`);
              }
              const resData = await response.json();
              return { success: true, data: resData };
          } else {
              const actualFile = value?.file;
              if (actualFile instanceof File) {

                  data.append(
                      "pfp",
                      actualFile,
                      actualFile.name ?? "avatar.jpg"
                  );

              } else if (typeof value?.uri === "string" && value.uri.startsWith("blob:")) {

                  const fetched = await fetch(value.uri);
                  const blob = await fetched.blob();

                  data.append("pfp", blob, value.fileName ?? "avatar.jpg");
              }
          }
      } else {
          const isObjectNotFile =
              typeof value === "object" &&
              !(typeof File !== "undefined" && value instanceof File) &&
              !(typeof Blob !== "undefined" && value instanceof Blob);

          data.append(
              key,
              isObjectNotFile ? JSON.stringify(value) : String(value)
          );
      }
    }

    let resData;

    if (Platform.OS !== "web") {
      // axios fails sending Blob FormData on react native, so use fetch directly
      const token = await apiClient.defaults.headers?.common?.["Authorization"]
          ?? apiClient.defaults.headers?.["Authorization"];

      const baseURL = apiClient.defaults.baseURL ?? "";

      const response = await fetch(`${baseURL}/users/${id}`, {
          method: "PUT",
          headers: {
              ...(token ? { Authorization: String(token) } : {}),
          },
          body: data,
      });

      if (!response.ok) {
          const text = await response.text();
          throw new Error(`${response.status}: ${text}`);
      }
      resData = await response.json();
  } else {
      const res = await apiClient.put(`/users/${id}`, data);
      resData = res.data;
  }

  console.log("[userProfileService] Success, pfp_url:", resData?.pfp_url);
  return { success: true, data: resData };

  } catch (err) {
    console.error("[userProfileService] Error:", err.message, err.response?.data);
    return {
      success: false,
      serverError: err.response?.data?.message || "Internal Server Error",
    };
  }
},

  // change password
  changePassword: async (userId, oldPassword, newPassword) => {
    try {
      const res = await apiClient.put(`/users/${userId}/change-password`, {
        old_password: oldPassword,
        new_password: newPassword,
      });
      return { success: true, data: res.data };
    } catch (err) {
      console.log(
        "Change password error:",
        err.response?.status,
        err.response?.data,
      );
      return {
        success: false,
        status: err.response?.status,
        message: err.response?.data?.message,
      };
    }
  },
};
