import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ImageBackground,
  StatusBar,
  TextInput,
  Alert,
} from "react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CircleX,
  ListFilter,
  SignalZero,
  ChevronLeft,
  SlidersHorizontal,
  Search,
} from "lucide-react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { Modal } from "react-native";

// Import other hook and component
import { useUserDashboard } from "../hooks/useUserDashboard";
import { useUserCourse } from "../hooks/useUserCourse";
import ConfirmEnroll from "../components/ConfirmEnroll";
import SlidingTabs from "../components/SlidingTabs";
import FilterSidebar from "../components/FilterSidebar";
import CourseCard from "../components/CourseCard";
import { useTranslation } from "react-i18next";

const UserCourse = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const route = useRoute();
  const filterCategory = route.params?.filterCategory;
  const { progressData, userType } = useUserDashboard();
  const {
    selectedCourse,
    setSelectedCourse,
    modalVisible,
    setModalVisible,
    filterVisible,
    setFilterVisible,
    allcourseFilter,
    setAllCourseFilter,
    filters,
    setFilters,
    tempFilters,
    setTempFilters,
    statusLabels,
    tabs,
    myEnrollments,
    coursesWithStatus,
    filteredCourses,
    courses,
    handleEnrollment,
    getUnfulfilledPrerequisites,
    handleApply,
    removeFilter,
    allTagList,
    addTag,
    searchText,
    setSearchText,
    getPreviousEnrollments,
    openHistory,
    historyModalVisible,
    selectedHistory,
    setHistoryModalVisible,
  } = useUserCourse();

  // sync parameter with filter from UserDashboard Explore Categories section
  useFocusEffect(
    useCallback(() => {
      if (filterCategory) {
        setFilters((prev) => ({
          ...prev,
          category: [filterCategory],
        }));

        setTempFilters((prev) => ({
          ...prev,
          category: [filterCategory],
        }));
      }
    }, [filterCategory]),
  );

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.courseContainer}>
          {/* Background Image */}
          <ImageBackground
            source={require("../../assets/forest.png")}
            style={styles.backgroundImage}
          >
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <ChevronLeft size={24} color="white" />
            </Pressable>
            <View style={styles.courseHeader}>
              <View>
                <Text style={styles.description}>
                  {t("here you can find all courses")}
                </Text>
                <Text style={styles.title}>{t("all courses")}</Text>
              </View>
            </View>
          </ImageBackground>
        </View>
        <View style={styles.filterContainer}>
          <SlidingTabs
            tabs={tabs}
            activeTab={allcourseFilter}
            onTabChange={(id) => setAllCourseFilter(id)}
          />
        </View>
        {/* Search and Filter */}
        <View style={styles.toolbar}>
          <View style={styles.search}>
            <Search size={18} />
            <TextInput
              style={styles.input}
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search..."
              placeholderTextColor="#8f8f8f"
            />
          </View>

          <Pressable
            onPress={() => {
              setTempFilters(filters);
              setFilterVisible(true);
            }}
            style={({ hovered }) => [
              styles.filterButton,
              hovered && styles.filterHover,
            ]}
          >
            <SlidersHorizontal size={18} />
          </Pressable>
        </View>
        <View style={styles.pillContainer}>
          {filters.status !== "all" && (
            <View style={styles.pill}>
              <Text style={styles.pillText}>
                {statusLabels[filters.status]}
              </Text>
              <Pressable onPress={() => removeFilter("status")}>
                <CircleX size={16} color="white" />
              </Pressable>
            </View>
          )}
          {Array.isArray(filters.location) &&
            filters.location.map((locName) => (
              <View
                key={locName}
                style={[styles.pill, { backgroundColor: "#18704d" }]}
              >
                <Text style={styles.pillText}>{locName}</Text>
                <Pressable onPress={() => removeFilter("location", locName)}>
                  <CircleX size={16} color="white" />
                </Pressable>
              </View>
            ))}

          {Array.isArray(filters.category) &&
            filters.category.map((catName) => (
              <View key={catName} style={styles.pill}>
                <Text style={styles.pillText}>{catName}</Text>
                <Pressable onPress={() => removeFilter("category", catName)}>
                  <CircleX size={16} color="white" />
                </Pressable>
              </View>
            ))}
        </View>
        <View style={styles.cardContainer}>
          {filteredCourses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t("no courses found")}</Text>
            </View>
          ) : (
            filteredCourses.map((course) => {
              const numModules = course.module_count ? course.module_count : 0;
              return (
                <View key={course.id} style={styles.cardWrapper}>
                  <CourseCard
                    key={course.id}
                    id={course.id}
                    coverImgUrl={course.cover_img_url}
                    courseTitle={course.title}
                    numModules={numModules}
                    duration={course.expected_completion_weeks}
                    expiry={course.must_complete_in_weeks}
                    userType={userType}
                    progress={course.progress}
                    // enrollment
                    enrollmentStatus={course.enrollmentStatus}
                    previousEnrollments={getPreviousEnrollments(course.id)}
                    missingPrerequisites={getUnfulfilledPrerequisites(course)}
                    onViewHistory={() =>
                      openHistory(getPreviousEnrollments(course.id))
                    }
                    isEnrollable={course.is_enrollable}
                    onPress={() =>
                      navigation.navigate("ParkGuideMobileRoot", {
                        screen: "UserModule",
                        params: {
                          id: course.id,
                          enrollmentStatus: course.enrollmentStatus ?? null,
                          enrollmentId: course.enrollmentId,
                        },
                      })
                    }
                    onEnroll={() => {
                      if (!course.is_enrollable) {
                        const unfulfilled = getUnfulfilledPrerequisites(course);
                        const prereqList =
                          unfulfilled.length > 0
                            ? unfulfilled.join(", ")
                            : "Unknown prerequisite(s)";

                        Alert.alert(
                          "Prerequisites Not Fulfilled",
                          `The following prerequisite(s) have not been fulfilled: ${prereqList}`,
                        );

                        return;
                      }

                      Alert.alert(
                        "Confirm Enrollment",
                        `Are you sure you want to enroll in ${course.title}?`,
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Enroll",
                            onPress: () => {
                              navigation.navigate("PaymentScreen", { course });
                            },
                          },
                        ],
                      );
                    }}
                  />
                </View>
              );
            })
          )}
        </View>

        {/* History modal */}
        <Modal
          visible={historyModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setHistoryModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Enrollment History</Text>
              {selectedHistory.map((item, index) => (
                <View key={index} style={styles.historyRow}>
                  <Text style={styles.historyDate}>
                    Enrolled: {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                  <Text
                    style={[
                      styles.historyStatus,
                      { color: item.status === "failed" ? "red" : "orange" },
                    ]}
                  >
                    Status: {item.status.toUpperCase()}
                  </Text>
                </View>
              ))}
              <Pressable
                onPress={() => setHistoryModalVisible(false)}
                style={styles.closeBtn}
              >
                <Text style={{ color: "white" }}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </ScrollView>
      <FilterSidebar
        visible={filterVisible}
        allTagList={allTagList}
        tempFilters={tempFilters}
        setTempFilters={setTempFilters}
        onClose={() => setFilterVisible(false)}
        onApply={handleApply}
        onReset={() => {
          const reset = { status: "all", category: [], location: [] };
          setTempFilters(reset);
          setFilters(reset);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 10,
  },
  courseContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  backgroundImage: {
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
    resizeMode: "cover",
    marginTop: 10,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    flexDirection: "row",
  },
  courseHeader: {
    paddingHorizontal: 15,
    paddingVertical: 20,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    userSelect: "none",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    color: "white",
  },
  description: {
    fontSize: 12,
    lineHeight: 24,
    color: "white",
  },
  backButton: {
    width: 40,
    height: 40,
    zIndex: 10,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    padding: 8,
    borderRadius: 50,
    marginLeft: 10,
    alignSelf: "center",
  },
  cardContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "stretch",
    gap: 16,
    paddingTop: 10,
    paddingBottom: 20,
  },
  cardWrapper: {
    width: 300,
    maxWidth: "100%",
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    borderBottomColor: "#42424255",
    borderBottomWidth: 1,
    paddingBottom: 10,
  },
  filterButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#8f8f8f",
    backgroundColor: "white",
  },
  filterHover: {
    color: "#efab21",
  },
  emptyContainer: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  emptyText: {
    fontSize: 20,
    color: "#666",
  },
  pillContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 15,
    marginTop: 5,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0a6340",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 14,
    color: "white",
    marginRight: 6,
    fontWeight: "500",
  },
  search: {
    flex: 1,
    flexDirection: "row",
    gap: 7,
    borderWidth: 1,
    borderColor: "#8f8f8f",
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "white",
    borderRadius: 15,
    alignItems: "center",
  },
  input: {
    flex: 1,
    paddingVertical: 2,
    outlineStyle: "none",
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: 300,
    maxWidth: "100%",
    alignSelf: "center",
  },
  // history modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#333",
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  historyDate: {
    fontSize: 14,
    color: "#475569",
    fontWeight: "500",
  },
  historyStatus: {
    fontSize: 12,
    fontWeight: "bold",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    textTransform: "uppercase",
    overflow: "hidden",
  },
  closeBtn: {
    marginTop: 25,
    backgroundColor: "#0a6340",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
});

export default UserCourse;
