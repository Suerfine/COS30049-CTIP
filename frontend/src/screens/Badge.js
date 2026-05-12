import { View, Text, StyleSheet, ScrollView, Pressable, Image, ActivityIndicator } from 'react-native';
import { CircleX, SlidersHorizontal, Search } from 'lucide-react-native';

import { useBadges } from '../hooks/useBadges';
import FilterSidebar from '../components/FilterSidebar';
import { useNavigation } from '@react-navigation/native';
import { formatDate } from '../utils/formatDate';
import { useTranslation } from 'react-i18next';

const Badge = ({ navigation }) => {
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
    const { t, i18n }=useTranslation();

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
        <View style={{ flex: 1, backgroundColor: 'white' }}>
            <ScrollView style={styles.container}>
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
                                    
                                    {isCompleted && formattedDate && (
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
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 60,
    },
    centered: {
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center'
    },
    headerSection: {
        marginTop: 40,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    filterActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    filterBar: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 15,
    },
    filterButton: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    badgeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 40,
        paddingVertical: 20,
    },
    badgeCard: {
        width: 180,
        alignItems: 'center',
        marginBottom: 20,
    },
    imageWrapper: {
        width: 140,
        height: 140,
        marginBottom: 12,
        position: 'relative',
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
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        color: '#333',
    },
    expiryText: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
    },
    pillContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0a6340',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    pillText: {
        fontSize: 13,
        color: "white",
        marginRight: 6,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        color: '#999',
        fontSize: 16,
    }
});

export default Badge;