import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';

const AUTH_USER_KEY = 'sfc_current_user';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        const bootstrapAuth = async () => {
            try {
                const rawUser = await AsyncStorage.getItem(AUTH_USER_KEY);
                if (rawUser) {
                    setCurrentUser(JSON.parse(rawUser));
                }
            } catch (error) {
                console.error('Failed to load auth user:', error);
            } finally {
                setAuthLoading(false);
            }
        };

        bootstrapAuth();
    }, []);

    const login = async (email, password) => {
        const payload = await authService.login(email, password);
        const user = payload?.user || null;

        if (!user) {
            throw new Error('Invalid login response');
        }

        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
        setCurrentUser(user);
        return user;
    };

    const logout = async () => {
        await AsyncStorage.removeItem(AUTH_USER_KEY);
        setCurrentUser(null);
    };

    const value = useMemo(() => ({
        currentUser,
        authLoading,
        login,
        logout,
    }), [currentUser, authLoading]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }

    return context;
};
