import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    ActivityIndicator,
    SafeAreaView,
    StatusBar
} from 'react-native';
import { Bell, ArrowLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import notificationService from '../services/NotificationService';

const NotificationScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await notificationService.getMyNotifications({ size: 100 });
            setNotifications(data.data || []);
        } catch (err) {
            setError(err);
            console.error('Error fetching notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDismiss = async (notificationId) => {
        try {
            const now = new Date();
            await notificationService.dismissNotification(notificationId, {
                dismissed_at: now.toISOString(),
            });
            setNotifications(prev =>
                prev.filter(n => n.id !== notificationId)
            );
        } catch (err) {
            console.error('Error dismissing notification:', err);
        }
    };

    const renderNotificationItem = (notification) => (
        <View key={notification.id} style={styles.notificationItem}>
            <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
                <Text style={styles.notificationDate}>
                    {new Date(notification.created_at).toLocaleDateString()} at{' '}
                    {new Date(notification.created_at).toLocaleTimeString()}
                </Text>
                {notification.url && (
                    <Text style={styles.notificationUrl}>
                        Link: {notification.url}
                    </Text>
                )}
            </View>
            <View style={styles.notificationActions}>
                <Pressable
                    onPress={() => handleDismiss(notification.id)}
                    style={styles.actionBtn}
                >
                    <Text style={styles.actionBtnText}>{t('Dismiss')}</Text>
                </Pressable>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <Pressable
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <ArrowLeft size={24} color="#333" />
                </Pressable>
                <Text style={styles.headerTitle}>{t('notification')}</Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#2f6618fe" />
                    <Text style={styles.loadingText}>{t('loading')}...</Text>
                </View>
            ) : error ? (
                <View style={styles.centerContainer}>
                    <Bell size={40} color="#999" />
                    <Text style={styles.errorText}>{error}</Text>
                    <Pressable
                        onPress={fetchNotifications}
                        style={styles.retryBtn}
                    >
                        <Text style={styles.retryBtnText}>{t('retry')}</Text>
                    </Pressable>
                </View>
            ) : notifications.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Bell size={40} color="#ccc" />
                    <Text style={styles.emptyText}>{t('no notifications')}</Text>
                </View>
            ) : (
                <ScrollView style={styles.notificationList}>
                    {notifications.map(renderNotificationItem)}
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backButton: {
        padding: 8,
        borderRadius: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    headerSpacer: {
        width: 40,
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    errorText: {
        fontSize: 16,
        color: '#d9534f',
        marginTop: 10,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        marginTop: 10,
    },
    retryBtn: {
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#2f6618fe',
        borderRadius: 8,
    },
    retryBtnText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
    notificationList: {
        flex: 1,
        padding: 16,
    },
    notificationItem: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    notificationContent: {
        marginBottom: 12,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    notificationMessage: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        lineHeight: 20,
    },
    notificationDate: {
        fontSize: 12,
        color: '#999',
        marginBottom: 4,
    },
    notificationUrl: {
        fontSize: 12,
        color: '#2f6618fe',
        textDecorationLine: 'underline',
    },
    notificationActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    actionBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#2f6618fe',
        borderRadius: 6,
    },
    actionBtnText: {
        fontSize: 12,
        color: 'white',
        fontWeight: '500',
    },
    actionBtnDelete: {
        padding: 8,
        borderRadius: 6,
        backgroundColor: '#f8f9fa',
    },
});

export default NotificationScreen;