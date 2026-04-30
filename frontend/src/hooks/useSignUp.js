import React, {useState} from 'react';
import * as DocumentPicker from 'expo-document-picker';

// Import other hook and service

export const useSignUp=()=>{
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole]=useState('guide');
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [file, setFile]=useState(null);

    // // Password strength calculation
    // const calculatePasswordStrength = (pwd) => {
    //     if (!pwd) return { score: 0, label: '', color: '#999' };

    //     let score = 0;
    //     if (pwd.length >= 8) score++;
    //     if (pwd.length >= 12) score++;
    //     if (/[a-z]/.test(pwd)) score++;
    //     if (/[A-Z]/.test(pwd)) score++;
    //     if (/[0-9]/.test(pwd)) score++;
    //     if (/[^a-zA-Z0-9]/.test(pwd)) score++;

    //     if (score <= 2) return { score: 1, label: 'Weak', color: '#d32f2f' };
    //     if (score <= 4) return { score: 2, label: 'Medium', color: '#f57c00' };
    //     return { score: 3, label: 'Strong', color: '#2f6618fe' };
    // };

    // const passwordStrength = calculatePasswordStrength(password);

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
    
    // Resume upload
    const handleUpload=async()=>{
        try{
            const result=await DocumentPicker.getDocumentAsync({
                type:['application/pdf'],
                copyToCacheDirectory:true,
            });

            if(!result.canceled){
                setFile(result.assets[0]);
            }
        }catch(err){
            Alert.alert('Error', 'Failed to pick a document');
        }
    };

    const removeFile=()=>setFile(null);

    return{
        name, setName,
        email, setEmail,
        role,setRole,
        password, setPassword,
        confirmPassword,setConfirmPassword,
        showPassword,setShowPassword,
        showConfirmPassword, setShowConfirmPassword,
        loading,setLoading,
        isValidEmail,
        validateForm,
        handleSignUp,
        file,setFile,
        handleUpload, removeFile
    }
}