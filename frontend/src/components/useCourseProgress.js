import { useState, useMemo } from 'react';

export const useCourseProgress = (course, userMarks) => {
    const progressMap = useMemo(() => {
        if (!course || !course.modules || !userMarks) return {};

        const map = {};
        let previousPageCompleted = true; 

        course.modules.forEach((module) => {
            let moduleTotalPoints = 0;
            let moduleEarnedPoints = 0;
            
            const pages = module.pages || [];

            pages.forEach((page) => {
                const pageElements = page.elements || []; 
                const totalPageScore = pageElements.reduce((acc, el) => {
                    return acc + (Number(el.score) || 0); 
                }, 0);
            
                const earnedPageScore = pageElements.reduce((sum, el) => {
                    const mark = userMarks[el.id];
                    const score = typeof mark === 'object' ? (mark.earned_grade || 0) : (mark || 0);
                    return sum + Number(score);
                }, 0);
                const percent = totalPageScore > 0 ? (earnedPageScore / totalPageScore) * 100 : 0;
                
                const isUnlocked = previousPageCompleted;
                
                const passingThreshold = page.passing_score || 1; 
                const isCompleted = earnedPageScore >= passingThreshold;

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