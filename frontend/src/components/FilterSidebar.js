import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Circle, CircleCheckBig, MapPin, Tag, LoaderCircle} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { UserRoles } from '../enum/UserRoles';

const FilterSidebar = ({ visible, tempFilters, setTempFilters, onApply, onReset, onClose, role,allTagList = [] }) => {
    const {t, i18n}=useTranslation();
    const [translateX, setTranslateX] = useState(300);

    const locationTags = allTagList.filter(tag => tag.type === 'location');
    const categoryTags = allTagList.filter(tag => tag.type === 'category');

    const statusLabels = {
        inProgress: t('status.in progress'),
        completed: t('status.completed'),
        notEnrolled: t('status.not enrolled'),
        inReview: t('status.in review'),
        applied: t('status.applied'),
        pendingPayment: t('status.pending payment'),
        enrollable: t('status.enrollable'),
    };

    useEffect(() => {
        setTranslateX(visible ? 0 : 300);
    }, [visible]);

    const toggle = (key, value) => {
        setTempFilters(prev => {
            if (key === 'status') {
                return { ...prev, [key]: prev[key] === value ? 'all' : value };
            } else {
                const currentList = Array.isArray(prev[key]) ? prev[key] : [];
                const isExist = currentList.includes(value);

                return {
                    ...prev,
                    [key]: isExist ? currentList.filter(item => item !== value) : [...currentList, value]
                };
            }
        });
    };

    // const setAllCategories=()=>{
    //     setTempFilters(prev=>({...prev, category:'all'}));
    // };

    const FilterItem = ({ label, isSelected, onPress }) => (
        <Pressable style={styles.item} onPress={onPress}>
            {isSelected
                ? <CircleCheckBig size={18} color="#0a6340" />
                : <Circle size={18} color="gray" />
            }
            <Text style={[styles.text, isSelected && styles.activeText]}>{label}</Text>
        </Pressable>
    );

    return (
        <>
            {visible && (
                <Pressable style={styles.backdrop} onPress={onClose} />
            )}

            <View style={[styles.sidebar, { transform: [{ translateX }] }]}>
                <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>{t("filters")}</Text>

                {/* filter by status */}
                {role===UserRoles.ADMIN ? (
                    null
                ) : (
                    <View style={styles.sectionGroup}>
                        <View style={styles.row}>
                            <LoaderCircle size={16} color="#0a6340"/>
                            <Text style={styles.sectionTitle}>{t('progress')}</Text>
                        </View>
                        {['enrollable', 'inProgress', 'completed', 'notEnrolled', 'inReview', 'applied', 'pendingPayment'].map(status => (
                            <FilterItem
                                key={status}
                                label={statusLabels[status]}
                                isSelected={tempFilters.status === status}
                                onPress={() => toggle('status', status)}
                            />
                        ))}
                        <FilterItem
                            label="All"
                            isSelected={tempFilters.status === 'all'}
                            onPress={() => setTempFilters(prev => ({ ...prev, status: 'all' }))}
                        />
                    </View>
                )}

                {/* Location Filters */}
                <View style={styles.sectionGroup}>
                    <View style={styles.row}>
                        <MapPin size={16} color="#0a6340" />
                        <Text style={styles.sectionTitle}>Locations</Text>
                    </View>
                    {locationTags.map(tag => (
                        <FilterItem
                            key={tag.id}
                            label={tag.title}
                            isSelected={tempFilters.location?.includes(tag.title)}
                            onPress={() => toggle('location', tag.title)}
                        />
                    ))}
                </View>

                    {/* Category Filters */}
                    <View style={styles.sectionGroup}>
                        <View style={styles.row}>
                            <Tag size={16} color="#0a6340" />
                            <Text style={styles.sectionTitle}>Categories</Text>
                        </View>
                        {categoryTags.map(tag => (
                            <FilterItem
                                key={tag.id}
                                label={tag.title}
                                isSelected={tempFilters.category?.includes(tag.title)}
                                onPress={() => toggle('category', tag.title)}
                            />
                        ))}
                    </View>
                </ScrollView>
                {/* apply and reset buttons */}
                <View style={styles.buttons}>
                    <Pressable style={styles.applyBtn} onPress={onApply}>
                        <Text style={{ color: 'white' }}>{t("apply")}</Text>
                    </Pressable>
                    <Pressable
                        style={styles.resetBtn}
                        onPress={() => { onReset(); onClose(); }}
                    >
                        <Text style={{ color: 'white' }}>{t("reset")}</Text>
                    </Pressable>
                </View>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        zIndex: 10,
    },
    sidebar: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom:0,
        height: '100%',
        width: 280,
        backgroundColor: 'white',
        padding: 20,
        zIndex: 20,
        transitionDuration: '200ms',
        flexDirection: 'column',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    section: {
        marginTop: 15,
        fontSize: 16,
        fontWeight: '600',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 8,
    },
    text: {
        fontSize: 14,
    },
    buttons: {
        marginTop: 'auto',
        gap: 10,
    },
    applyBtn: {
        backgroundColor: '#2f6618fe',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    resetBtn: {
        backgroundColor: 'gray',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    sectionGroup: { 
        marginBottom: 20
    },
    sectionTitle: { 
        fontSize: 16, 
        fontWeight: '700', 
        color: '#444', 
        marginLeft: 8 
    },
    row: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: 10 
    },
});

export default FilterSidebar;