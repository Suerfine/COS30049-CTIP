import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { ModalStyle as styles } from './ModalStyle';
import { useUserProfile } from '../hooks/useUserProfile';

const ChangePfpContent = ({ image, onPickImage, onSave, onClose, loading }) => {
    return (
        <View style={styles.container, localStyles.padding}>
            <View style={[styles.row, styles.header, localStyles.fullWidthHeader]}>
                <Text style={styles.title}>Upload Profile Picture</Text>

                <View styles={localStyles.Xbutton}>
                <Pressable onPress={onClose}>
                    <X size={20} />
                </Pressable>
                </View>
            </View>

            {/* Preview image */}
            <View style={styles.imagePicker}>
                {image ? (
                    <Image
                        source={{ uri: image?.uri ?? image }}
                        style={styles.previewImage}
                        resizeMode="contain"
                    />
                ) : (
                    <View style={styles.uploadPlaceholder, localStyles.placeholder}>
                        <Image
                            source={require('../../assets/upload_placeholder.png')}
                            style={[styles.placeholder, { width: 60, height: 60 }]}
                        />
                        <Text style={styles.muted}>No image selected</Text>
                    </View>
                )}
            </View>
            
            <View styles={localStyles.buttonRow}>
                {/* Trigger image picker */}
                <Pressable 
                    style={({ hovered }) => [
                        localStyles.Btn, hovered && localStyles.hoverBtn
                    ]} onPress={onPickImage}>
                    <Text>Choose image</Text>
                </Pressable>
                
                {/* save button only when user picked image */}
                {!!image && (
                    <Pressable
                        style={({ hovered }) => [
                            localStyles.Btn,
                            { backgroundColor: '#2f6618', marginTop: 8 },
                            hovered && { backgroundColor: '#1e4a10' },
                            loading && { opacity: 0.6 },
                        ]}
                        onPress={onSave}
                        disabled={loading}
                    >
                        <Text style={{ color: 'white' }}>
                            {loading ? 'Saving...' : 'Save'}
                        </Text>
                    </Pressable>
                )}
            </View>
        </View>
    );
};

const localStyles=StyleSheet.create({
    padding:{
        padding: 20,
    },
    fullWidthHeader:{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    placeholder:{
        alignItems: 'center'
    },
    buttonRow:{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        gap: 12,
    },
    Btn: {
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#ffc95c',
        borderRadius: 8,
    },
    hoverBtn:{
        backgroundColor: '#efab21',
    },
});

export default ChangePfpContent;