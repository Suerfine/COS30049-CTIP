import React,{useEffect, useState} from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView} from 'react-native';
import { ListPlus, ChevronRight } from 'lucide-react-native';
import Checkbox from 'expo-checkbox';
import { Calendar } from 'react-native-calendars';
import {useRoute} from '@react-navigation/native';

// Import Components
import NavBar from '../components/NavBar';
import OutlineBar from '../components/OutlineBar';

const UserModule = ({ navigation }) => {
        const route=useRoute();
        const {id}=route.params;
        const [course,setCourse]=useState(null);
        const [selectedPage, setSelectedPage]=useState(null);
    
        useEffect(()=>{
            fetch(`http://localhost:4000/api/courses/${id}`)
            .then(res=>res.json())
            .then(data=>setCourse(data))
            .catch(err=>console.error('Error when fetching the course: ',err));
        }, [id]);
        
        if (!course) return <Text>Course not found</Text>;

    return(
        <View style={{ flex: 1 }}>
            {/* Outlinebar */}
            <OutlineBar course={course} onSelectPage={setSelectedPage} editable={false}/>
            {/* Content */}
            <ScrollView style={styles.container}>   
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container:{
        flex: 1,
        padding: 20,
        marginHorizontal: 10
    },
    dashboardTitle:{
        marginHorizontal: 10,
        marginVertical: 10,
        fontSize: 30,
    },
    cardContainer:{
        flexDirection:'row',
        flexWrap:'wrap',
        justifyContent:'flex-start',
        marginTop:20,
        gap:30,
    },
    topRow:{
        flex: 1,
        flexDirection: 'row',
        gap: 20,
        alignItems: 'stretch',
    },
    leftColumn:{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 20,
    },
    rightColumn:{
        flex: 0.8,
        flexDirection: 'column',
        maxHeight: '100%',
    },
    calendarContainer:{
        width: '100%',
        borderRadius: 20,
        marginBottom: 10,
        padding: 3,
        overflow: 'hidden',
    },
    todoList:{
        flex: 1,
        backgroundColor: '#9ee5a375',
        borderRadius: 10,
        padding: 15,
        maxHeight: '100%',
    },
    todoListTitle:{
        fontSize: 18,
        marginBottom: 10,
        fontWeight: 'bold',
    },
    todoHeader:{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    todoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    todoItem:{
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#cccccc',
        backgroundColor: '#ffffff',
        borderRadius: 10,
        marginVertical: 6,
        marginRight: 10,
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
    todoTab:{
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 10,
        gap: 20
    },
    tab:{
        fontSize: 14,
        color: '#888',
        backgroundColor: '#9ee5a375',
        padding: 5,
        paddingHorizontal: 15,
        borderRadius: 50,
        borderBottomWidth: 2,
        borderBottomColor: '#888'
    },
    activeTab:{
        fontSize: 14,
        fontWeight: 'bold',
        color: '#000',
        borderBottomWidth: 2,
        backgroundColor: '#9ee5a375',
        padding: 5,
        paddingHorizontal: 15,
        borderRadius: 50
    }
});

export default UserModule;