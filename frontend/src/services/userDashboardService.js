import { API_BASE_URL } from "../config/DummyapiConfig";
import { API_ENDPOINTS } from "../config/apiConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = `${API_BASE_URL}/api`;

export const userDashboardService = {
    getUserType: async () => {
        const res = await fetch(`${BASE_URL}/userType`);
        return await res.json();
    },

    getProgress: async () => {
        const res = await fetch(`${BASE_URL}/progress`);
        return await res.json();
    },

    getCourses: async () => {
        const res = await fetch(`${BASE_URL}/courses`);
        return await res.json();
    },

    getTodos: async () => {
        const res = await fetch(`${BASE_URL}/todos`);
        return await res.json();
    },

    // get first name, email, telefon, id, pfp
    getUserProfile: async () => {
        try{
            const token = await AsyncStorage.getItem("accessToken");

            const response = await fetch(`${API_ENDPOINTS.USER.ACCOUNT}/me`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch user profile');
                console.warn("User API failed:", response.status);
            }

            return data;
        }catch(err){
            console.error("Get user profile error:", err);
            throw err;
        }
    },

    // get joined at date
    getAccount: async () => {
    const res = await fetch(`${BASE_URL}/accounts`);
    const data = await res.json();
    
    // assuming single account (index 0)
    return data[0]; 
}
};