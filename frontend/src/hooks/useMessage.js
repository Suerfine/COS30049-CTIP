import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import messageService from '../services/messageService';

export const useMessage = (discussionId) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    size: 20,
    totalElements: 0,
    totalPages: 0,
  });

  const fetchMessages = useCallback(
    async (params = {}) => {
      if (!discussionId) return;
      setLoading(true);
      setError(null);

      try {
        const response = await messageService.getMessages(discussionId, {
          page: 1,
          size: 20,
          ...params,
        });

        const data = response?.data ?? [];
        setMessages(Array.isArray(data) ? data : []);
        setPagination({
          page: response?.page ?? params.page ?? 1,
          size: response?.size ?? params.size ?? 20,
          totalElements: response?.totalElements ?? 0,
          totalPages: response?.totalPages ?? 0,
        });
      } catch (err) {
        console.error('Failed to load messages:', err);
        setError(err || t('failed_to_load_messages'));
      } finally {
        setLoading(false);
      }
    },
    [discussionId, t],
  );

  const sendMessage = useCallback(
    async (content, targetDiscussionId = discussionId) => {
      if (!targetDiscussionId) return null;
      try {
        const message = await messageService.createMessage(targetDiscussionId, { content });
        setMessages((prev) => [message, ...prev]);
        return message;
      } catch (err) {
        console.error('Failed to send message:', err);
        Alert.alert(t('error'), err || 'Failed to send message.');
        return null;
      }
    },
    [discussionId, t],
  );

  const updateMessage = useCallback(
    async (messageId, content) => {
      try {
        const updated = await messageService.updateMessage(messageId, { content });
        setMessages((prev) =>
          prev.map((msg) => (msg.id === messageId ? updated : msg)),
        );
        return updated;
      } catch (err) {
        console.error('Failed to update message:', err);
        Alert.alert(t('error'), err || 'Failed to update message.');
        return null;
      }
    },
    [t],
  );

  const deleteMessage = useCallback(
    async (messageId) => {
      try {
        await messageService.deleteMessage(messageId);
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
        return true;
      } catch (err) {
        console.error('Failed to delete message:', err);
        Alert.alert(t('error'), err || 'Failed to delete message.');
        return false;
      }
    },
    [t],
  );

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return {
    messages,
    loading,
    error,
    pagination,
    fetchMessages,
    sendMessage,
    updateMessage,
    deleteMessage,
  };
};
