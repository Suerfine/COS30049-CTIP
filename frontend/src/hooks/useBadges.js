import { useState, useEffect, useCallback } from 'react';
import { courseService } from '../services/courseService';
import { enrollmentService } from '../services/EnrollmentService';

export const useBadges = () => {
    const [allCourses, setAllCourses] = useState([]);
    const [enrollmentMap, setEnrollmentMap] = useState({});
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterVisible, setFilterVisible] = useState(false);
    const [filters, setFilters] = useState({
        // 'all' | 'COMPLETED' | 'IN_PROGRESS' | 'not_enrolled'
        status: 'all',
        tag: 'all',
    });
    const [tempFilters, setTempFilters] = useState(filters);
    

    const loadBadgeData = useCallback(async () => {
        setLoading(true);
        try {
            const [courseResponse, enrollResponse] = await Promise.all([
                courseService.getAll({ size: 100 }),
                enrollmentService.getMyEnrollments(),
            ]);

            const courses = courseResponse?.data ?? [];
            const enrollments = enrollResponse?.data ?? [];
            console.log("ENROLLMENTS:", enrollments);
            console.log("ENROLL RAW:", enrollResponse);
            console.log("ENROLLMENT SAMPLE:", enrollments[0]);

            const map = {};
            enrollments.forEach((e) => { map[e.course_id] = e; });

            setAllCourses(courses);
            setEnrollmentMap(map);
        } catch (err) {
            console.error('Badge data fetch failed:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadBadgeData(); }, [loadBadgeData]);

    const getEnrollment = (courseId) => enrollmentMap[courseId] ?? null;

    const tagOptions = [
        ...new Set(allCourses.flatMap((c) => (c.tags ?? []).map((t) => t.title))),
    ];

    const filteredCourses = allCourses.filter((course) => {
        const title = (course.title ?? '').toLowerCase();
        const enrollment = enrollmentMap[course.id];

        if (searchQuery && !title.includes(searchQuery.toLowerCase())) return false;

        switch (filters.status) {
            case 'COMPLETED':
                if (enrollment?.status !== 'COMPLETED') return false;
                break;
            case 'IN_PROGRESS':
                if (enrollment?.status !== 'IN_PROGRESS') return false;
                break;
            case 'not_enrolled':
                if (enrollment) return false;
                break;
            default:
                // all
                break;
        }

        if (filters.tag !== 'all') {
            const hasTag = (course.tags ?? []).some((t) => t.title === filters.tag);
            if (!hasTag) return false;
        }

        return true;
    });

    const removeFilter = (key) => {
        setFilters((prev) => ({ ...prev, [key]: 'all' }));
        setTempFilters((prev) => ({ ...prev, [key]: 'all' }));
    };

    const applyFilters = () => {
        setFilters(tempFilters);
        setFilterVisible(false);
    };

    const resetFilters = () => {
        const cleared = { status: 'all', tag: 'all' };
        setFilters(cleared);
        setTempFilters(cleared);
        setFilterVisible(false);
    };

    const completedCount  = allCourses.filter((c) => enrollmentMap[c.id]?.status === 'COMPLETED').length;
    const inProgressCount = allCourses.filter((c) => enrollmentMap[c.id]?.status === 'IN_PROGRESS').length;

    return {
        courses: filteredCourses,
        allCourses,
        loading,
        getEnrollment,
        completedCount,
        inProgressCount,
        searchQuery,
        setSearchQuery,
        filterVisible,
        setFilterVisible,
        filters,
        tempFilters,
        setTempFilters,
        applyFilters,
        resetFilters,
        removeFilter,
        tagOptions,
        refresh: loadBadgeData,
    };
};