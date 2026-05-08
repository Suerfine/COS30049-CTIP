import { View, Text, TextInput, Pressable } from 'react-native';
import { X, Eye, EyeOff } from 'lucide-react-native';
import { ModalStyle as styles } from './ModalStyle';
import { useTranslation } from 'react-i18next';

const ChangePasswordContent = ({
    currentPassword,
    setCurrentPassword,
    password,
    setPassword,
    showCurrentPassword,
    setShowCurrentPassword,
    showNewPassword,
    setShowNewPassword,
    onClose
}) => {
    const {t, i18n}=useTranslation();
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
                    onChangeText={setCurrentPassword}
                    secureTextEntry={!showCurrentPassword}
                />
                <Pressable onPress={() => setShowCurrentPassword(prev => !prev)}>
                    {showCurrentPassword ? <Eye/> : <EyeOff/>}
                </Pressable>
            </View>

            {/* NEW PASSWORD */}
            <Text style={styles.label}>{t("new password")}</Text>
            <View style={styles.row}>
                <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showNewPassword}
                />
                <Pressable onPress={() => setShowNewPassword(prev => !prev)}>
                    {showNewPassword ? <Eye/> : <EyeOff/>}
                </Pressable>
            </View>

            {/* ACTION BUTTON */}
            <Pressable style={styles.Btn}>
                <Text>{t("confirm")}</Text>
            </Pressable>
        </View>
    );
};

export default ChangePasswordContent;