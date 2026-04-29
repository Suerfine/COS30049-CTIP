import Constants from 'expo-constants';
import { Platform } from 'react-native';

const hostFromExpo = Constants?.expoConfig?.hostUri?.split(':')?.[0];
const defaultHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const API_HOST = hostFromExpo || defaultHost;
const BASE_URL = `http://${API_HOST}:5000/api`;

const decodeJwtPayload = (token) => {
    const tokenParts = String(token || '').split('.');
    if (tokenParts.length !== 3) {
        return {};
    }

    const normalized = tokenParts[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');

    if (typeof globalThis.atob !== 'function') {
        return {};
    }

    try {
        const payloadJson = globalThis.atob(padded);
        return JSON.parse(payloadJson);
    } catch {
        return {};
    }
};

export const authService = {
    async login(email, password) {
        let response;
        try {
            response = await fetch(`${BASE_URL}/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    personal_email: email,
                    password,
                }),
            });
        } catch {
            throw new Error('Unable to connect to server. Please check backend is running.');
        }

        let data = null;
        try {
            data = await response.json();
        } catch {
            data = null;
        }

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Incorrect email or password');
            }

            throw new Error(data?.message || 'Login failed');
        }

        const payload = decodeJwtPayload(data?.access_token);

        return {
            access_token: data.access_token,
            token_type: data.token_type,
            user: {
                id: payload?.id,
                role: payload?.role || 'parkguide',
                personal_email: email,
            },
        };
    },
};
