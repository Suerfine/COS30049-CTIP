import { useState,useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { FileText, Play, Download, HelpCircle, Edit3, editCircle, Trash2,ChevronUp, ChevronDown, CheckCircle2, RotateCcw, AlertCircle} from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import * as Progress from 'react-native-progress';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WebView from 'react-native-webview';

// Import other hooks and component
import { markdownStyles } from './markdownStyle';
import { UserRoles } from '../enum/UserRoles';

const PageRenderer = ({ elements, role, courseId, onEditElement, onDeleteElement, onMoveElement, onProgressUpdate}) => {
    const isAdmin = role === UserRoles.ADMIN;
    const [videoProgress, setVideoProgress]=useState({});
    const [quizStates, setQuizStates]=useState({});
    const [viewedElements, setViewedElements] = useState({});

    const IntersectionWrapper = ({ children, id, score, type }) => {
        const elementRef = useRef(null);

        useEffect(() => {
            if (isAdmin || type === 'quiz_objective' || viewedElements[id]) return;

            const observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
                        setTimeout(() => {
                            markAsComplete(id, score);
                        }, 5000);
                        observer.disconnect();
                    }
                },
                { threshold: [0.7] }
            );

            if (elementRef.current) {
                observer.observe(elementRef.current);
            }

            return () => observer.disconnect();
        }, [id]);

        return (
            <View ref={elementRef} style={{ width: '100%' }}>
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
            [el.id]: { selected: selectedOption, isCorrect, submitted: true }
        }));

        if (isCorrect && onProgressUpdate) {
            onProgressUpdate(el.id, el.score);
        }
    };

    const resetQuiz = (id) => {
        setQuizStates(prev => ({
            ...prev,
            [id]: { selected: null, isCorrect: null, submitted: false }
        }));
    };

    const confirmDelete = (el) => {
        console.log("onDeleteElement prop type:", typeof onDeleteElement);

        const message = "Are you sure you want to delete this section? This action cannot be undone.";
    
        if (window.confirm(message)) {
            if (typeof onDeleteElement === 'function') {
                onDeleteElement(el.id);
            } else {
                console.error("CRITICAL: onDeleteElement is still undefined. Check Parent Render.");
                alert("Technical Error: Delete function not linked.");
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
    
    const handleVideoProgress = async (id, data) => {
        if (isAdmin) return;

        const percent = data.currentTime / data.playableDuration;
        const lastSavedPercent = videoProgress[id] || 0;

        if (percent > lastSavedPercent + 0.02 || percent >= 0.95) {
            const updatedProgress = { ...videoProgress, [id]: percent };
            setVideoProgress(updatedProgress);
            
            try {
                await AsyncStorage.setItem(
                    `@video_progress_${courseId}`, 
                    JSON.stringify(updatedProgress)
                );
            } catch (e) {
                console.error("Storage error", e);
            }
        }
    };

    const VideoPlayer = ({ url }) => {
        const getEmbedUrl = (originalUrl) => {
            let videoId = '';
            if (originalUrl.includes('v=')) {
                videoId = originalUrl.split('v=')[1].split('&')[0];
            } else if (originalUrl.includes('youtu.be/')) {
                videoId = originalUrl.split('youtu.be/')[1];
            } else if (originalUrl.includes('embed/')) {
                videoId = originalUrl.split('embed/')[1];
            }

            return `https://www.youtube-nocookie.com/embed/${videoId}`;
        };

        const embedUrl = getEmbedUrl(url);

        if (Platform.OS === 'web') {
            return (
                <View style={{ height: 450 }}>
                    <iframe
                        src={embedUrl}
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </View>
            );
        }

        return (
            <View style={{ height: 220 }}>
                <WebView 
                    source={{ uri: embedUrl }} 
                    allowsFullscreenVideo 
                    domStorageEnabled={true}
                    javaScriptEnabled={true}
                    originWhitelist={['*']}
                />
            </View>
        );
    };

    if (!elements || elements.length === 0) {
        return (
            <View style={styles.emptyState}>
                <Text style={styles.emptyText}>This page has no content yet.</Text>
            </View>
        );
    }

    
    const renderElement = (el, index) => {
        const { type, content, score, id } = el;
        const quiz = quizStates[id] || { selected: null, isCorrect: null, submitted: false };
        const isViewed = viewedElements[id] || false;

        return (
            <IntersectionWrapper key={id} id={id} score={score} type={type}>
                <View style={styles.masterWrapper}>
                    <View style={styles.userScoreHeader}>
                        <Text style={styles.userScoreText}>
                            {isAdmin ? "" : (isViewed || quiz.isCorrect ? `${score}/${score} pts` : `0/${score} pts`)}
                        </Text>
                        {!isAdmin && (isViewed || quiz.isCorrect) && <CheckCircle2 size={14} color="#0a6340" />}
                    </View>

                    {isAdmin && (
                        <View style={styles.adminHeader}>
                            {/* ... Admin Buttons remain exactly the same ... */}
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
                                    const isYoutube = content.url?.includes("youtube") || content.url?.includes("youtu.be");
                                    return (
                                        <View style={styles.videoContainer}>
                                            {isYoutube ? <VideoPlayer url={content.url} /> : (
                                                <Video source={{ uri: content.url }} style={styles.videoPlayer} controls />
                                            )}
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
                                    return (
                                        <View style={[styles.quizCard, quiz.submitted && !quiz.isCorrect && styles.quizCardError]}>
                                            <View style={styles.quizHeader}>
                                                <HelpCircle color="#0a6340" size={13}/>
                                                <Text style={styles.quizTitle}>Knowledge Check</Text>
                                            </View>
                                            <Text style={styles.question}>{content.question}</Text>
                                            {content.options.map((option, idx) => {
                                                const isSelected = quiz.selected === option;
                                                const showSuccess = (quiz.submitted || isAdmin) && option === content.answer;
                                                const showDanger = quiz.submitted && isSelected && !quiz.isCorrect;
                                                return (
                                                    <TouchableOpacity 
                                                        key={idx} 
                                                        disabled={isAdmin || quiz.submitted}
                                                        onPress={() => handleQuizSubmit(el, option)}
                                                        style={[
                                                            styles.optionBtn,
                                                            isSelected && styles.optionSelected,
                                                            showSuccess && styles.optionSuccess,
                                                            showDanger && styles.optionDanger
                                                        ]}
                                                    >
                                                        <View style={[styles.radioOutline, isSelected && styles.correctRadio]}>
                                                            {(isSelected || showSuccess) && <View style={styles.radioInner} />}
                                                        </View>
                                                        <Text style={styles.optionText}>{option}</Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                            {quiz.submitted && (
                                                <View style={styles.quizFeedback}>
                                                    {!quiz.isCorrect ? (
                                                        <>
                                                            <View style={styles.feedbackRow}>
                                                                <AlertCircle size={16} color="#dc2626" />
                                                                <Text style={styles.errorText}>Incorrect. The correct answer is: {content.answer}</Text>
                                                            </View>
                                                            <TouchableOpacity style={styles.redoBtn} onPress={() => resetQuiz(id)}>
                                                                <RotateCcw size={14} color="#0a6340" />
                                                                <Text style={styles.redoText}>Try Again</Text>
                                                            </TouchableOpacity>
                                                        </>
                                                    ) : (
                                                        <Text style={styles.successText}>Correct! Well done.</Text>
                                                    )}
                                                </View>
                                            )}
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
            {elements.map((el) => renderElement(el))}
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
    }
});

export default PageRenderer;