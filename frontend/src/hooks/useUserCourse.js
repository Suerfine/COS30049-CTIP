import { useState, useEffect, useMemo} from 'react';
import { useUserDashboard } from './useUserDashboard';

export const useUserCourse=()=>{
    const { courses, progressData  } = useUserDashboard();
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [filterVisible, setFilterVisible] = useState(false);

    const [allcourseFilter, setAllCourseFilter]=useState('all');

    const [filters, setFilters] = useState({
        status: 'all',
        category:'all',
    });
    const [tempFilters, setTempFilters] = useState(filters);

    const statusLabels = {
        inProgress: 'In Progress',
        completed: 'Completed',
        notEnrolled: 'Not Enrolled',
    };

    const tabs=[
        {id:'all', label:'All'},
        {id:'basic', label:'Basic'},
        {id:'advanced',label:'Advanced'}
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

    // filter by level/status
    const filteredCourses = useMemo(() => {
        if (!coursesWithStatus) return [];
        
        return coursesWithStatus.filter(course => {
            const courseLevel = course.level ? course.level.toLowerCase() : '';
            const matchLevel = allcourseFilter === 'all' || courseLevel === allcourseFilter.toLowerCase();
            const matchStatus = filters.status === 'all' || course.status === filters.status;
            // const matchCategory = filters.category === 'all' || 
            //     (Array.isArray(filters.category) && course.category && filters.category.includes(course.category));

            return matchLevel && matchStatus;
        });
    }, [coursesWithStatus, filters, allcourseFilter]);

    const removeFilter=(key, value)=>{
        setFilters(prev=>{
            if (key==='status'){
                return {...prev, status:'all'};
            }
            if(key==='category'){
                const newCats=prev.category.filter(c=>c !== value);
                return {
                    ...prev, category:newCats.length>0 ? newCats :'all'
                };
            }
            return prev;
        });
    };

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
        removeFilter,
    };
};