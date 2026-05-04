import {useState, useEffect, useCallback} from 'react';
import { enrollmentService } from '../services/EnrollmentService';
import {submissionService} from '../services/SubmissionService';

export const useEnrollmentManagement=()=>{
    const [enrollments, setEnrollments]=useState([]);
    const [submissions, setSubmissions]=useState([]);
    const [loading, setLoading]=useState(false);
    const [totalPages, setTotalPages]=useState(1);
    const [searchQuery, setSearchQuery]=useState('');
    const [sortConfig, setSortConfig]=useState({
        key:null,
        direction:'asc'
    });
    const [currentPage, setCurrentPage]=useState(1);
    const [currentStatus, setCurrentStatus]=useState('All');
    const [totalElements, setTotalElements] = useState(0);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [enrollData, submissionData] = await Promise.all([
                enrollmentService.getAll(currentPage, 10, searchQuery, sortConfig, currentStatus),
                submissionService.getAll()
            ]);

            setEnrollments(enrollData.data || []); 
            setTotalPages(enrollData.totalPages || 1);
            setTotalElements(enrollData.totalElements || 0);
            
            setSubmissions(submissionData);
        } catch (err) {
            console.error("Fetch Error:", err);
            setEnrollments([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchQuery, sortConfig, currentStatus]);

    const handleUpdateStatus = async (enrollmentId, newStatus) => {
        try {
            await enrollmentService.updateStatus(enrollmentId, newStatus);
            await fetchData();
            return { success: true };
        } catch (err) {
            console.error("Status Update Error:", err);
            return { success: false, error: err.message };
        }
    };

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


    useEffect(()=>{
        fetchData();
    },[fetchData]);
    
    return {enrollments, submissions, loading, refresh: fetchData, updateStatus: handleUpdateStatus,
        currentPage,
        setCurrentPage,
        totalPages,
        totalElements,
        searchQuery,
        setSearchQuery,
        currentStatus,
        setCurrentStatus,
        sortConfig,
        setSortConfig,
        requestSort,resetSort
    };
};