import apiClient from "../config/apiConfig";

export const eventService = {
    getEvents: async () => {
        try {
            const response = await apiClient.get('/events');
            return response.data;
        } catch (err) {
            console.error("Fetch Events Error:", err);
            const errorMessage = err.response?.data?.message || "Failed to fetch events.";
            return Promise.reject(errorMessage);
        }
    },
    createEvent: async (payload) => {
        try {
            const response = await apiClient.post('evnets', payload);
            return response.data;
        } catch (err) {
            console.error("Create Event Error:", err);
            const errorMessage = err.response?.data?.message || "Failed to create event.";
            return Promise.reject(errorMessage);
        }
    },
};