import {useState} from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Image, ActivityIndicator} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {X} from 'lucide-react-native';

const CourseForm=({onSubmit, onCancel, isLoading, initialData})=>{
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
                <Text style={styles.title}>Create New Course</Text>
                <Pressable onPress={onCancel}>
                    <X />
                </Pressable>
            </View>
            <View style={styles.row}>
                <View style={styles.content}>
                    <View>
                        <Text style={styles.label}>Title:</Text>
                        <TextInput style={styles.input} placeholder='Course Title' placeholderTextColor="#8f8f8f" onChangeText={(text)=> setForm({...form, courseTitle: text})}/>
                    </View>
                    
                    <View>
                        <Text style={styles.label}>Expiry Date:</Text>
                        <Pressable>
                            <View>
                                <input 
                                    type="date" 
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
                    <View>
                        <Text style={styles.label}>Duration:</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder='e.g. 4 hours 30 min' 
                            placeholderTextColor="#8f8f8f" 
                            onChangeText={(text) => setForm({...form, duration: text})}
                        />
                    </View>
                    <View>
                        <Text style={styles.label}>Description:</Text>
                        <TextInput style={[styles.input, styles.desc]} placeholder='Enter description...' placeholderTextColor="#8f8f8f" multiline={true} onChangeText={(text)=> setForm({...form, description: text})}/>
                    </View>
                </View>
                <View style={styles.upload}>
                    <Text style={styles.label}>Upload Images</Text>
                    <Pressable style={styles.imagePicker} onPress={pickImage}>
                        {form.image ? (
                            <Image source={{uri: form.image}} style={styles.previewImage}/>
                        ): (
                            <View style={styles.uploadPlaceholder}>
                                <Image source={require('../../assets/upload_placeholder.png')} accessibilityLabel='Upload Placeholder Image' style={styles.placeholder}/>
                                <Text style={styles.muted}>Select your image</Text>
                            </View>
                        )}
                    </Pressable>
                </View>
            </View>
            <Pressable 
                style={styles.Btn} 
                onPress={() => onSubmit(form)}
                disabled={isLoading}
            >
                {isLoading ? <ActivityIndicator color="white" /> : <Text>Add</Text>}
            </Pressable>
        </View>
    )
}

const styles=StyleSheet.create({
    container:{
        padding:25,
    },
    row:{
        flexDirection:'row',
        gap:5,
        justifyContent:'space-between',
    },
    header:{
        marginBottom:30
    },
    title:{
        fontWeight:'bold',
        fontSize:20
    },  
    content:{
        borderRightWidth:1,
        borderRightColor: '#ddd',
        paddingRight:20
    },
    input:{
        borderWidth:1, 
        borderColor:'#ddd',
        borderRadius:10,
        padding:12,
        marginBottom:15,
        minWidth:370,
    },
    label:{
        marginBottom:10,
        fontWeight:550
    },
    desc:{
        minHeight:120,
    },
    upload:{
        padding:20,
        flex:1
    },
    imagePicker: { 
        height: 170, 
        backgroundColor: '#fcfdfe', 
        borderRadius: 10, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginBottom: 15, 
        borderStyle: 'dashed', 
        borderWidth: 1, 
        borderColor: '#ccc',
        marginTop:15
    },
    previewImage: { 
        width: '100%', 
        height: '100%', 
        borderRadius: 10,
        resizeMode:'fill'
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
    Btn:{
        maxWidth:100,
        alignItems:'center',
        backgroundColor:'#ffc95c',
        borderRadius:5,
        paddingHorizontal:20,
        paddingVertical:8,
        marginTop:15,
    }
})
;

export default CourseForm;

// Havent do the validation message, edit, delete