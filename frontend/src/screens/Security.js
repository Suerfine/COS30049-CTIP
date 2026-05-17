import {useState, useEffect} from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView, Image, ImageBackground, Dimensions, Modal, Alert, useWindowDimensions} from 'react-native';
import { SquarePen } from 'lucide-react-native';
import { Eye, EyeOff } from 'lucide-react-native';

// Import other hooks and components
import ChangePasswordContent from '../components/ChangePasswordContent';
import ModalLayout from '../components/ModalLayout';
import { ModalStyle } from '../components/ModalStyle';
import { useUserProfile } from '../hooks/useUserProfile';
import { useTranslation } from 'react-i18next';

const Security = ({ navigation }) => {
    const {
        user,
        username,setUsername,
        password,setPassword,
        editingUsername, setEditingUsername,
        editingPassword, setEditingPassword,
        passwordModalVisible, setPasswordModalVisible,
        showCurrentPassword, setShowCurrentPassword,
        showNewPassword, setShowNewPassword,
        currentPassword, setCurrentPassword,
        handleSavePassword, handleSaveUsername,
    }=useUserProfile();
    const {t, i18n}=useTranslation();
    const [errors, setErrors] = useState({});
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    const clearError = (field) => {
        setErrors(prev => {
            const updated = { ...prev };
            delete updated[field];
            return updated;
        });
    };
    
    const validateUsername = () => {
        let tempErrors = {};

        if (!username.trim()) {
            tempErrors.username = "* Username is required.";
        } else if (!/^[A-Za-z]+#[0-9]{4}$/.test(username)) {
            tempErrors.username = "* Username must follow format: name#1234 (letters + # + 4 digits).";
        }

        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    return(
        <View style={styles.container}>
            <ScrollView>
                {/* Account Security */}
                <View style={[
                    styles.section,
                    isMobile && styles.sectionMobile
                ]}>
                    <Text style={styles.sectionTitle}>{t('account security')}</Text>

                    {/* Username */}
                    <View style={styles.securityField}>
                        <Text style={styles.fieldLabel}>{t('username')}</Text>
                        <View style={[
                            styles.securityRow,
                            isMobile && styles.securityRowMobile
                        ]}>
                        <TextInput
                            style={[styles.input, styles.securityInput, !editingUsername && styles.inputDisabled]}
                            value={username}
                            onChangeText={(text) => {
                                setUsername(text);
                                clearError("username");
                            }}
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
                                        if (validateUsername()) {
                                            handleSaveUsername();
                                        }
                                    } else {
                                        setEditingUsername(true);
                                    }
                                }}
                            >
                                <Text style={styles.changeBtnText}>
                                    {editingUsername ? t('confirm'): t('change')}
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
                                        setUsername(user?.username || '');
                                    }}
                                >
                                    <Text style={styles.cancelBtnText}>{t('cancel')}</Text>
                                </Pressable>
                            )}
                        </View>
                        {errors.username && (
                            <Text style={styles.errorText}>{errors.username}</Text>
                        )}
                    </View>

                    {/* Password */}
                    <View style={styles.securityField}>
                        <Text style={styles.fieldLabel}>Password</Text>
                        <View style={styles.securityRow}>
                            <TextInput
                                style={[styles.input, styles.securityInput, styles.inputDisabled]}
                                value='••••••••'
                                editable={false}
                            />
                            <Pressable 
                                style={({ hovered }) => [
                                    styles.changeBtn,
                                    hovered && styles.hoverBtn
                                ]}
                                onPress={() => setPasswordModalVisible(true)}
                            >
                                <Text style={styles.changeBtnText}>{t('change')}</Text>
                            </Pressable>
                        </View>

                        {/* Change password modal */}
                        <ModalLayout 
                            visible={passwordModalVisible} 
                            onClose={() => setPasswordModalVisible(false)}
                        >
                            <ChangePasswordContent
                                currentPassword={currentPassword}
                                setCurrentPassword={setCurrentPassword}
                                password={password}
                                setPassword={setPassword}
                                showCurrentPassword={showCurrentPassword}
                                setShowCurrentPassword={setShowCurrentPassword}
                                showNewPassword={showNewPassword}
                                setShowNewPassword={setShowNewPassword}
                                onClose={() => setPasswordModalVisible(false)}
                                onSave={(currentPw, newPw) => handleSavePassword(currentPw, newPw)}
                            />
                        </ModalLayout>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container:{
        flex:1,
    },
    section:{
        backgroundColor: 'white',
        width: '90%',
        maxWidth: 900,
        alignSelf: 'center',
        marginVertical: 16,
        borderRadius: 12,
        padding: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionMobile: {
        width: '92%',
        padding: 18,
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
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 80,
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
        width: '100%',
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
    // Account Security
    securityField:{
        marginBottom: 18,
    },
    securityRow:{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
    },
    securityRowMobile: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    securityInput:{
        flex: 1,
        minWidth: 0,
    },
    changeBtn:{
        borderWidth: 1,
        borderColor: '#2f6618fe',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 90,
    },
    changeBtnText:{
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
    errorText: {
        color: "#b42318",
        fontSize: 13,
        fontWeight: "600",
        marginTop: 2,
        textAlign: "left",
    },
});

export default Security;