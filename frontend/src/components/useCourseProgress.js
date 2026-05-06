import { useState, useMemo } from 'react';

export const useCourseProgress = (course, userMarks) => {
    
    const progressMap = useMemo(() => {
        if (!course || !course.modules) return {};

        const map = {};
        let previousPageCompleted = true; 

        course.modules.forEach((module, mIdx) => {
            let moduleTotalPoints = 0;
            let moduleEarnedPoints = 0;
            
            const pages = module.pages || [];
            console.log(module);

            pages.forEach((page, pIdx) => {
                const pageElements = page.elements || []; 
                const totalPageScore = pageElements.reduce((sum, el) => sum + el.score, 0);
                
                const earnedPageScore = pageElements.reduce((sum, el) => {
                    return sum + (userMarks[el.id] || 0);
                }, 0);

                const percent = totalPageScore > 0 ? (earnedPageScore / totalPageScore) * 100 : 0;
                
                const isFirstPage = mIdx === 0 && pIdx === 1;
                const isUnlocked = isFirstPage || previousPageCompleted;
                
                const passingThreshold = page.passing_score || 100;
                const isCompleted = percent >= passingThreshold;

                map[page.id] = {
                    percent,
                    isLocked: !isUnlocked,
                    isCompleted
                };

                previousPageCompleted = isCompleted;
                
                moduleTotalPoints += totalPageScore;
                moduleEarnedPoints += earnedPageScore;
            });

            map[`module_${module.id}`] = {
                percent: moduleTotalPoints > 0 ? (moduleEarnedPoints / moduleTotalPoints) * 100 : 0
            };
        });

        return map;
    }, [course, userMarks]);

    return progressMap;
};