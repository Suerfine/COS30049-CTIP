import {useState, useEffect} from 'react';
import { RegisterService} from '../services/RegisterService';

export const useRegisterManagement=()=>{
    const [users, setUsers]=useState([]);
    const [loading, setLoading]=useState(false);

    // Fetch all users
    const fetchUsers=async()=>{
        setLoading(true);
        try{
            const response=await RegisterService.getAll();
            const rawUsers=Array.isArray(response) ? response : (response.data || response.registrations || []);
            const initializedData=rawUsers.map(u=>({...u, selected:false}));
            setUsers(initializedData);
        }catch(err){
            console.log("Failed to fetch all users: ",err);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(()=>{
        fetchUsers();
    },[]);

    return {
        users,
        loading,
        refresh:fetchUsers
    }
}