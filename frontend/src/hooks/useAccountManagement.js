import {useState, useEffect} from 'react';
import { AccountService} from '../services/AccountService';

export const useAccountManagement=()=>{
    const [accounts, setAccounts]=useState([]);
    const [currentPage, setCurrentPage]=useState(1);
    const [totalPages, setTotalPages]=useState(1);
    const [totalUsers, setTotalUsers]=useState(0);
    const [selectedUser, setSelectedUser]=useState(null);
    const [searchQuery, setSearchQuery]=useState('');
    const [sortConfig, setSortConfig]=useState({
        key:null,
        direction:'asc'
    })
    
    // Fetch all accounts
    const fetchAccounts=async()=>{
        try{
            const response=await AccountService.getAll(currentPage, 10, searchQuery, sortConfig);
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
    },[currentPage,searchQuery, sortConfig]);

    const handleSearch=(query)=>{
        setSearchQuery(query);
        setCurrentPage(1);
    }

    const requestSort=(key)=>{
        let direction="asc";

         if(sortConfig.key===key && sortConfig.direction ==='asc'){
            direction='desc';
        }

        setSortConfig({key,direction});
    }

    const resetSort=()=>{
        setSortConfig({key:null, direction:'asc'});
    }

    return{
        accounts, refresh: fetchAccounts,
        currentPage, setCurrentPage,
        totalPages, totalUsers,
        selectedUser,setSelectedUser,
        handleSearch, searchQuery,
        sortConfig, requestSort, resetSort
    };
}