import {useState, useEffect} from 'react';
import { AccountService} from '../services/AccountService';

export const useAccountManagement=()=>{
    const [accounts, setAccounts]=useState([]);
    
    // Fetch all accounts
    const fetchAccounts=async()=>{
        try{
            const response=await AccountService.getAll();
            const rawUsers=Array.isArray(response) ? response : (response.data || response.users || []);
            const initializedData=rawUsers.map(u=>({...u, selected:false}));
            setAccounts(initializedData);
        }catch(err){
            console.log("Failed to fetch all users: ",err);
            setAccounts([]);
        }
    };
    
    useEffect(()=>{
        fetchAccounts();
    },[]);

    return{
        accounts, refresh: fetchAccounts
    };
}