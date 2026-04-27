import {useState, useEffect} from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image, ImageBackground, Dimensions } from 'react-native';
import { ListPlus, ChevronRight, ChevronLeft, ClockFading, Phone, Mail, ChevronsUpDown, ChevronsDownUp} from 'lucide-react-native';
import Checkbox from 'expo-checkbox';
import {Animated} from 'react-native';

// Import from other hook and components
import CourseCard from '../components/CourseCard.js';
import { useUserDashboard } from '../hooks/useUserDashboard';

const UserDashboard = ({ navigation }) => {
    const {courses,todos,userType,progressData,loading,setTodos,user,account} = useUserDashboard();
    const [selectedDate, setSelectedDate] = useState(null);
    const [filter, setFilter] = useState("all");
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isExpanded, setIsExpanded]=useState(false);
    const weekLabels=['Fri', 'Sat','Sun', 'Mon', 'Tue', 'Wed', 'Thu'];

    const slideAnim=useState(new Animated.Value(0))[0];
    const handleTabChange=(tab, value)=>{
        setFilter(tab);
        Animated.spring(slideAnim,{
            toValue:value,
            useNativeDriver:false,
            friction:8,
            tension:40
        }).start();
    };

    const translateX=slideAnim.interpolate({
        inputRange:[0,1,2],
        outputRange:[0,100, 200],
    });

    // TODOLIST LOGIC
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

    // CALENDAR LOGIC
    // get start of week (Sunday)
    const getStartOfWeek = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const startDay=5;
        const diff=(day-startDay+7)%7;
        d.setDate(d.getDate() - diff);
        return d;
    };

    // generate 7 days
    const getWeekDates = (date) => {
        const start = getStartOfWeek(date);
        return Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            return d;
        });
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDate = new Date(year, month + 1, 0).getDate();
        const startDay = 5; 
        const firstDayIndex = (firstDay.getDay() - startDay + 7) % 7;
        const days = [];
        for (let i = 0; i < firstDayIndex; i++) {
            days.push(null);
        }
        for (let i = 1; i <= lastDate; i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    };

    const weekDates = getWeekDates(currentDate);

    // dot indicator for dates with todo item(s)
    const hasPendingTodoOnDate = (date) => {
        return todos.some(todo =>
            !todo.completed &&
            new Date(todo.date).toDateString() === date.toDateString()
        );
    };

    // COURSES LOGIC
    // get in progress courses
    const inProgressCourses = courses.filter(course => {
        const progressObj = progressData.find(p => p.courseId === course.id);
        const progress = progressObj ? progressObj.progress : null;

        return progress !== null && progress > 0 && progress < 1;
    });

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
                                            Welcome, {user?.fname}
                                        </Text>

                                        <View style={styles.row}>
                                            <ClockFading size={16} color='white' style={styles.icon}/>
                                            <Text style={styles.subText}>
                                                Joined since {account?.joinedDate}
                                            </Text>
                                        </View>

                                        <View style={styles.infoRow1}>
                                            <View style={styles.row}>
                                                <Phone size={16} color='white' style={styles.icon}/>
                                                <Text style={styles.subText}>
                                                    {user?.telefon}
                                                </Text>
                                            </View>
                                            
                                            <View style={styles.row}>
                                                <Mail size={16} color='white' style={styles.icon}/>
                                                <Text style={styles.subText}>
                                                    {user?.email}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* info card right side */}
                                    <View style={styles.infoRight}>
                                        <Image source={{ uri: user?.profileImage }} style={styles.profilePic}/>

                                        <Text style={styles.idBadge}>
                                            ID: {user?.id}
                                        </Text>
                                    </View>
                                </ImageBackground>
                            </View>
                            <Text style={styles.sectionTitle}>My Courses</Text>

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
                                            const dateString = date.toISOString().split('T')[0];
                                            const isSelected = selectedDate === dateString;
                                            const hasTodo = hasPendingTodoOnDate(date);
                                            
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

                                                    {hasTodo && <View style={styles.dot} />}
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
                        <View style={styles.tabWrapper}>
                            <View style={[styles.tabContainer,styles.row]}>
                                <Pressable onPress={()=>handleTabChange('all',0)} style={styles.tabButton}>
                                    <Text style={[styles.tabText, filter==='all' && styles.activeTabText]}>All</Text>
                                </Pressable>
                                <Pressable onPress={()=>handleTabChange('completed',1)} style={styles.tabButton}>
                                    <Text style={[styles.tabText, filter==='completed' && styles.activeTabText]}>Completed</Text>
                                </Pressable>
                                <Pressable onPress={()=>handleTabChange('pending',2)} style={styles.tabButton}>
                                    <Text style={[styles.tabText, filter==='pending' && styles.activeTabText]}>Pending</Text>
                                </Pressable>
                            </View>
                            <Animated.View style={[styles.slidingLine, {transform:[{translateX}]}]}/>
                        </View>
                        {/* <View style={styles.todoTab}>
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
                        </View> */}

                        {/* Todo list */}
                        <View style={{ flex: 1, minHeight: 0 }}>
                            <View style={styles.todoList}>
                                <View style={styles.todoHeader}>
                                    <Text style={styles.todoListTitle}>Todo List</Text>
                                    <Pressable onPress={() => setShowModal(true)}>
                                        <ListPlus size={20} />
                                    </Pressable>
                                </View>
                                <ScrollView showsVerticalScrollIndicator={true} indicatorStyle='white'>
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
    cardContainer:{
        flexDirection:'row',
        flexWrap:'wrap',
        justifyContent:'flex-start',
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
        padding: 6,
        paddingHorizontal: 10,
        borderRadius: 50,
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
        backgroundColor: '#A5D6A7',
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
    },
    icon:{
        alignSelf:'center'
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
    tabWrapper:{
        marginVertical:10,
        positive:'relative',
        justifyContent:'space-between',
    },
    tabContainer:{
        width:'100%',
        userSelect:'none',
    },
    slidingLine:{
        position:"absolute",
        bottom:0,
        width:103,
        height:3,
        backgroundColor:'#0a6340',
        borderRadius:3
    },
    tabButton:{
        paddingVertical:10,
        width:100,
        alignItems:'center'
    },
    activeTabText:{
        color:'#065133c6',
        fontWeight:'bold',
    },
    tabText:{
        fontSize:14,
        color:'#666'
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
});

export default UserDashboard;