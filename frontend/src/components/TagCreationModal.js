import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    StyleSheet, 
    Pressable, 
    Modal, 
    ActivityIndicator, 
    Platform,
    ScrollView
} from 'react-native';
import { Tag, X } from 'lucide-react-native';

const TagCreationModal = ({ visible, onCancel, onSave, isLoading }) => {
    const [tagForm, setTagForm] = useState({ title: '', type: 'category' });

    useEffect(() => {
        if (visible) {
            setTagForm({ title: '', type: 'category' });
        }
    }, [visible]);

    const handleClose = () => {
        setTagForm({ title: '', type: 'category' });
        onCancel();
    };

    return (
        <Modal 
            visible={visible} 
            transparent 
            animationType="fade" 
            onRequestClose={handleClose}
        >
            <View style={styles.modalOverlay}>
                <ScrollView
                    style={styles.modalScroll}
                    contentContainerStyle={styles.modalScrollContent}
                    showsVerticalScrollIndicator={false}
                >
                <View style={styles.tagModalContent}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <View style={styles.titleRow}>
                            <Tag size={20} color="#0a6340" style={{ marginRight: 8 }} />
                            <Text style={styles.modalTitle}>Create New Tag</Text>
                        </View>
                        <Pressable onPress={handleClose}>
                            <X size={24} color="#666" />
                        </Pressable>
                    </View>
                    
                    {/* Input Field */}
                    <Text style={styles.label}>Tag Name:</Text>
                    <TextInput 
                        style={styles.input} 
                        value={tagForm.title}
                        onChangeText={(text) => setTagForm({...tagForm, title: text})}
                        placeholder="e.g., Sarawak or Hardware"
                        placeholderTextColor="#999"
                    />

                    {/* Type Selection */}
                    <Text style={styles.label}>Tag Type:</Text>
                    <View style={styles.typeRow}>
                        {['category', 'location'].map((type) => (
                            <Pressable 
                                key={type}
                                style={[
                                    styles.typeBtn, 
                                    tagForm.type === type && styles.typeBtnActive
                                ]}
                                onPress={() => setTagForm({...tagForm, type})}
                            >
                                <Text style={[
                                    styles.typeBtnText, 
                                    tagForm.type === type && styles.activeTypeText
                                ]}>
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.buttonRow}>
                        <Pressable 
                            style={styles.cancelBtn} 
                            onPress={handleClose}
                            disabled={isLoading}
                        >
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </Pressable>
                        <Pressable 
                            style={[
                                styles.saveBtn, 
                                (!tagForm.title || isLoading) && styles.saveBtnDisabled
                            ]} 
                            onPress={() => onSave(tagForm)}
                            disabled={isLoading || !tagForm.title}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <Text style={styles.saveBtnText}>Create Tag</Text>
                            )}
                        </Pressable>
                    </View>
                </View>
                </ScrollView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalScroll: {
        width: '100%',
    },
    modalScrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tagModalContent: {
        width: '100%',
        maxWidth: 400,
        maxHeight: '90%',
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
            },
            android: {
                elevation: 8,
            },
            web: {
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }
        }),
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    input: {
        width: '100%',
        height: 48,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 16,
        color: '#333',
        marginBottom: 20,
        backgroundColor: '#f9f9f9',
    },
    typeRow: {
        flexDirection: 'row',
        gap: 12,
        flexWrap: 'wrap',
        marginBottom: 24,
    },
    typeBtn: {
        flex: 1,
        height: 40,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    typeBtnActive: {
        borderColor: '#0a6340',
        backgroundColor: '#f0fdf4',
    },
    typeBtnText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    activeTypeText: {
        color: '#0a6340',
        fontWeight: '700',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        flexWrap: 'wrap',
        marginTop: 8,
    },
    cancelBtn: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    cancelBtnText: {
        color: '#666',
        fontWeight: '600',
    },
    saveBtn: {
        backgroundColor: '#0a6340',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        minWidth: 120,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtnDisabled: {
        backgroundColor: '#ccc',
    },
    saveBtnText: {
        color: 'white',
        fontWeight: '700',
    },
});

export default TagCreationModal;
