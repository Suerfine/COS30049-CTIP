import { useEffect, useState } from 'react'; 
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView, Image, ImageBackground, StatusBar, Modal } from 'react-native';
import { ChevronLeft, SquarePen, X, Check } from 'lucide-react-native';
import {LinearGradient} from 'expo-linear-gradient';

// Import other hooks and components
import { useUserProfile } from '../hooks/useUserProfile';
import ModalLayout from '../components/ModalLayout';
import ChangePfpContent from '../components/ChangePfpContent';

const UserProfile=({navigation})=>{
    const {
        user,account,
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

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            <StatusBar barStyle="dark-content"/>
            <View style={styles.topSection}>
                {/* Top Section */}
                <Pressable onPress={()=>navigation.goBack()} style={({pressed})=>[styles.backButton, pressed && styles.btnPressed]}>
                    <ChevronLeft size={24} color="white"/>
                </Pressable>
            </View>
            <ScrollView>
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    {/* Background Image */}
                    <ImageBackground 
                        source={require('../../assets/forest.png')}
                        style={styles.backgroundImage}
                    >
                        <LinearGradient colors={['transparent', 'rgba(242, 242, 242, 0.2)', '#f2f2f2']} 
                            style={StyleSheet.absoluteFillObject}/>
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
                                <SquarePen size={15} color="white"/>
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
                        <Pressable style={styles.editBtn} onPress={()=>setIsEditing(true)}>
                            <Text style={styles.editBtnText}>Edit</Text>
                        </Pressable>
                    </View>
                    
                    {/* first name, last name and IC row*/}
                    <View style={styles.fieldRow}>
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>First Name</Text>
                            <Text style={styles.fieldValue}>{firstName}</Text>
                            {/* <TextInput
                                style={styles.input}
                                value={firstName}
                                onChangeText={setFirstName}
                                placeholder="First name" 
                                placeholderTextColor="grey"
                            /> */}
                        </View>

                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Last Name</Text>
                            <Text style={styles.fieldValue}>{lastName}</Text>
                            {/* <TextInput
                                style={styles.input}
                                value={lastName}
                                onChangeText={setLastName}
                                placeholder="Last name"
                                placeholderTextColor="grey"
                            /> */}
                        </View>
                    </View>

                    <View style={styles.fieldRow}>
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>IC / Passport No.</Text>
                            <Text style={styles.fieldValue}>{icPassport}</Text>
                            {/* <TextInput
                                style={styles.input}
                                value={icPassport}
                                onChangeText={setIcPassport}
                                placeholder="IC or passport number"
                                placeholderTextColor="grey"
                            /> */}
                        </View>
                    </View>

                    {/* email, phone and resume row */}
                    <View style={styles.fieldRow}>
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Email</Text>
                            <Text style={styles.fieldValue}>{email}</Text>
                            {/* <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Email address"
                                placeholderTextColor="grey"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            /> */}
                        </View>

                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Phone Number</Text>
                            <Text style={styles.fieldValue}>{phone}</Text>
                            {/* <TextInput
                                style={styles.input}
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="Phone number"
                                placeholderTextColor="grey"
                                keyboardType="phone-pad"
                            /> */}
                        </View>
                    </View>
                </View>
                <View style={styles.section}>
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
                </View>
                {/* Modal */}
                <Modal animationType="slide" transparent={true} visible={isEditing} onRequestClose={()=>setIsEditing(false)}>
                    <View style={styles.fullModalOverlay}>
                        <View style={styles.fullModalContent}>
                            {/* Header */}
                            <View style={styles.modalHeader}>
                                <Pressable onPress={()=>setIsEditing(false)} style={({pressed})=>[styles.icon, pressed && styles.btnPressed]}>
                                    <X size={24}/>
                                </Pressable>
                                <Pressable onPress={()=>setIsEditing(false)} style={styles.modalTitle}>
                                    <Text style={styles.modalTitle}>Edit Profile</Text>
                                </Pressable>
                                <Pressable style={({pressed})=>[styles.icon, pressed && styles.btnPressed]}>
                                    <Check size={24}/>
                                </Pressable>
                            </View>
                        
                            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                                <Text style={styles.modalSectionHint}>Update your personal details below.</Text>

                                {/* Names Row */}
                                <View style={styles.modalFieldRow}>
                                    <View style={[styles.modalFieldGroup, { marginRight: 10 }]}>
                                        <Text style={styles.modalInputLabel}>First Name</Text>
                                        <TextInput
                                            style={styles.modalInput}
                                            value={firstName}
                                            onChangeText={setFirstName}
                                            placeholder="e.g. Sin Mim"
                                        />
                                    </View>
                                    <View style={styles.modalFieldGroup}>
                                        <Text style={styles.modalInputLabel}>Last Name</Text>
                                        <TextInput
                                            style={styles.modalInput}
                                            value={lastName}
                                            onChangeText={setLastName}
                                            placeholder="e.g. Fam"
                                        />
                                    </View>
                                </View>

                                {/* IC / Passport */}
                                <View style={styles.modalFieldGroup}>
                                    <Text style={styles.modalInputLabel}>IC / Passport No.</Text>
                                    <TextInput
                                        style={styles.modalInput}
                                        value={icPassport}
                                        onChangeText={setIcPassport}
                                        keyboardType="default"
                                    />
                                </View>

                                {/* Email */}
                                <View style={styles.modalFieldGroup}>
                                    <Text style={styles.modalInputLabel}>Email Address</Text>
                                    <TextInput
                                        style={styles.modalInput}
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>

                                {/* Phone */}
                                <View style={styles.modalFieldGroup}>
                                    <Text style={styles.modalInputLabel}>Phone Number</Text>
                                    <TextInput
                                        style={styles.modalInput}
                                        value={phone}
                                        onChangeText={setPhone}
                                        keyboardType="phone-pad"
                                    />
                                </View>
                                
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        </SafeAreaView>
    )
};

