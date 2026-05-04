import {useState, useEffect, useCallback} from 'react';
import { enrollmentService } from '../services/EnrollmentService';
import {submissionService} from '../services/SubmissionService';

export const useEnrollmentManagement=()=>{
    const [enrollments, setEnrollments]=useState([]);
    const [submissions, setSubmissions]=useState([]);
    const [loading, setLoading]=useState(false);

    const fetchData=useCallback(async()=>{
        setLoading(true);
        try{
            const [enrollData, submissionData]=await Promise.all([
                enrollmentService.getAll(),
                submissionService.getAll()
            ]);
            setEnrollments(enrollData);
            setSubmissions(submissionData);
        }catch(err){
            console.error("Fetch Error:",err);
        }finally{
            setLoading(false);
        }
    },[]);

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

    useEffect(()=>{
        fetchData();
    },[fetchData]);
    
    return {enrollments, submissions, loading, refresh: fetchData, updateStatus: handleUpdateStatus};
};