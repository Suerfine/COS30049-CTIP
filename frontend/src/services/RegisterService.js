import apiClient from "../config/apiConfig";
import { API_ENDPOINTS } from "../config/ApiEndpoints";
import { appendFile } from "../utils/AppendFile";

const base64Alphabet =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

const arrayBufferToBase64 = (arrayBuffer) => {
  const bytes = new Uint8Array(arrayBuffer);
  let result = "";

  for (let index = 0; index < bytes.length; index += 3) {
    const byte1 = bytes[index];
    const byte2 = bytes[index + 1];
    const byte3 = bytes[index + 2];

    const triplet = ((byte1 || 0) << 16) | ((byte2 || 0) << 8) | (byte3 || 0);

    result += base64Alphabet[(triplet >> 18) & 63];
    result += base64Alphabet[(triplet >> 12) & 63];
    result +=
      index + 1 < bytes.length ? base64Alphabet[(triplet >> 6) & 63] : "=";
    result += index + 2 < bytes.length ? base64Alphabet[triplet & 63] : "=";
  }

  return result;
};

export const RegisterService = {
  // GET: fetch all registration
  getAll: async (
    page = 1,
    size = 10,
    searchQuery = "",
    sortConfig,
    status = "All",
  ) => {
    try {
      const q = searchQuery.trim();
      const params = { page, size };
      let filters = [];
      if (q) {
        filters.push(`(
            firstname like "%${q}%"
            or lastname like "%${q}%"
            or identification like "%${q}%"
            or personal_email like "%${q}%"
            or tel like "%${q}%"
        )`);
      }

      if (status && status !== "All") {
        filters.push(`status eq "${status.toLowerCase()}"`);
      }

      if (filters.length > 0) {
        params.filter = filters.join(" and ");
      }

      if (sortConfig?.key) {
        params.orderBy = `${sortConfig.key} ${sortConfig.direction}`;
      } else {
        params.orderBy = "created_at desc";
      }

      const response = await apiClient.get(API_ENDPOINTS.USER.SIGNUP, {
        params,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch registration records",
      );
    }
  },

  // POST: Create new registration
  registerUser: async (userData) => {
    try {
      console.log(userData.file);
      const formData = new FormData();

      formData.append("firstname", userData.fname);
      formData.append("lastname", userData.lname);
      formData.append("identification", userData.ic);
      formData.append("personal_email", userData.email);
      formData.append("tel", userData.telephone);
      appendFile(formData, "file", userData.file);

      //   appendFile(formData, userData.file, "file");

      // DEBUG: Log FormData entries to verify correct construction
      console.log("FormData entries:");
      for (let pair of formData.entries()) {
        console.log(pair[0] + ": " + pair[1]);
      }

      const response = await apiClient.post(
        API_ENDPOINTS.USER.SIGNUP,
        formData,
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "multipart/form-data",
          },
        },
      );
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || "Registration failed.";
      throw new Error(message);
    }
  },

  // POST: approve account
  approve: async (id) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.ADMIN.APPROVE(id));
      return response.data;
    } catch (err) {
      const message =
        err.response?.data?.message || "Check console for server error";
      console.error("Approve Error Status:", err.response?.status);
      throw new Error(message);
    }
  },

  // POST: reject registration
  reject: async (id, reason) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.ADMIN.REJECT(id), {
        message: reason,
      });
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to reject registration";
      return Promise.reject(message);
    }
  },

  // GET: registration resume/document as a data URI
  getResumeFile: async (id) => {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.REGISTRATION.DOCUMENT(id),
        {
          responseType: "arraybuffer",
        },
      );

      const contentType =
        response.headers?.["content-type"] || "application/pdf";
      const base64 = arrayBufferToBase64(response.data);

      return {
        uri: `data:${contentType};base64,${base64}`,
        contentType,
      };
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to retrieve resume file",
      );
    }
  },
};
