import { useState, useEffect, useMemo, useCallback } from "react";
import { Platform, Alert } from "react-native";
import { useTranslation } from "react-i18next";
import { courseService } from "../services/courseService";
import { enrollmentService } from "../services/EnrollmentService";
import { useAuth } from "../context/AuthContext";
import { progressService } from "../services/ProgressService";

export const useUserCourse = () => {
  const { t, i18n } = useTranslation();
  const { currentUser } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [userCourses, setUserCourses] = useState([]); 
  const [allTagList, setAllTagList] = useState([]);
  const [allcourseFilter, setAllCourseFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [coursesWithStatus, setCoursesWithStatus] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState({ status: "all", category: [], location: [] });
  const [tempFilters, setTempFilters] = useState(filters);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState([]);
  const [Enrollments, setEnrollments] = useState([]);

  const statusLabels = useMemo(() => ({
    all: t("status.all"),
    applied: t("status.applied"), // waiting for admin to approve enrollment
    inProgress: t("status.in_progress"),
    inReview: t("status.in_review"),     // course completed, waiting for admin approve -> issue badge
    completed: t("status.completed"),
    failed: t("status.failed"),
    rejected: t("status.rejected"), // admin rejected the enrollment
    notEnrolled: t("status.not_enrolled"),
  }), [t]);

  const tabs = useMemo(() => ([
    { id: "all", label: t("status.all") },
    { id: "basic", label: t("status.basic") },
    { id: "advanced", label: t("status.advanced") }
  ]), [t]);

  // use GET /api/courses/user
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [courseRes, tagRes] = await Promise.all([
        courseService.getUserCourses({ size: 100 }),
        courseService.getAllTags(),
      ]);
      
      setUserCourses(courseRes.data || courseRes || []);
      setAllTagList(tagRes.data || tagRes || []);
    } catch (err) {
      console.error("Initialization failed", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // course.status = enrollment status
  useEffect(() => {
    const enrichCourses = async () => {
      if (userCourses.length === 0) return;

      const enriched = await Promise.all(
        userCourses.map(async (course) => {
          const enrollmentStatus = course.status;

          let progressValue = 0;

          if (enrollmentStatus === "in_progress") {
            try {
              const res = await progressService.getCourseProgress(course.id);
              const earned = Number(res.score) || 0;
              const total = Number(res.maxScore) || 0;

              // Check if total is 0 to avoid division by zero
              progressValue = total > 0 ? earned / total : 0;
              
              console.log(`Course ${course.id} Progress Calc:`, earned, "/", total, "=", progressValue);
            } catch (err) {
              console.error(`Progress fetch failed for course ${course.id}`, err);
              progressValue = 0;
            }
          } else if (enrollmentStatus === "completed") {
            progressValue = 1;
          }

          return {
            ...course,
            enrollmentStatus,
            enrollmentId: course.enrollment?.id ?? null,
            progress: progressValue, 
          };
        })
      );
      setCoursesWithStatus(enriched);
    };

    enrichCourses();
  }, [userCourses]); 

  // called after confirm enroll
  const handleEnrollment = useCallback(
    async (courseId) => {
      try {
        await enrollmentService.enroll(courseId); 
        await loadInitialData();
        const successMsg = "Enrollment request sent for approval.";
        Platform.OS === "web"
          ? window.alert(successMsg)
          : Alert.alert("Success", successMsg);
      } catch (err) {
        const failMsg = err.response?.data?.message || err.message || "Failed to enroll.";
        Platform.OS === "web"
          ? window.alert(failMsg)
          : Alert.alert("Enrollment failed", failMsg);
      }
    }, [loadInitialData]);

    // check the unfulfilled prerequisites
    const getUnfulfilledPrerequisites = useCallback((course) => {
      if (!course.prerequisite_groups || course.prerequisite_groups.length === 0) return [];

      const unfulfilled = [];

      course.prerequisite_groups.forEach((group) => {
        const prereqs = group.prerequisites || [];

        const groupSatisfied = prereqs.some((prereq) => {
          const prereqCourse = coursesWithStatus.find(
            (c) => Number(c.id) === Number(prereq.course_id)
          );
          return prereqCourse?.enrollmentStatus === "completed";
        });

        if (!groupSatisfied) {
          prereqs.forEach((prereq) => {
            const prereqCourse = coursesWithStatus.find(
              (c) => Number(c.id) === Number(prereq.course_id)
            );
            if (prereqCourse) unfulfilled.push(prereqCourse.title);
          });
        }
      });

      return unfulfilled;
    }, [coursesWithStatus]);

    // filter applied courses
    const appliedCourses = useMemo(() =>
      coursesWithStatus.filter(c => c.enrollmentStatus === "applied"),
    [coursesWithStatus]);

    // filter in progress courses
    const inProgressCourses = useMemo(() =>
      coursesWithStatus.filter(c => c.enrollmentStatus === "in_progress"),
    [coursesWithStatus]);

    // filter in review courses
    const inReviewCourses = useMemo(() =>
      coursesWithStatus.filter(c => c.enrollmentStatus === "in_review"),
    [coursesWithStatus]);

    // filter completed courses
    const completedCourses = useMemo(() =>
      coursesWithStatus.filter(c => c.enrollmentStatus === "completed"),
    [coursesWithStatus]);

    // filter failed courses
    const failedCourses = useMemo(() =>
      coursesWithStatus.filter(c => c.enrollmentStatus === "failed"),
    [coursesWithStatus]);

    // filter rejected courses
    const rejectedCourses = useMemo(() =>
      coursesWithStatus.filter(c => c.enrollmentStatus === "rejected"),
    [coursesWithStatus]);

  // merge enrollment status first via courses with status, then apply filters based on tag
  const filteredCourses = useMemo(() => {
    return coursesWithStatus.filter((course) => {
      const hasPrerequisites =
        course.prerequisite_groups && course.prerequisite_groups.length > 0;

      let matchesTab = true;
      if (allcourseFilter === "basic") {
        matchesTab = !hasPrerequisites;
      } else if (allcourseFilter === "advanced") {
        matchesTab = hasPrerequisites;
      }

      const matchesSearch = course.title
        .toLowerCase()
        .includes(searchText.toLowerCase());

        const matchesStatus =
        filters.status === "all" ||

        (filters.status === "applied" && course.enrollmentStatus === "applied") ||
        (filters.status === "inProgress" && course.enrollmentStatus === "in_progress") ||
        (filters.status === "inReview" && course.enrollmentStatus === "in_review") ||
        (filters.status === "completed" && course.enrollmentStatus === "completed") ||
        (filters.status === "failed" && course.enrollmentStatus === "failed") ||
        (filters.status === "rejected" && course.enrollmentStatus === "rejected") ||
        (filters.status === "notEnrolled" && !course.enrollmentStatus);

      const matchesLocation =
        !filters.location ||
        filters.location === "all" ||
        (Array.isArray(filters.location) && filters.location.length === 0) ||
        course.tags?.some(
          (tag) =>
            tag.type === "location" && filters.location.includes(tag.title),
        );

      const matchesCategory =
        !filters.category ||
        filters.category === "all" ||
        (Array.isArray(filters.category) && filters.category.length === 0) ||
        course.tags?.some(
          (tag) =>
            tag.type?.toLowerCase() === "category" && filters.category.includes(tag.title),
        );

      return (
        matchesTab &&
        matchesSearch &&
        matchesLocation &&
        matchesCategory &&
        matchesStatus
        );
    });
  }, [coursesWithStatus, searchText, filters, allcourseFilter]);

  const removeFilter = (key, value) => {
    setFilters((prev) => {
      if (key === "status") return { ...prev, status: "all" };

      const newList = Array.isArray(prev[key])
        ? prev[key].filter((item) => item !== value)
        : [];

      return { ...prev, [key]: newList };
    });
  };

  const handleApply = () => {
    setFilters(tempFilters);
    setFilterVisible(false);
    };

  const addTag = async (tagData) => {
    const isDuplicate = allTagList.some(
      (t) => t.title.toLowerCase() === tagData.title.toLowerCase(),
    );

    if (isDuplicate) {
      window.alert("A tag with this name already exists.");
      return false;
    }

    try {
      setLoading(true);
      await courseService.createTag(tagData);
      const updatedTags = await courseService.getAllTags();
      setAllTagList(updatedTags.data || updatedTags);
      return true;
    } catch (error) {
      console.error("Tag Creation Error:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const openHistory = (enrollments) => {
      setSelectedHistory(enrollments);
      setHistoryModalVisible(true);
  };

  useEffect(() => {
    const loadEnrollments = async () => {
      try {
        const res = await enrollmentService.getAll(1, 1000);
        setEnrollments(res.data || []);
      } catch (err) {
        console.error("Failed to load enrollments", err);
      }
    };

    loadEnrollments();
  }, []);

  const getPreviousEnrollments = useCallback((courseId) => {
    if (!courseId || !Enrollments.length || !currentUser?.id) return [];

    const result = Enrollments.filter((e) => {
      return (
        Number(e.course_id) === Number(courseId) &&
        Number(e.user_id) === Number(currentUser.id)
      );
    });
    console.log(Enrollments);

    return result;
  }, [Enrollments, currentUser]);

  return {
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
    coursesWithStatus,
    filteredCourses,
    handleEnrollment,
    getUnfulfilledPrerequisites,
    removeFilter,
    courses: userCourses,
    allTagList,
    addTag,
    handleApply,
    setSearchText,
    searchText,
    appliedCourses,
    inProgressCourses,
    inReviewCourses,
    completedCourses,
    failedCourses,
    rejectedCourses,
    getPreviousEnrollments, openHistory, historyModalVisible, selectedHistory,
    setHistoryModalVisible
  };
};
