import { Platform } from "react-native";

const getBaseUrl=()=>{
    if(Platform.OS === 'web'){
        return 'http://localhost:4000';
    }
    if(Platform.OS==='android'){
        return 'http://10.0.2.2:4000';
    }
};

export const API_BASE_URL=getBaseUrl();