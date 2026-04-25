import {useState, useEffect} from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image, ImageBackground, Dimensions } from 'react-native';
import { ListPlus, ChevronRight, ChevronLeft } from 'lucide-react-native';
import Checkbox from 'expo-checkbox';

import NavBar from '../components/NavBar';
import CourseCard from '../components/CourseCard.js';
import { useUserDashboard } from '../hooks/useUserDashboard';

const UserDashboard = ({ navigation }) => {
    const [topRowHeight, setTopRowHeight] = useState(0);
    const {courses,todos,userType,progressData,loading,setTodos,user,account} = useUserDashboard();
    const [selectedDate, setSelectedDate] = useState(null);
    const [filter, setFilter] = useState("all");
    const [currentDate, setCurrentDate] = useState(new Date());

    // Get window height so rightColumn does not overflow screen height
    const [windowHeight, setWindowHeight] = useState(Dimensions.get('window').height);
    useEffect(() => {
        const subscription = Dimensions.addEventListener('change', ({ window }) => {
            setWindowHeight(window.height);
        });
        return () => subscription?.remove();
    }, []);

    // Toggle checkbox
    const toggleTodo = (id) => {
        setTodos(prev =>
            prev.map(todo =>
                todo.id === id ? { ...todo, completed: !todo.completed } : todo
            )
        );
    };

    // Filter todos based on selected date and status
    let filteredTodos = todos;

    // Filter by date
    if (selectedDate) {
        filteredTodos = filteredTodos.filter(todo =>
            new Date(todo.date).toDateString() === new Date(selectedDate).toDateString()
        );
    }

    // Filter by status
    if (filter === "completed") {
        filteredTodos = filteredTodos.filter(todo => todo.completed);
    } else if (filter === "pending") {
        filteredTodos = filteredTodos.filter(todo => !todo.completed);
    }

    // get start of week (Sunday)
    const getStartOfWeek = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        d.setDate(d.getDate() - day);
        return d;
    };

    // Generate 7 days
    const getWeekDates = (date) => {
        const start = getStartOfWeek(date);
        return Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            return d;
        });
    };

    const weekDates = getWeekDates(currentDate);

    // get in progress courses
    const inProgressCourses = courses.filter(course => {
        const progressObj = progressData.find(p => p.courseId === course.id);
        const progress = progressObj ? progressObj.progress : null;

        return progress !== null && progress > 0 && progress < 1;
    });

    return(
        <View style={{ flex: 1 }}>
            <NavBar/>
                <View key={windowHeight} style={styles.topRow} onLayout={(e) => setTopRowHeight(e.nativeEvent.layout.height)}>
                    {/* Left side of screen */}
                    <View style={styles.leftScreen}>
                        <ScrollView>
                            <Text style={styles.dashboardTitle}>Dashboard</Text>
                                <View style={styles.leftColumn}>

                                    {/* info card */}
                                    <View style={styles.infoContainer}>
                                        <ImageBackground
                                            source={require('../../assets/forest.png')}
                                            style={styles.infoCard}
                                            imageStyle={{ borderRadius: 20 }}  // applies borderRadius to the image itself
                                        >
                                            {/* info card left side */}
                                            <View style={styles.infoLeft}>
                                                <Text style={styles.welcomeText}>
                                                    Welcome, {user?.fname}
                                                </Text>

                                                <Text style={styles.subText}>
                                                    Joined since {account?.joinedDate}
                                                </Text>

                                                <View style={styles.infoRow1}>
                                                    <View style={styles.infoRow2}>
                                                        <Text style={styles.label}>Phone: </Text>
                                                        <Text style={styles.subText}>
                                                            <Text>{user?.telefon}</Text>
                                                        </Text>
                                                    </View>

                                                    <View style={styles.infoRow2}>
                                                        <Text style={styles.label}>Email: </Text>
                                                        <Text style={styles.subText}>
                                                            <Text>{user?.email}</Text>
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>

                                            {/* info card right side */}
                                            <View style={styles.infoRight}>
                                                <Image source={{ uri: user?.profileImage }} style={styles.profilePic}/>

                                                <Text style={styles.idText}>
                                                    ID: {user?.id}
                                                </Text>
                                            </View>
                                        </ImageBackground>
                                    </View>

                                    {/* only display in progress courses */}
                                    <View style={styles.cardContainer}>
                                        {inProgressCourses.map(course => {
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
                        </ScrollView>
                    </View>

                    {/* Right side of screen */} 
                    <View style={[styles.rightWrapper, topRowHeight > 0 && { height: topRowHeight }]}>
                        <View style={styles.rightColumn}>
                            
                            {/* Calendar */}
                            <View style={styles.calendarContainer}>
                                <View style={styles.calendarHeader}>
                                    <Pressable onPress={() => {
                                        const d = new Date(currentDate);
                                        d.setDate(d.getDate() - 7);
                                        setCurrentDate(d);
                                    }}>
                                        <ChevronLeft style={styles.calendarBtn} />
                                    </Pressable>

                                    <Text style={styles.monthText}>
                                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                    </Text>

                                    <Pressable onPress={() => {
                                        const d = new Date(currentDate);
                                        d.setDate(d.getDate() + 7);
                                        setCurrentDate(d);
                                    }}>
                                        <ChevronRight style={styles.calendarBtn} />
                                    </Pressable>
                                </View>

                                {/* Days row */}
                                <View style={styles.weekRow}>
                                    {weekDates.map((date, index) => {
                                        const dateString = date.toISOString().split('T')[0];
                                        const isSelected = selectedDate === dateString;

                                        return (
                                            <Pressable
                                                key={index}
                                                style={[
                                                    styles.dayContainer,
                                                    isSelected && styles.selectedDay
                                                ]}
                                                onPress={() => {
                                                    if (isSelected) {
                                                        setSelectedDate(null);
                                                    } else {
                                                        setSelectedDate(dateString);
                                                    }
                                                }}
                                            >
                                                <Text style={styles.dayName}>
                                                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                                </Text>

                                                <Text style={[
                                                    styles.dayNumber,
                                                    isSelected && styles.selectedText
                                                ]}>
                                                    {date.getDate()}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* Todo tab for filter (All, Completed, Not completed) */}
                            <View style={styles.todoTab}>
                                <Pressable onPress={() => setFilter("all")}>
                                    <Text style={filter === "all" ? styles.activeTab : styles.tab}>
                                        All
                                    </Text>
                                </Pressable>

                                <Pressable onPress={() => setFilter("completed")}>
                                    <Text style={filter === "completed" ? styles.activeTab : styles.tab}>
                                        Completed
                                    </Text>
                                </Pressable>

                                <Pressable onPress={() => setFilter("pending")}>
                                    <Text style={filter === "pending" ? styles.activeTab : styles.tab}>
                                        Not Completed
                                    </Text>
                                </Pressable>
                            </View>

                            {/* Todo list */}
                            <View style={{ flex: 1, minHeight: 0 }}>
                                <View style={styles.todoList}>
                                    <View style={styles.todoHeader}>
                                        <Text style={styles.todoListTitle}>Todo List</Text>

                                        <Pressable onPress={() => setShowModal(true)}>
                                            <ListPlus size={20} />
                                        </Pressable>
                                    </View>
                                    <ScrollView showsVerticalScrollIndicator={true}>
                                        {filteredTodos.length === 0 ? (
                                            <Text>No todos</Text>
                                        ) : (
                                            filteredTodos.map(todo => (
                                                <View key={todo.id} style={styles.todoItem}>
                                                    <View style={styles.todoRow}>
                                                        <Checkbox
                                                            value={todo.completed}
                                                            onValueChange={() => toggleTodo(todo.id)}
                                                        />
                                                        <View style={{flex: 1}}>
                                                            <Text style={styles.todoTitle}>{todo.title}</Text>
                                                            <Text style={styles.todoCourse}>{todo.course} - {todo.date}</Text>
                                                        </View>

                                                        <Pressable onPress={() => openEdit(todo)}>
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
        </View>
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
    dashboardTitle:{
        marginHorizontal: 10,
        marginVertical: 10,
        marginBottom: 15,
        fontSize: 40,
        fontWeight: 'bold',
    },
    cardContainer:{
        flexDirection:'row',
        flexWrap:'wrap',
        justifyContent:'flex-start',
        marginTop:20,
        gap:30,
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
    rightWrapper: {
        flex: 0.8,
        backgroundColor: '#A5D6A7',
    },
    // Info card
    infoContainer:{
        width: '100%',
        marginBottom: 10,
    },
    infoCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderRadius: 20,
        width: '100%',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    infoLeft: {
        flex: 2,
        gap: 6,
    },
    infoRight: {
        flex: 0.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    welcomeText: {
        fontSize: 30,
        fontWeight: 'bold',
        color: 'white',
    },
    subText: {
        fontSize: 15,
        color: 'white',
        marginTop: 4,
    },
    infoRow1: {
        flexDirection: 'row',
        gap: 50,
    },
    infoRow2: {
        flexDirection: 'row',
    },
    label: {
        fontWeight: 'bold',
        fontSize: 16,
        color: 'white',
        marginTop: 4,
    },
    profilePic: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.5)',
        backgroundColor: '#ccc',
        marginBottom: 10,
    },
    idText: {
        fontWeight: 'bold',
        fontSize: 15,
        color: 'white',
    },
    // Calendar
    calendarContainer:{
        width: '100%',
        marginBottom: 10,
        paddingTop: 10,
        paddingHorizontal: 5,
        overflow: 'hidden',
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    calendarHeader:{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    calendarBtn:{
        fontSize: 20,
        paddingHorizontal: 15,
        color: '#2f6618fe',
    },
    monthText:{
        fontSize: 16,
        fontWeight: 'bold',
    },
    weekRow:{
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dayContainer:{
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        borderRadius: 10,
    },
    dayName:{
        fontSize: 12,
        color: '#666',
    },
    dayNumber:{
        fontSize: 16,
        marginTop: 4,
        padding: 6,
    },
    selectedText:{
        color: 'white',
        fontWeight: 'bold',
        backgroundColor: '#2f6618fe',
        padding: 6,
        paddingHorizontal: 10,
        borderRadius: 50,
    },
    // Todo list
    todoList:{
        flex: 1,
        minHeight: 0,
        backgroundColor: '#E8F5E9',
        borderRadius: 10,
        padding: 15,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    todoListTitle:{
        fontSize: 18,
        marginBottom: 10,
        fontWeight: 'bold',
    },
    todoHeader:{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    todoRow: {
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
    // Todo filter tab
    todoTab:{
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    tab:{
        fontSize: 14,
        color: 'black',
        backgroundColor: '#E8F5E9',
        padding: 7,
        paddingHorizontal: 15,
        borderRadius: 50,
        borderBottomWidth: 2,
        borderBottomColor: '#888'
    },
    activeTab:{
        fontSize: 14,
        color: 'white',
        borderBottomWidth: 2,
        backgroundColor: '#2f6618fe',
        padding: 7,
        paddingHorizontal: 15,
        borderRadius: 50
    }
});

export default UserDashboard;