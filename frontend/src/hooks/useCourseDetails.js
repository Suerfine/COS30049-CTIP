import {useState, useEffect, useCallback} from 'react';
import { courseService } from '../services/courseService';
import { moduleService } from '../services/moduleService';
import { pageService } from '../services/pageService';
import {ElementService } from '../services/ElementService';
import { submissionService } from '../services/SubmissionService';

export const useCourseDetails=(id, enrollmentId, initialMarks = {})=>{
    const [course,setCourse]=useState(null);
    const [loading,setLoading]=useState(true);
    const [error, setError]=useState(null);
    const [userMarks, setUserMarks] = useState(initialMarks || {});
    

    const fetchCourse = useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);
            const courseData = await courseService.getById(id);
            const modulesData = await moduleService.getAll(id);

            const marksMap = {};
            let previousPageCompleted = true;

            const modulesWithFullData = await Promise.all(
                modulesData.map(async (module) => {
                    const pagesData = await pageService.getAll(id, module.id);
                    const pagesWithElements = await Promise.all(
                        pagesData.map(async (page) => {
                            const elementsData = await ElementService.getAll(id, module.id, page.id);
                            
                            // Fetch submissions for each element individually using the SUBMISSION endpoint
                            await Promise.all(elementsData.map(async (el) => {
                                try {
                                    const subs = await submissionService.getByElement(el.id);
                                    // Take the highest grade or the most recent one
                                    marksMap[el.id] = subs.length > 0 ? subs[0].earned_grade : 0;
                                } catch (e) {
                                    marksMap[el.id] = 0;
                                }
                            }));

                            const isPageComplete = elementsData?.every(el => (marksMap[el.id] || 0) > 0);
                            const isLocked = !previousPageCompleted;
                            previousPageCompleted = isPageComplete;

                            return { ...page, elements: elementsData, isLocked, isCompleted: isPageComplete };
                        })
                    );
                    return { ...module, pages: pagesWithElements };
                })
            );

            setUserMarks(marksMap); 
            setCourse({ ...courseData, modules: modulesWithFullData });
        } catch (err) {
            setError("Failed to load course.");
        } finally {
            setLoading(false);
        }
    }, [id, enrollmentId]);
        
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
        try {
            await submissionService.create({
                enrollment_id: Number(enrollmentId),
                element_id: Number(elementId),
                content: { ...content, auto_marked: true },
                earned_grade: score,
                marking_remark: "System: Automated marking triggered."
            });

            setUserMarks(prev => ({
                ...prev,
                [elementId]: score
            }));
            
            return { success: true };
        } catch (err) {
            console.error("Sync failed:", err);
            return { success: false, error: err };
        }
    }, [enrollmentId]);

    useEffect(() => {
        fetchCourse();
    }, [fetchCourse]);


    return {
        course, 
        loading,
        error,
        refresh:fetchCourse,
        updateDescription,
        locationTags, categoryTags,
        saveProgress,
        userMarks
    };
}