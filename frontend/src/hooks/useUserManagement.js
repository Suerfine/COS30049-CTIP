import {useState, useEffect} from 'react';
import { userService } from '../services/userService';

export const useUserManagement=()=>{
    const [users, setUsers]=useState([]);
    const [loading, setLoading]=useState(true);

    // Fetch all users
    const fetchUsers=async()=>{
        try{
            const data=await userService.getAll();
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
    }
}