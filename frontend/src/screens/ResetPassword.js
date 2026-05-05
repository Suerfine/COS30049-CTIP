import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Alert, Image, useWindowDimensions } from 'react-native';
import { ArrowLeft, Lock, Check, X, Eye, EyeOff } from 'lucide-react-native';
import { authService } from '../services/authService';

const ResetPassword = ({ navigation, route }) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 980;
    const token = useMemo(() => route?.params?.token || '', [route?.params?.token]);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    
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
        if (score <= 1) {
            label = 'Weak'; color = '#e53935';
        } else if (score === 2) {
            label = 'Medium'; color = '#f9a825';
        } else if (score === 3) {
            label = 'Strong'; color = '#43a047';
        } else if (score === 4) {
            label = 'Very Strong'; color = '#1b5e20';
        }

        return { score, label, color, requirements: { hasLength, hasUpperLower, hasNumber, hasSymbol } };
    };

    const pwdStrength = computePasswordStrength(password);
    const allReqMet = Object.values(pwdStrength.requirements).every(Boolean);

    const handleSubmit = async () => {
        if (!token) {
            Alert.alert('Missing token', 'This reset link is invalid or expired.');
            return;
        }

        if (!password || password.length < 8) {
            Alert.alert('Weak password', 'Password must be at least 8 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            setErrorMessage('Passwords do not match');
            return;
        }

        try {
            setLoading(true);
            setErrorMessage('');
            await authService.resetPassword(token, password);
            Alert.alert('Password updated', 'Your password has been reset successfully. Please sign in with your new password.');
            navigation.navigate('Login');
        } catch (error) {
            const msg = error?.message || 'Please request a new reset link.';
            setErrorMessage(msg);
            Alert.alert('Unable to reset password', msg);
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
                                <Text style={styles.heroTitle}>Set New Password</Text>
                                <Text style={styles.heroSubtitle}>Create a new password for your SFC training account and continue where you left off.</Text>
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
                                <Text style={styles.brandCaption}>Password recovery</Text>
                            </View>
                        </View>

                        <View style={styles.header}>
                            <Text style={styles.title}>Reset Password</Text>
                            <Text style={styles.subtitle}>Enter a new password to regain access to your account.</Text>
                        </View>

                        <View style={styles.form}>
                            {errorMessage ? (
                                <Text style={styles.errorText}>{errorMessage}</Text>
                            ) : null}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>New Password</Text>
                                <View style={styles.inputContainer}>
                                    <Lock size={20} color="#2f6618fe" style={styles.icon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter new password"
                                        placeholderTextColor="#8f8f8f"
                                        value={password}
                                        onChangeText={(text) => { setPassword(text); if (errorMessage) setErrorMessage(''); }}
                                        secureTextEntry={!showPassword}
                                        editable={!loading}
                                    />
                                    <Pressable onPress={() => setShowPassword(p => !p)} style={styles.iconRight}>
                                        {showPassword ? <EyeOff size={18} color="#6b6b6b" /> : <Eye size={18} color="#6b6b6b" />}
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
                                <Text style={styles.label}>Confirm Password</Text>
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
                                <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Reset Password'}</Text>
                            </Pressable>

                            <Pressable style={styles.backRow} onPress={() => navigation.navigate('Login')}>
                                <ArrowLeft size={16} color="#2f6618fe" />
                                <Text style={styles.backText}>Back to Sign In</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        height: '100vh',
        backgroundColor: '#e8efe7',
    },
    scrollView: {
        flex: 1,
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
        width: '53%',
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
    backRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'center',
        marginTop: 4,
    },
    backText: {
        color: '#2f6618fe',
        fontSize: 14,
        fontWeight: '600',
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
});

export default ResetPassword;