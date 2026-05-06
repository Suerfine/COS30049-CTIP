import {useState, useEffect, useCallback} from 'react';
import { courseService } from '../services/courseService';
import { moduleService } from '../services/moduleService';
import { pageService } from '../services/pageService';
import {ElementService } from '../services/ElementService';
import { submissionService } from '../services/SubmissionService';

export const useCourseDetails=(id, enrollmentId)=>{
    const [course,setCourse]=useState(null);
    const [loading,setLoading]=useState(true);
    const [error, setError]=useState(null);
    const [userMarks, setUserMarks] = useState({});

    const fetchCourse = useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);
            const courseData = await courseService.getById(id);
            const modulesData = await moduleService.getAll(id);

            const modulesWithFullData = await Promise.all(
                modulesData.map(async (module) => {
                    const pagesData = await pageService.getAll(id, module.id);

                    const pagesWithElements = await Promise.all(
                        pagesData.map(async (page) => {
                            const elementsData = await ElementService.getAll(id, module.id, page.id);
                            return { 
                                ...page, 
                                elements: elementsData || []
                            };
                        })
                    );

                    return { ...module, pages: pagesWithElements };
                })
            );

            setCourse({ ...courseData, modules: modulesWithFullData });
        } catch (err) {
            console.error("Hydration Error:", err);
        } finally {
            setLoading(false);
        }
    }, [id]);
        
    const locationTags = course?.tags?.filter(tag => tag.type === 'location') || [];
    const categoryTags = course?.tags?.filter(tag => tag.type === 'category') || [];

    const updateDescription = async (newDescription) => {
    try {
            const payload = {
                courseTitle: course.title,
                description: newDescription,
                status: course.status || "unreleased",
                duration: course.expected_completion_weeks,
                expiryWeeks: course.must_complete_in_weeks,
                badgeExpiry: course.badge_expire_in_months,
                prerequisite_groups: course.prerequisite_groups || []
            };

            await courseService.update(id, payload);

            setCourse(prev => ({
                ...prev,
                description: newDescription
            }));

            return { success: true };

        } catch (err) {
            console.error("UPDATE ERROR:", err);
            return { success: false, error: err };
        }
    };

    const saveProgress = useCallback(async (elementId, score, content = {}) => {
        setUserMarks(prev => ({
            ...prev,
            [elementId]: score
        }));

        try {
            await submissionService.create({
                enrollment_id: Number(enrollmentId),
                element_id: Number(elementId),
                content: { ...content, auto_marked: true },
                earned_grade: score,
                marking_remark: "System: Automated marking triggered."
            });
        } catch (err) {
            console.error("Sync failed:", err);
        }
    }, [enrollmentId]);

    useEffect(()=>{
        fetchCourse();
    },[fetchCourse]);

    return {
        course, 
        loading,
        error,
        refresh:fetchCourse,
        updateDescription,
        locationTags, categoryTags,
        saveProgress
    };
}