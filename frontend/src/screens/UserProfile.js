import {useState, useEffect} from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView, Image, ImageBackground, Dimensions, Modal } from 'react-native';
import { SquarePen } from 'lucide-react-native';
import NavBar from '../components/NavBar';
import ModalLayout from '../components/ModalLayout';
import { ModalStyle } from '../components/ModalStyle';
import { Eye, EyeOff } from 'lucide-react-native';
import { useUserDashboard } from '../hooks/useUserDashboard';

const UserProfile = ({ navigation }) => {
    const {user,account} = useUserDashboard();
    // Personal Information state
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [icPassport, setIcPassport] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [resume, setResume] = useState('');

    // Account Security state
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
 
    // Edit mode toggles
    const [editingUsername, setEditingUsername] = useState(false);
    const [editingPassword, setEditingPassword] = useState(false);

    // Modal visibility
    const [pfpModalVisible, setPfpModalVisible] = useState(false);
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);

    // Dummy image path
    const [newImagePath, setNewImagePath] = useState('');

    // Password visibility
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
 

    // Populate fields
    useEffect(() => {
        if (user) {
            setFirstName(user.fname || '');
            setLastName(user.lname || '');
            setIcPassport(user.ic || '');
            setEmail(user.email || '');
            setPhone(user.telefon || '');
            setResume(user.resume || '');
        }
        if (account) {
            setUsername(account.username || '');
        }
    }, [user, account]);
    
    return(
        <View style={style.container}>
            <NavBar/>

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
                                <Image
                                    source={{ uri: user.profileImage }}
                                    style={styles.pfp}
                                />
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
                                <SquarePen style={styles.pfpEditIcon}/>
                            </Pressable>
                        </View>
 
                        <Text style={styles.name}>
                            {firstName || lastName
                                ? `${firstName} ${lastName}`.trim()
                                : 'Name'}
                        </Text>
                    </View>
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
 
                    {/* email, phone and resume row */}
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
                                <Pressable style={styles.uploadBtn}>
                                    <Text style={styles.uploadBtnText}>Upload</Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Divider */}
                <View style={styles.divider} />
                
                {/* Account Security */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account Security</Text>
 
                    {/* Username */}
                    <View style={styles.securityField}>
                        <Text style={styles.fieldLabel}>Username</Text>
                        <View style={styles.securityRow}>
                            <TextInput
                                style={[styles.input, styles.securityInput, !editingUsername && styles.inputDisabled]}
                                value={username}
                                onChangeText={setUsername}
                                placeholder="Username"
                                placeholderTextColor="grey"
                                editable={editingUsername}
                                autoCapitalize="none"
                            />
                            <Pressable 
                                style={({ hovered }) => [
                                    styles.changeBtn,
                                    hovered && styles.hoverBtn
                                ]}
                                onPress={() => {
                                    if (editingUsername) {
                                        // user click confirm button, save changes and exit edit mode
                                        setEditingUsername(false);
                                    } else {
                                        setEditingUsername(true);
                                    }
                                }}
                            >
                                <Text style={styles.changeBtnText}>
                                    {editingUsername ? 'Confirm' : 'Change'}
                                </Text>
                            </Pressable>

                            {editingUsername && (
                                <Pressable 
                                    style={({ hovered }) => [
                                        styles.cancelBtn,
                                        hovered && styles.hoverBtnOutline
                                    ]}
                                    onPress={() => {
                                        setEditingUsername(false);
                                        setUsername(account?.username || '');
                                    }}
                                >
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </Pressable>
                            )}
                        </View>
                    </View>
 
                    {/* Password */}
                    <View style={styles.securityField}>
                        <Text style={styles.fieldLabel}>Password</Text>
                        <View style={styles.securityRow}>
                            <TextInput
                                style={[styles.input, styles.securityInput, !editingPassword && styles.inputDisabled]}
                                value={editingPassword ? password : '••••••••'}
                                onChangeText={setPassword}
                                placeholder="New password"
                                placeholderTextColor="grey"
                                secureTextEntry={editingPassword}
                                editable={editingPassword}
                                autoCapitalize="none"
                            />
                            <Pressable 
                                style={({ hovered }) => [
                                    styles.changeBtn,
                                    hovered && styles.hoverBtn
                                ]}
                                onPress={() => setPasswordModalVisible(true)}
                            >
                                <Text style={styles.changeBtnText}>
                                    {editingPassword ? 'Save' : 'Change'}
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </ScrollView>
            
            {/* Change pfp modal */}
            <ModalLayout visible={pfpModalVisible} onClose={() => setPfpModalVisible(false)}>
                <View style={ModalStyle.container}>

                    <View style={[ModalStyle.row, ModalStyle.header]}>
                        <Text style={ModalStyle.title}>Change Profile Picture</Text>
                    </View>

                    {/* Current Image */}
                    <View style={ModalStyle.imagePicker}>
                        {user?.profileImage ? (
                            <Image source={{ uri: user.profileImage }} style={ModalStyle.previewImage}/>
                        ) : (
                            <Text>No Image</Text>
                        )}
                    </View>

                    {/* Upload row */}
                    <View style={ModalStyle.row}>
                        <TextInput
                            style={ModalStyle.input}
                            value={newImagePath}
                            onChangeText={setNewImagePath}
                            placeholder="Image path..."
                        />

                        <Pressable
                            style={({ hovered }) => [
                                ModalStyle.Btn,
                                hovered && styles.hoverBtn
                            ]}
                        >
                            <Text>Upload Image</Text>
                        </Pressable>
                    </View>

                </View>
            </ModalLayout>
            
            {/* Change password modal */}
            <ModalLayout visible={passwordModalVisible} onClose={() => setPasswordModalVisible(false)}>
                <View style={ModalStyle.container}>

                    <View style={[ModalStyle.row, ModalStyle.header]}>
                        <Text style={ModalStyle.title}>Change Password</Text>
                    </View>

                    {/* Current Password */}
                    <Text style={ModalStyle.label}>Current Password</Text>
                    <View style={ModalStyle.row}>
                        <TextInput
                            style={ModalStyle.input}
                            value={showCurrentPassword ? currentPassword : '••••••••'}
                            onChangeText={setCurrentPassword}
                            secureTextEntry={!showCurrentPassword}
                            editable={showCurrentPassword}
                        />

                        <Pressable onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                            {showCurrentPassword ? <EyeOff/> : <Eye/>}
                        </Pressable>
                    </View>

                    {/* New Password */}
                    <Text style={ModalStyle.label}>New Password</Text>
                    <View style={ModalStyle.row}>
                        <TextInput
                            style={ModalStyle.input}
                            value={showNewPassword ? password : '••••••••'}
                            onChangeText={setPassword}
                            secureTextEntry={!showNewPassword}
                            editable={showNewPassword}
                        />

                        <Pressable onPress={() => setShowNewPassword(!showNewPassword)}>
                            {showNewPassword ? <EyeOff/> : <Eye/>}
                        </Pressable>
                    </View>

                    {/* Confirm Button */}
                    <Pressable
                        style={({ hovered }) => [
                            ModalStyle.Btn,
                            hovered && styles.hoverBtn
                        ]}
                    >
                        <Text>Confirm</Text>
                    </Pressable>

                </View>
            </ModalLayout>
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
    pfpEditIcon:{
        color: 'white',
        fontSize: 20,
        padding: 4,
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
        marginHorizontal: 50,
        marginVertical: 16,
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
        marginBottom: 16,
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
    // Divider
    divider: {
        height: 1,
        backgroundColor: 'black',
        marginHorizontal: 50,
        marginVertical: 20,
    },
    // Account Security
    securityField:{
        marginBottom: 18,
    },
    securityRow:{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    securityInput:{
        flex: 1,
    },
    changeBtn:{
        borderWidth: 1,
        borderColor: '#2f6618fe',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    changeBtnText:{
        fontSize: 13,
        color: '#2f6618fe',
        fontWeight: '500',
    },
    // hover button styles
    hoverBtn: {
        backgroundColor: '#1f4d12',
    },

    hoverBtnOutline: {
        backgroundColor: '#e6f2e6',
    },
});

export default UserProfile;