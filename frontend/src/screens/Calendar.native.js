import { View, Text, StyleSheet, ScrollView, Pressable, StatusBar } from 'react-native';
import { useEffect, useState } from 'react'; 
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { LayoutList, StretchHorizontal, ChevronLeft, Plus, ChevronRight } from 'lucide-react-native';
import {Calendar as RNCalendar} from 'react-native-calendars'; 
import Checkbox from 'expo-checkbox';

// Import other hook and components
import { useUserDashboard } from '../hooks/useUserDashboard';
import SlidingTabs from '../components/SlidingTabs.js';

const Calendar=({layout,navigation})=>{
    const [currentLayout, setCurrentLayout]=useState(layout);
    const {currentDate, todos, hasPendingTodoOnDate, filteredTodos, todoTab, setFilter, filter, toggleTodo} =useUserDashboard();
    const [selectedDate, setSelectedDate]=useState('');

    const getMarkedDates=()=>{
        let marks={};
        if(selectedDate){
            marks[selectedDate]={
                selected:true,
                selectedColor:'#32750e'
            };
        }
        todos.forEach(todo=>{
            const dateStr=todo.date;
            marks[dateStr]={
                ...marks[dateStr],
                marked:true,
                dotColor:'#32750e'
            };
        });
        return marks;
    };

    const RenderTodo=()=>{
        const displayTodos=selectedDate ? todos.filter(todo=>todo.date === selectedDate) : todos;
        return (
            <>
            <RNCalendar
                renderArrow={(direction)=>(
                    direction==='left' ? <ChevronLeft size={24} color="#32750e"/> : <ChevronRight size={24} color="#32750e"/>
                )}
                renderHeader={(date) => {
                    const monthYear = date.toString('MMMM yyyy');
                        return (
                            <View>
                                <Text style={styles.customHeaderTitle}>{monthYear}</Text>
                            </View>
                        );
                    }
                }
                    current={new Date().toISOString().split('T')[0]}
                    onDayPress={day => {
                        if (selectedDate === day.dateString) {
                            setSelectedDate('');
                        } else {
                            setSelectedDate(day.dateString);
                        }
                    }}
                    markedDates={
                        getMarkedDates()
                    }
                    
                    theme={{
                        'stylesheet.calendar.main': {
                            dayContainer: {
                                paddingVertical: 0 
                            },
                            week: {
                                marginTop: 2,
                                marginBottom: 2,
                                flexDirection: 'row',
                                justifyContent: 'space-around'
                            }
                        },
                    backgroundColor:"#ffffff",
                    calendarBackground:'#ffffff',
                    textSectionTitleColor:'#b6c1cd',
                    selectedDayBackgroundColor:'#32750e',
                    selectedDayTextColor:'#ffffff',
                    todayTextColor:'#32750e',
                    arrowColor:'#32750e',
                    monthTextColor:'#1f2937',
                    indicatorColor:'blue',
                    textDayFontWeight:'bold',
                    textDayHeaderFontWeight:'300',
                    textDayFontSize:16,
                    textMonthFontSize:18,
                    textDayHeaderFontSize:14
                }}
                style={styles.calendar}
            />
            <View style={{ flex: 1, minHeight: 0 }}>
                <View style={styles.todoList}>
                    <View style={styles.todoHeader}>
                        <Text style={styles.todoListTitle}>Todo List</Text>
                    </View>
                    <SlidingTabs tabs={todoTab} activeTab={filter} onTabChange={(id)=>setFilter(id)}/>
                    <ScrollView showsVerticalScrollIndicator={true} indicatorStyle='white'>
                        {displayTodos.length === 0 ? (
                            <Text>No todos</Text>
                        ) : (
                            displayTodos.map(todo => (
                                <Pressable key={todo.id} style={styles.todoItem} onPress={()=>navigation.navigate('TaskDetails',{task:todo})}>
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
                                </Pressable>
                            ))
                        )}
                    </ScrollView>
                </View>
            </View>
            </>
        )
    }

    const RenderCalendar=()=>{
        return (
            <RNCalendar
                renderArrow={(direction)=>(
                    direction==='left' ? <ChevronLeft size={24} color="#32750e"/> : <ChevronRight size={24} color="#32750e"/>
                )}
                style={styles.fullScreenCalendar}
                dayComponent={({date,state})=>{
                    const dayTodos=todos.filter(t=>t.date===date.dateString);

                    return (
                        <Pressable
                            onPress={()=>setSelectedDate(date.dateString)}
                            style={[styles.dayBox,
                                state==='disabled' ? styles.disabledBox : null,
                                selectedDate===date.dateString && styles.selectedBox
                            ]}
                        >
                            {/* Day Number */}
                            <Text style={[styles.dayText, state==='today' && styles.todayText]}>
                                {date.day}
                            </Text>
                            {/* Tasks */}
                            <View style={styles.taskPreviewContainer}>
                                {dayTodos.slice(0,3).map((todo)=>(
                                    <Pressable key={todo.id} styles={[styles.taskTinyLabel, {backgroundColor: todo.completed ? '#e2e8f0' : '#dcfce7'}]} onPress={()=>navigation.navigate('TaskDetails',{task:todo})}>
                                        <Text numberOfLines={1} style={styles.tinyTaskText}>{todo.title}</Text>
                                    </Pressable>
                                ))}
                            </View>
                        </Pressable>
                    );
                }}
                renderHeader={(date) => {
                const monthYear = date.toString('MMMM yyyy');
                    return (
                        <View>
                            <Text style={styles.customHeaderTitle}>{monthYear}</Text>
                        </View>
                    );
                }}
                theme={{
                    'stylesheet.calendar.main':{
                        week:{
                            marginTop:0,
                            marginBottom:0,
                            flexDirection:'row',
                            justifyContent:'space-around',
                            borderBottomWidth:1,
                            borderBottomColor:'#eee',
                        }
                    },
                    textDayHeaderFontSize: 12,
                }}  
            />
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            <StatusBar barStyle="dark-content"/>
            <View style={styles.topSection}>
                {/* Top Section */}
                <Pressable onPress={()=>navigation.goBack()} style={({pressed})=>[styles.backButton, pressed && styles.btnPressed]}>
                    <ChevronLeft size={24} color="black"/>
                </Pressable>
                <View style={styles.toolbtn}>
                    <Pressable onPress={()=>setCurrentLayout(currentLayout==='calendar' ? 'list' : 'calendar')}>
                        {currentLayout==='calendar' ? (<StretchHorizontal size={24} color="black"/>) : (<LayoutList size={24} color="black"/>)}
                    </Pressable>
                    <Pressable>
                        <Plus size={24} color="black"/>
                    </Pressable>
                </View>
            </View>
            {/* Layout */}
            {currentLayout==='calendar' ? (<RenderCalendar />) : (<RenderTodo/>)}
        </SafeAreaView>
    )
};

const styles=StyleSheet.create({
    container: {
        flex: 1,
        marginHorizontal: 10
    },
    backButton:{
        width:40,
        height:40,
        zIndex:10,
        backgroundColor:'rgba(168, 168, 168, 0.3)',
        padding:8,
        borderRadius:50,
        marginLeft:10,
    },
    toolbtn:{
        flexDirection:'row',
        backgroundColor:'rgba(168, 168, 168, 0.3)',
        paddingVertical:8,
        paddingHorizontal:15,
        borderRadius:20,
        gap:10,
    },
    topSection:{
        justifyContent:"space-between",
        flexDirection:'row',
        marginTop:15
    },
    calendar:{
        borderRadius:15,
        marginVertical:20,
        elevation:3,
        height:310
    },
    customHeaderTitle: {
        fontSize: 18,
        fontWeight: 'bold', 
        color: '#1f2937',
    },
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
    fullScreenCalendar:{
        width:'100%',
        minHeight:650,
        borderRadius:15,
        overflow:'hidden',
        borderWidth:1,
        borderColor:'#eee',
        marginVertical:20,
    },
    dayBox:{
        width:'100%',
        height:110,
        padding:5,
        borderRightWidth:1,
        borderRightColor:'#eee',
        backgroundColor:'white'
    },
    selectedBox:{
        backgroundColor:'#f0fdf4'
    },
    dayText:{
        fontSize:12,
        fontWeight:'bold',
        color:"#333",
        marginBottom:4,
    },
    disabledBox:{
        backgroundColor:'#f9f9f9'
    },
    todayText:{
        color:'#32750e',
    },
    taskPreviewContainer:{
        gap:2,
    },
    taskTinyLabel:{
        paddingHorizontal:4,
        paddingVertical:1,
        borderRadius:4,
    },
    tinyTaskText:{
        fontSize:9,
        color:'white',
        backgroundColor:'#166534',
        padding:1,
        borderRadius:5
    },
    btnPressed:{
        opacity:0.8,
        transform:[{scale:0.98}],
    }
});

export default Calendar;