import apiClient from '../config/apiConfig';
import { API_ENDPOINTS } from '../config/ApiEndpoints';

export const notificationService = {
  // Get user's own notifications
  getMyNotifications: async (params = {}) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.NOTIFICATION.MY_NOTIFICATIONS, {
        params: {
          page: params.page || 1,
          size: params.size || 20,
          filter: params.filter || '',
          orderBy: params.orderBy || 'created_at desc',
        },
      });
      return response.data;
    } catch (err) {
      console.error('Fetch My Notifications Error: ', err);
      const errorMessage = err.response?.data?.message || 'Failed to fetch notifications.';
      return Promise.reject(errorMessage);
    }
  },

  getPreferences: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.NOTIFICATION.PREFERENCES);
      return response.data;
    } catch (err) {
      console.error('Fetch Notification Preferences Error: ', err);
      const errorMessage = err.response?.data?.message || 'Failed to fetch notification preferences.';
      return Promise.reject(errorMessage);
    }
  },

  updatePreferences: async (preferences) => {
    try {
      const response = await apiClient.put(API_ENDPOINTS.NOTIFICATION.PREFERENCES, {
        preferences,
      });
      return response.data;
    } catch (err) {
      console.error('Update Notification Preferences Error: ', err);
      const errorMessage = err.response?.data?.message || 'Failed to update notification preferences.';
      return Promise.reject(errorMessage);
    }
  },

  // Get all notifications (admin)
  getAllNotifications: async (params = {}) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.NOTIFICATION.LIST, {
        params: {
          page: params.page || 1,
          size: params.size || 20,
          filter: params.filter || '',
          orderBy: params.orderBy || 'created_at desc',
        },
      });
      return response.data;
    } catch (err) {
      console.error('Fetch All Notifications Error: ', err);
      const errorMessage = err.response?.data?.message || 'Failed to fetch all notifications.';
      return Promise.reject(errorMessage);
    }
  },

  // Get notification by ID
  getById: async (id) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.NOTIFICATION.DETAIL(id));
      return response.data;
    } catch (err) {
      console.error('Fetch Notification Error: ', err);
      const errorMessage = err.response?.data?.message || 'Failed to fetch notification.';
      return Promise.reject(errorMessage);
    }
  },

  // Update notification (e.g., edit content)
  update: async (id, data) => {
    try {
      const response = await apiClient.put(
        API_ENDPOINTS.NOTIFICATION.UPDATE(id),
        data
      );
      return response.data;
    } catch (err) {
      console.error('Update Notification Error: ', err);
      const errorMessage = err.response?.data?.message || 'Failed to update notification.';
      return Promise.reject(errorMessage);
    }
  },

  // Dismiss a notification
  dismissNotification: async (id, data = {}) => {
    try {
      const response = await apiClient.put(
        API_ENDPOINTS.NOTIFICATION.DISMISS(id),
        data
      );
      return response.data;
    } catch (err) {
      console.error('Dismiss Notification Error: ', err);
      const errorMessage = err.response?.data?.message || 'Failed to dismiss notification.';
      return Promise.reject(errorMessage);
    }
  },

  // Delete notification
  delete: async (id) => {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.NOTIFICATION.DELETE(id));
      return response.data;
    } catch (err) {
      console.error('Delete Notification Error: ', err);
      const errorMessage = err.response?.data?.message || 'Failed to delete notification.';
      return Promise.reject(errorMessage);
    }
  },
};

export default notificationService;
