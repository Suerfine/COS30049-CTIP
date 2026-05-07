import apiClient from "../config/apiConfig";
import { API_ENDPOINTS } from "../config/ApiEndpoints";

export const discussionService={
    getDiscussions:async(courseId)=>{
        const response=await apiClient.get(API_ENDPOINTS.DISCUSSION.LIST(courseId));
        const payload = response.data;
        return Array.isArray(payload) ? payload : payload?.data ?? [];
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