import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { X, Trash2, AlertCircle, CheckCircle2, Clock, Ban } from 'lucide-react-native';
import ModalLayout from './ModalLayout'; 
import { formatDate } from '../utils/formatDate';

const EnrollmentDetailModal = ({ 
    visible, 
    onClose, 
    data,
    userEnrollments = [], 
    allCourses=[],
    onApprove, 
    onUnenroll, 
    onDelete,
    status,
}) => {
    if (!data) return null;

    const requiredPrereqs = data.course?.prerequisite_groups?.[0]?.prerequisites || [];

    const processedPrereqs = requiredPrereqs.map(prereq => {
        const matchingEnrollment = userEnrollments.find(
            e => Number(e.course_id) === Number(prereq.course_id)
        );

        const courseInfo = allCourses.find(
            c => Number(c.id) === Number(prereq.course_id)
        );
        
        return {
            id: prereq.course_id,
            title: courseInfo?.title || prereq.course_title || `Course #${prereq.course_id}`,
            status: matchingEnrollment ? matchingEnrollment.status : 'not_started',
            date: matchingEnrollment ? matchingEnrollment.enrolled_at : 'N/A'
        };
    });

    const getStatusStyles = (status) => {
        switch (status) {
            case 'completed':
            case 'approved':
                return { bg: '#e8f5e9', text: '#2e7d32', icon: <CheckCircle2 size={12} color="#2e7d32" /> };
            case 'in_progress':
            case 'in_review':
                return { bg: '#fff3e0', text: '#ef6c00', icon: <Clock size={12} color="#ef6c00" /> };
            case 'failed':
            case 'dropped':
                return { bg: '#fef2f2', text: '#dc2626', icon: <Ban size={12} color="#dc2626" /> };
            default:
                return { bg: '#f3f4f6', text: '#666', icon: <AlertCircle size={12} color="#666" /> };
        }
    };

    return (
        <ModalLayout visible={visible} onClose={onClose}>
            <View style={modalStyles.container}>
                
                <View style={modalStyles.header}>
                    <View style={modalStyles.userInfo}>
                        <View style={modalStyles.pfpPlaceholder}>
                            <Text style={modalStyles.pfpInitials}>
                                {data.fullName ? data.fullName[0].toUpperCase() : '?'}
                            </Text>
                        </View>
                        <View>
                            <Text style={modalStyles.userName}>{data.fullName}</Text>
                            <Text style={modalStyles.userSubtitle}>
                                Enrollment ID: #{data.id} | {data.courseName}
                            </Text>
                        </View>
                    </View>
                    <Pressable onPress={onClose} style={modalStyles.closeBtn}>
                        <X color="#666" size={24} />
                    </Pressable>
                </View>

                <Text style={modalStyles.sectionTitle}>Prerequisite Verification</Text>
                <ScrollView style={modalStyles.scrollArea} showsVerticalScrollIndicator={false}>
                    {processedPrereqs.length > 0 ? (
                        processedPrereqs.map((course) => {
                            const styles = getStatusStyles(course.status);
                            return (
                                <View key={course.id} style={modalStyles.courseCard}>
                                    <View style={modalStyles.courseInfo}>
                                        <Text style={modalStyles.courseTitle}>{course.title}</Text>
                                        <Text style={modalStyles.courseDate}>
                                            {course.date ? `Enrolled: ${formatDate(course.date)}` : 'Not yet enrolled'}
                                        </Text>
                                    </View>
                                    
                                    <View style={[modalStyles.statusBadge, { backgroundColor: styles.bg }]}>
                                        {styles.icon}
                                        <Text style={[modalStyles.statusText, { color: styles.text, marginLeft: 4 }]}>
                                            {course.status.replace('_', ' ').toUpperCase()}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })
                    ) : (
                        <View style={modalStyles.emptyState}>
                            <CheckCircle2 size={20} color="#059669" />
                            <Text style={modalStyles.emptyText}>No prerequisites required for this course.</Text>
                        </View>
                    )}
                </ScrollView>

                <View style={modalStyles.footer}>
                    <Pressable 
                        style={[modalStyles.actionBtn, modalStyles.iconDeleteBtn]}
                        onPress={() => onDelete(data.id)}
                    >
                        <Trash2 size={20} color="#dc2626" />
                    </Pressable>
                    {
                        status !== 'in_progress' && status !== 'pending_payment' && status !== 'in_review' && status !== 'failed' && (
                            <View style={modalStyles.row}>
                                <Pressable 
                                    style={[modalStyles.actionBtn, modalStyles.outlineBtn]}
                                    onPress={() => onUnenroll(data.id)}
                                >
                                    <Text style={modalStyles.outlineBtnText}>Reject</Text>
                                </Pressable>

                                <Pressable 
                                    style={[modalStyles.actionBtn, modalStyles.solidApproveBtn]}
                                    onPress={() => onApprove(data.id)}
                                >
                                    <Text style={modalStyles.solidBtnText}>Approve</Text>
                                </Pressable>
                            </View>
                        )
                    }
                    {status === 'in_review' && (
                        <Text style={modalStyles.announcement}>Waiting for admin to issue badge</Text>
                    )}
                    {status === 'pending_payment' && (
                        <Text style={modalStyles.announcement}>Waiting for admin to accepted payment</Text>
                    )}
                </View>
            </View>
        </ModalLayout>
    );
};

const modalStyles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 16,
    },
    userInfo: {
        flexDirection: 'row',
        gap: 16,
        alignItems: 'center',
    },
    pfpPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#217837',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pfpInitials: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    userName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111',
    },
    userSubtitle: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginVertical: 16,
        color: '#333',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    scrollArea: {
        maxHeight: 280,
    },
    courseCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#edf0f2',
    },
    courseInfo: {
        flex: 1,
    },
    courseTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#222',
    },
    courseDate: {
        fontSize: 11,
        color: '#888',
        marginTop: 4,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        minWidth: 100,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
    },
    emptyState: {
        padding: 20,
        alignItems: 'center',
        backgroundColor: '#f0fdf4',
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    emptyText: {
        color: '#065f46',
        fontSize: 13,
        fontWeight: '500',
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 32,
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    actionBtn: {
        height: 48,
        borderRadius: 6,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        width: 170
    },
    solidApproveBtn: {
        backgroundColor: '#059669',
    },
    solidBtnText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 14,
    },
    outlineBtn: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: '#e5e7eb',
        paddingHorizontal: 16,
        width: 170
    },
    outlineBtnText: {
        color: '#4b5563',
        fontWeight: '700',
        fontSize: 14,
    },
    iconDeleteBtn: {
        backgroundColor: '#fef2f2',
        width: 48,
        borderWidth: 1,
        borderColor: '#fee2e2',
    },
    row: {
        flexDirection: 'row',
        gap: 20
    },
    announcement:{
        backgroundColor: "#fff3cd",
        borderWidth: 1,
        borderColor: "#ffc107",
        paddingHorizontal:10,
        borderRadius:5,
        paddingVertical:5
    }
});

export default EnrollmentDetailModal;