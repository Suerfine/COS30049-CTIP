import { Pen, Trash2, Search, Plus, Circle, ChevronLeft, ChevronsLeft, ChevronRight, ChevronsRight, X, User2, IdCard, Mail, ShieldUser, Calendar, FileUser, EllipsisVertical, ChevronDown, ChevronUp, CirclePlus, CircleMinus} from 'lucide-react-native';
import React, {useState} from 'react';
import { Pressable, StyleSheet, FlatList, View,Text, Image, TextInput} from 'react-native';
import {Checkbox} from 'react-native-paper';

import { useUserManagement } from '../hooks/useUserManagement';
import ModalLayout from '../components/ModalLayout';
import UsersFormContent from '../components/UsersFormContent';

const UserManagement=()=>{
    const {users, loading}=useUserManagement();
    const [currentPage, setCurrentPage]=useState(1);
    const itemsPerPage=10;

    const [isAllChecked, setIsAllChecked]=useState(false);
    const [modalVisible, setModalVisible]=useState(false);
    const [selectedUser, setSelectedUser]=useState(null);
    const [activeMenuId, setActiveMenuId]=useState(null);
    const [currentStatus, setCurrentStatus]=useState('Approved');
    const [isOpen, setIsOpen]=useState(false);
    const [isEditing, setIsEditing]=useState(false);
    
    // Toggle user status
    const toggleStatus=(id)=>{
        setUsers(users.map(u => 
            u.id === id ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' } : u
        ));
    };

    const handleAdd=()=>{
        setModalVisible(true);
    };

    // Caluculate the pagination
    const indexOfLastItem=currentPage*itemsPerPage;
    const indexOfFirstItem=indexOfLastItem-itemsPerPage;
    const currentUsers=users.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages=Math.ceil(users.length/itemsPerPage);

    const renderHeader=()=>(
        <View style={[styles.tableHeader, styles.row]}>
            <View style={styles.checkbox}><Checkbox status={isAllChecked ? 'checked' : 'unchecked'} onPress={()=>setIsAllChecked(!isAllChecked)} uncheckedColor="white" color="#ffd47e"/></View>
            <Text style={[styles.headerText, { flex:3 }]}>Full Name</Text>
            <Text style={[styles.headerText, { flex:2 }]}>Username</Text>
            <Text style={[styles.headerText, { flex:2}]}>IC.</Text>
            <Text style={[styles.headerText, { flex:3 }]}>Email</Text>
            <Text style={[styles.headerText, { flex:2}]}>Status</Text>
            <Text style={[styles.headerText, { flex:2}]}>Role</Text>
            <Text style={[styles.headerText, { flex:2 }]}>Joined Date</Text>
            <Text style={[styles.headerText, { flex:2 }]}>Last Active</Text>
        </View>
    );

    const renderUserItem=({item})=>(
        <Pressable onPress={()=>setSelectedUser(item)} style={({hovered})=>[styles.row, styles.tableRow, hovered && {backgroundColor:'#f9f9f9'}, selectedUser?.id === item.id && {backgroundColor:'#fff8e1'}]}>
            {/* Checkbox */}
            <View style={styles.checkbox}>
                <Checkbox status={item.selected ? 'checked' : 'unchecked'} color="#ffdf9f39"/>
            </View>

            {/* Full Name and profile image */}
            <View style={[{flex:3}, styles.userInfo, styles.row]}>
                <Image source={{uri:item.profileImage}} style={styles.avatar} accessibilityLabel={`Profile Image of ${item.fullName}`}/>
                <Text>{item.fullName}</Text>
            </View>

            {/* Username */}
            <Text style={{flex:2}}>{item.username}</Text>
            {/* IC */}
            <Text style={{flex:2}}>{item.ic}</Text>
            {/* Email */}
            <Text style={{flex:3}}>{item.email}</Text>
            {/* Status */}
            <View style={[styles.row,styles.badge,{flex:2}]}>
                {item.status==="Active" ? (<Circle size={10} stroke="green" fill="green"/>):(<Circle size={10} stroke="grey" fill="grey"/>)}
                <Text>{item.status}</Text>
            </View>
            {/* Role */}
            <Text style={{flex:2}}>{item.role==='parkguide' ? 'Park Guide' : 'Admin'}</Text>
            {/* Joined Date */}
            <Text style={{flex:2}}>{item.joinedDate}</Text>
            {/* Last Active */}
            <Text style={{flex:2}}>{item.lastActive}</Text>
        </Pressable>
    );
    
    const renderPagination=()=>{
        const pageNumbers=[];
        for (let i=1; i<=totalPages;i++){
            pageNumbers.push(i);
        }
        return (
            <View style={[styles.paginationContainer, styles.row]}> 
                <Text style={styles.pageInfo}>
                    Showing {users.length>0 ? indexOfFirstItem+1 : 0} to {Math.min(indexOfLastItem, users.length)} of {users.length} users
                </Text>
                <View style={styles.row}>
                    <Pressable disabled={currentPage==1} onPress={()=>setCurrentPage(1)} style={[styles.pageBtn, currentPage==1 && styles.btnDisabled]}>
                        <Text style={[currentPage==1 ? styles.disabledText : styles.pageBtnText,styles.arrowBtn]}><ChevronsLeft size={20}/></Text>
                    </Pressable>
                    <Pressable disabled={currentPage==1} onPress={()=>setCurrentPage(prev=>prev-1)} style={[styles.pageBtn, currentPage==1 && styles.btnDisabled]}>
                        <Text style={[currentPage==1 ? styles.disabledText : styles.pageBtnText,styles.arrowBtn]}><ChevronLeft size={20}/></Text>
                    </Pressable>
                    {pageNumbers.map((number)=>(
                        <Pressable key={number} onPress={()=>setCurrentPage(number)} style={[styles.pageBtn, currentPage === number && styles.activePageBtn]}>
                            <Text style={[styles.pageBtnText, currentPage===number && styles.activePageBtn]}>{number}</Text>
                        </Pressable>
                    ))}
                    <Pressable disabled={currentPage==totalPages} onPress={()=>setCurrentPage(prev=>prev+1)} style={[styles.pageBtn, currentPage==totalPages && styles.btnDisabled]}>
                        <Text style={[currentPage==totalPages ? styles.disabledText : styles.pageBtnText, styles.arrowBtn]}><ChevronRight size={20}/></Text>
                    </Pressable>
                    <Pressable disabled={currentPage==totalPages} onPress={()=>setCurrentPage(totalPages)} style={[styles.pageBtn, currentPage==totalPages && styles.btnDisabled]}>
                        <Text style={[currentPage==totalPages ? styles.disabledText : styles.pageBtnText, styles.arrowBtn]}><ChevronsRight size={20}/></Text>
                    </Pressable>
                </View>
            </View>
        )
    };

    // Loading
    return(
        <View style={styles.container}>
            <Text style={styles.title}>User Management</Text>
            <View style={[styles.toolbar,styles.row]}>
                <View style={styles.row}>
                    <View style={[styles.search,styles.row]}>
                        <Search size={18}/>
                        <TextInput style={styles.input} placeholder='Search...' placeholderTextColor="#8f8f8f"/>
                    </View>
                    {/* Status Dropdown */}
                    <View style={styles.dropdownWrapper}>
                        <Pressable 
                            style={styles.pillTrigger} 
                            onPress={() => setIsOpen(!isOpen)}
                        > 
                            <Text style={styles.pillText}>Status</Text>
                            {isOpen ? (<ChevronUp size={16} color="#4b5563" />) : (<ChevronDown size={16} color="#4b5563" />)}
                        </Pressable>

                        {/* Dropdown Menu */}
                        {isOpen && (
                            <View style={styles.dropdownMenu}>
                                {['Approved', 'Pending', 'Rejected'].map((status) => (
                                    <Pressable 
                                        key={status}
                                        style={({hovered})=>[
                                            styles.menuItem,
                                            currentStatus === status && styles.menuItemActive,
                                            (hovered && currentStatus!=status) && styles.menuItemHover 
                                        ]}
                                        onPress={() => {
                                            setCurrentStatus(status);
                                            setIsOpen(false);
                                        }}
                                    >
                                        <Text style={[
                                            currentStatus === status && styles.menuItemTextActive 
                                        ]}>
                                            {status}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        )}
                    </View>
                </View>
                <Pressable onPress={handleAdd} style={({ hovered }) => [
                        styles.btn,
                        hovered && styles.btnHover, 
                    ]}>
                    <Plus size={16}/>
                    <Text style={styles.btnText}>Add User</Text>
                </Pressable>
            </View>

            {/* Create Users Modal */}
            <ModalLayout visible={modalVisible} onClose={()=>setModalVisible(false)}>
                <UsersFormContent
                    onCancel={()=>setModalVisible(false)}
                    isLoading={loading}
                />
            </ModalLayout>

            <View style={styles.tableContainer}>
                <FlatList style={styles.table} 
                    data={currentUsers}
                    ListHeaderComponent={renderHeader}
                    renderItem={renderUserItem}
                    keyExtractor={item=>item.id.toString()}
                />
            </View>
            {renderPagination()}
            {/* Side panel: show user details */}
            {selectedUser && (
                <View style={styles.sidePanel}>
                    <View style={styles.panelHeader}>
                        <View style={styles.row}>
                            <Text style={styles.panelTitle}>
                                User Information
                            </Text>
                            <View style={[styles.badge,styles.row]}>
                                {selectedUser.status==="Active" ? (<Circle size={10} stroke="green" fill="green"/>):(<Circle size={10} stroke="grey" fill="grey"/>)}
                                <Text>{selectedUser.status}</Text>
                            </View>
                        </View>
                        <Pressable onPress={()=>setSelectedUser(null)}>
                            <X size={18}/>
                        </Pressable>
                        
                    </View>
                    <View style={styles.panelContent}>
                        {/* Actions Menu */}
                        <View style={styles.actionMenu}>
                            <Pressable onPress={()=>setActiveMenuId(activeMenuId===selectedUser.id ? null : selectedUser.id)}>
                                <EllipsisVertical/>
                            </Pressable>
                            {activeMenuId===selectedUser.id && (
                                <View style={styles.floatingMenu}>
                                    <Pressable style={({hovered})=>[styles.menuItem, hovered && styles.menuItemHover]}>
                                        {selectedUser.status === 'Active' ? (
                                            <View style={[styles.row, styles.option]}>
                                            <CircleMinus size={16} color="orange" /><Text style={styles.menuText}>Deactivate</Text>
                                            </View>
                                        ) : (<View style={[styles.row, styles.option]}>
                                            <CirclePlus size={16} color="orange" /><Text style={styles.menuText}>Activate</Text>
                                            </View>)}
                                    </Pressable>
                                    <Pressable style={({hovered})=>[styles.menuItem, hovered && styles.menuItemHover]} onPress={()=>{setIsEditing(true); setActiveMenuId(null)}}>
                                        <View style={[styles.row, styles.option]}>
                                        <Pen size={16} color="orange" /><Text style={styles.menuText}>Edit</Text>
                                        </View>
                                    </Pressable>
                                    <Pressable style={({hovered})=>[styles.menuItem, hovered && styles.menuItemHover]}>
                                        <View style={[styles.row, styles.option]}>
                                        <Trash2 size={16} color="orange" /><Text style={styles.menuText}>Delete</Text>
                                        </View>
                                    </Pressable>
                                </View>
                            )}
                        </View>
                        <Image source={{uri:selectedUser.profileImage}} style={styles.largeAvatar}/>
                        <Text style={styles.fullname}>{selectedUser.fullName}</Text>
                        <View style={styles.user}>
                            {/* Username */}
                            <View style={styles.details}>
                                <View style={styles.row}>
                                    <User2 size={18} color="#4f4f4f"/>
                                    <Text style={styles.panelLabel}>Username:</Text>
                                </View>
                                {isEditing ? (<TextInput
                                style={[styles.userDetails,styles.inputEditing]}
                                value={selectedUser.username}
                            />) : (<Text style={styles.userDetails}>{selectedUser.username}</Text>)}
                                
                            </View>
                            {/* IC */}
                            <View style={styles.details}>
                                <View style={styles.row}>
                                    <IdCard size={18} color="#4f4f4f"/>
                                    <Text style={styles.panelLabel}>Passport/IC:</Text>
                                </View>
                                {isEditing ? (<TextInput
                                style={[styles.userDetails,styles.inputEditing]}
                                value={selectedUser.ic}
                            />) : (<Text style={styles.userDetails}>{selectedUser.ic}</Text>)}
                                
                            </View>
                            {/* Email */}
                            <View style={styles.details}>
                                <View style={styles.row}>
                                    <Mail size={18} color="#4f4f4f"/>
                                    <Text style={styles.panelLabel}>Email:</Text>
                                </View>
                                {isEditing ? (<TextInput
                                style={[styles.userDetails,styles.inputEditing]}
                                value={selectedUser.email}
                            />) : (<Text style={styles.userDetails}>{selectedUser.email}</Text>)}
                            </View>
                            <View style={[styles.row, {justifyContent:'space-between'}]}>
                                {/* Role */}
                                <View style={styles.details}>
                                    <View style={styles.row}>
                                        <ShieldUser size={18} color="#4f4f4f"/>
                                        <Text style={styles.panelLabel}>Role:</Text>
                                    </View>
                                    <Text style={styles.userDetails}>{selectedUser.role === "admin" ? 'Admin' :'Park Guide'}</Text>
                                </View>

                                {/* Joined Date */}
                                <View style={styles.details}>
                                    <View style={styles.row}>
                                        <Calendar size={18} color="#4f4f4f"/>
                                        <Text style={styles.panelLabel}>Joined Date:</Text>
                                    </View>
                                    <Text style={styles.userDetails}>{selectedUser.joinedDate}</Text>
                                </View>
                            </View>

                            {/* CV Section */}
                            <View style={styles.details}>
                                <View style={styles.row}>
                                    <FileUser size={18} color="#4f4f4f"/>
                                    <Text style={styles.panelLabel}>Resume:</Text>
                                </View>
                                <Pressable style={styles.userDetails}>View CV PDF</Pressable>
                            </View>
                        </View>
                        {isEditing &&(<View style={[styles.row, styles.actionBtn]}>
                            <Pressable onPress={()=>setIsEditing(false)}
                                style={styles.Btn} 
                            >
                                <Text>Cancel</Text>
                            </Pressable>
                            <Pressable 
                                style={styles.Btn} 
                            >
                                <Text>Save</Text>
                            </Pressable>
                        </View>)}
                        
                    </View>
                </View>
            )}
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
    tableContainer:{
        flex:1
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
        zIndex:500
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
        paddingVertical:10,
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
        width:35,
        height:35,
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
    paginationContainer:{
        justifyContent:'space-between',
        alignItems:"center",
        paddingVertical:15,
        paddingHorizontal:20,
        backgroundColor:'white'
    },
    pageInfo: {
        color: '#666',
        fontSize: 14,
    },
    pageBtn: {
        width:32,
        height:32,
        borderRadius: '50%',
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#ccc',
        alignItems:'center',
        justifyContent:'center',
        marginLeft:10
    },
    pageBtnText: {
        color: '#ecaa25',
        fontWeight: '600',
    },
    btnDisabled: {
        backgroundColor: '#f0f0f0',
        borderColor: '#eee',
    },
    disabledText: {
        color: '#bbb',
    },
    currentPageText: {
        alignSelf: 'center',
        fontWeight: 'bold',
        color: '#333',
    },
    arrowBtn:{
        paddingTop:2
    },
    activePageBtn:{
        backgroundColor:'#ffc758',
        border:0,
        color:'white'
    },
    sidePanel:{
        width:350,
        backgroundColor:'white',
        height:'100%',
        position:'absolute',
        right:0,
        top:0,
        bottom:0,
        shadowColor: '#000',
        shadowOffset: { width: -2, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        zIndex:600
    },
    panelHeader:{
        flexDirection:"row",
        justifyContent:'space-between',
        borderBottomWidth:1,
        borderBottomColor:'#4f4f4f49',
        paddingVertical:15,
        paddingHorizontal:20,
        alignItems:'center'
    },
    panelTitle:{
        fontSize:18,
        fontWeight:500,
        marginRight:15
    },
    largeAvatar:{
        width:130,
        height:130,
        alignSelf:'center',
    },
    panelContent:{
        padding:20
    },
    fullname:{
        fontSize:16,
        fontWeight:500,
        textAlign:'center',
        marginTop:15
    },
    details:{
        marginTop:20,
        gap:10,
    },
    panelLabel:{
        fontWeight:500,
        marginLeft:15
    },
    userDetails:{
        marginLeft:35
    },
    user:{
        paddingHorizontal:10,
        marginTop:15,
        paddingRight:30
    },
    actionMenu:{
        alignSelf:'flex-end',
        position:'absolute',
        zIndex:400
    },
    pillTrigger:{
        border:'1px solid #0a6340',
        width:100,
        flexDirection:"row",
        gap:10,
        height:35,
        marginTop:2,
        justifyContent:'center',
        alignItems:'center',
        marginLeft:15,
        borderRadius:20,
        userSelect:'none',
        backgroundColor:'white',
        paddingLeft:4
    },
    dropdownMenu:{
        position:'absolute',
        top:37,
        left:20,
        backgroundColor:'white',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    dropdownWrapper:{
        position:'relative',
    },
    pillText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },
    menuItem:{
        padding:14,
        alignItems:'center'
    },
    menuItemActive:{
        backgroundColor:"#7d9f7a"
    },
    menuItemTextActive:{
        color:'white'
    },
    menuItemHover:{
        backgroundColor:"#f9f9f9"
    },
    floatingMenu:{
        position:'absolute',
        right:7,
        top:30,
        backgroundColor:'white',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        userSelect:"none"
    },
    option:{
        gap:8,
        alignSelf:'flex-start'
    },
    inputEditing:{
        borderWidth:1, 
        borderColor:'#ddd',
        borderRadius:10,
        padding:12,
        flex:1,
        minWidth:220
    },
    Btn:{
        minWidth:100,
        alignItems:'center',
        backgroundColor:'#ffc95c',
        borderRadius:5,
        paddingHorizontal:20,
        paddingVertical:8,
        marginTop:15,
    },
    actionBtn:{
        gap:15,
        justifyContent:'flex-end'
    }
});

export default UserManagement;