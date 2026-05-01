import {useState, useEffect} from 'react';
import { RegisterService} from '../services/RegisterService';
import { AccountService } from '../services/AccountService';

export const useRegisterManagement=()=>{
    const [users, setUsers]=useState([]);
    const [loading, setLoading]=useState(false);
    const [isCreating, setIsCreating]=useState(false);
    const [currentPage, setCurrentPage]=useState(1);
    const [totalPages, setTotalPages]=useState(1);
    const [totalUsers, setTotalUsers]=useState(0);

    // Fetch all users
    const fetchUsers=async()=>{
        setLoading(true);
        try{
            const response=await RegisterService.getAll(currentPage,10);
            const rawUsers=Array.isArray(response) ? response : (response.data || response.registrations || []);
            const initializedData=rawUsers.map(u=>({...u, selected:false}));
            setUsers(initializedData);
            setTotalUsers(response.totalElements);
            setTotalPages(response.totalPages);
        }catch(err){
            console.log("Failed to fetch all users: ",err);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(()=>{
        fetchUsers();
    },[currentPage]);

    const handleCreateUser=async(formData)=>{
        setIsCreating(true);
        try{
            const generatedUsername=`${formData.firstname.toLowerCase().trim()}${formData.identification.slice(-4)}`
            const generatedPassword="Password";
            const payload={
                username:generatedUsername,
                password:generatedPassword,
                firstname:formData.firstname,
                lastname:formData.lastname,
                role: 'park_guide',
                identification: formData.identification,
                personal_email: formData.personal_email,
            };

            await AccountService.create(payload);
            await fetchUsers();
            return{
                success:true,
                username: generatedUsername,
                password: generatedPassword,
            };
            
        }catch(err){
            console.error("Create Account Error:", err);
            throw err;
        }finally{
            setIsCreating(false);
        }
    }

    return {
        users,
        loading,
        refresh:fetchUsers,
        isCreating,setIsCreating,
        handleCreateUser,
        currentPage, setCurrentPage,
        totalPages, totalUsers
    }
}