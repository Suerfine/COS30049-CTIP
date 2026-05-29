import { useState, useEffect } from 'react';
import {
    View, Text, TextInput, StyleSheet, Pressable,
    ScrollView, Image, ActivityIndicator,
} from 'react-native';
import { ShieldCheck, Copy, Check } from 'lucide-react-native';
import { totpService } from '../services/totpService';

const TotpSetup = ({ navigation }) => {
    const [step, setStep] = useState('loading'); // loading | scan | confirm | done
    const [secret, setSecret] = useState('');
    const [qrCode, setQrCode] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        totpService.setup()
            .then(({ secret, qr_code }) => {
                setSecret(secret);
                setQrCode(qr_code);
                setStep('scan');
            })
            .catch((err) => {
                setError(err.message);
                setStep('error');
            });
    }, []);

    const handleCopySecret = () => {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(secret);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleConfirm = async () => {
        if (code.length !== 6) {
            setError('* Please enter the 6-digit code from your authenticator app.');
            return;
        }
        setError('');
        setSubmitting(true);
        try {
            await totpService.verifySetup(secret, code);
            setStep('done');
        } catch (err) {
            setError(err.message);
            setCode('');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.card}>
                <View style={styles.headerRow}>
                    <ShieldCheck size={28} color="#2f6618fe" />
                    <Text style={styles.title}>Set Up Two-Factor Authentication</Text>
                </View>

                {step === 'loading' && (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color="#2f6618fe" />
                        <Text style={styles.hint}>Generating your setup code...</Text>
                    </View>
                )}

                {step === 'error' && (
                    <View style={styles.centered}>
                        <Text style={styles.errorText}>{error}</Text>
                        <Pressable style={styles.btn} onPress={() => navigation.goBack()}>
                            <Text style={styles.btnText}>Go Back</Text>
                        </Pressable>
                    </View>
                )}

                {step === 'scan' && (
                    <>
                        <Text style={styles.stepLabel}>Step 1 — Scan the QR code</Text>
                        <Text style={styles.hint}>
                            Open Google Authenticator, Authy, or any TOTP app and scan the QR code below.
                        </Text>

                        {qrCode ? (
                            <View style={styles.qrWrapper}>
                                <Image
                                    source={{ uri: qrCode }}
                                    style={styles.qrImage}
                                    accessibilityLabel="QR code for authenticator app"
                                />
                            </View>
                        ) : null}

                        <Text style={styles.orLabel}>Or enter the key manually:</Text>
                        <View style={styles.secretRow}>
                            <Text style={styles.secretText} selectable>{secret}</Text>
                            <Pressable onPress={handleCopySecret} style={styles.copyBtn}>
                                {copied
                                    ? <Check size={16} color="#2f6618fe" />
                                    : <Copy size={16} color="#2f6618fe" />}
                            </Pressable>
                        </View>

                        <Pressable style={styles.btn} onPress={() => setStep('confirm')}>
                            <Text style={styles.btnText}>I've scanned it — Next</Text>
                        </Pressable>
                    </>
                )}

                {step === 'confirm' && (
                    <>
                        <Text style={styles.stepLabel}>Step 2 — Confirm it works</Text>
                        <Text style={styles.hint}>
                            Enter the 6-digit code shown in your authenticator app to confirm setup.
                        </Text>

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
                                editable={!submitting}
                                autoFocus
                            />
                        </View>

                        {!!error && <Text style={styles.errorText}>{error}</Text>}

                        <View style={styles.buttonRow}>
                            <Pressable
                                style={styles.outlineBtn}
                                onPress={() => { setStep('scan'); setError(''); setCode(''); }}
                            >
                                <Text style={styles.outlineBtnText}>Back</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.btn, styles.btnFlex, submitting && styles.disabledBtn]}
                                onPress={handleConfirm}
                                disabled={submitting}
                            >
                                <Text style={styles.btnText}>
                                    {submitting ? 'Verifying...' : 'Enable 2FA'}
                                </Text>
                            </Pressable>
                        </View>
                    </>
                )}

                {step === 'done' && (
                    <View style={styles.centered}>
                        <Check size={48} color="#2f6618fe" />
                        <Text style={styles.doneTitle}>2FA Enabled</Text>
                        <Text style={styles.hint}>
                            Your account is now protected with two-factor authentication.
                            You'll need your authenticator app each time you log in.
                        </Text>
                        <Pressable style={styles.btn} onPress={() => navigation.goBack()}>
                            <Text style={styles.btnText}>Done</Text>
                        </Pressable>
                    </View>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#e8efe7' },
    content: { padding: 24, alignItems: 'center' },
    card: {
        width: '100%', maxWidth: 480, backgroundColor: '#ffffff',
        borderRadius: 16, padding: 28, borderWidth: 1, borderColor: '#d8e2d6',
        gap: 16,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    title: { fontSize: 20, fontWeight: '700', color: '#1f4f13', flex: 1 },
    stepLabel: { fontSize: 15, fontWeight: '700', color: '#1f4f13' },
    hint: { fontSize: 14, color: '#60735b', lineHeight: 20 },
    qrWrapper: { alignItems: 'center', paddingVertical: 8 },
    qrImage: { width: 200, height: 200 },
    orLabel: { fontSize: 13, color: '#60735b', textAlign: 'center' },
    secretRow: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f7f2',
        borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
        borderWidth: 1, borderColor: '#d4ddd3', gap: 10,
    },
    secretText: { flex: 1, fontFamily: 'monospace', fontSize: 13, color: '#1f4f13', letterSpacing: 2 },
    copyBtn: { padding: 4 },
    inputGroup: { gap: 8 },
    label: { fontSize: 14, fontWeight: '600', color: '#333', marginLeft: 5 },
    codeInput: {
        borderWidth: 1, borderColor: '#d4ddd3', borderRadius: 12,
        paddingHorizontal: 15, height: 56, fontSize: 28,
        fontWeight: '700', color: '#1f4f13', backgroundColor: '#fbfdfb',
        textAlign: 'center', letterSpacing: 12, outlineStyle: 'none',
    },
    errorText: { color: '#b42318', fontSize: 13, fontWeight: '600' },
    buttonRow: { flexDirection: 'row', gap: 12 },
    btn: {
        backgroundColor: '#2f6618fe', paddingVertical: 12,
        borderRadius: 10, alignItems: 'center',
    },
    btnFlex: { flex: 1 },
    btnText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
    disabledBtn: { opacity: 0.6 },
    outlineBtn: {
        borderWidth: 1, borderColor: '#2f6618fe', borderRadius: 10,
        paddingVertical: 12, paddingHorizontal: 20, alignItems: 'center',
    },
    outlineBtnText: { color: '#2f6618fe', fontSize: 14, fontWeight: '500' },
    centered: { alignItems: 'center', gap: 16, paddingVertical: 16 },
    doneTitle: { fontSize: 22, fontWeight: '700', color: '#1f4f13' },
});

export default TotpSetup;
