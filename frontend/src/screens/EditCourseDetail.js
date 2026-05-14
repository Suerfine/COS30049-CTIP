import React,{useEffect,useState} from 'react';
import { View, Text, StyleSheet, ScrollView, ImageBackground, Pressable} from 'react-native';
import {useRoute} from '@react-navigation/native';
import { Menu } from 'lucide-react-native';
import apiClient from '../config/apiConfig';

// Import Components
import OutlineBar from '../components/OutlineBar.js';

const EditCourseDetail = () => {
    const route=useRoute();
    const {id}=route.params;
    const [course,setCourse]=useState(null);
    const [selectedPage, setSelectedPage]=useState(null);
    const [isCollapsed, setIsCollapsed]=useState(false);

    useEffect(()=>{
        apiClient.get(`/courses/${id}`)
        .then(res=>setCourse(res.data))
        .catch(err=>console.error('Error when fetching the course: ',err));
    }, [id]);
    
    if (!course) return <Text>Course not found</Text>;

    return (
        <View style={styles.rowContainer}>
            {/* Outlinebar */}
            <OutlineBar course={course} onSelectPage={setSelectedPage} editable={true} isCollapsed={isCollapsed}/>
            <View style={styles.container}>
                {/* Background Image */}
                <ImageBackground 
                    source={require('../../assets/forest.png')}
                    style={styles.backgroundImage}
                >
                    <View style={styles.courseContainer}>
                        <Pressable onPress={()=>setIsCollapsed(!isCollapsed)}>
                            <Menu color="white" size={25}/>
                        </Pressable>
                        <View>
                            <Text style={styles.description}>Start Your Learning Journey!</Text>
                            <Text style={styles.title}> Course Details</Text>
                        </View>
                    </View>
                </ImageBackground>
                {/* Content */}
                <ScrollView>
                    {selectedPage?.type === 'page' ? (
                        <Text>Editing: {selectedPage.page.title}</Text>
                    ) : (
                        <Text>Welcome to {course?.courseTitle} Overview</Text>
                    )}
                </ScrollView>
            </View>
        </View>

    );
}

const styles = StyleSheet.create({
    rowContainer: {
        flex: 1,
        flexDirection:'row',
    },
    backgroundImage:{
        width:'100%',
        borderRadius:20,
        overflow:'hidden',
        resizeMode:'fill',
        marginTop:10,
    },
    courseContainer:{
        paddingVertical:30,
        paddingHorizontal:20,
        borderRadius:20,
        flexDirection:'row',
        userSelect:'none',
        alignItems:'center',
        
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        color:'white',
        marginLeft:12
    },
    description: {
        fontSize: 14,
        lineHeight: 24,
        color:'white',
        marginLeft:15
    },
    container:{
        flex: 1,
        marginHorizontal:20,
    }
});

export default EditCourseDetail;