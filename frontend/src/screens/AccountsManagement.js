import { Pen, Trash2, Search, Plus, Circle, ChevronLeft, ChevronsLeft, ChevronRight, ChevronsRight, X, User2, IdCard, Mail, ShieldUser, Calendar, FileUser, EllipsisVertical, ChevronDown, ChevronUp, CirclePlus, CircleMinus,  MessageSquare, Phone, ArrowUpNarrowWide, ArrowDownWideNarrow, RotateCcw} from 'lucide-react-native';
import React, {useState} from 'react';
import { Pressable, StyleSheet, FlatList, View,Text, Image, TextInput} from 'react-native';

// Import other components and hooks
import { useAccountManagement } from '../hooks/useAccountManagement';
import { formatDate } from '../utils/formatDate';

const AccountManagement=()=>{
    const {accounts,currentPage, setCurrentPage, totalPages, totalUsers, searchQuery, handleSearch,sortConfig, requestSort, resetSort} = useAccountManagement();

    const [selectedAcc, setSelectedAcc]=useState(null);
    const [activeMenuId, setActiveMenuId]=useState(null);
    const [isOpen, setIsOpen]=useState(false);
    const [isEditing, setIsEditing]=useState(false);

    // Caluculate the pagination
    const itemsPerPage = 10; 
    const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
    const indexOfLastItem = indexOfFirstItem + accounts.length;
    const estimatedTotal = totalPages * itemsPerPage;
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }
    // Caluculate the pagination
    const currentAcc=accounts;

    const renderHeader=()=>(
        <View style={[styles.tableHeader, styles.row]}>
            <Pressable onPress={()=>requestSort('firstname')} style={[styles.headerRow, {flex:3}]}>
                <Text style={styles.headerText}>Full Name</Text>
                {sortConfig.key==='firstname' &&
                sortConfig.direction==='asc' ? <ArrowUpNarrowWide size={14} color="white"/> : <ArrowDownWideNarrow size={14} color="white"/>}
            </Pressable>
            <Pressable onPress={()=>requestSort('username')} style={[styles.headerRow, {flex:2}]}>
                <Text style={styles.headerText}>Username</Text>
                {sortConfig.key==='username' &&
                sortConfig.direction==='asc' ? <ArrowUpNarrowWide size={14} color="white"/> : <ArrowDownWideNarrow size={14} color="white"/>}
            </Pressable>
            <Text style={[styles.headerRow, {flex:3}]}>
                <Text style={styles.headerText}>Work Email</Text>
            </Text>
            <Pressable onPress={()=>requestSort('created_at')} style={[styles.headerRow, {flex:2}]}>
                <Text style={styles.headerText}>Joined On</Text>
                {sortConfig.key==='created_at' &&
                sortConfig.direction==='asc' ? <ArrowUpNarrowWide size={14} color="white"/> : <ArrowDownWideNarrow size={14} color="white"/>}
            </Pressable>
            <Pressable onPress={()=>requestSort('last_login_at')} style={[styles.headerRow, {flex:2}]}>
                <Text style={styles.headerText}>Last Login</Text>
                {sortConfig.key==='last_login_at' &&
                sortConfig.direction==='asc' ? <ArrowUpNarrowWide size={14} color="white"/> : <ArrowDownWideNarrow size={14} color="white"/>}
            </Pressable>
        </View>
    );

    const renderUserItem=({item})=>(
        <Pressable onPress={()=>setSelectedAcc(item)} style={({hovered})=>[styles.row, styles.tableRow, hovered && {backgroundColor:'#f9f9f9'}, selectedAcc?.id === item.id && {backgroundColor:'#fff8e1'}]}>
            {/* Full Name and profile image */}
            <View style={[{flex:3}, styles.userInfo, styles.row]}>
                <Image source={{uri:item.profileImage}} style={styles.avatar} accessibilityLabel={`Profile Image of ${item.firstname+" "+item.lastname}`}/>
                <Text>{item.firstname+" "+item.lastname}</Text>
            </View>
            {/* Username */}
            <Text style={{flex:2}}>{item.username}</Text>
            {/* Work Email */}
            <Text style={{flex:3}}>{item.username + " @example.com"}</Text>
            {/* Joined On */}
            <Text style={{flex:2}}>{formatDate(item.created_at)}</Text>
            {/* Last Login */}
            <Text style={{flex:2}}>{formatDate(item.last_login_at)}</Text>
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
                    Showing {accounts.length>0 ? indexOfFirstItem+1 : 0} to {indexOfLastItem} of {totalUsers} users
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
            <Text style={styles.title}>Account Management</Text>
            <View style={styles.toolbar}>
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
                </View>
            </View>

            <View style={styles.tableContainer}>
                <FlatList style={styles.table} 
                    data={currentAcc}
                    ListHeaderComponent={renderHeader}
                    renderItem={renderUserItem}
                    keyExtractor={item=>item.id.toString()}
                    ListEmptyComponent={<View style={styles.tableRow}><Text style={{flex:1, paddingVertical:2}}>No Users Found.</Text></View>}
                />
            </View>
            {totalPages>1 ? renderPagination() : null}
            {/* Side panel: show user details */}
            {selectedAcc && (
                <View style={styles.sidePanel}>
                    <View style={styles.panelHeader}>
                        <Text style={styles.panelTitle}>
                            User Information
                        </Text>
                        <Pressable onPress={()=>{setSelectedAcc(null);setIsEditing(false)}}>
                            <X size={18}/>
                        </Pressable>
                    </View>
                    <View style={styles.panelContent}>
                        {/* Action Menu */}
                        <View style={styles.actionMenu}>
                            <Pressable onPress={()=>setActiveMenuId(activeMenuId===selectedAcc.id ? null : selectedAcc.id)}>
                                <EllipsisVertical/>
                            </Pressable>
                            {activeMenuId===selectedAcc.id && (
                                <View style={styles.floatingMenu}>
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
                        <Image source={{uri:selectedAcc.profileImage}} style={styles.largeAvatar}/>
                        <Text style={styles.fullname}>{selectedAcc.firstname+" "+selectedAcc.lastname}</Text>
                        
                        <View style={styles.user}>
                            {/* Username */}
                            <View style={styles.details}>
                                <View style={styles.row}>
                                    <User2 size={18} color="#4f4f4f"/>
                                    <Text style={styles.panelLabel}>Username:</Text>
                                </View>
                                {isEditing ? (<TextInput
                                style={[styles.userDetails,styles.inputEditing]}
                                value={selectedAcc.username}
                            />) : (<Text style={styles.userDetails}>{selectedAcc.username}</Text>)}
                                
                            </View>
                            {/* IC */}
                            <View style={styles.details}>
                                <View style={styles.row}>
                                    <IdCard size={18} color="#4f4f4f"/>
                                    <Text style={styles.panelLabel}>Passport/IC:</Text>
                                </View>
                                {isEditing ? (<TextInput
                                style={[styles.userDetails,styles.inputEditing]}
                                value={selectedAcc.identification}
                            />) : (<Text style={styles.userDetails}>{selectedAcc.identification}</Text>)}
                            </View>

                            {/* Telephone */}
                            <View style={styles.details}>
                                <View style={styles.row}>
                                    <Phone size={18} color="#4f4f4f"/>
                                    <Text style={styles.panelLabel}>Telephone:</Text>
                                </View>
                                {isEditing ? (<TextInput
                                style={[styles.userDetails,styles.inputEditing]}
                                value={selectedAcc.tel}
                            />) : (<Text style={styles.userDetails}>{selectedAcc.tel}</Text>)}
                            </View>
                            
                            {/* Email */}
                            <View style={styles.details}>
                                <View style={styles.row}>
                                    <Mail size={18} color="#4f4f4f"/>
                                    <Text style={styles.panelLabel}>Work Email:</Text>
                                </View>
                                <Text style={styles.userDetails}>{selectedAcc.username+"@example.com"}</Text>
                                <View style={styles.row}>
                                    <Text style={[styles.panelLabel, {marginLeft:35, marginTop:15}]}>Personal Email:</Text>
                                </View>
                                {isEditing ? (<TextInput
                                style={[styles.userDetails,styles.inputEditing]}
                                value={selectedAcc.personal_email}
                            />) : (<Text style={styles.userDetails}>{selectedAcc.personal_email}</Text>)}
                            </View>
                            {/* Joined Date */}
                            <View style={styles.details}>
                                <View style={styles.row}>
                                    <Calendar size={18} color="#4f4f4f"/>
                                    <Text style={styles.panelLabel}>Joined On:</Text>
                                </View>
                                <Text style={styles.userDetails}>{formatDate(selectedAcc.created_at)}</Text>
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
        userSelect:'none',
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
    menuItem:{
        padding:14,
        alignItems:'center'
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
        paddingVertical:5,
        paddingHorizontal:10,
        flex:1,
        marginTop:5,
        minWidth:220
    },
    Btn:{
        width:120,
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
    headerRow:{
        flexDirection:'row',
        gap:10,
        paddingHorizontal:10,
        alignItems:'center',
    },
});

export default AccountManagement;

// Edit user and delete user