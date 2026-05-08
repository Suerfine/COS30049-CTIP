import { useState, useEffect, useMemo, useCallback } from "react";
import { Platform, Alert } from "react-native";
// import { useUserDashboard } from "./useUserDashboard";
import { useTranslation } from "react-i18next";
import { courseService } from "../services/courseService";
import { enrollmentService } from "../services/EnrollmentService";
import { useAuth } from "../context/AuthContext";
import { userDashboardService } from "../services/userDashboardService";
import { progressService } from "../services/ProgressService";

export const useUserCourse = () => {
  const { t, i18n } = useTranslation();
  const { currentUser } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [courses, setCourses] = useState([]);
  const [allCourseList, setAllCourseList] = useState([]);
  const [allTagList, setAllTagList] = useState([]);
  const [allcourseFilter, setAllCourseFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [myEnrollments, setMyEnrollments] = useState([]);  
  const [coursesWithStatus, setCoursesWithStatus] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState({ status: "all", category: [], location: [] });
  const [tempFilters, setTempFilters] = useState(filters);

  const statusLabels = useMemo(() => ({
    inProgress: t("status.in progress"),
    completed: t("status.completed"),
    notEnrolled: t("status.not enrolled"),
    inReview: t('status.in review'),
  }), [t]);

  const tabs = useMemo(() => ([
    { id: "all", label: t("status.all") },
    { id: "basic", label: t("status.basic") },
    { id: "advanced", label: t("status.advanced") }
  ]), [t]);

  // use GET /api/courses
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [courseRes, tagRes, enrollmentRes] = await Promise.all([
        courseService.getAll({ size: 100 }),
        courseService.getAllTags(),
        enrollmentService.getMyEnrollments()
      ]);
      
      setCourses(courseRes.data || courseRes || []);
      setAllTagList(tagRes.data || tagRes || []);
      setMyEnrollments(Array.isArray(enrollmentRes) ? enrollmentRes : enrollmentRes?.data || []);
    } catch (err) {
      console.error("Initialization failed", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
  const enrichCourses = async () => {
    if (courses.length === 0) return;

    const enriched = await Promise.all(
      courses.map(async (course) => {
        const enrollment = myEnrollments.find(
          (e) => Number(e.course_id) === Number(course.id)
        );

        let progressValue = 0;

        if (enrollment?.status === "in_progress") {
          try {
            const res = await progressService.getCourseProgress(course.id);
            try {
              const res = await progressService.getCourseProgress(course.id);
              const earned = Number(res.score) || 0;
              const total = Number(res.maxScore) || 0;

              // Check if total is 0 to avoid division by zero
              progressValue = total > 0 ? earned / total : 0;
              
              console.log(`Course ${course.id} Progress Calc:`, earned, "/", total, "=", progressValue);
          } catch (err) {
              console.error(err);
              progressValue = 0;
          }
          } catch (err) {
            console.error(`Progress fetch failed for course ${course.id}`, err);
          }
        } else if (enrollment?.status === "completed") {
          progressValue = 1;
        }

        return {
          ...course,
          enrollmentStatus: enrollment?.status ?? null,
          enrollmentId: enrollment?.id ?? null,
          progress: progressValue, 
        };
      })
    );
    setCoursesWithStatus(enriched);
  };

  enrichCourses();
}, [courses, myEnrollments]); 

  // // GET /api/enrollments/my-enrollments
  // const loadMyEnrollments = useCallback(async () => {
  //   try {
  //     const data = await enrollmentService.getMyEnrollments();
  //     setMyEnrollments(Array.isArray(data) ? data : data?.data || []);
  //   } catch (err) {
  //     console.error("Fetch my enrollments failed", err);
  //   }
  // }, []);

  // called after confirm enroll
  const handleEnrollment = useCallback(
    async (courseId) => {
      try {
        const existingEnrollment = myEnrollments.find(
          (e) => Number(e.course_id) === Number(courseId),
        );
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
    }, [currentUser, myEnrollments, loadInitialData]);

  // drop courses
  // finds the enrollment record for that specific course and deletes it
  // const handleDrop = useCallback(
  //   async (courseId) => {
  //     try {
  //       const enrollment = myEnrollments.find(
  //         (e) => Number(e.course_id) === Number(courseId),
  //       );

  //       if (!enrollment) {
  //         console.warn(
  //           "No enrollment record found to drop for course",
  //           courseId,
  //         );
  //         return;
  //       }
  //       await enrollmentService.updateStatus(enrollment.id, "dropped");
  //       await loadMyEnrollments();
  //     } catch (err) {
  //       const message =
  //         typeof err === "string"
  //           ? err
  //           : err?.message || "Failed to drop course. Please try again.";

  //       if (Platform.OS === "web") {
  //         window.alert(message);
  //       } else {
  //         Alert.alert("Drop Failed", message);
  //       }
  //     }
  //   },
  //   [myEnrollments, loadMyEnrollments],
  // );

  // use progressData from param
  // const coursesWithStatus = useMemo(() => {
  //   return courses.map((course) => {
  //     const enrollment = myEnrollments.find(
  //       (e) => Number(e.course_id) === Number(course.id),
  //     );

  //     const progressObj = progressData?.find((p) => p.courseId === course.id);
  //     const progress = progressObj ? progressObj.progress : null;

  //     return {
  //       ...course,
  //       progress: progressObj?.progress ?? null,
  //       enrollmentStatus: enrollment?.status ?? null,
  //       enrollmentId: enrollment?.id ?? null,
  //     };
  //   });
  // }, [courses, myEnrollments, progressData]);

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

        (filters.status === "inProgress" &&
            course.enrollmentStatus === "in_progress") ||
        (filters.status === "inReview" &&
            course.enrollmentStatus === "in_review") ||
        (filters.status === "completed" &&
            course.enrollmentStatus === "completed") ||
        (filters.status === "notEnrolled" &&
            !course.enrollmentStatus);
        // (filters.status === "dropped" &&
        //     course.enrollmentStatus === "dropped");

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

  // const handleSearch = (text) => {
  //   setSearchText(text);
  //   const filterString = text
  //     ? `title like "%${text}%" or description like "%${text}%"`
  //     : "";

  //   loadCourses({ filter: filterString, page: 1 });
  // };

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

  // useEffect(() => {
  //   loadCourses();
  //   loadMyEnrollments();
  // }, [loadCourses, loadMyEnrollments]);

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
    myEnrollments,
    handleEnrollment,
    // handleDrop,
    removeFilter,
    courses,
    allTagList,
    addTag,
    filteredCourses,
    handleApply,
    setSearchText,
    searchText,
    inProgressCourses,
    inReviewCourses,
    completedCourses,
  };
};
