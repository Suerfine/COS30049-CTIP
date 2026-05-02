import {useState, useEffect} from 'react';
import { AccountService} from '../services/AccountService';
import { Alert } from 'react-native';

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
    const [loading, setLoading]=useState(false);
    
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

    const handleCreateAccount=async (formData)=>{
        if (!formData.fname || !formData.email || !formData.ic || !formData.telefon) {
            return {
                success: false,
                errors: {
                    fname: !formData.fname ? "First name required" : "",
                    email: !formData.email ? "Email required" : "",
                    ic: !formData.ic ? "IC required" : "",
                    telefon: !formData.telefon ? "Phone required" : ""
                }
            };
        }
        setLoading(true);
        try{
            await AccountService.create(formData);
            Alert.alert("Success", "Account created successfully.");

            return {success:true};
        } catch(err){
           const message = err.response?.data?.message || "";
            if (err.response?.status === 500) {
                return {
                    success: false,
                    errors: {
                        email: "Email already exists"
                    }
                };
            }
            return {
                success: false,
                errors: {
                    general: message || "Something went wrong"
                }
            };

        }finally{
            setLoading(false);
        }
    };


    return{
        accounts,
        currentPage, setCurrentPage,
        totalPages, totalUsers,
        selectedUser,setSelectedUser,
        handleSearch, searchQuery,
        sortConfig, requestSort, resetSort,
        handleCreateAccount, loading,
        refresh:fetchAccounts
    };
}