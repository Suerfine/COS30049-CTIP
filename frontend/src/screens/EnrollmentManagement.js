import React, {useState} from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ImageBackground, ScrollView, FlatList} from 'react-native';
import { useEnrollmentManagement } from '../hooks/useEnrollmentManagement';
import { RotateCcw, Search, ChevronDown, ChevronUp,ArrowUpNarrowWide, ArrowDownWideNarrow} from 'lucide-react-native';

const EnrollmentManagement = () => {
    const {enrollments, submissions, loading}=useEnrollmentManagement();
    const enrollFields=['fullName', 'courseName', 'status'];
    const [searchTerm, setSearchTerm]=useState('');
    const [currentPage, setCurrentPage]=useState(1);
    const itemsPerPage=10;
    const [currentStatus, setCurrentStatus]=useState('All');
    const [isOpen, setIsOpen]=useState(false);

    const indexOfLastItem=currentPage*itemsPerPage;
    const indexOfFirstItem=indexOfLastItem-itemsPerPage;
    const currentEnrollments=enrollments.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages=Math.ceil(enrollments.length/itemsPerPage);

    const renderHeader=()=>(
        <View style={[styles.tableHeader, styles.row]}>
            <Text style={[styles.headerText,{flex: 2}]}>Full Name</Text>
            <Text style={[styles.headerText, { flex:2}]}>Course Code</Text>
            <Text style={[styles.headerText, { flex:2 }]}>Course Name</Text>
            <Text style={[styles.headerText, { flex:2}]}>Enrolled On</Text>
            <Text style={[styles.headerText, { flex:2}]}>Status</Text>
            <Text style={[styles.headerText, { flex:2}]}>Completed On</Text>
            <Text style={[styles.headerText, { flex:2}]}>Badge</Text>
            <Text style={[styles.headerText, { flex:2}]}>Issues On</Text>
            <Text style={[styles.headerText, { flex:2}]}>Expiry On</Text>        
        </View>
    );

    const renderUserItem=({item})=>(
        <Pressable onPress={()=>setSelectedUser(item)} style={({hovered})=>[styles.row, styles.tableRow, hovered && {backgroundColor:'#f9f9f9'}, selectedUser?.id === item.id && {backgroundColor:'#fff8e1'}]}>
            {/* Full Name and profile image */}
            <View style={[{flex:3}, styles.userInfo, styles.row]}>
                <Image source={{uri:item.profileImage}} style={styles.avatar} accessibilityLabel={`Profile Image of ${item.fullName}`}/>
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
    
    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Registration Management</Text>
            <View style={[styles.toolbar, styles.row]}>
                <View style={styles.row}>
                    <Pressable onPress={()=>setSortConfig({key:null, asc:true})} style={({ hovered }) => [
                        styles.iconBtn,
                        hovered && styles.iconBtnHover,
                    ]}>
                        <RotateCcw size={20}/>
                    </Pressable>
                    <View style={[styles.search,styles.row]}>
                        <Search size={18}/>
                        <TextInput style={styles.input} placeholder='Search...' placeholderTextColor="#8f8f8f" value={searchTerm} onChangeText={(text)=>{setSearchTerm(text); setCurrentPage(1);}}/>
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
                                {['All','Completed','In Progress', 'Expired'].map((status) => (
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
                    data={currentEnrollments}
                    ListHeaderComponent={renderHeader}
                    // renderItem={renderUserItem}
                    keyExtractor={item=>item.id.toString()}
                    ListEmptyComponent={<View style={styles.tableRow}><Text style={{flex:1, paddingVertical:2}}>No Users Found.</Text></View>}
                />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f2f2f2'
    },
    toolbar:{
        justifyContent:'space-between',
        marginVertical:20,
        zIndex:500
    },
    title:{
        fontSize:25,
        fontWeight:500,
    },
    row:{
        flexDirection:'row'
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
    toolbar:{
        justifyContent:'space-between',
        marginVertical:20,
        zIndex:500
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
    pillTrigger:{
        border:'1px solid #0a6340',
        width:110,
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
    tableHeader:{
        backgroundColor:'#0a6340',
        paddingHorizontal:12,
        paddingVertical:8,
        userSelect:"none"
    },
    headerRow:{
        flexDirection:'row',
        gap:10,
        paddingHorizontal:10,
        alignItems:'center',
    },
    headerText:{
        color:'white',
        alignSelf:'center',
        fontWeight:500,
    },
    pillText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },
});
export default EnrollmentManagement;