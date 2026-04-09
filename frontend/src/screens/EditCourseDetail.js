import React,{useEffect,useState} from 'react';
import { View, Text, StyleSheet, ScrollView} from 'react-native';
import {useRoute} from '@react-navigation/native';

// Import Components
import OutlineBar from '../components/OutlineBar.js';

const EditCourseDetail = () => {
    const route=useRoute();
    const {id}=route.params;
    const [course,setCourse]=useState(null);
    const [selectedPage, setSelectedPage]=useState(null);

    useEffect(()=>{
        fetch(`http://localhost:5000/api/courses/${id}`)
        .then(res=>res.json())
        .then(data=>setCourse(data))
        .catch(err=>console.error('Error when fetching the course: ',err));
    }, [id]);
    
    if (!course) return <Text>Course not found</Text>;;

    return (
        <View style={styles.rowContainer}>
            {/* Outlinebar */}
            <OutlineBar course={course} onSelectPage={setSelectedPage} editable={true}/>
            {/* Content */}
            <ScrollView style={styles.container}>
                {selectedPage?.type === 'page' ? (
                    <Text>Editing: {selectedPage.page.title}</Text>
                ) : (
                    <Text>Welcome to {course?.courseTitle} Overview</Text>
                )}
            </ScrollView>
        </View>

    );
}

const styles = StyleSheet.create({
    rowContainer: {
        flex: 1,
        flexDirection:'row',
    },
    

});

export default EditCourseDetail;