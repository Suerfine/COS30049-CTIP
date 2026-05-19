import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Alert, Image, useWindowDimensions } from 'react-native';
import { Lock, Check, X, Eye, EyeOff, CheckCircle } from 'lucide-react-native';
import { authService } from '../services/authService';
import ModalLayout from '../components/ModalLayout';
import { useAuth } from '../context/AuthContext';

const ForceChangePassword = () => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 980;
    const { clearMustChangePassword } = useAuth();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const computePasswordStrength = (pwd) => {
        const hasLength = typeof pwd === 'string' && pwd.length >= 8;
        const hasUpperLower = /[a-z]/.test(pwd) && /[A-Z]/.test(pwd);
        const hasNumber = /[0-9]/.test(pwd);
        const hasSymbol = /[^A-Za-z0-9]/.test(pwd);

        let score = 0;
        if (hasLength) score += 1;
        if (hasUpperLower) score += 1;
        if (hasNumber) score += 1;
        if (hasSymbol) score += 1;

        let label = 'Weak';
        let color = '#e53935';
        if (score <= 1) { label = 'Weak'; color = '#e53935'; }
        else if (score === 2) { label = 'Medium'; color = '#f9a825'; }
        else if (score === 3) { label = 'Strong'; color = '#43a047'; }
        else if (score === 4) { label = 'Very Strong'; color = '#1b5e20'; }

        return { score, label, color, requirements: { hasLength, hasUpperLower, hasNumber, hasSymbol } };
    };

    const pwdStrength = computePasswordStrength(newPassword);

    const handleSubmit = async () => {
        if (!currentPassword) {
            setErrorMessage('Please enter your current (temporary) password.');
            return;
        }

        if (!newPassword || newPassword.length < 8) {
            setErrorMessage('New password must be at least 8 characters long.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMessage('Passwords do not match.');
            return;
        }

        try {
            setLoading(true);
            setErrorMessage('');
            await authService.changeFirstTimePassword(currentPassword, newPassword);
            setShowSuccessModal(true);
        } catch (error) {
            const msg = error?.message || 'Unable to change password. Please try again.';
            setErrorMessage(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <View style={[styles.shell, isDesktop ? styles.shellDesktop : styles.shellMobile]}>
                    {isDesktop && (
                        <View style={styles.heroPanel}>
                            <Image
                                source={require('../../assets/forest.png')}
                                style={styles.heroImageFill}
                                accessibilityLabel="Forest background"
                            />
                            <View style={styles.heroOverlay} />
                            <View style={styles.heroContent}>
                                <Text style={styles.heroTitle}>Secure Your Account</Text>
                                <Text style={styles.heroSubtitle}>You are required to set a new password before accessing the SFC Training Portal.</Text>
                            </View>
                        </View>
                    )}

                    <View style={styles.formPanel}>
                        <View style={styles.brandRow}>
                            <Image
                                source={require('../../assets/sfc_logo.png')}
                                style={styles.brandLogo}
                                accessibilityLabel="SFC logo"
                            />
                            <View>
                                <Text style={styles.brandTitle}>SFC Digital Training</Text>
                                <Text style={styles.brandCaption}>Account setup</Text>
                            </View>
                        </View>

                        <View style={styles.header}>
                            <Text style={styles.title}>Change Password</Text>
                            <Text style={styles.subtitle}>For security, you must set a new password before continuing. Your temporary password was sent to your email.</Text>
                        </View>

                        <View style={styles.form}>
                            {errorMessage ? (
                                <Text style={styles.errorText}>{errorMessage}</Text>
                            ) : null}

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Temporary Password</Text>
                                <View style={styles.inputContainer}>
                                    <Lock size={20} color="#2f6618fe" style={styles.icon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter temporary password from email"
                                        placeholderTextColor="#8f8f8f"
                                        value={currentPassword}
                                        onChangeText={(text) => { setCurrentPassword(text); if (errorMessage) setErrorMessage(''); }}
                                        secureTextEntry={!showCurrent}
                                        editable={!loading}
                                    />
                                    <Pressable onPress={() => setShowCurrent(p => !p)} style={styles.iconRight}>
                                        {showCurrent ? <EyeOff size={18} color="#6b6b6b" /> : <Eye size={18} color="#6b6b6b" />}
                                    </Pressable>
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>New Password</Text>
                                <View style={styles.inputContainer}>
                                    <Lock size={20} color="#2f6618fe" style={styles.icon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter new password"
                                        placeholderTextColor="#8f8f8f"
                                        value={newPassword}
                                        onChangeText={(text) => { setNewPassword(text); if (errorMessage) setErrorMessage(''); }}
                                        secureTextEntry={!showNew}
                                        editable={!loading}
                                    />
                                    <Pressable onPress={() => setShowNew(p => !p)} style={styles.iconRight}>
                                        {showNew ? <EyeOff size={18} color="#6b6b6b" /> : <Eye size={18} color="#6b6b6b" />}
                                    </Pressable>
                                </View>
                                <View style={styles.strengthRow}>
                                    <View style={styles.strengthBarContainer}>
                                        <View style={[styles.strengthBar, { width: `${(pwdStrength.score / 4) * 100}%`, backgroundColor: pwdStrength.color }]} />
                                    </View>
                                    <Text style={[styles.strengthLabel, { color: pwdStrength.color }]}>{pwdStrength.label}</Text>
                                </View>
                                <View style={styles.requirements}>
                                    <Text style={styles.reqTitle}>Password requirements</Text>
                                    <View style={styles.reqLine}>
                                        {pwdStrength.requirements.hasLength ? <Check size={16} color="#2e7d32" /> : <X size={16} color="#b00020" />}
                                        <Text style={styles.reqItem}>At least 8 characters</Text>
                                    </View>
                                    <View style={styles.reqLine}>
                                        {pwdStrength.requirements.hasUpperLower ? <Check size={16} color="#2e7d32" /> : <X size={16} color="#b00020" />}
                                        <Text style={styles.reqItem}>Mix of upper and lower case letters</Text>
                                    </View>
                                    <View style={styles.reqLine}>
                                        {pwdStrength.requirements.hasNumber ? <Check size={16} color="#2e7d32" /> : <X size={16} color="#b00020" />}
                                        <Text style={styles.reqItem}>At least one number</Text>
                                    </View>
                                    <View style={styles.reqLine}>
                                        {pwdStrength.requirements.hasSymbol ? <Check size={16} color="#2e7d32" /> : <X size={16} color="#b00020" />}
                                        <Text style={styles.reqItem}>At least one symbol (e.g. !@#$%)</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Confirm New Password</Text>
                                <View style={styles.inputContainer}>
                                    <Lock size={20} color="#2f6618fe" style={styles.icon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Confirm new password"
                                        placeholderTextColor="#8f8f8f"
                                        value={confirmPassword}
                                        onChangeText={(text) => { setConfirmPassword(text); if (errorMessage) setErrorMessage(''); }}
                                        secureTextEntry={!showConfirm}
                                        editable={!loading}
                                    />
                                    <Pressable onPress={() => setShowConfirm(p => !p)} style={styles.iconRight}>
                                        {showConfirm ? <EyeOff size={18} color="#6b6b6b" /> : <Eye size={18} color="#6b6b6b" />}
                                    </Pressable>
                                </View>
                            </View>

                            <Pressable
                                style={[styles.button, (loading || pwdStrength.score < 2) && styles.disabledButton]}
                                onPress={handleSubmit}
                                disabled={loading || pwdStrength.score < 2}
                            >
                                <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Set New Password'}</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <ModalLayout visible={showSuccessModal} onClose={() => {}}>
                <View style={styles.successModal}>
                    <CheckCircle size={52} color="#2f6618" />
                    <Text style={styles.successTitle}>Password Set!</Text>
                    <Text style={styles.successMessage}>
                        Your password has been updated. You can now access the portal.
                    </Text>
                    <Pressable
                        style={styles.successButton}
                        onPress={() => {
                            setShowSuccessModal(false);
                            clearMustChangePassword();
                        }}
                    >
                        <Text style={styles.successButtonText}>Continue</Text>
                    </Pressable>
                </View>
            </ModalLayout>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#e8efe7',
    },
    scrollView: {
        height:'100vh'
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    shell: {
        width: '100%',
        maxWidth: 1000,
        alignSelf: 'center',
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#d8e2d6',
        minHeight: 600,
    },
    shellDesktop: {
        flexDirection: 'row',
    },
    shellMobile: {
        flexDirection: 'column',
    },
    heroPanel: {
        width: '47%',
        justifyContent: 'flex-end',
        minHeight: 280,
        position: 'relative',
        overflow: 'hidden',
    },
    heroImageFill: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(24, 46, 17, 0.62)',
    },
    heroContent: {
        padding: 28,
        gap: 12,
    },
    heroTitle: {
        color: '#ffffff',
        fontSize: 30,
        fontWeight: '700',
    },
    heroSubtitle: {
        color: '#d4f0cf',
        fontSize: 15,
        lineHeight: 22,
        maxWidth: 380,
    },
    formPanel: {
        flex:1,
        padding: 28,
        justifyContent: 'flex-start',
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 18,
    },
    brandLogo: {
        width: 78,
        height: 34,
        resizeMode: 'contain',
    },
    brandTitle: {
        color: '#1f4f13',
        fontSize: 17,
        fontWeight: '700',
    },
    brandCaption: {
        color: '#6f786d',
        fontSize: 12,
    },
    header: {
        marginBottom: 26,
        marginTop: 20,
    },
    title: {
        fontSize: 34,
        fontWeight: 'bold',
        color: '#1f4f13',
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 15,
        color: '#60735b',
        lineHeight: 22,
    },
    form: {
        gap: 18,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginLeft: 5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fbfdfb',
        borderRadius: 12,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: '#d4ddd3',
        height: 52,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        outlineStyle: 'none',
    },
    iconRight: {
        marginLeft: 8,
        padding: 6,
    },
    button: {
        backgroundColor: '#2f6618fe',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 16,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    disabledButton: {
        opacity: 0.6,
    },
    errorText: {
        color: '#b00020',
        backgroundColor: '#fff1f1',
        padding: 10,
        borderRadius: 8,
        marginBottom: 8,
    },
    strengthRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 8,
    },
    strengthBarContainer: {
        flex: 1,
        height: 8,
        backgroundColor: '#eef4ea',
        borderRadius: 6,
        overflow: 'hidden',
    },
    strengthBar: {
        height: '100%',
        width: '0%',
        backgroundColor: '#e53935',
    },
    strengthLabel: {
        width: 100,
        textAlign: 'right',
        fontWeight: '600',
    },
    requirements: {
        marginTop: 10,
        backgroundColor: '#f6fbf6',
        padding: 10,
        borderRadius: 8,
    },
    reqTitle: {
        fontWeight: '700',
        color: '#1f4f13',
        marginBottom: 6,
    },
    reqItem: {
        color: '#3b4b3a',
        fontSize: 13,
        marginBottom: 4,
    },
    reqLine: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    successModal: {
        padding: 36,
        alignItems: 'center',
        gap: 16,
    },
    successTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1f4f13',
    },
    successMessage: {
        fontSize: 15,
        color: '#60735b',
        textAlign: 'center',
        lineHeight: 22,
    },
    successButton: {
        backgroundColor: '#2f6618',
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 10,
        marginTop: 8,
    },
    successButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
});

export default ForceChangePassword;
