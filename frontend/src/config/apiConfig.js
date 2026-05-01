import {Platform} from "react-native";
import axios from 'axios';
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL=()=>{
    if(Platform.OS==='web'){
        return 'http://localhost:5000/api';
    }
    if(Platform.OS==='android'){
        return 'http://10.0.2.2:5000/api';
    }
    return 'http://localhost:5000/api';
}

export const API_ENDPOINTS={
    USER:{
        SIGNUP: `${BASE_URL()}/registrations`,
        ACCOUNT: `${BASE_URL()}/users`,
    }
};