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
        const res=await courseService.create(FormData);
        if(res.ok) await loadCourses();
        setLoading(false);
        return res.ok;
    };

    const editCourse=async(id, formData)=>{
        setLoading(true);
        const res=await courseService.update(id, formData);
        if(res.ok) await loadCourses();
        setLoading(false);
        return res.ok;
    };

    const deleteCourse=async(id)=>{
        const res=await courseService.delete(id);
        if(res.ok) setCourses(prev=>prev.filter(c=>c.id !== id));
        return res.ok;
    };

    return {courses, loading, addCourse, editCourse, deleteCourse};
};