const styles=StyleSheet.create({
    container: {
        flex: 1,
    },
    backButton:{
        width:40,
        height:40,
        zIndex:10,
        backgroundColor:'rgba(255, 255, 255, 0.3)',
        padding:8,
        borderRadius:50,
        marginLeft:10,
        position:'absolute',
        marginTop:15,
    },
    btnPressed:{
        opacity:0.8,
        transform:[{scale:0.98}],
    },
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
        marginTop: -50,
    },
    pfpWrapper:{
        position:'relative',
        width: 90,
        height: 90,
    },
    pfp:{
        width: 100,
        height: 100,
        borderRadius: 60,
        borderWidth: 5,
        borderColor: 'white',
    },
    pfpPlaceholder:{
        width: 100,
        height: 100,
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
        bottom: -10,
        right: -10,
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
        fontSize: 18,
        fontWeight: '600',
        color: 'black',
        marginTop: 50,
        marginLeft: 20,
    },
    section:{
        backgroundColor: 'white',
        borderRadius: 12,
        marginTop:20,
        marginHorizontal:10,
        paddingVertical: 20,
        paddingHorizontal:30
    },
    sectionHeader:{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    sectionTitle:{
        fontSize: 17,
        fontWeight: '700',
        color: 'black',
    },
    editBtn:{
        backgroundColor: '#2f6618fe',
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 7,
    },
    editBtnText:{
        fontSize: 13,
        color: 'white',
        fontWeight: '600',
    },
    fieldRow:{
        flexDirection: 'row',
        gap: 40,
        marginBottom: 16,
        flexWrap: 'wrap',
        justifyContent:'space-between'
    },
    fieldGroup:{
        flex: 1,
        minWidth: 140,
    },
    fieldLabel:{
        fontSize: 13,
        fontWeight: '500',
        color: 'black',
        marginBottom: 4,
        color:'#8a8e93',
    },
    fieldValue:{
        fontSize:15,
        color:'#1a1a1a',
        fontWeight:'400',
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
    fullModalOverlay:{
        justifyContent:'flex-end',
        flex:1
    },
    fullModalContent:{
        height:'93%',
        backgroundColor:'#f2f2f7',
        borderTopLeftRadius:30,
        borderTopRightRadius:30,
        overflow:'hidden',
    },
    modalTitle:{
        fontSize:17,
        fontWeight:'600',
    },
    modalHeader:{
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems:'center',
        padding:16,
        backgroundColor:'#fff',
        borderBottomWidth:1,
        borderBottomColor:"#e5e5e5"
    },
    btnPressed:{
        opacity:0.8,
        transform:[{scale:0.98}],
    },
    icon:{
        width:40,
        height:40,
        zIndex:10,
        backgroundColor:'rgba(168, 168, 168, 0.3)',
        padding:8,
        borderRadius:50,
        marginLeft:10,
    },modalBody: {
        padding: 20,
    },
    modalSectionHint: {
        fontSize: 14,
        color: '#666',
        marginBottom: 25,
    },
    modalFieldRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    modalFieldGroup: {
        flex: 1,
        marginBottom: 20,
    },
    modalInputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#0a6340',
        marginBottom: 8,
    },
    modalInput: {
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        color: '#333',
    },
});

export default UserProfile;