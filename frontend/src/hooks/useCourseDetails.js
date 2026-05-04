import {useState, useEffect, useCallback} from 'react';
import { courseService } from '../services/courseService';
import { moduleService } from '../services/moduleService';

export const useCourseDetails=(id)=>{
    const [course,setCourse]=useState(null);
    const [loading,setLoading]=useState(true);
    const [error, setError]=useState(null);

    const fetchCourse=useCallback(async()=>{
        if(!id){
            return;
        }
        try{
            setLoading(true);
            setError(null);
            const courseData=await courseService.getById(id);
            const modulesData=await moduleService.getAll(id);
            if (!courseData.description) {
                courseData.description = "# Course Description\n\n# What you'll learn\n* ";
            }
            setCourse({
                ...courseData, modules:modulesData
            });
            
        }catch(err){
            console.error("Course Fetch Error: ", err);
            setError(err.message || "Failed to load course details.");
        }finally{
            setLoading(false);
        }
    },[id]);

    // Update only for description
    const updateDescription = async (newDescription) => {
        try {
            await courseService.update(id, { description: newDescription });
            setCourse(prev => ({ ...prev, description: newDescription }));
            return { success: true };
        } catch (err) {
            return { success: false, error: err };
        }
    };

    useEffect(()=>{
        fetchCourse();
    },[fetchCourse]);

    return {
        course, 
        loading,
        error,
        refresh:fetchCourse,
        updateDescription
    };
}