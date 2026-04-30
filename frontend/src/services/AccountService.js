import { API_ENDPOINTS } from "../config/apiConfig";

export const AccountService={
    // GET: fetch all accounts
    getAll: async()=>{
        try{
            const response=await fetch(API_ENDPOINTS.USER.ACCOUNT,{
                method:'GET',
                headers:{
                    'Content-Type':'application/json',
                },
            });
            const data=await response.json();

            if(!response.ok){
                throw new Error(data.message || 'Failed to fetch account records');
            }

            return data;
        } catch(error){
            console.error('Get Account Error:', error);
            throw error;
        }
    },
    // POST: create new account
    create: async(userData)=>{
        try{
            const response=await fetch(API_ENDPOINTS.USER.ACCOUNT, {
                method:'POST',
                headers:{
                    'Content-Type':'application/json',
                },
                body: JSON.stringify(userData),
            });
            const data=await response.json();
            if(!response.ok){
                throw new Error(data.message || 'Failed to create account');
            }
            return data;
        }catch(error){
            console.error("Create Account Error:", error);
            throw error;
        }
    },
};