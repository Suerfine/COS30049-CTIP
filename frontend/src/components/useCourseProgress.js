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
                // 1. Module Progress
                const modRes = await progressService.getModuleProgress(module.id, course.id);
                map[`module_${module.id}`] = {
                    percent: modRes.maxScore > 0 ? (Number(modRes.score) / Number(modRes.maxScore)) * 100 : 0
                };

                for (const page of (module.pages || [])) {
                    const elementPromises = (page.elements || []).map(el => 
                        progressService.getElementProgress(el.id)
                    );
                    
                    const elementResults = await Promise.all(elementPromises);

                    let totalPageScore = 0;
                    let earnedPageScore = 0;

                    elementResults.forEach(res => {
                        totalPageScore += Number(res.maxScore) || 0;
                        earnedPageScore += Number(res.score) || 0;
                    });

                    const visualPercent = totalPageScore > 0 ? (earnedPageScore / totalPageScore) * 100 : 0;
                    
                    const isLocked = !previousPageCompleted;
                    
                    const threshold = Number(page.passing_score) > 0 
                        ? Number(page.passing_score) 
                        : totalPageScore;

                    const isCompleted = earnedPageScore >= threshold;

                    map[page.id] = {
                        percent: Number(visualPercent.toFixed(2)), 
                        isLocked,
                        isCompleted,
                        earnedPoints: earnedPageScore,
                        maxPoints: totalPageScore
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

    return { progressMap, loading, refreshProgress };
};