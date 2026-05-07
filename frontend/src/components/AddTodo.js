import React, { useEffect, useState } from "react";
import { TextInput, 
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
    const year =date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

const AddTodo = ({ visible, setIsModalVisible, onCreated}) => {
    const today = new Date();
    const [title, setTitle] = useState("");
    const [isPhysical, setIsPhysical] = useState(false);
    const [isAllDay, setIsAllDay] = useState(false);
    const [startDateText, setStartDateText] = useState(formatDateInput(today));
    const [endDateText, setEndDateText] = useState(formatDateInput(today));
    const [description, setDescription] = useState("");

    useEffect(() => {
        if (isAllDay) {
            setEndDateText(startDateText);
        }
    }, [isAllDay, startDateText]);

    const handleSave = async () => {
        try {
            const startDate = new Date(`${startDateText}T00:00:00`);
            const endDate = new Date(`${endDateText}T00:00:00`);

            const payload = {
                title,
                description,
                type: isPhysical ? "workshop" : "normal",
                status: "pending",
                event_start_at: startDate.toISOString(),
            };

            await eventService.createEvent(payload);
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
                                <TextInput
                                    style={styles.valueInput}
                                    value={startDateText}
                                    onChangeText={setStartDateText}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor="grey"
                                    {...(Platform.OS === "web" ? {type: "date"} : {})}
                                />
                            </View>

                            <View style={styles.dateBox}>
                                <Text style={styles.dateLabel}>END</Text>
                                <TextInput
                                    style={styles.valueInput}
                                    value={endDateText}
                                    onChangeText={setEndDateText}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor="grey"
                                    {...(Platform.OS === "web" ? {type: "date"} : {})}
                                />
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