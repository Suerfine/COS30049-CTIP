import { useState, useEffect, useMemo, useCallback} from 'react';
import { useUserDashboard } from './useUserDashboard';
import { useTranslation } from 'react-i18next';
import { courseService } from '../services/courseService';
import React from 'react';

export const useUserCourse=()=>{
    const {t, i18n}=useTranslation();
    const { progressData  } = useUserDashboard();
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [filterVisible, setFilterVisible] = useState(false);
    const [courses,setCourses]=useState([]);
    const [allCourseList, setAllCourseList] = useState([]);
    const [allTagList, setAllTagList] = useState([]);
    const [allcourseFilter, setAllCourseFilter]=useState('all');
    const [loading, setLoading]=useState(false);

    const [filters, setFilters] = useState({
        status: 'all',
        category:'all',
    });
    const [tempFilters, setTempFilters] = useState(filters);
    const [searchText, setSearchText] = useState("");

    const statusLabels = {
        inProgress: t('status.in progress'),
        completed: t('status.completed'),
        notEnrolled: t('not enrolled'),
    };

    const tabs=[
        {id:'all', label:t('status.all')},
        {id:'basic', label:t('status.basic')},
        {id:'advanced',label:t('status.advanced')}
    ];

    const coursesWithStatus = useMemo(() => {
        return courses.map(course => {
            const progressObj = progressData.find(
                p => p.courseId === course.id
            );

            const progress = progressObj ? progressObj.progress : null;

            let status = 'notEnrolled';
            if (typeof progress === 'number') {
                if (progress >= 1) status = 'completed';
                else if (progress > 0) status = 'inProgress';
            }

            return {
                ...course,
                progress,
                status,
            };
        });
    }, [courses, progressData]);

    const filteredCourses = React.useMemo(() => {
        return courses.filter(course => {
            const hasPrerequisites = course.prerequisite_groups && course.prerequisite_groups.length > 0;
            
            let matchesTab = true;
            if (allcourseFilter === 'basic') {
                matchesTab = !hasPrerequisites;
            } else if (allcourseFilter === 'advanced') {
                matchesTab = hasPrerequisites;
            }

            const matchesSearch = course.title.toLowerCase().includes(searchText.toLowerCase());

            const matchesLocation = !filters.location || filters.location === 'all' || 
                (Array.isArray(filters.location) && filters.location.length === 0) ||
                course.tags?.some(tag => tag.type === 'location' && filters.location.includes(tag.title));

            const matchesCategory = !filters.category || filters.category === 'all' || 
                (Array.isArray(filters.category) && filters.category.length === 0) ||
                course.tags?.some(tag => tag.type === 'category' && filters.category.includes(tag.title));

            return matchesTab && matchesSearch && matchesLocation && matchesCategory;
        });
    }, [courses, searchText, filters, allcourseFilter]);

    const handleSearch = (text) => {
        setSearchText(text);
        const filterString = text
        ? `title like "%${text}%" or description like "%${text}%"`
        : "";

        loadCourses({ filter: filterString, page: 1 });
    };

    const removeFilter = (key, value) => {
        setFilters(prev => {
            if (key === 'status') return { ...prev, status: 'all' };
            
            const newList = Array.isArray(prev[key]) 
                ? prev[key].filter(item => item !== value) 
                : [];
                
            return { ...prev, [key]: newList };
        });
    };

    const addTag = async (tagData) => {
        const isDuplicate = allTagList.some(
            (t) => t.title.toLowerCase() === tagData.title.toLowerCase()
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

   const loadCourses = useCallback(async (params = {}) => {
        setLoading(true);
        try {
            const response = await courseService.getAll(params);
            setCourses(response.data ?? response ?? []); 

            if (allCourseList.length === 0 || allTagList.length === 0) {
                const [fullCourseRes, fullTagRes] = await Promise.all([
                    courseService.getAll({ size: 100 }),
                    courseService.getAllTags() 
                ]);
                
                setAllCourseList(fullCourseRes.data || []);
                setAllTagList(fullTagRes.data || fullTagRes || []); 
            }
        } catch (err) {
            console.error("Fetch failed", err);
        } finally {
            setLoading(false);
        }
    }, [allCourseList.length, allTagList.length]);


    useEffect(() => {
        loadCourses();
    }, [loadCourses]);

    return {
        selectedCourse, setSelectedCourse,
        modalVisible, setModalVisible,
        filterVisible, setFilterVisible,
        allcourseFilter, setAllCourseFilter,
        filters, setFilters,
        tempFilters, setTempFilters,
        statusLabels,
        tabs,
        coursesWithStatus,
        filteredCourses,
        removeFilter, courses, 
        allTagList,addTag, filteredCourses, handleSearch, setSearchText, searchText
    };
};