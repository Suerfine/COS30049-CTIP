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

const apiClient=axios.create({
    baseURL: BASE_URL(),
    headers:{
        'Content-Type':'application/json',
    },
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

