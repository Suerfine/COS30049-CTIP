import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, ActivityIndicator, Platform } from 'react-native';
import { CircleX, SlidersHorizontal, Award, Clock, AlertTriangle, Lock } from 'lucide-react-native';
import * as Progress from 'react-native-progress';

import { useBadges } from '../hooks/useBadges';
import FilterSidebar from '../components/FilterSidebar';
import { formatDate } from '../utils/formatDate';
import { useTranslation } from 'react-i18next';
import { useUserDashboard } from '../hooks/useUserDashboard';
import SFCFooter from '../components/Footer';

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
    
    const { t } = useTranslation();
    const sections = useMemo(() => {
        const achieved = [];
        const inProgress = [];
        const nonAchieved = []; 
        const available = []; 
        const inReview=[];

        courses.forEach(course => {
            const enrollment = getEnrollment(course.id);
            const status = enrollment?.status?.toLowerCase();

            if (!enrollment) {
                available.push({ course, enrollment: null });
            } else if (status === 'completed') {
                achieved.push({ course, enrollment });
            }else if(status === 'in_review'){
                inReview.push({course, enrollment});
            } else if (status === 'in_progress') {
                inProgress.push({ course, enrollment });
            } else if (status === 'failed' || status === 'expired' || status === 'rejected') {
                nonAchieved.push({ course, enrollment });
            }
        });

        return { achieved, inProgress, nonAchieved, available, inReview };
    }, [courses, getEnrollment]);

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

    const BadgeItem = ({ course, enrollment, type }) => {
        const isCompleted = type === 'achieved';
        const isInProgress = type === 'progress';
        const isAlert = type === 'alert';
        const isLocked = type === 'locked';
        const isReview = type === 'review';
        const expiry = enrollment?.badge_expire_at;
        const progressValue = course.progress || 0;

        return (
            <View
                style={styles.badgeCard}
            >
                <View style={styles.imageWrapper}>
                    <Image
                        source={{ uri: course.badge_img_url }}
                        style={[
                            styles.badgeImage,
                            (isAlert || isLocked) && styles.grayscaleBadge,
                            isLocked && { opacity: 0.3 }
                        ]}
                    />
                    {isCompleted && (
                        <View style={styles.achievedIconTag}>
                            <Award size={14} color="white" />
                        </View>
                    )}
                    {isLocked && (
                        <View style={styles.lockIconOverlay}>
                            <Lock size={16} color="#666" />
                        </View>
                    )}
                </View>
                
                <Text style={[styles.courseTitle, isLocked && { color: '#888' }]} numberOfLines={2}>
                    {course.title}
                </Text>

                {isCompleted && expiry && (
                    <Text style={styles.expiryText}>
                        Expires: {formatDate(new Date(expiry))}
                    </Text>
                )}

                {isInProgress && (
                    <View style={styles.progressContainer}>
                        <Progress.Bar 
                            progress={progressValue} 
                            width={120} 
                            color="#0a6340" 
                            unfilledColor="#e0e0e0" 
                            borderWidth={0}
                            height={6}
                        />
                        <Text style={styles.progressLabel}>{Math.round(progressValue * 100)}% Complete</Text> 
                    </View>
                )}

                {isReview && (
                    <View style={styles.reviewBadgeTag}>
                        <Clock size={10} color="#856404" />
                        <Text style={styles.reviewText}>Verification Pending</Text>
                    </View>
                )}

                {isAlert && (
                    <View style={styles.alertLabelRow}>
                        <AlertTriangle size={12} color="#dc2626" />
                        <Text style={styles.alertText}>{enrollment?.status?.toUpperCase()}</Text>
                    </View>
                )}

                {isLocked && (
                    <View style={styles.lockedHintRow}>
                        <Text style={styles.lockedHintText}>Enroll to Earn</Text>
                    </View>
                )}
            </View>
        );
    };

    const RenderSection = ({ title, icon, data, type, emptyMsg, hideIfEmpty=false}) => {
        if (hideIfEmpty && data.length === 0) return null;
        return (
        <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
                {icon}
                <Text style={styles.sectionTitle}>{title}</Text>
                <View style={styles.badgeCount}>
                    <Text style={styles.badgeCountText}>{data.length}</Text>
                </View>
            </View>
            
            {data.length === 0 ? (
                <Text style={styles.emptySectionText}>{emptyMsg}</Text>
            ) : (
                <View style={styles.badgeGrid}>
                    {data.map(({ course, enrollment }) => (
                        <BadgeItem 
                            key={course.id} 
                            course={course} 
                            enrollment={enrollment} 
                            type={type} 
                        />
                    ))}
                </View>
            )}
        </View>
    )};

    return (
        <View style={styles.page}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
            >   
                <View style={styles.contentWrapper}>
                    <View style={styles.headerSection}>
                        <View style={styles.titleRow}>
                            <Text style={styles.headerTitle}>My Certifications</Text>
                        </View>
                    </View>

                    <RenderSection 
                        title="Achieved Badges" 
                        data={sections.achieved} 
                        type="achieved"
                        emptyMsg="Complete courses to earn professional badges."
                    />

                    <RenderSection 
                        title="In Progress" 
                        data={sections.inProgress} 
                        type="progress"
                        emptyMsg="No courses currently active."
                    />

                    <RenderSection 
                        title="Pending Verification" 
                        data={sections.inReview} 
                        type="review"
                        hideIfEmpty={true}
                    />

                    <RenderSection 
                        title="Expired or Failed" 
                        data={sections.nonAchieved} 
                        type="alert"
                        emptyMsg="No expired or failed records."
                    />

                    <RenderSection 
                        title="Available Badges" 
                        data={sections.available} 
                        type="locked"
                        emptyMsg="All available courses have been enrolled."
                    />
                </View>
                <View style={styles.footerWrapper}>
                    <SFCFooter />
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
    },
    contentWrapper: {
        paddingHorizontal: Platform.OS === 'web' ? 60 : 20,
    },
    centered: {
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center'
    },
    headerSection: {
        marginTop: 40,
        marginBottom: 20,
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
        color: '#1a1a1a',
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: 'white',
        gap: 8,
    },
    filterBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#424242',
    },
    sectionWrapper: {
        marginBottom: 40,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    badgeCount: {
        backgroundColor: '#eee',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    badgeCountText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#666',
    },
    badgeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 30,
    },
    badgeCard: {
        width: 160,
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        ...Platform.select({
            web: { boxShadow: '0px 4px 10px rgba(0,0,0,0.03)' },
            default: { elevation: 2 }
        })
    },
    imageWrapper: {
        width: 100,
        height: 100,
        marginBottom: 12,
        position: 'relative',
    },
    badgeImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    achievedIconTag: {
        position: 'absolute',
        bottom: -5,
        right: -5,
        backgroundColor: '#0a6340',
        borderRadius: 15,
        padding: 4,
        borderWidth: 2,
        borderColor: 'white',
    },
    lockIconOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    grayscaleBadge: {
        tintColor: 'gray',
    },
    courseTitle: {
        fontSize: 13,
        fontWeight: '700',
        textAlign: 'center',
        color: '#333',
        height: 40,
    },
    expiryText: {
        fontSize: 11,
        color: '#0a6340',
        marginTop: 8,
        fontWeight: '600',
    },
    progressContainer: {
        marginTop: 10,
        alignItems: 'center',
        gap: 5,
    },
    progressLabel: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#666',
    },
    alertLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 4,
    },
    alertText: {
        fontSize: 10,
        color: '#dc2626',
        fontWeight: 'bold',
    },
    lockedHintRow: {
        marginTop: 8,
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    lockedHintText: {
        fontSize: 10,
        color: '#64748b',
        fontWeight: '700',
    },
    emptySectionText: {
        color: '#999',
        fontStyle: 'italic',
        fontSize: 14,
        marginLeft: 5,
    },
    page: {
        flex: 1,
        backgroundColor: '#fcfcfc',
    },
    scrollContent: {
        flexGrow: 1,
        minHeight: '100%',
    },
    footerWrapper: {
        marginTop: 'auto',
    },
});

export default Badge;