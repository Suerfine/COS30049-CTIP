import { CircleCheck, SquarePen, CircleMinus, Trash2, Search, Plus, Circle} from 'lucide-react-native';
import React, {useState} from 'react';
import { Pressable, StyleSheet, FlatList, View,Text, Image, TextInput} from 'react-native';
import {Checkbox} from 'react-native-paper';
import { useUserManagement } from '../hooks/useUserManagement';

const UserManagement=()=>{
    const {users}=useUserManagement();

    const [isAllChecked, setIsAllChecked]=useState(false);
    // Toggle user status
    const toggleStatus=(id)=>{
        setUsers(users.map(u => 
            u.id === id ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' } : u
        ));
    };

    const renderHeader=()=>(
        <View style={[styles.tableHeader,styles.row]}>
            <View style={styles.checkbox}><Checkbox status={isAllChecked ? 'checked' : 'unchecked'} onPress={()=>setIsAllChecked(!isAllChecked)} uncheckedColor="white" color="#ffd47e"/></View>
            <Text style={[styles.headerText, { flex:2 }]}>Full Name</Text>
            <Text style={[styles.headerText, { flex:2 }]}>Username</Text>
            <Text style={[styles.headerText, { flex:2}]}>IC.</Text>
            <Text style={[styles.headerText, { flex:3 }]}>Email</Text>
            <Text style={[styles.headerText, { flex:2}]}>Status</Text>
            <Text style={[styles.headerText, { flex:2 }]}>Joined Date</Text>
            <Text style={[styles.headerText, { flex:2 }]}>Last Active</Text>
            <Text style={[styles.headerText, { flex:1 }]}>Actions</Text>
        </View>
    );

    const renderUserItem=({item})=>(
        <View style={[styles.row,styles.tableRow]}>
            {/* Checkbox */}
            <View style={styles.checkbox}>
                <Checkbox status={item.selected ? 'checked' : 'unchecked'} color="#ffd47e"/>
            </View>

            {/* Full Name and profile image */}
            <View style={[{flex:2}, styles.userInfo, styles.row]}>
                <Image source={{uri:item.profileImage}} style={styles.avatar} accessibilityLabel={`Profile Image of ${item.fullName}`}/>
                <Text>{item.fullName}</Text>
            </View>

            {/* Username */}
            <Text style={{flex:2 }}>{item.username}</Text>
            {/* IC */}
            <Text style={{flex:2}}>{item.ic}</Text>
            {/* Email */}
            <Text style={{flex:3}}>{item.email}</Text>
            {/* Status */}
            <View style={[styles.row,styles.badge,{flex:2}]}>
                {item.status==="Active" ? (<Circle size={10} stroke="green" fill="green"/>):(<Circle size={10} stroke="grey" fill="grey"/>)}
                <Text>{item.status}</Text>
            </View>
            
            {/* Joined Date */}
            <Text style={{flex:2}}>{item.joinedDate}</Text>
            {/* Last Active */}
            <Text style={{flex:2}}>{item.lastActive}</Text>
            {/* Actions */}
            <View style={[{flex:1}, styles.actionIcon, styles.row]}>
                {item.status==="Active" ? (
                    <Pressable><CircleMinus size={18} color="red"/></Pressable>
                ) : (
                    <Pressable><CircleCheck size={18} color="green"/></Pressable>
                )}
                <Pressable><SquarePen size={18} color="#525252"/></Pressable>
                <Pressable><Trash2 size={18} color="red"/></Pressable>
            </View>
        </View>
    );
    // Loading
    return(
        <View style={styles.container}>
            <Text style={styles.title}>User Management</Text>
            <View style={[styles.toolbar,styles.row]}>
                <View style={[styles.search,styles.row]}>
                    <Search size={18}/>
                    <TextInput style={styles.input} placeholder='Search...' placeholderTextColor="#8f8f8f"/>
                </View>
                <Pressable style={({ hovered }) => [
                        styles.btn,
                        hovered && styles.btnHover, 
                    ]}>
                    <Plus size={16}/>
                    <Text style={styles.btnText}>Add User</Text>
                </Pressable>
            </View>
            <FlatList style={styles.table} 
                data={users}
                ListHeaderComponent={renderHeader}
                renderItem={renderUserItem}
                keyExtractor={item=>item.id.toString()}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    checkbox:{
        width:50,
        alignItems:'center',
    },
    container:{
        flex:1,
        paddingVertical:20,
        paddingHorizontal:40
    },
    tableRow:{
        paddingVertical:5,
        borderBottomWidth:1,
        borderBottomColor:"#8f8f8f84",
        alignItems:'center',
        
    },
    table:{
        backgroundColor:"white",
    },
    title:{
        fontSize:25,
        fontWeight:500,
    },
    search:{
        gap:7,
        borderWidth:1,
        borderColor:'#8f8f8f',
        minWidth:300,
        padding:5,
        backgroundColor:'white',
        borderRadius:15,
        alignItems:"center",
        maxHeight:35,
        alignSelf:'center'
    },
    input:{
        flex:1,
        paddingVertical:2,
        outlineStyle:'none'
    },
    toolbar:{
        justifyContent:'space-between',
        marginVertical:20,
    },
    btn:{
        flexDirection:'row',
        gap:4,
        alignItems:'center',
        alignSelf:'center',
        backgroundColor:"#217837",
        borderRadius:50,
        color:'white',
        paddingHorizontal:23,
        paddingVertical:13,
    },
    btnText:{
        color:'white',
        fontSize:16
    },
    btnHover:{
        backgroundColor:'#5a993ffe'
    },
    tableHeader:{
        backgroundColor:'#0a6340',
        
    },
    headerText:{
        color:'white',
        alignSelf:'center',
        fontWeight:500,
    },
    row:{
        flexDirection:'row'
    },
    avatar:{
        width:30,
        height:30,
        borderRadius:50,
    },
    userInfo:{
        gap:10,
        alignItems:'center'
    },
    badge:{
        alignItems:"center",
        gap:5,
    },
    actionIcon:{
        gap:7,
    }
});

export default UserManagement;