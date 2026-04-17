import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import CourseCard from '../components/CourseCard';
import { useUserDashboard } from '../hooks/useUserDashboard';
import { useMemo } from 'react';
import ConfirmEnroll from '../components/ConfirmEnroll';
import { useState } from 'react';
import { ListFilter, SignalZero } from 'lucide-react-native'
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
                <Text style={styles.title}>Courses</Text>
                <View style={styles.courseContainer}>
                    <Pressable
                        onPress={() => {
                            setTempFilters(filters);
                            setFilterVisible(true);
                        }}
                    >
                        <View style={styles.filterBtn}>
                            <Text style={styles.filterText}>Filter</Text>
                            <ListFilter size={18} />
                        </View>
                    </Pressable>

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
    },
    title: {
        marginHorizontal: 40,
        marginTop: 34,
        marginBottom: 30,
        fontSize: 30,
    },
    courseContainer:{
        marginHorizontal: 40,
    },
    cardContainer: {
        flexDirection: 'row',
        gap: 80,
        marginBottom: 20,
    },
    filterBtn:{
        borderRadius: 10,
        color: "white",
        backgroundColor: "#2f6618fe",
        width: 90,
        marginStart: 5,
        marginBottom: 14,
        padding: 10,
        fontSize: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    filterText:{
        fontSize: 16,
        color: "white",
        alignItems: 'center',
        justifyContent: 'center',
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