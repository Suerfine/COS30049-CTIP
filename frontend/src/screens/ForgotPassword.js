import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Alert, Image, useWindowDimensions } from 'react-native';
import { Mail, ArrowLeft } from 'lucide-react-native';

const ForgotPassword = ({ navigation }) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 980;
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const isValidEmail = (value) => /^\S+@\S+\.\S+$/.test(value);

    const handleReset = () => {
        if (!email.trim()) {
            Alert.alert('Missing email', 'Please enter your email address.');
            return;
        }

        if (!isValidEmail(email.trim())) {
            Alert.alert('Invalid email', 'Please enter a valid email address.');
            return;
        }

        setLoading(true);
        try {
            Alert.alert('Reset link sent', 'If this email exists, a password reset link will be sent.');
            navigation.navigate('Login');
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
                                <Text style={styles.heroTitle}>Reset Access</Text>
                                <Text style={styles.heroSubtitle}>Use your registered email to receive a password reset link and regain access to your training account.</Text>
                                <View style={styles.heroChipRow}>
                                    <Text style={styles.heroChip}>Secure Reset</Text>
                                    <Text style={styles.heroChip}>Email Verification</Text>
                                </View>
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
                            <Text style={styles.title}>Forgot Password</Text>
                            <Text style={styles.subtitle}>Enter your email and we’ll send a reset link if the account exists.</Text>
                        </View>

                        <View style={styles.form}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email</Text>
                                <View style={styles.inputContainer}>
                                    <Mail size={20} color="#2f6618fe" style={styles.icon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your email"
                                        placeholderTextColor="#8f8f8f"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        editable={!loading}
                                    />
                                </View>
                            </View>

                            <Pressable
                                style={[styles.button, loading && styles.disabledButton]}
                                onPress={handleReset}
                                disabled={loading}
                            >
                                <Text style={styles.buttonText}>{loading ? 'Sending...' : 'Send Reset Link'}</Text>
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
        height:'100vh',
        backgroundColor: '#e8efe7',
    },
    scrollView: {
        flex: 1,
        minHeight: 0,
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
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#d8e2d6',
        minHeight: 600,
    },
    shellDesktop: {
        flexDirection: 'row',
        alignItems: 'stretch',
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
        borderTopLeftRadius: 20,
        borderBottomLeftRadius: 20,
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
    heroChipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 8,
    },
    heroChip: {
        color: '#e2ffd8',
        borderWidth: 1,
        borderColor: '#8ccd7e',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
        fontSize: 12,
        fontWeight: '600',
        backgroundColor: 'rgba(52, 95, 44, 0.55)',
    },
    formPanel: {
        width: '53%',
        padding: 28,
        justifyContent: 'flex-start',
        borderTopRightRadius: 20,
        borderBottomRightRadius: 20,
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
        marginTop:20
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
        outlineStyle:'none'
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

export default ForgotPassword;
