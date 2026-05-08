import React from 'react';
import {View, Text, TextInput, Pressable, StyleSheet} from 'react-native';
import { Menu, Search, Bell, SlidersHorizontal, Settings} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

const MobileTopBar=({onToggleSidebar, routeName, onFilterPress, navigation})=>{
    const {t, i18n}=useTranslation();
    return (
        <View style={styles.header}>
            {/* Expand Icon */}
            <View style={styles.titleSection}>
                <Pressable onPress={onToggleSidebar} style={styles.iconBtn}>
                    <Menu size={24} color="#333"/>
                </Pressable>
                {(routeName === 'Profile' || routeName === 'Settings') && (
                    <Text style={styles.title}>{t(routeName.toLowerCase())}</Text>
                )}
            </View>

            {/* Search Component */}
            {(routeName !== 'Profile' && routeName !== 'Settings') && (
                <View style={styles.search}>
                    <Search size={18}/>
                    <TextInput style={styles.input} placeholder='Search...' placeholderTextColor="#AAAAAA"/>
                </View>
            )}
            
            <View style={styles.toolIcon}>
                {/* Settings icon */}
                {routeName === 'Profile' && (
                    <Pressable style={styles.iconBtn} onPress={()=>{
                        navigation.navigate('ParkGuideMobileRoot', {
                            screen: 'Settings'
                        });
                    }}>
                        <Settings size={22} color="#333"/>
                        <View style={styles.badge}></View>
                    </Pressable>
                )}
                {/* Notification */}
                <Pressable style={styles.iconBtn}>
                    <Bell size={22} color="#333"/>
                    <View style={styles.badge}></View>
                </Pressable>
            </View>
            
        </View>
    );
};

const styles=StyleSheet.create({
    header:{
        height:70,
        backgroundColor:'#fff',
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'space-between',
        paddingTop:20,
        paddingHorizontal:10,
        borderBottomColor:'#3a3a3a66',
        borderBottomWidth:1,
        elevation:4,
    },
    search:{
        flexDirection:'row',
        gap:3,
        borderWidth:1,
        borderColor:'#8f8f8f',
        backgroundColor:'white',
        borderRadius:13,
        alignItems:"center",
        width:250,
        maxHeight:30,
        paddingHorizontal:3
    },
    input:{
        flex:1,
        maxWidth:250,
        height:40,
        outlineStyle:'none'
    },
    iconBtn:{
        padding:8,
        position:'relative'
    },
    toolIcon:{
        flexDirection:'row',
    },
    titleSection:{
        flexDirection:'row',
        alignItems:'center',
        gap:20
    },
    title:{
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a'
    }
});

export default MobileTopBar;