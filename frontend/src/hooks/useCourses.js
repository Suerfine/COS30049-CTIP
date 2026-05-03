import React,{useCallback, useEffect, useState} from 'react';
import { courseService } from '../services/courseService';

export const useCourses=()=>{
    const [courses, setCourses]=useState([]);
    const [loading, setLoading]=useState(false);

    const loadCourses=useCallback(async(params={})=>{
        setLoading(true);
        try{
            const response=await courseService.getAll(params);
            setCourses(response);
            setPagination({
                currentPage: response.page,
                totalPages:response.totalPages,
                totalElements:response.totalElements
            });
        }catch(err){
            console.error("Fetch failed", err);
        }finally{
            setLoading(false);
        }
    },[]);

    useEffect(()=>{loadCourses();},[]);

    const addCourse=async(FormData)=>{
        setLoading(true);
        try{
            const res=await courseService.create(FormData);
            await loadCourses();
            setLoading(false);
            return true;
        } catch(error){
            console.error("Create failed: ", error);
            setLoading(false);
            return false;
        }
    };

    const editCourse=async(id, formData)=>{
        setLoading(true);
        try{
            const res=await courseService.update(id, formData);
            await loadCourses();
            setLoading(false);
            return true;
        } catch(error){
            console.error("Update failed: ", error);
            setLoading(false);
            return false;
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

    return {courses,loadCourses, loading, addCourse, editCourse, deleteCourse};
};