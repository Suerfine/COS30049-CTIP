import apiClient from "../config/apiConfig";
import { API_ENDPOINTS } from "../config/ApiEndpoints";

export const AccountService={
    // GET: fetch all accounts
    getAll: async(page=1, size=10, searchQuery='', sortConfig)=>{
        try{
            const q = searchQuery.trim();
            const params = { page, size };
            if (q) {
                params.filter = `
                    firstname like "%${q}%"
                    or lastname like "%${q}%"
                    or identification like "%${q}%"
                    or personal_email like "%${q}%"
                    or tel like "%${q}%"
                    or username like "%${q}%"
                    `;
            }

            if(sortConfig?.key){
                params.orderBy=`${sortConfig.key} ${sortConfig.direction}`;
            }
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