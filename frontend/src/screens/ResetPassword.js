import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Alert, Image, useWindowDimensions } from 'react-native';
import { ArrowLeft, Lock } from 'lucide-react-native';
import { authService } from '../services/authService';

const ResetPassword = ({ navigation, route }) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 980;
    const token = useMemo(() => route?.params?.token || '', [route?.params?.token]);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

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
            Alert.alert('Password mismatch', 'The passwords do not match.');
            return;
        }

        try {
            setLoading(true);
            await authService.resetPassword(token, password);
            Alert.alert('Password updated', 'Your password has been reset successfully. Please sign in with your new password.');
            navigation.navigate('Login');
        } catch (error) {
            Alert.alert('Unable to reset password', error.message || 'Please request a new reset link.');
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
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>New Password</Text>
                                <View style={styles.inputContainer}>
                                    <Lock size={20} color="#2f6618fe" style={styles.icon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter new password"
                                        placeholderTextColor="#8f8f8f"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                        editable={!loading}
                                    />
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
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry
                                        editable={!loading}
                                    />
                                </View>
                            </View>

                            <Pressable
                                style={[styles.button, loading && styles.disabledButton]}
                                onPress={handleSubmit}
                                disabled={loading}
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
});

export default ResetPassword;