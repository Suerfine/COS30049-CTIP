import React from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { X } from 'lucide-react-native';
import ModalLayout from './ModalLayout';

const RejectModal = ({ visible, onClose, onConfirm, reason, setReason, loading }) => {
    return (
        <ModalLayout visible={visible} onClose={onClose}>
            <View style={styles.modalContainer}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Reject Registration</Text>
                    <Pressable onPress={onClose} style={styles.closeIcon}>
                        <X size={20} color="#666" />
                    </Pressable>
                </View>

                {/* Modal Body */}
                <View style={styles.modalBody}>
                    <Text style={styles.modalLabel}>Reason for Rejection</Text>
                    <TextInput
                        style={styles.modalTextArea}
                        multiline
                        numberOfLines={4}
                        placeholder="Provide a reason for the park guide..."
                        value={reason}
                        onChangeText={setReason}
                        placeholderTextColor="#9ca3af"
                    />
                    <Text style={styles.modalHint}>
                        This message will be sent to the applicant to explain the decision.
                    </Text>
                </View>

                {/* Modal Footer */}
                <View style={styles.modalFooter}>
                    <Pressable 
                        style={styles.cancelBtn} 
                        onPress={onClose}
                        disabled={loading}
                    >
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                    </Pressable>
                    
                    <Pressable 
                        style={[
                            styles.confirmRejectBtn, 
                            (!reason.trim() || loading) && styles.disabledBtn
                        ]} 
                        onPress={onConfirm}
                        disabled={!reason.trim() || loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <Text style={styles.confirmRejectBtnText}>Confirm Rejection</Text>
                        )}
                    </Pressable>
                </View>
            </View>
        </ModalLayout>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        paddingBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    closeIcon: {
        padding: 4,
    },
    modalBody: {
        paddingVertical: 20,
    },
    modalLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        color: '#374151',
    },
    modalTextArea: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        height: 120,
        textAlignVertical: 'top',
        fontSize: 14,
        color: '#1f2937',
        // For web focus outline removal
        outlineStyle: 'none',
    },
    modalHint: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 8,
        lineHeight: 18,
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 8,
    },
    cancelBtn: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        justifyContent: 'center',
    },
    cancelBtnText: {
        color: '#4b5563',
        fontWeight: '600',
        fontSize: 14,
    },
    confirmRejectBtn: {
        backgroundColor: '#dc2626',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        justifyContent: 'center',
        minWidth: 140,
    },
    disabledBtn: {
        opacity: 0.5,
    },
    confirmRejectBtnText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 14,
        textAlign: 'center',
    },
});

export default RejectModal;