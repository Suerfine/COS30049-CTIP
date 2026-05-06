import { useState, useEffect, useCallback, useMemo } from 'react';
import { courseService } from '../services/courseService';
import { enrollmentService } from '../services/EnrollmentService';
import React from 'react';

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
            // enrollments.forEach((e) => { map[e.course_id] = e; });

            // dummy
            enrollments.forEach((e) => {
                const enrollmentData = { ...e };
                
                enrollmentData.status = 'COMPLETED'; 
                enrollmentData.badge_expire_at = "2027-12-31T23:59:59.000Z";
                
                map[String(enrollmentData.course_id)] = enrollmentData;
            });

            setAllCourses(courses);
            setEnrollmentMap(map);
        } catch (err) {
            console.error('Badge data fetch failed:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadBadgeData(); }, [loadBadgeData]);

    // const getEnrollment = (courseId) => enrollmentMap[courseId] ?? null;
    const getEnrollment = (courseId) => enrollmentMap[String(courseId)] ?? null;

    const tagOptions = React.useMemo(() => {
        return [...new Set(allCourses.flatMap((c) => (c.tags ?? []).map((t) => t.title)))];
    }, [allCourses]);

    const filteredCourses = React.useMemo(() => {
        return allCourses.filter((course) => {
            const enrollment = enrollmentMap[String(course.id)];
            const title = (course.title ?? '').toLowerCase();
            
            if (filters.status !== 'all') {
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
                }
            }

            if (filters.tag && filters.tag !== 'all') {
                const courseTags = (course.tags ?? []).map(t => t.title);
                
                if (Array.isArray(filters.tag)) {
                    // if filter tag is array then fetched courses must have at least one of the tags
                    if (filters.tag.length > 0 && !courseTags.some(t => filters.tag.includes(t))) {
                        return false;
                    }
                } else {
                    if (!courseTags.includes(filters.tag)) {
                        return false;
                    }
                }
            }

            return true;
        });
    }, [allCourses, enrollmentMap, searchQuery, filters]);

    const removeFilter = (key, value) => {
        const updater = (prev) => {
            if (key === 'status' || !Array.isArray(prev[key])) {
                return { ...prev, [key]: 'all' };
            }

            const newList = prev[key].filter(item => item !== value);
            return { 
                ...prev, 
                [key]: newList.length === 0 ? 'all' : newList 
            };
        };

        setFilters(updater);
        setTempFilters(updater);
    };

    const resetFilters = () => {
        const cleared = { status: 'all', tag: 'all' };
        setFilters(cleared);
        setTempFilters(cleared);
        setFilterVisible(false);
    };

    // const completedCount  = allCourses.filter((c) => enrollmentMap[c.id]?.status === 'COMPLETED').length;
    // const inProgressCount = allCourses.filter((c) => enrollmentMap[c.id]?.status === 'IN_PROGRESS').length;

    return {
        courses: filteredCourses,
        allCourses,
        loading,
        getEnrollment,
        // completedCount,
        // inProgressCount,
        searchQuery,
        setSearchQuery,
        filterVisible,
        setFilterVisible,
        filters,
        tempFilters,
        setTempFilters,
        resetFilters,
        removeFilter,
        tagOptions,
        refresh: loadBadgeData,
    };
};