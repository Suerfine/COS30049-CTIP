import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { ModalStyle as styles } from './ModalStyle';
import * as ImagePicker from "expo-image-picker";

const ChangePfpContent = ({ image, onPickImage, onClose }) => {
    return (
        <View style={styles.container}>
            <View style={[styles.row, styles.header]}>
                <Text style={styles.title}>Upload Profile Picture</Text>

                <Pressable onPress={onClose}>
                    <X size={20} />
                </Pressable>
            </View>

            {/* Preview image */}
            <View style={styles.imagePicker}>
                {image ? (
                    <Image
                        source={{ uri: image }}
                        style={styles.previewImage}
                        resizeMode="contain"
                    />
                ) : (
                    <View style={styles.uploadPlaceholder}>
                        <Image
                            source={require('../../assets/upload_placeholder.png')}
                            style={[styles.placeholder, { width: 60, height: 60 }]}
                        />
                        <Text style={styles.muted}>No image selected</Text>
                    </View>
                )}
            </View>

            {/* Trigger image picker */}
            <Pressable 
                style={({ hovered }) => [
                    localStyles.Btn, hovered && localStyles.hoverBtn
                ]} onPress={onPickImage}>
                <Text>Choose image</Text>
            </Pressable>

        </View>
    );
};

const localStyles=StyleSheet.create({
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