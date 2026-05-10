import {useState, useEffect, useCallback} from 'react';
import { enrollmentService } from '../services/EnrollmentService';
import { submissionService } from '../services/SubmissionService';
import { paymentService } from '../services/PaymentService';

export const useEnrollmentManagement=()=>{
    const [enrollments, setEnrollments]=useState([]);
    const [submissions, setSubmissions]=useState([]);
    const [payments, setPayments]=useState([]);
    const [paymentTotalPages, setPaymentTotalPages] = useState(1);
    const [paymentTotalElements, setPaymentTotalElements] = useState(0);
    const [currentPaymentPage, setPaymentCurrentPage] = useState(1);
    const [loading, setLoading]=useState(false);
    const [totalPages, setTotalPages]=useState(1);
    const [searchQuery, setSearchQuery]=useState('');
    const [sortConfig, setSortConfig]=useState({
        key:null,
        direction:'asc'
    });
    const [sortSubmissionConfig, setSortSubmissionConfig]=useState({
        key:null,
        direction:'asc'
    });
    const [currentPage, setCurrentPage]=useState(1);
    const [currentSubmissionPage, setSubmissionCurrentPage]=useState(1);
    const [currentStatus, setCurrentStatus]=useState('All');
    const [currentSubmissionStatus, setCurrentSubmissionStatus]=useState('All');
    const [totalElements, setTotalElements] = useState(0);
    const [courses, setCourses] = useState([]);
    const [submissionTotalPages, setSubmissionTotalPages]=useState(1);
    const [submissionTotalElements, setSubmissionTotalElements]=useState(0);
    const [auditData, setAuditData] = useState(null);
    const [auditLoading, setAuditLoading] = useState(false);


    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [enrollData, submissionData] = await Promise.all([
                enrollmentService.getAll(
                    currentPage, 
                    10, 
                    searchQuery, 
                    sortConfig, 
                    currentStatus
                ),
                submissionService.getSummaries(
                    currentSubmissionPage,
                    10,
                    searchQuery,
                    currentSubmissionStatus,
                    sortSubmissionConfig
                ),
                paymentService.getAll(
                    currentPaymentPage,
                    10,
                    searchQuery
                )
            ]);

            setEnrollments(enrollData.data || []); 
            setCourses(enrollData.courses);
            setTotalPages(enrollData.totalPages || 1);
            setTotalElements(enrollData.totalElements || 0);
            
            setSubmissions(submissionData.data || []);
            setSubmissionTotalPages(submissionData.totalPages || 1);
            setSubmissionTotalElements(submissionData.totalElements || 0);

            setPayments(paymentData.data || []);
            setPaymentTotalPages(paymentData.totalPages || 1);
            setPaymentTotalElements(paymentData.totalElements || 0);
        } catch (err) {
            console.error("Fetch Error:", err);
            setEnrollments([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchQuery, sortConfig, currentStatus, currentSubmissionPage, sortSubmissionConfig, currentSubmissionStatus, currentPaymentPage]);

    const handleUpdateStatus = async (enrollmentId, newStatus) => {
        try {
            await enrollmentService.updateStatus(enrollmentId, newStatus);
            console.log(enrollmentId);
            console.log(newStatus);
            await fetchData();
            return { success: true };
        } catch (err) {
            const isBadRequest = err.response?.status === 400;
            const errorMessage = isBadRequest 
                ? "Action cannot be done. Cannot repeat same action." 
                : (err.response?.data?.message || "Failed to update status.");

            return { 
                success: false, 
                error: errorMessage 
            };
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

    const deleteRecord = async (enrollmentId) => {
        try {
            await enrollmentService.delete(enrollmentId);
            await fetchData();
            return { success: true };
        } catch (err) {
            console.error("Delete Error:", err);
            return { success: false, error: err.message };
        }
    };

    const fetchEnrollmentAudit = async (id) => {
        setAuditLoading(true);
        try {
            const data = await submissionService.getEnrollmentAudit(id);
            setAuditData(data);
        } catch (err) {
            window.alert("Failed to fetch enrollment audit details.");
        } finally {
            setAuditLoading(false);
        }
    };


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
        requestSort,resetSort,
        handleUpdateStatus,
        deleteRecord,
        courses,
        submissionTotalPages, submissionTotalElements,
        currentSubmissionPage, setSubmissionCurrentPage,
        auditData, auditLoading, fetchEnrollmentAudit,
        payments, paymentTotalPages, paymentTotalElements, currentPaymentPage, setPaymentCurrentPage,
    };
};