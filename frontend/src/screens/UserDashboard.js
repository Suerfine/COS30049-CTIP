import React,{useEffect, useState} from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView} from 'react-native';
import { ListPlus, ChevronRight } from 'lucide-react-native';
import Checkbox from 'expo-checkbox';
import { Calendar } from 'react-native-calendars';

// Import Components
import CourseCard from '../components/CourseCard.js';
import NavBar from '../components/NavBar.js';

const UserDashboard = ({ navigation }) => {
    const [courses, setCourses]=useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [todos, setTodos] = useState([]);
    const [userType, setUserType] = useState('');
    const [progressData, setProgressData] = useState([]);
    const [filter, setFilter] = useState("all");
    
    // Fetch user type
    useEffect(() => {
        fetch('http://localhost:5000/api/userType')
        .then(res => {
            console.log("Response status:", res.status);
            return res.json();
        })
        .then(data => {
            console.log("User type received:", data);
            setUserType(data);
        })
        .catch(err => console.error("Fetch error:", err));
    }, []);

    // Fetch progress data
    useEffect(() => {
        fetch('http://localhost:5000/api/progress')
        .then(res => {
            console.log("Response status:", res.status);
            return res.json();
        })
        .then(data => {
            console.log("Progress received:", data);
            setProgressData(data);
        })
        .catch(err => console.error("Fetch error:", err));
    }, []);

    // Fetch courses
    useEffect(()=>{
        fetch('http://localhost:5000/api/courses')
        .then(res => {
            console.log("Response status:", res.status);
            return res.json();
        })
        .then(data => {
            console.log("Courses received:", data);
            setCourses(data);
        })
        .catch(err => console.error("Fetch error:", err));
    },[]);

    // Fetch todos
    useEffect(() => {
        fetch('http://localhost:5000/api/todos')
        .then(res => {
            console.log("Response status:", res.status);
            return res.json();
        })
        .then(data => {
            console.log("Todos received:", data);
            setTodos(data);
        })
        .catch(err => console.error("Fetch error:", err));
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

    return(
        <View style={{ flex: 1 }}>
            {/* <NavBar/> */}
            <View style={styles.container}>
                <View>
                    <Text style={styles.dashboardTitle}>Dashboard</Text>
                </View>

                <View style={styles.topRow}>
                    {/* Left side */}
                    <ScrollView style={{ flex: 3.2 }} >
                        <View style={styles.leftColumn}>
                            <View style={styles.cardContainer}>
                                {courses.map(course=>{
                                    const courseProgress = progressData.find(p => p.course === course.courseTitle);
                                    return(
                                        <CourseCard
                                            key={course.id}
                                            id={course.id}
                                            imagePath={{uri:course.image}}
                                            courseTitle={course.courseTitle}
                                            numModules={course.numModules}
                                            duration={course.duration}
                                            expiry={course.expiryDate}
                                            progress={courseProgress?.progress}
                                            userType={userType}
                                            onPress={()=> navigation.navigate('Course Details', {id:course.id})}
                                        />
                                        );
                                    }
                                )}
                            </View>
                        </View> 
                    </ScrollView>

                    {/* Right side */}
                    <View style={styles.rightColumn}>

                        {/* Calendar */}
                        <View style={styles.calendarContainer}>
                            <Calendar style={{height: 320}}
                                onDayPress={(day) => {
                                    if(selectedDate === day.dateString){
                                        setSelectedDate(null);
                                    } else {
                                        setSelectedDate(day.dateString);
                                    }
                                }}  
                                markedDates={{
                                    [selectedDate]: { selected: true }
                                }}
                            />
                        </View>

                        {/* Todo tab for filter (All, Completed, Not completed)*/}
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
                        <View style={styles.todoList}>
                            <View style={styles.todoHeader}>
                                <Text style={styles.todoListTitle}>Todo List</Text>

                                <Pressable onPress={() => setShowModal(true)}>
                                    <ListPlus size={20} />
                                </Pressable>
                            </View>
                            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true}>
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
    );
}

const styles = StyleSheet.create({
    container:{
        flex: 1,
        padding: 20,
        marginHorizontal: 10
    },
    dashboardTitle:{
        marginHorizontal: 10,
        marginVertical: 10,
        fontSize: 30,
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
        alignItems: 'stretch',
    },
    leftColumn:{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 20,
    },
    rightColumn:{
        flex: 0.8,
        flexDirection: 'column',
        maxHeight: '100%',
    },
    calendarContainer:{
        width: '100%',
        borderRadius: 20,
        marginBottom: 10,
        padding: 3,
        overflow: 'hidden',
    },
    todoList:{
        flex: 1,
        backgroundColor: '#9ee5a375',
        borderRadius: 10,
        padding: 15,
        maxHeight: '100%',
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
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#cccccc',
        backgroundColor: '#ffffff',
        borderRadius: 10,
        marginVertical: 6,
        marginRight: 10,
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
    todoTab:{
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 10,
        gap: 20
    },
    tab:{
        fontSize: 14,
        color: '#888',
        backgroundColor: '#9ee5a375',
        padding: 5,
        paddingHorizontal: 15,
        borderRadius: 50,
        borderBottomWidth: 2,
        borderBottomColor: '#888'
    },
    activeTab:{
        fontSize: 14,
        fontWeight: 'bold',
        color: '#000',
        borderBottomWidth: 2,
        backgroundColor: '#9ee5a375',
        padding: 5,
        paddingHorizontal: 15,
        borderRadius: 50
    }
});

export default UserDashboard;