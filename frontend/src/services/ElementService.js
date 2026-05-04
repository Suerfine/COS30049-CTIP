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
        try {
            const url = API_ENDPOINTS.COURSE.ELEMENTS(courseId, moduleId, pageId);
            const response = await apiClient.post(url, payload);
            return response.data;
        } catch (error) {
            console.error("Create Element Error:", error);
            throw error.response?.data?.message || "Failed to create element";
        }
    },

    // PUT: update the element
    update: async (courseId, moduleId, pageId, elementId, payload) => {
        try {
            const url = `${API_ENDPOINTS.COURSE.ELEMENT_DETAIL(courseId, moduleId, pageId, elementId)}`;
            const response = await apiClient.put(url, payload);
            return response.data;
        } catch (error) {
            console.error("Update Element Error:", error);
            throw error.response?.data?.message || "Failed to update element";
        }
    },

    // DELETE: delete the element
    delete: async (courseId, moduleId, pageId, elementId) => {
        try {
            const url =  `${API_ENDPOINTS.COURSE.ELEMENT_DETAIL(courseId, moduleId, pageId, elementId)}`;
            const response = await apiClient.delete(url);
            return response.data;
        } catch (error) {
            console.error("Delete Element Error:", error);
            throw error.response?.data?.message || "Failed to delete element";
        }
    },

    // PUT: Update the order of the element
    updateOrder: async (courseId, moduleId, pageId, elementId, newOrder) => {
        try {
            const url = API_ENDPOINTS.COURSE.ELEMENT_DETAIL(courseId, moduleId, pageId, elementId);
            const response = await apiClient.put(url, { order: newOrder });
            return response.data;
        } catch (error) {
            console.error("Update Order Error:", error);
            throw error.response?.data?.message || "Failed to update order";
        }
    },
}