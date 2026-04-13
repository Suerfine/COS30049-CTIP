import React, {useState} from 'react';
import { StyleSheet } from 'react-native';
import {Checkbox} from 'react-native-paper';

const UserManagement=()=>{
    const [isAllChecked, setIsAllChecked]=useState(false);
    // Toggle user status
    const toggleStatus=(id)=>{
        setUsers(users.map(u => 
            u.id === id ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' } : u
        ));
    };

    const renderHeader=()=>{
        <View style={styles.tableHeader}>
            <Text style={[styles.headerText, {textAlign:'center'}]}><Checkbox value={isAllChecked} onValueChange={setIsAllChecked}/></Text>
            <Text style={[styles.headerText, { width: 200 }]}>Full Name</Text>
            <Text style={[styles.headerText, { width: 140 }]}>Username</Text>
            <Text style={[styles.headerText, { width: 100, textAlign: 'center' }]}>IC.</Text>
            <Text style={[styles.headerText, { width: 150 }]}>Email</Text>
            <Text style={[styles.headerText, { width: 150 }]}>Status</Text>
            <Text style={[styles.headerText, { width: 150 }]}>Joined Date</Text>
            <Text style={[styles.headerText, { width: 150 }]}>Last Active</Text>
            <Text style={[styles.headerText, { width: 120, textAlign: 'right' }]}>Actions</Text>
        </View>
    };

    const renderUserItem=({item})=>{
        <View style={styles.row}>
            {/* Full Name and profile image */}
            <View style={[{width:200}, styles.userInfo]}>
                {/* <Image source={{}} style={styles.courseImg} accessibilityLabel='Cover Photo of Course'/> */}
            </View>
        </View>
    };
}

const styles = StyleSheet.create({
    
});

export default UserManagement;