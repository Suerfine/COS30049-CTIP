import { useState, useRef } from 'react';
import {
    View, Text, TextInput, StyleSheet, Pressable,
    ScrollView, Image, useWindowDimensions,
} from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

const TotpVerify = ({ navigation, route }) => {
    const { totp_session_token, email } = route.params ?? {};
    const { completeLogin } = useAuth();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 980;

    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleVerify = async () => {
        if (code.length !== 6) {
            setError('* Please enter the 6-digit code from your authenticator app.');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const { access_token } = await authService.verifyTotp(totp_session_token, code);
            await completeLogin(access_token, email);
        } catch (err) {
            setError(err.message || '* Verification failed. Please try again.');
            setCode('');
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
                                <Text style={styles.heroTitle}>SFC Digital Training</Text>
                                <Text style={styles.heroSubtitle}>Official learning and compliance portal for Sarawak Forestry Corporation.</Text>
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
                                <Text style={styles.brandCaption}>Secure access for staff and park guides</Text>
                            </View>
                        </View>

                        <View style={styles.header}>
                            <View style={styles.iconRow}>
                                <ShieldCheck size={32} color="#2f6618fe" />
                            </View>
                            <Text style={styles.title}>Two-Factor Authentication</Text>
                            <Text style={styles.subtitle}>
                                Open your authenticator app and enter the 6-digit code for SFC Digital Training.
                            </Text>
                        </View>

                        <View style={styles.form}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Authentication Code</Text>
                                <TextInput
                                    style={styles.codeInput}
                                    value={code}
                                    onChangeText={(v) => {
                                        setCode(v.replace(/[^0-9]/g, '').slice(0, 6));
                                        if (error) setError('');
                                    }}
                                    placeholder="000000"
                                    placeholderTextColor="#8f8f8f"
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    editable={!loading}
                                    autoFocus
                                />
                            </View>

                            <Pressable
                                style={[styles.verifyButton, loading && styles.disabledButton]}
                                onPress={handleVerify}
                                disabled={loading}
                            >
                                <Text style={styles.verifyButtonText}>
                                    {loading ? 'Verifying...' : 'Verify'}
                                </Text>
                            </Pressable>

                            {!!error && <Text style={styles.errorText}>{error}</Text>}

                            <Pressable onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.backLink}>Back to login</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, height: '100vh', backgroundColor: '#e8efe7' },
    scrollView: { flex: 1 },
    scrollContent: { flexGrow: 1, justifyContent: 'flex-start', alignItems: 'center', padding: 24 },
    shell: {
        width: '100%', maxWidth: 1000, alignSelf: 'center',
        borderRadius: 20, overflow: 'hidden', backgroundColor: '#ffffff',
        borderWidth: 1, borderColor: '#d8e2d6', minHeight: 600, marginVertical: 'auto',
    },
    shellDesktop: { flexDirection: 'row' },
    shellMobile: { flexDirection: 'column' },
    heroPanel: { width: '47%', justifyContent: 'flex-end', minHeight: 280, position: 'relative', overflow: 'hidden' },
    heroImageFill: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', resizeMode: 'cover' },
    heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(24, 46, 17, 0.62)' },
    heroContent: { padding: 28, gap: 12, userSelect: 'none' },
    heroTitle: { color: '#ffffff', fontSize: 30, fontWeight: '700' },
    heroSubtitle: { color: '#d4f0cf', fontSize: 15, lineHeight: 22, maxWidth: 380 },
    formPanel: { flex: 1, padding: 28 },
    brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
    brandLogo: { width: 78, height: 34, resizeMode: 'contain' },
    brandTitle: { color: '#1f4f13', fontSize: 17, fontWeight: '700' },
    brandCaption: { color: '#6f786d', fontSize: 12 },
    header: { marginBottom: 26, marginTop: 20, gap: 10 },
    iconRow: { marginBottom: 4 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#1f4f13' },
    subtitle: { fontSize: 14, color: '#60735b', lineHeight: 20 },
    form: { gap: 18 },
    inputGroup: { gap: 8 },
    label: { fontSize: 14, fontWeight: '600', color: '#333', marginLeft: 5 },
    codeInput: {
        borderWidth: 1, borderColor: '#d4ddd3', borderRadius: 12,
        paddingHorizontal: 15, height: 56, fontSize: 28,
        fontWeight: '700', color: '#1f4f13', backgroundColor: '#fbfdfb',
        textAlign: 'center', letterSpacing: 12, outlineStyle: 'none',
    },
    verifyButton: {
        backgroundColor: '#2f6618fe', paddingVertical: 10,
        borderRadius: 12, alignItems: 'center', marginTop: 6,
    },
    disabledButton: { opacity: 0.6 },
    verifyButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
    errorText: { color: '#b42318', fontSize: 13, fontWeight: '600', marginTop: 2 },
    backLink: { color: '#2f6618fe', fontSize: 13, fontWeight: '600', textAlign: 'center' },
});

export default TotpVerify;
