import {useState, useEffect} from 'react';
import { RegisterService} from '../services/RegisterService';
import { AccountService } from '../services/AccountService';

export const useRegisterManagement=()=>{
    const [users, setUsers]=useState([]);
    const [loading, setLoading]=useState(false);
    const [currentPage, setCurrentPage]=useState(1);
    const [totalPages, setTotalPages]=useState(1);
    const [isCreating, setIsCreating]=useState(false);
    const [totalUsers, setTotalUsers]=useState(0);
    const [selectedUser, setSelectedUser]=useState(null);
    const [searchQuery, setSearchQuery]=useState('');
    const [sortConfig, setSortConfig]=useState({
        key:null,
        direction:'asc'
    });
    const [currentStatus, setCurrentStatus]=useState('All');
    const [isRejecting,setIsRejecting]=useState(false);

    // Fetch all users
    const fetchUsers=async()=>{
        setLoading(true);
        try{
            const response=await RegisterService.getAll(currentPage,10,searchQuery,sortConfig,currentStatus);
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
    },[currentPage,searchQuery, sortConfig, currentStatus]);

    const handleCreateUser=async(formData)=>{
        setIsCreating(true);
        try{
           const result=await RegisterService.approve(formData.id);
           await fetchUsers();
           setSelectedUser(null);
            
           return{
            success:true,
            data:result
           };
        }catch(err){
            console.error("Create Account Error:", err);
            throw err;
        }finally{
            setIsCreating(false);
        }
    }

    const handleSearch=(query)=>{
        setSearchQuery(query);
        setCurrentPage(1);
    }

    const requestSort=(key)=>{
        let direction='asc';

        if(sortConfig.key===key && sortConfig.direction ==='asc'){
            direction='desc';
        }
        setSortConfig({key,direction});
    };

    const resetSort=()=>{
        setSortConfig({key:null, direction:'asc'});
    }

    const handleRejectUser = async (user, reason) => {
        if (!reason || reason.trim() === "") {
            alert("A rejection reason is required.");
            return { success: false };
        }

        setIsRejecting(true);
        try {
            await RegisterService.reject(user.id, reason);
            
            await fetchUsers(); 
            setSelectedUser(null);
            return { success: true };
        } catch (err) {
            alert(err);
            return { success: false };
        } finally {
            setIsRejecting(false);
        }
    };

    return {
        users,
        loading,
        refresh:fetchUsers,
        currentPage, setCurrentPage,
        totalPages, totalUsers,
        selectedUser,setSelectedUser,
        handleSearch, searchQuery,
        sortConfig, requestSort, resetSort,
        currentStatus, setCurrentStatus,
        isCreating,setIsCreating,
        handleCreateUser,
        isRejecting, handleRejectUser
    }
}