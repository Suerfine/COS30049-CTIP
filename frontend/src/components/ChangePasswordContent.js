import {useState} from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert} from 'react-native';
import { X, Eye, EyeOff } from 'lucide-react-native';
import { ModalStyle as styles } from './ModalStyle';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { isValidPassword } from '../utils/Validation';

const ChangePasswordContent = ({
    currentPassword,
    setCurrentPassword,
    password,
    setPassword,
    showCurrentPassword,
    setShowCurrentPassword,
    showNewPassword,
    setShowNewPassword,
    onClose,
    onSave,
}) => {
    const {t, i18n}=useTranslation();
    const navigation = useNavigation();
    const [errors, setErrors] = useState({});

    const clearError = (field) => {
        setErrors(prev => {
            const updated = { ...prev };
            delete updated[field];
            return updated;
        });
    };

    const handleConfirm = async () => {
        let tempErrors = {};

        if (!currentPassword.trim()) {
            tempErrors.currentPassword = t('please enter your current password.');
        }

        if (!password.trim()) {
            tempErrors.password = t('please enter a new password.');
        } else if (!isValidPassword(password)) {
            tempErrors.password = t('password must be at least 6 characters and contain letters, numbers and symbols.');
        }

        if (currentPassword && password && currentPassword === password) {
            tempErrors.password = t('new password must be different from current password.');
        }

        setErrors(tempErrors);
        if (Object.keys(tempErrors).length > 0) return;

        // call onSave and wait for server-side error (e.g. wrong current password)
        const result = await onSave?.(currentPassword, password);
            if (result?.error) {
                const { status, message } = result.error;

            let serverErrorMsg;

            if (status === 400) {
                serverErrorMsg = t('current password is incorrect.');
            }
            else {
                serverErrorMsg = t('failed to change password.');
            }
            setErrors(prev => ({
                ...prev,
                currentPassword: serverErrorMsg
            }));
        }
    };

    const handleForgotPassword = () => {
        onClose();
        navigation.navigate('ForgotPassword');
    };


    return (
        <View style={styles.container}>

            {/* HEADER */}
            <View style={[styles.header, styles.row]}>
                <Text style={styles.title}>{t("change")} {t("password")}</Text>
                <Pressable onPress={onClose}>
                    <X />
                </Pressable>
            </View>

            {/* CURRENT PASSWORD */}
            <Text style={styles.label}>{t("current password")}</Text>
            <View style={styles.row}>
                <TextInput
                    style={styles.input}
                    value={currentPassword}
                    onChangeText={(text) => {
                        setCurrentPassword(text);
                        clearError("currentPassword");
                    }}
                    secureTextEntry={!showCurrentPassword}
                    placeholder={t('enter current password')}
                    placeholderTextColor={'grey'}
                />
                <Pressable onPress={() => setShowCurrentPassword(prev => !prev)}>
                    {showCurrentPassword ? <Eye/> : <EyeOff/>}
                </Pressable>
            </View>
            {errors.currentPassword && (
                <Text style={localStyles.errorText}>{errors.currentPassword}</Text>
            )}

            {/* NEW PASSWORD */}
            <Text style={styles.label}>{t("new password")}</Text>
            <View style={styles.row}>
                <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={(text) => {
                        setPassword(text);
                        clearError("password");
                    }}
                    secureTextEntry={!showNewPassword}
                    placeholder={t('min 6 chars, letters and numbers')}
                    placeholderTextColor={'grey'}
                />
                <Pressable onPress={() => setShowNewPassword(prev => !prev)}>
                    {showNewPassword ? <Eye/> : <EyeOff/>}
                </Pressable>
            </View>
            {errors.password && (
                <Text style={localStyles.errorText}>{errors.password}</Text>
            )}

            {/* FORGOT PASSWORD LINK */}
            <Pressable onPress={handleForgotPassword} style={localStyles.forgotRow}>
                <Text style={localStyles.forgotText}>{t('forgot password?')}</Text>
            </Pressable>

            {/* ACTION BUTTON */}
            <Pressable style={styles.Btn} onPress={handleConfirm}>
                <Text>{t("confirm")}</Text>
            </Pressable>
        </View>
    );
};

const localStyles = StyleSheet.create({
    forgotRow: {
        marginTop: 10,
        alignItems: 'flex-start'
    },
    forgotText: {
        color: '#2f6618fe',
        fontWeight: 'bold'
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        marginBottom: 12,
    }
});


export default ChangePasswordContent;