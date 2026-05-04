import React,{useEffect,useState} from 'react';
import { View, Text, StyleSheet, ScrollView, ImageBackground, Pressable, ActivityIndicator, Image} from 'react-native';
import {useRoute} from '@react-navigation/native';
import { Award, Calendar, Clock, Menu, MessageSquare, User } from 'lucide-react-native';

// Import Components
import OutlineBar from '../components/OutlineBar.js';
import { useCourseDetails } from '../hooks/useCourseDetails.js';
import SlidingTabs from '../components/SlidingTabs.js';
import { useElements } from '../hooks/useElements.js';
import PageRenderer from '../components/pageRenderer.js';
import { useDiscussions } from '../hooks/useDiscussion.js';

const EditCourseDetail = () => {
    const route=useRoute();
    const {id}=route.params;
    const {course, loading, error}=useCourseDetails(id);

    const [selectedPage, setSelectedPage]=useState({type:'overview'});
    const [isCollapsed, setIsCollapsed]=useState(false);
    const [activeTab,setActiveTab]=useState('Overview');
    const [forumType, setForumType]=useState('Public');

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
                        {/* Description */}
                        <View>
                            <Text style={styles.sectionTitle}>Course Description</Text>
                            <Text style={styles.bodyText}>{course.description || "No description provided."}</Text>
                        </View>
                        
                        {/* Learning */}
                        <View>
                            <Text style={styles.sectionTitle}>What you'll learn</Text>
                            <View style={styles.learningCard}>
                                <Text style={styles.learningItem}>• Professional fundamentals of {course.title}</Text>
                                <Text style={styles.learningItem}>• Industry-standard techniques and tools</Text>
                                <Text style={styles.learningItem}>• Practical application of core principles</Text>
                            </View>
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

                                {/* Sliding Tab */}
                                <SlidingTabs tabs={tabs} activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} />

                                {/* Tab Content */}
                                <View style={styles.dynamicContent}>
                                    {renderOverviewContent()}
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
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
    learningCard: {
        backgroundColor: '#f9f9f9',
        padding: 15,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#0a6340',
        marginTop: 10,
    },
    learningItem: {
        fontSize: 14,
        color: '#333',
        marginBottom: 5,
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
});

export default EditCourseDetail;