import {useState, useEffect} from 'react';
import { AccountService} from '../services/AccountService';
import { RegisterService } from '../services/RegisterService';

export const useAccountManagement=()=>{
    const [accounts, setAccounts]=useState([]);
    
    // Fetch all accounts
    const fetchAccounts=async()=>{
        try{
            const [regResponse, accResponse]=await Promise.all([
                RegisterService.getAll(),
                AccountService.getAll()
            ]);
            
            const regList=regResponse.data || (Array.isArray(regResponse) ? regResponse : []);
            const accList=accResponse.data || (Array.isArray(accResponse) ? accResponse : []);

            // Join registration and accounts details
            const detailedAcc=accList.map(acc=>{
                const userDetail=regList.find(u=>u.user_id===acc.id);

                return {
                    id:acc.id,
                    reg_id:acc.id,
                    fullName: userDetail 
                    ? `${userDetail.firstname} ${userDetail.lastname}` 
                    : 'Unknown Name',
                    ic:userDetail ? `${userDetail.identification}` : 'N/A',
                    telephone: userDetail?.tel || 'N/A',
                    username: acc.username,
                    workEmail: `${acc.username}@example.com`,
                    joinedDate: acc.created_at,
                    lastLogin: acc?.last_login_at || "N/A",
                    profileImage: userDetail?.profileImage || null,
                    personal_email: userDetail?.personal_email || 'N/A'
                };
            });
            setAccounts(detailedAcc);
        }catch(err){
            console.error("Failed to fetch all accounts' details:", err);
        }
    };

    useEffect(()=>{
        fetchAccounts();
    },[]);

    return{
        accounts, refresh: fetchAccounts
    };
}