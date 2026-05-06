import { View, Text, StyleSheet, ScrollView, Pressable, ImageBackground, TextInput} from 'react-native';
import { useMemo, useState } from 'react';
import { CircleX, ListFilter, SignalZero, SlidersHorizontal, Search } from 'lucide-react-native'

// Import other hook and component
import { useUserDashboard } from '../hooks/useUserDashboard';
import { useUserCourse } from '../hooks/useUserCourse';
import NavBar from '../components/NavBar';
import SlidingTabs from '../components/SlidingTabs';
import FilterSidebar from '../components/FilterSidebar';
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
        myEnrollments,
        coursesWithStatus,
        filteredCourses, courses,
        handleEnrollment, 
        handleDrop,
        handleApply,
        removeFilter,allTagList, addTag,searchText, setSearchText, handleSearch,
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
                    {/* Search and Filter */}
                    <View style={styles.toolbar}>
                        <View style={styles.search}>
                        <Search size={18} />
                        <TextInput
                            style={styles.input}
                            value={searchText}
                            onChangeText={handleSearch}
                            placeholder="Search..."
                            placeholderTextColor="#8f8f8f"
                        />
                        </View>
                    </View>
                    <View style={styles.pillContainer}>
                        {/* Status Pill */}
                        {filters.status !== 'all' && (
                            <View style={styles.pill}>
                                <Text style={styles.pillText}>{statusLabels[filters.status]}</Text>
                                <Pressable onPress={() => removeFilter('status')}>
                                    <CircleX size={16} color="white" />
                                </Pressable>
                            </View>
                        )}

                        {/* Location Pills */}
                        {Array.isArray(filters.location) && filters.location.map((locName) => (
                            <View key={locName} style={[styles.pill, { backgroundColor: '#18704d' }]}>
                                <Text style={styles.pillText}>{locName}</Text>
                                <Pressable onPress={() => removeFilter('location', locName)}>
                                    <CircleX size={16} color="white" />
                                </Pressable>
                            </View>
                        ))}
            
                        {/* Category Pills */}
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
                        {filteredCourses.length === 0?(
                            
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>{t('No courses found')}</Text>
                            </View>
                        ) : ( filteredCourses.map(course => {
                            const numModules = course.modules ? course.modules.length : 0;
                            return(
                            <CourseCard
                                key={course.id}
                                id={course.id}
                                coverImgUrl={course.cover_img_url}
                                courseTitle={course.title}
                                numModules={numModules || 16}
                                duration={course.expected_completion_weeks}
                                expiry={course.must_complete_in_weeks}
                                userType={userType}
                                progress={course.progress}
                                // enrollment
                                enrollmentStatus={course.enrollmentStatus}
                                prerequisiteGroups={course.prerequisiteGroups || []}
                                myEnrollments={myEnrollments}
                                // handlers
                                onPress={() => navigation.navigate('ParkGuideStack', {
                                    screen: 'UserModule', 
                                    params: { 
                                        id: course.id,
                                        enrollmentStatus: course.enrollmentStatus ?? null,
                                        enrollmentId: course.enrollmentId
                                    }
                                })}
                               onEnroll={() => {
                                    const confirmed = window.confirm(`Are you sure you want to enroll in ${course.title}?`);
                                    if (confirmed) {
                                        handleEnrollment(course.id);
                                    }
                                }}
                                onDrop={() => handleDrop(course.id)}
                            />)
                        })
                    )}
                    </View>
                </View>
            </ScrollView>

            <FilterSidebar
                visible={filterVisible}
                allTagList={allTagList}
                tempFilters={tempFilters}
                setTempFilters={setTempFilters}
                onClose={() => setFilterVisible(false)}
                onApply={handleApply}
                onReset={() => {
                    const reset = { status: 'all', category: [], location: [] };
                    setTempFilters(reset);
                    setFilters(reset);
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
    search: {
        flexDirection: "row",
        gap: 7,
        borderWidth: 1,
        borderColor: "#8f8f8f",
        minWidth: 300,
        padding: 5,
        backgroundColor: "white",
        borderRadius: 15,
        alignItems: "center",
    },
    input: {
        flex: 1,
        paddingVertical: 2,
        outlineStyle: "none",
  },
  toolbar: {
    justifyContent: "space-between",
    flexDirection: "row",
    marginHorizontal:60,
    marginBottom:10
  },
});

export default UserCourse;