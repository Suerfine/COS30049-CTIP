import { Alert, View, Text, StyleSheet, ScrollView, Pressable, StatusBar, Modal, TextInput, Switch } from 'react-native';
import { useEffect, useState } from 'react'; 
import { SafeAreaView } from 'react-native-safe-area-context';
import { LayoutList, StretchHorizontal, ChevronLeft, Plus, ChevronRight, X, Check } from 'lucide-react-native';
import {Calendar as RNCalendar} from 'react-native-calendars'; 
import Checkbox from 'expo-checkbox';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';

// Import other hook and components
import { useUserDashboard } from '../hooks/useUserDashboard';
import SlidingTabs from '../components/SlidingTabs.js';
import { eventService } from '../services/eventService.js';

const toDateKey = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
};

const formatDisplayDate = (date) =>
    date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const formatDisplayTime = (date) =>
    date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

const Calendar=({ route,navigation })=>{
    const {t, i18n} = useTranslation();
    const layout = route.params?.layout ?? 'list';
    const [currentLayout, setCurrentLayout] = useState(layout);
    const [selectedDate, setSelectedDate] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const {
        events,
        filteredEvents,
        eventTab,
        setFilter,
        filter,
        toggleEvent,
        refreshData,
    } = useUserDashboard();
    
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isAllDay, setIsAllDay]=useState(false);
    const [isPhysical, setIsPhysical] = useState(false);

    const initialDate = selectedDate ? new Date(`${selectedDate}T09:00:00`) : new Date();
    const [startDate, setStartDate] = useState(initialDate);
    const [endDate, setEndDate] = useState(new Date(initialDate.getTime() + 60 * 60 * 1000));

    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);
    

    useEffect(() => {
        if (selectedDate && !isModalVisible) {
            const nextStart = new Date(`${selectedDate}T09:00:00`);
            const nextEnd = new Date(`${selectedDate}T10:00:00`);
            setStartDate(nextStart);
            setEndDate(nextEnd);
        }
    }, [selectedDate, isModalVisible]);

    useEffect(() => {
        if (route.params?.layout) {
            setCurrentLayout(route.params.layout);
        }
    }, [route.params?.layout]);

    useEffect(() => {
        if (isAllDay) {
            const normalizedStart = new Date(startDate);
            normalizedStart.setHours(0, 0, 0, 0);

            const normalizedEnd = new Date(normalizedStart);

            if (startDate.getTime() !== normalizedStart.getTime()) {
                setStartDate(normalizedStart);
            }

            if (endDate.getTime() !== normalizedEnd.getTime()) {
                setEndDate(normalizedEnd);
            }
        }
    }, [isAllDay, startDate, endDate]);

    const resetModal = () => {
        const base = selectedDate ? new Date(`${selectedDate}T09:00:00`) : new Date();
        const baseEnd = new Date(base.getTime() + 60 * 60 * 1000);

        setTitle('');
        setDescription('');
        setIsAllDay(false);
        setIsPhysical(false);
        setStartDate(base);
        setEndDate(baseEnd);
        setShowStartDatePicker(false);
        setShowEndDatePicker(false);
        setShowStartTimePicker(false);
        setShowEndTimePicker(false);
    };

    const closeModal = () => {
        setIsModalVisible(false);
        resetModal();
    };

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert("Title is required.");
            return;
        }

        if (endDate < startDate) {
            Alert.alert('End date cannot be earlier than start date.');
            return;
        }

        try {
            const payload = {
                title: title.trim(),
                description: description.trim(),
                type: isPhysical ? 'workshop' : 'normal',
                status: 'pending',
                event_start_at: startDate.toISOString(),
                event_end_at: endDate.toISOString(),
                is_all_day: isAllDay,
            };

            await eventService.createEvent(payload);
            await refreshData();
            closeModal();
        } catch (err) {
            console.error('Save event failed:', err);
        }
    };

    const getMarkedDates = () => {
        const marks = {};

        if (selectedDate) {
            marks[selectedDate] = {
                selected: true,
                selectedColor: '#32750e',
            };
        }

        events.forEach((event) => {
            const dateStr = toDateKey(event.event_start_at);
            if (!dateStr) return;

            marks[dateStr] = {
                ...marks[dateStr],
                marked: true,
                dotColor: '#32750e',
            };
        });

        return marks;
    };

    const renderTodo = () => {
        const displayEvents = selectedDate
            ? filteredEvents.filter((event) => toDateKey(event.event_start_at) === selectedDate)
            : filteredEvents;

        return (
            <>
<<<<<<< HEAD
                <RNCalendar
                    renderArrow={(direction) =>
                        direction === 'left' ? (
                            <ChevronLeft size={24} color="#32750e" />
                        ) : (
                            <ChevronRight size={24} color="#32750e" />
                        )
                    }
                    renderHeader={(date) => (
                        <View>
                            <Text style={styles.customHeaderTitle}>{date.toString('MMMM yyyy')}</Text>
                        </View>
                    )}
=======
            <RNCalendar
                renderArrow={(direction)=>(
                    direction==='left' ? <ChevronLeft size={24} color="#32750e"/> : <ChevronRight size={24} color="#32750e"/>
                )}
                renderHeader={(date) => {
                    const monthYear = new Date(date).toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                    });

                    return (
                        <View>
                            <Text style={styles.customHeaderTitle}>{monthYear}</Text>
                        </View>
                    );
                }}
