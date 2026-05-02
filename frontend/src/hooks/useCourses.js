import React,{useEffect, useState} from 'react';
import { courseService } from '../services/courseService';

export const useCourses=()=>{
    const [courses, setCourses]=useState([]);
    const [loading, setLoading]=useState(false);

    const loadCourses=async()=>{
        try{
            const data=await courseService.getAll();
            setCourses(data);
        }catch(err){
            console.error("Fetch failed", err);
        }
    };

    useEffect(()=>{loadCourses();},[]);

    const addCourse=async(FormData)=>{
        setLoading(true);
        try{
            const res=await courseService.create(FormData);
            await loadCourses();
            setLoading(false);
            return true;
        } catch(error){
            console.error("Update failed: ", error);
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
        const res=await courseService.delete(id);
        if(res.ok) setCourses(prev=>prev.filter(c=>c.id !== id));
        return res.ok;
    };

    return {courses, loading, addCourse, editCourse, deleteCourse};
};