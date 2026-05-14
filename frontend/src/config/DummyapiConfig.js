import { Platform } from "react-native";
import Constants from 'expo-constants';

const httpsEnabled = process.env.EXPO_PUBLIC_HTTPS_ENABLED?.trim().toLowerCase() !== 'false';
const PROTOCOL = httpsEnabled ? 'https' : 'http';

const getBaseUrl=()=>{
    const hostFromExpo=Constants?.expoConfig?.hostUri?.split(':')?.[0];
    const API_PORT = 4000;
    if(Platform.OS==='android'){
        const host = hostFromExpo || '10.0.2.2';
        return `${PROTOCOL}://${host}:${API_PORT}`;
    }
    const host = hostFromExpo || 'localhost';
    return `${PROTOCOL}://${host}:${API_PORT}`;
};

export const API_BASE_URL=getBaseUrl();