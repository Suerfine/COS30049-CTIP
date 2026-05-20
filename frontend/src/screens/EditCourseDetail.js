import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
  Pressable,
  ActivityIndicator,
  Image,
  Modal,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  Platform
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import {
  Award,
  Calendar,
  Clock,
  Menu,
  MessageSquare,
  User,
  Edit,
  X,
  Save,
  Heading1,
  Heading2,
  List,
  Bold,
  Italic,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ListOrdered,
  CopyPlus,
  Image as ImageIcon,
  Video as VideoIcon,
  HelpCircle as QuizIcon,
  CirclePlus,
  CircleMinus,
  Settings,
  Lock,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import DiscussionSection from "../components/DiscussionSection.js";
import Markdown from "react-native-markdown-display";
import * as DocumentPicker from 'expo-document-picker';

// Import Components
import OutlineBar from "../components/OutlineBar.js";
import { useCourseDetails } from "../hooks/useCourseDetails.js";
import SlidingTabs from "../components/SlidingTabs.js";
import { useElements } from "../hooks/useElements.js";
import PageRenderer from "../components/pageRenderer.js";
import { markdownStyles } from "../components/markdownStyle.js";
import { useAuth } from "../context/AuthContext.js";
import { useCourses } from "../hooks/useCourses.js";

const EditCourseDetail = () => {
  const route = useRoute();
  const { id, initialSection, discussionId } = route.params;
  const {
    course,
    loading,
    error,
    updateDescription,
    locationTags,
    categoryTags,
  } = useCourseDetails(id);
  const navigation = useNavigation();
  const auth = useAuth();
  const currentUser = auth?.currentUser;
  const { allCourseList } = useCourses();
  const { width } = useWindowDimensions();
  const isCompact = width < 900;

  const [selectedPage, setSelectedPage] = useState({ type: "overview" });
  const [pendingDiscussionId, setPendingDiscussionId] = useState(discussionId);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOutlineOpen, setIsMobileOutlineOpen] = useState(false);
  const [activeStyles, setActiveStyles] = useState([]);
  const [editingElementId, setEditingElementId] = useState(null);

  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editableText, setEditableText] = useState("");
  const [isAddElementVisible, setAddElementVisible] = useState(false);
  const [currentElementType, setCurrentElementType] = useState(null);
  const [newElementData, setNewElementData] = useState({
    text: "",
    url: "",
    transcript: "",
    question: "",
    options: ["", "", "", ""],
    answer: "",
    score: 1,
    workshop: {
      title: "",
      description: "",
      sessions: [{ date: "", startTime: "", endTime: "" }],
      location: "",
      link: "",
    },
  });

  useEffect(() => {
    setPendingDiscussionId(discussionId);

    if (initialSection === "forum") {
      setSelectedPage({ type: "forum" });
    }
  }, [initialSection, discussionId]);

  const {
    elements,
    loading: elementsLoading,
    createNewElement,
    updateExistingElement,
    deleteElement,
    moveElement,
    updatePageSettings,
  } = useElements(
    id,
    selectedPage?.page?.module_id || selectedPage?.module?.id,
    selectedPage?.page?.id,
  );

  const tabs = [{ id: "Overview", label: "Overview" }];

  const [quizConfig, setQuizConfig] = useState({
    max_attempts: 0,
    passing_score: 0,
  });

  useEffect(() => {
    if (course?.description) {
      setEditableText(course.description);
    }
  }, [course]);

  useEffect(() => {
    if (selectedPage?.page?.final_quiz === true) {
      setQuizConfig({
        max_attempts: String(selectedPage.page.max_tries ?? 1),
        passing_score: String(selectedPage.page.passing_score ?? 80),
      });
    }
  }, [selectedPage]);

  const handleSaveQuizSettings = async () => {
    if (!selectedPage?.page?.id) return;

    const success = await updatePageSettings(selectedPage.page.id, {
      max_attempts: quizConfig.max_attempts,
      passing_score: quizConfig.passing_score,
    });

    if (success) {
      alert("Quiz settings updated successfully!");

      selectedPage.page.max_tries = parseInt(quizConfig.max_attempts);
      selectedPage.page.passing_score = parseInt(quizConfig.passing_score);
    }
  };

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

  const handleSaveDescription = async () => {
    const result = await updateDescription(editableText);
    if (result.success) {
      setEditModalVisible(false);
    } else {
      window.alert("Error", result.error);
    }
  };

  const TypeAction = ({ icon, label, onPress }) => (
    <TouchableOpacity style={styles.typeActionBtn} onPress={onPress}>
      <View style={styles.typeActionIcon}>{icon}</View>
      <Text style={styles.typeActionLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const insertMarkdown = (syntax, setter) => {
    const formats = {
      h1: `# `,
      h2: `## `,
      bold: `**text**`,
      italic: `_text_`,
      bullet: `* `,
      left: `<div align="left">\n`,
      center: `<div align="center">\n`,
      right: `<div align="right">\n`,
    };

    const markup = formats[syntax] || "";
    setter((prev) => prev + markup);
  };

  const insertInNewElement = (syntax) => {
    insertMarkdown(syntax, (markup) => {
      setNewElementData((prev) => ({
        ...prev,
        text:
          typeof markup === "function" ? markup(prev.text) : prev.text + markup,
      }));
    });
  };

  const handleSaveElement = async () => {
    if (currentElementType === "workshop") {
      const { title, sessions } = newElementData.workshop;

      if (!title.trim()) {
        alert("Workshop Title is required.");
        return;
      }

      const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
      const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i;

      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(now.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      for (let i = 0; i < sessions.length; i++) {
        const s = sessions[i];

        if (!dateRegex.test(s.date)) {
          alert(`Session ${i + 1}: Date must be in YYYY-MM-DD format.`);
          return;
        }

        if (!timeRegex.test(s.startTime)) {
          alert(`Session ${i + 1}: Start Time is invalid or missing AM/PM.`);
          return;
        }
        if (!timeRegex.test(s.endTime)) {
          alert(`Session ${i + 1}: End Time is invalid or missing AM/PM.`);
          return;
        }

        const selectedDate = new Date(s.date);
        if (selectedDate < tomorrow) {
          alert(`Session ${i + 1}: Date must be at least tomorrow.`);
          return;
        }
      }
    }

    let success;

    if (currentElementType === "image") {
      if (!newElementData.imageFile && !editingElementId) {
        alert("Please upload an image file before saving.");
        return;
      }

      const formData = new FormData();
      formData.append("type", "image");
      
      // Calculate order
      const calculatedOrder = editingElementId ? undefined : elements.length + 1;
      if (calculatedOrder) {
        formData.append("order", String(calculatedOrder));
      }
      
      formData.append("score", String(parseInt(newElementData.score) || 1));

      const contentMetadata = {
        caption: newElementData.transcript || "",
        url: editingElementId ? (newElementData.url || "") : ""
      };
      formData.append("content", JSON.stringify(contentMetadata));

      if (newElementData.imageFile) {
        if (Platform.OS === 'web') {
          formData.append("file", newElementData.imageFile);
        } else {
          formData.append("file", {
            uri: newElementData.imageFile.uri.replace("file://", ""),
            name: newElementData.imageFile.name,
            type: newElementData.imageFile.mimeType || "image/jpeg"
          });
        }
      }
      if (editingElementId) {
        success = await updateExistingElement(editingElementId, formData);
      } else {
        success = await createNewElement(formData);
      }

    } else {
      const payload = {
        page_id: selectedPage.page.id,
        type: currentElementType,
        order: editingElementId ? undefined : elements.length + 1,
        score:
          currentElementType === "workshop"
            ? 1
            : parseInt(newElementData.score) || 1,
        content: {},
      };

      switch (currentElementType) {
        case "text":
          payload.content = { text: newElementData.text };
          break;
        case "video":
          payload.content = {
            url: newElementData.url,
            transcript: newElementData.transcript,
          };
          break;
        case "quiz_objective":
          payload.content = {
            question: newElementData.question,
            options: newElementData.options,
            answer: newElementData.answer,
          };
          break;
        case "workshop":
          payload.content = { ...newElementData.workshop };
          break;
      }

      if (editingElementId) {
        success = await updateExistingElement(editingElementId, payload);
      } else {
        success = await createNewElement(payload);
      }
    }

    if (success) {
      setAddElementVisible(false);
      setEditingElementId(null);
      setCurrentElementType(null);

      setNewElementData({
        text: "",
        url: "",
        transcript: "",
        question: "",
        options: ["", "", "", ""],
        answer: "",
        score: 1,
        imageFile: null, 
        workshop: {
          title: "",
          description: "",
          location: "",
          link: "",
          sessions: [{ date: "", startTime: "", endTime: "" }],
        },
      });
    }
  };

  const handleDateChange = (text, index) => {
    let cleaned = text.replace(/[^0-9]/g, "");
    if (cleaned.length > 4 && cleaned.length <= 6) {
      cleaned = `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
    } else if (cleaned.length > 6) {
      cleaned = `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
    }

    const newSessions = [...newElementData.workshop.sessions];
    newSessions[index].date = cleaned;

    setNewElementData({
      ...newElementData,
      workshop: {
        ...newElementData.workshop,
        sessions: newSessions,
      },
    });
  };

  const handleTimeChange = (text, index, field) => {
    let cleaned = text.replace(/[^0-9a-zA-Z]/g, "");
    let formatted = cleaned;

    if (cleaned.length >= 4) {
      const hh = cleaned.slice(0, 2);
      const mm = cleaned.slice(2, 4);
      const ampm = cleaned.slice(4, 6);
      formatted = `${hh}:${mm}${ampm ? " " + ampm : ""}`;
    } else if (cleaned.length === 3) {
      const hh = cleaned.slice(0, 1);
      const mm = cleaned.slice(1, 3);
      const ampm = cleaned.slice(3, 5);
      formatted = `${hh}:${mm}${ampm ? " " + ampm : ""}`;
    }

    const newSessions = [...newElementData.workshop.sessions];
    newSessions[index][field] = formatted.toUpperCase();

    setNewElementData({
      ...newElementData,
      workshop: {
        ...newElementData.workshop,
        sessions: newSessions,
      },
    });
  };

  const handleOpenEdit = (el) => {
    setEditingElementId(el.id);
    setCurrentElementType(el.type);

    if (el.type === "workshop") {
      setNewElementData({
        ...newElementData,
        workshop: {
          title: el.content.title || "",
          description: el.content.description || "",
          location: el.content.location || "",
          link: el.content.link || "",
          sessions: el.content.sessions || [
            { date: "", startTime: "", endTime: "" },
          ],
        },
        score: String(el.score || "1"),
      });
    } else {
      setNewElementData({
        text: el.content.text || "",
        url: el.content.url || "",
        transcript: el.content.transcript || el.content.caption || "",
        question: el.content.question || "",
        options: el.content.options || ["", "", "", ""],
        answer: el.content.answer || "",
        score: String(el.score || "1"),
        workshop: {
          title: "",
          description: "",
          location: "",
          link: "",
          sessions: [{ date: "", startTime: "", endTime: "" }],
        },
      });
    }

    setAddElementVisible(true);
  };

  const handleDelete = async (elementId) => {
    const success = await deleteElement(elementId);
    if (!success) {
      alert("Could not delete element. Please try again.");
    }
  };

  // Normalize image URLs to use forward slashes instead of backslashes
  const normalizedBadgeUrl = course?.badge_img_url
    ? course.badge_img_url.replace(/\\/g, "/")
    : null;
  const normalizedCoverUrl = course?.cover_img_url
    ? course.cover_img_url.replace(/\\/g, "/")
    : null;

  const renderOverviewContent = () => {
    const prerequisiteTitles =
      course.prerequisite_groups?.flatMap((group) =>
        group.prerequisites?.map((p) => {
          const match = allCourseList.find((c) => c.id === p.course_id);
          return match ? match.title : `Course #${p.course_id}`;
        }),
      ) || [];
    return (
      <View>
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
        {course.description !== "undefined" && (
          <View style={styles.markdownContainer}>
            <Markdown style={markdownStyles}>
              {course?.description ||
                "_No content provided yet. Click edit to start._"}
            </Markdown>
          </View>
        )}

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
                  normalizedBadgeUrl
                    ? { uri: normalizedBadgeUrl }
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

  const selectedPageLabel =
    selectedPage?.type === "page"
      ? selectedPage.page?.title
      : selectedPage?.type === "forum"
        ? "Discussion Forum"
        : selectedPage?.type === "workshops"
          ? "Course Workshops"
          : "Course Overview";

  return (
    <View style={[styles.rowContainer, isCompact && styles.rowContainerCompact]}>
      {/* Outlinebar */}
      {!isCompact && (
        <OutlineBar
          course={course}
          onSelectPage={setSelectedPage}
          editable={true}
          isCollapsed={isCollapsed}
          isPublished={course.status === "released" ? true : false}
          activePage={selectedPage}
        />
      )}
      <ScrollView style={{ height: "100vh" }}>
        <View style={styles.container}>
          {isCompact && (
            <View style={styles.mobileOutlineBlock}>
              <Pressable
                style={styles.mobileOutlineTrigger}
                onPress={() => setIsMobileOutlineOpen((prev) => !prev)}
              >
                <View>
                  <Text style={styles.mobileOutlineLabel}>Course section</Text>
                  <Text style={styles.mobileOutlineValue}>{selectedPageLabel}</Text>
                </View>
                {isMobileOutlineOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </Pressable>
              {isMobileOutlineOpen && (
                <OutlineBar
                  course={course}
                  onSelectPage={(page) => {
                    setSelectedPage(page);
                    setIsMobileOutlineOpen(false);
                  }}
                  editable={true}
                  isPublished={course.status === "released" ? true : false}
                  activePage={selectedPage}
                  dropdown
                />
              )}
            </View>
          )}
          {/* Background Image */}
          <ImageBackground
            source={require("../../assets/forest.png")}
            style={styles.backgroundImage}
          >
            <View style={styles.headerContainer}>
              <View style={styles.courseContainer}>
                <Pressable onPress={() => setIsCollapsed(!isCollapsed)}>
                  <Menu color="white" size={25} />
                </Pressable>
                <View>
                  <Text style={styles.description}>
                    Start your learning journey
                  </Text>
                  <Text style={styles.title}>
                    {selectedPage?.type === "page"
                      ? "Course Editor"
                      : selectedPage?.type === "forum"
                        ? "Course Forum"
                        : "Course Details"}
                  </Text>
                </View>
              </View>
              {selectedPage?.type === "page" && (
                <Pressable
                  onPress={() => setAddElementVisible(true)}
                  style={({ hovered }) => [
                    styles.btn,
                    hovered && styles.btnHover,
                  ]}
                >
                  <CopyPlus />
                  <Text style={styles.btnText}>Add Section</Text>
                </Pressable>
              )}
            </View>
          </ImageBackground>
          {/* Content */}
          <View style={styles.contentWrapper}>
            {selectedPage?.type === "page" ? (
              <View style={styles.editorContainer}>
                <Text style={styles.editorLabel}>Lesson Editor</Text>
                <Text style={styles.pageTitle}>
                  {selectedPage.page?.title || "Lesson Overview"}
                </Text>
                {/* Final Quiz Settings Section */}
                {currentUser.role === "admin" &&
                  selectedPage.page?.final_quiz === true && (
                    <View style={styles.quizSettingsCard}>
                      <View style={styles.quizSettingsHeader}>
                        <Settings size={18} color="#064114" />
                        <Text style={styles.quizSettingsTitle}>
                          Final Assessment Settings
                        </Text>
                      </View>

                      <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                          <Text style={styles.miniLabel}>Max Attempts</Text>
                          <TextInput
                            style={styles.smallInput}
                            keyboardType="numeric"
                            value={quizConfig.max_attempts}
                            onChangeText={(v) =>
                              setQuizConfig({ ...quizConfig, max_attempts: v })
                            }
                          />
                        </View>
                        <View style={{ flex: 1, marginRight: 10 }}>
                          <Text style={styles.miniLabel}>
                            Passing Score (%)
                          </Text>
                          <TextInput
                            style={styles.smallInput}
                            keyboardType="numeric"
                            value={String(quizConfig.passing_score)}
                            onChangeText={(v) =>
                              setQuizConfig({ ...quizConfig, passing_score: v })
                            }
                          />
                        </View>
                        <Pressable
                          style={styles.quizSaveBtn}
                          onPress={handleSaveQuizSettings}
                        >
                          <Save size={16} color="white" />
                          <Text
                            style={{
                              color: "white",
                              fontWeight: "bold",
                              marginLeft: 5,
                            }}
                          >
                            Save
                          </Text>
                        </Pressable>
                      </View>
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
                    onEditElement={handleOpenEdit}
                    onDeleteElement={handleDelete}
                    onMoveElement={moveElement}
                    isPublished={course.status === "released" ? true : false}
                  />
                )}
              </View>
            ) : selectedPage?.type === "forum" ? (
              <DiscussionSection
                courseId={id}
                initialDiscussionId={pendingDiscussionId}
                onInitialDiscussionOpened={() => setPendingDiscussionId(null)}
                navigation={navigation}
                styles={styles}
              />
            ) : (
              // Course Overview
              <View>
                <View style={styles.headerRow}>
                  <View style={styles.content}>
                    <Text style={styles.courseTitle}>{course.title}</Text>
                    <View style={[styles.statsRow, isCompact && styles.statsRowCompact]}>
                      <View style={styles.statChip}>
                        <Clock size={16} color="#363636" />
                        <Text style={styles.statLabel}>
                          {course.expected_completion_weeks} Weeks
                        </Text>
                      </View>
                      <View style={styles.statChip}>
                        <Calendar size={16} color="#363636" />
                        <Text style={styles.statLabel}>
                          Access limited to {course.must_complete_in_weeks} Weeks
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
                  {course.status === "unreleased" && (
                    <Pressable
                      style={styles.editButton}
                      onPress={() => setEditModalVisible(true)}
                    >
                      <Edit size={16} color="#0a6340" />
                      <Text style={styles.editButtonText}> Edit Section</Text>
                    </Pressable>
                  )}
                </View>

                <Image
                  source={
                    normalizedCoverUrl
                      ? { uri: normalizedCoverUrl }
                      : ''
                  }
                  style={styles.course_cover}
                />

                {renderOverviewContent()}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      {/* Markdown Editor Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={false}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Overview</Text>
            <Pressable onPress={() => setEditModalVisible(false)}>
              <X color="#666" size={22} />
            </Pressable>
          </View>

          <View style={styles.toolbar}>
            <View style={styles.toolGroup}>
              <Pressable
                style={styles.toolBtn}
                onPress={() => insertMarkdown("h1", setEditableText)}
              >
                <Heading1 size={20} color="#444" />
              </Pressable>
              <Pressable
                style={styles.toolBtn}
                onPress={() => insertMarkdown("h2", setEditableText)}
              >
                <Heading2 size={20} color="#444" />
              </Pressable>
            </View>
            <View style={styles.divider} />
            <View style={styles.toolGroup}>
              <Pressable
                style={styles.toolBtn}
                onPress={() => insertMarkdown("bold", setEditableText)}
              >
                <Bold size={20} color="#444" />
              </Pressable>
              <Pressable
                style={styles.toolBtn}
                onPress={() => insertMarkdown("italic", setEditableText)}
              >
                <Italic size={20} color="#444" />
              </Pressable>
            </View>
            <View style={styles.divider} />
            <View style={styles.toolGroup}>
              <Pressable
                style={styles.toolBtn}
                onPress={() => insertMarkdown("left", setEditableText)}
              >
                <AlignLeft size={20} color="#444" />
              </Pressable>
              <Pressable
                style={styles.toolBtn}
                onPress={() => insertMarkdown("center", setEditableText)}
              >
                <AlignCenter size={20} color="#444" />
              </Pressable>
              <Pressable
                style={styles.toolBtn}
                onPress={() => insertMarkdown("right", setEditableText)}
              >
                <AlignRight size={20} color="#444" />
              </Pressable>
            </View>
            <View style={styles.divider} />
            <View style={styles.toolGroup}>
              <Pressable
                style={styles.toolBtn}
                onPress={() => insertMarkdown("bullet", setEditableText)}
              >
                <List size={20} color="#444" />
              </Pressable>
            </View>
          </View>

          <TextInput
            style={styles.editorInput}
            multiline
            value={editableText}
            onChangeText={setEditableText}
            placeholder="Type your description here using Markdown..."
            textAlignVertical="top"
            placeholderTextColor="grey"
          />

          <Pressable style={styles.saveBtn} onPress={handleSaveDescription}>
            <Save color="white" size={20} />
            <Text style={styles.saveBtnText}>Save Overview</Text>
          </Pressable>
        </View>
      </Modal>
      <Modal
        visible={isAddElementVisible}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.selectionCard,
              isCompact && styles.selectionCardCompact,
              currentElementType === "text" && { height: "80%", maxWidth: 800 },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingElementId
                  ? `Edit`
                  : `New ${currentElementType || "Section"}`}
              </Text>
              <Pressable
                onPress={() => {
                  setAddElementVisible(false);
                  setCurrentElementType(null);
                }}
              >
                <X color="#666" size={24} />
              </Pressable>
            </View>

            {!currentElementType ? (
              <View style={styles.typeGrid}>
                <TypeAction
                  icon={<Type color="#0a6340" />}
                  label="Text"
                  onPress={() => setCurrentElementType("text")}
                />
                <TypeAction
                  icon={<ImageIcon color="#0a6340" />}
                  label="Image"
                  onPress={() => setCurrentElementType("image")}
                />
                <TypeAction
                  icon={<VideoIcon color="#0a6340" />}
                  label="Video"
                  onPress={() => setCurrentElementType("video")}
                />
                <TypeAction
                  icon={<QuizIcon color="#0a6340" />}
                  label="Quiz"
                  onPress={() => setCurrentElementType("quiz_objective")}
                />
                <TypeAction
                  icon={<Calendar color="#0a6340" />}
                  label="Workshop"
                  onPress={() => setCurrentElementType("workshop")}
                />
              </View>
            ) : (
              <ScrollView>
                {currentElementType === "text" && (
                  <View style={{ flex: 1 }}>
                    {/* Toolbar */}
                    <View style={styles.toolbar}>
                      <View style={styles.toolGroup}>
                        <Pressable
                          style={styles.toolBtn}
                          onPress={() => insertInNewElement("h1")}
                        >
                          <Heading1 size={20} color="#444" />
                        </Pressable>
                        <Pressable
                          style={styles.toolBtn}
                          onPress={() => insertInNewElement("h2")}
                        >
                          <Heading2 size={20} color="#444" />
                        </Pressable>
                      </View>
                      <View style={styles.divider} />
                      <View style={styles.toolGroup}>
                        <Pressable
                          style={styles.toolBtn}
                          onPress={() => insertInNewElement("bold")}
                        >
                          <Bold size={20} color="#444" />
                        </Pressable>
                        <Pressable
                          style={styles.toolBtn}
                          onPress={() => insertInNewElement("italic")}
                        >
                          <Italic size={20} color="#444" />
                        </Pressable>
                      </View>
                      <View style={styles.divider} />
                      <View style={styles.toolGroup}>
                        <Pressable
                          style={styles.toolBtn}
                          onPress={() => insertInNewElement("left")}
                        >
                          <AlignLeft size={20} color="#444" />
                        </Pressable>
                        <Pressable
                          style={styles.toolBtn}
                          onPress={() => insertInNewElement("center")}
                        >
                          <AlignCenter size={20} color="#444" />
                        </Pressable>
                        <Pressable
                          style={styles.toolBtn}
                          onPress={() => insertInNewElement("right")}
                        >
                          <AlignRight size={20} color="#444" />
                        </Pressable>
                      </View>
                      <View style={styles.divider} />
                      <View style={styles.toolGroup}>
                        <Pressable
                          style={styles.toolBtn}
                          onPress={() => insertInNewElement("bullet")}
                        >
                          <List size={20} color="#444" />
                        </Pressable>
                      </View>
                    </View>

                    <TextInput
                      style={[styles.editorInput, { minHeight: 300 }]}
                      multiline
                      value={newElementData.text}
                      onChangeText={(v) =>
                        setNewElementData({ ...newElementData, text: v })
                      }
                      placeholder="Write your content here..."
                      textAlignVertical="top"
                      placeholderTextColor="grey"
                    />
                    <View style={styles.scoreSection}>
                      <Text style={styles.inputLabel}>Mark / Weightage</Text>
                      <View style={styles.scoreInputWrapper}>
                        <TextInput
                          style={styles.scoreInput}
                          keyboardType="numeric"
                          value={newElementData.score}
                          onChangeText={(v) =>
                            setNewElementData({ ...newElementData, score: v })
                          }
                          placeholder="1"
                          placeholderTextColor="grey"
                        />
                        <Text style={styles.scoreHint}>Default is 1.</Text>
                      </View>
                    </View>
                  </View>
                )}

                {currentElementType === 'image' && (
                  <View style={{ marginTop: 10 }}>
                      <Text style={styles.inputLabel}>Upload Image Asset</Text>
                      
                      <View style={styles.uploadRow}>
                          <TouchableOpacity 
                              style={styles.pickerBtn} 
                              onPress={async () => {
                                  try {
                                      const res = await DocumentPicker.getDocumentAsync({
                                          type: 'image/*',
                                          copyToCacheDirectory: true
                                      });
                                      
                                      if (!res.canceled && res.assets && res.assets.length > 0) {
                                        const pickedFile = res.assets[0];
                                          if (Platform.OS === 'web') {
                                          const response = await fetch(pickedFile.uri);
                                          const fileBlob = await response.blob();
                                          
                                          const nativeFile = new File([fileBlob], pickedFile.name, { type: pickedFile.mimeType || 'image/jpeg' });
                                          
                                          setNewElementData(prev => ({
                                              ...prev,
                                              imageFile: nativeFile,
                                              url: pickedFile.name
                                          }));
                                      } else {
                                          setNewElementData(prev => ({
                                              ...prev,
                                              imageFile: pickedFile,
                                              url: pickedFile.name
                                          }));
                                      }
                                      }
                                  } catch (err) {
                                      console.error("Error picking file:", err);
                                  }
                              }}
                          >
                              <Text style={styles.pickerBtnText}>Choose File</Text>
                          </TouchableOpacity>
                          
                          <Text style={styles.uploadStatusText} numberOfLines={1}>
                              {newElementData.imageFile ? newElementData.imageFile.name : "No file chosen"}
                          </Text>
                      </View>

                      <Text style={styles.inputLabel}>Caption / Description</Text>
                      <TextInput 
                          style={styles.inputField} 
                          multiline 
                          value={newElementData.transcript} 
                          onChangeText={(v) => setNewElementData({...newElementData, transcript: v})} 
                          placeholder="Enter description..." 
                          placeholderTextColor="grey"
                      />
                  </View>
              )}

              {currentElementType === 'video' && (
                  <View style={{ marginTop: 10 }}>
                      <Text style={styles.inputLabel}>Source URL</Text>
                      <TextInput 
                          style={styles.inputField} 
                          value={newElementData.url} 
                          onChangeText={(v) => setNewElementData({...newElementData, url: v})} 
                          placeholder="https://youtube.com/..." 
                          placeholderTextColor="grey"
                      />
                      <Text style={styles.inputLabel}>Transcript</Text>
                      <TextInput 
                          style={styles.inputField} 
                          multiline 
                          value={newElementData.transcript} 
                          onChangeText={(v) => setNewElementData({...newElementData, transcript: v})} 
                          placeholder="Enter video transcript..." 
                          placeholderTextColor="grey"
                      />
                  </View>
              )}

                {currentElementType === "quiz_objective" && (
                  <View style={styles.quizEditorContainer}>
                    <Text style={styles.inputLabel}>Question Text</Text>
                    <TextInput
                      style={styles.inputField}
                      value={newElementData.question}
                      onChangeText={(v) =>
                        setNewElementData({ ...newElementData, question: v })
                      }
                      placeholder="e.g., What is the primary protocol for park safety?"
                      placeholderTextColor="grey"
                    />

                    <Text style={styles.inputLabel}>
                      Options (Select the radio button for the correct answer)
                    </Text>
                    {newElementData.options.map((opt, i) => (
                      <View key={i} style={styles.optionInputRow}>
                        <TouchableOpacity
                          style={[
                            styles.miniRadio,
                            newElementData.answer === opt &&
                              opt !== "" &&
                              styles.miniRadioActive,
                          ]}
                          onPress={() =>
                            setNewElementData({
                              ...newElementData,
                              answer: opt,
                            })
                          }
                        >
                          {newElementData.answer === opt && opt !== "" && (
                            <View style={styles.miniRadioInner} />
                          )}
                        </TouchableOpacity>
                        <TextInput
                          style={[
                            styles.inputField,
                            { flex: 1, marginBottom: 0 },
                          ]}
                          value={opt}
                          onChangeText={(v) => {
                            const newOpts = [...newElementData.options];
                            newOpts[i] = v;
                            setNewElementData({
                              ...newElementData,
                              options: newOpts,
                            });
                          }}
                          placeholder={`Option ${i + 1}`}
                          placeholderTextColor="grey"
                        />
                      </View>
                    ))}

                    <View style={styles.scoreSection}>
                      <Text style={styles.inputLabel}>Mark / Weightage</Text>
                      <View style={styles.scoreInputWrapper}>
                        <TextInput
                          style={styles.scoreInput}
                          keyboardType="numeric"
                          value={newElementData.score}
                          onChangeText={(v) =>
                            setNewElementData({ ...newElementData, score: v })
                          }
                          placeholder="1"
                        />
                        <Text style={styles.scoreHint}>Default is 1.</Text>
                      </View>
                    </View>
                  </View>
                )}

                {currentElementType === "workshop" && (
                  <View style={styles.workshopEditor}>
                    <Text style={styles.inputLabel}>Workshop Title</Text>
                    <TextInput
                      style={styles.inputField}
                      value={newElementData.workshop.title}
                      onChangeText={(v) =>
                        setNewElementData({
                          ...newElementData,
                          workshop: { ...newElementData.workshop, title: v },
                        })
                      }
                      placeholder="e.g., On-Site Navigation Training"
                      placeholderTextColor="grey"
                    />

                    <Text style={styles.inputLabel}>Description</Text>
                    <TextInput
                      style={[styles.inputField, { height: 80 }]}
                      multiline
                      value={newElementData.workshop.description}
                      onChangeText={(v) =>
                        setNewElementData({
                          ...newElementData,
                          workshop: {
                            ...newElementData.workshop,
                            description: v,
                          },
                        })
                      }
                      placeholder="Briefly explain what will happen..."
                      placeholderTextColor="grey"
                    />

                    <Text style={styles.inputLabel}>Workshop Sessions</Text>
                    {newElementData.workshop.sessions.map((session, index) => (
                      <View
                        key={index}
                        style={[
                          styles.row,
                          { marginBottom: 12, alignItems: "flex-end" },
                        ]}
                      >
                        <View style={{ flex: 1.2, marginRight: 8 }}>
                          <Text style={styles.miniLabel}>Date</Text>
                          <TextInput
                            style={styles.inputField}
                            value={session.date}
                            maxLength={10}
                            onChangeText={(v) => handleDateChange(v, index)}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor="grey"
                          />
                        </View>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={styles.miniLabel}>Start</Text>
                          <TextInput
                            style={styles.inputField}
                            value={session.startTime}
                            maxLength={8}
                            onChangeText={(v) =>
                              handleTimeChange(v, index, "startTime")
                            }
                            placeholder="10:00 AM"
                            placeholderTextColor="grey"
                          />
                        </View>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={styles.miniLabel}>End</Text>
                          <TextInput
                            style={styles.inputField}
                            value={session.endTime}
                            maxLength={8}
                            onChangeText={(v) =>
                              handleTimeChange(v, index, "endTime")
                            }
                            placeholder="12:00 PM"
                            placeholderTextColor="grey"
                          />
                        </View>

                        {newElementData.workshop.sessions.length > 1 && (
                          <TouchableOpacity
                            style={{ marginBottom: 15 }}
                            onPress={() => {
                              const newSessions =
                                newElementData.workshop.sessions.filter(
                                  (_, i) => i !== index,
                                );
                              setNewElementData({
                                ...newElementData,
                                workshop: {
                                  ...newElementData.workshop,
                                  sessions: newSessions,
                                },
                              });
                            }}
                          >
                            <CircleMinus color="#dc2626" size={20} />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}

                    <TouchableOpacity
                      style={styles.addSessionBtn}
                      onPress={() => {
                        setNewElementData({
                          ...newElementData,
                          workshop: {
                            ...newElementData.workshop,
                            sessions: [
                              ...newElementData.workshop.sessions,
                              { date: "", startTime: "", endTime: "" },
                            ],
                          },
                        });
                      }}
                    >
                      <CirclePlus color="#0a6340" size={18} />
                      <Text style={styles.addSessionText}>
                        Add Another Slot
                      </Text>
                    </TouchableOpacity>

                    <Text style={styles.inputLabel}>
                      Location (Physical or Platform)
                    </Text>
                    <TextInput
                      style={styles.inputField}
                      value={newElementData.workshop.location}
                      onChangeText={(v) =>
                        setNewElementData({
                          ...newElementData,
                          workshop: { ...newElementData.workshop, location: v },
                        })
                      }
                      placeholder="e.g. SFC Hall or Zoom"
                      placeholderTextColor="grey"
                    />

                    <Text style={styles.inputLabel}>
                      Session URL (Optional Link)
                    </Text>
                    <TextInput
                      style={styles.inputField}
                      value={newElementData.workshop.link}
                      onChangeText={(v) =>
                        setNewElementData({
                          ...newElementData,
                          workshop: { ...newElementData.workshop, link: v },
                        })
                      }
                      placeholder="https://..."
                      placeholderTextColor="grey"
                    />

                    <Text style={styles.scoreHint}>
                      Points awarded: 1 (Static)
                    </Text>
                  </View>
                )}

                <Pressable style={[styles.saveBtn]} onPress={handleSaveElement}>
                  <Save color="white" size={18} />
                  <Text style={styles.saveBtnText}>Save Section</Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  rowContainer: {
    flex: 1,
    flexDirection: "row",
  },
  rowContainerCompact: {
    flexDirection: "column",
  },
  mobileOutlineBlock: {
    marginTop: 12,
    marginBottom: 10,
    gap: 10,
    zIndex: 20,
  },
  mobileOutlineTrigger: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    backgroundColor: "white",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mobileOutlineLabel: {
    fontSize: 11,
    color: "#6b7280",
    textTransform: "uppercase",
    fontWeight: "700",
  },
  mobileOutlineValue: {
    marginTop: 3,
    fontSize: 15,
    color: "#111827",
    fontWeight: "600",
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
    marginHorizontal: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 20,
  },
  statsRowCompact: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  courseTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
  },
  statLabel: {
    color: "#363636",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  content: {
    flex: 1,
    marginRight: 20,
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
    width: "100%",
    maxWidth: 800,
    aspectRatio: 2,
    height: undefined,
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
  attachmentImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginTop: 10,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editButtonText: {
    color: "#0a6340",
    fontWeight: "600",
    fontSize: 13,
  },
  modalContent: {
    flex: 1,
    backgroundColor: "white",
    padding: 20,
    paddingTop: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e9ecef",
    marginBottom: 10,
    gap: 5,
  },
  toolGroup: {
    flexDirection: "row",
    gap: 2,
  },
  toolBtnActive: {
    backgroundColor: "#dee2e6",
  },
  toolBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 6,
  },
  toolBtnText: {
    fontSize: 14,
    color: "#444",
  },
  editorInput: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
  saveBtn: {
    flexDirection: "row",
    backgroundColor: "#0a6340",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 20,
    maxWidth: 200,
    alignSelf: "flex-end",
  },
  saveBtnText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: "#dee2e6",
    marginHorizontal: 8,
  },
  editorInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
    borderWidth: 1,
    borderColor: "#eee",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  selectionCard: {
    backgroundColor: "white",
    width: "90%",
    maxWidth: 500,
    borderRadius: 20,
    padding: 25,
    maxHeight: "80%",
  },
  selectionCardCompact: {
    width: "100%",
    maxHeight: "90%",
    padding: 16,
  },
  inputField: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#eee",
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
    marginTop: 20,
    justifyContent: "center",
  },
  typeActionBtn: {
    width: "45%",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
  },
  typeActionIcon: {
    marginBottom: 8,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 50,
  },
  typeActionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  scoreSection: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  scoreInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 5,
  },
  scoreInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 10,
    width: 80,
    borderWidth: 1,
    borderColor: "#ddd",
    textAlign: "center",
    fontWeight: "bold",
    color: "#0a6340",
  },
  scoreHint: {
    fontSize: 12,
    color: "#888",
    fontStyle: "italic",
    flex: 1,
  },
  quizEditorContainer: {
    marginTop: 10,
    gap: 10,
  },
  optionInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  miniRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  miniRadioActive: {
    borderColor: "#0a6340",
  },
  miniRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0a6340",
  },
  doneButton: {
    padding: 10,
  },
  doneButtonText: {
    color: "#666",
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  workshopEditor: {
    paddingTop: 10,
    gap: 2,
  },
  row: {
    flexDirection: "row",
  },
  typeActionBtn: {
    width: "45%",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  addSessionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: -5,
    marginBottom: 15,
    padding: 8,
    backgroundColor: "#f0fdf4",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  addSessionText: {
    fontSize: 13,
    color: "#0a6340",
    fontWeight: "600",
  },
  miniLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0a6340",
    marginVertical: 4,
    textTransform: "uppercase",
  },
  tagSectionContainer: {
    gap: 25,
  },
  tagGroup: {
    gap: 8,
    marginTop:12
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
  quizSettingsCard: {
    backgroundColor: "#edefed",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#dae8df",
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  quizSettingsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#dcfce7",
  },
  quizSettingsTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#166534",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  smallInput: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#b91c1c22",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: "#1a1a1a",
    fontWeight: "600",
  },
  quizSaveBtn: {
    backgroundColor: "#0a6340",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    borderRadius: 8,
    height: 42,
    alignSelf: "flex-end",
    marginTop: 5,
  },
  miniLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#15803d",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  guideInfoCard: {
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    marginBottom: 25,
  },
  guideInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 15,
  },
  guideInfoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#166534",
  },
  guideStatChip: {
    flex: 1,
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dcfce7",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0a6340",
  },
  guideNotice: {
    fontSize: 12,
    color: "#15803d",
    fontStyle: "italic",
    marginTop: 15,
    textAlign: "center",
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
  uploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 6,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee',
    gap: 12,
  },
  pickerBtn: {
    backgroundColor: '#0a6340',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  pickerBtnText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
  },
  uploadStatusText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
});

export default EditCourseDetail;
