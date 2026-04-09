import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image} from 'react-native';
import {LayoutDashboard, Book, ClipboardList, Flag, CreditCard,Bell, LogOut} from 'lucide-react-native'
import { CommonActions, useNavigation } from '@react-navigation/native';

const SideBar = () => {
    const navigation=useNavigation();
    // Navigation Link
    const menuItems= [
        {name:'Dashboard', icon: LayoutDashboard, route:'User Dashboard'},
        {name: 'Courses', icon: Book, route:'Course Management'},
        {name: 'Enrollment', icon: ClipboardList},
        {name:'Payment', icon: CreditCard},
        {name:'Abnormalies', icon: Flag},
    ];

    //Set State
    const [activePage, setActivePage]=useState('Courses');

    return (
        // SideBar
        <View style={styles.sidebar}>
            <View style={styles.link}>
                <Image source={require('../../assets/sfc_logo.png')} style={styles.logo} accessibilityLabel='Logo of SFC'/>
                {menuItems.map((item) => {
                    const IconComponent=item.icon;
                    const isActive= activePage === item.name;
                    
                    return(
                        <View key={item.name}>
                            {/* Parent menu item */}
                            <View style={styles.navItem}>
                                <Pressable
                                    style={({hovered})=>[styles.menuItem, isActive && styles.activeIcon, !isActive && hovered && styles.hoverStyle]}
                                        onPress={() => {
                                        setActivePage(item.name);
                                        navigation.dispatch(
                                            CommonActions.reset({
                                                index: 0,
                                                routes: [{ name: item.route }],
                                            })
                                        );

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
                <Pressable style={styles.menuItem}>
                        <Bell style={styles.navIcon} />
                        <Text style={styles.navText}>Notification</Text>
                </Pressable>
            </View>
            <View style={styles.admin}>
                <View style={styles.adminInfo}>
                    <Image source={require('../../assets/profile.png')} style={styles.profile} accessibilityLabel='Default Admin Profile'/>
                        <Text>Admin</Text>
                </View>
                <Pressable
                    style={({ hovered }) => [
                        styles.logout,
                        hovered && styles.logoutHover, 
                    ]}
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

    },
    link:{
        gap:15,
        paddingBottom:25,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        backgroundColor:'#ffffff',
        
    },
    linkbtn:{
        paddingTop:8
    },
    menuItem:{
        flexDirection:'row',
        gap:10,
        paddingHorizontal:10,
        paddingVertical:8,
        minWidth:166,
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
   }
});

export default SideBar;