import {useState, useEffect} from 'react';
import { AccountService} from '../services/AccountService';

export const useAccountManagement=()=>{
    const [accounts, setAccounts]=useState([]);
    const [currentPage, setCurrentPage]=useState(1);
    const [totalPages, setTotalPages]=useState(1);
    const [totalUsers, setTotalUsers]=useState(0);
    const [selectedUser, setSelectedUser]=useState(null);
    const [searchQuery, setSearchQuery]=useState('');
    
    // Fetch all accounts
    const fetchAccounts=async()=>{
        try{
            const response=await AccountService.getAll(currentPage, 10, searchQuery);
            const rawUsers=Array.isArray(response) ? response : (response.data || response.users || []);
            const initializedData=rawUsers.map(u=>({...u, selected:false}));
            setAccounts(initializedData);
            setTotalUsers(response.totalElements);
            setTotalPages(response.totalPages);
        }catch(err){
            console.log("Failed to fetch all users: ",err);
            setAccounts([]);
        }
    };
    
    useEffect(()=>{
        fetchAccounts();
    },[currentPage,searchQuery]);

    const handleSearch=(query)=>{
        setSearchQuery(query);
        setCurrentPage(1);
    }

    return{
        accounts, refresh: fetchAccounts,
        currentPage, setCurrentPage,
        totalPages, totalUsers,
        selectedUser,setSelectedUser,
        handleSearch, searchQuery
    };
}