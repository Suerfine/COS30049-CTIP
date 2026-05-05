import { useState, useEffect, useMemo, useCallback} from 'react';
import { Platform, Alert } from 'react-native';
import { useUserDashboard } from './useUserDashboard';
import { useTranslation } from 'react-i18next';
import { courseService } from '../services/courseService';
import { enrollmentService } from '../services/EnrollmentService';
import { useAuth } from '../context/AuthContext';

export const useUserCourse=()=>{
    const {t, i18n}=useTranslation();
    const { progressData } = useUserDashboard();
    const { currentUser } = useAuth();
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [filterVisible, setFilterVisible] = useState(false);
    const [courses,setCourses]=useState([]);
    const [allcourseFilter, setAllCourseFilter]=useState('all');
    const [loading, setLoading]=useState(false);
    const [myEnrollments, setMyEnrollments] = useState([]); // current user enrollments

    const [filters, setFilters] = useState({
        status: 'all',
        category:'all',
    });
    const [tempFilters, setTempFilters] = useState(filters);

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

    // load courses
    const loadCourses = useCallback(async (params = {}) => {
        setLoading(true);
        try {
            const response = await courseService.getAll(params);
            setCourses(Array.isArray(response) ? response : response.data || []);
        } catch (err) {
            console.error('Fetch courses failed', err);
        } finally {
            setLoading(false);
        }
    }, []);
 
    // load the current user's enrollments
    const loadMyEnrollments = useCallback(async () => {
        try {
            const data = await enrollmentService.getMyEnrollments();
            setMyEnrollments(Array.isArray(data) ? data : data?.data || []);
        } catch (err) {
            console.error('Fetch my enrollments failed', err);
        }
    }, []);
 
    useEffect(() => {
        loadCourses();
        loadMyEnrollments();
    }, [loadCourses, loadMyEnrollments]);
 
    // Called after confirm enroll
    // has already validated prerequisites so sets enrollment to IN_REVIEW (admin approves)
    const handleEnrollment = useCallback(async (courseId) => {
        try {
            await enrollmentService.enroll(courseId, currentUser.id);
            await loadMyEnrollments();
        } catch (err) {
            const message =
                typeof err === 'string' ? err : err?.message || 'Failed to enroll. Please try again.';
 
            if (Platform.OS === 'web') {
                window.alert(message);
            } else {
                Alert.alert('Enrollment Failed', message);
            }
        }
    }, [currentUser, loadMyEnrollments]);
 
    // drop courses
    // finds the enrollment record for that specific course and deletes it
    const handleDrop = useCallback(async (courseId) => {
        try {
            const enrollment = myEnrollments.find(
                (e) => Number(e.course_id) === Number(courseId)
            );
 
            if (!enrollment) {
                console.warn('No enrollment record found to drop for course', courseId);
                return;
            }
 
            await enrollmentService.delete(enrollment.id);
            await loadMyEnrollments();
        } catch (err) {
            const message =
                typeof err === 'string' ? err : err?.message || 'Failed to drop course. Please try again.';
 
            if (Platform.OS === 'web') {
                window.alert(message);
            } else {
                Alert.alert('Drop Failed', message);
            }
        }
    }, [myEnrollments, loadMyEnrollments]);

    const coursesWithStatus = useMemo(() => {
        return courses.map((course) => {
            const enrollment = myEnrollments.find(
                (e) => Number(e.course_id) === Number(course.id)
            );
 
            const progressObj = progressData?.find((p) => p.courseId === course.id);
            const progress = progressObj ? progressObj.progress : null;
 
            return {
                ...course,
                progress,
                enrollmentStatus: enrollment?.status ?? null,
                enrollmentId: enrollment?.id ?? null,
            };
        });
    }, [courses, myEnrollments, progressData]);

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
        removeFilter, courses,
        myEnrollments,
        handleEnrollment,
        handleDrop,
    };
};