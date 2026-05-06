import React,{useEffect,useState} from 'react';
import { View, Text, StyleSheet, ScrollView, ImageBackground, Pressable, ActivityIndicator, Image} from 'react-native';
import {useRoute} from '@react-navigation/native';
import { Award, Calendar, Clock, Menu, ChevronLeft } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';

// Import Components
import OutlineBar from '../components/OutlineBar.js';
import { useCourseDetails } from '../hooks/useCourseDetails.js';
import SlidingTabs from '../components/SlidingTabs.js';
import { useElements } from '../hooks/useElements.js';
import PageRenderer from '../components/pageRenderer.js';
import { useAuth } from '../context/AuthContext.js';
import { markdownStyles } from '../components/markdownStyle.js';
import { useCourses } from '../hooks/useCourses.js';
import { useCourseProgress } from '../components/useCourseProgress.js';

const UserModule = ({navigation}) => {
    const route=useRoute();
    const {id, enrollmentStatus, enrollmentId}=route.params;

    const isLocked = enrollmentStatus === null ||
        enrollmentStatus === undefined ||
        enrollmentStatus === 'in_review' ||
        enrollmentStatus === 'dropped' ||
        enrollmentStatus === 'expired';

    const {currentUser}=useAuth();
    const {course, loading, error,locationTags, categoryTags, saveProgress, userMarks}=useCourseDetails(id, enrollmentId);
    const {allCourseList}=useCourses();
    
    const progressMap = useCourseProgress(course, userMarks);
    const [selectedPage, setSelectedPage]=useState({type:'overview'});
    const [isCollapsed, setIsCollapsed]=useState(false);
    const [activeTab,setActiveTab]=useState('Overview');
    const [forumType, setForumType]=useState('Public');

    const { elements, loading: elementsLoading,registerWorkshop, 
    registering,workshopsLoading,loadWorkshops, workshops } = useElements(
        id,
        selectedPage?.page?.module_id || selectedPage?.module?.id,
        selectedPage?.page?.id
    );
    useEffect(() => {
        if (activeTab === 'Workshops') {
            loadWorkshops();
        }
    }, [activeTab, loadWorkshops]);

    const tabs=[
        {id: 'Overview', label:'Overview'},
        {id: 'Forum', label:'Forum'},
        {id: 'Workshops', label:'Workshops'},
    ];

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

    const renderOverviewContent = () => {
        switch (activeTab) {
            case 'Overview':
                const prerequisiteTitles = course.prerequisite_groups?.flatMap(group => 
                    group.prerequisites?.map(p => {
                        const match = allCourseList.find(c => c.id === p.course_id);
                        return match ? match.title : `Course #${p.course_id}`;
                    })
                ) || [];
                return (
                    <View style={styles.tabSection}>
                        {/* Prerequisite Section */}
                        {prerequisiteTitles.length > 0 && (
                            <View style={styles.prereqSection}>
                                <Text style={styles.sectionTitle}>Required Prerequisite Courses</Text>
                                <View>
                                    {prerequisiteTitles.map((title, index) => (
                                        <View key={index} style={styles.prereqItem}>
                                            <View style={styles.prereqDot} />
                                            <Text style={styles.prereqText}>{title}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
                        {/* Tag Sections */}
                        <View style={styles.tagSectionContainer}>
                            {/* Render Location Tags */}
                            {locationTags.length > 0 && (
                                <View style={styles.tagGroup}>
                                    <Text style={styles.tagLabel}>Locations</Text>
                                    <View style={styles.tagList}>
                                        {locationTags.map(tag => (
                                            <View key={tag.id} style={[styles.tagPill, styles.locationPill]}>
                                                <Text style={styles.tagPillText}>{tag.title}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Render Category Tags */}
                            {categoryTags.length > 0 && (
                                <View style={styles.tagGroup}>
                                    <Text style={styles.tagLabel}>Categories</Text>
                                    <View style={styles.tagList}>
                                        {categoryTags.map(tag => (
                                            <View key={tag.id} style={[styles.tagPill, styles.categoryPill]}>
                                                <Text style={styles.tagPillText}>{tag.title}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}
                        </View>
                        {/* Description */}
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
                return (
                    <View style={styles.tabSection}>
                        <Text style={styles.sectionTitle}>Discussion Forum</Text>
                        
                        {/* Pill Navigation */}
                        <View style={styles.pillContainer}>
                            <Pressable 
                                style={[styles.pill, forumType === 'Public' && styles.activePill]}
                                onPress={() => setForumType('Public')}
                            >
                                <Text style={[styles.pillText, forumType === 'Public' && styles.activePillText]}>
                                    Public
                                </Text>
                            </Pressable>

                            <Pressable 
                                style={[styles.pill, forumType === 'Private' && styles.activePill]}
                                onPress={() => setForumType('Private')}
                            >
                                <Text style={[styles.pillText, forumType === 'Private' && styles.activePillText]}>
                                    Private
                                </Text>
                            </Pressable>
                        </View>

                        {/* Forum Content */}
                        <View style={styles.forumContent}>
                            {forumType === 'Public' ? (
                                <Text style={styles.bodyText}>Showing public community discussions...</Text>
                            ) : (
                                <Text style={styles.bodyText}>Showing private instructor-led discussions...</Text>
                            )}
                        </View>
                    </View>
                );

            case 'Workshops':
                return (
                    <View style={styles.tabSection}>
                        <Text style={styles.sectionTitle}>Course Workshops</Text>
                        {workshopsLoading ? (
                            <ActivityIndicator color="#0a6340" size="large" />
                        ) : (
                            <PageRenderer 
                                elements={workshops}
                                role={currentUser.role}
                                courseId={id} 
                                onRegisterWorkshop={registerWorkshop}
                                registering={registering}
                                userMarks={userMarks}
                            />
                        )}
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <View style={styles.rowContainer}>
            {/* Outlinebar */}
            <OutlineBar course={course} onSelectPage={setSelectedPage}
            progressMap={progressMap}
            editable={false} isCollapsed={isCollapsed} isLocked={isLocked}/>
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
                            <Pressable onPress={()=>navigation.goBack()} style={({pressed})=>[styles.backButton, pressed && styles.btnPressed]}>
                                <ChevronLeft size={24} color="white"/>
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
                                <Text style={styles.editorLabel}>Lesson Learning</Text>
                                <Text style={styles.pageTitle}>{selectedPage.page.title}</Text>

                                {currentUser.role === 'park_guide' && selectedPage.page?.final_quiz === true && (
                                    <View style={styles.guideInfoCard}>
                                        <View style={styles.guideInfoHeader}>
                                            <Award size={20} color="#15803d" />
                                            <Text style={styles.guideInfoTitle}>Final Assessment Requirements</Text>
                                        </View>
                                        
                                        <View style={styles.statsRow}>
                                            <View style={styles.guideStatChip}>
                                                <Text style={styles.statLabel}>Max Attempts:</Text>
                                                <Text style={styles.statValue}>{course.max_tries || selectedPage.page?.max_tries || 1}</Text>
                                            </View>
                                            <View style={styles.guideStatChip}>
                                                <Text style={styles.statLabel}>Passing Score:</Text>
                                                <Text style={styles.statValue}>{selectedPage.page?.passing_score || 80}%</Text>
                                            </View>
                                        </View>
                                        
                                        <Text style={styles.guideNotice}>
                                            You must achieve the passing score to earn your certificate and badge.
                                        </Text>
                                    </View>
                                )}
                                
                                {elementsLoading ? (
                                    <View style={styles.elementLoader}>
                                        <ActivityIndicator color="#0a6340" />
                                        <Text style={styles.loaderText}>Loading Elements...</Text>
                                    </View>
                                ) : (
                                    <PageRenderer 
                                        elements={elements}
                                        role={currentUser.role}
                                        courseId={id}
                                        onProgressUpdate={saveProgress}
                                        onRegisterWorkshop=
                                        {registerWorkshop}
                                        registering={registering}
                                        userMarks={userMarks}
                                    />
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
        gap:5,
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
        marginHorizontal:35
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
        marginBottom:20,
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
    backButton:{
        width:40,
        height:40,
        zIndex:10,
        backgroundColor:'rgba(168, 168, 168, 0.3)',
        padding:8,
        borderRadius:50,
    },
    tagSectionContainer: {
        gap: 25,
        marginTop:5
    },
    tagGroup: {
        gap: 8,
    },
    tagLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0a6340',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    tagList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tagPill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        borderWidth: 1,
    },
    locationPill: {
        backgroundColor: '#e8f5e9',
        borderColor: '#c8e6c9',
    },
    categoryPill: {
        backgroundColor: '#f1f8e9',
        borderColor: '#dcedc8',
    },
    tagPillText: {
        fontSize: 12,
        color: '#2e7d32',
        fontWeight: '600',
    },
    prereqSection: {
        backgroundColor: '#fffbeb',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fef3c7',
        marginTop: 10,
    },
    prereqItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    prereqDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#d97706',
        marginRight: 10,
    },
    prereqText: {
        fontSize: 14,
        color: '#92400e',
        fontWeight: '500',
    },
    guideInfoCard: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#e5e7eb', 
        borderRadius: 8,
        marginBottom: 25,
    },
    guideInfoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    guideInfoTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 24, 
        marginBottom: 12,
    },
    guideStatChip: {
        flexDirection: 'column',
        gap: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280', 
        fontWeight: '500',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827', 
    },
    guideNotice: {
        fontSize: 13,
        color: '#4b5563',
        lineHeight: 18,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingTop: 12,
        marginTop: 4,
    }
});

export default UserModule;