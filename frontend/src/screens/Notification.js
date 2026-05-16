import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Platform } from 'react-native';
import { X, RotateCcw } from 'lucide-react-native'; 
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useNotification } from '../hooks/useNotification';
import { useAuth } from '../context/AuthContext';
import { navigateNotification } from '../utils/navigateNotification';
import SFCFooter from '../components/Footer';

const Notification = () => {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const { currentUser } = useAuth();
    const { 
        notifications, 
        loading, 
        fetchNotifications, 
        handleDismiss 
    } = useNotification();

    const handleOpenNotification = (notification) => {
        navigateNotification(navigation, notification.url, currentUser);
    };

    return (
        <>
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>My Notifications</Text>
                <Pressable onPress={fetchNotifications} disabled={loading} style={styles.refreshBtn}>
                    <RotateCcw size={20} color="#666" />
                </Pressable>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#2f6618fe" />
                </View>
            ) : notifications.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Text style={styles.emptyText}>{t('no notifications')}</Text>
                </View>
            ) : (
                <ScrollView style={styles.content}>
                    {notifications.map((notification) => (
                        <Pressable
                            key={notification.id}
                            onPress={() => handleOpenNotification(notification)}
                            style={({ hovered, pressed }) => [
                                styles.notificationItem,
                                hovered && styles.notificationItemHover,
                                pressed && styles.notificationItemPressed,
                            ]}
                        >
                            <View style={styles.notificationContent}>
                                <View style={styles.titleRow}>
                                    <Text style={styles.notificationTitle}>{notification.title}</Text>
                                </View>
                                
                                <Text style={styles.notificationMessage}>{notification.message}</Text>
                                
                                <Text style={styles.notificationDate}>
                                    {new Date(notification.created_at).toLocaleDateString()} at{' '}
                                    {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </View>

                            <View style={styles.notificationActions}>
                                <Pressable
                                    onPress={(event) => {
                                        event?.stopPropagation?.();
                                        handleDismiss(notification.id);
                                    }}
                                    style={({ hovered }) => [
                                        styles.dismissBtn,
                                        hovered && styles.dismissBtnHover
                                    ]}
                                    hitSlop={10}
                                >
                                    <X size={20} color="#9ca3af" />
                                </Pressable>
                            </View>
                        </Pressable>
                    ))}
                    
                </ScrollView>
            )}
            
        </View>
        {currentUser.role !== 'admin' && Platform === 'web' && (<SFCFooter/>)}
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
        paddingHorizontal: 40,
        paddingVertical: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 25,
        fontWeight: '600',
        color: '#111827',
    },
    refreshBtn: {
        padding: 5,
    },
    content: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: '#9ca3af',
        fontSize: 16,
    },
    notificationItem: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1, // Back to a thin border since it's not a button
        borderColor: '#e5e7eb',
        cursor: 'pointer',
    },
    notificationItemHover: {
        borderColor: '#b7d5b0',
        backgroundColor: '#fbfdfb',
    },
    notificationItemPressed: {
        opacity: 0.88,
    },
    notificationContent: {
        flex: 1,
        marginRight: 10,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
    },
    notificationMessage: {
        fontSize: 14,
        color: '#4b5563',
        marginBottom: 8,
        lineHeight: 20,
    },
    notificationDate: {
        fontSize: 12,
        color: '#9ca3af',
    },
    notificationActions: {
        paddingLeft: 10,
    },
    dismissBtn: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#f3f4f6',
        transitionDuration: '150ms',
    },
    dismissBtnHover: {
        backgroundColor: '#fee2e2', // Light red tint when hovering over the X
    },
});

export default Notification;
