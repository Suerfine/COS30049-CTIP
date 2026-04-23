import { Pen, Trash2, Search, Plus, Circle, ChevronLeft, ChevronsLeft, ChevronRight, ChevronsRight, X, User2, IdCard, Mail, ShieldUser, Calendar, FileUser, EllipsisVertical, ChevronDown, ChevronUp, CirclePlus, CircleMinus,  MessageSquare} from 'lucide-react-native';
import React, {useState} from 'react';
import { Pressable, StyleSheet, FlatList, View,Text, Image, TextInput} from 'react-native';

// Import other components and hooks
import { useRegisterManagement } from '../hooks/useRegisterManagement';
import ModalLayout from '../components/ModalLayout';
import UsersFormContent from '../components/UsersFormContent';

const RegistrationManagement=()=>{
    const {users, loading}=useRegisterManagement();
    const [currentPage, setCurrentPage]=useState(1);
    const itemsPerPage=10;

    const [modalVisible, setModalVisible]=useState(false);
    const [selectedUser, setSelectedUser]=useState(null);
    const [activeMenuId, setActiveMenuId]=useState(null);
    const [currentStatus, setCurrentStatus]=useState('All');
    const [isOpen, setIsOpen]=useState(false);
    const [isEditing, setIsEditing]=useState(false);

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
            <Text style={[styles.headerText, { flex:3 }]}>Full Name</Text>
            <Text style={[styles.headerText, { flex:2 }]}>Username</Text>
            <Text style={[styles.headerText, { flex:2}]}>IC.</Text>
            <Text style={[styles.headerText, { flex:3 }]}>Email</Text>
            <Text style={[styles.headerText, { flex:2}]}>Telefon</Text>
            <Text style={[styles.headerText, { flex:2 }]}>Register On</Text>
            <Text style={[styles.headerText, { flex:2 }]}>Status</Text>
        </View>
    );

    const renderUserItem=({item})=>(
        <Pressable onPress={()=>setSelectedUser(item)} style={({hovered})=>[styles.row, styles.tableRow, hovered && {backgroundColor:'#f9f9f9'}, selectedUser?.id === item.id && {backgroundColor:'#fff8e1'}]}>
            {/* Full Name and profile image */}
            <View style={[{flex:3}, styles.userInfo, styles.row]}>
                <Image source={{uri:item.profileImage}} style={styles.avatar} accessibilityLabel={`Profile Image of ${item.fullName}`}/>
                <Text>{item.fname + " " + item.lname}</Text>
            </View>
            {/* Username */}
            <Text style={{flex:2}}>{item.username}</Text>
            {/* IC */}
            <Text style={{flex:2}}>{item.ic}</Text>
            {/* Email */}
            <Text style={{flex:3}}>{item.email}</Text>
            {/* Telefon */}
            <Text style={{flex:2}}>{item.telefon}</Text>
            {/* Register On */}
            <Text style={{flex:2}}>{item.registerDate}</Text>
            {/* Status */}
            <View style={[styles.row,styles.badge,{flex:2}]}>
               {item.status === "Approved" ? (
                <Circle size={10} stroke="green" fill="green" />
                ) : item.status === "Pending" ? (
                <Circle size={10} stroke="orange" fill="orange" />
                ) : (
                <Circle size={10} stroke="red" fill="red" />
                )}
                <Text>{item.status}</Text>
            </View>
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
            <Text style={styles.title}>Registration Management</Text>
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
                                {['All','Approved','Pending', 'Rejected'].map((status) => (
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
                        <Text style={styles.panelTitle}>
                            User Information
                        </Text>
                        <Pressable onPress={()=>setSelectedUser(null)}>
                            <X size={18}/>
                        </Pressable>
                    </View>
                    <View style={styles.panelContent}>
                        {/* Status Pill */}
                        <View style={[styles.statusPill, selectedUser.status === "Approved" ? styles.approved : selectedUser.status === "Pending" ? styles.pending : styles.rejected]}>
                            <Text style={styles.statusText}>
                                {selectedUser.status}
                            </Text>
                        </View>
                        <Image source={{uri:selectedUser.profileImage}} style={styles.largeAvatar}/>
                        <Text style={styles.fullname}>{selectedUser.fname + " " + selectedUser.lname}</Text>
                        
                        <View style={styles.user}>
                            <View style={[styles.row, {justifyContent:'space-between'}]}>
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
                            </View>
                            <View style={[styles.row, {justifyContent:'space-between'}]}>
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
                                {/* Register Date */}
                                <View style={styles.details}>
                                    <View style={styles.row}>
                                        <Calendar size={18} color="#4f4f4f"/>
                                        <Text style={styles.panelLabel}>Register On:</Text>
                                    </View>
                                    <Text style={styles.userDetails}>{selectedUser.registerDate}</Text>
                                </View>
                            </View>
                            {/* Remark Section */}
                            <View style={styles.remark}>
                                <View style={styles.row}>
                                    <MessageSquare size={18} color="#4f4f4f"/>
                                    <Text style={styles.panelLabel}>Remark:</Text>
                                </View>
                                <Text style={styles.userDetails}>{selectedUser.remark}</Text>
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
                        {selectedUser.status==='Pending' &&(
                        <Pressable 
                            style={styles.Btn} 
                        >
                            <Text style={styles.btnText}>Approve</Text>
                        </Pressable>
                        )}
                        
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
        paddingHorizontal:12,
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
        fontSize:14
    },
    btnHover:{
        backgroundColor:'#5a993ffe'
    },
    tableHeader:{
        backgroundColor:'#0a6340',
        paddingHorizontal:12,
        paddingVertical:8
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
        paddingHorizontal:20,
        paddingVertical:8,
        position:'relative',
        flex:1,
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
        width:150
    },
    remark:{
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
        width:120,
        alignItems:'center',
        backgroundColor:'#207624',
        borderRadius:5,
        paddingHorizontal:20,
        paddingVertical:8,
        marginTop:15,
        position:'absolute',
        bottom:15,
        right:15
    },
    statusPill: {
        borderRadius: 15,
        alignSelf: 'end',
        marginBottom:10,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
        paddingVertical: 7,
        paddingHorizontal: 12,
    },
    approved: { backgroundColor: 'green' },
    pending: { backgroundColor: 'orange' },
    rejected: { backgroundColor: 'red' },

});

export default RegistrationManagement;