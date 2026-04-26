import { View, Text, TextInput, Pressable } from 'react-native';
import { X, Eye, EyeOff } from 'lucide-react-native';
import { ModalStyle as styles } from './ModalStyle';

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
    return (
        <View style={styles.container}>

            {/* HEADER */}
            <View style={[styles.header, styles.row]}>
                <Text style={styles.title}>Change Password</Text>
                <Pressable onPress={onClose}>
                    <X />
                </Pressable>
            </View>

            {/* CURRENT PASSWORD */}
            <Text style={styles.label}>Current Password</Text>
            <View style={styles.row}>
                <TextInput
                    style={styles.input}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry={!showCurrentPassword}
                />
                <Pressable onPress={() => setShowCurrentPassword(prev => !prev)}>
                    {showCurrentPassword ? <EyeOff/> : <Eye/>}
                </Pressable>
            </View>

            {/* NEW PASSWORD */}
            <Text style={styles.label}>New Password</Text>
            <View style={styles.row}>
                <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showNewPassword}
                />
                <Pressable onPress={() => setShowNewPassword(prev => !prev)}>
                    {showNewPassword ? <EyeOff/> : <Eye/>}
                </Pressable>
            </View>

            {/* ACTION BUTTON */}
            <Pressable style={styles.Btn}>
                <Text>Confirm</Text>
            </Pressable>
        </View>
    );
};

export default ChangePasswordContent;