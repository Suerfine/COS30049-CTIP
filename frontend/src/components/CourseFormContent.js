import {useState} from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Image, ActivityIndicator} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {X} from 'lucide-react-native';
import { ModalStyle as styles } from './ModalStyle';

const CourseFormContent=({onSubmit, onCancel, isLoading, initialData})=>{
    const [form, setForm]=useState({
        courseTitle: initialData?.courseTitle || '',
        duration: initialData?.duration || '',
        expiryDate:initialData?.expiryDate ?  new Date(initialData.expiryDate) : new Date(),
        image:initialData?.image || null,
        description:initialData?.description || '',
    });

    const pickImage=async()=>{
        // Ask for permission
        const {status}=await ImagePicker.requestMediaLibraryPermissionsAsync();

        if(status !=='granted'){
            alert('Permission to access gallery is required!');
            return;
        }
        let result=await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing:true,
            aspect:[16,9],
            quality:1,
        });

        if(!result.canceled){
            setForm({...form, image:result.assets[0].uri});
        }
    };

    return(
        <View style={styles.container}>
            <View style={[styles.header,styles.row]}>
                <Text style={styles.title}>{initialData ? 'Edit Course' : 'Create New Course'}</Text>
                <Pressable onPress={onCancel}>
                    <X />
                </Pressable>
            </View>
            <View style={styles.row}>
                <View style={styles.content}>
                    {/* Course Title */}
                    <View>
                        <Text style={styles.label}>Title:</Text>
                        <TextInput style={styles.input} placeholder='Course Title' placeholderTextColor="#8f8f8f" value={form.courseTitle} onChangeText={(text)=> setForm({...form, courseTitle: text})}/>
                    </View>

                    {/* Expiry Date */}
                    <View>
                        <Text style={styles.label}>Expiry Date:</Text>
                        <Pressable>
                            <View>
                                <input 
                                    type="date" 
                                    value={form.expiryDate.toISOString().split('T')[0]}
                                    style={styles.input}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => {
                                        const selected = new Date(e.target.value);
                                        setForm({...form, expiryDate: selected});
                                    }}
                                />
                            </View>
                        </Pressable>
                    </View>
                    {/* Duration */}
                    <View>
                        <Text style={styles.label}>Duration:</Text>
                        <TextInput 
                            style={styles.input}
                            value={form.duration} 
                            placeholder='e.g. 4 hours 30 min' 
                            placeholderTextColor="#8f8f8f" 
                            onChangeText={(text) => setForm({...form, duration: text})}
                        />
                    </View>

                    {/* Description */}
                    <View>
                        <Text style={styles.label}>Description:</Text>
                        <TextInput style={[styles.input, localStyles.desc]} value={form.description} placeholder='Enter description...' placeholderTextColor="#8f8f8f" multiline={true} onChangeText={(text)=> setForm({...form, description: text})}/>
                    </View>
                </View>
                <View style={styles.upload}>
                    <Text style={styles.label}>Upload Images</Text>
                    <Pressable style={styles.imagePicker} onPress={pickImage}>
                        {form.image ? (
                            <Image source={{uri: form.image}} style={styles.previewImage}/>
                        ): (
                            <View style={localStyles.uploadPlaceholder}>
                                <Image source={require('../../assets/upload_placeholder.png')} accessibilityLabel='Upload Placeholder Image' style={localStyles.placeholder}/>
                                <Text style={localStyles.muted}>Select your image</Text>
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
                {initialData && (
                    <Pressable 
                        style={[styles.Btn, localStyles.Publishbtn]}
                    >
                        <Text style={localStyles.publishText}>Publish</Text>
                    </Pressable>
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
    }
})
;

export default CourseFormContent;

// Havent do the validation message