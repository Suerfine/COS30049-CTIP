import apiClient from "../config/apiConfig";
import { API_ENDPOINTS } from "../config/ApiEndpoints";
import { UserRoles } from "../enum/UserRoles";
import { formatDate } from "../utils/formatDate";

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
    // POST: create new account
    create: async(userData)=>{
        try{
            const randomNum=Math.floor(100+Math.random()*900);
            const generatedUsername=`${userData.fname.replace(/\s+/g, '').toLowerCase()}${randomNum}`;

            const payload={
                username: generatedUsername,
                firstname:userData.fname,
                lastname:userData.lname,
                identification:userData.ic,
                personal_email:userData.email,
                tel:userData.telefon,
                role:userData.role=="parkguide" ? UserRoles.PARK_GUIDE : UserRoles.ADMIN,
                pfp: userData.image || null,
                password: userData.role=="parkguide" ? `SFC@${randomNum}` : 'admin',
            };

            const response=await apiClient.post(API_ENDPOINTS.USER.ACCOUNT, payload);
            return response.data;
        }catch(error){
            console.error("Create Account Error:", error);
            return Promise.reject(error);
        }
    },
};