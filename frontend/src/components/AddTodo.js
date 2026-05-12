import React, { useEffect, useState } from "react";
import { Alert,
    TextInput, 
    Switch, 
    View, 
    Text, 
    StyleSheet, 
    Pressable, 
    Platform
} from "react-native";
import { X, Check } from "lucide-react-native";
import ModalLayout from "./ModalLayout";
import { eventService } from "../services/eventService";

const formatDateInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const formatTimeInput = (date) => {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
}

const toDateOrNow = (value) => {
    const parsed = value ? new Date(value) : new Date();
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const AddTodo = ({ visible, setIsModalVisible, onCreated, initialEvent = null }) => {
    const today = new Date();

    const [title, setTitle] = useState("");
    const [isPhysical, setIsPhysical] = useState(false);
    const [isAllDay, setIsAllDay] = useState(false);
    const [startDateText, setStartDateText] = useState(formatDateInput(today));
    const [endDateText, setEndDateText] = useState(formatDateInput(today));
    const [startTimeText, setStartTimeText] = useState(formatTimeInput(today));
    const [endTimeText, setEndTimeText] = useState(formatTimeInput(today));
    const [description, setDescription] = useState("");

    useEffect(() => {
        if (isAllDay) {
            setEndDateText(startDateText);
        }
    }, [isAllDay, startDateText]);

    useEffect(() => {
        const start = toDateOrNow(initialEvent?.event_start_at);
        const end = toDateOrNow(initialEvent?.event_end_at || initialEvent?.event_start_at);

        setTitle(initialEvent?.title || "");
        setIsPhysical(initialEvent?.type === "workshop");
        setIsAllDay(initialEvent?.is_all_day || false);
        setStartDateText(formatDateInput(start));
        setEndDateText(formatDateInput(end));
        setStartTimeText(formatTimeInput(start));
        setEndTimeText(formatTimeInput(end));
        setDescription(initialEvent?.description || "");
    }, [initialEvent, visible]);

    const handleSave = async () => {
        if (!title.trim()) {
            if (Platform.OS === "web") {
                window.alert("Title is required.");
            } else {
                Alert.alert("Title is required.");
            }
            return;
        }
        
        try {
             const startDate = new Date(
                isAllDay
                    ? `${startDateText}T00:00:00`
                    : `${startDateText}T${startTimeText}:00`
            );

            const endDate = new Date(
                isAllDay
                    ? `${endDateText}T00:00:00`
                    : `${endDateText}T${endTimeText}:00`
            );

            if (endDate < startDate) {
                if (Platform.OS === "web") {
                    window.alert("End date must be later than start date.");
                } else {
                    Alert.alert("End date must be later than start date.");
                }
                return;
            }

            const payload = {
                title: title.trim(),
                description: description.trim(),
                type: isPhysical ? "workshop" : "normal",
                event_start_at: startDate.toISOString(),
                event_end_at: endDate.toISOString(),
                is_all_day: isAllDay,
            };

            if (initialEvent?.id) {
                await eventService.updateEvent(initialEvent.id, payload);
            } else {
                await eventService.createEvent({
                    ...payload,
                    status: "pending",
                });           
            }

            if (onCreated) {
                await onCreated();
            }
            setIsModalVisible(false);
        } catch (err) {
            console.error("Save event failed:", err);
        }
    };


    return (
        <ModalLayout visible={visible} onClose={() => setIsModalVisible(false)}>
            <View style={styles.container}>
                <View style={styles.fullModalContent}>
                    
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <Pressable onPress={() => setIsModalVisible(false)} style={styles.iconBtn}>
                            <X size={24} />
                        </Pressable>

                        <Text style={styles.modalTitle}>
                            {initialEvent ? "Edit Event" : "New Event"}
                        </Text>

                        <Pressable style={styles.saveBtn} onPress={handleSave}>
                            <Check size={24} color="white"/>
                        </Pressable>
                    </View>

                    {/* Form Body */}
                    <View style={styles.formBody}>
                        <Text style={styles.label}>What needs to be done?</Text>
                        <TextInput
                            style={styles.titleInput}
                            placeholder="Task title goes here.."
                            placeholderTextColor="grey"
                            value={title}
                            onChangeText={setTitle}
                        />

                        <View style={styles.divider} />

                        {/* Switches */}
                        <View style={styles.formRow}>
                            <View style={styles.rowLabelGroup}>
                                <Text style={styles.rowLabel}>Physical Workshop</Text>
                            </View>
                            <Switch 
                                value={isPhysical} 
                                onValueChange={setIsPhysical}
                                trackColor={{ false: "#ddd", true: "#2f6618fe" }}
                            />
                        </View>

                        <View style={styles.formRow}>
                            <Text style={styles.rowLabel}>All Day</Text>
                            <Switch 
                                value={isAllDay} 
                                onValueChange={setIsAllDay}
                                trackColor={{ false: "#ddd", true: "#2f6618fe" }}
                            />
                        </View>

                        {/* Dates */}
                        <View style={styles.scheduleSection}>
                            <View style={styles.scheduleHeaderRow}>
                                <Text style={styles.scheduleHeader}>Starts</Text>
                                <Text style={styles.scheduleHeader}>Ends</Text>
                            </View>

                            <View style={styles.scheduleInputRow}>
                                <View style={styles.scheduleColumn}>
                                    <View style={styles.inputGroup}>
                                        <TextInput
                                            style={[styles.valueInput, styles.dateInput]}
                                            value={startDateText}
                                            onChangeText={setStartDateText}
                                            placeholder="YYYY-MM-DD"
                                            placeholderTextColor="grey"
                                            {...(Platform.OS === "web" ? { type: "date" } : {})}
                                        />
                                        {!isAllDay && (
                                            <TextInput
                                                style={[styles.valueInput, styles.timeInput]}
                                                value={startTimeText}
                                                onChangeText={setStartTimeText}
                                                placeholder="HH:mm"
                                                placeholderTextColor="grey"
                                                {...(Platform.OS === "web" ? { type: "time" } : {})}
                                            />
                                        )}
                                    </View>
                                </View>

                                <View style={styles.scheduleColumn}>
                                    <View style={styles.inputGroup}>
                                        <TextInput
                                            style={[styles.valueInput, styles.dateInput]}
                                            value={endDateText}
                                            onChangeText={setEndDateText}
                                            placeholder="YYYY-MM-DD"
                                            placeholderTextColor="grey"
                                            editable={!isAllDay}
                                            {...(Platform.OS === "web" ? { type: "date" } : {})}
                                        />
                                        {!isAllDay && (
                                            <TextInput
                                                style={[styles.valueInput, styles.timeInput]}
                                                value={endTimeText}
                                                onChangeText={setEndTimeText}
                                                placeholder="HH:mm"
                                                placeholderTextColor="grey"
                                                {...(Platform.OS === "web" ? { type: "time" } : {})}
                                            />
                                        )}
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Description */}
                        <Text style={[styles.label, { marginTop: 20 }]}>Description</Text>
                        <TextInput
                            multiline
                            numberOfLines={4}
                            style={styles.descriptionInput}
                            placeholder="Add more details here..."
                            placeholderTextColor="grey"
                            value={description}
                            onChangeText={setDescription}
                        />
                    </View>
                </View>
            </View>
        </ModalLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    fullModalContent: {
        flex: 1,
        paddingHorizontal: 25,
        paddingVertical: 10,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 15,
        marginBottom: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
    },
    saveBtn: {
        backgroundColor: "#2f6618fe",
        padding: 8,
        borderRadius: 12,
    },
    iconBtn: {
        padding: 5,
    },
    formBody: {
        marginTop: 10,
    },
    label: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#2f6618fe",
        letterSpacing: 1,
        marginBottom: 8,
    },
    titleInput: {
        fontSize: 24,
        paddingVertical: 10,
        backgroundColor: "#f9f9f9",
        paddingVertical: 20,
        paddingHorizontal: 10,
    },
    divider: {
        height: 1,
        backgroundColor: "#eee",
        marginVertical: 15,
    },
    formRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
    },
    rowLabel: {
        fontSize: 16,
        fontWeight: "bold",
    },
    scheduleSection: {
        marginTop: 15,
        gap: 8,
    },
    scheduleHeaderRow: {
        flexDirection: "row",
        gap: 15,
    },
    scheduleHeader: {
        flex: 1,
        fontSize: 16,
        color: "#000",
        fontWeight: "bold",
    },
    scheduleInputRow: {
        flexDirection: "row",
        gap: 15,
    },
    scheduleColumn: {
        flex: 1,
    },
    inputGroup: {
        flexDirection: "row",
        gap: 10,
    },
    valueInput: {
        backgroundColor: "#f9f9f9",
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#eee",
        fontSize: 14,
    },
    dateInput: {
        flex: 1,
    },
    timeInput: {
        width: 80,
        flexShrink: 0,
    },
    descriptionInput: {
        backgroundColor: "#f9f9f9",
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        marginTop: 5,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#eee",
    }
});

export default AddTodo;