import React, { useEffect } from 'react';
import { View, Text, Pressable, Switch, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import ModalLayout from './ModalLayout';
import { ModalStyle as styles} from './ModalStyle';
import notificationService from '../services/NotificationService';

const DEFAULT_NOTIFICATION_SETTINGS = {
    discussion: true,
    todo_reminder: true,
    anomaly_alert: true,
    registration_review: true,
    payment_approval: true,
    enrollment_success: true,
    badge_awarded: true,
    course_expiry: true,
};

const NotificationModal = ({ visible, onClose }) => {
    const {t, i18n}=useTranslation();

    const [settings, setSettings] = useState(DEFAULT_NOTIFICATION_SETTINGS);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!visible) return;

        let isMounted = true;
        setLoading(true);
        setError('');

        notificationService.getPreferences()
            .then((response) => {
                if (!isMounted) return;
                setSettings({
                    ...DEFAULT_NOTIFICATION_SETTINGS,
                    ...(response?.preferences || {}),
                });
            })
            .catch((err) => {
                if (!isMounted) return;
                setError(typeof err === 'string' ? err : t('failed to load notification settings'));
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [visible, t]);

    if (!visible) return null;

    const toggle = (key) => {
        setSettings(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const notificationItems = [
        { key: 'discussion', label: t('discussion_notifications') },
        { key: 'todo_reminder', label: t('todo start reminders') },
        { key: 'anomaly_alert', label: t('anomaly alerts') },
        { key: 'registration_review', label: t('registration review alerts') },
        { key: 'payment_approval', label: t('payment approval alerts') },
        { key: 'enrollment_success', label: t('enrollment success alerts') },
        { key: 'badge_awarded', label: t('badge notifications') },
        { key: 'course_expiry', label: t('course expiry reminders') },
    ];

    const handleConfirm = async () => {
        setSaving(true);
        setError('');
        try {
            await notificationService.updatePreferences(settings);
            onClose();
        } catch (err) {
            setError(typeof err === 'string' ? err : t('failed to save notification settings'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <ModalLayout visible={visible} onClose={onClose}>
            <View style={styles.container}>
                {/* Header */}
                <View style={[styles.row, styles.header]}>
                    <Text style={styles.title}>{t('notification')}</Text>
                    <Pressable onPress={onClose} hitSlop={10}>
                        <X size={24} color="#333" />
                    </Pressable>
                </View>

                {/* Content */}
                <View style={localStyles.settingList}>
                    {loading ? (
                        <Text style={localStyles.helperText}>{t('loading')}</Text>
                    ) : null}
                    {error ? (
                        <Text style={localStyles.errorText}>{error}</Text>
                    ) : null}
                    {notificationItems.map((item) => (
                        <View key={item.key} style={localStyles.settingRow}>
                            <Text style={localStyles.settingLabel}>{item.label}</Text>
                            <Switch
                                trackColor={{ false: "#e0e0e0", true: '#2f6618fe' }}
                                thumbColor="#fff"
                                value={settings[item.key]}
                                disabled={loading || saving}
                                onValueChange={() => toggle(item.key)}
                            />
                        </View>
                    ))}
                </View>

                <Pressable style={[styles.Btn, { alignSelf: 'flex-start', backgroundColor: '#2f6618fe' }]} onPress={handleConfirm} disabled={saving || loading}>
                    <Text style={{ color: 'white' }}>{saving ? t('saving') : t('confirm')}</Text>
                </Pressable>
            </View>
        </ModalLayout>
        );
    };

const localStyles = StyleSheet.create({
    settingList: {
        marginTop: 5,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    settingLabel: {
        flex: 1,
        paddingRight: 16,
        fontSize: 15,
        color: '#444',
        fontWeight: '500',
    },
    helperText: {
        color: '#666',
        marginBottom: 8,
    },
    errorText: {
        color: '#b42318',
        fontWeight: '600',
        marginBottom: 8,
    },
});
export default NotificationModal;
