import React, {useState} from 'react';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { UserRoles } from '../enum/UserRoles';
// Import other hook and service
import { useAuth } from '../context/AuthContext';

export const useLogin=()=>{
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [loginError, setLoginError] = useState('');
    const { login } = useAuth();

    const navigation=useNavigation();

    const handleLogin = async () => {
        if (!email || !password) {
            setLoginError('* Please fill in all fields');
            return;
        }

        setLoginError('');
        setLoading(true); 

        try {
            const result = await login(email, password);
            if (result?.requires_totp) {
                navigation.navigate('TotpVerify', {
                    totp_session_token: result.totp_session_token,
                    email: result.email,
                });
            }
        } catch (err) {
            setLoginError(err.message || '* Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return {
        email, setEmail,
        password, setPassword,
        loading, setLoading,
        loginError, setLoginError,
        login, handleLogin  
    }
}