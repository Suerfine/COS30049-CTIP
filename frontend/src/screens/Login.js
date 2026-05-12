import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Alert, Image, useWindowDimensions } from 'react-native';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { CommonActions } from '@react-navigation/native';

// Import other hook and component
import { useLogin } from '../hooks/useLogin';

const Login = ({ navigation }) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 980;
    const {
        email, setEmail,
        password, setPassword,
        loading, setLoading,
        loginError, setLoginError,
        login, handleLogin
    }=useLogin();

    const [showPassword, setShowPassword] = useState(false);

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
                                <View style={styles.heroChipRow}>
                                    <Text style={styles.heroChip}>Park Guide Learning</Text>
                                    <Text style={styles.heroChip}>Compliance Ready</Text>
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
                                <Text style={styles.brandCaption}>Secure access for staff and park guides</Text>
                            </View>
                        </View>

                        <View style={styles.header}>
                            <Text style={styles.title}>Welcome Back</Text>
                            <Text style={styles.subtitle}>Sign in to continue your training journey.</Text>
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
                                        onChangeText={(value) => {
                                            setEmail(value);
                                            if (loginError) {
                                                setLoginError('');
                                            }
                                        }}
                                        keyboardType="email-address"
                                        editable={!loading}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Password</Text>
                                <View style={styles.inputContainer}>
                                    <Lock size={20} color="#2f6618fe" style={styles.icon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your password"
                                        value={password}
                                        placeholderTextColor="#8f8f8f"
                                        onChangeText={(value) => {
                                            setPassword(value);
                                            if (loginError) {
                                                setLoginError('');
                                            }
                                        }}
                                        secureTextEntry={!showPassword}
                                        editable={!loading}
                                    />
                                    <Pressable onPress={() => setShowPassword(!showPassword)}>
                                        {showPassword ? (
                                            <Eye size={20} color="#2f6618fe" />
                                        ) : (
                                            
                                            <EyeOff size={20} color="#2f6618fe" />
                                        )}
                                    </Pressable>
                                </View>
                            </View>

                            <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
                                <Text style={styles.forgotPassword}>Forgot password?</Text>
                            </Pressable>

                            <Pressable
                                style={[styles.loginButton, loading && styles.disabledButton]}
                                onPress={handleLogin}
                                disabled={loading}
                            >
                                <Text style={styles.loginButtonText}>
                                    {loading ? 'Signing in...' : 'Sign In'}
                                </Text>
                            </Pressable>

                            {!!loginError && (
                                <Text style={styles.errorText}>{loginError}</Text>
                            )}

                            <View style={styles.signupContainer}>
                                <Text style={styles.signupText}>Don't have an account? </Text>
                                <Pressable onPress={() => navigation.navigate('SignUp')}>
                                    <Text style={styles.signupLink}>Register</Text>
                                </Pressable>
                            </View>
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
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
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
        marginVertical:'auto',
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
        userSelect:'none'
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
        flex: 1,
        padding: 28,
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
        fontSize: 14,
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
    input:{
        flex:1,
        height:40,
        outlineStyle:'none'
    },
    forgotPassword: {
        color: '#2f6618fe',
        fontSize: 13,
        fontWeight: '600',
        alignSelf: 'flex-end',
    },
    loginButton: {
        backgroundColor: '#2f6618fe',
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 6,
    },
    disabledButton: {
        opacity: 0.6,
    },
    loginButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    errorText: {
        color: '#b42318',
        fontSize: 13,
        fontWeight: '600',
        marginTop: 2,
        textAlign: 'left',
    },
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop:10
    },
    signupText: {
        color: '#60735b',
        fontSize: 14,
    },
    signupLink: {
        color: '#2f6618fe',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default Login;
