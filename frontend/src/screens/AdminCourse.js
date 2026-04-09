import React,{useEffect, useState} from 'react';
import { View, Text, StyleSheet, Pressable, TextInput,  ImageBackground, ScrollView} from 'react-native';
import {CopyPlus, Search, SlidersHorizontal} from 'lucide-react-native';

// Import Components
import CourseCard from '../components/CourseCard.js';

const AdminCourse = ({navigation}) => {
    const [courses, setCourses]=useState([]);

    // Fetch courses from backend api
    useEffect(()=>{
        fetch('http://localhost:5000/api/courses')
        .then(res=>res.json())
        .then(data=>setCourses(data))
        .catch(err=>console.error(err));
    },[]);

    return (
        <ScrollView style={styles.container}>
            {/* Background Image */}
            <ImageBackground 
                source={require('../../assets/forest.png')}
                style={styles.backgroundImage}
            >
                <View style={styles.courseContainer}>
                    <View>
                        <Text style={styles.description}>Here you can find all courses</Text>
                        <Text style={styles.title}>All Courses</Text>
                    </View>
                    <Pressable style={({ hovered }) => [
                            styles.btn,
                            hovered && styles.btnHover, 
                        ]}>
                        <CopyPlus/>
                        <Text style={styles.btnText}>Add Course</Text>
                    </Pressable>
                </View>
            </ImageBackground>

            {/* Search and Filter */}
            <View style={styles.toolbar}>
                <View style={styles.search}>
                    <Search size={18}/>
                    <TextInput style={styles.input} placeholder='Search...' placeholderTextColor="#8f8f8f"/>
                </View>
                <Pressable style={({ hovered }) => [
                        styles.filter,
                        hovered && styles.filterHover, 
                    ]}>
                    <SlidersHorizontal/>
                </Pressable>
            </View>

            {/* Course Card */}
            <View style={styles.cardContainer}>
                {courses.map(course=>(
                    <CourseCard
                        key={course.id}
                        id={course.id}
                        imagePath={{uri:course.image}}
                        courseTitle={course.courseTitle}
                        numModules={course.numModules}
                        duration={course.duration}
                        expiry={course.expiryDate}
                        onPress={()=> navigation.navigate('Course Details', {id:course.id})}
                    />
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        marginHorizontal:10
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        color:'white'
    },
    description: {
        fontSize: 14,
        lineHeight: 24,
        color:'white',
    },
    courseContainer:{
        paddingHorizontal:40,
        paddingVertical:30,
        borderRadius:20,
        flexDirection:'row',
        justifyContent:'space-between',
        userSelect:'none'
    },
    backgroundImage:{
        width:'100%',
        borderRadius:20,
        overflow:'hidden',
        resizeMode:'fill',
        marginTop:10,
    },
    btn:{
        flexDirection:'row',
        gap:8,
        alignItems:'center',
        alignSelf:'center',
        backgroundColor:'#4a8947',
        borderRadius:50,
        color:'white',
        paddingHorizontal:23,
        paddingVertical:13,
    },
    btnHover:{
        backgroundColor:'#2f6618fe'
    },
    btnText:{
        color:'white'
    },
    search:{
        flexDirection:'row',
        gap:7,
        borderWidth:1,
        borderColor:'#8f8f8f',
        minWidth:300,
        padding:5,
        backgroundColor:'white',
        borderRadius:15,
        alignItems:"center"
    },
    input:{
        flex:1,
        paddingVertical:2,
        outlineStyle:'none'
    },
    cardContainer:{
        flexDirection:'row',
        flexWrap:'wrap',
        justifyContent:'flex-start',
        gap:30,
        marginTop:20, 
    },
    filter:{
        flexDirection:'row',
        paddingVertical:5,
        paddingRight:10,
        borderRadius:5,
    },
    filterHover:{
        color:'#efab21'
    },
    toolbar:{
        justifyContent:'space-between',
        flexDirection:'row',
        marginTop:20,
    }

});

export default AdminCourse;

