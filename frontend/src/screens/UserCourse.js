import { View, Text, StyleSheet, ScrollView, Pressable, ImageBackground } from 'react-native';
import { useMemo, useState } from 'react';
import { CircleX, ListFilter, SignalZero, SlidersHorizontal } from 'lucide-react-native'

// Import other hook and component
import { useUserDashboard } from '../hooks/useUserDashboard';
import { useUserCourse } from '../hooks/useUserCourse';
import NavBar from '../components/NavBar';
import SlidingTabs from '../components/SlidingTabs';
import FilterSidebar from '../components/FilterSidebar';
import ConfirmEnroll from '../components/ConfirmEnroll';
import CourseCard from '../components/CourseCard';

const UserCourse = ({ navigation }) => {
    const { progressData, userType  } = useUserDashboard();
    const {selectedCourse, setSelectedCourse,
        modalVisible, setModalVisible,
        filterVisible, setFilterVisible,
        allcourseFilter, setAllCourseFilter,
        filters, setFilters,
        tempFilters, setTempFilters,
        statusLabels,
        tabs,
        coursesWithStatus,
        filteredCourses, courses,
        removeFilter
    }=useUserCourse();

    return (
        <View style={{ flex: 1 }}>
            <ScrollView style={styles.container}>
                <View style={styles.courseContainer}>
                    {/* Background Image */}
                    <ImageBackground 
                        source={require('../../assets/forest.png')}
                        style={styles.backgroundImage}
                    >
                        <View style={styles.courseHeader}>
                            <View>
                                <Text style={styles.description}>Here you can find all courses</Text>
                                <Text style={styles.title}>All Courses</Text>
                            </View>
                        </View>
                    </ImageBackground>
                </View>
                <View>
                    <View style={styles.filterContainer}>
                        <SlidingTabs tabs={tabs} activeTab={allcourseFilter} onTabChange={(id)=>setAllCourseFilter(id)}/>
                        <Pressable 
                            onPress={() => {
                                setTempFilters(filters);
                                setFilterVisible(true);
                            }}
                            style={({ hovered }) => [
                                styles.filter,
                                hovered && styles.filterHover, 
                            ]}
                        >
                            <SlidersHorizontal/>
                        </Pressable>
                    </View>
                    <View style={styles.pillContainer}>
                        {filters.status !== 'all' && (
                            <View style={styles.pill}>
                                <Text style={styles.pillText}>{statusLabels[filters.status]}</Text>
                                <Pressable onPress={() => removeFilter('status')}>
                                    <CircleX size={16} color="white" />
                                </Pressable>
                            </View>
                        )}

                        {Array.isArray(filters.category) && filters.category.map((catName) => (
                            <View key={catName} style={styles.pill}>
                                <Text style={styles.pillText}>{catName}</Text>
                                <Pressable onPress={() => removeFilter('category', catName)}>
                                    <CircleX size={16} color="white" />
                                </Pressable>
                            </View>
                        ))}
                    </View>
                    <View style={styles.cardContainer}>
                        {courses.length === 0?(
                            
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No courses found</Text>
                            </View>
                        ) : ( courses.map(course => {
                            const numModules = course.modules ? course.modules.length : 0;
                            return(
                            <CourseCard
                                key={course.id}
                                id={course.id}
                                imagePath={{ uri: course.image }}
                                courseTitle={course.title}
                                numModules={numModules || 16}
                                duration={course.expected_completion_weeks}
                                expiry={course.must_complete_in_weeks}
                                userType={userType}
                                onPress={() => navigation.navigate('ParkGuideStack', {
                                    screen: 'UserModule', 
                                    params: { id: course.id }
                                })}
                                onEnroll={() => {
                                    setSelectedCourse(course);
                                    setModalVisible(true);
                                }}
                            />)
                        })
                    )}
                    </View>
                </View>
            </ScrollView>

            <FilterSidebar
                visible={filterVisible}
                tempFilters={tempFilters}
                setTempFilters={setTempFilters}
                onClose={() => setFilterVisible(false)}
                onApply={() => {
                    setFilters(tempFilters);
                    setFilterVisible(false);
                }}
                onReset={() => {
                    const reset = { level: 'all', status: 'all' };
                    setTempFilters(reset);
                    setFilters(reset);
                }}
            />

            <ConfirmEnroll
                visible={modalVisible}
                course={selectedCourse}
                onClose={() => setModalVisible(false)}
                onConfirm={() => {
                    console.log("Enrolled:", selectedCourse.id);

                    // call api

                    setModalVisible(false);
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    courseContainer: {
        marginTop: 20,
        marginBottom: 20,
        marginHorizontal:60
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        color:'white'
    },
    description: {
        fontSize: 14,
        lineHeight: 24,
        color:'white',
    },
    courseHeader:{
        paddingHorizontal:40,
        paddingVertical:30,
        borderRadius:20,
        flexDirection:'row',
        justifyContent:'space-between',
        userSelect:'none',
    },
    backgroundImage:{
        width:'100%',
        borderRadius:20,
        overflow:'hidden',
        resizeMode:'fill',
        marginTop:10,
    },
    cardContainer: {
        flexDirection: 'row',
        gap: 80,
        marginBottom: 20,
        flexWrap:'wrap',
        marginHorizontal:60,
    },
    filterContainer:{
        flexDirection:'row',
        marginBottom:10,
        justifyContent:'space-between',
        borderBottomColor:'#42424255',
        borderBottomWidth:1,
        marginHorizontal:60,
    },
    filter:{
        flexDirection:'row',
        paddingVertical:5,
        paddingRight:10,
        borderRadius:5,
    },
    filterHover:{
        color:'#efab21'
    },
    emptyContainer:{
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },

    emptyText:{
        fontSize: 20,
        color: '#666',
    },
    pillContainer:{
        flexDirection:'row',
        flexWrap:'wrap',
        gap:8,
        marginBottom:15,
        marginTop:5,
        marginHorizontal:60
    },
    pill:{
        flexDirection:'row',
        alignItems:'center',
        backgroundColor: '#0a6340',
        paddingHorizontal:12,
        paddingVertical:8,
        borderRadius:20,
    },
    pillText:{
        fontSize:14,
        color:"white",
        marginRight:6,
        fontWeight:'500'
    },
});

export default UserCourse;