import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Circle, CircleCheckBig } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { UserRoles } from '../enum/UserRoles';

const FilterSidebar = ({ visible, tempFilters, setTempFilters, onApply, onReset, onClose, role }) => {
    const {t, i18n}=useTranslation();
    const [translateX, setTranslateX] = useState(300);

    const statusLabels = {
        inProgress: t('status.in progress'),
        completed: t('status.completed'),
        notEnrolled: t('status.not enrolled'),
    };

    useEffect(() => {
        setTranslateX(visible ? 0 : 300);
    }, [visible]);

    const toggle = (key, value) => {
        setTempFilters(prev=>{
            if (key==='status'){
                return {...prev, [key]:prev[key]===value ? 'all':value};
            }else{
                const currentCategories=Array.isArray(prev.category) ? prev.category:[];
                const isExist=currentCategories.includes(value);

                return{
                    ...prev, 
                    category:isExist ? currentCategories.filter(c=>c !==value) : [...currentCategories, value]
                };
            }
        });
    };

    const setAllCategories=()=>{
        setTempFilters(prev=>({...prev, category:'all'}));
    };

    const FilterItem = ({ label, isSelected, onPress }) => (
        <Pressable style={styles.item} onPress={onPress}>
            {isSelected
                ? <CircleCheckBig size={18} color="green" />
                : <Circle size={18} color="gray" />
            }
            <Text style={styles.text}>{label}</Text>
        </Pressable>
    );

    return (
        <>
            {visible && (
                <Pressable style={styles.backdrop} onPress={onClose} />
            )}

            <View style={[styles.sidebar, { transform: [{ translateX }] }]}>
                <Text style={styles.title}>{t("filters")}</Text>

                {/* filter by status */}
                {role===UserRoles.ADMIN ? (
                    ""
                ) : (
                    <>
                    <Text style={styles.section}>{t('progress')}</Text>
                    {['inProgress', 'completed', 'notEnrolled'].map(status => (
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
                    </>
                )}
                
                

                {/* Tag Filter */}
                <Text style={styles.section}>{t("categories")}</Text>
                {['Flora & Fauna', 'Navigation', 'First Aid','Survival', 'History'].map(category => (
                    <FilterItem
                        key={category}
                        label={category}
                        isSelected={Array.isArray(tempFilters.category) && tempFilters.category.includes(category)}
                        onPress={() => toggle('category', category)}
                    />
                ))}
                <FilterItem
                    label="All"
                    isSelected={tempFilters.status === 'all'}
                    onPress={() => setTempFilters(prev => ({ ...prev, category: 'all' }))}
                />

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
});

export default FilterSidebar;