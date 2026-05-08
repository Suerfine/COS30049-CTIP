import { View, Text, StyleSheet, ScrollView, Pressable, StatusBar, Image, TextInput, Modal } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, ChevronLeft, ChevronRight, Languages,X, Check } from 'lucide-react-native';

// Import from other hook and components
import { useUserProfile } from '../hooks/useUserProfile';
import ModalLayout from '../components/ModalLayout';
import { ModalStyle } from '../components/ModalStyle';
import ChangePasswordContent from '../components/ChangePasswordContent';
import { useSetLanguage } from '../hooks/useSetLanguage';
import { useTranslation } from 'react-i18next';

const Settings=({navigation})=>{
    const {t, i18n}=useTranslation();

    const {
        form, user,editingUsername, setEditingUsername,
        editingPassword, setEditingPassword,username,setUsername,
        password,setPassword,passwordModalVisible, setPasswordModalVisible,currentPassword, setCurrentPassword,showCurrentPassword, setShowCurrentPassword,
        showNewPassword, setShowNewPassword,account
    }=useUserProfile();

    const {
        language,
        langModalVisible,
        openLanguageModal,
        closeLanguageModal,
        selectLanguage,
        getLanguageDisplay,
    }=useSetLanguage();

    const handleLanguageSelect=(langVal)=>{
        selectLanguage(langVal);
        const langCode=langVal==='Bahasa Melayu' ? 'bm':'en';
        i18n.changeLanguage(langCode);
    };

    return(
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            <StatusBar barStyle="dark-content"/>
            {/* Top Section */}
            <Pressable onPress={()=>navigation.goBack()} style={({pressed})=>[styles.backButton, pressed && styles.btnPressed]}>
                <ChevronLeft size={24} color="black"/>
            </Pressable>

            {/* View profile */}
            <Pressable style={({ pressed }) => [
                styles.profileInfo,
                pressed && styles.sectionPressed
                ]}
                onPress={()=>{
                    navigation.navigate('ParkGuideMobileRoot', {
                        screen: 'Profile'
                    });
                }}
                >
                <View style={styles.info}>
                    {user?.profileImage ? (
                    <Image source={{ uri: user.profileImage }} style={styles.avatar}/>
                    ) : (
                        <View style={styles.pfpPlaceholder}>
                            <Text style={styles.pfpInitials}>
                                {user?.firstname ? user?.firstname[0].toUpperCase() : '?'}
                            </Text>
                        </View>
                    )}
                    <View style={styles.textContainer}>
                        <Text style={styles.name}>
                            {form.firstname+" "+form.lastname}
                        </Text>
                        <Text style={styles.subText}>{t('view profile')}</Text>
                    </View>
                </View>
                
                <ChevronRight size={20} color="#999"/>
            </Pressable>
            {/* Security */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('account')} {t("security")}</Text>

                {/* Username */}
                <View style={styles.securityField}>
                    <Text style={styles.fieldLabel}>{t('username')}</Text>
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
                                {editingUsername ? t('confirm'): t('change')}
                            </Text>
                        </Pressable>

                        {editingUsername && (
                            <Pressable 
                                style={
                                    styles.cancelBtn
                                    }
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
                    <Text style={styles.fieldLabel}>{t("password")}</Text>
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
                            style={
                                styles.changeBtn}
                            onPress={() => setPasswordModalVisible(true)}
                        >
                            <Text style={styles.changeBtnText}>
                                {editingUsername ? t('save'): t('change')}
                            </Text>
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
                        />
                    </ModalLayout>
                </View>
            </View>
            {/* General */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('general')}</Text>
                <View style={styles.listGroup}>
                    {/* Language */}
                    <Pressable style={styles.listItem}
                    onPress={openLanguageModal}
                    >
                        <View style={styles.listItemLoading}>
                            <View style={[styles.iconBox,{ backgroundColor: '#e8f5e9' }]}>
                                <Languages size={20} color="#0a6340"/>
                            </View>
                            <Text style={styles.listItemText}>
                                {t('language')}
                            </Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.selectionText}>{getLanguageDisplay()}</Text>
                            <ChevronRight size={18} color="#ccc"/>
                        </View>
                    </Pressable>

                    <View style={styles.divider}/>

                    {/* Notification */}
                    <Pressable style={styles.listItem}>
                        <View style={styles.listItemLoading}>
                            <View style={[styles.iconBox, {backgroundColor:'#fff3e0'}]}>
                                <Bell size={20} color="#f57c00"/>
                            </View>
                            <Text style={styles.listItemText}>{t("notification")}</Text>
                        </View>
                        <ChevronRight size={18} color="#ccc"/>
                    </Pressable>
                </View>
            </View>

            {/* Language Modal */}
            <Modal animationType="slide" transparent={true} visible={langModalVisible} onRequestClose={closeLanguageModal}>
                <View style={styles.fullModalOverlay}>
                    <View style={styles.fullModalContent}>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <Pressable onPress={closeLanguageModal} style={({pressed})=>[styles.backButton, pressed && styles.btnPressed]}>
                                <X size={24}/>
                            </Pressable>
                            <Pressable onPress={closeLanguageModal} style={styles.modalTitle}>
                                <Text style={styles.modalTitle}>{t('language')}</Text>
                            </Pressable>
                        </View>
                        {[
                            { label: 'English', sub: 'BI', val: 'English' },
                            { label: 'Bahasa Melayu', sub: 'BM', val: 'Bahasa Melayu' }
                        ].map((item) => (
                            <Pressable 
                                key={item.val} 
                                style={styles.langItem} 
                                onPress={() => handleLanguageSelect(item.val)}
                            >
                                <View>
                                    <Text style={styles.langLabel}>{item.label}</Text>
                                    <Text style={styles.langSub}>{item.sub}</Text>
                                </View>
                                {language === item.val && <Check size={20} color="#0a6340" />}
                            </Pressable>
                        ))}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    )
};

const styles=StyleSheet.create({
    container: {
        flex: 1,
        marginHorizontal: 10
    },
    backButton:{
        width:40,
        height:40,
        zIndex:10,
        backgroundColor:'rgba(168, 168, 168, 0.3)',
        padding:8,
        borderRadius:50,
        marginTop:15
    },
    profileInfo:{
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'space-between',
        backgroundColor:'white',
        marginHorizontal:20,
        marginTop:10,
        padding:16,
        borderRadius:16,
        elevation:2
    },
    avatar:{
        width: 60,
        height: 60,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: 'white',
    },
    pfpPlaceholder:{
        width: 90,
        height: 90,
        marginBottom: 10,
        borderRadius: 60,
        backgroundColor: '#2f6618fe',
        borderWidth: 3,
        borderColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pfpInitials:{
        fontSize: 32,
        fontWeight: '700',
        color: 'white',
    },
    sectionPressed: {
        backgroundColor: '#f0f0f0',
        transform: [{ scale: 0.98 }],
    },
    textContainer:{
        marginLeft:15
    },
    info:{
        flexDirection:'row',
        alignItems:'center'
    },
    name:{
        fontSize:16,
        fontWeight:'600',
        color:'#1a1a1a'
    },
    subText:{
        fontSize:14,
        color:'#666',
        marginTop:2
    },
    section:{
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        elevation: 2,
        marginHorizontal:20,
        marginTop:15
    },
    sectionTitle:{
        marginBottom: 20,
        fontSize: 17,
        fontWeight: '600',
        color: 'black',
    },
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
    listGroup:{
        backgroundColor: 'white', 
        borderRadius: 16, 
        overflow: 'hidden'
    },
    listItem:{
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'space-between',
        padding:15
    },
    listItemLoading:{
        flexDirection:'row',
        alignItems:'center'
    },
    iconBox:{
        width: 36, 
        height: 36, 
        borderRadius: 10, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginRight: 12
    },
    listItemText:{
        fontSize:14,
        fontWeight:'500'
    },
    row:{
        flexDirection:"row"
    },
    selectionText:{
        color:'#8e8e93',
        marginRight:10,
        fontSize:14
    },
    divider:{
        height:1,
        backgroundColor:'#f2f2f7',
        marginLeft:62
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
    langLabel:{
        fontSize:16,
        fontw:'500'
    },
    langSub:{
        fontSize:12,
        color:'#999'
    },
    langItem:{
        flexDirection:'row',
        alignItems:"center",
        justifyContent:'space-between',
        paddingVertical:20, 
        borderBottomWidth:1,
        borderBottomColor:'#eee',
        backgroundColor:'white',
        paddingHorizontal:10
    }
});

export default Settings;