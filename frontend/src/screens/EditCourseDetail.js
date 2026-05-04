import React,{useEffect,useState} from 'react';
import { View, Text, StyleSheet, ScrollView, ImageBackground, Pressable, ActivityIndicator, Image, Modal, TextInput} from 'react-native';
import {useRoute} from '@react-navigation/native';
import { Award, Calendar, Clock, Menu, MessageSquare, User,Edit,X,Save, Heading1, Heading2, List, Bold, Italic, Type, AlignLeft, AlignCenter, AlignRight,ListOrdered } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';

// Import Components
import OutlineBar from '../components/OutlineBar.js';
import { useCourseDetails } from '../hooks/useCourseDetails.js';
import SlidingTabs from '../components/SlidingTabs.js';
import { useElements } from '../hooks/useElements.js';
import PageRenderer from '../components/pageRenderer.js';
import { useDiscussions } from '../hooks/useDiscussion.js';
import { markdownStyles } from '../components/markdownStyle.js';

const EditCourseDetail = () => {
    const route=useRoute();
    const {id}=route.params;
    const {course, loading, error, updateDescription}=useCourseDetails(id);

    const [selectedPage, setSelectedPage]=useState({type:'overview'});
    const [isCollapsed, setIsCollapsed]=useState(false);
    const [activeTab,setActiveTab]=useState('Overview');
    const [forumType, setForumType]=useState('Public');
    const [activeStyles, setActiveStyles] = useState([]);

    const [isEditModalVisible, setEditModalVisible]=useState(false);
    const [editableText, setEditableText] = useState("");

    useEffect(() => {
        if (course?.description) {
            setEditableText(course.description);
        }
    }, [course]);

    const { elements, loading: elementsLoading } = useElements(
        id,
        selectedPage?.page?.module_id || selectedPage?.module?.id,
        selectedPage?.page?.id
    );

    const tabs=[
        {id: 'Overview', label:'Overview'},
        {id: 'Forum', label:'Forum'}
    ];

    const{discussions, loading: discussionsLoading}=useDiscussions(id, forumType);

    if(loading)return(
        <View style={styles.center}>
            <ActivityIndicator size='large' color="#0a6340"/>
            <Text>Syncing with Server...</Text>
        </View>
    );
    
    if (error || !course) return (
        <View style={styles.center}>
            <Text style={{ color: 'red' }}>{error || "Course not found"}</Text>
        </View>
    );

    const handleSaveDescription = async () => {
        const result = await updateDescription(editableText);
        if (result.success) {
            setEditModalVisible(false);
        } else {
            Alert.alert("Error", result.error);
        }
    };

    const insertMarkdown = (syntax) => {
        let newText = editableText;
        const selection = "\n";
        
        const formats = {
            'h1': `# `,
            'h2': `## `,
            'bold': `**text**`,
            'italic': `_text_`,
            'bullet': `* `,
            'number': `1. `,
            'left': `<div align="left">\n`,
            'center': `<div align="center">\n`,
            'right': `<div align="right">\n`
        };

        setEditableText(prev => prev + (formats[syntax] || ""));
    };

    const renderForumList = () => {
        if (discussionsLoading) return <ActivityIndicator color="#0a6340" style={{marginTop: 20}} />;
        
        if (discussions.length === 0) {
            return (
                <View style={styles.emptyForum}>
                    <Text style={styles.emptyText}>No {forumType.toLowerCase()} discussions yet.</Text>
                </View>
            );
        }
        return discussions.map((item) => (
            <View key={item.id} style={styles.messageContainer}>
                <Text>{item.content}</Text>
                
                {item.attachment_type === 'image' && (
                    <Image source={{ uri: item.attachment_url }} style={styles.attachmentImage} />
                )}
                
                {item.attachment_type === 'video' && (
                    <VideoComponent url={item.attachment_url} />
                )}
            </View>
        ));
    };

    const renderOverviewContent = () => {
        switch (activeTab) {
            case 'Overview':
                return (
                    <View style={styles.tabSection}>
                        {/* Render the dynamic content */}
                        <View style={styles.markdownContainer}>
                            <Markdown style={markdownStyles}>
                                {course?.description || "_No content provided yet. Click edit to start._"}
                            </Markdown>
                        </View>

                        {/* Badge Achievement Section */}
                        <View>
                        <Text style={styles.sectionTitle}>Completion Reward</Text>
                        <View style={styles.badgeAchievementCard}>
                            <View style={styles.badgeTextContent}>
                                <Text style={styles.badgeSubtitle}>Official Certification</Text>
                                <Text style={styles.badgeDescription}>
                                    Complete all modules and pass the final assessment to earn your 
                                    <Text style={{fontWeight: '700'}}> {course.title} Professional Badge.</Text>
                                </Text>
                            </View>
                            
                            <View style={styles.badgePreviewContainer}>
                                <Image 
                                    source={course.badge_img_url ? { uri: course.badge_img_url } : require('../../assets/course_badge.png')} 
                                    style={styles.largeAchievementBadge}
                                />
                                <View style={styles.verifiedBadge}>
                                    <Text style={styles.verifiedText}>VERIFIED</Text>
                                </View>
                            </View>
                        </View>
                        </View>
                    </View>
                );
            case 'Forum':
                case 'Forum':
                return (
                    <View style={styles.tabSection}>
                        <Text style={styles.sectionTitle}>Course Forum</Text>
                        
                        <View style={styles.pillContainer}>
                            <Pressable 
                                style={[styles.pill, forumType === 'Public' && styles.activePill]}
                                onPress={() => setForumType('Public')}
                            >
                                <Text style={[styles.pillText, forumType === 'Public' && styles.activePillText]}>Public</Text>
                            </Pressable>
                            <Pressable 
                                style={[styles.pill, forumType === 'Private' && styles.activePill]}
                                onPress={() => setForumType('Private')}
                            >
                                <Text style={[styles.pillText, forumType === 'Private' && styles.activePillText]}>Private</Text>
                            </Pressable>
                        </View>

                        <View style={styles.forumListContainer}>
                            {renderForumList()}
                        </View>
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <View style={styles.rowContainer}>
            {/* Outlinebar */}
            <OutlineBar course={course} onSelectPage={setSelectedPage} editable={true} isCollapsed={isCollapsed}/>
            <ScrollView style={{height:'100vh'}}>
                <View style={styles.container}>
                    {/* Background Image */}
                    <ImageBackground 
                        source={require('../../assets/forest.png')}
                        style={styles.backgroundImage}
                    >
                        <View style={styles.courseContainer}>
                            <Pressable onPress={()=>setIsCollapsed(!isCollapsed)}>
                                <Menu color="white" size={25}/>
                            </Pressable>
                            <View>
                                <Text style={styles.description}>Start your learning journey</Text>
                                <Text style={styles.title}>Course Details</Text>
                            </View>
                        </View>
                    </ImageBackground>
                    {/* Content */}
                    <View style={styles.contentWrapper}>
                        {selectedPage?.type === 'page' ? (
                            <View style={styles.editorContainer}>
                                <Text style={styles.editorLabel}>Lesson Editor</Text>
                                <Text style={styles.pageTitle}>{selectedPage.page.title}</Text>
                                
                                {elementsLoading ? (
                                    <View style={styles.elementLoader}>
                                        <ActivityIndicator color="#0a6340" />
                                        <Text style={styles.loaderText}>Loading Elements...</Text>
                                    </View>
                                ) : (
                                    <PageRenderer elements={elements} />
                                )}
                            </View>
                        ) : (
                            // Course Overview
                            <View>
                                <View style={styles.headerRow}>
                                    <View style={styles.content}>
                                        <Text style={styles.courseTitle}>{course.title}</Text>
                                        <View style={styles.statsRow}>
                                            <View style={styles.statChip}>
                                                <Clock size={16} color="#363636"/>
                                                <Text style={styles.statLabel}>{course.expected_completion_weeks} Weeks</Text>
                                            </View>
                                            <View style={styles.statChip}>
                                                <Calendar size={16} color="#363636"/>
                                                <Text style={styles.statLabel}>Course Validity: {course.must_complete_in_weeks} Weeks</Text>
                                            </View>
                                            <View style={styles.statChip}>
                                                <Award size={16} color="#363636"/>
                                                <Text style={styles.statLabel}>Badge Validity: {course.badge_expire_in_months} Months</Text>
                                            </View>
                                        </View>
                                    </View>
                                    
                                </View>
                                
                                <Image 
                                    source={course.cover_img_url ? { uri: course.cover_img_url } : require('../../assets/first_aid.png')} style={styles.course_cover}
                                />
                                <View style={styles.tabSection}>
                                {/* Sliding Tab */}
                                    <SlidingTabs tabs={tabs} activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} />
                                    {activeTab==='Overview' && (
                                        <Pressable style={styles.editButton} onPress={() => setEditModalVisible(true)}>
                                            <Edit size={16} color="#0a6340" />
                                            <Text style={styles.editButtonText}>Edit Section</Text>
                                        </Pressable>
                                    )}
                                    
                                </View>

                                {/* Tab Content */}
                                <View style={styles.dynamicContent}>
                                    {renderOverviewContent()}
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
            {/* Markdown Editor Modal */}
            <Modal visible={isEditModalVisible} animationType="slide" transparent={false}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Edit Overview</Text>
                        <Pressable onPress={() => setEditModalVisible(false)}>
                            <X color="#666" size={22} />
                        </Pressable>
                    </View>

                    <View style={styles.toolbar}>
                        <View style={styles.toolGroup}>
                            <Pressable style={styles.toolBtn} onPress={() => insertMarkdown('h1')}><Heading1 size={20} color="#444" /></Pressable>
                            <Pressable style={styles.toolBtn} onPress={() => insertMarkdown('h2')}><Heading2 size={20} color="#444" /></Pressable>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.toolGroup}>
                            <Pressable style={styles.toolBtn} onPress={() => insertMarkdown('bold')}><Bold size={20} color="#444" /></Pressable>
                            <Pressable style={styles.toolBtn} onPress={() => insertMarkdown('italic')}><Italic size={20} color="#444" /></Pressable>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.toolGroup}>
                            <Pressable style={styles.toolBtn} onPress={() => insertMarkdown('left')}><AlignLeft size={20} color="#444" /></Pressable>
                            <Pressable style={styles.toolBtn} onPress={() => insertMarkdown('center')}><AlignCenter size={20} color="#444" /></Pressable>
                            <Pressable style={styles.toolBtn} onPress={() => insertMarkdown('right')}><AlignRight size={20} color="#444" /></Pressable>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.toolGroup}>
                            <Pressable style={styles.toolBtn} onPress={() => insertMarkdown('bullet')}><List size={20} color="#444" /></Pressable>
                            <Pressable style={styles.toolBtn} onPress={() => insertMarkdown('number')}><ListOrdered size={20} color="#444" /></Pressable>
                        </View>
                    </View>

                    <TextInput
                        style={styles.editorInput}
                        multiline
                        value={editableText}
                        onChangeText={setEditableText}
                        placeholder="Type your description here using Markdown..."
                        textAlignVertical="top"
                    />

                    <Pressable style={styles.saveBtn} onPress={handleSaveDescription}>
                        <Save color="white" size={20} />
                        <Text style={styles.saveBtnText}>Save Overview</Text>
                    </Pressable>
                </View>
            </Modal>
        </View>

    );
}

