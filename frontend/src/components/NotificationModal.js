import React from 'react';
import { View, Text, Pressable, Switch, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import ModalLayout from './ModalLayout';
import { ModalStyle as styles} from './ModalStyle';

const NotificationModal = ({ visible, onClose }) => {
    const {t, i18n}=useTranslation();

    const [settings, setSettings] = useState({
        todo: true,
        workshop: false,
        courses: true,
    });

    if (!visible) return null;

    const toggle = (key) => {
        setSettings(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const notificationItems = [
        { key: 'todo', label: t('todo notifications') },
        { key: 'workshop', label: t('workshop reminders') },
        { key: 'courses', label: t('course deadlines') }
    ];

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
                    {notificationItems.map((item) => (
                        <View key={item.key} style={localStyles.settingRow}>
                            <Text style={localStyles.settingLabel}>{item.label}</Text>
                            <Switch
                                trackColor={{ false: "#e0e0e0", true: '#2f6618fe' }}
                                thumbColor="#fff"
                                value={settings[item.key]}
                                onValueChange={() => toggle(item.key)}
                            />
                        </View>
                    ))}
                </View>

                <Pressable style={[styles.Btn, { alignSelf: 'flex-start', backgroundColor: '#2f6618fe' }]} onPress={onClose}>
                    <Text style={{ color: 'white' }}>{t('confirm')}</Text>
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
        fontSize: 15,
        color: '#444',
        fontWeight: '500',
    },
});
export default NotificationModal;