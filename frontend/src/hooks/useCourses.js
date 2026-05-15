import React, { useCallback, useEffect, useState } from "react";
import { courseService } from "../services/courseService";
import { useTranslation } from "react-i18next";

export const useCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allCourseList, setAllCourseList] = useState([]);
  const [allTagList, setAllTagList] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalElements: 0,
  });
  const { t, i18n } = useTranslation();
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    category: [],
    location: [],
  });
  const [tempFilters, setTempFilters] = useState(filters);
  const [searchText, setSearchText] = useState("");

  const statusLabels = {
    inProgress: t("status.in progress"),
    completed: t("status.completed"),
    notEnrolled: t("not enrolled"),
  };

  const loadCourses = useCallback(
    async (params = {}) => {
      setLoading(true);
      try {
        const response = await courseService.getAll(params);
        setCourses(response.data ?? response ?? []);

        setPagination({
          currentPage: response.page || 1,
          totalPages: response.totalPages || 0,
          totalElements: response.totalElements || 0,
        });

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

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const addCourse = async (formData) => {
    console.log("Adding course with data: ", formData);
    setLoading(true);
    try {
      await courseService.create(formData);
      await loadCourses();
      return true;
    } catch (error) {
      console.error("Create failed: ", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const editCourse = async (id, formData) => {
    setLoading(true);
    try {
      const existingCourse = await courseService.getById(id);

      const payload = {
        courseTitle: formData.courseTitle ?? existingCourse.title,
        description: formData.description ?? existingCourse.description,
        status: formData.status ?? existingCourse.status,
        duration: formData.duration ?? existingCourse.expected_completion_weeks,
        cost:
          formData.cost?.toString().trim() !== ""
            ? formData.cost
            : existingCourse.cost,
        expiryWeeks:
          formData.expiryWeeks ?? existingCourse.must_complete_in_weeks,
        badgeExpiry:
          formData.badgeExpiry ?? existingCourse.badge_expire_in_months,
        tags: formData.tags ?? [],
        prerequisite_course_ids:
          formData.prerequisite_course_ids ??
          existingCourse.prerequisite_groups?.flatMap((group) =>
            group.prerequisites.map((p) => p.course_id),
          ) ??
          [],
      };
      await courseService.update(id, payload);

      await loadCourses();
      return true;
    } catch (error) {
      console.error("Update failed:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteCourse = async (id) => {
    setLoading(true);
    try {
      const res = await courseService.delete(id);
      await loadCourses();
      setLoading(false);
      return true;
    } catch (error) {
      console.error("Delete failed: ", error);
      setLoading(false);
      return false;
    }
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

  const filteredCourses = React.useMemo(() => {
    return courses.filter((course) => {
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

      return matchesSearch && matchesLocation && matchesCategory;
    });
  }, [courses, searchText, filters]);

  const handleSearch = (text) => {
    setSearchText(text);
    const filterString = text
      ? `title like "%${text}%" or description like "%${text}%"`
      : "";

    loadCourses({ filter: filterString, page: 1 });
  };

  return {
    courses,
    loadCourses,
    loading,
    addCourse,
    editCourse,
    deleteCourse,
    filterVisible,
    setFilterVisible,
    tempFilters,
    setTempFilters,
    filters,
    setFilters,
    statusLabels,
    removeFilter,
    allCourseList,
    allTagList,
    addTag,
    filteredCourses,
    searchText,
    setSearchText,
    handleSearch,
  };
};
