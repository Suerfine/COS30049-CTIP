import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    Alert,
} from 'react-native';
import { Trash2, ArrowLeft, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import notificationService from '../services/NotificationService';

const AdminNotificationScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('all');
    const [notifications, setNotifications] = useState([]);
    const [notificationStatus, setNotificationStatus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchNotifications();
    }, [activeTab]);

    const fetchNotifications = async () => {
        setLoading(true);
        setError(null);
        try {
            if (activeTab === 'all') {
                const data = await notificationService.getMyNotifications({ size: 100 });
                setNotifications(data.data || []);
            } else {
                // For status tab, also fetch all notifications
                const data = await notificationService.getMyNotifications({ size: 100 });
                setNotificationStatus(data.data || []);
            }
        } catch (err) {
            setError(err);
            console.error('Error fetching notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (notificationId) => {
        Alert.alert(
            t('confirm delete'),
            t('are you sure you want to delete this notification?'),
            [
                { text: t('cancel'), onPress: () => {}, style: 'cancel' },
                {
                    text: t('delete'),
                    onPress: async () => {
                        try {
                            await notificationService.delete(notificationId);
                            setNotifications(prev =>
                                prev.filter(n => n.id !== notificationId)
                            );
                            setNotificationStatus(prev =>
                                prev.filter(n => n.id !== notificationId)
                            );
                        } catch (err) {
                            console.error('Error deleting notification:', err);
                            Alert.alert(t('error'), err);
                        }
                    },
                    style: 'destructive',
                },
            ]
        );
    };

    const getDismissalStatus = (notification) => {
        if (notification.dismissed_at) {
            return `${t('dismissed')} - ${new Date(notification.dismissed_at).toLocaleString()}`;
        }
        return t('pending');
    };

    const renderAllNotificationsTab = () => (
        <ScrollView style={styles.tabContent}>
            {notifications.map((notification) => (
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
                            onPress={() => handleDelete(notification.id)}
                            style={styles.actionBtnDelete}
                        >
                            <Trash2 size={18} color="#d9534f" />
                        </Pressable>
                    </View>
                </View>
            ))}
        </ScrollView>
    );

    const renderStatusTab = () => (
        <ScrollView style={styles.tabContent}>
            {notificationStatus.map((notification) => (
                <View key={notification.id} style={styles.statusItem}>
                    <View style={styles.notificationContent}>
                        <Text style={styles.notificationTitle}>{notification.title}</Text>
                        <Text style={styles.notificationMessage}>{notification.message}</Text>
                        <Text style={styles.statusBadge}>
                            {getDismissalStatus(notification)}
                        </Text>
                    </View>
                    <View style={styles.notificationActions}>
                        <Pressable
                            onPress={() => handleDelete(notification.id)}
                            style={styles.actionBtnDelete}
                        >
                            <Trash2 size={18} color="#d9534f" />
                        </Pressable>
                    </View>
                </View>
            ))}
        </ScrollView>
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
                <Text style={styles.headerTitle}>{t('manage notifications')}</Text>
                <Pressable
                    onPress={() => navigation.navigate('CreateNotification')}
                    style={styles.createButton}
                >
                    <Plus size={24} color="#2f6618fe" />
                </Pressable>
            </View>

            {/* Tab Navigation */}
            <View style={styles.tabNav}>
                <Pressable
                    style={[styles.tab, activeTab === 'all' && styles.tabActive]}
                    onPress={() => setActiveTab('all')}
                >
                    <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
                        {t('all notifications')}
                    </Text>
                </Pressable>
                <Pressable
                    style={[styles.tab, activeTab === 'status' && styles.tabActive]}
                    onPress={() => setActiveTab('status')}
                >
                    <Text style={[styles.tabText, activeTab === 'status' && styles.tabTextActive]}>
                        {t('dismissal status')}
                    </Text>
                </Pressable>
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#2f6618fe" />
                    <Text style={styles.loadingText}>{t('loading')}...</Text>
                </View>
            ) : error ? (
                <View style={styles.centerContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <Pressable
                        onPress={fetchNotifications}
                        style={styles.retryBtn}
                    >
                        <Text style={styles.retryBtnText}>{t('retry')}</Text>
                    </Pressable>
                </View>
            ) : activeTab === 'all' ? (
                notifications.length === 0 ? (
                    <View style={styles.centerContainer}>
                        <Text style={styles.emptyText}>{t('no notifications')}</Text>
                    </View>
                ) : (
                    renderAllNotificationsTab()
                )
            ) : (
                notificationStatus.length === 0 ? (
                    <View style={styles.centerContainer}>
                        <Text style={styles.emptyText}>{t('no notifications')}</Text>
                    </View>
                ) : (
                    renderStatusTab()
                )
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
        flex: 1,
        marginLeft: 12,
    },
    createButton: {
        padding: 8,
        borderRadius: 8,
    },
    tabNav: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: '#2f6618fe',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#999',
    },
    tabTextActive: {
        color: '#2f6618fe',
    },
    tabContent: {
        flex: 1,
        padding: 16,
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
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statusItem: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    notificationContent: {
        flex: 1,
        marginRight: 12,
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
    statusBadge: {
        fontSize: 12,
        color: '#2f6618fe',
        fontWeight: '500',
        marginTop: 8,
    },
    notificationActions: {
        justifyContent: 'center',
    },
    actionBtnDelete: {
        padding: 8,
        borderRadius: 6,
    },
});

export default AdminNotificationScreen;
