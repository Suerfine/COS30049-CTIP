import { Pen, Trash2, Search, Plus, Circle, ChevronLeft, ChevronsLeft, ChevronRight, ChevronsRight, X, User2, IdCard, Mail, ShieldUser, Calendar, FileUser, EllipsisVertical, ChevronDown, ChevronUp, CirclePlus, CircleMinus,  MessageSquare, Phone, ArrowUpNarrowWide, ArrowDownWideNarrow, RotateCcw, FileText, ExternalLink} from 'lucide-react-native';
import React, {useState} from 'react';
import { Pressable, StyleSheet, FlatList, View,Text, Image, TextInput, ActivityIndicator} from 'react-native';

// Import other components and hooks
import { useRegisterManagement } from '../hooks/useRegisterManagement';
import { formatDate } from '../utils/formatDate';
import RejectModal from '../components/RejectModal';

const RegistrationManagement=()=>{
    const {users, loading,currentPage, setCurrentPage, totalPages, totalUsers,selectedUser,setSelectedUser,handleSearch, searchQuery,sortConfig, requestSort,resetSort,currentStatus, setCurrentStatus,isCreating,setIsCreating,
        handleCreateUser, isRejecting, handleRejectUser }=useRegisterManagement();
    const [isOpen, setIsOpen]=useState(false);
    const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
    const [rejectReason, setRejectReason] = useState("");

    const handleNextPage=()=>{
        if(currentPage<totalPages){
            setCurrentPage(prev=>prev+1);
        }
    };

    const handlePrevPage=()=>{
        if(currentPage>1){
            setCurrentPage(prev=>prev-1);
        }
    };

    const handleOpenRejectModal = () => {
        setRejectReason("");
        setIsRejectModalVisible(true);
    };

    const itemsPerPage = 10; 
    const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
    const indexOfLastItem = indexOfFirstItem + users.length;
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }
    // Caluculate the pagination
    const currentUsers=users;

    const renderHeader=()=>(
        <View style={[styles.tableHeader, styles.row]}>
            <Pressable onPress={()=>requestSort('firstname')} style={[styles.headerRow, {flex:3}]}>
                <Text style={styles.headerText}>Full Name</Text>
                {sortConfig.key==='firstname' &&
                sortConfig.direction==='asc' ? <ArrowUpNarrowWide size={14} color="white"/> : <ArrowDownWideNarrow size={14} color="white"/>}
            </Pressable>
            
            <Text style={[styles.headerText, { flex:2}]}>IC.</Text>
            <Text style={[styles.headerText, { flex:2 }]}>Status</Text>
            <Pressable onPress={()=>requestSort('personal_email')} style={[styles.headerRow, {flex:3}]}>
                <Text style={styles.headerText}>Email</Text>
                {sortConfig.key==='personal_email' &&
                sortConfig.direction==='asc' ? <ArrowUpNarrowWide size={14} color="white"/> : <ArrowDownWideNarrow size={14} color="white"/>}
            </Pressable>
            <Text style={[styles.headerText, { flex:2}]}>Telefon</Text>
            <Pressable onPress={()=>requestSort('created_at')} style={[styles.headerRow, {flex:2}]}>
                <Text style={styles.headerText}>Register On</Text>
                {sortConfig.key==='created_at' &&
                sortConfig.direction==='asc' ? <ArrowUpNarrowWide size={14} color="white"/> : <ArrowDownWideNarrow size={14} color="white"/>}
            </Pressable>            
        </View>
    );

    const renderUserItem=({item})=>(
        <Pressable onPress={()=>setSelectedUser(item)} style={({hovered})=>[styles.row, styles.tableRow, hovered && {backgroundColor:'#f9f9f9'}, selectedUser?.id === item.id && {backgroundColor:'#fff8e1'}]}>
            {/* Full Name and profile image */}
            <View style={[{flex:3}, styles.userInfo, styles.row]}>
                {item.profileImage ? (
                <Image source={{ uri: item.profileImage }} style={styles.avatar} accessibilityLabel={`Profile Image of ${item.firstname+" "+item.lastname}`}/>
                ) : (
                    <View style={styles.pfpPlaceholder}>
                        <Text style={styles.pfpInitials}>
                            {item.firstname ? item.firstname[0].toUpperCase() : '?'}
                        </Text>
                    </View>
                )}
                <Text>{item.firstname + " " + item.lastname}</Text>
            </View>
            {/* IC */}
            <Text style={{flex:2}}>{item.identification}</Text>
            {/* Status */}
            <View style={[styles.row,styles.badge,{flex:2}]}>
               {item.status === "approved" ? (
                <Circle size={10} stroke="green" fill="green" />
                ) : item.status === "pending" ? (
                <Circle size={10} stroke="orange" fill="orange" />
                ) : (
                <Circle size={10} stroke="red" fill="red" />
                )}
                <Text>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</Text>
            </View>
            {/* Email */}
            <Text style={{flex:3}}>{item.personal_email}</Text>
            {/* Telefon */}
            <Text style={{flex:2}}>{item.tel}</Text>
            {/* Register On */}
            <Text style={{flex:2}}>{formatDate(item.created_at)}</Text>            
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
                    Showing {users.length>0 ? indexOfFirstItem+1 : 0} to {indexOfLastItem} of {totalUsers} users
                </Text>
                <View style={styles.row}>
                    <Pressable disabled={currentPage==1} onPress={()=>setCurrentPage(1)} style={[styles.pageBtn, currentPage==1 && styles.btnDisabled]}>
                        <Text style={[currentPage==1 ? styles.disabledText : styles.pageBtnText,styles.arrowBtn]}><ChevronsLeft size={20}/></Text>
                    </Pressable>
                    <Pressable disabled={currentPage==1} onPress={()=>handlePrevPage()} style={[styles.pageBtn, currentPage==1 && styles.btnDisabled]}>
                        <Text style={[currentPage==1 ? styles.disabledText : styles.pageBtnText,styles.arrowBtn]}><ChevronLeft size={20}/></Text>
                    </Pressable>
                    {pageNumbers.map((number)=>(
                        <Pressable key={number} onPress={()=>setCurrentPage(number)} style={[styles.pageBtn, currentPage === number && styles.activePageBtn]}>
                            <Text style={[styles.pageBtnText, currentPage===number && styles.activePageBtn]}>{number}</Text>
                        </Pressable>
                    ))}
                    <Pressable disabled={currentPage==totalPages} onPress={()=>handleNextPage()} style={[styles.pageBtn, currentPage==totalPages && styles.btnDisabled]}>
                        <Text style={[currentPage==totalPages ? styles.disabledText : styles.pageBtnText, styles.arrowBtn]}><ChevronRight size={20}/></Text>
                    </Pressable>
                    <Pressable disabled={currentPage==totalPages} onPress={()=>setCurrentPage(totalPages)} style={[styles.pageBtn, currentPage==totalPages && styles.btnDisabled]}>
                        <Text style={[currentPage==totalPages ? styles.disabledText : styles.pageBtnText, styles.arrowBtn]}><ChevronsRight size={20}/></Text>
                    </Pressable>
                </View>
            </View>
        )
    };

    return(
        <View style={styles.container}>
            <Text style={styles.title}>Registration Management</Text>
            <View style={[styles.toolbar,styles.row]}>
                <View style={styles.row}>
                    <Pressable onPress={resetSort} style={({ hovered }) => [
                        styles.iconBtn,
                        hovered && styles.iconBtnHover,
                    ]}>
                        <RotateCcw size={20}/>
                    </Pressable>
                    <View style={[styles.search,styles.row]}>
                        <Search size={18}/>
                        <TextInput style={styles.input} placeholder='Search...' placeholderTextColor="#8f8f8f" value={searchQuery} onChangeText={handleSearch}/>
                    </View>
                    {/* Status Dropdown */}
                    <View style={styles.dropdownWrapper}>
                        <Pressable 
                            style={styles.pillTrigger} 
                            onPress={() => setIsOpen(!isOpen)}
                        > 
                            <Text style={styles.pillText}>{currentStatus !== 'All' ? currentStatus : 'Status'}</Text>
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
            </View>

            <View style={styles.tableContainer}>
                <FlatList style={styles.table} 
                    data={currentUsers}
                    ListHeaderComponent={renderHeader}
                    renderItem={renderUserItem}
                    keyExtractor={item=>item.id.toString()}
                    ListEmptyComponent={<View style={styles.tableRow}><Text style={{flex:1, paddingVertical:2}}>No Users Found.</Text></View>}
                />
            </View>
            {totalPages>1 ? renderPagination() : null}
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
                        {selectedUser.profileImage ? (
                            <Image source={{uri:selectedUser?.profileImage}} style={styles.largeAvatar}/>
                        ) : (
                            <View style={styles.SideBarPlaceholder}>
                                <Text style={styles.sideBarInitials}>
                                    {selectedUser?.firstname
                                        ? selectedUser.firstname[0].toUpperCase()
                                        : "?"}
                                </Text>
                            </View>
                        )}
                        
                        
                        <Text style={styles.fullname}>{selectedUser.firstname + " " + selectedUser.lastname}</Text>
                        
                        <View style={styles.user}>
                            <View style={[styles.row, {justifyContent:'space-between'}]}>                                
                                {/* IC */}
                                <View style={styles.details}>
                                    <View style={styles.row}>
                                        <IdCard size={18} color="#4f4f4f"/>
                                        <Text style={styles.panelLabel}>Passport/IC:</Text>
                                    </View>
                                    <Text style={styles.userDetails}>{selectedUser.identification}</Text>
                                </View>
                            </View>
                            <View style={[styles.row, {justifyContent:'space-between'}]}>
                                {/* Email */}
                                <View style={styles.details}>
                                    <View style={styles.row}>
                                        <Mail size={18} color="#4f4f4f"/>
                                        <Text style={styles.panelLabel}>Email:</Text>
                                    </View>
                                    <Text style={styles.userDetails}>{selectedUser.personal_email}</Text>
                                </View>
                                {/* Register Date */}
                                <View style={styles.details}>
                                    <View style={styles.row}>
                                        <Calendar size={18} color="#4f4f4f"/>
                                        <Text style={styles.panelLabel}>Register On:</Text>
                                    </View>
                                    <Text style={styles.userDetails}>{formatDate(selectedUser.created_at)}</Text>
                                </View>
                            </View>
                            {/* Telefon Section */}
                            <View style={styles.details}>
                                <View style={styles.row}>
                                    <Phone size={18} color="#4f4f4f"/>
                                    <Text style={styles.panelLabel}>Telephone:</Text>
                                </View>
                                <Text style={styles.userDetails}>{selectedUser.tel}</Text>
                            </View>
                            {/* Remark Section */}
                            {selectedUser.admin_remark !== null && (
                                <View style={styles.remark}>
                                    <View style={styles.row}>
                                        <MessageSquare size={18} color="#4f4f4f"/>
                                        <Text style={styles.panelLabel}>Remark:</Text>
                                    </View>
                                    <Text style={styles.userDetails}>{selectedUser.admin_remark}</Text>
                                </View>
                            )}
                            
                            {/* CV Section */}
                            <View style={styles.details}>
                                <View style={styles.row}>
                                    <FileUser size={18} color="#4f4f4f"/>
                                    <Text style={styles.panelLabel}>Resume:</Text>
                                </View>
                                <Pressable style={styles.pdfBadge} onPress={() => window.open(selectedUser.resumeUrl, '_blank')}><FileText size={14} color="#0a6340" />
                                    <Text style={styles.pdfText}>View_Resume.pdf</Text>
                                    <ExternalLink size={14} color="#666" />
                                </Pressable>
                            </View>
                        </View>
                        {selectedUser.status=='pending' &&(
                        <View style={styles.actionContainer}>
                            {/* Reject Button */}
                            <Pressable 
                                style={({ hovered }) => [styles.rejectbtn,
                                    hovered && styles.rejectBtnHover, 
                                ]} 
                                onPress={()=>setIsRejectModalVisible(true)}
                                disabled={isRejecting || isCreating}
                            >
                                {isRejecting ? (
                                    <ActivityIndicator color="#dc2626" size="small" />
                                ) : (
                                    <Text >Reject</Text>
                                )}
                            </Pressable>
                            <Pressable 
                            style={({ hovered }) => [styles.Btn,
                                    hovered && styles.btnHover, 
                                ]} onPress={()=>handleCreateUser(selectedUser)}
                            >
                                {isCreating ? (
                                    <ActivityIndicator color="white" size="small" />
                                ) : (
                                    <Text style={styles.btnText}>Approve</Text>
                                )}
                            </Pressable>
                        </View>
                        )}
                        
                    </View>
                </View>
            )}
            <RejectModal 
                visible={isRejectModalVisible}
                onClose={() => setIsRejectModalVisible(false)}
                reason={rejectReason}
                setReason={setRejectReason}
                loading={isRejecting}
                onConfirm={async () => {
                    const result = await handleRejectUser(selectedUser, rejectReason);
                    if (result?.success) {
                        setIsRejectModalVisible(false);
                    }
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
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
        paddingVertical:8,
        userSelect:"none"
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
    avatar:{
        width: 90,
        height: 90,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: 'white',
    },
    pfpPlaceholder:{
        width: 37,
        height: 37,
        borderRadius: 60,
        backgroundColor: '#2c5c189d',
        borderWidth: 3,
        borderColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
    },
    SideBarPlaceholder:{
        width: 90,
        height: 90,
        borderRadius: 60,
        backgroundColor: '#2c5c189d',
        borderWidth: 3,
        borderColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf:'center'
    },
    pfpInitials:{
        fontSize: 12,
        fontWeight: '700',
        color: 'white',
    },
    sideBarInitials:{
        fontSize: 32,
        fontWeight: '700',
        color: 'white',
    },
    largeAvatar:{
        width:130,
        height:130,
        alignSelf:'center',
    },
    panelContent:{
        padding:20,
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
        userSelect:"none",
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
    Btn:{
        width:120,
        alignItems:'center',
        backgroundColor:'#2e9333',
        borderRadius:10,
        paddingHorizontal:20,
        paddingVertical:8,
        marginTop:15,
    },
    headerRow:{
        flexDirection:'row',
        gap:10,
        paddingHorizontal:10,
        alignItems:'center',
    },
    iconBtn:{
        alignSelf:'center',
        padding:8,
        marginRight:20,
        color:"#217837",
        borderRadius:50,
        backgroundColor:'white',
    },
    iconBtnHover:{
        backgroundColor:"#217837",
        color:'white',
    },
    pdfBadge:{
        flexDirection:'row',
        alignItems:'center',
        backgroundColor:'#f0f7f4',
        paddingHorizontal:12,
        paddingVertical:6,
        borderRadius:6,
        borderWidth:1,
        borderColor: '#0a634033',
        gap: 8,
        marginTop: 4,
    },
    pdfText:{
        color:'#0a6340',
        fontSize:13,
        fontWeight:'500'
    },
    actionContainer:{
        flexDirection: 'row',
        gap: 12,
        position:'absolute',
        bottom:15,
        right:15
    },
    rejectbtn: {
        width:120,
        alignItems:'center',
        borderColor: '#dc2626',
        borderWidth:1,
        borderRadius:10,
        paddingHorizontal:20,
        paddingVertical:8,
        marginTop:15,
    },
    rejectBtnHover:{
        backgroundColor:'#dc2626',
    },
});

export default RegistrationManagement;
