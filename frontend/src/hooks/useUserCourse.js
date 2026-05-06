import { useState, useEffect, useMemo, useCallback } from "react";
import { Platform, Alert } from "react-native";
import { useUserDashboard } from "./useUserDashboard";
import { useTranslation } from "react-i18next";
import { courseService } from "../services/courseService";
import { enrollmentService } from "../services/EnrollmentService";
import { useAuth } from "../context/AuthContext";

export const useUserCourse = () => {
  const { t, i18n } = useTranslation();
  const { progressData } = useUserDashboard();
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

  const [filters, setFilters] = useState({
    status: "all",
    category: "all",
  });
  const [tempFilters, setTempFilters] = useState(filters);
  const [searchText, setSearchText] = useState("");

  const statusLabels = {
    inProgress: t("status.in progress"),
    completed: t("status.completed"),
    notEnrolled: t("not enrolled"),
  };

  const tabs = [
    { id: "all", label: t("status.all") },
    { id: "basic", label: t("status.basic") },
    { id: "advanced", label: t("status.advanced") },
  ];

  const loadCourses = useCallback(
    async (params = {}) => {
      setLoading(true);
      try {
        const response = await courseService.getAll(params);
        setCourses(response.data ?? response ?? []);

        // load extra metadata only once
        if (allCourseList.length === 0 || allTagList.length === 0) {
          const [fullCourseRes, fullTagRes] = await Promise.all([
            courseService.getAll({ size: 100 }),
            courseService.getAllTags(),
          ]);

          setAllCourseList(fullCourseRes.data || []);
          setAllTagList(fullTagRes.data || fullTagRes || []);
        }
      } catch (err) {
        console.error("Fetch failed", err);
      } finally {
        setLoading(false);
      }
    },
    [allCourseList.length, allTagList.length],
  );

  const loadMyEnrollments = useCallback(async () => {
    try {
      const data = await enrollmentService.getMyEnrollments();
      setMyEnrollments(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      console.error("Fetch my enrollments failed", err);
    }
  }, []);

  // Called after confirm enroll
  const handleEnrollment = useCallback(
    async (courseId) => {
      try {
        const existingEnrollment = myEnrollments.find(
          (e) => Number(e.course_id) === Number(courseId),
        );

        if (existingEnrollment && existingEnrollment.status === "dropped") {
          await enrollmentService.updateStatus(
            existingEnrollment.id,
            "in_review",
          );
        } else {
          await enrollmentService.enroll(courseId, currentUser.id);
        }

        await loadMyEnrollments();

        const successMsg = "Enrollment request sent for approval.";
        Platform.OS === "web"
          ? window.alert(successMsg)
          : Alert.alert("Success", successMsg);
      } catch (err) {
        console.error(
          "Enrollment error details:",
          err.response?.data || err.message,
        );

        const message =
          err.response?.data?.message || err.message || "Failed to enroll.";
        Platform.OS === "web"
          ? window.alert(message)
          : Alert.alert("Enrollment Failed", message);
      }
    },
    [currentUser, myEnrollments, loadMyEnrollments],
  );

  // drop courses
  // finds the enrollment record for that specific course and deletes it
  const handleDrop = useCallback(
    async (courseId) => {
      try {
        const enrollment = myEnrollments.find(
          (e) => Number(e.course_id) === Number(courseId),
        );

        if (!enrollment) {
          console.warn(
            "No enrollment record found to drop for course",
            courseId,
          );
          return;
        }

        await enrollmentService.updateStatus(enrollment.id, "dropped");
        await loadMyEnrollments();
      } catch (err) {
        const message =
          typeof err === "string"
            ? err
            : err?.message || "Failed to drop course. Please try again.";

        if (Platform.OS === "web") {
          window.alert(message);
        } else {
          Alert.alert("Drop Failed", message);
        }
      }
    },
    [myEnrollments, loadMyEnrollments],
  );

  const coursesWithStatus = useMemo(() => {
    return courses.map((course) => {
      const enrollment = myEnrollments.find(
        (e) => Number(e.course_id) === Number(course.id),
      );

      const progressObj = progressData?.find((p) => p.courseId === course.id);
      const progress = progressObj ? progressObj.progress : null;

      return {
        ...course,
        progress,
        enrollmentStatus: enrollment?.status ?? null,
        enrollmentId: enrollment?.id ?? null,
        isDropped: enrollment?.deleted_at ?? null,
      };
    });
  }, [courses, myEnrollments, progressData]);

  // marge enrollment status first via courses with status, then apply filters based on tag
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
            tag.type === "category" && filters.category.includes(tag.title),
        );

      return matchesTab && matchesSearch && matchesLocation && matchesCategory;
    });
  }, [coursesWithStatus, searchText, filters, allcourseFilter]);

  const handleSearch = (text) => {
    setSearchText(text);
    const filterString = text
      ? `title like "%${text}%" or description like "%${text}%"`
      : "";

    loadCourses({ filter: filterString, page: 1 });
  };

  const removeFilter = (key, value) => {
    setFilters((prev) => {
      if (key === "status") return { ...prev, status: "all" };

      const newList = Array.isArray(prev[key])
        ? prev[key].filter((item) => item !== value)
        : [];

      return { ...prev, [key]: newList };
    });
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

  useEffect(() => {
    loadCourses();
    loadMyEnrollments();
  }, [loadCourses, loadMyEnrollments]);

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
    handleDrop,
    removeFilter,
    courses,
    allTagList,
    addTag,
    filteredCourses,
    handleSearch,
    setSearchText,
    searchText,
  };
};
