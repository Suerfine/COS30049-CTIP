import React,{useEffect,useState} from 'react';
import { View, Text, StyleSheet, ScrollView, ImageBackground, Pressable, ActivityIndicator} from 'react-native';
import {useRoute} from '@react-navigation/native';
import { Menu } from 'lucide-react-native';

// Import Components
import OutlineBar from '../components/OutlineBar.js';
import { useCourseDetails } from '../hooks/useCourseDetails.js';

const EditCourseDetail = () => {
    const route=useRoute();
    const {id}=route.params;
    const {course, loading, error}=useCourseDetails(id);
    const [selectedPage, setSelectedPage]=useState(null);
    const [isCollapsed, setIsCollapsed]=useState(false);

    if(loading)return(
        <View style={styles.center}>
            <ActivityIndicator size='large' color="#0a6340"/>
            <Text>Syncing with Server...</Text>
        </View>
    );
    
    if (error || !course) return (
        <View style={styles.center}>
            <Text style={{ color: 'red' }}>{error || "Course not found"}</Text>
        </View>
    );

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
                            <Text style={styles.description}>Course Details</Text>
                            <Text style={styles.title}>{course.title}</Text>
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