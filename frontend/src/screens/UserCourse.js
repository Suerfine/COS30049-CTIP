import { View, Text, StyleSheet, ScrollView, Pressable, ImageBackground, TextInput, Platform, useWindowDimensions, Modal } from 'react-native';
import { useMemo, useState, useEffect } from 'react';
import { CircleX, ListFilter, SignalZero, SlidersHorizontal, Search } from 'lucide-react-native'
import { useRoute } from '@react-navigation/native';

// Import other hook and component
import { useUserDashboard } from '../hooks/useUserDashboard';
import { useUserCourse } from '../hooks/useUserCourse';
import NavBar from '../components/NavBar';
import SlidingTabs from '../components/SlidingTabs';
import FilterSidebar from '../components/FilterSidebar';
import CourseCard from '../components/CourseCard';
import { useTranslation } from 'react-i18next';

const UserCourse = ({ navigation }) => {
    const { progressData, userType  } = useUserDashboard();
    const { t, i18n }=useTranslation();
    const route = useRoute();
    const filterCategory = route.params?.filterCategory;
    
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
        handleEnrollment, 
        getUnfulfilledPrerequisites,
        handleApply,
        removeFilter,allTagList, addTag,
        searchText, setSearchText,getPreviousEnrollments, openHistory,historyModalVisible,selectedHistory,setHistoryModalVisible
    }=useUserCourse({progressData});

    console.log(getPreviousEnrollments(14));

    // sync parameter with filter from UserDashboard Explore Categories section
    useEffect(() => {
        if (filterCategory) {
            const newFilter = {
                ...filters,
                category: [filterCategory]
            };

            setFilters(newFilter);
            setTempFilters(newFilter);
        }
    }, [filterCategory]);

    const { width } = useWindowDimensions();
    const cardStyles = useMemo(() => {
        if (Platform.OS !== 'web') {
            return { width: '100%', gap: 0 };
        }

        let columns = 4;
        if (width < 600) columns = 1;
        else if (width < 900) columns = 2;
        else if (width < 1200) columns = 3;

        const gapPercent = 2; 
        const calculatedWidth = (100 - (gapPercent * (columns - 1))) / columns;

        return {
            width: `${calculatedWidth}%`,
            gap: `${gapPercent}%`
        };
    }, [width]);

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
                        <View style={styles.toolbar}>
                            <View style={styles.search}>
                            <Search size={18} />
                            <TextInput
                                style={styles.input}
                                value={searchText}
                                onChangeText={setSearchText}
                                placeholder="Search..."
                                placeholderTextColor="#8f8f8f"
                            />
                            </View>

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
                    <View style={[styles.cardContainer, { columnGap: cardStyles.gap }]}>
                        {filteredCourses.length === 0?(
                            
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>{t('No courses found')}</Text>
                            </View>
                        ) : ( filteredCourses.map(course => {
                            const numModules = course.module_count ? course.module_count : 0;
                            return(
                            <View key={course.id} style={[styles.cardWrapper, { flexBasis: cardStyles.width, minWidth: cardStyles.width }]}>
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
                                    previousEnrollments={getPreviousEnrollments(course.id)}
                                    onViewHistory={() =>
                                    openHistory(getPreviousEnrollments(course.id))
                                    }
                                    isEnrollable={course.is_enrollable} 
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
                                        console.log("onEnroll fired, is_enrollable:", course.is_enrollable);
                                        console.log("getUnfulfilledPrerequisites:", getUnfulfilledPrerequisites); // should be a function, not undefined
                                    if (!course.is_enrollable) {
                                        const unfulfilled = getUnfulfilledPrerequisites(course);
                                        console.log("unfulfilled result:", unfulfilled);
                                        const prereqList = unfulfilled.length > 0
                                        ? unfulfilled.join(", ")
                                        : "Unknown prerequisite(s)";
                                        window.alert(`The following prerequisite(s) has not been fulfilled: ${prereqList}`);
                                        return;
                                    }
                                    const confirmed = window.confirm(`Are you sure you want to enroll in ${course.title}?`);
                                    if (confirmed) handleEnrollment(course.id);
                                    }}
                                    style={{ width: '100%' }}
                                />
                                {/* History Modal */}
                                <Modal visible={historyModalVisible} transparent animationType="fade">
                                    <View style={styles.modalOverlay}>
                                    <View style={styles.modalContent}>
                                        <Text style={styles.modalTitle}>Enrollment History</Text>
                                        {selectedHistory.map((item, index) => (
                                        <View key={index} style={styles.historyRow}>
                                            <Text style={styles.historyDate}>Enrolled: {new Date(item.created_at).toLocaleDateString()}</Text>
                                            <Text style={[styles.historyStatus, { color: item.status === 'failed' ? 'red' : 'orange' }]}>
                                            Status: {item.status.toUpperCase()}
                                            </Text>
                                        </View>
                                        ))}
                                        <Pressable onPress={() => setHistoryModalVisible(false)} style={styles.closeBtn}>
                                        <Text style={{color: 'white'}}>Close</Text>
                                        </Pressable>
                                    </View>
                                    </View>
                                </Modal>
                            </View>)
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
        marginVertical: 20,
        marginHorizontal: Platform.OS === 'web' ? 60 : 15,
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
        flexWrap: 'wrap',
        marginHorizontal: Platform.OS === 'web' ? 60 : 15, 
        justifyContent: 'flex-start',
        rowGap: 30,      
        marginBottom: 20,
        alignItems: 'stretch',
    },
    cardWrapper: {
        flexGrow: 0, 
        flexShrink: 1,
        display: 'flex',
    },
    filterContainer:{
        flexDirection:'row',
        marginBottom:10,
        alignItems:'center',
        justifyContent:'space-between',
        borderBottomColor:'#42424255',
        borderBottomWidth:1,
        marginHorizontal:60,
        paddingBottom:5
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
        minWidth: 200,
        padding: 3,
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
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        width: Platform.OS === 'web' ? 450 : '90%',
        borderRadius: 16,
        padding: 24,
        maxHeight: '80%',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0a6340',
        marginBottom: 20,
        textAlign: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingBottom: 12,
    },
    historyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    historyDate: {
        fontSize: 14,
        color: '#475569',
        fontWeight: '500',
    },
    historyStatus: {
        fontSize: 12,
        fontWeight: 'bold',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        textTransform: 'uppercase',
        overflow: 'hidden',
    },
    closeBtn: {
        marginTop: 25,
        backgroundColor: '#0a6340',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
});

export default UserCourse;