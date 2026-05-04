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

// FIND ALTERNATIVE FOR DATETIMEPICKER AND REPLACE PICK DATE AND TIME!

const AddTodo = ({ visible, setIsModalVisible }) => {
    const [isAllDay, setIsAllDay] = useState(false);
    const [isPhysical, setIsPhysical] = useState(false);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());

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
                        <Pressable style={styles.saveBtn}>
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
        backgroundColor: "#efab21",
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
        color: "#efab21",
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