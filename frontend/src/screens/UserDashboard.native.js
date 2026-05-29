import React, {useMemo} from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image, ImageBackground, StatusBar, Dimensions, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import Checkbox from 'expo-checkbox';
import { ClockFading, Phone, Mail} from 'lucide-react-native';
import {LinearGradient} from 'expo-linear-gradient';

// Import from other hook and components
import CourseCard from '../components/CourseCard.js';
import { useUserDashboard } from '../hooks/useUserDashboard';
import { useUserCourse } from '../hooks/useUserCourse.js';
import SlidingTabs from '../components/SlidingTabs.js';
import { formatDate } from '../utils/formatDate.js';
import { useTranslation } from 'react-i18next';
import { useUserProfile } from '../hooks/useUserProfile.js';

const UserDashboard=({navigation})=>{
    const {
        courses, 
        todos, 
        userType, 
        progressData, 
        loading, 
        setTodos, 
        user, 
        selectedDate, setSelectedDate,
        filter, setFilter,
        courseFilter, setCourseFilter,
        currentDate, setCurrentDate,
        isExpanded, setIsExpanded,
        weekDates, getDaysInMonth, filteredTodos,
        toggleTodo, hasPendingTodoOnDate,formatLocalDate,
        weekLabels,todoTab, courseTab, categories
    } = useUserDashboard();
    const { profileImage } = useUserProfile();
    const { inProgressCourses, completedCourses } = useUserCourse({ progressData });

    // dummy in progress course to test navigation
    // const { inProgressCourses: realInProgress, completedCourses } = useUserCourse();
    // const MOCK_IN_PROGRESS = [
    //   {
    //     id: 1,
    //     title: "Mock Course: Wildlife Safety",
    //     cover_img_url: "https://picsum.photos/seed/course/400/200",
    //     module_count: 5,
    //     expected_completion_weeks: 4,
    //     must_complete_in_weeks: 8,
    //     progress: 0.45,
    //     enrollmentStatus: "in_progress",
    //     enrollmentId: 1001,
    //     is_enrollable: false,
    //   },
    // ];
    // const inProgressCourses = __DEV__ ? MOCK_IN_PROGRESS : realInProgress;
    const {t, i18n}=useTranslation();
    const { width } = useWindowDimensions();
    const isMobile = width < 1024;
    const isSmallMobile = width < 700;

    const cardStyles = useMemo(() => {
        if (Platform.OS !== 'web') {
            return { width: '100%', gap: 0 };
        }

        let columns = 3;
        if (width < 600) columns = 1;
        else if (width < 900) columns = 2;

        const gapPercent = 2; 
        const calculatedWidth = (100 - (gapPercent * (columns - 1))) / columns;

        return {
            width: `${calculatedWidth}%`,
            gap: `${gapPercent}%`
        };
    }, [width]);

    return(
        <SafeAreaView style={styles.container} edges={['left','right']}>
            <StatusBar barStyle="dark-content"/>
            <ScrollView showsVerticalScrollIndicator={false}>
                <ImageBackground
                    source={require('../../assets/darkgreen_bg.jpeg')}
                    style={styles.infoCard}
                >
                    <LinearGradient pointerEvents="none" colors={['transparent', 'rgba(242, 242, 242, 0.2)', '#f2f2f2']} 
                    style={StyleSheet.absoluteFillObject}/>
                    <View style={styles.infoTop}>
                        <View style={styles.pfpWrapper}>
                        {profileImage ? (
                            <Image source={{ uri: profileImage }} style={styles.profilePic}/>
                            ) : (
                                <View style={styles.pfpPlaceholder}>
                                    <Text style={styles.pfpInitials}>
                                        {user?.firstname ? user?.firstname[0].toUpperCase() : '?'}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <View>
                            <Text style={styles.welcomeText}>{t('welcome')}, {user?.firstname}</Text>
                            <Text style={styles.idBadge}>ID: {user?.id}</Text>
                        </View>
                    </View>
                    <View style={styles.detailRow}>
                        <ClockFading size={16} color='#0a2400fe' style={styles.icon}/>
                        <Text style={styles.subText}>
                            {t('joined')} {t('since')} {formatDate(user?.created_at,false)}
                        </Text>
                    </View>
                    <View style={styles.infoDetails}>
                         <View style={styles.detailRow}>
                            <Phone size={16} color='#0a2400fe' style={styles.icon}/>
                            <Text style={styles.subText}>
                                {user?.tel}
                            </Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Mail size={16} color='#0a2400fe' style={styles.icon}/>
                            <Text style={styles.subText}>
                                {user?.personal_email}
                            </Text>
                        </View>
                    </View>
                </ImageBackground>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{t('my courses')} </Text>

                    <SlidingTabs tabs={courseTab} activeTab={courseFilter} onTabChange={(id)=>setCourseFilter(id)}/>

                    {/* in progress courses */}
                    <View style={styles.cardContainer}>
                        {courseFilter === 'in progress' && (
                            inProgressCourses.length > 0 ? (
                                inProgressCourses.map(course => (
                                    <View key={course.id} style={[styles.cardWrapper, { flexBasis: cardStyles.width, minWidth: cardStyles.width }]}>
                                        <CourseCard
                                            key={course.id}
                                            id={course.id}
                                            coverImgUrl={course.cover_img_url}
                                            courseTitle={course.title}
                                            numModules={course.module_count ?? 0}
                                            duration={course.expected_completion_weeks}
                                            expiry={course.must_complete_in_weeks}
                                            progress={course.progress} // This is now the real weighted score %
                                            enrollmentStatus={course.enrollmentStatus}
                                            isEnrollable={course.is_enrollable}
                                            userType={userType}
                                            onPress={() =>
                                                    navigation.navigate('UserModule', {
                                                        id: course.id,
                                                        enrollmentStatus:
                                                        course.enrollmentStatus ?? null,
                                                        enrollmentId: course.enrollmentId
                                                    })
                                                }
                                            style={{ width: '100%' }}
                                        />
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.emptyText}>No courses in progress.</Text>
                            )
                        )}

                        {/* completed courses */}
                        {courseFilter === 'completed' && (
                            completedCourses.length > 0 ? (
                                completedCourses.map(course => {
                                    return (
                                        <View key={course.id} style={[styles.cardWrapper, { flexBasis: cardStyles.width, minWidth: cardStyles.width }]}>
                                            <CourseCard
                                                key={course.id}
                                                id={course.id}
                                                coverImgUrl={course.cover_img_url}
                                                courseTitle={course.title}
                                                numModules={course.module_count ?? 0}
                                                duration={course.expected_completion_weeks}
                                                expiry={course.must_complete_in_weeks}
                                                progress={course.progress}
                                                enrollmentStatus={course.enrollmentStatus}
                                                isEnrollable={course.is_enrollable}
                                                userType={userType}
                                                onPress={() =>
                                                    navigation.navigate('UserModule', {
                                                        id: course.id,
                                                        enrollmentStatus:
                                                        course.enrollmentStatus ?? null,
                                                        enrollmentId: course.enrollmentId
                                                    })
                                                }
                                                style={{ width: '100%' }}
                                            />
                                        </View>
                                    );
                                })
                            ) : (
                                <Text style={styles.emptyText}>No completed courses.</Text>
                            )
                        )}
                    </View>
                </View>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        {t('explore')} {t('categories')}
                    </Text>
                    <View style={styles.tagContainer}>
                        {categories.length > 0 ? (
                            categories
                                .filter(tag => tag.type === 'category') 
                                .map((item) => (
                                    <Pressable 
                                        key={item.id} 
                                        style={styles.categoryTag}
                                        onPress={() => navigation.navigate('ParkGuideMobileRoot', {
                                            screen: 'Courses', 
                                            params: { 
                                                filterCategory: item.title
                                            }
                                        })}
                                    >
                                        <Text style={styles.tagText}>{item.title}</Text>
                                    </Pressable>
                                ))
                        ) : (
                            <Text style={styles.emptyText}>{t('No categories found.')}</Text>
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles=StyleSheet.create({
    container:{
        flex:1,
    },
    infoCard:{
        padding:20,
        marginBottom:20,
        elevation: 5,
    },
    pfpWrapper:{
        marginEnd: 12,
    },
    profilePic:{
        width: 60,
        height: 60,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: 'white',
    },
    pfpPlaceholder:{
        width: 60,
        height: 60,
        borderRadius: 60,
        backgroundColor: '#2f6618fe',
        borderWidth: 3,
        borderColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pfpInitials:{
        fontSize: 20,
        fontWeight: '700',
        color: 'white',
    },
    welcomeText:{
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    infoTop:{
        flexDirection:'row',
        alignItems:'center',
        marginBottom:15
    },
    idBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginTop: 4,
        color: '#fff',
        fontSize: 13,
        fontFamily: 'monospace',
    },
    infoDetails:{
        flexDirection:'row',
        gap:15,
    },
    detailRow:{
        flexDirection:'row',
        alignItems:'center',
        marginTop:10
    },
    subText:{
        color:'#0a2400fe',
        fontSize:12,
        marginLeft:5,
        fontWeight:600
    },
    sectionHeader:{
        marginBottom:15,
        paddingHorizontal:10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom:5
    },
    cardContainer:{
        flexDirection:'row',
        flexWrap:'wrap',
        justifyContent:'flex-start',
        gap:10,
        marginTop:15
    },
    tagContainer: {
        flexDirection:'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 12,
        zIndex: 10,
        elevation: 10,
    },
    categoryTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0a6340',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    tagText: {
        fontSize: 12,
        color: 'white',
        fontWeight: '500',
    },
    cardWrapper: {
        flexGrow: 0, 
        flexShrink: 1,
        display: 'flex',
    },
})

export default UserDashboard;