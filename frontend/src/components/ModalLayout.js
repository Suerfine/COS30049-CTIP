import React from "react";
import {Modal, View, StyleSheet} from 'react-native';
import {X} from 'lucide-react-native';

const ModalLayout=({visible, onClose, children})=>{
    return(
        <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {children}
                </View>
            </View>
        </Modal>
    )
};

const styles=StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContent: {
        width: '100%',
        maxWidth: 800,
        maxHeight: '90%', 
        display: 'flex',
        backgroundColor: 'white',
        borderRadius: 20,
        overflow: 'hidden'
    }
});

export default ModalLayout;