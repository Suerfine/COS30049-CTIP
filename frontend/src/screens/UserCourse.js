import { View, Text, StyleSheet, ScrollView } from 'react-native';
import CourseCard from '../components/CourseCard';
import { useUserDashboard } from '../hooks/useUserDashboard';
import { useMemo } from 'react';

const UserCourse = ({ navigation }) => {
    const { courses, progressData, userType } = useUserDashboard();

    // categorize courses
    const { inProgressCourses, completedCourses, notEnrolledCourses } = useMemo(() => {

        const inProgress = [];
        const completed = [];
        const notEnrolled = [];

        courses.forEach(course => {
            const progressObj = progressData.find(
                p => p.id === course.id
            );
            const progress = progressObj ? progressObj.progress : null;

            if (progress === null || progress === 0) {
                notEnrolled.push({ ...course, progress });
            } else if (progress === 1) {
                completed.push({ ...course, progress });
            } else {
                inProgress.push({ ...course, progress });
            }
        });

        return {
            inProgressCourses: inProgress,
            completedCourses: completed,
            notEnrolledCourses: notEnrolled
        };

    }, [courses, progressData]);

    const renderCourseList = (list, showEnroll = false) => (
        <View style={styles.cardContainer}>
            {list.map(course => (
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
                    onEnroll={
                        showEnroll
                            ? () => console.log('Enroll:', course.id)
                            : undefined
                    }
                />
            ))}
        </View>
    );
    console.log("RAW progressData:", progressData);

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Courses</Text>
            <View style={styles.sectionContainer}>
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>In Progress</Text>
                    {renderCourseList(inProgressCourses)}
                </View>

                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Completed</Text>
                    {renderCourseList(completedCourses)}
                </View>
                
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Not Enrolled</Text>
                    {renderCourseList(notEnrolledCourses, true)}
                </View>
            </View>
        </ScrollView>
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
    sectionContainer:{
        marginHorizontal: 40,
    },
    sectionCard:{
        paddingHorizontal: 30,
        paddingBottom: 30,
        marginBottom: 30,
        borderRadius: 20,
        backgroundColor: '#9ee5a375',
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)'
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginTop: 20,
        marginBottom: 20,
    },
    cardContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 20,
    },
});

export default UserCourse;