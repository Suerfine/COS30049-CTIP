import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, ActivityIndicator } from 'react-native';
import { CircleX, SlidersHorizontal, Search } from 'lucide-react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';

import { useBadges } from '../hooks/useBadges';
import FilterSidebar from '../components/FilterSidebar';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../utils/formatDate';

const Badge = ({ navigation }) => {
    const {t, i18n}=useTranslation();
    const {
        courses,
        loading,
        getEnrollment,
        filterVisible,
        setFilterVisible,
        filters,
        tempFilters,
        setTempFilters,
        applyFilters,
        resetFilters,
        removeFilter,
        tagOptions
    } = useBadges();

    const statusLabels = {
        all: 'All Status',
        COMPLETED: 'Completed',
        IN_PROGRESS: 'In Progress',
        not_enrolled: 'Not Enrolled'
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0a6340" />
            </View>
        );
    }


    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.headerSection}>
                    <View style={styles.titleRow}>
                        <Text style={styles.headerTitle}>Badges</Text>
                        
                        <View style={styles.filterActions}>
                            <Pressable 
                                onPress={() => setFilterVisible(true)}
                                style={styles.filterButton}
                            >
                                <SlidersHorizontal size={18} color="#424242" />
                            </Pressable>
                        </View>
                    </View>

                    <View style={styles.pillContainer}>
                        {filters.status !== 'all' && (
                            <View style={styles.pill}>
                                <Text style={styles.pillText}>{statusLabels[filters.status]}</Text>
                                <Pressable onPress={() => removeFilter('status')}>
                                    <CircleX size={14} color="white" />
                                </Pressable>
                            </View>
                        )}
                        {filters.tag !== 'all' && (
                            <View style={styles.pill}>
                                <Text style={styles.pillText}>{filters.tag}</Text>
                                <Pressable onPress={() => removeFilter('tag')}>
                                    <CircleX size={14} color="white" />
                                </Pressable>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.badgeGrid}>
                    {courses.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No badges found</Text>
                        </View>
                    ) : (
                        courses.map((course) => {
                            const enrollment = getEnrollment(course.id);
                            const isEnrolled = !!enrollment; 
                            const isCompleted = enrollment?.status === 'COMPLETED';
                            const expiry = enrollment?.badge_expire_at; 
                            const formattedDate = expiry ? formatDate(new Date(expiry)) : null;

                            return (
                                <View key={course.id} style={styles.badgeCard}>
                                    <View style={styles.imageWrapper}>
                                        <Image
                                            source={{ uri: course.badge_img_url || 'https://via.placeholder.com/150' }}
                                            style={[
                                                styles.badgeImage,
                                                !isEnrolled && styles.lockedBadge // if locked make grey
                                            ]}
                                        />
                                        {!isEnrolled && (
                                            <View style={styles.overlay} />
                                        )}
                                    </View>
                                    
                                    <Text style={styles.courseTitle} numberOfLines={1}>
                                        {course.title}
                                    </Text>
                                    
                                    {(isCompleted) && formattedDate && (
                                        <Text style={styles.expiryText}>
                                            Expires: {formattedDate}
                                        </Text>
                                    )}
                                </View>
                            );
                        })
                    )}
                </View>
            </ScrollView>

            <FilterSidebar
                visible={filterVisible}
                tempFilters={tempFilters}
                setTempFilters={setTempFilters}
                onClose={() => setFilterVisible(false)}
                onApply={applyFilters}
                onReset={resetFilters}
                tagOptions={tagOptions} 
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    centered: {
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center'
    },
    headerSection: {
        marginTop: 20,
        paddingHorizontal: 16,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    filterButton: {
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    badgeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        paddingVertical: 10,
        justifyContent: 'flex-start',
        gap: 16, 
    },
    badgeCard: {
        width: '30.5%', 
        marginBottom: 15,
        alignItems: 'flex-start',
    },
    imageWrapper: {
        width: '100%',
        aspectRatio: 1,
        marginBottom: 6,
    },
    badgeImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    lockedBadge: {
        tintColor: 'gray',
        opacity: 0.4,
    },
    courseTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
        textAlign: 'left',
        lineHeight: 14,
    },
    expiryText: {
        fontSize: 10,
        color: '#888',
        marginTop: 2,
    },
    pillContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        paddingBottom: 10,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0a6340',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 15,
    },
    pillText: {
        fontSize: 11,
        color: "white",
        marginRight: 4,
    }
});

export default Badge;