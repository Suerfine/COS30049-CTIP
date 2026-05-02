import {useState, useEffect} from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView, Image, ImageBackground, Dimensions, Modal } from 'react-native';
import { SquarePen } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Eye, EyeOff, FileUp } from 'lucide-react-native';

// Import other hooks and components
import ChangePfpContent from '../components/ChangePfpContent';
import ChangePasswordContent from '../components/ChangePasswordContent';
import ModalLayout from '../components/ModalLayout';
import { ModalStyle } from '../components/ModalStyle';
import { useUserProfile } from '../hooks/useUserProfile';
import { useSignUp } from '../hooks/useSignUp';

const UserProfile = ({ navigation }) => {
    const {
        user,
        firstName, setFirstName,
        lastName,setLastName,
        icPassport, setIcPassport,
        email, setEmail,
        phone,setPhone,
        resume, setResume,
        username,setUsername,
        password,setPassword,
        editingUsername, setEditingUsername,
        editingPassword, setEditingPassword,
        pfpModalVisible, setPfpModalVisible,
        passwordModalVisible, setPasswordModalVisible,
        newImagePath, setNewImagePath,
        showCurrentPassword, setShowCurrentPassword,
        showNewPassword, setShowNewPassword,
        currentPassword, setCurrentPassword,
        pickImage,
        isEditing, setIsEditing,
    }=useUserProfile();

    const { 
        handleUpload,
        file, setFile,
        error, setError,
     }=useSignUp();
    return(
        <View style={styles.container}>
            <ScrollView>
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    {/* Background Image */}
                    <ImageBackground 
                        source={require('../../assets/forest.png')}
                        style={styles.backgroundImage}
                    >
                    </ImageBackground>

                    {/* Pfp and name */}
                    <View style={styles.pfpRow}>
                        <View style={styles.pfpWrapper}>
                            {user?.profileImage ? (
                                <Image source={{ uri: user.profileImage }} style={styles.pfp} />
                            ) : (
                                <View style={styles.pfpPlaceholder}>
                                    <Text style={styles.pfpInitials}>
                                        {firstName ? firstName[0].toUpperCase() : '?'}
                                    </Text>
                                </View>
                            )}

                            {/* edit profile button */}
                            <Pressable 
                                style={({ hovered }) => [
                                    styles.pfpEditBtn,
                                    hovered && styles.hoverBtn
                                ]}
                                onPress={() => setPfpModalVisible(true)}
                            >
                                <SquarePen size={18} color="white"/>
                            </Pressable>
                        </View>

                        <Text style={styles.name}>
                            {firstName || lastName
                                ? `${firstName} ${lastName}`.trim()
                                : 'Name'}
                        </Text>
                    </View>

                    {/* Change pfp modal */}
                    <ModalLayout visible={pfpModalVisible} onClose={() => setPfpModalVisible(false)}>
                        <ChangePfpContent
                            image={newImagePath || user?.profileImage}
                            onPickImage={pickImage}
                            onClose={() => setPfpModalVisible(false)}
                        />
                    </ModalLayout>
                </View>

                {/* Personal Information */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Personal Information</Text>
                        <View style={styles.actionButtons}>
                            <Pressable style={styles.cancelBtn}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </Pressable>
                            <Pressable style={styles.saveBtn}>
                                <Text style={styles.saveBtnText}>Save Changes</Text>
                            </Pressable>
                        </View>
                    </View>
                    
                    {/* first name, last name and IC row*/}
                    <View style={styles.fieldRow}>
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>First Name</Text>
                            <TextInput
                                style={styles.input}
                                value={firstName}
                                onChangeText={setFirstName}
                                placeholder="First name" 
                                placeholderTextColor="grey"
                            />
                        </View>

                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Last Name</Text>
                            <TextInput
                                style={styles.input}
                                value={lastName}
                                onChangeText={setLastName}
                                placeholder="Last name"
                                placeholderTextColor="grey"
                            />
                        </View>
                    </View>
                    
                    <View style={styles.fieldRow}>
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>IC / Passport No.</Text>
                            <TextInput
                                style={styles.input}
                                value={icPassport}
                                onChangeText={setIcPassport}
                                placeholder="IC or passport number"
                                placeholderTextColor="grey"
                            />
                        </View>
                    </View>

                    <View style={styles.fieldRow}>
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Email</Text>
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Email address"
                                placeholderTextColor="grey"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Phone Number</Text>
                            <TextInput
                                style={styles.input}
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="Phone number"
                                placeholderTextColor="grey"
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>
                </View>
                <View style={styles.section}>
                    {/* Resume/CV */}
                    <View>
                        <Text style={styles.label}>Resume / CV (PDF or Word)</Text>
                        {!file ? (
                            <Pressable style={({pressed})=>[
                                styles.uploadBox, pressed && {backgroundColor: '#f0fdf4'}
                            ]}
                            onPress={handleUpload}>
                                <FileUp size={32} color="#666"/>
                                <Text style={styles.uploadText}>Click here to upload resume</Text>
                                <Text style={styles.subtext}>PDF, DOC, or DOCX (Max 5MB)</Text>
                            </Pressable>
                        ):(
                            <View style={styles.fileCard}>
                                <View style={styles.fileInfo}>
                                    <FileCheck size={24} color="#0a6340"/>
                                    <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                                </View>
                                <Pressable onPress={removeFile} style={styles.removeBtn}>
                                    <X size={20} color="#ff4d4d"/>
                                </Pressable>
                            </View>
                        )}
                    </View>
                </View>
                    {/* <View style={styles.fieldRow}>
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Resume</Text>
                            <View style={styles.resumeRow}>
                                <TextInput
                                    style={[styles.input, styles.resumeInput]}
                                    value={resume}
                                    onChangeText={setResume}
                                    placeholder="No file selected"
                                    placeholderTextColor="grey"
                                    editable={false}
                                />
                                <Pressable 
                                    style={({ hovered }) => [
                                        styles.uploadBtn,
                                        hovered && styles.hoverBtn
                                    ]}
                                    onPress={() => setPasswordModalVisible(true)}
                                >
                                    <Text style={styles.uploadBtnText}>Upload</Text>
                                </Pressable>
                            </View>
                        </View>
                    </View> */}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container:{
        flex:1,
    },
    // Profile header
    profileHeader:{
        marginBottom: 8,
    },
    backgroundImage:{
        width:'100%',
        height: 160,
        overflow:'hidden',
    },
    pfpRow:{
        flexDirection:'row',
        alignItems:'center',
        paddingHorizontal: 20,
        gap: 14,
        marginTop: -40,
        marginBottom: 20,
        marginLeft: 20,
    },
    pfpWrapper:{
        position:'relative',
        width: 90,
        height: 90,
    },
    pfp:{
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 5,
        borderColor: 'white',
    },
    pfpPlaceholder:{
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#2f6618fe',
        borderWidth: 5,
        borderColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pfpInitials:{
        fontSize: 32,
        fontWeight: '700',
        color: 'white',
    },
    pfpEditBtn:{
        position: 'absolute',
        bottom: -20,
        right: -30,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#2f6618fe',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    name:{
        fontSize: 20,
        fontWeight: '600',
        color: 'black',
        marginTop: 50,
        marginLeft: 40,
    },
    // Personal info section
    section:{
        backgroundColor: 'white',
        marginHorizontal: 100,
        marginVertical: 16,
        marginBottom: 30,
        borderRadius: 12,
        padding: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionHeader:{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    sectionTitle:{
        marginBottom: 20,
        fontSize: 17,
        fontWeight: '700',
        color: 'black',
    },
    actionButtons:{
        flexDirection: 'row',
        gap: 12,
    },
    cancelBtn:{
        borderWidth: 1,
        borderColor: '#2f6618fe',
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 7,
    },
    cancelBtnText:{
        fontSize: 13,
        color: '#2f6618fe',
        fontWeight: '500',
    },
    saveBtn:{
        backgroundColor: '#2f6618fe',
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 7,
    },
    saveBtnText:{
        fontSize: 13,
        color: 'white',
        fontWeight: '600',
    },
    // Input fields
    fieldRow:{
        flexDirection: 'row',
        gap: 40,
        marginBottom: 25,
        flexWrap: 'wrap',
    },
    fieldGroup:{
        flex: 1,
        minWidth: 140,
    },
    fieldLabel:{
        fontSize: 13,
        fontWeight: '600',
        color: 'black',
        marginBottom: 6,
    },
    input:{
        borderWidth: 1,
        borderColor: '#2f6618fe',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: 'black',
        backgroundColor: 'white',
    },
    inputDisabled:{
        backgroundColor: '#F3F4F6',
        color: 'grey',
    },
    // Upload resume
    resumeRow:{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    resumeInput:{
        flex: 1,
    },
    uploadBtn:{
        borderWidth: 1,
        borderColor: '#2f6618fe',
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    uploadBtnText:{
        fontSize: 13,
        color: '#2f6618fe',
        fontWeight: '500',
    },
    // hover button styles
    hoverBtn: {
        backgroundColor: '#A5D6A7',
    },
    hoverBtnOutline: {
        backgroundColor: '#e6f2e6',
    },
    // Resume section
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginLeft: 5,
    },
        uploadBox:{
        borderWidth:2,
        borderStyle:'dashed',
        borderColor:'#ccc',
        borderRadius:12,
        padding:30,
        alignItems:'center',
        backgroundColor:'#fafafa',
        marginTop:10
    },
    uploadText:{
        marginTop:10,
        fontSize:16,
        color:'#333',
        fontWeight:'500',
    },
    subtext:{
        fontSize:12,
        color:'#888',
        marginTop:4
    },
    fileCard:{
        flexDirection:'row',
        alignItems:"center",
        justifyContent:'space-between',
        padding:15,
        backgroundColor:'#eafaf1',
        borderRadius:12,
        borderWidth:1,
        borderColor:'#0a6340',
        marginTop:10
    },
    fileInfo:{
        flexDirection:'row',
        alignItems:'center',
        flex:1,
        gap:10,
    },
    fileName:{
        fontSize:14,
        color:'#333',
        fontWeight:'500'
    },
    removeBtn:{
        padding:5
    },
    errorText: {
        color: '#b42318',
        fontSize: 13,
        fontWeight: '600',
        marginTop: 2,
        textAlign: 'left',
    },
});

export default UserProfile;