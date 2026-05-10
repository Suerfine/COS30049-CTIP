import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Lock, ShieldCheck, Send, ArrowLeft, Trash2 } from 'lucide-react-native';
import { useDiscussions } from '../hooks/useDiscussion';
import { discussionService } from '../services/discussionService';
import { messageService } from '../services/messageService';
import { useMessage } from '../hooks/useMessage';
import { AccountService } from '../services/AccountService';
import { UserRoles } from "../enum/UserRoles";
import { useAuth } from '../context/AuthContext';

const DiscussionSection = ({ courseId, navigation }) => {
    const [forumType, setForumType] = useState('Public');
    const [selectedDiscussion, setSelectedDiscussion] = useState(null);
    const [newDiscussionTitle, setNewDiscussionTitle] = useState('');
    const [instantReplies, setInstantReplies] = useState({});
    const [isCreatingDiscussion, setIsCreatingDiscussion] = useState(false);

    const [mentionSearch, setMentionSearch] = useState('');
    const [activeMentionId, setActiveMentionId] = useState(null);
    const [allSystemUsers, setAllSystemUsers] = useState([]);
    const { currentUser } = useAuth();
    const [suggestedUsers, setSuggestedUsers] = useState([]);

    const { discussions, loading, refreshDiscussions } = useDiscussions(courseId, forumType);
    const { messages, sendMessage, loading: loadingMessages, deleteMessage: deleteMessage } = useMessage(selectedDiscussion?.id);

    // Reset inputs when switching contexts
    useEffect(() => {
        setInstantReplies({}); 
        setNewDiscussionTitle(''); 
        setActiveMentionId(null); 
    }, [forumType, selectedDiscussion]);

    useEffect(() => {
        const loadUsers = async () => {
            try {
                const response = await AccountService.getAll(1, 100, '', null, 'All');
                const users = response?.data || response?.users || (Array.isArray(response) ? response : []);
                setAllSystemUsers(users);
            } catch (err) {
                console.error("Mention load error:", err);
            }
        };
        loadUsers();
    }, []);

    useEffect(() => {
        const fetchMentions = async () => {
            if (mentionSearch.length > 0) {
                try {
                    let data = await AccountService.searchByUsername(mentionSearch, 5);
            
                    if (forumType === 'Private') {
                        data = data.filter(user => user.role !== UserRoles.PARK_GUIDE);
                    }

                    setSuggestedUsers(data);
                } catch (err) {
                    setSuggestedUsers([]);
                }
            }
        };

        const timer = setTimeout(() => {
            fetchMentions();
        }, 300); 

        return () => clearTimeout(timer);
    }, [mentionSearch]);

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

    const canDelete = (item) => {
        if (!currentUser) return false; 
        
        const isOwner = String(currentUser.id) === String(item.creator_user_id);
        const isPrivilegedUser = currentUser.role === UserRoles.ADMIN; 

        return isOwner || isPrivilegedUser;
    };

    const handleDeleteDiscussion = (discussionId) => {
        const title = "Delete Discussion";
        const message = "Are you sure? This will remove all replies as well.";

        // Web fallback
        if (Platform.OS === 'web') {
            const confirmed = window.confirm(`${title}\n\n${message}`);
            if (confirmed) {
                performDeleteDiscussion(discussionId);
            }
            return;
        }

        // Native Mobile Alert
        Alert.alert(title, message, [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: () => performDeleteDiscussion(discussionId) }
        ]);
    };

    const performDeleteDiscussion = async (discussionId) => {
        try {
            await discussionService.deleteDiscussion(courseId, discussionId);
            refreshDiscussions();
            setSelectedDiscussion(null);
        } catch (err) {
            console.error("Delete discussion failed", err);
        }
    };

    const handleDeleteMessage = (messageId) => {
        const title = "Delete Reply";
        const message = "Are you sure you want to delete this message?";

        // Web fallback
        if (Platform.OS === 'web') {
            const confirmed = window.confirm(`${title}\n\n${message}`);
            if (confirmed) {
                performDelete(messageId);
            }
            return;
        }

        // Native Mobile Alert
        Alert.alert(title, message, [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: () => performDelete(messageId) }
        ]);
    };

    const performDelete = async (messageId) => {
        console.log("performDelete called with messageId:", messageId, "Type:", typeof messageId);
        try {
            const success = await deleteMessage(messageId);
        } catch (err) {
            console.error("Delete message failed", err);
        }
    };

    const handleInstantReply = async (discussion) => {
        const text = instantReplies[discussion.id];
        if (!text?.trim()) return;

        try {
            setSelectedDiscussion(discussion);
            await sendMessage(text.trim(), discussion.id);
            setInstantReplies({ ...instantReplies, [discussion.id]: '' });
            refreshDiscussions();
        } catch (err) { console.error(err); }
    };

    const filteredData = discussions.filter(item => 
        forumType === 'Public' ? item.is_public === true : item.is_public === false
    );

    const handleInputChange = (text, id, type) => {
        setInstantReplies({ ...instantReplies, [id]: text });

        // 2. Check for @ trigger
        const words = text.split(/\s/);
        const lastWord = words[words.length - 1];

        if (lastWord.startsWith('@')) {
            setMentionSearch(lastWord.substring(1).toLowerCase());
            setActiveMentionId(id);
        } else {
            setActiveMentionId(null);
        }
    };

    const insertMention = (username, id) => {
        const currentText = instantReplies[id] || '';
        const words = currentText.split(/\s/);
        words.pop(); 
        const newText = [...words, `@${username} `].join(' ');
        
        setInstantReplies({ ...instantReplies, [id]: newText });
        setActiveMentionId(null);
    };

    const MentionSuggestions = ({ discussionId, position = 'bottom' }) => {
        if (activeMentionId !== discussionId || suggestedUsers.length === 0) return null;

        const dynamicPos = position === 'top' ? { bottom: '50%' } : { top: '70%' };

        return (
            <View style={[styles.mentionList, dynamicPos]}>
                {suggestedUsers.map((user) => (
                    <Pressable 
                        key={user.id} 
                        style={styles.mentionItem}
                        onPress={() => insertMention(user.username, discussionId)}
                    >
                        <Text style={styles.mentionText}>@{user.username}</Text>
                    </Pressable>
                ))}
            </View>
        );
    };

    const ReplyCount = ({ discussionId }) => {
        const { pagination } = useMessage(discussionId);

        return (
            <Text style={styles.messageMeta}>
                {pagination.totalElements || 0} replies
            </Text>
        );
    };

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
                        <View style={{ zIndex: 2000 }}>
                            <MentionSuggestions discussionId={selectedDiscussion.id} position="bottom" />

                            <View style={styles.inlineInputContainer}>
                                <TextInput
                                    style={styles.detailInput}
                                    placeholder="Write a reply... use @ to mention someone"
                                    value={instantReplies[selectedDiscussion.id] || ''}
                                    onChangeText={(text) => handleInputChange(text, selectedDiscussion.id, 'detail')}
                                    multiline
                                />
                                <Pressable 
                                    style={styles.inlineSendBtn}
                                    onPress={() => handleInstantReply(selectedDiscussion)}
                                >
                                    <Send size={18} color="white" />
                                </Pressable>
                            </View>
                        </View>

                        {/* THE REPLIES LIST */}
                        <View style={styles.messagesContainer}>
                            {loadingMessages ? (
                                <ActivityIndicator color="#0f5132" />
                            ) : messages && messages.length > 0 ? (
                                messages.map((msg) => (
                                    <View key={msg.id} style={styles.msgWrapper}>
                                        <View key={msg.id} style={styles.msgBubble}>
                                            <View style={styles.msgHeader}>
                                                <Text style={styles.msgUser}>{msg.creator?.username}</Text>
                                                {/* Date Display */}
                                                <Text style={styles.msgDate}>
                                                    {new Date(msg.created_at).toLocaleDateString(undefined, {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </Text>
                                            </View>
                                            <Text style={styles.msgText}>{msg.content}</Text>
                                        </View>

                                        {canDelete(msg) && (
                                            <Pressable 
                                                onPress={() => handleDeleteMessage(msg.id)}
                                                style={styles.msgDeleteBtn}
                                            >
                                                <Trash2 size={16} color="#9ca3af" />
                                            </Pressable>
                                        )}
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
                            {canDelete(item) && (
                                <Pressable 
                                    onPress={() => handleDeleteDiscussion(item.id)}
                                    style={styles.deleteBtnAbsolute}
                                >
                                    <Trash2 size={18} color="#dc3545" />
                                </Pressable>
                            )}

                            {/* Topic Header - Clickable to open Detail View */}
                            <Pressable onPress={() => setSelectedDiscussion(item)}>
                                <Text style={styles.messageTitle}>{item.title || 'Untitled'}</Text>
                                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                                    <Text style={styles.messageMeta}>
                                        By {item.creator?.username} · {new Date(item.created_at).toLocaleDateString()}
                                    </Text>
                                
                                    <ReplyCount discussionId={item.id} />
                                </View>
                            </Pressable>

                            {/* Instant Reply UI */}
                            <View style={{ zIndex: 1000 }}>
                                <MentionSuggestions discussionId={item.id} position="top"/>

                                <View style={styles.instantReplyBox}>
                                    <TextInput
                                        style={styles.instantInput}
                                        placeholder="Quick reply... use @ to mention someone"
                                        value={instantReplies[item.id] || ''}
                                        onChangeText={(text) => handleInputChange(text, item.id, 'public')}
                                    />
                                    <Pressable 
                                        onPress={() => handleInstantReply(item)}
                                        style={styles.sendIcon}
                                    >
                                        <Send size={18} color="#0f5132" />
                                    </Pressable>
                                </View>
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
        borderColor: '#e4e3e3', 
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
        flex: 1,
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
        flex: 1,
        marginBottom: 30,
    },
    msgHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
        gap: 10,
    },
    msgDate: {
        fontSize: 10,
        color: '#9ca3af', 
    },
    mentionList: {
        position: 'absolute',
        elevation: 5,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        zIndex: 5000,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    mentionItem: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    mentionText: {
        color: '#0f5132',
        fontWeight: '600',
        fontSize: 14,
    },
    deleteBtnAbsolute: {
        position: 'absolute',
        top: 15,
        right: 15,
        zIndex: 10,
    },
    msgWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        width: '100%',
    },
    msgDeleteBtn: {
        marginLeft: 5,
        padding: 5,
    },
});

export default DiscussionSection;