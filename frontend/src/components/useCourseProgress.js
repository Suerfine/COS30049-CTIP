import { useState, useEffect, useCallback } from 'react';
import { progressService } from '../services/ProgressService';

export const useCourseProgress = (course) => {
    const [progressMap, setProgressMap] = useState({});
    const [loading, setLoading] = useState(false);

    const refreshProgress = useCallback(async () => {
        if (!course || !course.modules) return;

        setLoading(true);
        try {
            const map = {};
            let previousPageCompleted = true;
            for (const module of course.modules) {
                const modRes = await progressService.getModuleProgress(module.id, course.id);
                
                map[`module_${module.id}`] = {
                    percent: modRes.maxScore > 0 ? (modRes.score / modRes.maxScore) * 100 : 0
                };

                const pages = module.pages || [];

                for (const page of pages) {
                    let totalPageScore = 0;
                    let earnedPageScore = 0;

                    if (page.elements && page.elements.length > 0) {
                        for (const element of page.elements) {
                            const elRes = await progressService.getElementProgress(element.id);
                            totalPageScore += Number(elRes.maxScore) || 0;
                            earnedPageScore += Number(elRes.score) || 0;
                        }
                    }

                    const percent = totalPageScore > 0 ? (earnedPageScore / totalPageScore) * 100 : 0;
                    
                    const isLocked = !previousPageCompleted;
                    
                    const passingThreshold = page.passing_score || 100;
                    const isCompleted = percent >= passingThreshold;

                    map[page.id] = {
                        percent,
                        isLocked,
                        isCompleted
                    };

                    previousPageCompleted = isCompleted;
                }
            }

            setProgressMap(map);
        } catch (error) {
            console.error("Error syncing weighted progress:", error);
        } finally {
            setLoading(false);
        }
    }, [course]);

    useEffect(() => {
        refreshProgress();
    }, [refreshProgress]);

    return { 
        progressMap, 
        loading, 
        refreshProgress 
    };
};