import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { X, Trash2 } from 'lucide-react-native';
import ModalLayout from './ModalLayout'; 

const EnrollmentDetailModal = ({ visible, onClose, data, onApprove, onUnenroll, onDelete }) => {
    if (!data) return null;

    const guideCourses = [
        { id: 101, title: 'Basic Electronics', status: 'completed', date: '2025-12-10' },
        { id: 102, title: 'Wildlife First Aid', status: 'approved', date: '2026-01-15' },
        { id: 103, title: 'Introduction to IoT', status: 'in_progress', date: '2026-03-01' },
    ];

    return (
        <ModalLayout visible={visible} onClose={onClose}>
            <View style={modalStyles.container}>
                
                {/* Header Section: User Profile & ID */}
                <View style={modalStyles.header}>
                    <View style={modalStyles.userInfo}>
                        <View style={modalStyles.pfpPlaceholder}>
                            <Text style={modalStyles.pfpInitials}>
                                {data.fullName ? data.fullName[0].toUpperCase() : '?'}
                            </Text>
                        </View>
                        <View>
                            <Text style={modalStyles.userName}>{data.fullName}</Text>
                            <Text style={modalStyles.userSubtitle}>Park Guide Enrollment ID: #{data.id}</Text>
                        </View>
                    </View>
                    <Pressable onPress={onClose} style={modalStyles.closeBtn}>
                        <X color="#666" size={24} />
                    </Pressable>
                </View>

                {/* Course List Section: Prerequisites & Progress */}
                <Text style={modalStyles.sectionTitle}>Course Progress & Prerequisites</Text>
                <ScrollView style={modalStyles.scrollArea} showsVerticalScrollIndicator={false}>
                    {guideCourses.map((course) => (
                        <View key={course.id} style={modalStyles.courseCard}>
                            <View style={modalStyles.courseInfo}>
                                <Text style={modalStyles.courseTitle}>{course.title}</Text>
                                <Text style={modalStyles.courseDate}>Started: {course.date}</Text>
                            </View>
                            
                            {/* Status Badge with dynamic styling */}
                            <View style={[
                                modalStyles.statusBadge, 
                                { backgroundColor: course.status === 'completed' || course.status === 'approved' ? '#e8f5e9' : '#fff3e0' }
                            ]}>
                                <Text style={[
                                    modalStyles.statusText,
                                    { color: course.status === 'completed' || course.status === 'approved' ? '#2e7d32' : '#ef6c00' }
                                ]}>
                                    {course.status.replace('_', ' ').toUpperCase()}
                                </Text>
                            </View>
                        </View>
                    ))}
                </ScrollView>

                {/* Action Buttons: Administrative Controls */}
                <View style={modalStyles.footer}>
                    <Pressable 
                        style={[modalStyles.actionBtn, modalStyles.iconDeleteBtn]}
                        onPress={()=>onDelete(data.id)}
                    >
                        <Trash2 size={20} color="#dc2626" />
                    </Pressable>
                    <View style={modalStyles.row}>
                        <Pressable 
                            style={[modalStyles.actionBtn, modalStyles.outlineBtn]}
                            onPress={()=>onUnenroll(data.id)}

                        >
                            <Text style={modalStyles.outlineBtnText}>Unenroll</Text>
                        </Pressable>

                        <Pressable 
                            style={[modalStyles.actionBtn, modalStyles.solidApproveBtn]}
                            onPress={()=>onApprove(data.id)}
                        >
                            <Text style={modalStyles.solidBtnText}>Approve</Text>
                        </Pressable>
                        </View>
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
        minWidth: 85,
        alignItems: 'center',
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 32,
        alignItems: 'center',
        justifyContent:'space-between'
    },
    actionBtn: {
        height: 48,
        borderRadius: 6,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        width:170
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
        width:170
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
    row:{
        flexDirection:'row',
        gap:20
    }
});

export default EnrollmentDetailModal;