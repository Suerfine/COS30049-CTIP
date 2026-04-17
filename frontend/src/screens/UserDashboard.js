import {useState} from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView} from 'react-native';
import { ListPlus, ChevronRight, ChevronLeft } from 'lucide-react-native';
import Checkbox from 'expo-checkbox';

import CourseCard from '../components/CourseCard.js';
import { useUserDashboard } from '../hooks/useUserDashboard';

const UserDashboard = ({ navigation }) => {
    const {courses,todos,userType,progressData,loading,setTodos} = useUserDashboard();
    const [selectedDate, setSelectedDate] = useState(null);
    const [filter, setFilter] = useState("all");
    const [currentDate, setCurrentDate] = useState(new Date());

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

    // Get start of week (Sunday)
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

    return(
        <View style={{ flex: 1 }}>
            <View style={styles.container}>
                <View style={styles.topRow}>
                    {/* Left side */}
                    <View style={{flex: 3.2}}>
                        <ScrollView>
                            <Text style={styles.dashboardTitle}>Dashboard</Text>
                            <View style={styles.leftColumn}>
                                <View style={styles.cardContainer}>
                                    {courses.map(course=>{
                                        const courseProgress = progressData.find(p => p.courseId === course.id);
                                        const numModules=course.modules? course.modules.length :0;
                                        return(
                                            <CourseCard
                                                key={course.id}
                                                id={course.id}
                                                imagePath={{uri:course.image}}
                                                courseTitle={course.courseTitle}
                                                numModules={numModules}
                                                duration={course.duration}
                                                expiry={course.expiryDate}
                                                progress={courseProgress?.progress}
                                                userType={userType}
                                                onPress={()=> navigation.navigate('User Module', {id:course.id})}
                                            />
                                            );
                                        }
                                    )}
                                </View>
                            </View> 
                        </ScrollView>
                    </View>

                    {/* Right side */}
                    <View style={styles.rightColumn}>

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
    },
    leftColumn:{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 20,
    },
    rightColumn:{
        flex: 1.1,
        flexDirection: 'column',
        maxHeight: '100%',
    },
    calendarContainer:{
        width: '100%',
        marginBottom: 10,
        paddingTop: 10,
        paddingHorizontal: 5,
        overflow: 'hidden',
        backgroundColor: 'white',
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
        color: '#2f6618fe',
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
        marginTop: 10,
        marginBottom: 20,
        gap: 40
    },
    tab:{
        fontSize: 14,
        color: 'black',
        backgroundColor: '#9ee5a375',
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