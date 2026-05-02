import apiClient from "../config/apiConfig";
import { API_ENDPOINTS } from "../config/ApiEndpoints";

export const AccountService={
    // GET: fetch all accounts
    getAll: async(page=1, size=10)=>{
        try{
            const params={
                page, size
            };
            const response=await apiClient.get(API_ENDPOINTS.USER.ACCOUNT,{params});
            return response.data;
        } catch(error){
            console.error('Get Account Error:', error);
            throw error;
        }
    },
    // // POST: create new account
    // create: async(userData)=>{
    //     try{
    //         const response=await fetch(API_ENDPOINTS.USER.ACCOUNT, {
    //             method:'POST',
    //             headers:{
    //                 'Content-Type':'application/json',
    //             },
    //             body: JSON.stringify(userData),
    //         });
    //         const data=await response.json();
    //         if(!response.ok){
    //             throw new Error(data.message || 'Failed to create account');
    //         }
    //         return data;
    //     }catch(error){
    //         console.error("Create Account Error:", error);
    //         throw error;
    //     }
    // },
};