import React, {useState} from 'react';

// Import other hook and service
import { useAuth } from '../context/AuthContext';

export const useLogin=()=>{
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [loginError, setLoginError] = useState('');
    const { login } = useAuth();

    const handleLogin = async () => {
        if (!email || !password) {
            setLoginError('* Please fill in all fields');
            return;
        }

        setLoginError('');
        setLoading(true);
        try {
            const user = await login(email, password);
            const nextRoute = user?.role === 'admin' ? 'Course Management' : 'User Dashboard';
            const roleLabel = user?.role === 'admin' ? 'Admin' : 'Park Ranger';

            Alert.alert('Success', `Login successful as ${roleLabel}.`);
            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: nextRoute }],
                })
            );
        } catch (error) {
            setLoginError(error?.message || 'Login failed. Please try again.');
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