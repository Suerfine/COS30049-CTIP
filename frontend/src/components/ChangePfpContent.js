import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';

const ChangePfpContent = ({ image, onPickImage }) => {
    return (
        <View style={styles.container}>
            
            <Text style={styles.label}>Upload Profile Picture</Text>

            <Pressable style={styles.imagePicker} onPress={onPickImage}>
                {image ? (
                    <Image source={{ uri: image }} style={styles.previewImage} />
                ) : (
                    <View style={styles.uploadPlaceholder}>
                        <Image
                            source={require('../../assets/upload_placeholder.png')}
                            style={styles.placeholder}
                            accessibilityLabel="Upload Placeholder Image"
                        />
                        <Text style={styles.muted}>Select your image</Text>
                    </View>
                )}
            </Pressable>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        gap: 10,
    },

    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
    },

    imagePicker: {
        width: '100%',
        height: 180,
        borderWidth: 1,
        borderColor: '#2f6618fe',
        borderRadius: 12,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },

    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },

    uploadPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },

    placeholder: {
        width: 70,
        height: 70,
        borderRadius: 10,
        resizeMode: 'contain',
    },

    muted: {
        color: '#888',
        fontSize: 13,
    },
});

export default ChangePfpContent;