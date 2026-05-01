import { View, Text, StyleSheet, ScrollView, Pressable, ImageBackground, StatusBar } from 'react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CircleX, ListFilter, SignalZero, ChevronLeft} from 'lucide-react-native'
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';

// Import other hook and component
import { useUserDashboard } from '../hooks/useUserDashboard';
import { useUserCourse } from '../hooks/useUserCourse';
import ConfirmEnroll from '../components/ConfirmEnroll';
import SlidingTabs from '../components/SlidingTabs';
import FilterSidebar from '../components/FilterSidebar';
import CourseCard from '../components/CourseCard';
import { useTranslation } from 'react-i18next';

const UserCourse=({navigation})=>{
    const {t, i18n}=useTranslation();
    const { courses, progressData, userType  } = useUserDashboard();
    const {selectedCourse, setSelectedCourse,
        modalVisible, setModalVisible,
        filterVisible, setFilterVisible,
        allcourseFilter, setAllCourseFilter,
        filters, setFilters,
        tempFilters, setTempFilters,
        statusLabels,
        tabs,
        coursesWithStatus,
        filteredCourses,
        removeFilter
    }=useUserCourse();

    const handleFilterPass=useCallback(()=>{
        setTempFilters(filters);
        setFilterVisible(true);
    },[filters]);

    useEffect(()=>{
        navigation.setParams({
            openFilters:handleFilterPass
        });
    },[navigation, handleFilterPass]);

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            <StatusBar barStyle="dark-content"/>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.courseContainer}>
                    {/* Background Image */}
                    <ImageBackground 
                        source={require('../../assets/forest.png')}
                        style={styles.backgroundImage}
                    >
                        <Pressable onPress={()=>navigation.goBack()} style={styles.backButton}>
                            <ChevronLeft size={24} color="white"/>
                        </Pressable>
                        <View style={styles.courseHeader}>
                            <View>
                                <Text style={styles.description}>{t('here you can find all courses')}</Text>
                                <Text style={styles.title}>{t('all courses')}</Text>
                            </View>
                        </View>
                    </ImageBackground>
                </View>
                <View style={styles.filterContainer}>
                    <SlidingTabs tabs={tabs} activeTab={allcourseFilter} onTabChange={(id)=>setAllCourseFilter(id)}/>
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
                    {filteredCourses.length === 0?(
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>{t('no courses found')}</Text>
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
        </SafeAreaView>
    );
};

const styles=StyleSheet.create({
    container: {
        flex: 1,
        marginHorizontal: 10,
    },
    courseContainer: {
        marginTop: 20,
        marginBottom: 20,
    },
    backgroundImage:{
        width:'100%',
        borderRadius:15,
        overflow:'hidden',
        resizeMode:'fill',
        marginTop:10,
        flexDirection:'row',
        alignItems:'center',
    },
    courseHeader:{
        paddingHorizontal:15,
        paddingVertical:20,
        borderRadius:20,
        flexDirection:'row',
        justifyContent:'space-between',
        userSelect:'none',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
        color:'white'
    },
    description: {
        fontSize: 12,
        lineHeight: 24,
        color:'white',
    },
    backButton:{
        width:40,
        height:40,
        zIndex:10,
        backgroundColor:'rgba(255, 255, 255, 0.3)',
        padding:8,
        borderRadius:50,
        marginLeft:10,
    },
    cardContainer: {
        flexDirection: 'row',
        flexWrap:'wrap',
        justifyContent:'flex-start',
        gap:11,
    },
    pillContainer:{
        flexDirection:'row',
        flexWrap:'wrap',
        gap:8,
        marginBottom:15,
        marginTop:5
    },
    pill:{
        flexDirection:'row',
        alignItems:'center',
        backgroundColor: '#0a6340',
        paddingHorizontal:12,
        paddingVertical:8,
        borderRadius:30,
        marginTop:10
    },
    pillText:{
        fontSize:14,
        color:"white",
        marginRight:6,
        fontWeight:'500'
    },
    filterContainer:{
        borderBottomColor:'#42424255',
        borderBottomWidth:1
    }
});

export default UserCourse;