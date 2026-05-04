import apiClient from "../config/apiConfig";
import { API_ENDPOINTS } from "../config/ApiEndpoints";

export const discussionService={
    getDiscussions:async(courseId)=>{
        const response=await apiClient.get(API_ENDPOINTS.DISCUSSION.LIST(courseId));
        return response.data;
    },
    getMessages:async(discussionId)=>{
        const response=await apiClient.get(API_ENDPOINTS.DISCUSSION.MESSAGES(discussionId));
        return response.data;
    },
    postMessage:async(discussionId, content)=>{
        const response=await apiClient.post(API_ENDPOINTS.DISCUSSION.MESSAGES(discussionId), {content});
        return response.data;
    }
};