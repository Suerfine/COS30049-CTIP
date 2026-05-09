import apiClient from "../config/apiConfig";
import { API_ENDPOINTS } from "../config/ApiEndpoints";

export const userDashboardService = {
    getCourses: async () => {
        const response = await apiClient.get(API_ENDPOINTS.COURSE.LIST);
        return response.data;
    },

    // get first name, email, telefon, id, pfp
    getUserProfile: async () => {
        try{
            const response=await apiClient.get(API_ENDPOINTS.USER.ME);
            return response.data;
        }catch(err){
            console.error("Get user profile error:", err);
            throw err;
        }
    },

    // get joined at date
    getAccount: async()=>{
        try{
            const response=await apiClient.get(API_ENDPOINTS.USER.ACCOUNT);
            return Array.isArray(response.data) ? response.data[0] : response.data;
        }catch(err){
            const message=err.response?.data?.message || "Failed to fetch acc details";
            console.error("Get account error:", message);
            throw new Error(message);
        }
    }
};