import apiClient from "../config/apiConfig";
import { API_ENDPOINTS } from "../config/ApiEndpoints";
import { UserRoles } from "../enum/UserRoles";
import { formatDate } from "../utils/formatDate";

export const AccountService = {
  // GET: fetch all accounts
  getAll: async (
    page = 1,
    size = 10,
    searchQuery = "",
    sortConfig,
    role = "All",
  ) => {
    try {
      const q = searchQuery.trim();
      const params = { page, size };
      let filters = [];
      if (q) {
        filters.push(`
                    firstname like "%${q}%"
                    or lastname like "%${q}%"
                    or identification like "%${q}%"
                    or personal_email like "%${q}%"
                    or tel like "%${q}%"
                    or username like "%${q}%"
                    `);
      }

      if (role && role !== "All") {
        const roleMap = {
          Admin: "admin",
          "Park Guide": "park_guide",
        };
        const dbRole = roleMap[role] || role.toLowerCase();
        filters.push(`role eq "${dbRole}"`);
      }

      if (filters.length > 0) {
        params.filter = filters.join(" and ");
      }

      if (sortConfig?.key) {
        params.orderBy = `${sortConfig.key} ${sortConfig.direction}`;
      }
      const response = await apiClient.get(API_ENDPOINTS.USER.ACCOUNT, {
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Get Account Error:", error);
      throw error;
    }
  },
  // POST: create new account
  create: async (userData) => {
    try {
      const randomNum = Math.floor(100 + Math.random() * 900);
      const generatedUsername = `${userData.fname.replace(/\s+/g, "").toLowerCase()}${randomNum}`;

      const payload = {
        username: generatedUsername,
        firstname: userData.fname,
        lastname: userData.lname,
        identification: userData.ic,
        personal_email: userData.email,
        tel: userData.telefon,
        role:
          userData.role == "parkguide" ? UserRoles.PARK_GUIDE : UserRoles.ADMIN,
        pfp: userData.image || null,
        password: userData.role == "parkguide" ? `SFC@${randomNum}` : "admin",
      };

      const response = await apiClient.post(
        API_ENDPOINTS.USER.ACCOUNT,
        payload,
      );
      return response.data;
    } catch (error) {
      console.error("Create Account Error:", error);
      const errorMessage =
        error.response?.data?.message || "Internal Server Error";
      return Promise.reject(errorMessage);
    }
  },

  // PUT: update user
  update: async (id, userData) => {
    try {
      const payload = {
        firstname: userData.firstname,
        lastname: userData.lastname,
        username: userData.username,
        identification: userData.identification,
        tel: userData.tel,
        personal_email: userData.personal_email,
        pfp: userData.profileImage || null,
      };
      const response = await apiClient.put(
        API_ENDPOINTS.USER.UPDATE(id),
        payload,
      );
      return response.data;
    } catch (error) {
      console.error("Update Account Error: ", error);
      const errorMessage =
        error.response?.data?.message || "Failed to update user details.";
      return Promise.reject(errorMessage);
    }
  },

  // DELETE: delete user
  delete: async (id) => {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.USER.UPDATE(id));
      return response.data;
    } catch (error) {
      console.error("Delete account error: ", error);
      const errorMessage =
        error.response?.data?.message || "Failed to delete user account.";
      return Promise.reject(errorMessage);
    }
  },

  searchByUsername: async (name, limit = 5) => {
    try {
      // This matches your backend route: req.params.name and req.params.limit
      const response = await apiClient.get(
        `${API_ENDPOINTS.USER.ACCOUNT}/search/${name}/${limit}`,
      );
      return response.data;
    } catch (error) {
      console.error("Search Mentions Error:", error);
      return [];
    }
  },

  // PUT: update user profile picture
  updateProfilePicture: async (id, imageFile) => {
    try {
      const formData = new FormData();

      if (imageFile.uri) {
        // React Native image object - fetch as blob
        const response = await fetch(imageFile.uri);
        const blob = await response.blob();
        const fileName = imageFile.fileName || "avatar.jpg";
        formData.append("pfp", blob, fileName);
      } else if (imageFile instanceof File) {
        // Web File object
        formData.append("pfp", imageFile);
      } else if (imageFile.file instanceof File) {
        // Web file object with file property
        formData.append("pfp", imageFile.file, imageFile.name);
      }

      const response = await apiClient.put(
        API_ENDPOINTS.USER.UPDATE(id),
        formData,
      );
      return response.data;
    } catch (error) {
      console.error("Update Profile Picture Error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to update profile picture.";
      return Promise.reject(errorMessage);
    }
  },
};
