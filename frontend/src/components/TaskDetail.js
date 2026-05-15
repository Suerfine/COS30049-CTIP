import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useState } from 'react';
import { ChevronLeft, CheckCircle, Circle, Calendar, Clock, BookOpen, SquarePen, Check } from 'lucide-react-native';
import { TextInput } from 'react-native-gesture-handler';
import ModalLayout from './ModalLayout';

const TaskDetail = ({ route, navigation }) => {
    const {task}=route.params;
    const [isEditing, setIsEditing] = useState(false);
    const [editedTask, setEditedTask] = useState({ ...task });

    const handleSave = () => {
        setIsEditing(false);
        // TODO: call api to PUT todo information
    }

    return (
        <View style={styles.container}>
            {/* Top */}
            <View style={styles.topSection}>
                <Pressable onPress={()=> navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={24} />
                </Pressable>

                <Pressable onPress={() => setIsEditing(!isEditing)} style={styles.backButton}>
                    {isEditing ? <Check size={22}/> : <SquarePen size={22}/>}
                </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Status */}
                <View style={[styles.statusBadge, task.completed ? styles.bgSuccess : styles.bgPending]}>
                    {task.completed ? <CheckCircle size={16}/> : <Circle size={16}/>}
                    <Text style={styles.statusText}>
                        {task.completed ? 'Completed' : 'Action Required'}
                    </Text>
                </View>

                <Text style={styles.title}>{task.title}</Text>

                {/* Date */}
                <View style={styles.infoGrid}>
                    <View style={styles.infoCard}>
                        <Calendar size={20} style={styles.icon}/><Text style={styles.label}>Date:</Text>
                        {isEditing ? (
                            <TextInput style={styles.inputEditing} value={task.date}/>
                        ) : (
                            <Text>{task.date}</Text>
                        )}
                    </View>

                    <View style={styles.infoCard}>
                        <Clock size={20} style={styles.icon}/><Text style={styles.label}>Date:</Text>
                        <Text>All Day</Text>
                    </View>
                </View>

                {/* Course */}
                <View style={styles.courseSection}>
                    <BookOpen size={20} style={styles.icon}/>
                    <Text style={styles.label}>Associated with:</Text>
                    {isEditing ? (
                        <TextInput style={styles.inputEditing} value={task.course}/>
                    ) : (
                        <Text>{task.course}</Text>
                    )}
                </View>

                <View style={styles.divider}/>

                {/* Description */}
                <Text style={styles.label}>Description</Text>
                {isEditing ? (
                    <TextInput multiline style={styles.inputEditing} value={task.description}/>
                ) : (
                    <Text>{task.description}</Text>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginHorizontal: 10,
        marginVertical: 20,
    },
    backButton:{
        width:40,
        height:40,
        zIndex:10,
        backgroundColor:'rgba(168, 168, 168, 0.3)',
        padding:8,
        borderRadius:50,
    },
    content:{
        padding:20
    },
    statusBadge:{
        flexDirection:'row',
        alignItems:'center',
        alignSelf:'flex-start',
        paddingHorizontal:12,
        paddingVertical:6,
        borderRadius:20,
        gap:6,
        marginBottom:15,
        borderRadius:50,
        color: 'white',
    },
    statusText:{
        color: 'white',
    },
    bgSuccess:{
        backgroundColor:'#03501c',
    },
    bgPending:{
        backgroundColor:'#fef9c3',
    },
    textSuccess:{
        color:'white',
        fontWeight:'bold',
    },
    textPending:{
        color:'#854d0e',
        fontWeight:'bold',
    },
    title:{
        fontSize:26,
        fontWeight:'bold',
        color:"#1a1a1a",
        marginBottom:20
    },
    infoGrid:{
        flexDirection:'row',
        gap:15,
        marginBottom:20
    },
    infoCard:{
        flex:1,
        flexDirection: 'row',
        gap: 10,
        backgroundColor:'#f8fafc',
        padding:15,
        borderRadius:15,
        borderWidth:1,
        borderColor:'#e2e8f0',
        alignItems: 'center',
    },
    infoValue:{
        fontSize:15,
        fontWeight:'600',
        color:'#1e293b'
    },
    courseSection:{
        flexDirection:'row',
        alignItems: 'center',
        gap:10,
        marginBottom:10
    },
    courseText:{
        color:'#666',
        fontSize:14,
    },
    divider:{
        height:1,
        backgroundColor:'#faf5f9',
        marginVertical:20,
    },
    sectionHeading:{
        fontSize:16,
        fontWeight:'bold',
        color:'#32750e',
        marginBottom:10,
    },
    description:{
        fontSize:16,
        color:'#475569',
        lineHeight:24
    },
    topSection:{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    inputEditing:{
        borderWidth:1, 
        borderColor:'#ddd',
        borderRadius:10,
        paddingVertical:5,
        paddingHorizontal:10,
        flex:1,
        marginTop:5,
    },
    label:{
        color: '#2f6618fe'
    },
    icon:{
        color: '#2f6618fe'
    }
}); 

export default TaskDetail;