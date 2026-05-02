import apiClient from "../config/apiConfig";
import { API_ENDPOINTS } from "../config/ApiEndpoints";

export const RegisterService={
    // GET: fetch all registration
    getAll: async(page=1, size=10)=>{
        try{
            const params={
                page, size
            };
            const response=await apiClient.get(API_ENDPOINTS.USER.SIGNUP,{params});
            return response.data;
        } catch(error){
            const message = error.response?.data?.message || 'Failed to fetch registration records';
            throw new Error(message);
        }
    },

    // POST: Create new registration
    registerUser: async(userData)=>{
        try{
            const formData=new FormData();

            formData.append('firstname', userData.fname);
            formData.append('lastname', userData.lname);
            formData.append('identification', userData.ic);
            formData.append('personal_email', userData.email);
            formData.append('tel', userData.telephone);
            formData.appe

            if(userData.file){
                formData.append('file', {
                    uri:userData.file.uri,
                    name: userData.file.name,
                    type: userData.file.type || 'application/pdf',
                });
            }

            const response=await apiClient.post(API_ENDPOINTS.USER.SIGNUP, formData, {
                headers:{'Content-Type': 'multipart/form-data'}
            });
            return response.data;
        }catch(error){
            const message = error.response?.data?.message || 'Registration failed.';
            throw new Error(message);
        }
    },

    // POST: approve account
    approve:async (id)=>{
        try{
            const response=await apiClient.post(API_ENDPOINTS.ADMIN.APPROVE(id));
            return response.data;
        }catch(err){
            const message = err.response?.data?.message || "Check console for server error";
            console.error("Approve Error Status:", err.response?.status);
            throw new Error(message);
        }
    }

};