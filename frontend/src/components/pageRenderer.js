import { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, Linking, useWindowDimensions, AccessibilityInfo, Alert } from 'react-native';
import { FileText, Play, Download, HelpCircle, Edit3, editCircle, Trash2, ChevronUp, ChevronDown, CheckCircle2, RotateCcw, AlertCircle, Calendar, Clock, MapPin, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import * as Progress from 'react-native-progress';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WebView from 'react-native-webview';

// Import other hooks and component
import { markdownStyles } from './markdownStyle';
import { UserRoles } from '../enum/UserRoles';
import { useAuth } from '../context/AuthContext';

const PageRenderer = ({ elements, role, courseId, onEditElement, onDeleteElement, onMoveElement, onProgressUpdate, onRegisterWorkshop, userMarks, pageMetadata, currentAttempts, isPageFinished, isFinalQuiz, enrollmentId, fullHistoryMap, onFetchHistory, onRefreshHistory, scrollToTop, isPublished, onSelectPage, progressMap }) => {
    const isAdmin = role === UserRoles.ADMIN;
    const [videoProgress, setVideoProgress] = useState({});
    const [quizStates, setQuizStates] = useState({});
    const [viewedElements, setViewedElements] = useState({});
    const [workshopRegistrations, setWorkshopRegistrations] = useState({});
    const [selectedSessions, setSelectedSessions] = useState({});
    const [autoAddTodo, setAutoAddTodo] = useState(true);
    const { currentUser } = useAuth();
    const [finalQuizAnswers, setFinalQuizAnswers] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [finalSummary, setFinalSummary] = useState(null);
    const [showFinalResults, setShowFinalResults] = useState(false);
    const [localAnswers, setLocalAnswers] = useState({});
    const [submissionCount, setSubmissionCount] = useState(0);

    // adjust workshop detail for mobile
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    useEffect(() => {
        if (!isFinalQuiz || !userMarks || elements.length === 0) return;
        const restoredAnswers = {};
        const restoredQuizStates = {};
        const quizElements = elements.filter(el => el.type === 'quiz_objective');
        
        let earnedTotalScore = 0;
        let totalPossibleScore = 0;

        quizElements.forEach(el => {
            totalPossibleScore += (el.score || 0);
            const submission = userMarks?.[el.id];
            if (submission?.content?.selected !== undefined) {
                const selectedAnswer = submission.content.selected;
                const isCorrect = submission.content.isCorrect;
                restoredAnswers[el.id] = selectedAnswer;
                restoredQuizStates[el.id] = {
                    selected: selectedAnswer,
                    isCorrect,
                    submitted: true
                };
                if (isCorrect) {
                    earnedTotalScore += (el.score || 0);
                }
            }
        });

        setLocalAnswers(restoredAnswers);
        setQuizStates(restoredQuizStates);

        if (Object.keys(restoredAnswers).length > 0) {
            const requiredCorrectAnswers = pageMetadata.page?.passing_score || 12;
            const isPass = earnedTotalScore >= requiredCorrectAnswers;

            setFinalSummary({
                score: earnedTotalScore,
                total: totalPossibleScore,
                status: isPass ? 'PASS' : 'FAIL'
            });

            setShowFinalResults(true);
        }

    }, [userMarks, elements, isFinalQuiz, pageMetadata]);

    const handleQuizSelect = (elId, selectedOption) => {
        if (showFinalResults) return;
        setLocalAnswers(prev => ({
            ...prev,
            [elId]: selectedOption
        }));
    };

    const handleFinalSubmit = async () => {
        const quizElements = elements.filter(el => el.type === 'quiz_objective');
        const maxAllowed = pageMetadata.page?.max_tries || 1;
        
        if (currentAttemptCount >= maxAllowed) {
            if(Platform.OS === 'web'){
                window.alert(`You have reached the maximum limit of ${maxAllowed} attempts for this assessment.`);
            }else{
                Alert.alert(`You have reached the maximum limit of ${maxAllowed} attempts for this assessment.`);
            }
            return;
        }
        
        const unansweredQuestions = quizElements.filter(el => localAnswers[el.id] === undefined);

        if (unansweredQuestions.length > 0) {
            if(Platform.OS === 'web'){
                window.alert(`Please answer all questions before submitting. Remaining: ${unansweredQuestions.length}`);
            }else{
                Alert.alert(`Please answer all questions before submitting. Remaining: ${unansweredQuestions.length}`);
            }
            
            return;
        }

        setIsSubmitting(true);
        try {
            const submissionPromises = quizElements.map(el => {
                const userAnswer = localAnswers[el.id];
                const isCorrect = userAnswer === el.content.answer;
                const points = isCorrect ? el.score : 0;
                
                return onProgressUpdate(el.id, points, {
                    selected: userAnswer,
                    isCorrect
                });
            });
            await Promise.all(submissionPromises);
            setSubmissionCount(prev => prev + 1);
            if (onRefreshHistory) await onRefreshHistory();
            
            const requiredCorrectAnswers = pageMetadata.page?.passing_score || 12;
            const totalScore = quizElements.reduce((sum, el) => {
                const userAnswer = localAnswers[el.id];
                const isCorrect = userAnswer === el.content.answer;
                return sum + (isCorrect ? el.score : 0);
            }, 0);

            const isPass = totalScore >= requiredCorrectAnswers;

            setFinalSummary({
                score: currentStats.potentialScore,
                total: currentStats.potentialMax,
                status: isPass ? 'PASS' : 'FAIL'
            });
            
            setShowFinalResults(true);

        } catch (err) {
            console.error("Submission failed", err);
            alert("Failed to submit assessment.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentAttemptCount = useMemo(() => {
        const quizIds = elements.filter(el => el.type === 'quiz_objective').map(el => el.id);
        if (quizIds.length === 0) return 0;

        const sessions = new Set();
        quizIds.forEach(id => {
            const history = fullHistoryMap?.[id] || [];
            history.forEach(attempt => {
                const timeKey = Math.floor(new Date(attempt.created_at).getTime() / (1000 * 60 * 30));
                sessions.add(timeKey);
            });
        });

        return sessions.size;
    }, [fullHistoryMap, elements, submissionCount]);

    const handleTryAgain = () => {
        setLocalAnswers({});
        setQuizStates({});
        setFinalSummary(null);
        setShowFinalResults(false);
        setFinalQuizAnswers({});
        scrollToTop?.();
    };

    const currentStats = useMemo(() => {
        const quizElements = elements.filter(e => e.type === 'quiz_objective');
        const totalQuizzes = quizElements.length;
        const answeredCount = Object.keys(localAnswers).length;
        
        let potentialScore = 0;
        let potentialMax = 0;

        quizElements.forEach(el => {
            potentialMax += el.score;
            if (localAnswers[el.id] === el.content.answer) {
                potentialScore += el.score;
            }
        });

        return {
            answeredCount,
            totalQuizzes,
            potentialScore,
            potentialMax,
            isAllAnswered: answeredCount === totalQuizzes
        };
    }, [localAnswers, elements]);

    const IntersectionWrapper = ({ children, id, score, type, isAlreadyComplete }) => {
        const elementRef = useRef(null);
        const handleMobileLayout = () => {
            if (type === 'quiz_objective' || type === 'workshop') return;

            if (Platform.OS !== 'web' && !isAlreadyComplete && !viewedElements[id]) {
                setTimeout(() => {
                    markAsComplete(id, score);
                }, 8000); 
            }
        };

        useEffect(() => {
            if (isAdmin || type === 'quiz_objective' || type === 'workshop' || viewedElements[id] || isAlreadyComplete) return;

            if (Platform.OS === 'web') {
                const observer = new IntersectionObserver(
                    ([entry]) => {
                        if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
                            observer.disconnect();
                            setTimeout(() => {
                                markAsComplete(id, score);
                            }, 5000);
                        }
                    },
                    { threshold: [0.7] }
                );

                if (elementRef.current) {
                    observer.observe(elementRef.current);
                }

                return () => observer.disconnect();
            }
        }, [id, isAlreadyComplete, type]); 

        return (
            <View 
                ref={elementRef} 
                onLayout={handleMobileLayout} 
                style={{ width: '100%' }}
            >
                {children}
            </View>
        );
    };

    const markAsComplete = (id, score) => {
        if (isAdmin || viewedElements[id]) return;
        setViewedElements(prev => ({ ...prev, [id]: true }));
        if (onProgressUpdate) {
            onProgressUpdate(id, score);
        }
    };

    const handleQuizSubmit = (el, selectedOption) => {
        const isCorrect = selectedOption === el.content.answer;
        setQuizStates(prev => ({
            ...prev,
            [el.id]: { 
                selected: selectedOption, 
                isCorrect, 
                submitted: !isFinalQuiz 
            }
        }));
        if (onProgressUpdate && !isFinalQuiz) {
            onProgressUpdate(el.id, isCorrect ? el.score : 0);
        }

        if (isFinalQuiz) {
            setFinalQuizAnswers(prev => ({
                ...prev,
                [el.id]: { isCorrect, earned: isCorrect ? el.score : 0, score: el.score }
            }));
        }
    };

    const resetQuiz = (id) => {
        setQuizStates(prev => ({
            ...prev,
            [id]: { selected: null, isCorrect: null, submitted: false }
        }));

        setLocalAnswers(prev=>{
            const updated={...prev};
            delete updated[id];
            return updated;
        })
    };

    const confirmDelete = (el) => {
        const message = "Are you sure you want to delete this section? This action cannot be undone.";
        if (window.confirm(message)) {
            if (typeof onDeleteElement === 'function') {
                onDeleteElement(el.id);
            }
        }
    };

    useEffect(() => {
        if (!isAdmin) {
            const loadLocalProgress = async () => {
                try {
                    const saved = await AsyncStorage.getItem(`@video_progress_${courseId}`);
                    if (saved !== null) {
                        setVideoProgress(JSON.parse(saved));
                    }
                } catch (e) {
                    console.error("Failed to load progress from device storage", e);
                }
            };
            loadLocalProgress();
        }
    }, [courseId, isAdmin]);
    
    const VideoPlayer = ({ url }) => {
        const getVideoId = (originalUrl) => {
            let videoId = '';
            if (originalUrl.includes('v=')) {
                videoId = originalUrl.split('v=')[1].split('&')[0];
            } else if (originalUrl.includes('youtu.be/')) {
                videoId = originalUrl.split('youtu.be/')[1];
            } else if (originalUrl.includes('embed/')) {
                videoId = originalUrl.split('embed/')[1];
            }
            return videoId;
        };

        const videoId = getVideoId(url);
        const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&controls=1&playsinline=1`;

        const openInYouTube = async () => {
            const appUrl = `youtube://watch?v=${videoId}`;
            const webUrl = `https://www.youtube.com/watch?v=${videoId}`;
            try {
                const supported = await Linking.canOpenURL(appUrl);
                if (supported) {
                    await Linking.openURL(appUrl);
                } else {
                    await Linking.openURL(webUrl);
                }
            } catch (e) {
                await Linking.openURL(webUrl);
            }
        };

        if (Platform.OS === 'web') {
            return (
                <View style={{ height: 450 }}>
                    <iframe
                        src={embedUrl}
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        allowFullScreen
                    />
                </View>
            );
        }

        return (
            <View style={{ height: 220, borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' }}>
                <TouchableOpacity
                    onPress={openInYouTube}
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: '#000'
                    }}
                >
                    <Text style={{ color: 'white', fontSize: 14 }}>
                        ▶ Open in YouTube
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    const navigationData = useMemo(() => {
        const flatPages = [];

        const course = pageMetadata?.course;
        const modules = course?.modules ?? [];

        modules.forEach(mod => {
            mod.pages?.forEach(p => flatPages.push({ type: 'page', page: p, module: mod }));
        });

        const currentIndex = flatPages.findIndex(p => {
            if (p.type !== pageMetadata?.type) return false;

            if (p.type === 'page') return p.page?.id === pageMetadata?.page?.id;

            return p.module?.id === pageMetadata?.module?.id;
        });

        return {
            flatPages,
            currentIndex,
            isFirst: currentIndex <= 0,
            isLast: currentIndex >= flatPages.length - 1
        };
    }, [pageMetadata]);

    const handleNavigation = (direction) => {
        const { flatPages, currentIndex } = navigationData;

        if (!flatPages || flatPages.length === 0) return;

        const targetIndex =
            direction === 'next' ? currentIndex + 1 : currentIndex - 1;

        if (targetIndex < 0 || targetIndex >= flatPages.length) return;

        const target = flatPages[targetIndex];
        if (!isAdmin && target.type === 'page') {
            const status = progressMap?.[target.page.id];
            if (status?.isLocked) {
                const message = "Next Page is locked. Please complete the current lesson to unlock the next one.";
                
                if (Platform.OS === 'web') {
                    window.alert(message);
                } else {
                    Alert.alert("Content Locked", message);
                }
                return;
            }
        }
        onSelectPage?.(target);
        scrollToTop?.();
    };
    const renderElement = (el, index) => {
        if (!el || !el.id) return null;
        const { type, content, score, id } = el;
        const earnedScore = typeof userMarks?.[id] === 'object' 
            ? (userMarks[id]?.earned_grade ?? 0) 
            : (userMarks?.[id] ?? 0);
        const isAlreadyComplete = earnedScore > 0;
        const isViewed = earnedScore > 0;
        const quiz = quizStates[id] || { 
            selected: null, 
            isCorrect: isViewed,
            submitted: isViewed 
        };

        return (
            <IntersectionWrapper key={id} id={id} score={score} type={type} isAlreadyComplete={isAlreadyComplete}>
                <View style={styles.masterWrapper}>
                    <View style={styles.userScoreHeader}>
                        <Text style={styles.userScoreText}>
                            {isAdmin ? "" : (
                                (!isFinalQuiz || showFinalResults) 
                                    ? (isViewed || quiz.isCorrect ? `${score}/${score} pts` : `${earnedScore}/${score} pts`)
                                    : `- / ${score} pts` 
                            )}
                        </Text>
                        {!isAdmin && ((!isFinalQuiz || showFinalResults) && (isViewed || quiz.isCorrect)) && (
                            <CheckCircle2 size={14} color="#0a6340" />
                        )}
                    </View>

                    {isAdmin && !isPublished && (
                        <View style={styles.adminHeader}>
                            <View style={styles.orderGroup}>
                                <TouchableOpacity 
                                    onPress={() => onMoveElement(id, 'up')}
                                    disabled={index === 0}
                                    style={[styles.orderBtn, index === 0 && { opacity: 0.2 }]}
                                >
                                    <ChevronUp color="#666" size={18} />
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    onPress={() => onMoveElement(id, 'down')}
                                    disabled={index === elements.length - 1}
                                    style={[styles.orderBtn, index === elements.length - 1 && { opacity: 0.2 }]}
                                >
                                    <ChevronDown color="#666" size={18} />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.scoreBadge}>
                                <Text style={styles.scoreText}>{score || 0} Points</Text>
                            </View>
                            <TouchableOpacity style={styles.editCircle} onPress={() => onEditElement(el)}>
                                <Edit3 color="#0a6340" size={16} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.deleteCircle} onPress={() => confirmDelete(el)}>
                                <Trash2 color="#dc2626" size={16} />
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.elementWrapper}>
                        {(() => {
                            switch (type) {
                                case 'text':
                                    return <Markdown style={markdownStyles}>{content.text}</Markdown>;
                                case 'image':
                                    return (
                                        <View>
                                            <Image source={{ uri: content.url }} style={styles.imageBox} resizeMode="cover" />
                                            {content.caption && <Text style={styles.caption}>{content.caption}</Text>}
                                        </View>
                                    );
                                case 'video':
                                    return (
                                        <View style={styles.videoContainer}>
                                            <VideoPlayer url={content.url} />
                                            <View style={styles.videoCardBottom}>
                                                <View style={styles.videoLabelRow}>
                                                    <Play color="#0a6340" size={16} fill="#0a6340" />
                                                    <Text style={styles.videoLabel}>Technical Training Module</Text>
                                                </View>
                                                <Text style={styles.transcript}>{content.transcript || "No transcript."}</Text>
                                            </View>
                                        </View>
                                    );
                                case 'quiz_objective':
                                    const revealFeedback = !isFinalQuiz || showFinalResults;
                                    return (
                                        <View style={[
                                            styles.quizCard, 
                                            (revealFeedback && quiz.submitted && !quiz.isCorrect) && styles.quizCardError
                                        ]}>
                                            <View style={styles.quizHeader}>
                                                <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                                                    <HelpCircle color="#0a6340" size={13}/>
                                                    <Text style={styles.quizTitle}>Knowledge Check</Text>
                                                </View>
                                            </View>
                                            <Text style={styles.question}>{content.question}</Text>
                                            {content.options.map((option, idx) => {
                                                const isSelected = localAnswers[id] === option;
                                                const showSuccess = revealFeedback && (quiz.submitted || isAdmin) && option === content.answer;
                                                const showDanger = revealFeedback && quiz.submitted && isSelected && !quiz.isCorrect;
                                                return (
                                                    <TouchableOpacity 
                                                        key={idx}
                                                        disabled={isAdmin || (isFinalQuiz ? showFinalResults : quiz.submitted)}
                                                        onPress={() => {
                                                            handleQuizSubmit(el, option);
                                                            handleQuizSelect(id, option);
                                                        }}
                                                        style={[
                                                            styles.optionBtn,
                                                            isSelected && styles.optionSelected,
                                                            showSuccess && styles.optionSuccess,
                                                            showDanger && styles.optionDanger
                                                        ]}
                                                    >
                                                        <View style={[styles.radioOutline, (isSelected || showSuccess) && styles.correctRadio]}>
                                                            {(isSelected || showSuccess) && <View style={styles.radioInner} />}
                                                        </View>
                                                        <Text style={styles.optionText}>{option}</Text>
                                                    </TouchableOpacity>
                                                );
                                            })}

                                            {(revealFeedback && quiz.submitted) && (
                                                <View style={styles.quizFeedback}>
                                                    {!quiz.isCorrect ? (
                                                        <View style={styles.feedbackRow}>
                                                            <AlertCircle size={16} color="#dc2626" />
                                                            <Text style={styles.errorText}>
                                                                Incorrect. {isFinalQuiz ? "Check your summary below." : `The correct answer is: ${content.answer}`}
                                                            </Text>
                                                        </View>
                                                    ) : (
                                                        <Text style={styles.successText}>Correct! Well done.</Text>
                                                    )}
                                                    {!isFinalQuiz && !quiz.isCorrect && (
                                                        <TouchableOpacity style={styles.redoBtn} onPress={() => resetQuiz(el.id)}>
                                                            <RotateCcw size={14} color="#0a6340" />
                                                            <Text style={styles.redoText}>Try Again</Text>
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                            )}
                                        </View>                                        
                                    );
                                case 'workshop':
                                    const { title, description, sessions, location } = content;
                                    const isRegisteredInDB = (userMarks?.[id]?.earned_grade ?? 0) > 0;
                                    const isRegistered = workshopRegistrations[id] || isRegisteredInDB;
                                    return (
                                        <View style={[styles.workshopCard, isMobile && { flexDirection: 'column' }]}>
                                            <View style={[
                                                styles.workshopDateTag, 
                                                isRegistered && { backgroundColor: '#0a6340' },
                                                isMobile && { width: '100%', flexDirection: 'row', borderRightWidth: 0, borderBottomWidth: 1, borderBottomColor: '#dcfce7', gap: 10, padding: 10 }
                                            ]}>
                                                {isRegistered ? <CheckCircle2 color="white" size={26} /> : <Calendar color="white" size={26} />}
                                                <Text style={styles.workshopLabel}>{isRegistered ? "ENROLLED" : "WORKSHOP"}</Text>
                                            </View>
                                            <View style={styles.workshopDetails}>
                                                <Text style={styles.workshopTitle}>{title}</Text>
                                                <Text style={styles.workshopDesc}>{description}</Text>
                                                <Text style={styles.miniLabel}>{isRegistered ? "Your Registered Session:" : "Available Sessions:"}</Text>
                                                <View style={styles.sessionList}>
                                                    {sessions?.map((item, idx) => {
                                                        const isSelected = selectedSessions[id] === idx;
                                                        if (isRegistered && !isSelected && !isAdmin) return null;
                                                        return (
                                                            <TouchableOpacity 
                                                                key={idx} 
                                                                disabled={isAdmin || isRegistered} 
                                                                onPress={() => setSelectedSessions(prev => ({ ...prev, [id]: idx }))}
                                                                style={[styles.sessionItem, isSelected && styles.sessionItemSelected]}
                                                            >
                                                                <View style={styles.sessionDateRow}>
                                                                    <View style={[styles.radioOutline, isSelected && styles.correctRadio]}>
                                                                        {isSelected && <View style={styles.radioInner} />}
                                                                    </View>
                                                                    <Text style={styles.sessionDateText}>{item.date}</Text>
                                                                </View>
                                                                <View style={[styles.sessionTimeRow, isMobile && { justifyContent: 'flex-start', paddingLeft: 30 }]}>
                                                                    <Clock size={14} color="#666" />
                                                                    <Text style={styles.sessionTimeText}>{item.startTime} — {item.endTime}</Text>
                                                                </View>
                                                            </TouchableOpacity>
                                                        );
                                                    })}
                                                </View>
                                                <View style={styles.footerRow}>
                                                    <View style={styles.infoRow}>
                                                        <MapPin size={14} color="#666" />
                                                        <Text style={styles.infoText}>{location || "TBA"}</Text>
                                                    </View>
                                                    {!isAdmin && (
                                                        <TouchableOpacity 
                                                            style={[styles.joinBtn, (selectedSessions[id] === undefined || isRegistered) && styles.joinBtnDisabled]}
                                                            disabled={selectedSessions[id] === undefined || isRegistered}
                                                            onPress={() => handleRegisterWorkshop(id, sessions, selectedSessions[id], autoAddTodo, location, '', currentUser.id)}
                                                        >
                                                            <Text style={styles.joinBtnText}>{isRegistered ? "Registered" : "Register"}</Text>
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                            </View>
                                        </View>
                                    );
                                default:
                                    return null;
                            }
                        })()}
                    </View>
                </View>
            </IntersectionWrapper>
        );
    };

    return (
        <View style={styles.container}>
            {elements.map((el, index) => renderElement(el, index))}

            {isFinalQuiz && !showFinalResults && (
                <View style={styles.compactSubmitBar}>
                    <Text style={styles.submitInfoText}>
                        Progress: {currentStats.answeredCount} / {currentStats.totalQuizzes} Answered
                    </Text>
                    <TouchableOpacity
                        style={[styles.minimalSubmitBtn, (isSubmitting || !currentStats.isAllAnswered) && { opacity: 0.5 }]}
                        onPress={handleFinalSubmit}
                        disabled={isSubmitting || !currentStats.isAllAnswered}
                    >
                        <Text style={styles.minimalSubmitText}>
                            {isSubmitting ? "Submitting..." : "Submit Assessment"}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {showFinalResults && (
                <View style={styles.profResultCard}>
                    <View style={[styles.statusIndicator, { backgroundColor: finalSummary?.status === 'PASS' ? '#0a6340' : '#dc2626' }]} />
                    <View style={styles.resultMain}>
                        <View style={styles.resultHeader}>
                            <Text style={styles.resScoreValue}>
                                {finalSummary?.score} <Text style={styles.resScoreTotal}>/ {finalSummary?.total}</Text>
                            </Text>
                            {/* FIX: Redo button allows re-attempts if left regardless of pass/fail status */}
                            {currentAttemptCount < (pageMetadata.page?.max_tries || 1) ? (
                                <TouchableOpacity style={styles.redoBtn} onPress={handleTryAgain}>
                                    <RotateCcw size={14} color="#0a6340" />
                                    <Text style={styles.redoText}>
                                        {finalSummary?.status === 'PASS' ? "Improve Score" : "Try Again"}
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.failureNotice}>
                                    <AlertCircle size={14} color="#dc2626" />
                                    <Text style={styles.failureText}>No retries left</Text>
                                </View>
                            )}
                        </View>
                        <Text style={[styles.miniBadgeText, { color: finalSummary?.status === 'PASS' ? '#0a6340' : '#dc2626' }]}>
                            {finalSummary?.status === 'PASS' ? "Requirement Met" : "Re-attempt Required"}
                        </Text>
                    </View>
                </View>
            )}

            {!isAdmin && isFinalQuiz && (
                <View style={styles.assessmentFooter}>
                    <View style={styles.footerInfo}>
                        <Text style={styles.footerHint}>
                            {Math.max(0, (pageMetadata.page?.max_tries || 1) - currentAttemptCount)} retries remaining
                        </Text>
                    </View>
                    <TouchableOpacity 
                        onPress={() => onFetchHistory(elements.filter(el => el.type === 'quiz_objective').map(el => el.id))} 
                        style={styles.historyLinkBtn}
                    >
                        <FileText size={16} color="#64748b" />
                        <Text style={styles.historyLinkText}>View Performance History</Text>
                    </TouchableOpacity>
                </View>
            )}

            {onSelectPage?.type !== 'workshops' && !isAdmin && (
                <View style={styles.pageNavigationRow}>
                    <TouchableOpacity style={styles.navBtn} onPress={() => handleNavigation('prev')}
                        disabled={navigationData.isFirst}
                        >
                        <ChevronLeft size={20} color="#666" />
                        <Text style={styles.navBtnText}>Previous</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.navBtn,
                            styles.navBtnPrimary,
                            navigationData.isLast && { opacity: 0.4 }
                        ]}
                        onPress={() => handleNavigation('next')}
                        disabled={navigationData.isLast}
                    >
                        <Text style={[styles.navBtnText, {color: 'white'}]}>Next Lesson</Text>
                        <ChevronRight size={20} color="white" />
                    </TouchableOpacity>
                </View>
            )}
            
        </View>
    );
};

const styles = StyleSheet.create({
    container: { 
        paddingBottom: 40 
    },
    elementWrapper: { 
        marginBottom: 25
    },
    emptyState: { 
        padding: 40, 
        alignItems: 'center' 
    },
    emptyText: { 
        color: '#999', 
        fontStyle: 'italic' 
    },
    textContent: { 
        fontSize: 16, 
        color: '#374151', 
        lineHeight: 26 
    },

    imageBox: { 
        width: '100%', 
        height: 450, 
        borderRadius: 12, 
        backgroundColor: '#f3f4f6' ,
        resizeMode:'contain'
    },
    caption: { 
        fontSize: 13, 
        color: '#6b7280', 
        marginTop: 8, 
        fontStyle: 'italic', 
        textAlign: 'center' 
    },

    videoContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        overflow: 'hidden',
    },
    videoPlayer: { 
        width: '100%', 
        height: 220, 
        backgroundColor: '#000' 
    },
    progressSection: {
        paddingHorizontal: 15,
        paddingVertical: 12,
        backgroundColor: '#F9FAFB',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    progressHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        marginBottom: 8 
    },
    progressText: { 
        fontSize: 12, 
        fontWeight: '700', 
        color: '#374151' 
    },
    completeBadge: { 
        backgroundColor: '#0a6340', 
        paddingHorizontal: 6, 
        borderRadius: 4 
    },
    completeBadgeText: { 
        color: '#fff', 
        fontSize: 10, 
        fontWeight: '900' 
    },
    videoCardBottom: { 
        padding: 15 
    },
    videoLabelRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: 6 
    },
    videoLabel: { 
        fontWeight: 'bold', 
        fontSize: 14, 
        marginLeft: 8 
    },
    transcript: { 
        color: '#6B7280', 
        fontSize: 13 
    },

    fileCard: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 15, 
        backgroundColor: '#fff', 
        borderRadius: 12, 
        borderWidth: 1, 
        borderColor: '#e5e7eb', 
        marginBottom: 20 
    },
    fileIconBox: { 
        width: 45, 
        height: 45, 
        borderRadius: 8, 
        backgroundColor: '#ecfdf5', 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    fileDetails: { 
        flex: 1, 
        marginLeft: 12 
    },
    fileName: { 
        fontSize: 14, 
        fontWeight: '600', 
        color: '#111827' 
    },
    fileDesc: { 
        fontSize: 12, 
        color: '#6b7280' 
    },

    quizCard: { 
        backgroundColor: '#fff', 
        padding: 20, 
        borderRadius: 16, 
        borderWidth: 1, 
        borderColor: '#d1fae5', 
        marginBottom: 30 
    },
    quizHeader: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: 12 
    },
    quizTitle: { 
        marginLeft: 8, 
        fontSize: 11, 
        fontWeight: '800', 
        color: '#0a6340', 
        textTransform: 'uppercase' 
    },
    question: { 
        fontSize: 17, 
        fontWeight: 'bold', 
        color: '#111827', 
        marginBottom: 15 
    },
    optionBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 12, 
        backgroundColor: '#f9fafb', 
        borderRadius: 10, 
        marginBottom: 8 
    },
    radioOutline: { 
        width: 18, 
        height: 18, 
        borderRadius: 9, 
        borderWidth: 2, 
        borderColor: '#ccc', 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginRight: 10 
    },
    correctRadio: { 
        borderColor: '#0a6340' 
    },
    radioInner: { 
        width: 10, 
        height: 10, 
        borderRadius: 5, 
        backgroundColor: '#0a6340' 
    },
    optionText: { 
        fontSize: 14, 
        color: '#374151' 
    },
     videoCardBottom: {
        padding: 15
    },

    videoLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6
    },

    videoLabel: {
        fontWeight: 'bold',
        fontSize: 14,
        marginLeft: 8
    },

    transcript: {
        color: '#6B7280',
        fontSize: 13
    },
    masterWrapper: {
        marginBottom: 10,
        position: 'relative',
    },
    adminHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    scoreBadge: {
        backgroundColor: '#f0fdf4',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#dcfce7',
    },
    scoreText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#0a6340',
    },
    editCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        ...Platform.select({
            web: { boxShadow: '0px 2px 4px rgba(0,0,0,0.1)' },
            default: { elevation: 3 }
        })
    },
    deleteCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#fee2e2', 
        ...Platform.select({
            web: { boxShadow: '0px 2px 4px rgba(220, 38, 38, 0.1)' },
            default: { elevation: 3 }
        })
    },
    orderGroup: {
        flexDirection: 'row',
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#eee',
        marginRight: 'auto',
        overflow: 'hidden'
    },
    orderBtn: {
        padding: 6,
        borderRightWidth: 1,
        borderRightColor: '#eee',
        alignItems: 'center',
        justifyContent: 'center'
    },
    userScoreHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginBottom: 5,
        justifyContent: 'flex-end',
        marginRight:20
    },
    userScoreText: {
        fontSize: 15,
        color: '#666',
        fontWeight: '600'
    },
    optionSelected: {
        borderColor: '#0a6340',
        backgroundColor: '#f0fdf4'
    },
    optionSuccess: {
        borderColor: '#0a6340',
        backgroundColor: '#dcfce7'
    },
    optionDanger: {
        borderColor: '#dc2626',
        backgroundColor: '#fef2f2'
    },
    quizFeedback: {
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#eee'
    },
    feedbackRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10
    },
    errorText: {
        color: '#dc2626',
        fontSize: 13,
        fontWeight: '600'
    },
    successText: {
        color: '#0a6340',
        fontSize: 13,
        fontWeight: '600'
    },
    redoBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        alignSelf: 'flex-start',
        padding: 8,
        backgroundColor: '#f0fdf4',
        borderRadius: 5
    },
    redoText: {
        color: '#0a6340',
        fontSize: 12,
        fontWeight: 'bold'
    },
    quizCardError: {
        borderColor: '#fecaca'
    },
    workshopCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        flexDirection: 'row',
        overflow: 'hidden',
        marginBottom: 25,
    },
    workshopDateTag: {
        backgroundColor: '#0a6340',
        padding: 15,
        alignItems: 'center',
        justifyContent: 'center',
        borderRightWidth: 1,
        borderRightColor: '#dcfce7',
        width: 80,
    },
    workshopLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: 'white',
        marginTop: 5,
        letterSpacing: 1,
    },
    workshopDetails: {
        flex: 1,
        padding: 20,
    },
    workshopTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    workshopDesc: {
        fontSize: 14,
        color: '#4b5563',
        lineHeight: 22,
        marginBottom: 15,
    },
    sessionList: {
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        padding: 12,
        marginBottom: 15,
        gap: 10,
    },
    sessionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    sessionDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    sessionTimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1.2,
        justifyContent: 'flex-end',
    },
    sessionDateText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    sessionTimeText: {
        fontSize: 13,
        color: '#4b5563',
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 5,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoText: {
        fontSize: 13,
        color: '#666',
    },
    joinBtn: {
        backgroundColor: '#0a6340',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        gap: 8,
    },
    joinBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    radioOutline: { 
        width: 16, 
        height: 16, 
        borderRadius: 8, 
        borderWidth: 2, 
        borderColor: '#ccc', 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginRight: 10 
    },
    correctRadio: { 
        borderColor: '#0a6340' 
    },
    radioInner: { 
        width: 8, 
        height: 8, 
        borderRadius: 4, 
        backgroundColor: '#0a6340' 
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f8fafc',
        padding: 10,
        borderRadius: 8,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    toggleLabel: {
        fontSize: 12,
        color: '#475569',
        fontWeight: '500',
    },
    toggleTrack: {
        width: 36,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#cbd5e1',
        padding: 2,
    },
    toggleTrackActive: {
        backgroundColor: '#0a6340',
    },
    toggleThumb: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: 'white',
        transform: [{ translateX: 0 }],
    },
    toggleThumbActive: {
        transform: [{ translateX: 16 }],
    },
    compactSubmitBar: {
        marginTop: 40,
        padding: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    submitInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    submitInfoText: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
    },
    minimalSubmitBtn: {
        backgroundColor: '#0a6340',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
        gap: 6,
    },
    minimalSubmitText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 13,
    },

    profResultCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        marginTop: 20,
        flexDirection: 'row',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    statusIndicator: {
        width: 6,
    },
    resultMain: {
        flex: 1,
        padding: 16,
    },
    resultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    miniBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    miniBadgeText: {
        fontSize: 10,
        fontWeight: '800',
    },
    resScoreValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1e293b',
    },
    resScoreTotal: {
        fontSize: 14,
        color: '#94a3b8',
        fontWeight: '400',
    },
    tryAgainBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        padding: 6,
        backgroundColor: '#f8fafc',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    tryAgainText: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
    },
    assessmentFooter: {
        marginTop: 30,
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed',
        alignItems: 'center',
    },
    footerInfo: {
        alignItems: 'center',
        marginBottom: 15,
    },
    footerHint: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '500',
    },
    historyLinkBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 8,
    },
    historyLinkText: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '600',
    },
    failureNotice: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#fef2f2',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#fee2e2',
        flexDirection:'row',
        gap:10,
    },
    failureNoticeText: {
        color: '#dc2626',
        fontSize: 12,
        fontWeight: '700',
        textAlign: 'center',
    },
    pageNavigationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 50,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        gap: 15,
    },
    navBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        backgroundColor: '#f1f5f9',
        gap: 8,
    },
    navBtnPrimary: {
        backgroundColor: '#0a6340',
    },
    navBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
    },
    miniBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
});

export default PageRenderer;
