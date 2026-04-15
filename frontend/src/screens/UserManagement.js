import { CircleCheck, SquarePen, CircleMinus, Trash2, Search, Plus, Circle, ChevronLeft, ChevronsLeft, ChevronRight, ChevronsRight} from 'lucide-react-native';
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
        <View style={[styles.tableHeader,styles.row]}>
            <View style={styles.checkbox}><Checkbox status={isAllChecked ? 'checked' : 'unchecked'} onPress={()=>setIsAllChecked(!isAllChecked)} uncheckedColor="white" color="#ffd47e"/></View>
            <Text style={[styles.headerText, { flex:3 }]}>Full Name</Text>
            <Text style={[styles.headerText, { flex:2 }]}>Username</Text>
            <Text style={[styles.headerText, { flex:2}]}>IC.</Text>
            <Text style={[styles.headerText, { flex:3 }]}>Email</Text>
            <Text style={[styles.headerText, { flex:2}]}>Status</Text>
            <Text style={[styles.headerText, { flex:2}]}>Role</Text>
            <Text style={[styles.headerText, { flex:2 }]}>Joined Date</Text>
            <Text style={[styles.headerText, { flex:2 }]}>Last Active</Text>
            {/* <Text style={[styles.headerText, { flex:2 }]}>Actions</Text> */}
        </View>
    );

    const renderUserItem=({item})=>(
        <View style={[styles.row,styles.tableRow]}>
            {/* Checkbox */}
            <View style={styles.checkbox}>
                <Checkbox status={item.selected ? 'checked' : 'unchecked'} color="#ffd47e"/>
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
            {/* Actions
            <View style={[{flex:2}, styles.actionIcon, styles.row]}>
                {item.status==="Active" ? (
                    <Pressable><CircleMinus size={18} color="red"/></Pressable>
                ) : (
                    <Pressable><CircleCheck size={18} color="green"/></Pressable>
                )}
                <Pressable><SquarePen size={18} color="#525252"/></Pressable>
                <Pressable><Trash2 size={18} color="red"/></Pressable>
            </View> */}
        </View>
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
                <View style={[styles.search,styles.row]}>
                    <Search size={18}/>
                    <TextInput style={styles.input} placeholder='Search...' placeholderTextColor="#8f8f8f"/>
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
    actionIcon:{
        gap:7,
        justifyContent:'center'
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
    }
});

export default UserManagement;