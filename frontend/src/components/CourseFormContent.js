import {useState} from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Image, ActivityIndicator} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {X, Plus, ChevronDown, Award, ParenthesesIcon} from 'lucide-react-native';

// Import other hook and components
import { ModalStyle as styles } from './ModalStyle';

const CourseFormContent=({onSubmit, onCancel, isLoading, initialData})=>{
    const [form, setForm]=useState({
        courseTitle: initialData?.title || '',
        duration: initialData?.expected_completion_weeks || '',
        expiryWeeks:initialData?.must_complete_in_weeks,
        badgeExpiry:initialData?.badge_expire_in_months,
        image:initialData?.cover_img_url || null,
        badgeImage: initialData?.badge_img_url || null,
        status: initialData?.status,
        tags:['IoT', 'Medical','Hardware'],
        prerequisites: [
            { id: 1, title: 'Introduction to AI' },
            { id: 2, title: 'Basic Electronics' }
        ],
    });

    console.log(initialData?.badge_img_url);

    const handleNumericInput = (key, text) => {
        const cleaned = text.replace(/[^0-9]/g, '');
        setForm(prev => ({ ...prev, [key]: cleaned }));
    };

    const pickImage=async(type)=>{
        // Ask for permission
        const {status}=await ImagePicker.requestMediaLibraryPermissionsAsync();

        if(status !=='granted'){
            alert('Permission to access gallery is required!');
            return;
        }
        let result=await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing:true,
            aspect: type==='badge' ? [1,1] : [16,9],
            quality:1,
        });

        if(!result.canceled){
            if(type==='badge'){
                setForm(prev=>({...prev, badgeImage:result.assets[0].uri}));
            }else{
                setForm(prev=>({...prev, image:result.assets[0].uri}));
            }
        }
    };

    const handleSubmit=()=>{
        const finalPayload={
            title: form.courseTitle,
            duration:parseInt(form.duration, 10) || 0,
            expiryWeeks:parseInt(form.expiryWeeks, 10) || 0,
            badgeExpiry:parseInt(form.badgeExpiry,10) || 0,
            image:form.image,
            badgeImage: form.badgeImage,
            status:form.status,
        };
        onSubmit(finalPayload);
    };

    const handlePublish=()=>{
        const finalPayload={
            ...form,
            status:'released',
            duration:parseInt(form.duration, 10) || 0,
            expiryWeeks: parseInt(form.expiryWeeks,10) || 0,
        };
        onSubmit(finalPayload);
    };

    const handleUnpublish=()=>{
        const finalPayload={
            ...form,
            status:'unreleased',
            duration: parseInt(form.duration, 10) || 0,
            expiryWeeks: parseInt(form.expiryWeeks, 10) || 0,
            badgeExpiry: parseInt(form.badgeExpiry, 10) || 0,
        };
        onSubmit(finalPayload);
    }

    return(
        <View style={styles.container}>
            <View style={[styles.header,styles.row]}>
                <Text style={styles.title}>{initialData ? 'Edit Course' : 'Create New Course'}</Text>
                <Pressable onPress={onCancel}>
                    <X color="#333"/>
                </Pressable>
            </View>
            <View style={styles.row}>
                <View style={styles.content}>
                    {/* Course Title */}
                    <View> 
                        <Text style={styles.label}>Title:</Text>
                        <TextInput style={styles.input} placeholder='Course Title' placeholderTextColor="#8f8f8f" value={form.courseTitle} onChangeText={(text)=> setForm({...form, courseTitle: text})}/>
                    </View>

                    <View>
                        <Text style={styles.label}>Course Completion (Recommend in Weeks):</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder='e.g. 4'
                            placeholderTextColor="#8f8f8f"
                            keyboardType="numeric"
                            value={form.duration} 
                            onChangeText={(text) => handleNumericInput('duration', text)} 
                        />
                    </View>

                    {/* Expiry */}
                    <View style={[styles.row, {gap:15}]}>
                        <View>
                            <Text style={styles.label}>Course Validity (Weeks):</Text>
                            <TextInput 
                                style={styles.input} 
                                placeholder='e.g. 4'
                                placeholderTextColor="#8f8f8f"
                                keyboardType="numeric"
                                value={form.expiryWeeks} 
                                onChangeText={(text) => handleNumericInput('expiryWeeks', text)} 
                            />
                        </View>
                        <View>
                            <Text style={styles.label}>Badge Validity (Months):</Text>
                            <TextInput 
                                style={styles.input} 
                                placeholder='e.g. 12'
                                placeholderTextColor="#8f8f8f"
                                keyboardType="numeric"
                                value={form.badgeExpiry} 
                                onChangeText={(text) => handleNumericInput('badgeExpiry', text)} 
                            />
                        </View>
                    </View>
                    

                    {/* Dummy Tags (Pills) */}
                    <View style={localStyles.inputGroup}>
                        <Text style={styles.label}>Tags:</Text>
                        <View style={localStyles.tagWrapper}>
                            {initialData && form.tags.map(tag => (
                                <View key={tag} style={localStyles.pill}>
                                    <Text style={localStyles.pillText}>{tag}</Text>
                                    <X size={12} color="white" />
                                </View>
                            ))}
                            <Pressable style={localStyles.addPill}>
                                <Plus size={14} color="#666" />
                            </Pressable>
                        </View>
                    </View>

                    {/* Dummy Prerequisites */}
                    <View style={localStyles.inputGroup}>
                        <Text style={styles.label}>Pre-requisites:</Text>
                        <View style={localStyles.multiSelectContainer}>
                            {initialData && form.prerequisites.map((course) => (
                                <View key={course.id} style={localStyles.prereqPill}>
                                    <Text style={localStyles.prereqText}>{course.title}</Text>
                                    <Pressable onPress={() => {
                                        // Logic to remove a pre-requisite
                                        setForm({
                                            ...form,
                                            prerequisites: form.prerequisites.filter(p => p.id !== course.id)
                                        });
                                    }}>
                                        <X size={14} color="#666" />
                                    </Pressable>
                                </View>
                            ))}
                            
                            {/* Add button to trigger a picker/modal later */}
                            <Pressable style={localStyles.addPrereqBtn}>
                                <Plus size={16} color="#217837" />
                                <Text style={localStyles.addPrereqText}>Add Course</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
                <View style={styles.upload}>
                    {/* Course image */}
                    <Text style={styles.label}>Course Cover</Text>
                    <Pressable style={styles.imagePicker} onPress={()=>pickImage('cover')}>
                        {form.image ? (
                            <Image source={{uri: form.image}} style={styles.previewImage}/>
                        ): (
                            <View style={localStyles.uploadPlaceholder}>
                                <Image source={require('../../assets/upload_placeholder.png')} accessibilityLabel='Upload Placeholder Image' style={localStyles.placeholder}/>
                                <Text style={localStyles.muted}>Select your image</Text>
                            </View>
                        )}
                    </Pressable>
                    {/* Badge Image */}
                    <Text style={[styles.label, { marginTop: 25 }]}>Completion Badge (1:1)</Text>
                    <Pressable style={localStyles.badgePicker} onPress={() => pickImage('badge')}>
                        {form.badgeImage ? (
                            <Image source={{ uri: form.badgeImage }} style={localStyles.badgePreview} />
                        ) : (
                            <View style={localStyles.uploadPlaceholder}>
                                <Award size={32} color="#ccc" />
                                <Text style={[localStyles.mutedText, { fontSize: 10 }]}>Upload Badge</Text>
                            </View>
                        )}
                    </Pressable>
                </View>
            </View>
            <View style={styles.row}>
                <Pressable 
                    style={styles.Btn} 
                    onPress={() => onSubmit(form)}
                    disabled={isLoading}
                >
                    {isLoading ? <ActivityIndicator color="white" /> : <Text>{initialData ? 'Update' : 'Add'}</Text>}
                </Pressable>
                {/* Status Toggle Button */}
                {initialData && (
                    <>
                        {form.status === "unreleased" ? (
                            <Pressable 
                                style={[styles.Btn, localStyles.Publishbtn]}
                                onPress={handlePublish}
                                disabled={isLoading}
                            >
                                {isLoading ? <ActivityIndicator color="white" /> : <Text style={localStyles.publishText}>Publish</Text>}
                            </Pressable>
                        ) : (
                            <Pressable 
                                style={[styles.Btn, localStyles.Publishbtn]}
                                onPress={handleUnpublish}
                                disabled={isLoading}
                            >
                                {isLoading ? <ActivityIndicator color="white" /> : <Text style={localStyles.publishText}>Unpublish</Text>}
                            </Pressable>
                        )}
                    </>
                )}
                
            </View>
        </View>
    )
}

