import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import ModalLayout from './ModalLayout';
import { ModalStyle as styles} from './ModalStyle';

const LanguageModal = ({ visible, onClose, language, onSelect }) => {
    const {t, i18n}=useTranslation();

    if (!visible) return null;

    const options = [
        { label: 'English', sub: 'BI', val: 'English' },
        { label: 'Bahasa Melayu', sub: 'BM', val: 'Bahasa Melayu' }
    ];

    return (
        <ModalLayout visible={visible} onClose={onClose}>
            <View style={styles.container}>
                {/* Header */}
                <View style={[styles.row, styles.header]}>
                    <Text style={styles.title}>{t('language')}</Text>
                    <Pressable onPress={onClose} hitSlop={10}>
                        <X size={24}/>
                    </Pressable>
                </View>

                {/* Content */}
                <View style={localStyles.listContainer}>
                    {options.map((item) => {
                        const isSelected = language === item.val;
                        return (
                            <Pressable
                                key={item.val}
                                style={[
                                    localStyles.item,
                                    isSelected && localStyles.itemActive
                                ]}
                                onPress={() => onSelect(item.val)}
                            >
                                <View>
                                    <Text style={[localStyles.label, isSelected && localStyles.textActive]}>
                                        {item.label}
                                    </Text>
                                    <Text style={localStyles.subText}>{item.sub}</Text>
                                </View>
                                {isSelected && (
                                    <Check size={20} color={'#2f6618fe'} strokeWidth={3} />
                                )}
                            </Pressable>
                        );
                    })}
                </View>
            </View>
        </ModalLayout>
    );
};

const localStyles = StyleSheet.create({
    listContainer: {
        gap: 10,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee',
        backgroundColor: '#fcfdfe',
    },
    itemActive: {
        borderColor: '#2f6618fe',
        backgroundColor: '#e8ffe1',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    textActive: {
        color: '#2f6618fe',
    },
    subText: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
});

export default LanguageModal;