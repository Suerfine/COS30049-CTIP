// import { API_BASE_URL } from "../config/DummyapiConfig";
import apiClient from "../config/apiConfig";
import { API_ENDPOINTS } from "../config/ApiEndpoints";

// const BASE_URL = `${API_BASE_URL}/api`;

export const userDashboardService = {

    // getProgress: async () => {
    //     const res = await fetch(`${BASE_URL}/progress`);
    //     return await res.json();
    // },

    // getCourses: async () => {
    //     const res = await fetch(`${BASE_URL}/courses`);
    //     return await res.json();
    // },

    // getTodos: async () => {
    //     const res = await fetch(`${BASE_URL}/todos`);
    //     return await res.json();
    // },

    getProgress: async () => {
        const response = await apiClient.get('/progress');
        return response.data;
    },

    getCourses: async () => {
        const response = await apiClient.get(API_ENDPOINTS.COURSE.LIST);
        return response.data;
    },

    getTodos: async () => {
        const response = await apiClient.get('/todos');
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