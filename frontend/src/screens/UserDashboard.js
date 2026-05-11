import {useState, useEffect, useMemo} from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image, ImageBackground, Dimensions, Platform, useWindowDimensions } from 'react-native';
import { ListPlus, ChevronRight, ChevronLeft, ClockFading, Phone, Mail, ChevronsUpDown, ChevronsDownUp} from 'lucide-react-native';
import Checkbox from 'expo-checkbox';
import {Animated} from 'react-native';
import { formatDate } from '../utils/formatDate.js';

// Import from other hook and components
import CourseCard from '../components/CourseCard.js';
import { useUserDashboard } from '../hooks/useUserDashboard';
import { useUserCourse } from '../hooks/useUserCourse.js';
import SlidingTabs from '../components/SlidingTabs.js';
import AddTodo from '../components/AddTodo.js';
import ModalLayout from '../components/ModalLayout.js';
import TaskDetail from '../components/TaskDetail.js';
import { useTranslation } from 'react-i18next';

const UserDashboard = ({ navigation }) => {
    const {
        courses, 
        events, 
        userType, 
        progressData, 
        loading, 
        setEvents, 
        user, 
        selectedDate, setSelectedDate,
        filter, setFilter,
        courseFilter, setCourseFilter,
        currentDate, setCurrentDate,
        isExpanded, setIsExpanded,
        weekDates, getDaysInMonth, filteredEvents,
        refreshData,
        toggleEvent,
        hasPendingEventOnDate,formatLocalDate,
        weekLabels,eventTab, courseTab, categories,
    } = useUserDashboard();

    const { width } = useWindowDimensions();
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

    const { inProgressCourses, completedCourses, loading: coursesLoading } = useUserCourse();
    const [showModal, setShowModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const openEdit = (event) => { setSelectedTask(event); setShowModal(true); };
    const {t, i18n}=useTranslation();

    return(
        <ScrollView style={{ flex: 1 }}>
            <View style={styles.topRow}>
                {/* Left side of screen */}
                <View style={styles.leftScreen}>
                        <View style={styles.leftColumn}>
                            {/* info card */}
                            <View style={styles.infoContainer}>
                                <ImageBackground
                                    source={require('../../assets/darkgreen_bg.jpeg')}
                                    style={styles.infoCard}
                                >
                                    {/* info card left side */}
                                    <View style={styles.infoLeft}>
                                        <Text style={styles.welcomeText}>
                                            Welcome, {user?.firstname}
                                        </Text>

                                        <View style={styles.row}>
                                            <ClockFading size={16} style={styles.icon}/>
                                            <Text style={styles.subText}>
                                                Joined since {formatDate(user?.created_at,false)}
                                            </Text>
                                        </View>

                                        <View style={styles.infoRow1}>
                                            <View style={styles.row}>
                                                <Phone size={16} style={styles.icon}/>
                                                <Text style={styles.subText}>
                                                    {user?.tel}
                                                </Text>
                                            </View>
                                            
                                            <View style={styles.row}>
                                                <Mail size={16} style={styles.icon}/>
                                                <Text style={styles.subText}>
                                                    {user?.personal_email}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* info card right side */}
                                    <View style={styles.infoRight}>
                                        {user?.profileImage ? (
                                        <Image source={{ uri: user.profileImage }} style={styles.pfp}/>
                                        ) : (
                                            <View style={styles.pfpPlaceholder}>
                                                <Text style={styles.pfpInitials}>
                                                    {user?.firstname ? user?.firstname[0].toUpperCase() : '?'}
                                                </Text>
                                            </View>
                                        )}

                                        <Text style={styles.idBadge}>
                                            ID: {user?.id}
                                        </Text>
                                    </View>
                                </ImageBackground>
                            </View>
                            <Text style={styles.sectionTitle}>My Courses</Text>
                            <SlidingTabs tabs={courseTab} activeTab={courseFilter} onTabChange={(id)=>setCourseFilter(id)}/>
                            <View style={[styles.cardContainer, { columnGap: cardStyles.gap }]}>
                                {coursesLoading && <Text>Updating progress...</Text>}

                                {/* Render In Progress Tab */}
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
                                                    onPress={() => navigation.navigate('ParkGuideStack', {
                                                        screen: 'UserModule', 
                                                        params: { 
                                                            id: course.id,
                                                            enrollmentStatus: course.enrollmentStatus,
                                                            enrollmentId: course.enrollmentId
                                                        }
                                                    })}
                                                    style={{ width: '100%' }}
                                                />
                                            </View>
                                        ))
                                    ) : (
                                        <Text style={styles.emptyText}>No courses in progress.</Text>
                                    )
                                )}

                            {/* completed courses */}
                            {courseFilter === 'completed' &&
                                completedCourses.map(course => {
                                    // const numModules = course.module_count ? course.module_count.length : 0;
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
                                                // handlers
                                                onPress={() => navigation.navigate('ParkGuideStack', {
                                                    screen: 'UserModule', 
                                                    params: { 
                                                        id: course.id,
                                                        enrollmentStatus: course.enrollmentStatus ?? null,
                                                        enrollmentId: course.enrollmentId
                                                    }
                                                })}
                                                style={{ width: '100%' }}
                                            />
                                        </View>
                                    );
                                })
                            }
                        </View>
                            {/* Categories */}
                            <Text style={styles.sectionTitle}>{t('explore')} {t('categories')}</Text>
                                <View style={styles.tagContainer}>
                                    {categories.length > 0 ? (
                                        categories
                                            .filter(tag => tag.type === 'category') 
                                            .map((item) => (
                                                <Pressable 
                                                    key={item.id} 
                                                    style={styles.categoryTag}
                                                    onPress={() => navigation.navigate('ParkGuideStack', {
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
                </View>

                {/* Right side of screen */} 
                <View style={styles.rightWrapper}>
                    <View style={styles.rightColumn}>
                        
                        {/* Calendar */}
                        <View style={styles.calendarContainer}>
                            <View style={styles.calendarHeader}>
                                <Text style={styles.monthText}>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </Text>
                                <Pressable onPress={()=>setIsExpanded(!isExpanded)} style={styles.expandBtn}>
                                    {isExpanded ? <ChevronsDownUp size={20} color='#0a6340'/> : <ChevronsUpDown size={20} color='#0a6340'/>}
                                </Pressable>
                            </View>
                            
                            <View style={styles.divider} />
                            <View style={styles.calendarBodyRow}>
                                
                                <Pressable onPress={() => {
                                    const d = new Date(currentDate);
                                    isExpanded ? d.setMonth(d.getMonth() - 1) : d.setDate(d.getDate() - 7);
                                    setCurrentDate(d);
                                }}>
                                    <ChevronLeft size={24} color='#2f6618fe' />
                                </Pressable>
                                <View style={{ flex: 1 }}>
                                    <View style={styles.weekHeaderRow}>
                                        {weekLabels.map((day, i) => (
                                            <Text key={i} style={styles.weekHeaderText}>
                                                {day}
                                            </Text>
                                        ))}
                                    </View>
                                    {/* The Dates Grid */}
                                    <View style={isExpanded ? styles.monthGrid : styles.weekRow}>
                                        {(isExpanded ? getDaysInMonth(currentDate) : weekDates).map((date, index) => {
                                            
                                            if (!date) {
                                                return (
                                                    <View
                                                        key={index}
                                                        style={[
                                                            styles.dayContainer,
                                                            styles.monthDayContainer
                                                        ]}
                                                    />
                                                );
                                            }
                                            const dateString = formatLocalDate(date);
                                            const isSelected = selectedDate === dateString;
                                            const hasEvent = hasPendingEventOnDate(date);
                                            
                                            return (
                                                <Pressable
                                                    key={index}
                                                    style={[
                                                        styles.dayContainer,
                                                        isSelected && styles.selectedDay,
                                                        isExpanded
                                                            ? styles.monthDayContainer
                                                            : { flex: 1 },
                                                    ]}
                                                    onPress={() =>
                                                        setSelectedDate(isSelected ? null : dateString)
                                                    }
                                                >
                                                    <Text
                                                        style={[
                                                            styles.dayNumber,
                                                            isSelected && styles.selectedText
                                                        ]}
                                                    >
                                                        {date.getDate()}
                                                    </Text>

                                                    {hasEvent && <View style={styles.dot} />}
                                                </Pressable>
                                            );
                                        })}
                                    </View>
                                </View>

                                {/* Right Button - Always visible */}
                                <Pressable onPress={() => {
                                    const d = new Date(currentDate);
                                    isExpanded ? d.setMonth(d.getMonth() + 1) : d.setDate(d.getDate() + 7);
                                    setCurrentDate(d);
                                }}>
                                    <ChevronRight size={24} color='#2f6618fe' />
                                </Pressable>

                            </View>
                        </View>

                        {/* Todo tab for filter (All, Completed, Not completed) */}
                        <SlidingTabs tabs={eventTab} activeTab={filter} onTabChange={(id)=>setFilter(id)}/>

                        {/* Todo list */}
                        <View style={{ flex: 1, minHeight: 0 }}>
                            <View style={styles.todoList}>
                                <View style={styles.todoHeader}>
                                    <Text style={styles.todoListTitle}>Todo List</Text>
                                    <Pressable 
                                    onPress={() => {
                                            setSelectedTask(null);
                                            setShowModal(true);
                                        }}
                                    >
                                        <ListPlus size={20} />
                                    </Pressable>
                                </View>
                                <ScrollView showsVerticalScrollIndicator={true} indicatorStyle='white'>
                                    {filteredEvents.length === 0 ? (
                                        <Text>No todos</Text>
                                    ) : (
                                        filteredEvents.map(event => (
                                            <View key={event.id} style={styles.todoItem}>
                                                <View style={styles.todoRow}>
                                                    <Checkbox
                                                        value={event.status === 'completed'}
                                                        onValueChange={() => toggleEvent(event.id)}
                                                    />
                                                    <View style={{flex: 1}}>
                                                        <Text style={styles.todoTitle}>{event.title}</Text>
                                                        <Text style={styles.todoCourse}>{event.type} - {formatDate(event.event_start_at, false)}</Text>
                                                    </View>

                                                    <Pressable onPress={() => openEdit(event)}>
                                                        <ChevronRight size={20} />
                                                    </Pressable>
                                                </View>
                                            </View>
                                        ))
                                    )}
                                </ScrollView>
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            {/* call add todo component */}
            <AddTodo 
                visible={showModal} 
                setIsModalVisible={(visible) => {
                    setShowModal(visible);
                    if (!visible) {
                        setSelectedTask(null);
                    }
                }}
                onCreated={refreshData} 
                initialEvent={selectedTask} 
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    // Left screen layout
    leftScreen:{
        flex: 2,
        padding: 20,
        paddingHorizontal: 30,
        marginLeft: 20,
    },
    cardContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
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
    topRow:{
        flex: 1,
        flexDirection: 'row',
        gap: 20,
    },
    leftColumn:{
        flexDirection: 'column',
        width: '100%',
        gap: 20,
    },
    rightColumn:{
        flex: 1,
        flexDirection: 'column',
        paddingHorizontal: 30,
        minHeight: 0,
        paddingVertical: 30,
    },
    rightWrapper:{
        flex: 1,
        backgroundColor: '#E8F5E9',
        position:'sticky',
        top:0,
        height:'calc(100vh - 65px)',
        alignSelf:'flex-start',
        maxWidth:370
    },
    // Info card
    infoContainer:{
        width: '100%',
        marginBottom: 10,
    },
    infoCard:{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingStart: 40,
        borderRadius: 20,
        width: '100%',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    infoLeft:{
        gap: 10,
    },
    infoRight:{
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 30,
    },
    welcomeText:{
        fontSize: 25,
        fontWeight: 'bold',
        color: 'white',
    },
    subText:{
        fontSize: 14,
        color: 'white',
        marginTop: 4,
        marginLeft:7
    },
    infoRow1:{
        flexDirection: 'row',
        gap: 50,
    },  
    row:{
        flexDirection: 'row',
    },
    profilePic: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        marginBottom: 5,
    },
    idText:{
        fontWeight: 'bold',
        fontSize: 15,
        color: 'white',
    },
    // Calendar
    calendarContainer:{
        width: '100%',
        marginBottom: 10,
        paddingTop: 10,
        paddingBottom: 10,
        overflow: 'hidden',
        backgroundColor: 'white',
        borderRadius:5
        
    },
    calendarHeader:{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        marginHorizontal:15,
        userSelect:'none'
    },
    calendarBtn:{
        fontSize: 20,
        color: '#2f6618fe',
    },
    monthText:{
        fontSize: 16,
        fontWeight: 'bold',
    },
    calendarBodyRow: {
        flexDirection: 'row',
        alignItems:'center'
    },
    monthGrid: {
        flex: 1, 
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        
    },
    weekRow: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        
    },
    monthDayContainer:{
        width:'14.28%',
        height:40,
    },
    dayContainer:{
        alignItems: 'center',
        paddingVertical:10,
    },
    dayNumber:{
        fontSize: 14,
    },
    selectedText:{
        color: 'white',
        fontWeight: 'bold',
        backgroundColor: '#2f6618fe',
        width: 24,
        height: 24,
        borderRadius: 50,
        padding:2,
        textAlign: 'center',
        textAlignVertical: 'center',
        lineHeight: 22,
    },
    dot:{
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'green',
        marginTop: 4,
        alignSelf: 'center',
    },
    divider:{
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 5,
    },
    // Todo list
    todoList:{
        flex: 1,
        backgroundColor: '#8ed2a944',
        borderRadius: 10,
        padding: 15,
    },
    todoListTitle:{
        fontSize: 17,
        marginBottom: 10,
        fontWeight: 'bold',
    },
    todoHeader:{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    todoRow:{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    todoItem:{
        paddingVertical: 15,
        paddingHorizontal: 13,
        backgroundColor: '#ffffff',
        borderRadius: 10,
        marginVertical: 6,
        marginRight: 10,
        backgroundColor: 'white',
    },
    todoTitle:{
        fontSize: 16,
        marginLeft: 3
    },
    todoCourse:{
        color: '#888888',
        fontSize: 12,
        marginLeft: 3
    },
    icon:{
        alignSelf:'center',
        color: 'white',
    },
    idBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginTop: 4,
        color: '#fff',
        fontSize: 16,
        fontFamily: 'monospace',
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    weekHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    weekHeaderText: {
        flex: 1,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
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
        fontSize: 14,
        color: 'white',
        fontWeight: '500',
    },
    pfp:{
        width: 90,
        height: 90,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: 'white',
    },
    pfpPlaceholder:{
        width: 90,
        height: 90,
        marginBottom: 10,
        borderRadius: 60,
        backgroundColor: '#2f6618fe',
        borderWidth: 3,
        borderColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pfpInitials:{
        fontSize: 32,
        fontWeight: '700',
        color: 'white',
    },
});

export default UserDashboard;