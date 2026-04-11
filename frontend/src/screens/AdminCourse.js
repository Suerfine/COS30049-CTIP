import React,{useEffect, useState} from 'react';
import { View, Text, StyleSheet, Pressable, TextInput,  ImageBackground, ScrollView,Modal} from 'react-native';
import {CopyPlus, Search, SlidersHorizontal} from 'lucide-react-native';

// Import Components
import CourseCard from '../components/CourseCard.js';
import CourseForm from '../components/CourseForm.js';

const AdminCourse = ({navigation}) => {
    const [courses, setCourses]=useState([]);
    const [modalVisible, setModalVisible]=useState(false);
    const [loading, setLoading]=useState(false);
    const [isEditing, setIsEditing]=useState(false);
    const [selectedCourse, setSelectedCourse]=useState(null);

    // Fetch courses from backend api
    const fetchCourses=()=>{
        fetch('http://localhost:5000/api/courses')
        .then(res=>res.json())
        .then(data=>setCourses(data))
        .catch(err=>console.error(err));
    };
    useEffect(()=>{
        fetchCourses();
    },[]);

    const handleCreateSubmit=async(formData)=>{
        setLoading(true);
        const data=new FormData();
        data.append('courseTitle', formData.courseTitle);
        data.append('duration', formData.duration);
        const dateString = formData.expiryDate instanceof Date 
        ? formData.expiryDate.toISOString().split('T')[0] 
        : formData.expiryDate;
        data.append('expiryDate', dateString);
        data.append('description', formData.description);
        if(formData.image){
            const response = await fetch(formData.image);
            const blob = await response.blob();
            data.append('image', blob, 'course_photo.jpg');
        }
        try{
            const response=await fetch('http://localhost:5000/api/courses',{
                method:'POST',
                body:data,
                headers:{
                    'Accept': 'application/json',
                },
            });

            if(response.ok){
                setModalVisible(false);
                fetchCourses();
            }
        }catch(err){
            console.error('Upload failed:', err);
        }finally{
            setLoading(false);
        }
    };    

    const handleUpdateSubmit = async (formData) => {
        setLoading(true);
        const data = new FormData();
        data.append('courseTitle', formData.courseTitle);
        data.append('duration', formData.duration);
        data.append('description', formData.description);

        const dateString = formData.expiryDate instanceof Date 
            ? formData.expiryDate.toISOString().split('T')[0] 
            : formData.expiryDate;
        data.append('expiryDate', dateString);

        if (formData.image) {
            if (formData.image.startsWith('blob:') || formData.image.startsWith('file:')) {
                try {
                    const response = await fetch(formData.image);
                    const blob = await response.blob();
                    data.append('image', blob, 'updated_course.jpg');
                } catch (err) {
                    console.error("Image conversion failed", err);
                }
            } else {
                data.append('existingImage', formData.image);
            }
        }
        try {
            const response = await fetch(`http://localhost:5000/api/courses/${selectedCourse.id}`, {
                method: 'PUT', 
                body: data,
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                setModalVisible(false);
                fetchCourses();
            } else {
                const error = await response.json();
                console.error("Update failed:", error);
            }
        } catch (err) {
            console.error("Network error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd=()=>{
        setIsEditing(false);
        setSelectedCourse(null);
        setModalVisible(true);
    };

    const handleEdit=(course)=>{
        setIsEditing(true);
        setSelectedCourse(course);
        setModalVisible(true);
    };

    const handleDelete=async(courseId)=>{
        const confirmDelete=window.confirm("Are you sure you want to delete this course?");
        if(!confirmDelete){
            return;
        }

        try{
            const response=await fetch(`http://localhost:5000/api/courses/${courseId}`,{
                method: 'DELETE',
                headers:{
                    'Accept': 'application/json',
                },
            });

            if(response.ok){
                setCourses(prevCourse=>prevCourse.filter(course=>course.id !== courseId));
            }else{
                const errorData=await response.json();
                alert(`Delete failed: ${errorData.message}`);
            }
        }catch(err){
            console.error("Error deleting course:", err);
            alert("Network error. Could not delete course.");
        }
    };

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
                    <Pressable onPress={handleAdd} style={({ hovered }) => [
                            styles.btn,
                            hovered && styles.btnHover, 
                        ]}>
                        <CopyPlus/>
                        <Text style={styles.btnText}>Add Course</Text>
                    </Pressable>
                </View>
            </ImageBackground>

            {/* Create Course Modal */}
            <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={()=> setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <CourseForm
                            onSubmit={isEditing ? handleUpdateSubmit : handleCreateSubmit}
                            onCancel={()=>setModalVisible(false)}
                            isLoading={loading}
                            initialData={selectedCourse}
                        />
                    </View>
                </View>
            </Modal>

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
                {courses.map(course=>{
                    const numModules=course.modules? course.modules.length :0;
                    return(
                    <CourseCard
                        key={course.id}
                        id={course.id}
                        imagePath={{uri:course.image}}
                        courseTitle={course.courseTitle}
                        numModules={numModules}
                        duration={course.duration}
                        expiry={course.expiryDate}
                        userType="admin"
                        onPress={()=> navigation.navigate('Course Details', {id:course.id})}
                        onEdit={()=>handleEdit(course)}
                        onDelete={()=>handleDelete(course.id)}
                    />)
                })}
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
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContent: {
        width: '100%',
        maxWidth: 750,
        backgroundColor: 'white',
        borderRadius: 20,
        overflow: 'hidden'
    }

});

export default AdminCourse;

