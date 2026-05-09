import {useState, useEffect, useCallback} from 'react';
import { courseService } from '../services/courseService';
import { moduleService } from '../services/moduleService';
import { pageService } from '../services/pageService';
import {ElementService } from '../services/ElementService';
import { submissionService } from '../services/SubmissionService';
import { eventService } from '../services/eventService';

export const useCourseDetails=(id, enrollmentId, initialMarks = {})=>{
    const [course,setCourse]=useState(null);
    const [loading,setLoading]=useState(true);
    const [error, setError]=useState(null);
    const [userMarks, setUserMarks] = useState(initialMarks || {});
    const [historyData, setHistoryData] = useState([]);
    const [isHistoryVisible, setIsHistoryVisible] = useState(false);
    const [fullHistoryMap, setFullHistoryMap] = useState({});

    const fetchCourse = useCallback(async () => {
        if (!id) return;

        try {
            setLoading(true);
            setError(null);
            const courseData = await courseService.getById(id);
            const modulesData = await moduleService.getAll(id);
            const modulesWithFullData = await Promise.all(
                modulesData.map(async (module) => {
                    const pagesData = await pageService.getAll(id, module.id);
                    const pagesWithElements = await Promise.all(
                        pagesData.map(async (page) => {
                            const elementsData = await ElementService.getAll(
                                id,
                                module.id,
                                page.id
                            );
                            const elementsWithSubs = await Promise.all(
                                (elementsData || []).map(async (el) => {
                                    let submission = null;
                                    if (enrollmentId) {
                                        try {
                                            const subs =
                                                await submissionService.getByElement(
                                                    Number(enrollmentId),
                                                    Number(el.id)
                                                );
                                            submission = (subs && subs.length > 0) 
                                                ? subs.sort((a, b) => b.id - a.id)[0] 
                                                : null;

                                        } catch (e) {
                                            console.warn(
                                                `Failed to fetch submission for element ${el.id}`,
                                                e.message
                                            );
                                        }
                                    }
                                    return {
                                        ...el,
                                        submission
                                    };
                                })
                            );

                            return {
                                ...page,
                                elements: elementsWithSubs
                            };
                        })
                    );

                    return {
                        ...module,
                        pages: pagesWithElements
                    };
                })
            );
            const marksMap = {};

            modulesWithFullData.forEach(module => {
                module.pages.forEach(page => {
                    page.elements.forEach(el => {

                        marksMap[el.id] = el.submission
                            ? {
                                earned_grade:
                                    el.submission.earned_grade || 0,
                                content:
                                    el.submission.content || null
                            }
                            : {
                                earned_grade: 0,
                                content: null
                            };
                    });
                });
            });
            const finalizedModules = modulesWithFullData.map(module => {

                let previousPageCompleted = true;

                return {
                    ...module,

                    pages: module.pages.map(page => {

                        const isPageComplete =
                            page.elements?.length > 0 &&
                            page.elements.every(
                                el =>
                                    (marksMap[el.id]?.earned_grade || 0) > 0
                            );

                        const isLocked = !previousPageCompleted;

                        previousPageCompleted = isPageComplete;

                        return {
                            ...page,
                            isLocked,
                            isCompleted: isPageComplete
                        };
                    })
                };
            });
            setUserMarks(marksMap);
            setCourse({
                ...courseData,
                modules: finalizedModules
            });
        } catch (err) {
            console.error("GLOBAL FETCH ERROR:", err);
            setError(
                "Failed to load course. Please check your connection."
            );
        } finally {
            setLoading(false);
        }
    }, [id, enrollmentId]);

    const overallProgress = (() => {
        if (!course || !course.modules) return 0;
        
        let totalElements = 0;
        let completedElements = 0;

        course.modules.forEach(module => {
            module.pages?.forEach(page => {
                page.elements?.forEach(el => {
                    totalElements++;
                    if ((userMarks[el.id] || 0) > 0) {
                        completedElements++;
                    }
                });
            });
        });

        return totalElements > 0 ? Math.round((completedElements / totalElements) * 100) : 0;
    })();
        
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
        console.log("Attempting to save progress:", { elementId, score, content });
        try {
            const result = await submissionService.create({
                enrollment_id: Number(enrollmentId),
                element_id: Number(elementId),
                earned_grade: score,
                content: content,
            });

            if (content.auto_add_todo) {
                const formatISO = (dateStr, timeStr) => {
                    const [time, modifier] = timeStr.split(' ');
                    let [hours, minutes] = time.split(':');
                    if (hours === '12') hours = '00';
                    if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
                    return `${dateStr}T${hours.toString().padStart(2, '0')}:${minutes}:00Z`;
                }

                const startTime = content.session_time.split(' — ')[0];
                const endTime = content.session_time.split(' — ')[1];

                await eventService.createEvent({
                    title: `Workshop Session`,
                    description: `Registered via training platform. Location: ${content.location}`,
                    type: "workshop",
                    event_start_at: formatISO(content.session_date, startTime),
                    event_end_at: formatISO(content.session_date, endTime)
                });
            }

            setUserMarks(prev => ({
                ...prev,
                [elementId]: { earned_grade: score, content: content }
            }));

            return { success: true };
        } catch (err) {
            console.error("Save Progress/Event Error:", err);
            return { success: false, error: err.message };
        }
    }, [enrollmentId]);

    const handleFetchHistory = async (currentElementIds) => {
        try {
            const allHistory = await submissionService.getAllByEnrollment(enrollmentId);
            
            const pageSubmissions = allHistory.filter(sub => 
                currentElementIds.includes(sub.element_id)
            );

            const attempts = [];
            pageSubmissions.forEach(sub => {
                const subTime = new Date(sub.created_at).getTime();
                let existingAttempt = attempts.find(a => Math.abs(a.time - subTime) < 5000);

                if (existingAttempt) {
                    existingAttempt.score += sub.earned_grade;
                    existingAttempt.maxScore += 1;
                } else {
                    attempts.push({
                        id: sub.id,
                        time: subTime,
                        date: sub.created_at,
                        score: sub.earned_grade,
                        maxScore: 1
                    });
                }
            });

            setHistoryData(attempts);
            setIsHistoryVisible(true);
        } catch (err) {
            console.error("History grouping error:", err);
        }
    };

    const fetchAllHistory = useCallback(async () => {
        if (!enrollmentId) return;
        try {
            const allSubmissions = await submissionService.getAllByEnrollment(enrollmentId);
            const map = {};
            allSubmissions.forEach(sub => {
                if (!map[sub.element_id]) {
                    map[sub.element_id] = [];
                }
                map[sub.element_id].push(sub);
            });
            
            setFullHistoryMap(map);
        } catch (err) {
            console.error("Bulk history fetch failed:", err);
        }
    }, [enrollmentId]);

    useEffect(() => {
        fetchCourse();
    }, [fetchCourse]);

    useEffect(() => {
        fetchAllHistory();
    }, [fetchAllHistory]);

    return {
        course, 
        loading,
        error,
        refresh:fetchCourse,
        updateDescription,
        locationTags, categoryTags,
        saveProgress,
        userMarks,
        historyData, isHistoryVisible, fullHistoryMap, setIsHistoryVisible, refreshHistory: fetchAllHistory, handleFetchHistory
    };
}