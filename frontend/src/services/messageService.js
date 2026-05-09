import apiClient from '../config/apiConfig';
import { API_ENDPOINTS } from '../config/ApiEndpoints';

export const messageService = {
  getMessages: async (discussionId, params = {}) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.DISCUSSION.MESSAGES(discussionId), {
        params: {
          page: params.page || 1,
          size: params.size || 20,
          orderBy: params.orderBy || 'created_at desc',
          filter: params.filter || '',
          isDeleted: params.isDeleted || false,
        },
      });
      return response.data;
    } catch (err) {
      console.error('Fetch Messages Error: ', err);
      const errorMessage = err.response?.data?.message || 'Failed to fetch messages.';
      return Promise.reject(errorMessage);
    }
  },

  createMessage: async (discussionId, messageData) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.DISCUSSION.MESSAGES(discussionId), messageData);
      return response.data;
    } catch (err) {
      console.error('Create Message Error: ', err);
      const errorMessage = err.response?.data?.message || 'Failed to create message.';
      return Promise.reject(errorMessage);
    }
  },

  updateMessage: async (messageId, messageData) => {
    try {
      const response = await apiClient.put(API_ENDPOINTS.MESSAGE.DETAIL(messageId), messageData);
      return response.data;
    } catch (err) {
      console.error('Update Message Error: ', err);
      const errorMessage = err.response?.data?.message || 'Failed to update message.';
      return Promise.reject(errorMessage);
    }
  },

  deleteMessage: async (messageId) => {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.MESSAGE.DETAIL(messageId));
      return response.data;
    } catch (err) {
      console.error('Delete Message Error: ', err);
      const errorMessage = err.response?.data?.message || 'Failed to delete message.';
      return Promise.reject(errorMessage);
    }
  },
};

export default messageService;
