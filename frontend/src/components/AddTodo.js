import React, { useState } from "react";
import { TextInput, 
    Switch, 
    View, 
    Text, 
    StyleSheet, 
    Pressable, 
    SafeAreaView 
} from "react-native";
import { X, Check } from "lucide-react-native";
import ModalLayout from "./ModalLayout";
import { eventService } from "../services/eventService";

// FIND ALTERNATIVE FOR DATETIMEPICKER AND REPLACE PICK DATE AND TIME!

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
    const baseDate = toDateOrNow(initialEvent?.event_start_at);
    
    const [title, setTitle] = useState(initialEvent?.title || "");
    const [isPhysical, setIsPhysical] = useState(initialEvent?.type === "workshop");
    const [isAllDay, setIsAllDay] = useState(initialEvent?.is_all_day || false);
    const [startDateText, setStartDateText] = useState(formatDateInput(toDateOrNow(initialEvent?.event_end_at || initialEvent?.event_start_at)));
    const [endDateText, setEndDateText] = useState(formatDateInput(today));
    const [startTimeText, setStartTimeText] = useState(formatTimeInput(today));
    const [endTimeText, setEndTimeText] = useState(formatTimeInput(toDateOrNow(initialEvent?.event_end_at || initialEvent?.event_start_at)));
    const [description, setDescription] = useState(initialEvent?.description || "");

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
            window.alert("Title is required.");
            return;
        }
        
        try {
            const payload = {
                title,
                description,
                type: isPhysical ? "workshop" : "normal",
                status: initialEvent?.status || "pending",
                event_start_at: startDate.toISOString(),
                event_end_at: endDate.toISOString(),
                is_all_day: isAllDay,
            };

            if (initialEvent?.id) {
                await eventService.updateEvent(initialEvent.id, payload);
            } else {
                await eventService.createEvent(payload);
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

                        <Text style={styles.modalTitle}>New Task</Text>

                        {/* TODO: call api to POST todo */}
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
                        <View style={styles.dateTimeContainer}>
                            <View style={styles.dateBox}>
                                <Text style={styles.dateLabel}>START</Text>
                                <Pressable style={styles.valueBadge}>
                                    <Text style={styles.dateText}>{startDate.toDateString()}</Text>
                                </Pressable>
                            </View>

                            <View style={styles.dateBox}>
                                <Text style={styles.dateLabel}>END</Text>
                                <Pressable style={styles.valueBadge}>
                                    <Text style={styles.dateText}>{endDate.toDateString()}</Text>
                                </Pressable>
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
    dateTimeContainer: {
        flexDirection: "row",
        gap: 15,
        marginTop: 15,
    },
    dateBox: {
        flex: 1,
    },
    dateLabel: {
        fontSize: 10,
        color: "#999",
        fontWeight: "bold",
        marginBottom: 5,
    },
    valueBadge: {
        backgroundColor: "#f9f9f9",
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#eee",
    },
    dateText: {
        fontSize: 14,
        fontWeight: "bold",
    },
    descriptionInput: {
        backgroundColor: "#f9f9f9",
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        marginTop: 5,
        borderWidth: 1,
        borderColor: "#eee",
    }
});

export default AddTodo;