import apiClient from '../config/apiConfig';
import { API_ENDPOINTS } from '../config/ApiEndpoints';

export const progressService = {
    getCourseProgress: async (courseId) => {
        const response = await apiClient.get(API_ENDPOINTS.PROGRESS.COURSE(courseId));
        return response.data;
    },
    getModuleProgress: async (moduleId, courseId) => {
        const response = await apiClient.get(API_ENDPOINTS.PROGRESS.MODULE(moduleId, courseId));
        return response.data;
    },
    getElementProgress: async (elementId) => {
        const response = await apiClient.get(API_ENDPOINTS.PROGRESS.ELEMENT(elementId));
        return response.data;
    }
};