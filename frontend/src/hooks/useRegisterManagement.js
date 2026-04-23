import {useState, useEffect} from 'react';
import { RegisterService} from '../services/RegisterService';

export const useRegisterManagement=()=>{
    const [users, setUsers]=useState([]);
    const [loading, setLoading]=useState(false);

    // Fetch all users
    const fetchUsers=async()=>{
        try{
            const data=await RegisterService.getAll();
            const initializedData=data.map(u=>({...u, selected:false}));
            setUsers(initializedData);
        }catch(err){
            console.log("Failed to fetch all users: ",err);
        }
    };

    useEffect(()=>{
        fetchUsers();
    },[]);

    return {
        users,
        loading,
    }
}