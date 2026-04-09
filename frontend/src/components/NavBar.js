import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, TextInput } from 'react-native';
import { Bell, Search } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const NavBar = () => {
    const navigation = useNavigation();
    const [searchQuery, setSearchQuery] = useState('');

    // Dummy links
    const navLinks = ['Courses', 'Badges', 'Anomaly'];

    return (
        <View style={styles.navbar}>
            <View style={styles.left}>
                <Image source={require('../../assets/sfc_logo.png')} style={styles.logo} accessibilityLabel='Logo of SFC'/>
            </View>

            <View style={styles.center}>
                {navLinks.map(link => (
                    <Pressable key={link} style={styles.link} onPress={() => console.log(link)}>
                        <Text style={styles.linkText}>{link}</Text>
                    </Pressable>
                ))}
            </View>

            <View style={styles.right}>
                <View style={styles.searchContainer}>
                    <Search size={18} color="#8f8f8f" style={styles.searchIcon} />
                    <TextInput style={styles.search} placeholder="Search..." placeholderTextColor="#8f8f8f" value={searchQuery} onChangeText={setSearchQuery} />
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
    link:{
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    linkText:{
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        paddingHorizontal: 10,
        height: 36,
        flex: 1,
    },
    searchIcon:{
        marginRight: 8,
    },
    search:{
        flex: 1,
        height: '100%',
        fontSize: 14,
        color: '#000',
        paddingHorizontal: 10
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