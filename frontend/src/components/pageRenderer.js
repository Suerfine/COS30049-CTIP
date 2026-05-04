import { useState,useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { FileText, Play, Download, HelpCircle } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import * as Progress from 'react-native-progress';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WebView from 'react-native-webview';

// Import other hooks and component
import { markdownStyles } from './markdownStyle';
import { UserRoles } from '../enum/UserRoles';

const PageRenderer = ({ elements, role, courseId }) => {
    const isAdmin = role === UserRoles.ADMIN;
    const [videoProgress, setVideoProgress]=useState({});

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

    const renderElement = (el) => {
        const { type, content } = el;
        const currentPercent = videoProgress[el.id] || 0;

        switch (type) {
            case 'text':
                return (
                    <View key={el.id} style={styles.elementWrapper}>
                        <Markdown style={markdownStyles}>
                            {content.text}
                        </Markdown>
                    </View>
                );

            case 'image':
                return (
                    <View key={el.id} style={styles.elementWrapper}>
                        <Image 
                            source={{ uri: content.url }} 
                            style={styles.imageBox} 
                            resizeMode="cover" 
                        />
                        {content.caption && <Text style={styles.caption}>{content.caption}</Text>}
                    </View>
                );

            case 'video':
                const isYoutube = content.url.includes("youtube") || content.url.includes("youtu.be");

                return (
                    <View key={el.id} style={styles.videoContainer}>
                        {isYoutube ? (
                            <VideoPlayer url={content.url} />
                        ) : (
                            <Video
                                source={{ uri: content.url }}
                                style={styles.videoPlayer}
                                controls
                                resizeMode="contain"
                                onProgress={(data) => handleVideoProgress(el.id, data)}
                            />
                        )}

                        <View style={styles.videoCardBottom}>
                            <View style={styles.videoLabelRow}>
                                <Play
                                    color={isAdmin ? "#999" : "#0a6340"}
                                    size={16}
                                    fill={isAdmin ? "#999" : "#0a6340"}
                                />
                                <Text style={[
                                    styles.videoLabel,
                                    { color: isAdmin ? "#999" : "#111827" }
                                ]}>
                                    Technical Training Module
                                </Text>
                            </View>

                            <Text style={styles.transcript} numberOfLines={3}>
                                {content.transcript || "No transcript provided."}
                            </Text>
                        </View>
                    </View>
                    
                );

            case 'file':
                return (
                    <TouchableOpacity 
                        key={el.id} 
                        style={styles.fileCard}
                        onPress={() => content.file_url && Linking.openURL(content.file_url)}
                    >
                        <View style={styles.fileIconBox}>
                            <FileText color="#0a6340" size={22} />
                        </View>
                        <View style={styles.fileDetails}>
                            <Text style={styles.fileName}>{content.file_name}</Text>
                            <Text style={styles.fileDesc}>{content.description}</Text>
                        </View>
                        <Download color="#999" size={18} />
                    </TouchableOpacity>
                );

            case 'quiz_objective':
                return (
                    <View key={el.id} style={styles.quizCard}>
                        <View style={styles.quizHeader}>
                            <HelpCircle color="#0a6340" size={18} />
                            <Text style={styles.quizTitle}>KNOWLEDGE CHECK</Text>
                        </View>
                        <Text style={styles.question}>{content.question}</Text>
                        {content.options.map((option, index) => (
                            <TouchableOpacity key={index} style={styles.optionBtn}>
                                <View style={[
                                    styles.radioOutline, 
                                    option === content.answer && styles.correctRadio
                                ]}>
                                    {option === content.answer && <View style={styles.radioInner} />}
                                </View>
                                <Text style={styles.optionText}>{option}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                );

            default:
                return null;
        }
    };

    return <View style={styles.container}>{elements.map(renderElement)}</View>;
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

});

export default PageRenderer;