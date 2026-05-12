import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ImageBackground, Pressable, ActivityIndicator, Image, TouchableOpacity,  Modal, FlatList, Alert, Dimensions, } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Award, Calendar, Clock, Menu, ChevronLeft, Bot, } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import Components
import OutlineBar from '../components/OutlineBar.native.js';
import { useCourseDetails } from '../hooks/useCourseDetails.js';
import { useElements } from '../hooks/useElements.js';
import PageRenderer from '../components/pageRenderer.js';
import { useAuth } from '../context/AuthContext.js';
import { markdownStyles } from '../components/markdownStyle.js';
import { useCourses } from '../hooks/useCourses.js';
import { useCourseProgress } from '../components/useCourseProgress.js';
import AIChatBot from '../components/AIChatbot.js';
import DiscussionSection from '../components/DiscussionSection.js';

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const UserModule = ({ navigation }) => {
    const route = useRoute();
    const { id, enrollmentStatus, enrollmentId, enrollmentStatus: initialStatus } = route.params;

    const [localStatus, setLocalStatus] = useState(initialStatus);
    const hasfailedRef = useRef(false);
    const scrollViewRef = useRef(null);
    const [selectedPage, setSelectedPage] = useState({ type: 'overview' });
    const [outlineOpen, setOutlineOpen] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);

    const isLocked = enrollmentStatus === null ||
        enrollmentStatus === undefined ||
        enrollmentStatus === 'in_review' ||
        enrollmentStatus === 'dropped' ||
        enrollmentStatus === 'expired';

    const { currentUser } = useAuth();
    const {
        course,
        loading,
        error,
        locationTags,
        categoryTags,
        saveProgress,
        userMarks,
        historyData,
        isHistoryVisible,
        fullHistoryMap,
        setIsHistoryVisible,
        refreshHistory,
        handleFetchHistory,
        failEnrollment
    } = useCourseDetails(id, enrollmentId);

    const { allCourseList } = useCourses();

    const { progressMap, isDeadEnd } = useCourseProgress(course, userMarks, fullHistoryMap);
    const isFailed = localStatus === 'failed' || isDeadEnd;

    const { elements, loading: elementsLoading, workshopsLoading, loadWorkshops, workshops } = useElements(
        id,
        selectedPage?.page?.module_id || selectedPage?.module?.id,
        selectedPage?.page?.id
    );

    const scrollToTop = () => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    };

    useEffect(() => {
        if (selectedPage?.type === 'workshops') {
            loadWorkshops();
        }
    }, [selectedPage, loadWorkshops]);

    // Auto-Fail Effect
    useEffect(() => {
        const handleFailure = async () => {
            if (isDeadEnd && localStatus !== 'failed' && !hasfailedRef.current) {
                hasfailedRef.current = true;
                setLocalStatus('failed');
                const result = await failEnrollment(enrollmentId);
                if (result.success) {
                    Alert.alert("Course Failed", "Maximum attempts reached for a required assessment.");
                    navigation.navigate('ParkGuideMobileRoot', { screen: 'Courses' });
                }
            }
        };
        handleFailure();
    }, [isDeadEnd, localStatus, failEnrollment]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <View style={styles.loadingCard}>
                    <ActivityIndicator size="large" color="#0a6340" />
                    <Text style={styles.loadingTitle}>Loading Course</Text>
                    <Text style={styles.loadingSubtitle}>Syncing content and progress...</Text>
                </View>
            </View>
        );
    }

    if (error || !course) return (
        <View style={styles.center}>
            <Text style={{ color: 'red' }}>{error || "Course not found"}</Text>
        </View>
    );

    const handleSelectPage = (item) => {
        setSelectedPage(item);
        setOutlineOpen(false);
    };

    const renderHistoryItem = ({ item }) => {
        const requiredScore = selectedPage?.page?.passing_score || 80;
        const isPass = item.score >= requiredScore;
        return (
            <View style={styles.historyItem}>
                <View style={styles.historyLeft}>
                    <Calendar size={14} color="#64748b" />
                    <View style={{ marginLeft: 8 }}>
                        <Text style={styles.historyDate}>
                            {new Date(item.date).toLocaleDateString()}
                        </Text>
                        <Text style={{ fontSize: 10, color: '#94a3b8' }}>
                            {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                </View>
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase' }}>Overall Score</Text>
                    <Text style={styles.historyScoreValue}>
                        {item.score} <Text style={{ fontSize: 12, color: '#94a3b8', fontWeight: '400' }}>/ {item.maxScore}</Text>
                    </Text>
                </View>
                <View style={[styles.historyBadge, { backgroundColor: isPass ? '#dcfce7' : '#fee2e2' }]}>
                    <Text style={[styles.historyBadgeText, { color: isPass ? '#166534' : '#991b1b' }]}>
                        {isPass ? 'PASSED' : 'FAILED'}
                    </Text>
                </View>
            </View>
        );
    };

    const renderOverviewContent = () => {
        const prerequisiteTitles = course.prerequisite_groups?.flatMap(group =>
            group.prerequisites?.map(p => {
                const match = allCourseList.find(c => c.id === p.course_id);
                return match ? match.title : `Course #${p.course_id}`;
            })
        ) || [];

        return (
            <View style={styles.tabSection}>
                {/* Prerequisite Section */}
                {prerequisiteTitles.length > 0 && (
                    <View style={styles.prereqSection}>
                        <Text style={styles.sectionTitle}>Required Prerequisite Courses</Text>
                        {prerequisiteTitles.map((title, index) => (
                            <View key={index} style={styles.prereqItem}>
                                <View style={styles.prereqDot} />
                                <Text style={styles.prereqText}>{title}</Text>
                            </View>
                        ))}
                    </View>
                )}
                {/* Tag Sections */}
                <View style={styles.tagSectionContainer}>
                    {/* Render Location Tags */}
                    {locationTags.length > 0 && (
                        <View style={styles.tagGroup}>
                            <Text style={styles.tagLabel}>Locations</Text>
                            <View style={styles.tagList}>
                                {locationTags.map(tag => (
                                    <View key={tag.id} style={[styles.tagPill, styles.locationPill]}>
                                        <Text style={styles.tagPillText}>{tag.title}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                    {/* Render Category Tags */}
                    {categoryTags.length > 0 && (
                        <View style={styles.tagGroup}>
                            <Text style={styles.tagLabel}>Categories</Text>
                            <View style={styles.tagList}>
                                {categoryTags.map(tag => (
                                    <View key={tag.id} style={[styles.tagPill, styles.categoryPill]}>
                                        <Text style={styles.tagPillText}>{tag.title}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </View>
                {/* Render the dynamic content */}
                <View style={styles.markdownContainer}>
                    <Markdown style={markdownStyles}>
                        {course?.description || "_No content provided yet. Click edit to start._"}
                    </Markdown>
                </View>
                {/* Badge Achievement Section */}
                <View>
                    <Text style={styles.sectionTitle}>Completion Reward</Text>
                    <View style={styles.badgeAchievementCard}>
                        <View style={styles.badgeTextContent}>
                            <Text style={styles.badgeSubtitle}>Official Certification</Text>
                            <Text style={styles.badgeDescription}>
                                Complete all modules and pass the final assessment to earn your
                                <Text style={{ fontWeight: '700' }}> {course.title} Professional Badge.</Text>
                            </Text>
                        </View>
                        <View style={styles.badgePreviewContainer}>
                            <Image
                                source={course.badge_img_url ? { uri: course.badge_img_url } : require('../../assets/course_badge.png')}
                                style={styles.largeAchievementBadge}
                            />
                            <View style={styles.verifiedBadge}>
                                <Text style={styles.verifiedText}>VERIFIED</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>

            <OutlineBar
                course={course}
                onSelectPage={handleSelectPage}
                progressMap={progressMap}
                editable={false}
                isOpen={outlineOpen}
                onClose={() => setOutlineOpen(false)}
                isLocked={isLocked}
                isFailed={isFailed}
            />

            <ScrollView ref={scrollViewRef}>
                <View style={styles.container}>
                    <ImageBackground
                        source={require('../../assets/forest.png')}
                        style={styles.backgroundImage}
                    >
                        <View style={styles.courseContainer}>
                            <Pressable onPress={() => setOutlineOpen(true)}>
                                <Menu color="white" size={25} />
                            </Pressable>
                            <Pressable
                                onPress={() => navigation.goBack()}
                                style={({ pressed }) => [styles.backButton, pressed && styles.btnPressed]}
                            >
                                <ChevronLeft size={24} color="white" />
                            </Pressable>
                            <View>
                                <Text style={styles.description}>Start your learning journey</Text>
                                <Text style={styles.title}>
                                    {selectedPage?.type === 'forum' ? "Course Forum" : "Course Details"}
                                </Text>
                            </View>
                        </View>
                    </ImageBackground>

                    <View style={styles.contentWrapper}>
                        {selectedPage?.type === 'page' ? (
                            <View style={styles.editorContainer}>
                                <Text style={styles.editorLabel}>Lesson Learning</Text>
                                <Text style={styles.pageTitle}>{selectedPage.page.title}</Text>

                                {currentUser.role === 'park_guide' && selectedPage.page?.final_quiz === true && (
                                    <View style={styles.guideInfoCard}>
                                        <View style={styles.guideInfoHeader}>
                                            <Award size={20} color="#15803d" />
                                            <Text style={styles.guideInfoTitle}>Final Assessment Requirements</Text>
                                        </View>
                                        <View style={styles.statsRow}>
                                            <View style={styles.guideStatChip}>
                                                <Text style={styles.statLabel}>Max Attempts:</Text>
                                                <Text style={styles.statValue}>{course.max_tries || selectedPage.page?.max_tries || 1}</Text>
                                            </View>
                                            <View style={styles.guideStatChip}>
                                                <Text style={styles.statLabel}>Passing Score:</Text>
                                                <Text style={styles.statValue}>{selectedPage.page?.passing_score || 80}%</Text>
                                            </View>
                                        </View>
                                        <Text style={styles.guideNotice}>
                                            You must achieve the passing score to earn your certificate and badge.
                                        </Text>
                                    </View>
                                )}

                                {elementsLoading ? (
                                    <View style={styles.elementLoader}>
                                        <ActivityIndicator color="#0a6340" />
                                        <Text style={styles.loaderText}>Loading Elements...</Text>
                                    </View>
                                ) : (
                                    <PageRenderer
                                        elements={elements}
                                        role={currentUser.role}
                                        courseId={id}
                                        onProgressUpdate={async (elementId, score, content = {}) => {
                                            const result = await saveProgress(elementId, score, content);
                                            return result;
                                        }}
                                        userMarks={userMarks}
                                        isFinalQuiz={selectedPage.page.final_quiz}
                                        pageMetadata={selectedPage}
                                        enrollmentId={enrollmentId}
                                        fullHistoryMap={fullHistoryMap}
                                        onFetchHistory={() => {
                                            const quizIds = elements
                                                .filter(el => el.type === 'quiz_objective')
                                                .map(el => el.id);
                                            handleFetchHistory(quizIds);
                                        }}
                                        onRefreshHistory={refreshHistory}
                                        scrollToTop={scrollToTop}
                                        isFailed={isFailed}
                                    />
                                )}

                                <Modal visible={isHistoryVisible} transparent animationType="slide">
                                    <View style={styles.modalOverlay}>
                                        <View style={styles.modalContent}>
                                            <Text style={styles.modalTitle}>Attempt History</Text>
                                            <FlatList
                                                data={historyData}
                                                renderItem={renderHistoryItem}
                                                keyExtractor={(item) => item.id.toString()}
                                                ListEmptyComponent={<Text style={styles.emptyHistory}>No previous attempts.</Text>}
                                            />
                                            <TouchableOpacity
                                                onPress={() => setIsHistoryVisible(false)}
                                                style={styles.closeBtn}
                                            >
                                                <Text style={styles.closeBtnText}>Close</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </Modal>
                            </View>

                        ) : selectedPage?.type === 'forum' ? (
                            <DiscussionSection
                                courseId={id}
                                navigation={navigation}
                                styles={styles}
                            />

                        ) : selectedPage?.type === 'workshops' ? (
                            // Workshops
                            <View style={styles.editorContainer}>
                                <Text style={styles.editorLabel}>Workshop Learning</Text>
                                <Text style={styles.pageTitle}>Course Workshops</Text>
                                {workshopsLoading ? (
                                    <View style={styles.elementLoader}>
                                        <ActivityIndicator color="#0a6340" />
                                        <Text style={styles.loaderText}>Loading Workshops...</Text>
                                    </View>
                                ) : (
                                    <PageRenderer
                                        elements={workshops}
                                        role={currentUser.role}
                                        courseId={id}
                                        onProgressUpdate={async (elementId, score, content = {}) => {
                                            const result = await saveProgress(elementId, score, content);
                                            return result;
                                        }}
                                        userMarks={userMarks}
                                    />
                                )}
                            </View>
                        ) : (
                            // Course Overview
                            <View>
                                <View style={styles.headerRow}>
                                    <View style={styles.content}>
                                        <Text style={styles.courseTitle}>{course.title}</Text>
                                        <View style={styles.statsRow}>
                                            <View style={styles.statChip}>
                                                <Clock size={16} color="#363636" />
                                                <Text style={styles.statLabel}>{course.expected_completion_weeks} Weeks</Text>
                                            </View>
                                            <View style={styles.statChip}>
                                                <Calendar size={16} color="#363636" />
                                                <Text style={styles.statLabel}>Course Validity: {course.must_complete_in_weeks} Weeks</Text>
                                            </View>
                                            <View style={styles.statChip}>
                                                <Award size={16} color="#363636" />
                                                <Text style={styles.statLabel}>Badge Validity: {course.badge_expire_in_months} Months</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                                <Image
                                    source={course.cover_img_url ? { uri: course.cover_img_url } : require('../../assets/first_aid.png')}
                                    style={styles.course_cover}
                                />
                                {renderOverviewContent()}
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            <AIChatBot isOpen={chatOpen} onClose={() => setChatOpen(false)} />
            {!chatOpen && (
                <TouchableOpacity
                    style={styles.floatingChatBtn}
                    onPress={() => setChatOpen(true)}
                >
                    <Bot color="white" size={24} />
                    <Text style={styles.chatBtnText}>Assistant</Text>
                </TouchableOpacity>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    backgroundImage: {
        width: '100%',
        minHeight: 140,
    },
    courseContainer: {
        paddingVertical: 30,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
        marginLeft: 4,
    },
    description: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.85)',
        marginLeft: 4,
    },
    container: {
        flex: 1,
    },
    statsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20,
    },
    courseTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: '#1a1a1a',
    },
    statChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
    },
    statLabel: {
        color: '#363636',
        fontSize: 12,
    },
    content: {
        marginTop: 20,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    tabSection: {
        paddingTop: 10,
        gap: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#3d3d3d',
        marginTop: 15,
        marginBottom: 8,
    },
    badgeAchievementCard: {
        backgroundColor: '#f8fdfb',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#e0f2f1',
        marginTop: 10,
        marginBottom: 30,
    },
    badgeTextContent: { flex: 1 },
    badgeSubtitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0a6340',
        textTransform: 'uppercase',
        marginBottom: 4,
        textAlign: 'center',
    },
    badgeDescription: {
        fontSize: 14,
        color: '#444',
        lineHeight: 20,
        textAlign: 'center',
    },
    badgePreviewContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    largeAchievementBadge: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    verifiedBadge: {
        backgroundColor: '#0a6340',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: -10,
    },
    verifiedText: {
        color: '#fff',
        fontSize: 8,
        fontWeight: '900',
    },
    course_cover: {
        alignSelf: 'center',
        borderRadius: 13,
        width: '100%',
        height: 200,
        marginBottom: 20,
    },
    contentWrapper: {
        marginTop: 25,
        paddingHorizontal: 20,
    },
    editorContainer: {
        flex: 1,
        paddingBottom: 50,
    },
    editorLabel: {
        color: '#0a6340',
        fontWeight: 'bold',
        fontSize: 12,
        textTransform: 'uppercase',
        marginBottom: 5,
    },
    pageTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 20,
    },
    elementLoader: {
        marginTop: 50,
        alignItems: 'center',
    },
    loaderText: {
        marginTop: 10,
        color: '#666',
    },
    backButton: {
        width: 40,
        height: 40,
        backgroundColor: 'rgba(168, 168, 168, 0.3)',
        padding: 8,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tagSectionContainer: {
        gap: 25,
        marginTop: 5,
    },
    tagGroup: { gap: 8 },
    tagLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0a6340',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    tagList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tagPill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        borderWidth: 1,
    },
    locationPill: {
        backgroundColor: '#e8f5e9',
        borderColor: '#c8e6c9',
    },
    categoryPill: {
        backgroundColor: '#f1f8e9',
        borderColor: '#dcedc8',
    },
    tagPillText: {
        fontSize: 12,
        color: '#2e7d32',
        fontWeight: '600',
    },
    prereqSection: {
        backgroundColor: '#fffbeb',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fef3c7',
        marginTop: 10,
    },
    prereqItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    prereqDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#d97706',
        marginRight: 10,
    },
    prereqText: {
        fontSize: 14,
        color: '#92400e',
        fontWeight: '500',
    },
    guideInfoCard: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        marginBottom: 25,
    },
    guideInfoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    guideInfoTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    guideStatChip: {
        flexDirection: 'column',
        gap: 4,
        flex: 1,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
    },
    guideNotice: {
        fontSize: 12,
        color: '#4b5563',
        lineHeight: 18,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingTop: 12,
        marginTop: 4,
    },
    floatingChatBtn: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        backgroundColor: '#0a6340',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 30,
        gap: 8,
        elevation: 5,
    },
    chatBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        maxHeight: '80%',
        width: '90%',
        alignSelf: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: 15,
        textAlign: 'center',
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    historyLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    historyDate: {
        fontSize: 12,
        color: '#64748b',
    },
    historyBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    historyBadgeText: {
        fontSize: 10,
        fontWeight: '800',
    },
    historyScoreValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
    },
    closeBtn: {
        marginTop: 15,
        padding: 12,
        backgroundColor: '#0a6340',
        borderRadius: 8,
        alignItems: 'center',
    },
    closeBtnText: {
        color: 'white',
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8faf8',
    },
    loadingCard: {
        backgroundColor: 'white',
        paddingVertical: 32,
        paddingHorizontal: 40,
        borderRadius: 20,
        alignItems: 'center',
        minWidth: 260,
    },
    loadingTitle: {
        marginTop: 18,
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
    },
    loadingSubtitle: {
        marginTop: 6,
        fontSize: 13,
        color: '#6b7280',
        textAlign: 'center',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    markdownContainer: {},
    emptyHistory: {
        textAlign: 'center',
        color: '#94a3b8',
        marginVertical: 20,
    },
});

export default UserModule;