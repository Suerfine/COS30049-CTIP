import {Platform} from "react-native";
import axios from 'axios';
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from 'expo-constants';

const BASE_URL=()=>{
    const hostFromExpo=Constants?.expoConfig?.hostUri?.split(':')?.[0];
    const defaultHost=Platform.OS==='android' ? '10.0.2.2': 'localhost';
    const API_HOST=hostFromExpo || defaultHost;
    return `http://${API_HOST}:5000/api`;
}

const apiClient=axios.create({
    baseURL: BASE_URL()
});

apiClient.interceptors.request.use(async (config)=>{
    try{
        const token=await AsyncStorage.getItem("accessToken");
        if(token){
            config.headers.Authorization=`Bearer ${token}`;
        }
    }catch(err){
        console.error("Token retrieval error", err);
    }
    return config;
},(error)=>{
    return Promise.reject(error);
});

apiClient.interceptors.response.use(
    (response)=>response,
    async(error)=>{
        if(error.response && error.response.data.message==="jwt expired"){
            await AsyncStorage.multiRemove(["accessToken", "currentUser"]);
        }
        return Promise.reject(error);
    }
);

export default apiClient;

