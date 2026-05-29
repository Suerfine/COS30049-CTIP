import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import notificationService from '../services/NotificationService';

export const useNotification = () => {
    const { t } = useTranslation();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const isFirstLoad = useRef(true);
    const isFetchingRef = useRef(false);

    const fetchNotifications = useCallback(async ({ silent = false } = {}) => {
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;

        if (isFirstLoad.current && !silent) {
            setLoading(true);
        }
        
        setError(null);
        try {
            const data = await notificationService.getMyNotifications({ size: 100 });
            const pending = (data.data || []).filter(n => !n.dismissed_at);
            setNotifications(pending);
        } catch (err) {
            setError(err || 'Failed to fetch notifications');
        } finally {
            setLoading(false);
            isFirstLoad.current = false;
            isFetchingRef.current = false;
        }
    }, []);

    const handleDismiss = async (notificationId) => {
        try {
            await notificationService.dismissNotification(notificationId);
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
        } catch (err) {
            Alert.alert(t('error'), err || 'Dismiss failed');
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Start the timer (e.g., every 10 seconds)
        const interval = setInterval(() => {
            fetchNotifications({ silent: true });
        }, 5000);

        // Stop the timer when the user navigates away or closes the app
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    return {
        notifications,
        loading,
        error,
        fetchNotifications,
        handleDismiss
    };
};
