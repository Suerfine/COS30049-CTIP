import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, FlatList, Image, Modal } from 'react-native';
import { RotateCcw, Search, ChevronDown, ChevronUp, ArrowUpNarrowWide, ArrowDownWideNarrow, Circle, Trash2, ChevronLeft, ChevronsLeft, ChevronRight, ChevronsRight, CheckCircle2 } from 'lucide-react-native';

// Import hooks and assets
import SlidingTabs from '../components/SlidingTabs';
import { formatDate } from '../utils/formatDate';
import { useEnrollmentManagement } from '../hooks/useEnrollmentManagement';
import EnrollmentDetailModal from '../components/EnrollmentDetailModal';
import { Status_Config } from '../utils/status_config';

const EnrollmentManagement = () => {
    const {
        enrollments, submissions, loading, 
        currentPage, setCurrentPage,
        totalPages, totalElements,
        currentSubmissionPage, setSubmissionCurrentPage,
        submissionTotalPages, submissionTotalElements,
        searchQuery, setSearchQuery,
        currentStatus, setCurrentStatus,
        sortConfig, requestSort, resetSort,
        handleUpdateStatus, deleteRecord, courses,
        auditData, auditLoading, fetchEnrollmentAudit,
        payments, currentPaymentPage, setPaymentCurrentPage,
        paymentTotalPages, paymentTotalElements
    } = useEnrollmentManagement();

    const [activeTab, setActiveTab] = useState('enrollment');
    const [isOpen, setIsOpen] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedUserEnrollment, setSelectedUserEnrollment] = useState(null);
    const [selectedUserHistory, setSelectedUserHistory] = useState([]);
    const enrollmentStatusOptions = [
        'All',
        'in_progress',
        'in_review',
        'completed',
        'failed',
        'dropped',
        'expired'
    ];

    const paymentStatusOptions = [
        'All',
        'pending',
        'paid',
        'failed',
        'refunded'
    ];

    const isEnrollment = activeTab === 'enrollment';
    const isSubmission = activeTab === 'submission';
    const isPayment = activeTab === 'payment';
    const displayData =
        isEnrollment ? enrollments :
        isSubmission ? submissions :
        (payments || []);
    const activeTotalPages =
        isEnrollment ? totalPages :
        isSubmission ? submissionTotalPages :
        paymentTotalPages;
    const activeTotalElements =
        isEnrollment ? totalElements :
        isSubmission ? submissionTotalElements :
        paymentTotalElements;
    const activeCurrentPage =
        isEnrollment ? currentPage :
        isSubmission ? currentSubmissionPage :
        currentPaymentPage;
    const setActivePage =
        isEnrollment ? setCurrentPage :
        isSubmission ? setSubmissionCurrentPage :
        setPaymentCurrentPage;

    const itemsPerPage = 10;
    const indexOfFirstItem = (activeCurrentPage - 1) * itemsPerPage;
    const indexOfLastItem = indexOfFirstItem + displayData.length;
    const [auditModalVisible, setAuditModalVisible] = useState(false);

    const handleOpenAudit = async (id) => {
        try {
            setAuditModalVisible(true);
            const data = await fetchEnrollmentAudit(id);
        } catch (err) {
            console.error(err);
            setAuditModalVisible(false);
        }
    };

    const ProgressRing = ({ earned, total }) => {
        const isCompleted = earned >= total && total > 0;
        const percentage = total > 0 ? (earned / total) * 100 : 0;

        return (
            <View style={[styles.progressRing, isCompleted ? {borderWidth:0} : styles.ringIncomplete]}>
                <Text style={[styles.progressText, isCompleted && { color: '#fff' }]}>
                    {isCompleted ? <CheckCircle2 size={25} color="#063b17" /> : `${earned}/${total}`}
                </Text>
            </View>
        );
    };

    const tabs = [
        { id: 'enrollment', label: 'Enrollment' },
        { id: 'submission', label: 'Submission' },
        { id: 'payment', label: 'Payment' },
    ];

    const formatted = (status) => {
        if (!status) return "N/A";
        return status.split("_")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    const handleRowPress = (enrollment) => {
        setSelectedUserEnrollment(enrollment);
        const userHistory = enrollments.filter(e => e.user_id === enrollment.user_id);
        setSelectedUserHistory(userHistory);
        setDetailModalVisible(true);
    };


    const renderEnrollmentHeader = () => (
        <View style={[styles.tableHeader, styles.row]}>
            <Text style={[styles.headerText, { flex: 3 }]}>Full Name</Text>
            <Text style={[styles.headerText, { flex: 2 }]}>Course Code</Text>
            <Text style={[styles.headerText, { flex: 4 }]}>Course Name</Text>
            <Pressable onPress={() => requestSort('enrolled_at')} style={[styles.headerRow, { flex: 2 }]}>
                <Text style={styles.headerText}>Enrolled On</Text>
                {sortConfig.key === 'enrolled_at' && (sortConfig.direction === 'asc' ? <ArrowUpNarrowWide size={14} color="white" /> : <ArrowDownWideNarrow size={14} color="white" />)}
            </Pressable>
            <Text style={[styles.headerText, { flex: 2 }]}>Status</Text>
            <Text style={[styles.headerText, { flex: 2 }]}>Expiry On</Text>
        </View>
    );

    const renderSubmissionsHeader = () => (
        <View style={[styles.tableHeader, styles.row]}>
            <Text style={[styles.headerText, { flex: 3 }]}>Full Name</Text>
            <Text style={[styles.headerText, { flex: 2 }]}>Course Code</Text>
            <Text style={[styles.headerText, { flex: 4 }]}>Course Name</Text>
            <Text style={[styles.headerText, { flex: 2 }]}>Status</Text>
            <Text style={[styles.headerText, { flex: 1 }]}>Badge</Text>
            <Text style={[styles.headerText, { flex: 2 }]}>Issued On</Text>
            <Text style={[styles.headerText, { flex: 2 }]}>Expiry On</Text>
        </View>
    );

    const renderPaymentHeader = () => (
        <View style={[styles.tableHeader, styles.row]}>
            <Text style={[styles.headerText, { flex: 3 }]}>Full Name</Text>
            <Text style={[styles.headerText, { flex: 2 }]}>Amount</Text>
            <Text style={[styles.headerText, { flex: 2 }]}>Method</Text>
            <Text style={[styles.headerText, { flex: 2 }]}>Status</Text>
            <Text style={[styles.headerText, { flex: 3 }]}>Paid On</Text>
        </View>
    );

    const renderEnrollmentItem = ({ item }) => {
        const statusConfig = Status_Config[item.status?.toLowerCase()] || { color: "#8f8f8f", label: item.status };
        return (
            <Pressable onPress={() => handleRowPress(item)} style={({ hovered }) => [styles.row, styles.tableRow, hovered && { backgroundColor: '#f9f9f9' }, selectedUserEnrollment?.id === item.id && { backgroundColor: '#fff8e1' }]}>
                <View style={[{ flex: 3 }, styles.userInfo, styles.row]}>
                    {item.profileImage ? <Image source={{ uri: item.profileImage }} style={styles.avatar} /> : <View style={styles.pfpPlaceholder}><Text style={styles.pfpInitials}>{item.fullName ? item.fullName[0].toUpperCase() : '?'}</Text></View>}
                    <Text>{item.fullName}</Text>
                </View>
                <Text style={{ flex: 2 }}>{item.course_id}</Text>
                <Text style={{ flex: 4 }}>{item.courseName}</Text>
                <Text style={{ flex: 2 }}>{formatDate(item.enrolled_at)}</Text>
                <View style={[styles.row, styles.badge, { flex: 2 }]}>
                    <Circle size={8} stroke={statusConfig.color} fill={statusConfig.color} />
                    <Text style={[styles.badgeText, { color: statusConfig.color }]}>{statusConfig.label || formatted(item.status)}</Text>
                </View>
                <Text style={{ flex: 2 }}>{item.expiry_date || "N/A"}</Text>
            </Pressable>
        )
    };

    const renderSubmissionsItem = ({ item }) => {
        const statusConfig = Status_Config[item.status?.toLowerCase()] || { color: "#8f8f8f", label: item.status };
        return (
           
                 <Pressable onPress={async () => {
                        setAuditModalVisible(true);
                        await fetchEnrollmentAudit(item.id);
                    }} style={({ hovered }) => [styles.row, styles.tableRow, hovered && { backgroundColor: '#f9f9f9' }, selectedUserEnrollment?.id === item.id && { backgroundColor: '#fff8e1' }]}>
                    <View style={[{ flex: 3 }, styles.userInfo, styles.row]}>
                        {item.profileImage ? <Image source={{ uri: item.profileImage }} style={styles.avatar} /> : <View style={styles.pfpPlaceholder}><Text style={styles.pfpInitials}>{item.user_fullname ? item.user_fullname[0].toUpperCase() : '?'}</Text></View>}
                        <Text>{item.user_fullname}</Text>
                    </View>
                    <Text style={{ flex: 2 }}>{item.course_id}</Text>
                    <Text style={{ flex: 4 }}>{item.course_details?.title}</Text>
                    <View style={[styles.row, styles.badge, { flex: 2 }]}>
                        <Circle size={8} stroke={statusConfig.color} fill={statusConfig.color} />
                        <Text style={[styles.badgeText, { color: statusConfig.color }]}>{statusConfig.label || item.status}</Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                        <Image 
                            source={item.course_details?.badge_img_url ? { uri: item.course_details.badge_img_url } : require('../../assets/course_badge.png')} 
                            style={styles.avatar} 
                        />
                    </View>
                    <Text style={{ flex: 2 }}>{formatDate(item.completed_at) || "N/A"}</Text>
                    <Text style={{ flex: 2 }}>{item.badge_expiry_on ? formatDate(item.badge_expiry_on) : 'N/A'}</Text>
            </Pressable>
        );
    };

    const renderPaymentItem = ({ item }) => (
        <View style={[styles.row, styles.tableRow]}>
            <View style={[{ flex: 3 }, styles.userInfo, styles.row]}>
                <Text>{item.fullName}</Text>
            </View>

            <Text style={{ flex: 2 }}>RM {item.amount}</Text>
            <Text style={{ flex: 2 }}>{item.method}</Text>
            <Text style={{ flex: 2 }}>{item.status}</Text>
            <Text style={{ flex: 3 }}>{formatDate(item.paid_at)}</Text>
        </View>
    );

    const renderPagination = () => {
        const pageNumbers = [];
        for (let i = 1; i <= activeTotalPages; i++) {
            pageNumbers.push(i);
        }
        return (
            <View style={[styles.paginationContainer, styles.row]}>
                <Text style={styles.pageInfo}>
                    Showing {displayData.length > 0 ? indexOfFirstItem + 1 : 0} to {indexOfLastItem} of {activeTotalElements} records
                </Text>
                <View style={styles.row}>
                    <Pressable disabled={activeCurrentPage === 1} onPress={() => setActivePage(1)} style={[styles.pageBtn, activeCurrentPage === 1 && styles.btnDisabled]}>
                        <Text style={styles.arrowBtn}><ChevronsLeft size={18} color={activeCurrentPage === 1 ? "#bbb" : "#ecaa25"} /></Text>
                    </Pressable>
                    <Pressable disabled={activeCurrentPage === 1} onPress={() => setActivePage(prev => prev - 1)} style={[styles.pageBtn, activeCurrentPage === 1 && styles.btnDisabled]}>
                        <Text style={styles.arrowBtn}><ChevronLeft size={18} color={activeCurrentPage === 1 ? "#bbb" : "#ecaa25"} /></Text>
                    </Pressable>
                    {pageNumbers.map((number) => (
                        <Pressable key={number} onPress={() => setActivePage(number)} style={[styles.pageBtn, activeCurrentPage === number && styles.activePageBtn]}>
                            <Text style={[styles.pageBtnText, activeCurrentPage === number && { color: 'white' }]}>{number}</Text>
                        </Pressable>
                    ))}
                    <Pressable disabled={activeCurrentPage === activeTotalPages} onPress={() => setActivePage(prev => prev + 1)} style={[styles.pageBtn, activeCurrentPage === activeTotalPages && styles.btnDisabled]}>
                        <Text style={styles.arrowBtn}><ChevronRight size={18} color={activeCurrentPage === activeTotalPages ? "#bbb" : "#ecaa25"} /></Text>
                    </Pressable>
                    <Pressable disabled={activeCurrentPage === activeTotalPages} onPress={() => setActivePage(activeTotalPages)} style={[styles.pageBtn, activeCurrentPage === activeTotalPages && styles.btnDisabled]}>
                        <Text style={styles.arrowBtn}><ChevronsRight size={18} color={activeCurrentPage === activeTotalPages ? "#bbb" : "#ecaa25"} /></Text>
                    </Pressable>
                </View>
            </View>
        );
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Enrollment Management</Text>
            <SlidingTabs 
                tabs={tabs} 
                activeTab={activeTab} 
                onTabChange={(id) => { 
                    setActiveTab(id);  
                    if (id === 'enrollment') {
                        setCurrentPage(1);
                    } else if (id === 'submission') {
                        setSubmissionCurrentPage(1);
                    } else {
                        setPaymentCurrentPage(1);
                    }
                }} />

            <View style={[styles.toolbar, styles.row]}>
                <View style={styles.row}>
                    <Pressable onPress={resetSort} style={styles.iconBtn}><RotateCcw size={20} /></Pressable>
                    <View style={[styles.search, styles.row]}>
                        <Search size={18} color="#8f8f8f" />
                        <TextInput style={styles.input} placeholder='Search...' value={searchQuery} onChangeText={(text) => { setSearchQuery(text); setActivePage(1); }} />
                    </View>
                    <View style={styles.dropdownWrapper}>
                        <Pressable style={styles.pillTrigger} onPress={() => setIsOpen(!isOpen)}>
                            <Text style={styles.pillText}>{currentStatus === 'All' ? 'Status' : formatted(currentStatus)}</Text>
                            {isOpen ? <ChevronUp size={16} color="#4b5563" /> : <ChevronDown size={16} color="#4b5563" />}
                        </Pressable>
                        {isOpen && (
                            <View style={styles.dropdownMenu}>
                                {(isPayment ? paymentStatusOptions : enrollmentStatusOptions).map((status) => (
                                    <Pressable 
                                    key={status} 
                                    style={[styles.menuItem, currentStatus === status && styles.menuItemActive]} 
                                    onPress={() => { 
                                        if (isPayment) {
                                            setPaymentStatus(status);
                                        } else if (isSubmission) {
                                            setSubmissionStatus(status);
                                        } else {
                                            setCurrentStatus(status);
                                        }
                                        setActivePage(1); 
                                        setIsOpen(false); 
                                        }}>
                                        <Text style={[currentStatus === status && styles.menuItemTextActive]}>{formatted(status)}</Text>
                                    </Pressable>
                                ))}
                            </View>
                        )}
                    </View>
                </View>
            </View>

            <View style={styles.tableContainer}>
                <FlatList
                    style={styles.table}
                    data={displayData}
                    loading={loading}
                    ListHeaderComponent={
                        isEnrollment
                            ? renderEnrollmentHeader
                            : isSubmission
                            ? renderSubmissionsHeader
                            : renderPaymentHeader
                    }
                    renderItem={
                        isEnrollment
                            ? renderEnrollmentItem
                            : isSubmission
                            ? renderSubmissionsItem
                            : renderPaymentItem
                    }
                    keyExtractor={item => item.id.toString()}
                    ListEmptyComponent={<View style={styles.tableRow}><Text>{loading ? "Loading..." : "No Record Found."}</Text></View>}
                />
            </View>

            {activeTotalPages > 1 && renderPagination()}

            <EnrollmentDetailModal
                visible={detailModalVisible}
                onClose={() => { setDetailModalVisible(false); setSelectedUserEnrollment(null); }}
                data={selectedUserEnrollment}
                userEnrollments={selectedUserHistory}
                allCourses={courses}
                onApprove={async (id) => {
                    const res = await handleUpdateStatus(id, "in_progress");
                    if (res.success) setDetailModalVisible(false);
                }}
                // Rejected
                onUnenroll={async (id) => {
                    const res = await handleUpdateStatus(id, "dropped");
                    if (res.success) setDetailModalVisible(false);
                }}
                onDelete={async (id) => {
                    if (window.confirm("Delete this record permanently?")) {
                        const res = await deleteRecord(id);
                        if (res.success) setDetailModalVisible(false);
                    }
                }}
            />
            
            <Modal animationType="fade" transparent visible={auditModalVisible} onRequestClose={() => setAuditModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.auditModalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {auditLoading ? "Syncing..." : `Audit: ${auditData?.course?.title}`}
                            </Text>
                            <Pressable onPress={() => setAuditModalVisible(false)}><Text style={styles.closeBtn}>✕</Text></Pressable>
                        </View>

                        <ScrollView>
                            {auditLoading ? <Text style={styles.loadingText}>Fetching database logs...</Text> : 
                             auditData?.course?.modules?.map((module, mIdx) => (
                                <View key={mIdx} style={styles.moduleCard}>
                                    <Text style={styles.moduleTitle}>Module: {module.title}</Text>
                                    {module.pages?.map((page) => {
                                        const earned = page.elements?.reduce((acc, el) => acc + (el.submissions?.length > 0 ? el.score : 0), 0) || 0;
                                        return (
                                            <View key={page.id} style={styles.pageAuditRow}>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.pageTitleText}>{page.title}</Text>
                                                    <Text style={styles.pageSubText}>{page.final_quiz ? 'Final Assessment' : 'Content Module'}</Text>
                                                </View>
                                                <ProgressRing earned={earned} total={page.passing_score} />
                                            </View>
                                        );
                                    })}
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingVertical:20,
        paddingHorizontal:40
    },
    toolbar:{
        justifyContent:'space-between',
        marginVertical:20,
        zIndex:500
    },
    table:{
        flexShrink:1,
    },
    title:{
        fontSize:25,
        fontWeight:500,
        marginBottom:5
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
        width: 35,
        height: 35,
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
    pfpInitials:{
        fontSize: 12,
        fontWeight: '700',
        color: 'white',
    },
    tableContainer:{
        flex:1
    },
    modalOverlay: { 
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.6)', 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    auditModalContent: { 
        width: '70%', 
        maxHeight: '95%', 
        backgroundColor: '#fff', 
        borderRadius: 20, 
        padding: 25 
    },
    modalHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        marginBottom: 20, 
        borderBottomWidth: 1, 
        borderBottomColor: '#eee', 
        paddingBottom: 15 
    },
    modalTitle: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        color: '#0a6340' 
    },
    closeBtn: { 
        fontSize: 20, 
        color: '#999' 
    },
    moduleCard: { 
        marginBottom: 20, 
        padding: 15, 
        backgroundColor: '#fdfdfd', 
        borderRadius: 10, 
        borderWidth: 1, 
        borderColor: '#eee' 
    },
    moduleTitle: { 
        fontSize: 16, 
        fontWeight: 'bold', 
        color: '#333', 
        marginBottom: 15 
    },
    pageAuditRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingVertical: 10, 
        borderBottomWidth: 1, 
        borderBottomColor: '#f0f0f0' 
    },
    pageTitleText: { 
        fontSize: 14, 
        fontWeight: '600', 
        color: '#444' 
    },
    pageSubText: { 
        fontSize: 11, 
        color: '#999' 
    },
    
    progressRing: { 
        width: 42, 
        height: 42, 
        borderRadius: 21, 
        justifyContent: 'center', 
        alignItems: 'center', 
        borderWidth: 2 
    },
    ringIncomplete: { 
        borderColor: '#ddd', 
        borderStyle: 'dashed', 
        backgroundColor: '#fafafa' 
    },
    progressText: { 
        fontSize: 10, 
        fontWeight: 'bold', 
        color: '#999' 
    },
    loadingText: { 
        textAlign: 'center',
        padding: 40, 
        color: '#666' 
    }
});
export default EnrollmentManagement;

//  delete means dropped, and delete is fully delete and approved 
// Submission: sortconfig, status