import {useState} from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Image, ActivityIndicator, TouchableOpacity} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {X} from 'lucide-react-native';
import { ModalStyle as styles } from './ModalStyle';
import { isValidEmail, isOnlyLetters, phoneRegex } from '../utils/Validation';

const UsersFormContent=({onSubmit, onCancel, isLoading})=>{
    const [form, setForm]=useState({
        ic: '',
        email: '',
        image: null,
        fname: '',
        lname: '',
        telefon: '',
        role:'parkguide'
    });

    const [errors, setErrors]=useState({});

    const validateForm=()=>{
        let tempErrors={};

        if(!form.fname.trim()){
            tempErrors.fname="* First name is required.";
        }else if (!isOnlyLetters(form.fname)){
            tempErrors.fname="* First name must only contain letters.";
        }

        if(!form.lname.trim()){
            tempErrors.lname="* Last name is required.";
        }else if (!isOnlyLetters(form.lname)){
            tempErrors.lname="* Last name must only contain letters.";
        }

        if(!form.ic.trim()){
            tempErrors.ic="* IC/Passport No. is required.";
        }

        if(!form.email.trim()){
            tempErrors.email="* Personal Email is required.";
        }else if(!isValidEmail(form.email)){
            tempErrors.fname="* Personal Email is invalid format.";
        }

        if(!form.telefon.trim()){
            tempErrors.telefon="* Phone Number is required.";
        }else if(!phoneRegex.test(form.telefon)){
            tempErrors.telefon = "* Invalid phone number.";
        }

        setErrors(tempErrors);
        return Object.keys(tempErrors).length===0;
    };

    const handleSubmit=async()=>{
        if(validateForm()){
            const result=await onSubmit(form);
        }
    }
    

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
            aspect:[1,1],
            quality:1,
        });

        if(!result.canceled){
            setForm({...form, image:result.assets[0].uri});
        }
    };

    return(
        <View style={styles.container}>
            <View style={[styles.header,styles.row]}>
                <Text style={styles.title}>Add New User</Text>
                <Pressable onPress={onCancel}>
                    <X />
                </Pressable>
                
            </View>
            
            <View style={styles.row}>
                <View style={styles.content}>
                    {/* Full Name */}
                    <View style={localStyles.row}>
                        <View>
                            <Text style={styles.label}>First Name:</Text>
                            <TextInput style={styles.input} value={form.fname}
                            placeholder='John' 
                            placeholderTextColor="#8f8f8f" onChangeText={(text)=> setForm({...form, fname: text})}/>
                        </View>
                        <View>
                            <Text style={styles.label}>Last Name:</Text>
                            <TextInput style={styles.input} value={form.lname} placeholder='Doe' 
                            placeholderTextColor="#8f8f8f" onChangeText={(text)=> setForm({...form, lname: text})}/>
                        </View>
                    </View>
                    {/* IC */}
                    <View>
                        <Text style={styles.label}>Passport/IC:</Text>
                        <TextInput style={styles.input} value={form.ic} onChangeText={(text)=> setForm({...form, ic: text})}/>
                    </View>
                    <View style={localStyles.row}>
                        {/* Email */}
                        <View>
                            <Text style={styles.label}>Email:</Text>
                                <TextInput style={styles.input} value={form.email}  placeholder='address@email.com' 
                                placeholderTextColor="#8f8f8f"  onChangeText={(text)=> setForm({...form, email: text})}/>
                        </View>
                        {/* Telefon */}
                        <View>
                            <Text style={styles.label}>Telefon:</Text>
                            <TextInput style={styles.input} value={form.telefon}  placeholder='012-3456789' 
                            placeholderTextColor="#8f8f8f"  onChangeText={(text)=> setForm({...form, telefon: text})}/>
                        </View>
                    </View>
                     <View>
                        <Text style={styles.label}>Role:</Text>
                        <View style={localStyles.row}>
                            <TouchableOpacity style={styles.row} onPress={()=>setForm({...form, role:'admin'})}>
                                <View style={localStyles.radioCircle}>
                                    {form.role==='admin' && <View style={localStyles.selectedRb}></View>}
                                </View>
                                <Text style={localStyles.radioText}>Admin</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.row} onPress={()=>setForm({...form, role:'parkguide'})}>
                                <View style={localStyles.radioCircle}>
                                    {form.role==='parkguide' && <View style={localStyles.selectedRb}></View>}
                                </View>
                                <Text style={localStyles.radioText}>Park Guide</Text>
                            </TouchableOpacity>
                        </View>
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
            {Object.values(errors).length > 0 ? (
                <Text style={{color: 'red', marginTop: 15}}>
                    {Object.values(errors).find(msg => msg !== null && msg !== "")}
                </Text>
            ) : null}
            <Pressable 
                style={styles.Btn} 
                onPress={handleSubmit}
                disabled={isLoading}
            >
                {isLoading ? <ActivityIndicator color="white" /> : <Text>Add User</Text>}
            </Pressable>  
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
    row:{
        flexDirection:'row',
        gap:20
    },
    radioCircle:{
        height:18,
        width:18,
        borderRadius:10,
        borderWidth:2,
        borderColor:'#2c3e50',
        alignItems:'center',
        justifyContent:'center',
        marginRight:10
    },
    selectedRb:{
        width:10,
        height:10,
        borderRadius:5,
        backgroundColor:'#2c3e50'
    }
})
;

export default UsersFormContent;

