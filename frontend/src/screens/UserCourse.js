import { View, Text, StyleSheet, ScrollView, Pressable, ImageBackground } from 'react-native';
import CourseCard from '../components/CourseCard';
import { useUserDashboard } from '../hooks/useUserDashboard';
import { useMemo } from 'react';
import ConfirmEnroll from '../components/ConfirmEnroll';
import { useState } from 'react';
import { ListFilter, SignalZero, SlidersHorizontal } from 'lucide-react-native'
import FilterSidebar from '../components/FilterSidebar';

const UserCourse = ({ navigation }) => {
    const { courses, progressData, userType } = useUserDashboard();
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [filterVisible, setFilterVisible] = useState(false);

    const [filters, setFilters] = useState({
        level: 'all',
        status: 'all',
    });

    const [tempFilters, setTempFilters] = useState(filters);

    const coursesWithStatus = useMemo(() => {
        return courses.map(course => {
            const progressObj = progressData.find(
                p => p.courseId === course.id
            );

            const progress = progressObj ? progressObj.progress : null;

            let status = 'notEnrolled';
            if (typeof progress === 'number') {
                if (progress >= 1) status = 'completed';
                else if (progress > 0) status = 'inProgress';
            }

            return {
                ...course,
                progress,
                status,
            };
        });
    }, [courses, progressData]);

    // filter by level/status
    const filteredCourses = useMemo(() => {
        if (!coursesWithStatus) return [];
        return coursesWithStatus.filter(course => {
            const matchLevel =
                filters.level === 'all' ||
                course.level?.trim().toLowerCase() === filters.level.toLowerCase();

            const matchStatus =
                filters.status === 'all' || course.status === filters.status;

            return matchLevel && matchStatus;
        });
    }, [coursesWithStatus, filters]);

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
                    <View style={styles.cardContainer}>
                        {filteredCourses.length === 0?(
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No courses found</Text>
                            </View>
                        ) : ( filteredCourses.map(course => (
                            <CourseCard
                                key={course.id}
                                id={course.id}
                                imagePath={{ uri: course.image }}
                                courseTitle={course.courseTitle}
                                numModules={course.modules ? course.modules.length : 0}
                                duration={course.duration}
                                expiry={course.expiryDate}
                                progress={course.progress}
                                userType={userType}
                                onPress={() =>
                                    navigation.navigate('User Module', { id: course.id })
                                }
                                onEnroll={() => {
                                    setSelectedCourse(course);
                                    setModalVisible(true);
                                }}
                            />
                        ))
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
        marginHorizontal: 30,
    },
    courseContainer: {
        marginTop: 20,
        marginBottom: 20,
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
    },
    filterContainer:{
        flexDirection:'row',
        justifyContent:'flex-end',
        marginBottom:10,
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
});

export default UserCourse;