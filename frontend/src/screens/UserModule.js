import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
  Pressable,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Platform,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import {
  Award,
  Calendar,
  Clock,
  Menu,
  ChevronLeft,
  Bot,
  Lock,
  ShieldCheck,
} from "lucide-react-native";
import Markdown from "react-native-markdown-display";

// Import Components
import OutlineBar from "../components/OutlineBar.js";
import { useCourseDetails } from "../hooks/useCourseDetails.js";
import SlidingTabs from "../components/SlidingTabs.js";
import { useElements } from "../hooks/useElements.js";
import PageRenderer from "../components/pageRenderer.js";
import { useAuth } from "../context/AuthContext.js";
import { markdownStyles } from "../components/markdownStyle.js";
import { useCourses } from "../hooks/useCourses.js";
import { useCourseProgress } from "../components/useCourseProgress.js";
import AIChatBot from "../components/AIChatbot.js";
import { useTranslation } from "react-i18next";
import DiscussionSection from "../components/DiscussionSection.js";

const UserModule = ({ navigation }) => {
  const route = useRoute();
  const {
    id,
    enrollmentStatus,
    enrollmentId,
    enrollmentStatus: initialStatus,
    initialSection,
    discussionId,
  } = route.params;
  const [localStatus, setLocalStatus] = useState(initialStatus);
  const hasfailedRef = useRef(false);

  const isLocked =
    enrollmentStatus === null ||
    enrollmentStatus === undefined ||
    enrollmentStatus === "in_review" ||
    enrollmentStatus === "dropped" ||
    enrollmentStatus === "expired";

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
    failEnrollment,
  } = useCourseDetails(id, enrollmentId);
  const { allCourseList } = useCourses();
  const [chatOpen, setChatOpen] = useState(false);

  const { progressMap, isDeadEnd } = useCourseProgress(
    course,
    userMarks,
    fullHistoryMap,
  );
  const isFailed = localStatus === "failed" || isDeadEnd;
  const [selectedPage, setSelectedPage] = useState({ type: "overview" });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("Overview");
  const scrollViewRef = useRef(null);

  useEffect(() => {
    if (initialSection === "forum") {
      setSelectedPage({ type: "forum" });
    }
  }, [initialSection, discussionId]);

  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({
      y: 0,
      animated: true,
    });
  };

  const {
    elements,
    loading: elementsLoading,
    workshopsLoading,
    loadWorkshops,
    workshops,
  } = useElements(
    id,
    selectedPage?.page?.module_id || selectedPage?.module?.id,
    selectedPage?.page?.id,
  );

  useEffect(() => {
    if (selectedPage?.type === "workshops") {
      loadWorkshops();
    }
  }, [activeTab, loadWorkshops]);

  useEffect(() => {
    const handleFailure = async () => {
      if (isDeadEnd && localStatus !== "failed" && !hasfailedRef.current) {
        hasfailedRef.current = true;

        setLocalStatus("failed");
        const result = await failEnrollment(enrollmentId);

        if (result.success) {
          if (Platform.OS === "web") {
            window.alert(
              "Maximum attempts reached. This course is now marked as Failed.",
            );
          } else {
            Alert.alert("Course Failed", "Maximum attempts reached.");
          }
          navigation.navigate("ParkGuideStack", { screen: "Courses" });
        }
      }
    };

    handleFailure();
  }, [isDeadEnd, localStatus, failEnrollment]);

  const tabs = [
    { id: "Overview", label: "Overview" },
    { id: "Workshops", label: "Workshops" },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#0a6340" />

          <Text style={styles.loadingTitle}>Loading Course</Text>

          <Text style={styles.loadingSubtitle}>
            Syncing content and progress...
          </Text>
        </View>
      </View>
    );
  }

  if (error || !course)
    return (
      <View style={styles.center}>
        <Text style={{ color: "red" }}>{error || "Course not found"}</Text>
      </View>
    );

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
            <Text style={{ fontSize: 10, color: "#94a3b8" }}>
              {new Date(item.date).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        </View>

        <View style={{ flex: 1, alignItems: "center" }}>
          <Text
            style={{
              fontSize: 10,
              color: "#64748b",
              textTransform: "uppercase",
            }}
          >
            Overall Score
          </Text>
          <Text style={styles.historyScoreValue}>
            {item.score}{" "}
            <Text style={{ fontSize: 12, color: "#94a3b8", fontWeight: "400" }}>
              / {item.maxScore}
            </Text>
          </Text>
        </View>

        <View
          style={[
            styles.historyBadge,
            { backgroundColor: isPass ? "#dcfce7" : "#fee2e2" },
          ]}
        >
          <Text
            style={[
              styles.historyBadgeText,
              { color: isPass ? "#166534" : "#991b1b" },
            ]}
          >
            {isPass ? "PASSED" : "FAILED"}
          </Text>
        </View>
      </View>
    );
  };

  const renderOverviewContent = () => {
    const prerequisiteTitles =
      course.prerequisite_groups?.flatMap((group) =>
        group.prerequisites?.map((p) => {
          const match = allCourseList.find((c) => c.id === p.course_id);
          return match ? match.title : `Course #${p.course_id}`;
        }),
      ) || [];
    return (
      <View style={styles.tabSection}>
        {/* Prerequisite Section */}
        {prerequisiteTitles.length > 0 && (
          <View style={styles.prereqSection}>
            <Text style={styles.sectionTitle}>
              Required Prerequisite Courses
            </Text>
            <View>
              {prerequisiteTitles.map((title, index) => (
                <View key={index} style={styles.prereqItem}>
                  <View style={styles.prereqDot} />
                  <Text style={styles.prereqText}>{title}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        {/* Tag Sections */}
        <View style={styles.tagSectionContainer}>
          {/* Render Location Tags */}
          {locationTags.length > 0 && (
            <View style={styles.tagGroup}>
              <Text style={styles.tagLabel}>Locations</Text>
              <View style={styles.tagList}>
                {locationTags.map((tag) => (
                  <View
                    key={tag.id}
                    style={[styles.tagPill, styles.locationPill]}
                  >
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
                {categoryTags.map((tag) => (
                  <View
                    key={tag.id}
                    style={[styles.tagPill, styles.categoryPill]}
                  >
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
            {course?.description ||
              "_No content provided yet. Click edit to start._"}
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
                <Text style={{ fontWeight: "700" }}>
                  {" "}
                  {course.title} Professional Badge.
                </Text>
              </Text>
            </View>

            <View style={styles.badgePreviewContainer}>
              <Image
                source={
                  course.badge_img_url
                    ? { uri: course.badge_img_url }
                    : require("../../assets/course_badge.png")
                }
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
    <View style={styles.rowContainer}>
      {/* Outlinebar */}
      <OutlineBar
        course={course}
        onSelectPage={setSelectedPage}
        progressMap={progressMap}
        editable={false}
        isCollapsed={isCollapsed}
        isLocked={isLocked}
        userMarks={userMarks}
        isFailed={isFailed}
      />
      <ScrollView ref={scrollViewRef}>
        <View style={styles.container}>
          {/* Background Image */}
          <ImageBackground
            source={require("../../assets/forest.png")}
            style={styles.backgroundImage}
          >
            <View style={styles.courseContainer}>
              <Pressable onPress={() => setIsCollapsed(!isCollapsed)}>
                <Menu color="white" size={25} />
              </Pressable>
              <Pressable
                onPress={() => navigation.goBack()}
                style={({ pressed }) => [
                  styles.backButton,
                  pressed && styles.btnPressed,
                ]}
              >
                <ChevronLeft size={24} color="white" />
              </Pressable>
              <View>
                <Text style={styles.description}>
                  Start your learning journey
                </Text>
                <Text style={styles.title}>
                  {selectedPage?.type === "forum"
                    ? "Course Forum"
                    : "Course Details"}
                </Text>
              </View>
            </View>
          </ImageBackground>
          {/* Content */}
          <View style={styles.contentWrapper}>
            {selectedPage?.type === "page" ? (
              <View style={styles.editorContainer}>
                <Text style={styles.editorLabel}>Lesson Learning</Text>
                <Text style={styles.pageTitle}>{selectedPage.page.title}</Text>

                {currentUser.role === "park_guide" &&
                  selectedPage.page?.final_quiz === true && (
                    <View style={styles.guideInfoCard}>
                      <View style={styles.guideInfoHeader}>
                        <Award size={20} color="#15803d" />
                        <Text style={styles.guideInfoTitle}>
                          Final Assessment Requirements
                        </Text>
                      </View>

                      <View style={styles.statsRow}>
                        <View style={styles.guideStatChip}>
                          <Text style={styles.statLabel}>Max Attempts:</Text>
                          <Text style={styles.statValue}>
                            {course.max_tries ||
                              selectedPage.page?.max_tries ||
                              1}
                          </Text>
                        </View>
                        <View style={styles.guideStatChip}>
                          <Text style={styles.statLabel}>Passing Score:</Text>
                          <Text style={styles.statValue}>
                            {selectedPage.page?.passing_score || 80}%
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.guideNotice}>
                        You must achieve the passing score to earn your
                        certificate and badge.
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
                    onProgressUpdate={async (
                      elementId,
                      score,
                      content = {},
                    ) => {
                      const result = await saveProgress(
                        elementId,
                        score,
                        content,
                      );
                      return result;
                    }}
                    userMarks={userMarks}
                    isFinalQuiz={selectedPage.page.final_quiz}
                    pageMetadata={selectedPage}
                    enrollmentId={enrollmentId}
                    fullHistoryMap={fullHistoryMap}
                    onFetchHistory={() => {
                      const quizIds = elements
                        .filter((el) => el.type === "quiz_objective")
                        .map((el) => el.id);
                      handleFetchHistory(quizIds);
                    }}
                    onRefreshHistory={refreshHistory}
                    scrollToTop={scrollToTop}
                    isFailed={isFailed}
                  />
                )}
                <Modal
                  visible={isHistoryVisible}
                  transparent
                  animationType="slide"
                >
                  <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                      <Text style={styles.modalTitle}>Attempt History</Text>
                      <FlatList
                        data={historyData}
                        renderItem={renderHistoryItem}
                        keyExtractor={(item) => item.id.toString()}
                        ListEmptyComponent={
                          <Text style={styles.emptyHistory}>
                            No previous attempts.
                          </Text>
                        }
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
            ) : selectedPage?.type === "forum" ? (
              <DiscussionSection
                courseId={id}
                initialDiscussionId={discussionId}
                navigation={navigation}
                styles={styles}
              />
            ) : selectedPage?.type === "workshops" ? (
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
                    onProgressUpdate={async (
                      elementId,
                      score,
                      content = {},
                    ) => {
                      const result = await saveProgress(
                        elementId,
                        score,
                        content,
                      );
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
                        <Text style={styles.statLabel}>
                          {course.expected_completion_weeks} Weeks
                        </Text>
                      </View>
                      <View style={styles.statChip}>
                        <Calendar size={16} color="#363636" />
                        <Text style={styles.statLabel}>
                          Course Validity: {course.must_complete_in_weeks} Weeks
                        </Text>
                      </View>
                      <View style={styles.statChip}>
                        <Award size={16} color="#363636" />
                        <Text style={styles.statLabel}>
                          Badge Validity: {course.badge_expire_in_months} Months
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <Image
                  source={
                    course.cover_img_url
                      ? { uri: course.cover_img_url }
                      : require("../../assets/first_aid.png")
                  }
                  style={styles.course_cover}
                />

                {renderOverviewContent()}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      {/* AIChatbot Section */}
      <AIChatBot
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        pageId={selectedPage?.page?.id}
      />
      {!chatOpen && (
        <TouchableOpacity
          style={styles.floatingChatBtn}
          onPress={() => setChatOpen(true)}
        >
          <Bot color="white" size={24} />
          <Text style={styles.chatBtnText}>Assistant</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  rowContainer: {
    flex: 1,
    flexDirection: "row",
  },
  backgroundImage: {
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
    resizeMode: "fill",
    marginTop: 10,
  },
  courseContainer: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderRadius: 20,
    flexDirection: "row",
    userSelect: "none",
    alignItems: "center",
    gap: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "white",
    marginLeft: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 24,
    color: "white",
    marginLeft: 15,
  },
  container: {
    flex: 1,
    marginHorizontal: 35,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  courseTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statLabel: {
    color: "#363636",
  },
  content: {
    marginTop: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingRight: 20,
  },
  dynamicContent: {
    paddingBottom: 40,
  },
  tabSection: {
    paddingTop: 10,
    gap: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "650",
    color: "#3d3d3d",
    marginTop: 15,
    marginBottom: 8,
  },
  bodyText: {
    color: "#4A4A4A",
    lineHeight: 24,
  },
  pillContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
    marginTop: 10,
  },
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 25,
    backgroundColor: "#ffffff6e",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  activePill: {
    backgroundColor: "#0a6340",
    borderColor: "#0a6340",
  },
  pillText: {
    fontSize: 14,
    color: "#929292",
    fontWeight: "500",
  },
  activePillText: {
    color: "#fff",
  },
  forumWrapper: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  tabNav: {
    flexDirection: "row",
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tab: {
    flex: 1, // This makes tabs equal width
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#2f6618fe", // The active underline
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#999",
  },
  tabTextActive: {
    color: "#2f6618fe",
    fontWeight: "600",
  },
  privacyBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#ecfdf5",
    padding: 12,
    borderRadius: 12,
    marginVertical: 12,
    marginHorizontal: 0,
  },
  privacyText: {
    color: "#065f46",
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  newDiscussionForm: {
    marginVertical: 16,
    padding: 16,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  newDiscussionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f5132",
    marginBottom: 10,
  },
  newDiscussionInput: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    padding: 12,
    color: "#111827",
    fontSize: 14,
    marginBottom: 10,
  },
  btn: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#4a8947",
    borderRadius: 50,
    color: "white",
    paddingHorizontal: 23,
    paddingVertical: 13,
    marginRight: 20,
  },
  btnHover: {
    backgroundColor: "#2f6618fe",
  },
  btnText: {
    color: "white",
  },
  messageContainer: {
    padding: 15,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  messageMeta: {
    fontSize: 12,
    color: "#6b7280",
  },
  emptyForum: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 14,
  },
  badgeAchievementCard: {
    backgroundColor: "#f8fdfb",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e0f2f1",
    marginTop: 10,
    marginBottom: 30,
  },
  badgeTextContent: {
    flex: 1,
  },
  badgeSubtitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0a6340",
    textTransform: "uppercase",
    marginBottom: 4,
    textAlign: "center",
  },
  badgeDescription: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
    textAlign: "center",
  },
  badgePreviewContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  largeAchievementBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  verifiedBadge: {
    backgroundColor: "#0a6340",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: -10,
  },
  verifiedText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "900",
  },
  course_cover: {
    alignSelf: "center",
    borderRadius: 13,
    width: "800px",
    height: "400px",
    marginBottom: 20,
  },
  contentWrapper: {
    marginTop: 25,
  },
  editorContainer: {
    flex: 1,
    paddingBottom: 50,
  },
  editorLabel: {
    color: "#0a6340",
    fontWeight: "bold",
    fontSize: 12,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 20,
  },
  elementLoader: {
    marginTop: 50,
    alignItems: "center",
  },
  loaderText: {
    marginTop: 10,
    color: "#666",
  },
  backButton: {
    width: 40,
    height: 40,
    zIndex: 10,
    backgroundColor: "rgba(168, 168, 168, 0.3)",
    padding: 8,
    borderRadius: 50,
  },
  tagSectionContainer: {
    gap: 25,
    marginTop: 5,
  },
  tagGroup: {
    gap: 8,
  },
  tagLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0a6340",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
  },
  locationPill: {
    backgroundColor: "#e8f5e9",
    borderColor: "#c8e6c9",
  },
  categoryPill: {
    backgroundColor: "#f1f8e9",
    borderColor: "#dcedc8",
  },
  tagPillText: {
    fontSize: 12,
    color: "#2e7d32",
    fontWeight: "600",
  },
  prereqSection: {
    backgroundColor: "#fffbeb",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fef3c7",
    marginTop: 10,
  },
  prereqItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  prereqDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#d97706",
    marginRight: 10,
  },
  prereqText: {
    fontSize: 14,
    color: "#92400e",
    fontWeight: "500",
  },
  guideInfoCard: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    marginBottom: 25,
  },
  guideInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  guideInfoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 12,
  },
  guideStatChip: {
    flexDirection: "column",
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  guideNotice: {
    fontSize: 13,
    color: "#4b5563",
    lineHeight: 18,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 12,
    marginTop: 4,
  },
  floatingChatBtn: {
    position: "absolute",
    bottom: 30,
    right: 30,
    backgroundColor: "#0a6340",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 8,
    zIndex: 1000,
  },
  chatBtnText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    maxHeight: "86%",
    width: "60%",
    alignSelf: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 15,
    textAlign: "center",
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  historyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    width: "30%",
  },
  historyDate: {
    fontSize: 12,
    color: "#64748b",
  },
  historySelection: {
    fontSize: 13,
    color: "#1e293b",
    flex: 1,
    paddingHorizontal: 8,
  },
  historyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  historyBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  closeBtn: {
    marginTop: 15,
    padding: 12,
    backgroundColor: "#0a6340",
    borderRadius: 8,
    alignItems: "center",
  },
  closeBtnText: {
    color: "white",
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8faf8",
  },

  loadingCard: {
    backgroundColor: "white",
    paddingVertical: 32,
    paddingHorizontal: 40,
    borderRadius: 20,
    alignItems: "center",
    minWidth: 260,
  },

  loadingTitle: {
    marginTop: 18,
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },

  loadingSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
  },
});

export default UserModule;
