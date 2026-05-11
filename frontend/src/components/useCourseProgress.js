import { useState, useEffect } from 'react';

export const useCourseProgress = (course, userMarks, fullHistoryMap) => {
    const [progressMap, setProgressMap] = useState({});
    const [isDeadEnd, setIsDeadEnd] = useState(false);

    useEffect(() => {
        if (!course || !course.modules) return;

        const map = {};
        let deadEndDetected = false;
        let previousPageCompleted = true;

        course.modules.forEach((module) => {
            let totalModuleScore = 0;
            let earnedModuleScore = 0;

            (module.pages || []).forEach((page) => {
                let isCompleted = false;
                let visualPercent = 0;

                const quizElements =
                    page.elements?.filter(
                        el => el.type === 'quiz_objective'
                    ) || [];

                const quizIds = quizElements.map(el => el.id);

                if (page.final_quiz === true && quizIds.length > 0) {
                    const passingScore = page.passing_score || 12;
                    const maxTries=page.max_tries || 3;
                    const attempts = [];

                    quizIds.forEach(id => {
                        if (fullHistoryMap?.[id]) {
                            fullHistoryMap[id].forEach(sub => {
                                const subTime = new Date(sub.created_at).getTime();

                                let existing = attempts.find(
                                    a => Math.abs(a.time - subTime) < 10000
                                );

                                if (existing) {
                                    existing.score += sub.earned_grade;
                                } else {
                                    attempts.push({
                                        time: subTime,
                                        score: sub.earned_grade
                                    });
                                }
                            });
                        }
                    });

                    isCompleted = attempts.some(a => a.score >= passingScore);
                    const attemptCount = attempts.length;

                    if (!isCompleted && attemptCount >= maxTries) {
                        deadEndDetected = true;
                    }
                    visualPercent = isCompleted ? 100 : 0;
                } else {
                    const totalPageElements =
                        page.elements?.length || 0;

                    const completedCount =
                        page.elements?.filter(el => {
                            const mark = userMarks?.[el.id];

                            return (mark?.earned_grade || 0) > 0;
                        }).length || 0;

                    isCompleted =
                        totalPageElements > 0 &&
                        completedCount === totalPageElements;

                    visualPercent =
                        totalPageElements > 0
                            ? (completedCount / totalPageElements) * 100
                            : 0;
                }

                const isLocked = !previousPageCompleted;

                map[page.id] = {
                    percent: visualPercent,
                    isLocked,
                    isCompleted
                };

                previousPageCompleted = isCompleted;

                totalModuleScore += 100;
                earnedModuleScore += visualPercent;
            });

            map[`module_${module.id}`] = {
                percent:
                    totalModuleScore > 0
                        ? (earnedModuleScore / totalModuleScore) * 100
                        : 0
            };
        });
        setIsDeadEnd(deadEndDetected);
        setProgressMap(map);
    }, [course, userMarks, fullHistoryMap]);

    return { progressMap, isDeadEnd };
};