const styles = StyleSheet.create({
    rowContainer: {
        flex: 1,
        flexDirection:'row',
    },
    backgroundImage:{
        width:'100%',
        borderRadius:20,
        overflow:'hidden',
        resizeMode:'fill',
        marginTop:10,
    },
    courseContainer:{
        paddingVertical:30,
        paddingHorizontal:20,
        borderRadius:20,
        flexDirection:'row',
        userSelect:'none',
        alignItems:'center',
        
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        color:'white',
        marginLeft:12
    },
    description: {
        fontSize: 14,
        lineHeight: 24,
        color:'white',
        marginLeft:15
    },
    container:{
        flex: 1,
        marginHorizontal:20,
    },
    statsRow:{
        flexDirection:'row',
        gap:12,
        marginBottom:20
    },
    courseTitle:{
        fontSize:20,
        fontWeight:"600",

    },
    statChip:{
        flexDirection:'row',
        alignItems:'center',
        gap:6,
        paddingVertical: 8, 
        paddingHorizontal: 12, 
        borderRadius: 20,
        
    },
    statLabel:{
        color:'#363636'
    },
    content:{
        marginTop:20
    },
    headerRow:{
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems:'center',
        marginBottom:20,
        paddingRight:20
    },
    dynamicContent: {
        paddingBottom: 40,
    },
    tabSection: {
        paddingTop: 10,
        gap:20
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '650',
        color: '#3d3d3d',
        marginTop: 15,
        marginBottom: 8,
    },
    bodyText: {
        color: '#4A4A4A',
        lineHeight: 24,
    },
    pillContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
        marginTop: 10,
    },
    pill: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 25,
        backgroundColor: '#ffffff6e',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    activePill: {
        backgroundColor: '#0a6340',
        borderColor: '#0a6340',
    },
    pillText: {
        fontSize: 14,
        color: '#929292',
        fontWeight: '500',
    },
    activePillText: {
        color: '#fff',
    },
    forumContent: {
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 12,
        minHeight: 100,
        borderWidth: 1,
        borderColor: '#eee',
    },
    badgeAchievementCard: {
        backgroundColor: '#f8fdfb',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#e0f2f1',
        marginTop: 10,
        marginBottom: 30,
    },
    badgeTextContent: {
        flex: 1,
    },
    badgeSubtitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0a6340',
        textTransform: 'uppercase',
        marginBottom: 4,
        textAlign:'center'
    },
    badgeDescription: {
        fontSize: 14,
        color: '#444',
        lineHeight: 20,
        textAlign:'center'
    },
    badgePreviewContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop:20
    },
    largeAchievementBadge: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#FFD700', 
    },
    verifiedBadge: {
        backgroundColor: '#0a6340',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: -10,
    },
    verifiedText: {
        color: '#fff',
        fontSize: 8,
        fontWeight: '900',
    },
    course_cover:{
        alignSelf:'center',
        borderRadius:13,
        width:'800px',
        height:'400px',
        marginBottom:20
    },
    contentWrapper:{
        marginTop:25
    },
    editorContainer: { 
        flex: 1, 
        paddingBottom: 50 
    },
    editorLabel: { 
        color: '#0a6340', 
        fontWeight: 'bold', 
        fontSize: 12, 
        textTransform: 'uppercase', 
        marginBottom: 5 
    },
    pageTitle: { 
        fontSize: 28, 
        fontWeight: 'bold', 
        color: '#1a1a1a', 
        marginBottom: 20 
    },
    elementLoader: { 
        marginTop: 50, 
        alignItems: 'center' 
    },
    loaderText: { 
        marginTop: 10, 
        color: '#666' 
    },
    messageContainer: {
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 10,
    },
    attachmentImage: {
        width: '100%',
        height: 200, 
        borderRadius: 8,
        marginTop: 10,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#ffffff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        alignSelf:'flex-end'
    },
    editButtonText: {
        color: '#0a6340',
        fontWeight: '600',
        fontSize: 13,
    },
    modalContent: {
        flex: 1,
        backgroundColor: 'white',
        padding: 20,
        paddingTop: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    toolbar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e9ecef',
        marginBottom: 10,
        gap: 5,
    },
    toolGroup: {
        flexDirection: 'row',
        gap: 2,
    },
    toolBtnActive: {
        backgroundColor: '#dee2e6',
    },
    toolBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#f0f0f0',
        borderRadius: 6,
    },
    toolBtnText: {
        fontSize: 14,
        color: '#444',
    },
    editorInput: {
        flex: 1,
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
    },
    saveBtn: {
        flexDirection: 'row',
        backgroundColor: '#0a6340',
        padding: 12,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginTop: 20,
        maxWidth:200,
        alignSelf:'flex-end'
    },
    saveBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    divider: {
        width: 1,
        height: 24,
        backgroundColor: '#dee2e6',
        marginHorizontal: 8,
    },
    editorInput: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
        borderWidth: 1,
        borderColor: '#eee',
    },
    
});

export default EditCourseDetail;

// Add hover effect for edit button