import React, {useState} from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ImageBackground, ScrollView, FlatList, Image} from 'react-native';
import { useEnrollmentManagement } from '../hooks/useEnrollmentManagement';
import { RotateCcw, Search, ChevronDown, ChevronUp,ArrowUpNarrowWide, ArrowDownWideNarrow, Circle, Trash2} from 'lucide-react-native';
import {Animated} from 'react-native';

const EnrollmentManagement = () => {
    const {enrollments, submissions, loading}=useEnrollmentManagement();
    const [activeTab, setActiveTab]=useState('enrollment');
    const enrollFields=['fullName', 'courseName', 'status'];
    const [searchTerm, setSearchTerm]=useState('');
    const [currentPage, setCurrentPage]=useState(1);
    const itemsPerPage=10;
    const [currentStatus, setCurrentStatus]=useState('All');
    const [isOpen, setIsOpen]=useState(false);

    const STATUS_OPTIONS={
        enrollment:['All', 'Completed', 'In Progress', 'Expired'],
        submission:['All', 'Approved', 'Pending', 'Rejected']
    };

    const displayData=activeTab === 'enrollment' ? enrollments : submissions;

    const indexOfLastItem=currentPage*itemsPerPage;
    const indexOfFirstItem=indexOfLastItem-itemsPerPage;
    const currentData=displayData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages=Math.ceil(displayData.length/itemsPerPage);
    const slideAnim=useState(new Animated.Value(0))[0];

    const handleTabChange=(tab, value)=>{
        setActiveTab(tab);
        setCurrentPage(1);
        Animated.spring(slideAnim,{
            toValue:value,
            useNativeDriver:false,
            friction:8,
            tension:50
        }).start();
    };

    const translateX=slideAnim.interpolate({
        inputRange:[0,1],
        outputRange:[0,150],
    });

    const renderEnrollmentHeader=()=>(
        <View style={[styles.tableHeader, styles.row]}>
            <Text style={[styles.headerText,{flex: 2}]}>Full Name</Text>
            <Text style={[styles.headerText, { flex:2}]}>Course Code</Text>
            <Text style={[styles.headerText, { flex:3 }]}>Course Name</Text>
            <Text style={[styles.headerText, { flex:2}]}>Enrolled On</Text>
            <Text style={[styles.headerText, { flex:2}]}>Status</Text>
            <Text style={[styles.headerText, { flex:2}]}>Completed On</Text>
            <Text style={[styles.headerText, { flex:2}]}>Expiry On</Text>  
            <Text style={[styles.headerText, { flex:1, textAlign:'center'}]}>Action</Text>       
        </View>
    );

    const renderSubmissionsHeader=()=>(
        <View style={[styles.tableHeader, styles.row]}>
            <Text style={[styles.headerText,{flex: 2}]}>Full Name</Text>
            <Text style={[styles.headerText, { flex:2}]}>Course Code</Text>
            <Text style={[styles.headerText, { flex:3 }]}>Course Name</Text>
            <Text style={[styles.headerText, { flex:2}]}>Final Quiz</Text>
            <Text style={[styles.headerText, { flex:2}]}>Total Score</Text>
            <Text style={[styles.headerText, { flex:2}]}>Completed On</Text>
            <Text style={[styles.headerText, { flex:2}]}>Status</Text>
            <Text style={[styles.headerText, { flex:2}]}>Badge</Text>
            <Text style={[styles.headerText, { flex:2}]}>Issues On</Text>
            <Text style={[styles.headerText, { flex:2}]}>Expiry On</Text>  
            <Text style={[styles.headerText, { flex:1, textAlign:'center'}]}>Action</Text>       
        </View>
    );

    const renderEnrollmentItem=({item})=>(
        <View style={[styles.row, styles.tableRow, {backgroundColor:'#f9f9f9'}]}>
            {/* Full Name and profile image */}
            <View style={[{flex:2}, styles.userInfo, styles.row]}>
                <Image source={{uri:item.profileImage}} style={styles.avatar} accessibilityLabel={`Profile Image of ${item.fullName}`}/>
                <Text>{item.fullName}</Text>
            </View>
            {/* Course Code */}
            <Text style={{flex:2}}>{item.courseId}</Text>
            {/* Course Name */}
            <Text style={{flex:3}}>{item.courseName}</Text>
            {/* Enrolled On */}
            <Text style={{flex:2}}>{item.Enrolled_on}</Text>
            {/* Status */}
            <View style={[styles.row,styles.badge,{flex:2}]}>
               {item.status === "Completed" ? (
                <Circle size={10} stroke="green" fill="green" />
                ) : item.status === "In Progress" ? (
                <Circle size={10} stroke="orange" fill="orange" />
                ) : (
                <Circle size={10} stroke="red" fill="red" />
                )}
                <Text>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</Text>
            </View>
            {/* Completed On */}
            <Text style={{flex:2}}>{item.completed_on || "N/A"}</Text>
            {/* Expiry On */}
            <Text style={{flex:2}}>{item.expiry_date}</Text>
            {/* Action */}
            <Text style={{flex:1,textAlign:'center'}}><Trash2 size={16}/></Text>
        </View>
    );

    const renderSubmissionsItem=({item})=>(
        <View style={[styles.row, styles.tableRow, {backgroundColor:'#f9f9f9'}]}>
            {/* Full Name and profile image */}
            <View style={[{flex:2}, styles.userInfo, styles.row]}>
                <Image source={{uri:item.profileImage}} style={styles.avatar} accessibilityLabel={`Profile Image of ${item.fullName}`}/>
                <Text>{item.fullName}</Text>
            </View>
            {/* Course Code */}
            <Text style={{flex:2, textAlign:'center'}}>{item.courseId}</Text>
            {/* Course Name */}
            <Text style={{flex:3}}>{item.courseName}</Text>
            {/* Final quiz */}
            <Text style={{flex:2, textAlign:'center'}}>{item.final_quiz_score}</Text>
            {/* Total Score */}
            <Text style={{flex:2, textAlign:'center'}}>{item.course_total_score}</Text>
            {/* Completed On */}
            <Text style={{flex:2}}>{item.completion_date || "N/A"}</Text>
            {/* Status */}
            <View style={[styles.row,styles.badge,{flex:2}]}>
               {item.status === "Approved" ? (
                <Circle size={10} stroke="green" fill="green" />
                ) : item.status === "Pending" ? (
                <Circle size={10} stroke="orange" fill="orange" />
                ) : (
                <Circle size={10} stroke="red" fill="red" />
                )}
                <Text>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</Text>
            </View>
            {/* Badge */}
            <Text style={{flex:2}}>{item.badge || "N/A"}</Text>
            {/* Issue On */}
            <Text style={{flex:2}}>{item.issued_on || "N/A"}</Text>
            {/* Expiry On */}
            <Text style={{flex:2}}>{item.expiry_date}</Text>
            {/* Action */}
            <Text style={{flex:1,textAlign:'center'}}><Trash2 size={16}/></Text>
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
                    Showing {enrollments.length>0 ? indexOfFirstItem+1 : 0} to {Math.min(indexOfLastItem, enrollments.length)} of {enrollments.length} records
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
    
    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Enrollment Management</Text>
            <View style={styles.tabWrapper}>
                <View style={[styles.tabContainer,styles.row]}>
                    <Pressable onPress={()=>{handleTabChange('enrollment',0); setCurrentPage(1);}} style={styles.tabButton}>
                        <Text style={[styles.tabText, activeTab==='enrollment' && styles.activeTabText]}>Enrollments</Text>
                    </Pressable>
                    <Pressable onPress={()=>{handleTabChange('submission',1); setCurrentPage(1);}} style={styles.tabButton}>
                        <Text style={[styles.tabText, activeTab==='submission' && styles.activeTabText]}>Submissions</Text>
                    </Pressable>
                </View>
                <Animated.View style={[styles.slidingLine, {transform:[{translateX}]}]}/>
            </View>
            
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
                                {STATUS_OPTIONS[activeTab].map((status) => (
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
                    data={currentData}
                    ListHeaderComponent={activeTab==='enrollment' ? renderEnrollmentHeader : renderSubmissionsHeader}
                    renderItem={activeTab==='enrollment' ? renderEnrollmentItem : renderSubmissionsItem}
                    keyExtractor={item=>item.id.toString()}
                    ListEmptyComponent={<View style={styles.tableRow}><Text style={{flex:1, paddingVertical:2}}>No Record Found.</Text></View>}
                />
            </View>
            {totalPages>1 ? renderPagination() : null}
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
        marginTop:15,
        marginBottom:15,
        zIndex:500
    },
    menuItem:{
        padding:14,
        alignItems:'center',
        width:'100px'
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
    tableRow:{
        paddingVertical:5,
        borderBottomWidth:1,
        borderBottomColor:"#8f8f8f84",
        alignItems:'center',
        paddingHorizontal:12,
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
    avatar:{
        width:35,
        height:35,
        borderRadius:50,
    },
    tabButton:{
        paddingVertical:10,
        paddingHorizontal:20,
        marginRight:10,
        width:150,
    },
    tabText:{
        fontSize:16,
        color:'#666'
    },
    activeTabText:{
        color:'#065133c6',
        fontWeight:'bold'
    },
    tabWrapper:{
        width:300,
        marginTop:20,
        positive:'relative',
    },
    tabContainer:{
        width:'100%',
    },
    slidingLine:{
        position:"absolute",
        bottom:0,
        width:150,
        height:3,
        backgroundColor:'#0a6340',
        borderRadius:3
    }
});
export default EnrollmentManagement;