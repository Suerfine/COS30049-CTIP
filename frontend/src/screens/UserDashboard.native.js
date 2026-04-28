import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image, ImageBackground, StatusBar } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import Checkbox from 'expo-checkbox';
import { ClockFading, Phone, Mail} from 'lucide-react-native';
import {LinearGradient} from 'expo-linear-gradient';

// Import from other hook and components
import CourseCard from '../components/CourseCard.js';
import { useUserDashboard } from '../hooks/useUserDashboard';
import SlidingTabs from '../components/SlidingTabs.js';

const UserDashboard=({navigation})=>{
    const {
        courses, 
        todos, 
        userType, 
        progressData, 
        loading, 
        setTodos, 
        user, 
        account,
        selectedDate, setSelectedDate,
        filter, setFilter,
        courseFilter, setCourseFilter,
        currentDate, setCurrentDate,
        isExpanded, setIsExpanded,
        weekDates, getDaysInMonth, filteredTodos, inProgressCourses,
        toggleTodo, hasPendingTodoOnDate,
        weekLabels,todoTab, courseTab, categories
    } = useUserDashboard();

    return(
        <SafeAreaView style={styles.container} edges={['top','left','right']}>
            <StatusBar barStyle="dark-content"/>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyles={styles.scrollContent}>
                <ImageBackground
                    source={require('../../assets/darkgreen_bg.jpeg')}
                    style={styles.infoCard}
                >
                    <LinearGradient colors={['transparent', 'rgba(242, 242, 242, 0.2)', '#f2f2f2']} 
                    style={StyleSheet.absoluteFillObject}/>
                    <View style={styles.infoTop}>
                        <Image source={{ uri: user?.profileImage }} style={styles.profilePic}/>
                        <View>
                            <Text style={styles.welcomeText}>Welcome, {user?.fname}</Text>
                            <Text style={styles.idBadge}>ID: {user?.id}</Text>
                        </View>
                    </View>
                    <View style={styles.detailRow}>
                        <ClockFading size={16} color='#0a2400fe' style={styles.icon}/>
                        <Text style={styles.subText}>
                            Joined since {account?.joinedDate}
                        </Text>
                    </View>
                    <View style={styles.infoDetails}>
                         <View style={styles.detailRow}>
                            <Phone size={16} color='#0a2400fe' style={styles.icon}/>
                            <Text style={styles.subText}>
                                {user?.telefon}
                            </Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Mail size={16} color='#0a2400fe' style={styles.icon}/>
                            <Text style={styles.subText}>
                                {user?.email}
                            </Text>
                        </View>
                    </View>
                </ImageBackground>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>My Courses</Text>
                    <SlidingTabs tabs={courseTab} activeTab={courseFilter} onTabChange={(id)=>setCourseFilter(id)}/>

                    <View style={styles.cardContainer}>
                        {courseFilter==='in progress' &&inProgressCourses.map(course => {
                            const courseProgress = progressData.find(p => p.courseId === course.id);
                            const numModules = course.modules ? course.modules.length : 0;

                            return (
                                <CourseCard
                                    key={course.id}
                                    id={course.id}
                                    imagePath={{ uri: course.image }}
                                    courseTitle={course.courseTitle}
                                    numModules={numModules}
                                    duration={course.duration}
                                    expiry={course.expiryDate}
                                    progress={courseProgress?.progress}
                                    userType={userType}
                                    onPress={() => navigation.navigate('User Module', { id: course.id })}
                                />
                            );
                        })}
                    </View>
                </View>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        Explore Categories
                    </Text>
                    <View style={styles.tagContainer}>
                        {categories.map((item)=>(
                            <Pressable key={item.id} style={styles.categoryTag} >
                                <Text style={styles.tagText}>{item.name}</Text>
                            </Pressable>
                        ))}
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
    scrollContent:{
        padding:15,
    },
    infoCard:{
        padding:20,
        marginBottom:20,
        elevation: 5,
    },
    profilePic: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight:15,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.5)',
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
})

export default UserDashboard;