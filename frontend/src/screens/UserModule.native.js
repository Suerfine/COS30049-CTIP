import React, { useState, useEffect } from "react";
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
  Modal,
  Dimensions,
  TouchableWithoutFeedback,
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
  X,
} from "lucide-react-native";
import Markdown from "react-native-markdown-display";
import { SafeAreaView } from "react-native-safe-area-context";

// Import Components
import OutlineBar from "../components/OutlineBar.native.js";
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const UserModule = ({ navigation }) => {
  const route = useRoute();
  const { id, enrollmentStatus, enrollmentId } = route.params;

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
  } = useCourseDetails(id, enrollmentId);
  const { allCourseList } = useCourses();
  const [chatOpen, setChatOpen] = useState(false);

  const progressMap = useCourseProgress(course, userMarks);
  const [selectedPage, setSelectedPage] = useState({ type: "overview" });

  // On mobile: drawer open/close state (replaces isCollapsed sidebar logic)
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [activeTab, setActiveTab] = useState("Overview");
  const [forumType, setForumType] = useState("Public");

  const {
    elements,
    loading: elementsLoading,
    registerWorkshop,
    registering,
    workshopsLoading,
    loadWorkshops,
    workshops,
  } = useElements(
    id,
    selectedPage?.page?.module_id || selectedPage?.module?.id,
    selectedPage?.page?.id,
  );

  useEffect(() => {
    if (activeTab === "Workshops") {
      loadWorkshops();
    }
  }, [activeTab, loadWorkshops]);

  const tabs = [
    { id: "Overview", label: "Overview" },
    { id: "Forum", label: "Forum" },
    { id: "Workshops", label: "Workshops" },
  ];

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0a6340" />
        <Text>Syncing with Server...</Text>
      </View>
    );

  if (error || !course)
    return (
      <View style={styles.center}>
        <Text style={{ color: "red" }}>{error || "Course not found"}</Text>
      </View>
    );

  // When a page is selected from the drawer, close the drawer and update state
  const handleSelectPage = (item) => {
    setSelectedPage(item);
    setDrawerOpen(false);
  };

  const handleBack = () => {
    // Check if we are currently viewing a lesson page instead of the overview
    if (selectedPage?.type === "page") {
      // Reset state to overview instead of navigating
      setSelectedPage({ type: "overview" });
    } else if (navigation.canGoBack()) {
      // Only call goBack if there is actually a screen to go back to
      navigation.goBack();
    } else {
      // Fallback: If no history, send them to the Dashboard or Courses
      navigation.navigate("ParkGuideStack", { screen: "UserCourse" });
    }
  };

  const renderOverviewContent = () => {
    switch (activeTab) {
      case "Overview": {
        const prerequisiteTitles =
          course.prerequisite_groups?.flatMap((group) =>
            group.prerequisites?.map((p) => {
              const match = allCourseList.find((c) => c.id === p.course_id);
              return match ? match.title : `Course #${p.course_id}`;
            }),
          ) || [];

        return (
          <View style={styles.tabSection}>
            {prerequisiteTitles.length > 0 && (
              <View style={styles.prereqSection}>
                <Text style={styles.sectionTitle}>
                  Required Prerequisite Courses
                </Text>
                {prerequisiteTitles.map((title, index) => (
                  <View key={index} style={styles.prereqItem}>
                    <View style={styles.prereqDot} />
                    <Text style={styles.prereqText}>{title}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.tagSectionContainer}>
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

            <View style={styles.markdownContainer}>
              <Markdown style={markdownStyles}>
                {course?.description ||
                  "_No content provided yet. Click edit to start._"}
              </Markdown>
            </View>

            <View>
              <Text style={styles.sectionTitle}>Completion Reward</Text>
              <View style={styles.badgeAchievementCard}>
                <View style={styles.badgeTextContent}>
                  <Text style={styles.badgeSubtitle}>
                    Official Certification
                  </Text>
                  <Text style={styles.badgeDescription}>
                    Complete all modules and pass the final assessment to earn
                    your{" "}
                    <Text style={{ fontWeight: "700" }}>
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
      }

      case "Forum":
        return (
          <View style={styles.tabSection}>
            <Text style={styles.sectionTitle}>Discussion Forum</Text>
            <View style={styles.pillContainer}>
              <Pressable
                style={[
                  styles.pill,
                  forumType === "Public" && styles.activePill,
                ]}
                onPress={() => setForumType("Public")}
              >
                <Text
                  style={[
                    styles.pillText,
                    forumType === "Public" && styles.activePillText,
                  ]}
                >
                  Public
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.pill,
                  forumType === "Private" && styles.activePill,
                ]}
                onPress={() => setForumType("Private")}
              >
                <Text
                  style={[
                    styles.pillText,
                    forumType === "Private" && styles.activePillText,
                  ]}
                >
                  Private
                </Text>
              </Pressable>
            </View>
            <View style={styles.forumContent}>
              {forumType === "Public" ? (
                <Text style={styles.bodyText}>
                  Showing public community discussions...
                </Text>
              ) : (
                <Text style={styles.bodyText}>
                  Showing private instructor-led discussions...
                </Text>
              )}
            </View>
          </View>
        );

      case "Workshops":
        return (
          <View style={styles.tabSection}>
            <Text style={styles.sectionTitle}>Course Workshops</Text>
            {workshopsLoading ? (
              <ActivityIndicator color="#0a6340" size="large" />
            ) : (
              <PageRenderer
                elements={workshops}
                role={currentUser.role}
                courseId={id}
                onRegisterWorkshop={registerWorkshop}
                registering={registering}
                userMarks={userMarks}
              />
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      {/* outline bar using modal */}
      <Modal
        visible={drawerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setDrawerOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setDrawerOpen(false)}>
          <View style={styles.drawerScrim} />
        </TouchableWithoutFeedback>

        <View style={styles.drawerContainer}>
          <Pressable
            style={styles.drawerClose}
            onPress={() => setDrawerOpen(false)}
          >
            <X size={20} />
          </Pressable>

          <OutlineBar
            course={course}
            onSelectPage={handleSelectPage}
            progressMap={progressMap}
            editable={false}
            isCollapsed={false}
            isLocked={isLocked}
          />
        </View>
      </Modal>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero banner */}
        <ImageBackground
          source={require("../../assets/forest.png")}
          style={styles.backgroundImage}
          imageStyle={styles.backgroundImageStyle}
        >
          <View style={styles.courseContainer}>
            <Pressable onPress={() => setDrawerOpen(true)} hitSlop={8}>
              <Menu color="white" size={25} />
            </Pressable>
            <Pressable
              onPress={handleBack}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.btnPressed,
              ]}
            >
              <ChevronLeft size={24} color="white" />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={styles.description}>
                Start your learning journey
              </Text>
              <Text style={styles.title}>Course Details</Text>
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
                  onProgressUpdate={async () => {
                      await saveProgress(elementId, score, content);
                  }}
                  onRegisterWorkshop={registerWorkshop}
                  registering={registering}
                  userMarks={userMarks}
                />
              )}
            </View>
          ) : (
            <View>
              <View style={styles.headerRow}>
                <Text style={styles.courseTitle}>{course.title}</Text>
              </View>

              {/* Stat chips — wrap on narrow screens */}
              <View style={styles.statsRow}>
                <View style={styles.statChip}>
                  <Clock size={14} color="#363636" />
                  <Text style={styles.statLabel}>
                    {course.expected_completion_weeks} Weeks
                  </Text>
                </View>
                <View style={styles.statChip}>
                  <Calendar size={14} color="#363636" />
                  <Text style={styles.statLabel}>
                    Validity: {course.must_complete_in_weeks}w
                  </Text>
                </View>
                <View style={styles.statChip}>
                  <Award size={14} color="#363636" />
                  <Text style={styles.statLabel}>
                    Badge: {course.badge_expire_in_months}m
                  </Text>
                </View>
              </View>

              <Image
                source={
                  course.cover_img_url
                    ? { uri: course.cover_img_url }
                    : require("../../assets/first_aid.png")
                }
                style={styles.course_cover}
                resizeMode="cover"
              />

              <SlidingTabs
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={(tab) => setActiveTab(tab)}
              />

              <View style={styles.dynamicContent}>
                {renderOverviewContent()}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ai chatbot */}
      <AIChatBot isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      {!chatOpen && (
        <TouchableOpacity
          style={styles.floatingChatBtn}
          onPress={() => setChatOpen(true)}
          activeOpacity={0.85}
        >
          <Bot color="white" size={22} />
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
    drawerScrim: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.45)",
    },
    drawerContainer: {
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        width: Math.min(SCREEN_WIDTH * 0.5, 300),
        backgroundColor: "#fff",
        shadowColor: "#000",
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 16,
    },
    drawerClose: {
        alignSelf: "flex-end",
        padding: 14,
    },  
    scrollView: {
        flex: 1,
    },
    backgroundImage: {
        width: "100%",
        minHeight: 130,
    },
    backgroundImageStyle: {
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    courseContainer: {
        paddingVertical: 28,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        color: "white",
        marginLeft: 4,
    },
    description: {
        fontSize: 12,
        color: "rgba(255,255,255,0.85)",
        marginLeft: 4,
        marginBottom: 2,
    },
    backButton: {
        width: 38,
        height: 38,
        backgroundColor: "rgba(168,168,168,0.35)",
        padding: 7,
        borderRadius: 50,
        justifyContent: "center",
        alignItems: "center",
    },
    btnPressed: {
        opacity: 0.6,
    },
    contentWrapper: {
        marginTop: 18,
        paddingHorizontal: 16,
    },
    headerRow: {
        marginBottom: 8,
    },
    courseTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1a1a1a",
    },
    statsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 16,
    },
    statChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 20,
        backgroundColor: "#f0f0f0",
    },
    statLabel: {
        color: "#363636",
        fontSize: 12,
    },
    course_cover: {
        width: "100%",
        height: Math.round(SCREEN_WIDTH * 0.52),
        borderRadius: 12,
        backgroundColor: "#e0e0e0",
    },
    dynamicContent: {
        // paddingBottom: 30,   
    },
    tabSection: {
        paddingTop: 10,
        gap: 16,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: "650",
        color: "#3d3d3d",
        marginTop: 12,
        marginBottom: 6,
    },
    bodyText: {
        color: "#4A4A4A",
        lineHeight: 22,
        fontSize: 14,
    },
    pillContainer: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 14,
        marginTop: 6,
    },
    pill: {
        paddingHorizontal: 18,
        paddingVertical: 7,
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
        fontSize: 13,
        color: "#929292",
        fontWeight: "500",
    },
    activePillText: {
        color: "#fff",
    },
    forumContent: {
        padding: 14,
        backgroundColor: "#fff",
        borderRadius: 12,
        minHeight: 80,
        borderWidth: 1,
        borderColor: "#eee",
    },
    badgeAchievementCard: {
        backgroundColor: "#f8fdfb",
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: "#e0f2f1",
        marginTop: 8,
        marginBottom: 20,
    },
    badgeTextContent: { 
        flex: 1 
    },
    badgeSubtitle: {
        fontSize: 11,
        fontWeight: "700",
        color: "#0a6340",
        textTransform: "uppercase",
        marginBottom: 4,
        textAlign: "center",
    },
    badgeDescription: {
        fontSize: 13,
        color: "#444",
        lineHeight: 20,
        textAlign: "center",
    },
    badgePreviewContainer: {
        alignItems: "center",
        justifyContent: "center",
        marginTop: 16,
    },
    largeAchievementBadge: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: "#fff",
        borderWidth: 2,
        borderColor: "#FFD700",
    },
    verifiedBadge: {
        backgroundColor: "#0a6340",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: -8,
    },
    verifiedText: {
        color: "#fff",
        fontSize: 8,
        fontWeight: "900",
    },
    tagSectionContainer: { 
        gap: 20, 
        marginTop: 4 
    },
    tagGroup: { 
        gap: 6 
    },
    tagLabel: {
        fontSize: 11,
        fontWeight: "700",
        color: "#0a6340",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    tagList: { 
        flexDirection: "row", 
        flexWrap: "wrap", 
        gap: 8 
    },
    tagPill: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 14,
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
    fontWeight: "600"
    },

    /* Prerequisite */
    prereqSection: {
        backgroundColor: "#fffbeb",
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#fef3c7",
        marginTop: 8,
    },
    prereqItem: { 
        flexDirection: "row", 
        alignItems: "center", 
        marginBottom: 6 
    },
    prereqDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#d97706",
        marginRight: 10,
    },
    prereqText: { 
        fontSize: 13, 
        color: "#92400e", 
        fontWeight: "500" 
    },
    editorContainer: { 
        flex: 1, 
        paddingBottom: 50 
    },
    editorLabel: {
        color: "#0a6340",
        fontWeight: "bold",
        fontSize: 11,
        textTransform: "uppercase",
        marginBottom: 4,
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#1a1a1a",
        marginBottom: 16,
    },
    elementLoader: {
        marginTop: 40,
        alignItems: "center",
    },
    loaderText: {
        marginTop: 10,
        color: "#666",
        fontSize: 13,
    },
    guideInfoCard: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderWidth: 2,
        borderColor: "#e5e7eb",
        borderRadius: 8,
        marginBottom: 20,
    },
    guideInfoHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
    },
    guideInfoTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: "#374151",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    guideStatChip: { 
        flexDirection: "column", 
        gap: 3 
    },
    statValue: { 
        fontSize: 18, 
        fontWeight: "800", 
        color: "#111827" 
    },
    guideNotice: {
        fontSize: 12,
        color: "#4b5563",
        lineHeight: 18,
        borderTopWidth: 1,
        borderTopColor: "#f3f4f6",
        paddingTop: 10,
        marginTop: 4,
    },
    markdownContainer: {
        marginTop: 4,
    },
    floatingChatBtn: {
        position: "absolute",
        bottom: 24,
        right: 20,
        backgroundColor: "#0a6340",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 18,
        paddingVertical: 11,
        borderRadius: 28,
        gap: 7,
        elevation: 6,
    },
    chatBtnText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 14,
    },
});

export default UserModule;
