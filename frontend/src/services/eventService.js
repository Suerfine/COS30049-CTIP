import apiClient from "../config/apiConfig";
import { API_ENDPOINTS } from "../config/ApiEndpoints";

export const eventService = {
    getEvents: async () => {
        try {
            const response = await apiClient.get(API_ENDPOINTS.EVENTS.BASE);
            return response.data;
        } catch (err) {
            console.error("Fetch Events Error:", err);
            const errorMessage = err.response?.data?.message || "Failed to fetch events.";
            return Promise.reject(errorMessage);
        }
    },
    createEvent: async (payload) => {
        try {
            const response = await apiClient.post(API_ENDPOINTS.EVENTS.BASE, payload);
            return response.data;
        } catch (err) {
            console.error("Create Event Error:", err);
            const errorMessage = err.response?.data?.message || "Failed to create event.";
            return Promise.reject(errorMessage);
        }
    },
    updateStatus: async (id, status) => {
        try {
            const response = await apiClient.patch(`${API_ENDPOINTS.EVENT.BASE}/${id}`, { status });
            return response.data;
        } catch (err) {
            console.error("Update Event Status Error:", err);
            return Promise.reject(err.response?.data?.message || "Failed to update event status.");
        }
    },
};