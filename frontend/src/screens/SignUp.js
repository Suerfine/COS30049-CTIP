import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Alert, Image, useWindowDimensions } from 'react-native';
import { User, Mail, Lock, Eye, EyeOff, Check, X } from 'lucide-react-native';

const SignUp = ({ navigation }) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 980;

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // Password strength calculation
    const calculatePasswordStrength = (pwd) => {
        if (!pwd) return { score: 0, label: '', color: '#999' };

        let score = 0;
        if (pwd.length >= 8) score++;
        if (pwd.length >= 12) score++;
        if (/[a-z]/.test(pwd)) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^a-zA-Z0-9]/.test(pwd)) score++;

        if (score <= 2) return { score: 1, label: 'Weak', color: '#d32f2f' };
        if (score <= 4) return { score: 2, label: 'Medium', color: '#f57c00' };
        return { score: 3, label: 'Strong', color: '#2f6618fe' };
    };

    const passwordStrength = calculatePasswordStrength(password);

    const isValidEmail = (value) => /^\S+@\S+\.\S+$/.test(value);

    const validateForm = () => {
        if (!name.trim()) {
            Alert.alert('Missing name', 'Please enter your full name so your account can be identified.');
            return false;
        }
        if (!email.trim()) {
            Alert.alert('Missing email', 'Please enter your email address.');
            return false;
        }
        if (!isValidEmail(email.trim())) {
            Alert.alert('Invalid email', 'Please enter a valid email address (for example: name@example.com).');
            return false;
        }
        if (!password) {
            Alert.alert('Missing password', 'Please create a password for your account.');
            return false;
        }
        if (password.length < 8) {
            Alert.alert('Weak password', 'Password must be at least 8 characters long.');
            return false;
        }
        if (passwordStrength.score < 2) {
            Alert.alert('Weak password', 'Password must be at least Medium strength by including uppercase, lowercase, numbers, and symbols.');
            return false;
        }
        if (password !== confirmPassword) {
            Alert.alert('Password mismatch', 'Confirm password must match the password you created.');
            return false;
        }
        return true;
    };

    const handleSignUp = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            // TODO: Connect to backend registration endpoint
            // const response = await fetch('http://localhost:5000/api/register', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ name, email, password })
            // });
            // const data = await response.json();
            // Gotta wait for backend to be set up before we can test this, but for now we'll just show a success message
            
            Alert.alert('Success', 'Account created successfully! Please log in.');
            navigation.navigate('Login');
        } catch (error) {
            Alert.alert('Error', 'Registration failed. Please try again.');
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
                                <Text style={styles.heroTitle}>Train With Purpose</Text>
                                <Text style={styles.heroSubtitle}>Create your account to access assigned courses, certification paths, and field-readiness modules.</Text>
                                <View style={styles.heroChipRow}>
                                    <Text style={styles.heroChip}>Role-Based Access</Text>
                                    <Text style={styles.heroChip}>Security First</Text>
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
                                <Text style={styles.brandCaption}>Official internal learning platform</Text>
                            </View>
                        </View>

                        <View style={styles.header}>
                            <Text style={styles.title}>Create Account</Text>
                            <Text style={styles.subtitle}>Register to start your training and compliance modules.</Text>
                        </View>

                        <View style={styles.form}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Full Name</Text>
                                <View style={styles.inputContainer}>
                                    <User size={20} color="#2f6618fe" style={styles.icon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your full name"
                                        value={name}
                                        onChangeText={setName}
                                        editable={!loading}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email</Text>
                                <View style={styles.inputContainer}>
                                    <Mail size={20} color="#2f6618fe" style={styles.icon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your email"
                                        value={email}
                                        onChangeText={setEmail}
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
                                        placeholder="Create a password"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                        editable={!loading}
                                    />
                                    <Pressable onPress={() => setShowPassword(!showPassword)}>
                                        {showPassword ? (
                                            <EyeOff size={20} color="#2f6618fe" />
                                        ) : (
                                            <Eye size={20} color="#2f6618fe" />
                                        )}
                                    </Pressable>
                                </View>

                                <Text style={styles.passwordHint}>
                                    Use a stronger password with uppercase, lowercase, numbers, and symbols.
                                </Text>

                                {password && (
                                    <View style={styles.strengthContainer}>
                                        <View style={styles.strengthBars}>
                                            {[1, 2, 3].map((i) => (
                                                <View
                                                    key={i}
                                                    style={[
                                                        styles.strengthBar,
                                                        { backgroundColor: i <= passwordStrength.score ? passwordStrength.color : '#e0e0e0' }
                                                    ]}
                                                />
                                            ))}
                                        </View>
                                        <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                                            {passwordStrength.label}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Confirm Password</Text>
                                <View style={styles.inputContainer}>
                                    <Lock size={20} color="#2f6618fe" style={styles.icon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Confirm your password"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry={!showConfirmPassword}
                                        editable={!loading}
                                    />
                                    <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                        {showConfirmPassword ? (
                                            <EyeOff size={20} color="#2f6618fe" />
                                        ) : (
                                            <Eye size={20} color="#2f6618fe" />
                                        )}
                                    </Pressable>
                                </View>

                                {confirmPassword && (
                                    <View style={styles.matchContainer}>
                                        {password === confirmPassword ? (
                                            <>
                                                <Check size={16} color="#2f6618fe" />
                                                <Text style={[styles.matchText, { color: '#2f6618fe' }]}>Passwords match</Text>
                                            </>
                                        ) : (
                                            <>
                                                <X size={16} color="#d32f2f" />
                                                <Text style={[styles.matchText, { color: '#d32f2f' }]}>Passwords do not match</Text>
                                            </>
                                        )}
                                    </View>
                                )}
                            </View>

                            <Pressable
                                style={[styles.signupButton, (loading || passwordStrength.score < 2) && styles.disabledButton]}
                                onPress={handleSignUp}
                                disabled={loading || passwordStrength.score < 2}
                            >
                                <Text style={styles.signupButtonText}>
                                    {loading ? 'Creating Account...' : 'Create Account'}
                                </Text>
                            </Pressable>

                            {password && passwordStrength.score < 2 && (
                                <View style={styles.warningContainer}>
                                    <Text style={styles.warningText}>
                                        Password must be at least Medium strength
                                    </Text>
                                </View>
                            )}

                            <View style={styles.divider}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>OR</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            <View style={styles.loginContainer}>
                                <Text style={styles.loginText}>Already have an account? </Text>
                                <Pressable onPress={() => navigation.navigate('Login')}>
                                    <Text style={styles.loginLink}>Sign In</Text>
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
        maxWidth: 1200,
        alignSelf: 'center',
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#d8e2d6',
        minHeight: 700,
    },
    shellDesktop: {
        flexDirection: 'row',
    },
    shellMobile: {
        flexDirection: 'column',
    },
    heroPanel: {
        flex: 1.05,
        justifyContent: 'flex-end',
        minHeight: 320,
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
        justifyContent: 'space-between',
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
        marginBottom: 22,
    },
    passwordHint: {
        color: '#7b8d76',
        fontSize: 12,
        marginTop: 6,
        lineHeight: 17,
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
        gap: 16,
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
    },
    strengthContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 4,
        marginLeft: 5,
    },
    strengthBars: {
        flexDirection: 'row',
        gap: 4,
        flex: 1,
    },
    strengthBar: {
        flex: 1,
        height: 4,
        borderRadius: 2,
    },
    strengthLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    matchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
        marginLeft: 5,
    },
    matchText: {
        fontSize: 12,
        fontWeight: '500',
    },
    signupButton: {
        backgroundColor: '#2f6618fe',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 6,
    },
    disabledButton: {
        opacity: 0.6,
    },
    signupButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    warningContainer: {
        backgroundColor: '#fff3cd',
        borderLeftWidth: 4,
        borderLeftColor: '#f57c00',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 4,
        marginTop: 10,
    },
    warningText: {
        color: '#856404',
        fontSize: 13,
        fontWeight: '500',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#e0e0e0',
    },
    dividerText: {
        marginHorizontal: 10,
        color: '#999',
        fontSize: 12,
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    loginText: {
        color: '#60735b',
        fontSize: 14,
    },
    loginLink: {
        color: '#2f6618fe',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default SignUp;
