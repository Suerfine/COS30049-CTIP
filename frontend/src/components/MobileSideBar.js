import React,{useEffect, useRef, useState} from 'react';
import {View, Text, TextInput, Pressable, StyleSheet, Animated, Dimensions, Image} from 'react-native';
import { UserPen, Calendar, Award, Settings, LogOut } from 'lucide-react-native';
import { useUserDashboard } from '../hooks/useUserDashboard';
import { useNavigation, CommonActions } from '@react-navigation/native';
import UserProfile from '../screens/UserProfile.native';
import { useAuth } from '../context/AuthContext';
import { useUserProfile } from '../hooks/useUserProfile';

const {width}=Dimensions.get('window');

const MobileSideBar=({isOpen, onClose})=>{
    const navigation=useNavigation();
    const { logout } = useAuth();
    const slideAnim=useRef(new Animated.Value(-width)).current;
    const [shouldRender, setShouldRender]=useState(isOpen);
    const {user}=useUserDashboard();
    const {profileImage} = useUserProfile();

    const handleLogout = async () => {
        await logout();
      };

    useEffect(()=>{
        if(isOpen){
            setShouldRender(true);
            Animated.timing(slideAnim,{
                toValue: 0,
                duration:300,
                useNativeDriver:true,
            }).start();
        }else{
            Animated.timing(slideAnim,{
                toValue:-width,
                duration:300,
                useNativeDriver:true,
            }).start(()=>setShouldRender(false));
        }
        
    }, [isOpen]);

    if(!shouldRender){
        return null;
    }

    const menuItems=[
        {id: 'profile', label:'Profile', icon: UserPen, route:'Profile'},
        {id: 'calendar', label:'Calendar', icon: Calendar, route:'To Do'},
        {id: 'badges', label:'Badges', icon: Award},
        {id: 'settings', label:'Settings', icon: Settings, route:'Settings'},
    ];

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents={isOpen ? 'auto' : 'none'}>
            <Pressable style={styles.overlay} onPress={onClose} />

            {/* Sliding Content */}
            <Animated.View style={[
                styles.sidebarContainer, 
                { transform: [{ translateX: slideAnim }] }
            ]}>
                <View style={styles.content}>
                    <View>
                        <View style={styles.pfpWrapper}>
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
                            <Text style={styles.username}>{user?.username}</Text>
                        </View>

                            {/* Content */}
                            {menuItems.map((item) => (
                                <Pressable key={item.id} style={styles.menuItem} onPress={() => {
                                    onClose();
                                    
                                    const navParams = {};
                                    if (item.id === 'calendar') {
                                        navParams.layout = 'calendar'; 
                                    }

                                    navigation.navigate('ParkGuideMobileRoot', {
                                        screen: item.route, 
                                        params:{
                                            screen: 'To Do Calendar',
                                            params:{layout: 'calendar'}
                                        } 
                                    });
                                }}>
                                    <item.icon size={22} color="#333" />
                                    <Text style={styles.menuText}>{item.label}</Text>
                                </Pressable>
                            ))}  
                    </View> 
                    <View>
                        <View style={styles.divider} />
                        {/* Log out */}
                        <Pressable style={styles.menuItem} onPress={handleLogout}>
                            <LogOut size={18} color='red'/>
                            <Text style={[styles.menuText, { color: 'red' }]}>Log Out</Text>
                        </Pressable>
                    </View>
                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: { 
        ...StyleSheet.absoluteFillObject, 
        backgroundColor: 'rgba(0,0,0,0.5)' 
    },
    sidebarContainer: {
        width: width * 0.75,
        height: '100%',
        backgroundColor: 'white',
        position: 'absolute',
        left: 0,
        top: 0,
        elevation: 10, 
    },
    content: { 
        padding: 20, 
        flex:1,
        paddingTop: 60,
        justifyContent:'space-between'
    },
    menuItem: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingVertical: 15, 
        gap: 15,
    },
    pfpWrapper:{
        alignSelf:'center',
    },
    profilePic:{
        width: 60,
        height: 60,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: '#ccc',
    },
    pfpPlaceholder:{
        width: 90,
        height: 90,
        marginBottom: 10,
        borderRadius: 60,
        backgroundColor: '#2f6618fe',
        borderWidth: 3,
        borderColor: '#ccc',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pfpInitials:{
        fontSize: 32,
        fontWeight: '700',
        color: 'white',
    },
    menuText: { 
        fontSize: 16, 
        color: '#333' 
    },
    divider: { 
        height: 1, 
        backgroundColor: '#eee', 
        marginVertical: 20 
    },
    username:{
        alignSelf:'center',
        marginTop:8,
        fontSize:16,
        fontWeight:'600',
        color:'#333',
        marginBottom:30
    },
});

export default MobileSideBar;