import React,{useCallback, useEffect, useState} from 'react';
import { courseService } from '../services/courseService';
import { useTranslation } from 'react-i18next';

export const useCourses=()=>{
    const [courses, setCourses]=useState([]);
    const [loading, setLoading]=useState(false);
    const [allCourseList, setAllCourseList] = useState([]);
    const [pagination, setPagination]=useState({
        currentPage:1,
        totalPages:0,
        totalElements: 0
    });
    const {t, i18n}=useTranslation();
    const [filterVisible, setFilterVisible] = useState(false);
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

    const loadCourses = useCallback(async (params = {}) => {
        setLoading(true);
        try {
            const response = await courseService.getAll(params);
            setCourses(response); 
            setPagination({
                currentPage: response.page || 1,
                totalPages: response.totalPages || 0,
                totalElements: response.totalElements || 0
            });
            if (allCourseList.length === 0) {
                const fullList = await courseService.getAll({ size: 100 });
                setAllCourseList(fullList.data || []);
            }
        } catch (err) {
            console.error("Fetch failed", err);
        } finally {
            setLoading(false);
        }
    }, [allCourseList.length]);

    useEffect(() => { loadCourses(); }, [loadCourses]);

    const addCourse = async (formData) => {
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
            await courseService.update(id, formData);
            await loadCourses();
            return true;
        } catch (error) {
            console.error("Update failed: ", error);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const deleteCourse=async(id)=>{
        setLoading(true);
        try{
            const res=await courseService.delete(id);
            await loadCourses();
            setLoading(false);
            return true;
        } catch(error){
            console.error("Delete failed: ", error);
            setLoading(false);
            return false;
        }
    };

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

    return {courses,loadCourses, loading, addCourse, editCourse, deleteCourse,filterVisible, setFilterVisible,tempFilters, setTempFilters,filters, setFilters, statusLabels, removeFilter, allCourseList};
};