import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { Lock, ShieldCheck, Send, ArrowLeft } from 'lucide-react-native';
import { useDiscussions } from '../hooks/useDiscussion';
import { discussionService } from '../services/discussionService';

// Remove 'styles' from the props here so it uses the local StyleSheet below
const DiscussionSection = ({ courseId, navigation }) => {
    const [forumType, setForumType] = useState('Public');
    const [selectedDiscussion, setSelectedDiscussion] = useState(null);
    const [newDiscussionTitle, setNewDiscussionTitle] = useState('');
    const [instantReplies, setInstantReplies] = useState({});
    const [isCreatingDiscussion, setIsCreatingDiscussion] = useState(false);

    const { discussions, loading, refreshDiscussions } = useDiscussions(courseId, forumType);

    const handleCreateDiscussion = async () => {
        if (!newDiscussionTitle.trim()) return;
        setIsCreatingDiscussion(true);
        try {
            await discussionService.createDiscussion(courseId, {
                title: newDiscussionTitle.trim(),
                is_public: forumType === 'Public',
            });
            setNewDiscussionTitle('');
            refreshDiscussions();
        } catch (err) {
            console.error('Unable to create discussion', err);
        } finally {
            setIsCreatingDiscussion(false);
        }
    };

    const handleInstantReply = async (discussionId) => {
        const text = instantReplies[discussionId];
        if (!text?.trim()) return;

        try {
            await discussionService.createMessage(discussionId, { content: text.trim() });
            setInstantReplies({ ...instantReplies, [discussionId]: '' });
            alert("Reply posted!");
            refreshDiscussions();
        } catch (err) { console.error(err); }
    };

    const filteredData = discussions.filter(item => 
        forumType === 'Public' ? item.is_public === true : item.is_public === false
    );

    if (selectedDiscussion) {
        return (
            <View style={styles.detailWrapper}>
                {/* Header / Back Button */}
                <Pressable style={styles.backBtn} onPress={() => setSelectedDiscussion(null)}>
                    <ArrowLeft size={20} color="#0f5132" />
                    <Text style={styles.backText}>Back to Forum</Text>
                </Pressable>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.centeredContent}>
                        {/* THE TOPIC HEADER */}
                        <View style={styles.mainTopicHeader}>
                            <Text style={styles.messageTitle}>{selectedDiscussion.title}</Text>
                            <Text style={styles.messageMeta}>
                                Started by {selectedDiscussion.creator?.username} • {new Date(selectedDiscussion.created_at).toLocaleDateString()}
                            </Text>
                        </View>

                        <View style={styles.separator} />

                        {/* THE INPUT BOX */}
                        <View style={styles.inlineInputContainer}>
                            <TextInput
                                style={styles.detailInput}
                                placeholder="Write a reply..."
                                value={instantReplies[selectedDiscussion.id] || ''}
                                onChangeText={(text) => setInstantReplies({ ...instantReplies, [selectedDiscussion.id]: text })}
                                multiline
                            />
                            <Pressable 
                                style={styles.inlineSendBtn}
                                onPress={() => handleInstantReply(selectedDiscussion.id)}
                            >
                                <Send size={18} color="white" />
                            </Pressable>
                        </View>

                        {/* THE REPLIES LIST */}
                        <View style={styles.messagesContainer}>
                            {selectedDiscussion.messages && selectedDiscussion.messages.length > 0 ? (
                                selectedDiscussion.messages.map((msg) => (
                                    <View key={msg.id} style={styles.msgBubble}>
                                        <Text style={styles.msgUser}>{msg.creator?.username}</Text>
                                        <Text style={styles.msgText}>{msg.content}</Text>
                                    </View>
                                ))
                            ) : (
                                <View style={styles.emptyDetailState}>
                                    <Text style={styles.emptyDetailText}>It's a bit quiet in here...</Text>
                                    <Text style={styles.emptyDetailSubtext}>Be the first to reply!</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={styles.forumWrapper}>
            {/* Tab Navigation */}
            <View style={styles.tabNav}>
                <Pressable 
                    style={[styles.tab, forumType === 'Public' && styles.tabActive]} 
                    onPress={() => setForumType('Public')}
                >
                    <Text style={[styles.tabText, forumType === 'Public' && styles.tabTextActive]}>Public Forum</Text>
                </Pressable>
                <Pressable 
                    style={[styles.tab, forumType === 'Private' && styles.tabActive]} 
                    onPress={() => setForumType('Private')}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Lock size={14} color={forumType === 'Private' ? '#2f6618fe' : '#999'} />
                        <Text style={[styles.tabText, forumType === 'Private' && styles.tabTextActive]}>Private Support</Text>
                    </View>
                </Pressable>
            </View>

            {/* Privacy Banner */}
            {forumType === 'Private' && (
                <View style={styles.privacyBanner}>
                    <ShieldCheck size={16} color="#065f46" />
                    <Text style={styles.privacyText}>Topics are visible only to you and admins.</Text>
                </View>
            )}

            {/* Form */}
            <View style={styles.newDiscussionForm}>
                <Text style={styles.newDiscussionLabel}>Ask a question</Text>
                <TextInput
                    style={styles.newDiscussionInput}
                    placeholder={`New ${forumType.toLowerCase()} discussion title`}
                    value={newDiscussionTitle}
                    onChangeText={setNewDiscussionTitle}
                    editable={!isCreatingDiscussion}
                />
                <Pressable 
                    style={[styles.btn, isCreatingDiscussion && { opacity: 0.6 }]} 
                    onPress={handleCreateDiscussion}
                    disabled={!newDiscussionTitle.trim() || isCreatingDiscussion}
                >
                    <Text style={styles.btnText}>{isCreatingDiscussion ? 'Posting...' : 'Post Question'}</Text>
                </Pressable>
            </View>

            {/* List */}
            {loading ? (
                <ActivityIndicator color="#0a6340" style={{ marginTop: 20 }} />
            ) : filteredData.length === 0 ? (
                <View style={styles.emptyForum}>
                    <Text style={styles.emptyText}>No discussions yet.</Text>
                </View>
            ) : (
                <>
                        {filteredData.map((item) => (
                            <View key={item.id} style={styles.messageContainer}>
                                {/* Topic Header - Clickable to open Detail View */}
                                <Pressable onPress={() => setSelectedDiscussion(item)}>
                                    <Text style={styles.messageTitle}>{item.title || 'Untitled'}</Text>
                                    <Text style={styles.messageMeta}>
                                        By {item.creator?.username} · {new Date(item.created_at).toLocaleDateString()}
                                    </Text>
                                </Pressable>

                                {/* Instant Reply UI */}
                                <View style={styles.instantReplyBox}>
                                    <TextInput
                                        style={styles.instantInput}
                                        placeholder="Quick reply..."
                                        value={instantReplies[item.id] || ''}
                                        onChangeText={(text) => setInstantReplies({...instantReplies, [item.id]: text})}
                                    />
                                    <Pressable 
                                        onPress={() => handleInstantReply(item.id)}
                                        style={styles.sendIcon}
                                    >
                                        <Send size={18} color="#0f5132" />
                                    </Pressable>
                                </View>
                            </View>
                        ))}
                        
                        {/* End of Discussion UI */}
                        <View style={styles.endContainer}>
                            <View style={styles.line} />
                            <Text style={styles.endText}>Oops! U have reached the end.</Text>
                            <View style={styles.line} />
                        </View>
                    </>
            )}
        </View>
    );
};

// Paste your styles here
const styles = StyleSheet.create({
    forumWrapper: {
        flex: 1,
        backgroundColor: '#f5f5f5', 
    },
    tabNav: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    tab: {
        flex: 1, 
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: '#2f6618fe', 
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#999',
    },
    tabTextActive: {
        color: '#2f6618fe',
        fontWeight: '600',
    },
    privacyBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#ecfdf5',
        padding: 12,
        borderRadius: 12,
        marginTop: 12,
        marginHorizontal: 16,
    },
    privacyText: {
        color: '#065f46',
        fontSize: 13,
        flex: 1,
        lineHeight: 18,
    },
    emptyForum: {
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginHorizontal: 16,
        marginTop: 10
    },
    emptyText: {
        color: '#6b7280',
        fontSize: 14,
    }, 
    messageContainer: {
        padding: 15,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        marginBottom: 10,
        marginHorizontal: 16,
    },
    newDiscussionForm: {
        marginVertical: 16,
        marginHorizontal: 16,
        padding: 16,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    newDiscussionLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0f5132',
        marginBottom: 10,
    },
    newDiscussionInput: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        padding: 12,
        color: '#111827',
        fontSize: 14,
    },
    btn: {
        marginTop: 12,
        alignSelf: 'flex-start',
        backgroundColor: '#0f5132',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
    },
    btnText: {
        color: 'white',
        fontWeight: '600',
    },
    messageTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    messageMeta: {
        fontSize: 12,
        color: '#6b7280',
    },
    instantReplyBox: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginTop: 12, 
        borderTopWidth: 1, 
        borderTopColor: '#eee', 
        paddingTop: 12 
    },
    instantInput: { 
        flex: 1, 
        backgroundColor: 
        '#f9fafb', 
        borderRadius: 8, 
        padding: 8, 
        fontSize: 13, 
        borderWidth: 1, 
        borderColor: '#ddd' 
    },
    sendIcon: { 
        marginLeft: 10 
    },
    endContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        marginTop: 10,
        marginBottom: 50, 
        paddingHorizontal: 20 
    },
    line: { 
        flex: 1, 
        height: 1, 
        backgroundColor: 
        '#ddd' 
    },
    endText: { 
        marginHorizontal: 10, 
        color: '#999', 
        fontSize: 12 
    },
    backBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 16, 
        gap: 8, 
        backgroundColor: 'white' 
    },
    backText: { 
        color: '#0f5132', 
        fontWeight: 'bold' 
    },
    separator: { 
        height: 1, 
        backgroundColor: '#eee', 
        marginVertical: 15 
    },
    placeholderText: { 
        color: '#999', 
        fontStyle: 'italic' 
    },
    inlineInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20, 
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginTop: 5,
        marginBottom: 20,
    },
    detailInput: {
        flex: 1,
        fontSize: 14,
        color: '#374151',
        paddingVertical: 8,
        outlineStyle: 'none', 
    },
    instantInput: { 
        flex: 1, 
        backgroundColor: '#f9fafb', 
        borderRadius: 20, 
        paddingHorizontal: 12,
        paddingVertical: 6, 
        fontSize: 12, 
        borderWidth: 1, 
        borderColor: '#eee',
        outlineStyle: 'none',
    },
    inlineSendBtn: {
        backgroundColor: '#0f5132',
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    separator: {
        height: 1,
        backgroundColor: '#e5e7eb',
        marginBottom: 20,
    },
    msgBubble: {
        backgroundColor: '#f9fafb', 
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 15,
        borderTopLeftRadius: 2, 
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#f1f1f1', 
        alignSelf: 'flex-start', 
        maxWidth: '85%',
    },
    msgUser: {
        fontSize: 11,
        fontWeight: '700',
        color: '#0f5132',
        marginBottom: 2,
        textTransform: 'capitalize',
    },
    msgText: {
        fontSize: 13, 
        color: '#4b5563',
        lineHeight: 18,
    },
    detailWrapper: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollContent: {
        flexGrow: 1,
    },
    centeredContent: {
        width: '100%',
        paddingHorizontal: 20,
    },
    mainTopicHeader: {
        marginTop: 20,
        marginBottom: 10,
    },
    emptyDetailState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 70,
        padding: 20,
    },
    emptyDetailText: {
        color: '#6b7280',
        fontSize: 15,
        fontWeight: '600',
    },
    emptyDetailSubtext: {
        color: '#9ca3af',
        fontSize: 13,
        marginTop: 4,
    },
    messagesContainer: {
        marginTop: 10,
    }
});

export default DiscussionSection;