const localStyles=StyleSheet.create({
    desc:{
        minHeight:120,
    },
    placeholder:{
        width:70,
        height:70,
        borderRadius: 10
    },
    uploadPlaceholder:{
        width: '100%', 
        height: '100%', 
        justifyContent:'center',
        alignItems:'center',
    },
    muted:{
        color:"#646464"
    },
    Publishbtn:{
        backgroundColor:'#18704d'
    },
    publishText:{
        color:'white'
    },
    inputGroup:{
        marginBottom:15,
    },
    tagWrapper:{
        flexDirection:'row',
        flexWrap:'wrap',
        gap:8,
        marginTop:5,
    },
    pill:{
        backgroundColor:'#217837',
        borderRadius:20,
        paddingHorizontal:12,
        paddingVertical:6,
        flexDirection:'row',
        alignItems:'center',
        gap:6
    },
    pillText:{
        color:'white',
        fontSize:12,
        fontWeight:'500'
    },
    addPill:{
        borderWidth:1,
        borderStyle:'dashed',
        borderColor:'#ccc',
        borderRadius:20,
        paddingHorizontal:12,
        paddingVertical:6
    },
    multiSelectContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        backgroundColor: '#fdfdfd',
        minHeight: 45,
    },
    prereqPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e8f5e9',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#c8e6c9',
        gap: 8,
    },
    prereqText: {
        fontSize: 12,
        color: '#2e7d32',
        fontWeight: '500',
    },
    addPrereqBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        alignSelf: 'center'
    },
    addPrereqText: {
        color: '#217837',
        fontSize: 12,
        fontWeight: '600'
    },
    badgePicker: { 
        width: 200, 
        height: 200, 
        borderWidth: 1, 
        borderStyle: 'dashed', 
        borderColor: '#ccc', 
        borderRadius: 12, 
        backgroundColor: '#f9f9f9', 
        overflow: 'hidden',
        alignSelf:'center'
    },
    badgePreview: { 
        width: '100%', 
        height: '100%', 
        resizeMode: 'cover'
     }
})
;

export default CourseFormContent;

// Havent do the validation message, tag, pre-requisite