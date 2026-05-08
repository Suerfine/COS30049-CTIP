import apiClient from "../config/apiConfig";
import { API_ENDPOINTS } from "../config/ApiEndpoints";

export const ElementService={
    // GET: Fetch all elements
    getAll: async(courseId, moduleId, pageId)=>{
        try{
            const url=API_ENDPOINTS.COURSE.ELEMENTS(courseId, moduleId,pageId);
            const response=await apiClient.get(url);
            return response.data;
        }catch(error){
            console.error("Fetch Elements Error:", error);
            const errorMessage = error.response?.data?.message || "Internal Server Error";
            return Promise.reject(errorMessage);
        }
    },

    // POST: create a new element
    create: async(courseId, moduleId, pageId, payload)=>{
        const url=API_ENDPOINTS.COURSE.ELEMENTS(courseId, moduleId, pageId);
        const response=await apiClient.post(url, payload);
        return response.data;
    }
}