>>>>>>> 13c8599e7fdfc6593c1ec46016ea8a0c3447b544
                    current={new Date().toISOString().split('T')[0]}
                    onDayPress={(day) => {
                        setSelectedDate((prev) => (prev === day.dateString ? '' : day.dateString));
                    }}
                    markedDates={getMarkedDates()}
                    theme={{
                        'stylesheet.calendar.main': {
                            dayContainer: { paddingVertical: 0 },
                            week: {
                                marginTop: 2,
                                marginBottom: 2,
                                flexDirection: 'row',
                                justifyContent: 'space-around',
                            },
                        },
                        backgroundColor: '#ffffff',
                        calendarBackground: '#ffffff',
                        textSectionTitleColor: '#b6c1cd',
                        selectedDayBackgroundColor: '#32750e',
                        selectedDayTextColor: '#ffffff',
                        todayTextColor: '#32750e',
                        arrowColor: '#32750e',
                        monthTextColor: '#1f2937',
                        indicatorColor: 'blue',
                        textDayFontWeight: 'bold',
                        textDayHeaderFontWeight: '300',
                        textDayFontSize: 16,
                        textMonthFontSize: 18,
                        textDayHeaderFontSize: 14,
                    }}
                    style={styles.calendar}
                />

                <View style={{ flex: 1, minHeight: 0 }}>
                    <View style={styles.todoList}>
                        <View style={styles.todoHeader}>
                            <Text style={styles.todoListTitle}>{t('todo list')}</Text>
                        </View>

                        <SlidingTabs tabs={eventTab} activeTab={filter} onTabChange={(id) => setFilter(id)} />

                        <ScrollView showsVerticalScrollIndicator indicatorStyle="white">
                            {displayEvents.length === 0 ? (
                                <Text>No events</Text>
                            ) : (
                                displayEvents.map((event) => (
                                    <Pressable
                                        key={event.id}
                                        style={styles.todoItem}
                                        onPress={() => navigation.navigate('TaskDetails', { task: event })}
                                    >
                                        <View style={styles.todoRow}>
                                            <Checkbox
                                                value={event.status === 'completed'}
                                                onValueChange={() => toggleEvent(event.id)}
                                            />
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.todoTitle}>{event.title}</Text>
                                                <Text style={styles.todoCourse}>
                                                    {event.type} - {toDateKey(event.event_start_at)}
                                                </Text>
                                            </View>
                                            <ChevronRight size={20} />
                                        </View>
                                    </Pressable>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </View>
            </>
        );
    };

    const renderCalendar = () => {
        return (
            <RNCalendar
                renderArrow={(direction) =>
                    direction === 'left' ? (
                        <ChevronLeft size={24} color="#32750e" />
                    ) : (
                        <ChevronRight size={24} color="#32750e" />
                    )
                }
                style={styles.fullScreenCalendar}
                dayComponent={({ date, state }) => {
                    const dayEvents = events.filter(
                        (event) => toDateKey(event.event_start_at) === date.dateString
                    );

                    return (
                        <Pressable
                            onPress={() => setSelectedDate(date.dateString)}
                            style={[
                                styles.dayBox,
                                state === 'disabled' ? styles.disabledBox : null,
                                selectedDate === date.dateString && styles.selectedBox,
                            ]}
                        >
                            <Text style={[styles.dayText, state === 'today' && styles.todayText]}>
                                {date.day}
                            </Text>

                            <View style={styles.taskPreviewContainer}>
                                {dayEvents.slice(0, 3).map((event) => (
                                    <Pressable
                                        key={event.id}
                                        style={[
                                            styles.taskTinyLabel,
                                            {
                                                backgroundColor:
                                                    event.status === 'completed' ? '#e2e8f0' : '#dcfce7',
                                            },
                                        ]}
                                        onPress={() => navigation.navigate('TaskDetails', { task: event })}
                                    >
                                        <Text numberOfLines={1} style={styles.tinyTaskText}>
                                            {event.title}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </Pressable>
                    );
                }}
<<<<<<< HEAD
                renderHeader={(date) => (
                    <View>
                        <Text style={styles.customHeaderTitle}>{date.toString('MMMM yyyy')}</Text>
                    </View>
                )}
=======
                renderHeader={(date) => {
                    const monthYear = new Date(date).toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                    });

                    return (
                        <View>
                            <Text style={styles.customHeaderTitle}>{monthYear}</Text>
                        </View>
                    );
                }}
>>>>>>> 13c8599e7fdfc6593c1ec46016ea8a0c3447b544
                theme={{
                    'stylesheet.calendar.main': {
                        week: {
                            marginTop: 0,
                            marginBottom: 0,
                            flexDirection: 'row',
                            justifyContent: 'space-around',
                            borderBottomWidth: 1,
                            borderBottomColor: '#eee',
                        },
                    },
                    textDayHeaderFontSize: 12,
                }}
            />
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            <StatusBar barStyle="dark-content" />
            <ScrollView>
                <View style={styles.topSection}>
                    <Pressable
                        onPress={() => navigation.goBack()}
                        style={({ pressed }) => [styles.backButton, pressed && styles.btnPressed]}
                    >
                        <ChevronLeft size={24} color="black" />
                    </Pressable>

                    <View style={styles.toolbtn}>
                        <Pressable
                            onPress={() =>
                                setCurrentLayout(currentLayout === 'calendar' ? 'list' : 'calendar')
                            }
                        >
                            {currentLayout === 'calendar' ? (
                                <StretchHorizontal size={24} color="black" />
                            ) : (
                                <LayoutList size={24} color="black" />
                            )}
                        </Pressable>

                        <Pressable onPress={() => setIsModalVisible(true)}>
                            <Plus size={24} color="black" />
                        </Pressable>
                    </View>
                </View>

                {currentLayout === 'calendar' ? renderCalendar() : renderTodo()}
            </ScrollView>

            <Modal
                animationType="slide"
                transparent
                visible={isModalVisible}
                onRequestClose={closeModal}
            >
                <View style={styles.fullModalOverlay}>
                    <View style={styles.fullModalContent}>
                        <View style={styles.modalHeader}>
                            <Pressable
                                onPress={closeModal}
                                style={({ pressed }) => [styles.backButton, pressed && styles.btnPressed]}
                            >
                                <X size={24} />
                            </Pressable>

                            <Text style={styles.modalTitle}>New Event</Text>

                            <Pressable
                                onPress={handleSave}
                                style={({ pressed }) => [styles.backButton, pressed && styles.btnPressed]}
                            >
                                <Check size={24} />
                            </Pressable>
                        </View>

                        <View style={styles.inputText}>
                            <TextInput
                                style={styles.input}
                                placeholder="Title:"
                                placeholderTextColor="#8f8f8f"
                                value={title}
                                onChangeText={setTitle}
                            />

                            <View style={styles.formRow}>
                                <Text style={styles.label}>Physical Workshop</Text>
                                <Switch
                                    trackColor={{ false: '#767577', true: '#32750e' }}
                                    thumbColor={isPhysical ? '#fff' : '#f4f3f4'}
                                    onValueChange={setIsPhysical}
                                    value={isPhysical}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <View style={styles.formRow}>
                                    <Text style={styles.label}>All-day</Text>
                                    <Switch
                                        trackColor={{ false: '#767577', true: '#32750e' }}
                                        thumbColor={isAllDay ? '#fff' : '#f4f3f4'}
                                        onValueChange={setIsAllDay}
                                        value={isAllDay}
                                    />
                                </View>

                                <View style={styles.divider} />

                                <View style={styles.formRow}>
                                    <Text style={styles.label}>Starts</Text>
                                    <View style={styles.dateTimeValues}>
                                        <Pressable
                                            style={styles.valueBadge}
                                            onPress={() => setShowStartDatePicker(true)}
                                        >
                                            <Text style={styles.valueText}>{formatDisplayDate(startDate)}</Text>
                                        </Pressable>

                                        {!isAllDay && (
                                            <Pressable
                                                style={styles.valueBadge}
                                                onPress={() => setShowStartTimePicker(true)}
                                            >
                                                <Text style={styles.valueText}>{formatDisplayTime(startDate)}</Text>
                                            </Pressable>
                                        )}
                                    </View>
                                </View>

                                <View style={styles.divider} />

                                <View style={styles.formRow}>
                                    <Text style={styles.label}>Ends</Text>
                                    <View style={styles.dateTimeValues}>
                                        <Pressable
                                            style={styles.valueBadge}
                                            onPress={() => setShowEndDatePicker(true)}
                                        >
                                            <Text style={styles.valueText}>{formatDisplayDate(endDate)}</Text>
                                        </Pressable>

                                        {!isAllDay && (
                                            <Pressable
                                                style={styles.valueBadge}
                                                onPress={() => setShowEndTimePicker(true)}
                                            >
                                                <Text style={styles.valueText}>{formatDisplayTime(endDate)}</Text>
                                            </Pressable>
                                        )}
                                    </View>
                                </View>
                            </View>

                            <TextInput
                                multiline
                                style={[styles.input, styles.descInput]}
                                placeholder="Description (optional):"
                                placeholderTextColor="#8f8f8f"
                                value={description}
                                onChangeText={setDescription}
                            />
                        </View>
                    </View>
                </View>

                {showStartDatePicker && (
                    <DateTimePicker
                        value={startDate}
                        mode="date"
                        display="default"
                        onChange={(_, selected) => {
                            setShowStartDatePicker(false);
                            if (selected) {
                                const next = new Date(startDate);
                                next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
                                setStartDate(next);
                                if (endDate < next) {
                                    setEndDate(new Date(next));
                                }
                            }
                        }}
                    />
                )}

                {showEndDatePicker && (
                    <DateTimePicker
                        value={endDate}
                        mode="date"
                        display="default"
                        onChange={(_, selected) => {
                            setShowEndDatePicker(false);
                            if (selected) {
                                const next = new Date(endDate);
                                next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());

                                if (next < startDate) {
                                    setEndDate(new Date(startDate));
                                } else {
                                    setEndDate(next);
                                }
                            }
                        }}
                    />
                )}

                {showStartTimePicker && !isAllDay && (
                    <DateTimePicker
                        value={startDate}
                        mode="time"
                        display="default"
                        onChange={(_, selected) => {
                            setShowStartTimePicker(false);
                            if (selected) {
                                const next = new Date(startDate);
                                next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
                                setStartDate(next);

                                if (endDate < next) {
                                    setEndDate(next);
                                }
                            }
                        }}
                    />
                )}

                {showEndTimePicker && !isAllDay && (
                    <DateTimePicker
                        value={endDate}
                        mode="time"
                        display="default"
                        onChange={(_, selected) => {
                            setShowEndTimePicker(false);
                            if (selected) {
                                const next = new Date(endDate);
                                next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
                                if (next < startDate) {
                                    setEndDate(new Date(startDate));
                                } else {
                                    setEndDate(next);
                                }
                            }
                        }}
                    />
                )}
            </Modal>
        </SafeAreaView>
    );
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
    },
    fullModalOverlay:{
        justifyContent:'flex-end',
        flex:1
    },
    fullModalContent:{
        height:'93%',
        backgroundColor:'#f2f2f7',
        borderTopLeftRadius:30,
        borderTopRightRadius:30,
        overflow:'hidden',
    },
    modalTitle:{
        fontSize:17,
        fontWeight:'600',
    },
    modalHeader:{
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems:'center',
        padding:16,
        backgroundColor:'#fff',
        borderBottomWidth:1,
        borderBottomColor:"#e5e5e5"
    },
    input: {
        backgroundColor: 'white',
        borderRadius: 15,
        paddingHorizontal: 15,
        paddingVertical: 10,
        fontSize: 16,
        color: '#000',
    },
    inputText:{
        marginTop:10,
        paddingHorizontal:20,
    },
    formGroup: {
        backgroundColor: '#fff',
        borderRadius: 10,
        marginVertical: 10,
        overflow: 'hidden',
    },
    formRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor:'white',
        borderRadius:20,
        marginTop:10
    },
    label: {
        fontSize: 17,
        color: '#000',
    },
    dateTimeValues: {
        flexDirection: 'row',
        gap: 8,
    },
    valueBadge: {
        backgroundColor: '#F2F2F7',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
    },
    valueText: {
        fontSize: 15,
        color: '#166534', 
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E5E5',
        marginLeft: 16, 
    },
    descInput:{
        height:200,
        textAlignVertical: 'top', 
        paddingTop:15
    }
});

export default Calendar;
