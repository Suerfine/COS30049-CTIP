import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, TextInput } from 'react-native';
import { Bell, Search } from 'lucide-react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';

const NavBar = () => {
    const navigation = useNavigation();
    const [searchQuery, setSearchQuery] = useState('');

    // Navigation Links
    const navLinks = [
        { name: 'Courses', route: 'User Course' },
        { name: 'Badges', route: 'Badges' },
        { name: 'Anomaly', route: 'Anomaly' }
    ];

    return (
        <View style={styles.navbar}>
            <View style={styles.left}>
                <Pressable
                    onPress={() => {
                        navigation.dispatch(
                            CommonActions.reset({
                                index: 0,
                                routes: [{ name: 'User Dashboard' }],
                            })
                        );
                    }}
                >
                    <Image source={require('../../assets/sfc_logo.png')} style={styles.logo} accessibilityLabel='Logo of SFC'/>
                </Pressable>
            </View>

            <View style={styles.center}>
                {navLinks.map(item => (
                    <Pressable 
                        key={item.name} 
                        style={styles.link} 
                        onPress={() => {
                        navigation.dispatch(
                            CommonActions.reset({
                                index: 0,
                                routes: [{ name: item.route }],
                            })
                        );
                    }}>
                        <Text style={styles.itemText}>{item.name}</Text>
                    </Pressable>
                ))}
            </View>

            <View style={styles.right}>
                <View style={styles.search}>
                    <Search size={18}/>
                    <TextInput style={styles.input} placeholder='Search...' placeholderTextColor="#8f8f8f"/>
                </View>
                <Pressable style={styles.notificationBtn}>
                    <Bell size={20} />
                </Pressable>
                <Pressable style={styles.profileBtn}>
                    <Image source={require('../../assets/profile.png')} style={styles.profile} accessibilityLabel='User Profile' />
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    navbar:{
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc'
    },
    left:{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    logo:{
        width: 140,
        height: 40,
        resizeMode: 'contain',
    },
    center:{
        flex: 2,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20
    },
    item:{
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    itemText:{
        fontSize: 16,
        fontWeight: '500',
        color: '#333'
    },
    right:{
        flex: 1.5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 15
    },
    search:{
        flexDirection:'row',
        gap:3,
        borderWidth:1,
        borderColor:'#8f8f8f',
        paddingVertical:5,
        paddingHorizontal:3,
        backgroundColor:'white',
        borderRadius:15,
        alignItems:"center",
        marginHorizontal:20,
    },
    input:{
        flex:1,
        maxWidth:140,
        outlineStyle:'none'
    },
    notificationBtn:{
        padding: 5
    },
    profileBtn: {},
    profile:{
        width: 35,
        height: 35,
        borderRadius: 50,
        resizeMode: 'contain'
    }
});

export default NavBar;