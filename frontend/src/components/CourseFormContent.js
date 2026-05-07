import {useState} from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Image, ActivityIndicator, ScrollView} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {X, Plus, ChevronDown, Award, ParenthesesIcon, Tag} from 'lucide-react-native';

// Import other hook and components
import { ModalStyle as styles } from './ModalStyle';

const CourseFormContent=({onSubmit, onCancel, isLoading, initialData,allCourseList = [], allTagList = []})=>{

    const getInitialTagsByType = (type) => {
        if (!initialData?.tags) return [];
        return initialData.tags
            .filter(t => t.type === type)
            .map(t => ({ id: t.id, title: t.title }));
    };

    const getInitialPrereqs = () => {
        if (!initialData?.prerequisite_groups?.[0]?.prerequisites) return [];

        return initialData.prerequisite_groups[0].prerequisites.map(p => {
            const matchedCourse = allCourseList.find(c => c.id === p.course_id);
            
            return {
                id: p.course_id,
                title: matchedCourse?.title || p.course_title || `Course #${p.course_id}` 
            };
        });
    };

    const [form, setForm]=useState({
        courseTitle: initialData?.title || '',
        duration: initialData?.expected_completion_weeks || '',
        expiryWeeks:initialData?.must_complete_in_weeks,
        badgeExpiry:initialData?.badge_expire_in_months,
        image:initialData?.cover_img_url || null,
        badgeImage: initialData?.badge_img_url || null,
        status: initialData?.status,
        locationTags: getInitialTagsByType('location'),
        categoryTags: getInitialTagsByType('category'),
        prerequisites: getInitialPrereqs(),
    });

    const [showLocDropdown, setShowLocDropdown] = useState(false);
    const [showCatDropdown, setShowCatDropdown] = useState(false);
    const [showPrereqDropdown, setShowPrereqDropdown] = useState(false);

    const addTypedTag = (tag, key) => {
        if (!form[key].find(t => t.id === tag.id)) {
            setForm(prev => ({
                ...prev,
                [key]: [...prev[key], { id: tag.id, title: tag.title }]
            }));
        }
        key === 'locationTags' ? setShowLocDropdown(false) : setShowCatDropdown(false);
    };

    const removeTypedTag = (tagId, key) => {
        setForm(prev => ({
            ...prev,
            [key]: prev[key].filter(t => t.id !== tagId)
        }));
    };
    
    const handleNumericInput = (key, text) => {
        const cleaned = text.replace(/[^0-9]/g, '');
        setForm(prev => ({ ...prev, [key]: cleaned }));
    };

    const addPrerequisite = (course) => {
        if (!form.prerequisites.find(p => p.id === course.id)) {
            setForm(prev => ({
                ...prev,
                prerequisites: [...prev.prerequisites, { id: course.id, title: course.title }]
            }));
        }
        setShowPrereqDropdown(false);
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

    const preparePayload = (statusOverride) => {
        return {
            ...form,
            status: statusOverride || form.status,
            prerequisite_course_ids: form.prerequisites.map(p => p.id),
            tags: [...form.locationTags, ...form.categoryTags].map(t => t.id),
        };
    };

    const handleSubmit = () => {
        const payload = preparePayload();
        
        const finalPayload = {
            ...payload,
            duration: parseInt(form.duration, 10) || 0,
            expiryWeeks: parseInt(form.expiryWeeks, 10) || 0,
            badgeExpiry: parseInt(form.badgeExpiry, 10) || 0,
        };
        onSubmit(finalPayload);
        console.log(finalPayload);
    };

    const handlePublish = () => {
        const payload = preparePayload('released');
        onSubmit({
            ...payload,
            duration: parseInt(form.duration, 10) || 0,
            expiryWeeks: parseInt(form.expiryWeeks, 10) || 0,
        });
    };

    const handleUnpublish = () => {
        const payload = preparePayload('unreleased');
        onSubmit({
            ...payload,
            duration: parseInt(form.duration, 10) || 0,
            expiryWeeks: parseInt(form.expiryWeeks, 10) || 0,
            badgeExpiry: parseInt(form.badgeExpiry, 10) || 0,
        });
    };

    return(
        <View style={styles.container}>
            <View style={[styles.header,styles.row]}>
                <Text style={styles.title}>{initialData ? 'Edit Course' : 'Create New Course'}</Text>
                <Pressable onPress={onCancel}>
                    <X color="#333"/>
                </Pressable>
            </View>
            <ScrollView>
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
                    

                    {/* Location Tags */}
                    <View style={localStyles.inputGroup}>
                        <Text style={styles.label}>Location Tags:</Text>
                        <View style={localStyles.multiSelectContainer}>
                            {form.locationTags.map(tag => (
                                <View key={tag.id} style={localStyles.pill}>
                                    <Text style={localStyles.pillText}>{tag.title}</Text>
                                    <Pressable onPress={() => removeTypedTag(tag.id, 'locationTags')}>
                                        <X size={12} color="white" />
                                    </Pressable>
                                </View>
                            ))}
                            <Pressable style={localStyles.addTagBtn} onPress={() => setShowLocDropdown(!showLocDropdown)}>
                                <Plus size={16} color="#217837" />
                                <Text style={localStyles.addTagText}>Add Location</Text>
                            </Pressable>
                        </View>

                        {showLocDropdown && (
                            <View style={localStyles.dropdownOverlay}>
                                <View style={localStyles.Tagdropdown}>
                                    <ScrollView style={{ maxHeight: 150 }}>
                                        {allTagList.filter(t => t.type === 'location').map(tag => (
                                            <Pressable key={tag.id} style={localStyles.TagdropdownItem} onPress={() => addTypedTag(tag, 'locationTags')}>
                                                <Tag size={14} color="#666" style={{ marginRight: 8 }} />
                                                <Text>{tag.title}</Text>
                                            </Pressable>
                                        ))}
                                    </ScrollView>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Category Tags */}
                    <View style={localStyles.inputGroup}>
                        <Text style={styles.label}>Category Tags:</Text>
                        <View style={localStyles.multiSelectContainer}>
                            {form.categoryTags.map(tag => (
                                <View key={tag.id} style={localStyles.pill}>
                                    <Text style={localStyles.pillText}>{tag.title}</Text>
                                    <Pressable onPress={() => removeTypedTag(tag.id, 'categoryTags')}>
                                        <X size={12} color="white" />
                                    </Pressable>
                                </View>
                            ))}
                            <Pressable style={localStyles.addTagBtn} onPress={() => setShowCatDropdown(!showCatDropdown)}>
                                <Plus size={16} color="#217837" />
                                <Text style={localStyles.addTagText}>Add Category</Text>
                            </Pressable>
                        </View>

                        {showCatDropdown && (
                            <View style={localStyles.dropdownOverlay}>
                                <View style={localStyles.Tagdropdown}>
                                    <ScrollView style={{ maxHeight: 150 }}>
                                        {allTagList.filter(t => t.type === 'category').map(tag => (
                                            <Pressable key={tag.id} style={localStyles.TagdropdownItem} onPress={() => addTypedTag(tag, 'categoryTags')}>
                                                <Tag size={14} color="#666" style={{ marginRight: 8 }} />
                                                <Text>{tag.title}</Text>
                                            </Pressable>
                                        ))}
                                    </ScrollView>
                                </View>
                            </View>
                        )}
                    </View>
                    
                    {/* Pre-requisite */}
                    <View style={localStyles.inputGroup}>
                        <Text style={styles.label}>Pre-requisites:</Text>
                        <View style={localStyles.multiSelectContainer}>
                            {form.prerequisites.map((course) => (
                                <View key={course.id} style={localStyles.prereqPill}>
                                    <Text style={localStyles.prereqText}>{course.title}</Text>
                                    <Pressable onPress={() => {
                                        setForm({
                                            ...form,
                                            prerequisites: form.prerequisites.filter(p => p.id !== course.id)
                                        });
                                    }}>
                                        <X size={14} color="#666" />
                                    </Pressable>
                                </View>
                            ))}

                            <Pressable 
                                style={localStyles.addPrereqBtn} 
                                onPress={() => setShowPrereqDropdown(!showPrereqDropdown)}
                            >
                                <Plus size={16} color="#217837" />
                                <Text style={localStyles.addPrereqText}>Add Course</Text>
                            </Pressable>
                        </View>
                        
                        {/* Pre-requisite dropdown */}
                        {showPrereqDropdown && (
                            <View style={localStyles.overlay}>
                                <View style={localStyles.dropdown}>
                                <ScrollView style={{ maxHeight: 150 }}>
                                    {allCourseList
                                        .filter(c => c.id !== initialData?.id)
                                        .map(course => (
                                        <Pressable 
                                            key={course.id} 
                                            style={localStyles.dropdownItem}
                                            onPress={() => addPrerequisite(course)}
                                        >
                                            <Text>{course.title}</Text>
                                        </Pressable>
                                    ))}
                                </ScrollView>
                            </View>
                            </View>
                        )}
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
            </ScrollView>
            <View style={styles.row}>
                <Pressable 
                    style={styles.Btn} 
                    onPress={handleSubmit}
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
        maxWidth:450
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
     },
     overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        zIndex: 9999,
    },

    dropdown: {
        width: 500,
        maxHeight: 300,
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 10,
        position:'relative',
        bottom:118,
    },
    dropdownItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    addTagBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 4, 
        marginLeft: 5 
    },
    addTagText: { 
        color: '#217837', 
        fontSize: 12, 
        fontWeight: '600' 
    },
    dropdownOverlay: {
        position: 'absolute',
        backgroundColor: 'rgba(0,0,0,0.05)',
        width: '100%',
        bottom:45
    },
    Tagdropdown: {
        backgroundColor: 'white',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#eee',
        elevation: 3,
    },
    TagdropdownItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        flexDirection: 'row',
        alignItems: 'center'
    },
})
;

export default CourseFormContent;

// Havent do the validation message