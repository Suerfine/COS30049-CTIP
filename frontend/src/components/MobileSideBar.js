import React,{useEffect, useRef, useState} from 'react';
import {View, Text, TextInput, Pressable, StyleSheet, Animated, Dimensions, Image} from 'react-native';
import { UserPen, Calendar, Award, Settings, LogOut } from 'lucide-react-native';
import { useUserDashboard } from '../hooks/useUserDashboard';
import { useNavigation } from '@react-navigation/native';
import UserProfile from '../screens/UserProfile.native';

const {width}=Dimensions.get('window');

const MobileSideBar=({isOpen, onClose})=>{
    const navigation=useNavigation();
    const slideAnim=useRef(new Animated.Value(-width)).current;
    const [shouldRender, setShouldRender]=useState(isOpen);
    const {user=user}=useUserDashboard();

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
        {id: 'settings', label:'Settings', icon: Settings},
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
                    {/* Profile  */}
                    <Image source={{ uri: user?.profileImage }} style={styles.profilePic}/>
                    <Text style={styles.username}>{user?.username}</Text>

                    {/* Content */}
                        {menuItems.map((item) => (
                            <Pressable key={item.id} style={styles.menuItem} onPress={()=>{
                                onClose();
                                navigation.navigate('ParkGuideMobileRoot', {
                                    screen: item.route, 
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
                        <Pressable style={styles.menuItem} onPress={onClose}>
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
    profilePic: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight:15,
        borderWidth: 2,
        borderColor: 'rgba(0,0,0,0.1)',
        alignSelf:'center',
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