import apiClient from "../config/apiConfig";
import { API_ENDPOINTS } from "../config/ApiEndpoints";

export const discussionService={
    getDiscussions: async (courseId) => {
        try {
            const response = await apiClient.get(API_ENDPOINTS.DISCUSSION.LIST(courseId));
            
            // Axios stores the backend response in response.data
            const payload = response.data;
            
            // If your backend used formatPaginateResponse, the array is in payload.data
            if (payload && payload.data && Array.isArray(payload.data)) {
                return payload.data; 
            }
            
            // Fallback if the backend sends a raw array
            return Array.isArray(payload) ? payload : [];
        } catch (error) {
            console.error("Service API Error:", error);
            return []; // Always return an array to prevent .length errors in UI
        }
    },
    createDiscussion: async (courseId, discussionData) => {
        const response = await apiClient.post(API_ENDPOINTS.DISCUSSION.LIST(courseId), discussionData);
        return response.data;
    },
    getMessages:async(discussionId)=>{
        const response=await apiClient.get(API_ENDPOINTS.DISCUSSION.MESSAGES(discussionId));
        return response.data;
    },
    postMessage: async (discussionId, content, fileUri = null) => {
        const formData = new FormData();
        formData.append('content', content);

        if (fileUri) {
            const filename = fileUri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image`;

            formData.append('attachment', {
                uri: fileUri,
                name: filename,
                type: type,
            });
        }

        const response = await apiClient.post(
            API_ENDPOINTS.DISCUSSION.MESSAGES(discussionId),
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        return response.data;
    }
};