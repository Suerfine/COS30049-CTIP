import { View, Text, StyleSheet, ScrollView, Pressable, StatusBar, Modal, TextInput, Switch, Alert } from 'react-native';
import { useEffect, useState, useCallback } from 'react'; 
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
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
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
};

const Calendar = ({ route, navigation }) => {
    const { t, i18n } = useTranslation();
    const layout = route.params?.layout ?? 'list';

    const [currentLayout, setCurrentLayout] = useState(layout);
    const [selectedDate, setSelectedDate] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);

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
    const [isPhysical, setIsPhysical] = useState(false);
    const [isAllDay, setIsAllDay] = useState(false);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());

    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);

    useEffect(() => {
        if (route.params?.layout) {
            setCurrentLayout(route.params.layout);
        }
    }, [route.params?.layout]);

    useEffect(() => {
        if (!selectedDate || isModalVisible) return; 

        const baseDate = new Date(selectedDate);
        const start = new Date(baseDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(baseDate);
        end.setHours(0, 0, 0, 0);

        setStartDate(start);
        setEndDate(end);
    }, [selectedDate, isModalVisible]);
    
    const clampEndDate = (candidateEnd, baseStart = startDate) => {
        if (candidateEnd.getTime() < baseStart.getTime()) {
            return new Date(baseStart);
        }
        return candidateEnd;
    };

    const formatDateLabel = (date) =>
        date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });

    const formatTimeLabel = (date) =>
        date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });

    
    useEffect(() => {
        if (isAllDay) {
            const syncedStart = new Date(startDate);
            syncedStart.setHours(0, 0, 0, 0);

            const syncedEnd = new Date(syncedStart);
            setStartDate(syncedStart);
            setEndDate(syncedEnd);
        }
    }, [isAllDay]);

    const resetModalForm = (event = null) => {
        if (event) {
            const eventStart = new Date(event.event_start_at);
            const eventEnd = new Date(event.event_end_at || event.event_start_at);

            setTitle(event.title || '');
            setDescription(event.description || '');
            setIsPhysical(event.type === 'workshop');
            setIsAllDay(!!event.is_all_day);
            setStartDate(eventStart);
            setEndDate(eventEnd);
            return;
        }

        const baseDate = selectedDate ? new Date(selectedDate) : new Date();

        const start = new Date(baseDate);
        start.setHours(9, 0, 0, 0);

        const end = new Date(baseDate);
        end.setHours(10, 0, 0, 0);

        setTitle('');
        setDescription('');
        setIsPhysical(false);
        setIsAllDay(false);
        setStartDate(start);
        setEndDate(end);
    };

    const openCreateModal = () => {
        setEditingEvent(null);
        resetModalForm();
        setIsModalVisible(true);
    };

    const openEditModal = (event) => {
        setEditingEvent(event);
        resetModalForm(event);
        setIsModalVisible(true);
    };

    const closeModal = () => {
        setIsModalVisible(false);
        setEditingEvent(null);
        setShowStartDatePicker(false);
        setShowEndDatePicker(false);
        setShowStartTimePicker(false);
        setShowEndTimePicker(false);
    };

    const handleToggleAllDay = (value) => {
        setIsAllDay(value);

        if (value) {
            const syncedStart = new Date(startDate);
            syncedStart.setHours(0, 0, 0, 0);

            setStartDate(syncedStart);
            setEndDate(new Date(syncedStart));
        }
    };

    const onChangeStartDate = (_, selected) => {
        setShowStartDatePicker(false);
        if (!selected) return;

        const updatedStart = new Date(startDate);
        updatedStart.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
        setStartDate(updatedStart);

        if (isAllDay) {
            const syncedEnd = new Date(updatedStart);
            syncedEnd.setHours(0, 0, 0, 0);
            setEndDate(syncedEnd);
            return;
        }

        setEndDate((currentEnd) => clampEndDate(new Date(currentEnd), updatedStart));
    };

    const onChangeEndDate = (_, selected) => {
        setShowEndDatePicker(false);
        if (!selected || isAllDay) return;

        const updatedEnd = new Date(endDate);
        updatedEnd.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
        setEndDate(clampEndDate(updatedEnd, startDate));
    };

    const onChangeStartTime = (_, selected) => {
        setShowStartTimePicker(false);
        if (!selected) return;

        const updatedStart = new Date(startDate);
        updatedStart.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
        setStartDate(updatedStart);

        setEndDate((currentEnd) => clampEndDate(new Date(currentEnd), updatedStart));
    };

    const onChangeEndTime = (_, selected) => {
        setShowEndTimePicker(false);
        if (!selected) return;

        const updatedEnd = new Date(endDate);
        updatedEnd.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
        setEndDate(clampEndDate(updatedEnd, startDate));
    };

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert('Validation', 'Title is required.');
            return;
        }

        try {
            let finalStart = new Date(startDate);
            let finalEnd = new Date(endDate);

            if (isAllDay) {
                finalStart.setHours(0, 0, 0, 0);
                finalEnd = new Date(finalStart);
            } else if (finalEnd.getTime() < finalStart.getTime()) {
                Alert.alert('Validation', 'End date must be later than start date.');
                return;
            }

            const payload = {
                title: title.trim(),
                description: description.trim(),
                type: isPhysical ? 'workshop' : 'normal',
                event_start_at: finalStart.toISOString(),
                event_end_at: finalEnd.toISOString(),
                is_all_day: isAllDay,
            };

            if (editingEvent?.id) {
                await eventService.updateEvent(editingEvent.id, payload);
            } else {
                await eventService.createEvent({
                    ...payload,
                    status: 'pending',
                });
            }

            await refreshData();
            closeModal();
        } catch (error) {
            console.error('Save event failed:', error);
            Alert.alert('Error', typeof error === 'string' ? error : 'Unable to save task.');
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

    const RenderTodo = () => {
        const displayEvents = selectedDate
            ? filteredEvents.filter((event) => toDateKey(event.event_start_at) === selectedDate)
            : filteredEvents;

        return (
            <>
                <RNCalendar
                    renderArrow={(direction) =>
                        direction === 'left'
                            ? <ChevronLeft size={24} color="#32750e" />
                            : <ChevronRight size={24} color="#32750e" />
                    }
                    renderHeader={(date) => (
                        <View>
                            <Text style={styles.customHeaderTitle}>{date.toString('MMMM yyyy')}</Text>
                        </View>
                    )}
                    current={new Date().toISOString().split('T')[0]}
                    onDayPress={(day) => {
                        setSelectedDate(selectedDate === day.dateString ? '' : day.dateString);
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
                                <Text>No todos</Text>
                            ) : (
                                displayEvents.map((event) => (
                                    <Pressable
                                        key={event.id}
                                        style={styles.todoItem}
                                        onPress={() => openEditModal(event)}
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

    const RenderCalendar = () => {
        return (
            <RNCalendar
                renderArrow={(direction) =>
                    direction === 'left'
                        ? <ChevronLeft size={24} color="#32750e" />
                        : <ChevronRight size={24} color="#32750e" />
                }
                style={styles.fullScreenCalendar}
                dayComponent={({ date, state }) => {
                    const dayTodos = events.filter(
                        (event) => toDateKey(event.event_start_at) === date.dateString
                    );

                    return (
                        <Pressable
                            onPress={() => setSelectedDate(date.dateString)}
                            style={[
                                styles.dayBox,
                                state === 'disabled' && styles.disabledBox,
                                selectedDate === date.dateString && styles.selectedBox,
                            ]}
                        >
                            <Text style={[styles.dayText, state === 'today' && styles.todayText]}>
                                {date.day}
                            </Text>

                            <View style={styles.taskPreviewContainer}>
                                {dayTodos.slice(0, 3).map((event) => (
                                    <Pressable
                                        key={event.id}
                                        style={[
                                            styles.taskTinyLabel,
                                            { backgroundColor: event.status === 'completed' ? '#e2e8f0' : '#dcfce7' },
                                        ]}
                                        onPress={() => openEditModal(event)}
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
                renderHeader={(date) => (
                    <View>
                        <Text style={styles.customHeaderTitle}>{date.toString('MMMM yyyy')}</Text>
                    </View>
                )}
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
                        <Pressable onPress={() => setCurrentLayout(currentLayout === 'calendar' ? 'list' : 'calendar')}>
                            {currentLayout === 'calendar'
                                ? <StretchHorizontal size={24} color="black" />
                                : <LayoutList size={24} color="black" />}
                        </Pressable>
                        <Pressable onPress={openCreateModal}>
                            <Plus size={24} color="black" />
                        </Pressable>
                    </View>
                </View>

                {currentLayout === 'calendar' ? <RenderCalendar /> : <RenderTodo />}
            </ScrollView>

            <Modal animationType="slide" transparent visible={isModalVisible} onRequestClose={closeModal}>
                <View style={styles.fullModalOverlay}>
                    <View style={styles.fullModalContent}>
                        <View style={styles.modalHeader}>
                            <Pressable
                                onPress={closeModal}
                                style={({ pressed }) => [styles.backButton, pressed && styles.btnPressed]}
                            >
                                <X size={24} />
                            </Pressable>

                            <Text style={styles.modalTitle}>
                                {editingEvent ? 'Edit Task' : 'New Task'}
                            </Text>

                            <Pressable
                                onPress={handleSave}
                                style={({ pressed }) => [styles.backButton, pressed && styles.btnPressed]}
                            >
                                <Check size={24} />
                            </Pressable>
                        </View>

                        <ScrollView contentContainerStyle={styles.inputText}>
                            <TextInput
                                style={styles.input}
                                placeholder="Title"
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
                                        onValueChange={handleToggleAllDay}
                                        value={isAllDay}
                                    />
                                </View>

                                <View style={styles.divider} />

                                <View style={styles.formRow}>
                                    <Text style={styles.label}>Starts</Text>
                                    <View style={styles.dateTimeValues}>
                                        <Pressable style={styles.valueBadge} onPress={() => setShowStartDatePicker(true)}>
                                            <Text style={styles.valueText}>{formatDateLabel(startDate)}</Text>
                                        </Pressable>
                                        {!isAllDay && (
                                            <Pressable style={styles.valueBadge} onPress={() => setShowStartTimePicker(true)}>
                                                <Text style={styles.valueText}>{formatTimeLabel(startDate)}</Text>
                                            </Pressable>
                                        )}
                                    </View>
                                </View>

                                <View style={styles.divider} />

                                <View style={styles.formRow}>
                                    <Text style={styles.label}>Ends</Text>
                                    <View style={styles.dateTimeValues}>
                                        <Pressable
                                            style={[styles.valueBadge, isAllDay && styles.disabledBadge]}
                                            onPress={() => !isAllDay && setShowEndDatePicker(true)}
                                            disabled={isAllDay}
                                        >
                                            <Text style={styles.valueText}>{formatDateLabel(endDate)}</Text>
                                        </Pressable>
                                        {!isAllDay && (
                                            <Pressable style={styles.valueBadge} onPress={() => setShowEndTimePicker(true)}>
                                                <Text style={styles.valueText}>{formatTimeLabel(endDate)}</Text>
                                            </Pressable>
                                        )}
                                    </View>
                                </View>
                            </View>

                            <TextInput
                                multiline
                                style={[styles.input, styles.descInput]}
                                placeholder="Description (optional)"
                                placeholderTextColor="#8f8f8f"
                                value={description}
                                onChangeText={setDescription}
                            />
                        </ScrollView>

                        {showStartDatePicker && (
                            <DateTimePicker
                                value={startDate}
                                mode="date"
                                display="default"
                                onChange={onChangeStartDate}
                            />
                        )}

                        {showEndDatePicker && (
                            <DateTimePicker
                                value={endDate}
                                mode="date"
                                display="default"
                                onChange={onChangeEndDate}
                            />
                        )}

                        {showStartTimePicker && (
                            <DateTimePicker
                                value={startDate}
                                mode="time"
                                display="default"
                                onChange={onChangeStartTime}
                            />
                        )}

                        {showEndTimePicker && (
                            <DateTimePicker
                                value={endDate}
                                mode="time"
                                display="default"
                                onChange={onChangeEndTime}
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginHorizontal: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        zIndex: 10,
        backgroundColor: 'rgba(168, 168, 168, 0.3)',
        padding: 8,
        borderRadius: 50,
        marginLeft: 10,
    },
    toolbtn: {
        flexDirection: 'row',
        backgroundColor: 'rgba(168, 168, 168, 0.3)',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        gap: 10,
    },
    topSection: {
        justifyContent: 'space-between',
        flexDirection: 'row',
        marginTop: 15,
    },
    calendar: {
        borderRadius: 15,
        marginVertical: 20,
        elevation: 3,
        height: 310,
    },
    customHeaderTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    todoList: {
        flex: 1,
        backgroundColor: '#8ed2a944',
        borderRadius: 10,
        padding: 15,
    },
    todoListTitle: {
        fontSize: 17,
        marginBottom: 10,
        fontWeight: 'bold',
    },
    todoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    todoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    todoItem: {
        paddingVertical: 15,
        paddingHorizontal: 13,
        borderRadius: 10,
        marginVertical: 6,
        marginRight: 10,
        backgroundColor: 'white',
    },
    todoTitle: {
        fontSize: 16,
        marginLeft: 3,
    },
    todoCourse: {
        color: '#888888',
        fontSize: 12,
        marginLeft: 3,
    },
    fullScreenCalendar: {
        width: '100%',
        minHeight: 650,
        borderRadius: 15,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#eee',
        marginVertical: 20,
    },
    dayBox: {
        width: '100%',
        height: 110,
        padding: 5,
        borderRightWidth: 1,
        borderRightColor: '#eee',
        backgroundColor: 'white',
    },
    selectedBox: {
        backgroundColor: '#f0fdf4',
    },
    dayText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    disabledBox: {
        backgroundColor: '#f9f9f9',
    },
    todayText: {
        color: '#32750e',
    },
    taskPreviewContainer: {
        gap: 2,
    },
    taskTinyLabel: {
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 4,
    },
    tinyTaskText: {
        fontSize: 9,
        color: 'white',
        backgroundColor: '#166534',
        padding: 1,
        borderRadius: 5,
    },
    fullModalOverlay: {
        justifyContent: 'flex-end',
        flex: 1,
    },
    fullModalContent: {
        height: '93%',
        backgroundColor: '#f2f2f7',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        overflow: 'hidden',
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '600',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5',
    },
    input: {
        backgroundColor: 'white',
        borderRadius: 15,
        paddingHorizontal: 15,
        paddingVertical: 10,
        fontSize: 16,
        color: '#000',
    },
    inputText: {
        marginTop: 10,
        paddingHorizontal: 20,
        paddingBottom: 28,
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
        backgroundColor: 'white',
        borderRadius: 20,
        marginTop: 10,
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
    disabledBadge: {
        opacity: 0.5,
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E5E5',
        marginLeft: 16,
    },
    descInput: {
        height: 200,
        textAlignVertical: 'top',
        paddingTop: 15,
        marginBottom: 20,
    },
    btnPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
});

export default Calendar;
