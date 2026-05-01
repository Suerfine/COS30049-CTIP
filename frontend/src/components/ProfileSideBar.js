import React, { useState, useEffect} from 'react';
import { View, Text, StyleSheet, Pressable, Image} from 'react-native';
import {Book, ClipboardList,Bell, UserPlus, User2, LockKeyhole, UserRoundPen, Settings2} from 'lucide-react-native'
import { CommonActions } from '@react-navigation/native';
import { useNavigationState, useNavigation } from '@react-navigation/native';

const ProfileSideBar = () => {
    const navigation=useNavigation();
    const currentRoute = useNavigationState((state) => {
    let route = state.routes[state.index];

    while (route.state) {
        route = route.state.routes[route.state.index];
    }

    return route.name;
    });

    const menuItems= [
        {name:'Profile', icon: UserRoundPen, route:'UserProfile', parentRoute: 'ProfileStack' },
        {name: 'Preferences', icon: Settings2, route:'Preferences', parentRoute: null },
        {name: 'Security', icon: LockKeyhole, route:'Security', parentRoute: null },
    ];

    //Set State
    const [activePage, setActivePage] = useState("Profile");

    return (
        <View style={styles.sidebar}>
            <View style={styles.link}>
                {menuItems.map((item) => {
                    const IconComponent=item.icon;
                    const isActive = currentRoute === item.route || currentRoute === item.parentRoute;
                    
                    return(
                        <Pressable key={item.name}
                            style={({hovered})=>[styles.menuItem, isActive && styles.activeIcon, !isActive && hovered && styles.hoverStyle]}
                                onPress={() => {
                                setActivePage(item.name);
                                console.log("NAV TEST:", item.route);
                                navigation.navigate("ProfileStack", {
                                    screen: item.route,
                                });
                            }}
                        >
                            <IconComponent style={styles.navIcon} />
                            <Text style={[styles.navText, isActive && styles.activeText]}>{item.name}</Text>
                        </Pressable>
                    )
                })}
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
        paddingTop: 30,
        flex:1,
        borderRightColor:'#3f3f3f4d',
        borderRightWidth:1,
        backgroundColor:"white",
    },
    link:{
        gap:15,
        paddingBottom:25,
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
    activeIcon:{
        backgroundColor:'#0a6340',
        color:'white'
    },
    activeText:{
        color:'white'
    },
    hoverStyle:{
        backgroundColor:"#eaefeb"
    },
});

export default ProfileSideBar;