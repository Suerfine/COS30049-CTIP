import React, { useState, useEffect} from 'react';
import { View, Text, StyleSheet, Pressable, Image} from 'react-native';
import { LayoutDashboard, Book, ClipboardList, Flag, QrCode, Bell, LogOut, UserPlus, User2, Languages } from 'lucide-react-native'
import { CommonActions } from '@react-navigation/native';
import { useNavigationState, useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useUserDashboard } from '../hooks/useUserDashboard';
import { useUserProfile } from '../hooks/useUserProfile';
import { useTranslation } from 'react-i18next';

const SideBar = ({ mobile = false, onNavigate }) => {
    const {logout} =useAuth();
    const { user } = useUserDashboard();
    const { profileImage } = useUserProfile();
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language;
    const changeLanguage = (lang) => {
        i18n.changeLanguage(lang);
    };

    const navigation=useNavigation();
    const currentRoute = useNavigationState((state) => {
        if (!state) return null;
        let route=state.routes[state.index];
        while(route.state){
            route=route.state.routes[route.state.index];
        }
        return route.name;
    });
    const displayRoute = (currentRoute === 'AdminStack' || !currentRoute) 
        ? 'Admin Dashboard' 
        : currentRoute;
    // Navigation Link
    const menuItems = [
        { name: t('dashboard'), icon: LayoutDashboard, route: 'Admin Dashboard' },
        { name: t('registration'), icon: UserPlus, route: 'Registration Management' },
        { name: t('accounts'), icon: User2, route: 'Account Management' },
        { name: t('courses'), icon: Book, route: 'Course Management' },
        { name: t('enrollment'), icon: ClipboardList, route: 'Enrollment Management' },
        { name: t('anomaly'), icon: Flag, route: 'Anomaly Detection' },
        { name: t('ar models'), icon: QrCode, route: 'AR Models' },
    ];
    

    //Set State
    const [activePage, setActivePage]=useState('Courses');

    return (
        // SideBar
        <View style={[styles.sidebar, mobile && styles.sidebarMobile]}>
            <View style={styles.link}>
                <View style={styles.brandRow}>
                    <Image source={require('../../assets/sfc_logo.png')} style={styles.logo} accessibilityLabel='Logo of SFC'/>
                </View>
                {menuItems.map((item) => {
                    const IconComponent=item.icon;
                    const isExactMatch= displayRoute===item.route;
                    const isCourseDetailActive=item.name==='Courses' && displayRoute==='Course Details';
                    const isActive=isExactMatch || isCourseDetailActive;
                    
                    return(
                        <View key={item.name}>
                            {/* Parent menu item */}
                            <View style={styles.navItem}>
                                <Pressable
                                    style={({hovered})=>[styles.menuItem, isActive && styles.activeIcon, !isActive && hovered && styles.hoverStyle]}
                                        onPress={() => {
                                        setActivePage(item.name);
                                        navigation.navigate('AdminStack',{
                                            screen:item.route
                                        })
                                        onNavigate?.();
                                    }}
                                >
                                    <IconComponent style={styles.navIcon} />
                                    <Text style={[styles.navText, isActive && styles.activeText]}>{item.name}</Text>
                                </Pressable>
                            </View>
                        </View>

                    )
                })}
            </View>
            <View style={styles.linkbtn}>
                <Pressable
                    style={styles.menuItem}
                    onPress={() => {
                        navigation.navigate('AdminStack', {
                            screen: 'Notification Management'
                        });
                        onNavigate?.();
                    }}
                >
                    <Bell style={styles.navIcon} />
                    <Text style={styles.navText}>{t('notification')}</Text>
                </Pressable>

                <View style={styles.languageRow}>
                    <Languages style={styles.navIcon} />

                    <View style={styles.languageToggle}>
                        <Pressable
                            onPress={() => changeLanguage('en')}
                            style={[
                                styles.langOption,
                                currentLang === 'en' && styles.langActive
                            ]}
                        >
                            <Text style={[
                                styles.langText,
                                currentLang === 'en' && styles.langActiveText
                            ]}>
                                EN
                            </Text>
                        </Pressable>

                        <Pressable
                            onPress={() => changeLanguage('bm')}
                            style={[
                                styles.langOption,
                                currentLang === 'bm' && styles.langActive
                            ]}
                        >
                            <Text style={[
                                styles.langText,
                                currentLang === 'bm' && styles.langActiveText
                            ]}>
                                BM
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </View>

            <View style={styles.admin}>
                <View style={styles.adminInfo}>
                    {/* Profile  */}
                    {profileImage ? (
                        <Image source={{ uri: profileImage }} style={styles.profilePic}/>
                        ) : (
                            <View style={styles.pfpPlaceholder}>
                                <Text style={styles.pfpInitials}>
                                    {user?.firstname ? user?.firstname[0].toUpperCase() : '?'}
                                </Text>
                            </View>
                        )}
                        <View>
                            <Text>{user?.firstname}</Text>
                            <Text style={styles.role}>{user?.role === 'admin' && 'Admin'}</Text>
                        </View>
                </View>
                <Pressable
                    style={({ hovered }) => [
                        styles.logout,
                        hovered && styles.logoutHover, 
                    ]} onPress={()=>logout()}
                    >
                    <LogOut size={17}/>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    sidebar:{
        maxWidth:'220px',
        minHeight:'100vh',
        userSelect:'none',
        paddingHorizontal:20,
        flex:1,
        borderRightColor:'#3f3f3f4d',
        borderRightWidth:1,
        backgroundColor:"white"
    },
    sidebarMobile:{
        width:'100%',
        maxWidth:'none',
        minHeight:'auto',
        borderRightWidth:0,
    },
    brandRow:{
        minHeight:72,
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'center',
    },
    link:{
        gap:15,
        paddingBottom:25,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        width:'100%',
    },
    linkbtn:{
        paddingTop:8,
        width:'100%',
        gap: 8,
    },
    menuItem:{
        flexDirection:'row',
        gap:10,
        paddingHorizontal:10,
        paddingVertical:8,
        minWidth:0,
        width:'100%',
        borderRadius:'5px',
        alignItems:'center'
    },
    navText:{
        fontSize:15,
    },
    logo:{
        width:140,
        resizeMode:'contain',
        alignSelf:'center',
    },
    activeIcon:{
        backgroundColor:'#0a6340',
        color:'white'
    },
    activeText:{
        color:'white'
    },
    profile:{
        width:40,
        height:40,
        borderRadius:50,
        resizeMode:'contain',
    },
    admin:{
        flex: 1,
        justifyContent:'space-between',
        alignItems:'flex-end',
        paddingBottom:10,
        flexDirection:'row',
        gap:15,
            
    },
    logout:{
        marginBottom:10,
        color:'#474747'
    },
    adminInfo:{
        flexDirection:'row',
        alignItems:'center',
        gap:5
    },
    hoverStyle:{
        backgroundColor:"#eaefeb"
    },
    logoutHover:{
        color:'#efab21'
    },
    role:{
        fontSize:12,
        color:"#6a6a6a"
    },
    pfpPlaceholder:{
        width: 40,
        height: 40,
        borderRadius: 60,
        backgroundColor: '#2f6618fe',
        borderWidth: 1,
        borderColor: '#ccc',
        alignItems: 'center',
        justifyContent: 'center',
    },
    profilePic:{
        width: 40,
        height: 40,
        borderRadius: 60,
        marginRight: 6,
        borderWidth: 1,
        borderColor: '#ccc',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pfpInitials:{
        fontSize: 14,
        fontWeight: '700',
        color: 'white',
    },
    languageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
        width: '100%',
    },

    languageToggle: {
        flexDirection: 'row',
        backgroundColor: '#e8e8e8',
        borderRadius: 20,
        padding: 3,
    },
    langOption: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 15,
    },
    langActive: {
        backgroundColor: '#0a6340',
    },
    langText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#555',
    },
    langActiveText: {
        color: 'white',
    },
});

export default SideBar;
