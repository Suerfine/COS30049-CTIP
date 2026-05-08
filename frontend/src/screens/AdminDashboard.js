import { Book, User, ClipboardList, Flag } from 'lucide-react-native';
import React, {useState} from 'react';
import { Pressable, StyleSheet, FlatList, View,Text, Image, TextInput, ActivityIndicator} from 'react-native';

const AdminDashboard=()=>{
    return (
        <View style={styles.container}>
            <View style={styles.cards}>
                <View style={styles.adminCard}>
                    <View>
                        <Text style={styles.label}>Total Users</Text>
                        <Text style={styles.value}>21342</Text>
                    </View>
                    <View style={[styles.iconContainer, styles.usersTheme]}>
                        <User size={30} color="#4338ca"/>
                    </View>
                </View>
                <View style={styles.adminCard}>
                    <View>
                        <Text style={styles.label}>Total Courses</Text>
                        <Text style={styles.value}>21342</Text>
                    </View>
                    <View style={[styles.iconContainer, styles.coursesTheme]}>
                        <Book size={30} color="#ea580c"/>
                    </View>
                    
                </View>
                <View style={styles.adminCard}>
                    <View>
                        <Text style={styles.label}>Total Enrollments</Text>
                        <Text style={styles.value}>21342</Text>
                    </View>
                    <View style={[styles.iconContainer, styles.enrollTheme]}>
                        <ClipboardList size={30} color="#16a34a"/>
                    </View>
                </View>
                <View style={styles.adminCard}>
                    <View>
                        <Text style={styles.label}>Total Abnormalies</Text>
                        <Text style={styles.value}>21342</Text>
                    </View>
                    <View style={[styles.iconContainer, styles.alertTheme]}>
                        <Flag size={30} color="#dc2626"/>
                    </View>
                </View>
            </View>
            
        </View>
    );
}

const styles=StyleSheet.create({
    container:{
        flex:1,
        paddingVertical:20,
        paddingHorizontal:40
    },
    adminCard:{
        backgroundColor:"white",
        borderRadius:12,
        padding:25,
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems:'center',
        width:250,
        elevation:3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    label:{
        fontSize:14,
        color:'#666',
        fontWeight:'500',
        marginBottom:4,
    },
    value:{
        fontSize:24,
        fontWeight:'bold',
        color:'#333'
    },
    iconContainer:{
        backgroundColor:'#f0f7f4',
        padding:10,
        borderRadius:10
    },
    cards:{
        flexDirection:'row',
        justifyContent:'space-between',
        marginHorizontal:20
    },
    usersTheme: { backgroundColor: '#eef2ff' }, 
    coursesTheme: { backgroundColor: '#fff7ed' },
    enrollTheme: { backgroundColor: '#f0fdf4' }, 
    alertTheme: { backgroundColor: '#fef2f2' }, 
})

export default AdminDashboard;