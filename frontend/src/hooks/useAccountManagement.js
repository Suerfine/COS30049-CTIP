import {useState, useEffect} from 'react';
import { AccountService} from '../services/AccountService';
import { RegisterService } from '../services/RegisterService';

export const useAccountManagement=()=>{
    const [accounts, setAccounts]=useState([]);
    
    // Fetch all accounts
    const fetchAccounts=async()=>{
        try{
            const [regData, accData]=await Promise.all([
                RegisterService.getAll(),
                AccountService.getAll()
            ]);

            // Join registration and accounts details
            const detailedAcc=accData.map(acc=>{
                const userDetail=regData.find(u=>u.id===acc.reg_id);

                return {
                    id:acc.id,
                    reg_id:acc.reg_id,
                    fullName:userDetail ? `${userDetail.fname} ${userDetail.lname}` : 'N/A',
                    ic:userDetail ? `${userDetail.ic}` : 'N/A',
                    telephone: userDetail?.telefon || 'N/A',
                    username: userDetail ? `${userDetail.username}` : 'Unknown',
                    workEmail: userDetail ? `${userDetail.username}@example.com` : 'N/A',
                    joinedDate: acc.joinedDate,
                    lastLogin: acc.lastLogin,
                    profileImage: userDetail?.profileImage || null
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