import { View, Text, StyleSheet, ScrollView, Pressable, StatusBar } from 'react-native';
import { useState } from 'react';
import { ChevronLeft, CheckCircle, Circle, Calendar, Clock, BookOpen, SquarePen, Check } from 'lucide-react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { TextInput } from 'react-native-gesture-handler';

const TaskDetails=({navigation, route})=>{
    const {task} =route.params;
    const [isEditing, setIsEditing]=useState(false);
    
    return (
        <SafeAreaView style={StyleSheet.container} edges={['left', 'right']}>
            <StatusBar barStyle="dark-content"/>
            {/* Top section */}
            <View style={styles.topSection}>
                <Pressable onPress={()=>navigation.goBack()} style={({pressed})=>[styles.backButton, pressed && styles.btnPressed]}>
                    <ChevronLeft size={24} color="black"/>
                </Pressable>
                {!isEditing ? (
                    <Pressable onPress={()=>setIsEditing(true)} style={({pressed})=>[styles.backButton, pressed && styles.btnPressed]}>
                        <SquarePen size={22} color="black"/>
                    </Pressable>
                ): (
                    <Pressable onPress={()=>setIsEditing(false)} style={({pressed})=>[styles.backButton, pressed && styles.btnPressed]}>
                        <Check size={22} color="black"/>
                    </Pressable>
                )}
                
            </View>
            
            <ScrollView contentContainerStyle={styles.content}>
                {/* Status Badge */}
                <View style={[styles.statusBadge, task.completed ? styles.bgSuccess : styles.bgPending]}>
                    {task.completed ? <CheckCircle size={16} color="white"/> : <Circle size={16} color="#854d0e"/>}
                    <Text style={task.completed ? styles.textSuccess : styles.textPending}>
                        {task.completed ? 'Completed' : 'Action Required'}
                    </Text>
                </View>
                {/* Title */}
                <Text style={styles.title}>{task.title}</Text>
                {/* Date and Time */}
                <View style={styles.infoGrid}>
                    <View style={styles.infoCard}>
                        <Calendar size={20} color="#32750e"/>
                        <Text style={styles.infoLabel}>Date: </Text>
                        {isEditing ? (<TextInput style={[styles.inputEditing]} value={task.date}/>): (<Text style={styles.infoValue}>{task.date}</Text>)}
                        
                    </View>
                    <View style={styles.infoCard}>
                        <Clock size={20} color="#32750e"/>
                        <Text style={styles.infoLabel}>Time: </Text>
                        {/* Add isediting */}
                        <Text style={styles.infoValue}>All Day</Text>
                    </View>
                </View>
                <View style={styles.courseSection}>
                    <BookOpen size={20} color="#666"/>
                    <View >
                        <Text style={styles.courseText}>Associated with: </Text>
                        {isEditing ? (
                            <TextInput style={[styles.inputEditing]} value={task.course}/>
                        ) : (<Text>{task.course}</Text>)}
                        
                        </View>
                </View>
                <View style={styles.divider}/>
                {/* Description */}
                <Text style={styles.sectionHeading}>Description</Text>
                {isEditing ? (
                    <TextInput style={styles.inputEditing}value={task.description}/>
                ):(
                    <Text style={styles.description}>
                        {task.description || "No specific description details provided for this medical task. Please update if further information is required."}
                    </Text>
                )}
                
            </ScrollView>
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
        borderRadius:50
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
        backgroundColor:'#f8fafc',
        padding:15,
        borderRadius:15,
        borderWidth:1,
        borderColor:'#e2e8f0',
    },
    infoLabel:{
        fontSize:12,
        color:'#64748b',
        marginTop:8
    },
    infoValue:{
        fontSize:15,
        fontWeight:'600',
        color:'#1e293b'
    },
    courseSection:{
        flexDirection:'row',
        alignItems:'center',
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
        marginVertical:'20'
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
        flexDirection:'row',
        justifyContent:'space-between',
        marginHorizontal:18,
        marginVertical:15
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
});

export default TaskDetails;
// All need add onchangetext