import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { FileText, Play, Download, HelpCircle } from 'lucide-react-native';

const PageRenderer = ({ elements }) => {
    if (!elements || elements.length === 0) {
        return (
            <View style={styles.emptyState}>
                <Text style={styles.emptyText}>This page has no content yet.</Text>
            </View>
        );
    }

    const renderElement = (el) => {
        const { type, content } = el;

        switch (type) {
            case 'text':
                return (
                    <View key={el.id} style={styles.elementWrapper}>
                        <Text style={styles.textContent}>{content.text}</Text>
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
                return (
                    <TouchableOpacity 
                        key={el.id} 
                        style={styles.videoCard}
                        onPress={() => content.url && Linking.openURL(content.url)}
                    >
                        <View style={styles.videoIconBox}>
                            <Play color="#fff" size={24} fill="#fff" />
                        </View>
                        <View style={styles.videoInfo}>
                            <Text style={styles.videoLabel}>Video Lesson</Text>
                            <Text style={styles.transcript} numberOfLines={2}>
                                {content.transcript || "No transcript available."}
                            </Text>
                        </View>
                    </TouchableOpacity>
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

    videoCard: { 
        flexDirection: 'row', 
        backgroundColor: '#1f2937', 
        borderRadius: 12, 
        marginBottom: 25, 
        overflow: 'hidden' 
    },
    videoIconBox: { 
        width: 70, 
        backgroundColor: '#0a6340', 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    videoInfo: { 
        flex: 1, 
        padding: 15 
    },
    videoLabel: { 
        color: '#fff', 
        fontWeight: 'bold', 
        fontSize: 14, 
        marginBottom: 4 
    },
    transcript: { 
        color: '#9ca3af', 
        fontSize: 12 
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
    }
});

export default PageRenderer;