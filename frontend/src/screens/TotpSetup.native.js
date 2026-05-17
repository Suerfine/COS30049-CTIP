import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, StyleSheet, Pressable,
    ScrollView, ActivityIndicator, Clipboard, Linking, Platform, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldCheck, Copy, Check, ChevronLeft, ExternalLink } from 'lucide-react-native';
import { totpService } from '../services/totpService';

const TotpSetup = ({ navigation }) => {
    const [step, setStep] = useState('loading'); 
    const [secret, setSecret] = useState('');
    const [otpauthUrl, setOtpauthUrl] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        totpService.setup()
            .then(({ secret, otpauth_url, qr_code }) => {
                setSecret(secret);
                setOtpauthUrl(otpauth_url || qr_code || ''); 
                setStep('setup');
            })
            .catch((err) => {
                setError(err.message || 'Failed to initialize security channels.');
                setStep('error');
            });
    }, []);

    const handleCopySecret = () => {
        Clipboard.setString(secret);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
 
    const handleLaunchAuthenticator = async () => {
        if (!otpauthUrl) {
            Alert.alert("Notice", "Setup key parameter missing. Please utilize manual code setup.");
            return;
        }
        try {
            const supported = await Linking.canOpenURL(otpauthUrl);
            if (supported) {
                await Linking.openURL(otpauthUrl);
            } else {
                Alert.alert("Notice", "No default authenticator application detected. Please manually copy the verification token key string below.");
            }
        } catch (err) {
            Alert.alert("Notice", "Copy the setup key token manually to paste inside your chosen token manager app layout.");
        }
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
            setError(err.message || 'Verification token match failed.');
            setCode('');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            {/* Custom Header Layout Navigation Bar */}
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={24} color="black" />
                </Pressable>
                <Text style={styles.headerTitle}>Two-Factor Setup</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <View style={styles.headerRow}>
                        <ShieldCheck size={28} color="#0a6340" />
                        <Text style={styles.title}>Secure Your Profile</Text>
                    </View>

                    {step === 'loading' && (
                        <View style={styles.centered}>
                            <ActivityIndicator size="large" color="#0a6340" />
                            <Text style={styles.hint}>Generating secure hardware seed credentials...</Text>
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

                    {step === 'setup' && (
                        <>
                            <Text style={styles.stepLabel}>Step 1 — Link Your Authenticator</Text>
                            <Text style={styles.hint}>
                                Tap the linkage button below to register our security seed channel straight onto your device's preferred verification engine automatically.
                            </Text>

                            {/* Deep Link action option button */}
                            <Pressable style={styles.linkBtn} onPress={handleLaunchAuthenticator}>
                                <ExternalLink size={16} color="white" />
                                <Text style={styles.linkBtnText}>Open Authenticator App</Text>
                            </Pressable>

                            <Text style={styles.orLabel}>Or manually configure the verification code token:</Text>
                            <View style={styles.secretRow}>
                                <Text style={styles.secretText} numberOfLines={1}>{secret}</Text>
                                <Pressable onPress={handleCopySecret} style={styles.copyBtn}>
                                    {copied
                                        ? <Check size={16} color="#0a6340" />
                                        : <Copy size={16} color="#0a6340" />}
                                </Pressable>
                            </View>

                            <Pressable style={styles.btn} onPress={() => setStep('confirm')}>
                                <Text style={styles.btnText}>Next Step — Verify Code</Text>
                            </Pressable>
                        </>
                    )}

                    {step === 'confirm' && (
                        <>
                            <Text style={styles.stepLabel}>Step 2 — Sync Activation Check</Text>
                            <Text style={styles.hint}>
                                Input the active, dynamic 6-digit checking token block currently visible inside your verification app tracker module.
                            </Text>

                            <View style={styles.inputGroup}>
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
                                    onPress={() => { setStep('setup'); setError(''); setCode(''); }}
                                >
                                    <Text style={styles.outlineBtnText}>Back</Text>
                                </Pressable>
                                <Pressable
                                    style={[styles.btn, styles.btnFlex, submitting && styles.disabledBtn]}
                                    onPress={handleConfirm}
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <ActivityIndicator color="white" size="small" />
                                    ) : (
                                        <Text style={styles.btnText}>Activate 2FA</Text>
                                    )}
                                </Pressable>
                            </View>
                        </>
                    )}

                    {step === 'done' && (
                        <View style={styles.centered}>
                            <Check size={44} color="#0a6340" />
                            <Text style={styles.doneTitle}>Protection Confirmed!</Text>
                            <Text style={styles.hintCentered}>
                                Two-Factor authentication filters are now running actively over your identity token layout profiles.
                            </Text>
                            <Pressable style={[styles.btn, { width: '100%', marginTop: 10 }]} onPress={() => navigation.goBack()}>
                                <Text style={styles.btnText}>Return to Settings</Text>
                            </Pressable>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#f2f2f7' 
    },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 16, 
        height: 56, 
        backgroundColor: 'white', 
        borderBottomWidth: 1, 
        borderBottomColor: '#e5e5e5' 
    },
    backBtn: { 
        width: 40, 
        height: 40, 
        justifyContent: 'center', 
        alignItems: 'center',
         borderRadius: 20, 
         backgroundColor: '#f0f0f0' 
    },
    headerTitle: { 
        fontSize: 17, 
        fontWeight: '600', 
        color: 'black' 
    },
    content: { 
        padding: 20, 
        alignItems: 'center' 
    },
    card: {
        width: '100%', 
        maxWidth: 440, 
        backgroundColor: '#ffffff',
        borderRadius: 16, 
        padding: 24, 
        borderWidth: 1, 
        borderColor: '#e5e5e5',
        gap: 16,
        elevation: 2, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 1 }, 
        shadowOpacity: 0.05, 
        shadowRadius: 3
    },
    headerRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 12, 
        marginBottom: 5 
    },
    title: { 
        fontSize: 18, 
        fontWeight: '700', 
        color: '#1a1a1a', 
        flex: 1 
    },
    stepLabel: { 
        fontSize: 15, 
        fontWeight: '700', 
        color: '#0a6340' 
    },
    hint: { 
        fontSize: 13, 
        color: '#666', 
        lineHeight: 19 
    },
    hintCentered: { 
        fontSize: 13, 
        color: '#666', 
        lineHeight: 19, 
        textAlign: 'center' 
    },
    linkBtn: { 
        flexDirection: 'row', 
        backgroundColor: '#0a6340', 
        paddingVertical: 12, 
        paddingHorizontal: 16, 
        borderRadius: 8, 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: 8, 
        marginVertical: 4 
    },
    linkBtnText: { 
        color: 'white', 
        fontWeight: '600', 
        fontSize: 14 
    },
    orLabel: { 
        fontSize: 12, 
        color: '#888', 
        marginTop: 10, 
        fontWeight: '600' 
    },
    secretRow: {
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#f3f4f6',
        borderRadius: 8, 
        paddingLeft: 12, 
        borderWidth: 1, 
        borderColor: '#dee2e6', 
        gap: 10,
    },
    secretText: { 
        flex: 1, 
        fontSize: 13, 
        color: '#333', 
        ...Platform.select({ ios: { fontFamily: 'Courier' }, android: { fontFamily: 'monospace' } }), 
        letterSpacing: 1 
    },
    copyBtn: { 
        padding: 12, 
        borderLeftWidth: 1, 
        borderLeftColor: '#dee2e6' 
    },
    inputGroup: { 
        marginVertical: 8 
    },
    codeInput: {
        borderWidth: 1, 
        borderColor: '#dee2e6', 
        borderRadius: 10,
        height: 52, 
        fontSize: 24, 
        fontWeight: '700', 
        color: '#0a6340',
        backgroundColor: '#fbfdfb', 
        textAlign: 'center', 
        letterSpacing: 8,
    },
    errorText: { 
        color: '#b42318', 
        fontSize: 12, 
        fontWeight: '600', 
        marginVertical: 2 
    },
    buttonRow: { 
        flexDirection: 'row', 
        gap: 12, 
        marginTop: 8 
    },
    btn: {
        backgroundColor: '#2f6618fe', 
        paddingVertical: 12, 
        paddingHorizontal: 16,
        borderRadius: 8, 
        alignItems: 'center', 
        justifyContent: 'center'
    },
    btnFlex: { 
        flex: 1 
    },
    btnText: { 
        color: '#ffffff', 
        fontSize: 14, 
        fontWeight: '600' 
    },
    disabledBtn: { 
        opacity: 0.6 
    },
    outlineBtn: {
        borderWidth: 1, 
        borderColor: '#2f6618fe', 
        borderRadius: 8,
        paddingVertical: 12, 
        paddingHorizontal: 20, 
        alignItems: 'center', 
        justifyContent: 'center'
    },
    outlineBtnText: { 
        color: '#2f6618fe',
        fontSize: 14, 
        fontWeight: '500' 
    },
    centered: { 
        alignItems: 'center', 
        gap: 14, 
        paddingVertical: 10 
    },
    doneTitle: { 
        fontSize: 20, 
        fontWeight: '700', 
        color: '#0a6340'
    },
});

export default TotpSetup;