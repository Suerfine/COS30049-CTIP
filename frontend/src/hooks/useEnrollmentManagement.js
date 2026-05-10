import { useState, useEffect, useCallback } from 'react';
import { enrollmentService } from '../services/EnrollmentService';
import { submissionService } from '../services/SubmissionService';

export const useEnrollmentManagement = () => {
    const [enrollments, setEnrollments] = useState([]);
    const [submissions, setSubmissions] = useState([]);

    const [loading, setLoading] = useState(false);

    // Enrollment
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const [currentStatus, setCurrentStatus] = useState('All');

    // Submission
    const [currentSubmissionPage, setSubmissionCurrentPage] = useState(1);
    const [submissionTotalPages, setSubmissionTotalPages] = useState(1);
    const [submissionTotalElements, setSubmissionTotalElements] = useState(0);
    const [submissionStatus, setSubmissionStatus] = useState('All');

    // Shared
    const [searchQuery, setSearchQuery] = useState('');
    const [courses, setCourses] = useState([]);

    // Sorting
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: 'asc'
    });
    const [sortSubmissionConfig, setSortSubmissionConfig] = useState({
        key: null,
        direction: 'asc'
    });
    // Audit
    const [auditData, setAuditData] = useState(null);
    const [auditLoading, setAuditLoading] = useState(false);
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [
                enrollData,
                submissionData,
                paymentData
            ] = await Promise.all([
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
                    submissionStatus,
                    sortSubmissionConfig
                ),
            ]);

            // Enrollment
            setEnrollments(enrollData.data || []);
            setCourses(enrollData.courses || []);
            setTotalPages(enrollData.totalPages || 1);
            setTotalElements(enrollData.totalElements || 0);

            // Submission
            setSubmissions(submissionData.data || []);
            setSubmissionTotalPages(submissionData.totalPages || 1);
            setSubmissionTotalElements(submissionData.totalElements || 0);

        } catch (err) {
            console.error("Fetch Error:", err);

            setEnrollments([]);
            setSubmissions([]);

        } finally {
            setLoading(false);
        }

    }, [
        currentPage,
        searchQuery,
        sortConfig,
        currentStatus,

        currentSubmissionPage,
        sortSubmissionConfig,
    ]);

    // Enrollment Status Update
    const handleUpdateStatus = async (
        enrollmentId,
        newStatus
    ) => {
        try {
            await enrollmentService.updateStatus(
                enrollmentId,
                newStatus
            );
            await fetchData();
            return { success: true };
        } catch (err) {
            const isBadRequest =
                err.response?.status === 400;
            const errorMessage = isBadRequest
                ? "Action cannot be repeated."
                : (
                    err.response?.data?.message ||
                    "Failed to update enrollment."
                );
            return {
                success: false,
                error: errorMessage
            };
        }
    };

    
    // Delete Enrollment
    const deleteRecord = async (enrollmentId) => {
        try {
            await enrollmentService.delete(enrollmentId);
            await fetchData();
            return { success: true };
        } catch (err) {
            console.error("Delete Error:", err);
            return {
                success: false,
                error: err.message
            };
        }
    };
    // Enrollment Audit
    const fetchEnrollmentAudit = async (id) => {
        setAuditLoading(true);
        try {
            const data =
                await submissionService.getEnrollmentAudit(id);
            setAuditData(data);
        } catch (err) {
            console.error(err);
        } finally {
            setAuditLoading(false);
        }
    };
    // Sorting
    const requestSort = (key) => {
        let direction = 'asc';
        if (
            sortConfig.key === key &&
            sortConfig.direction === 'asc'
        ) {
            direction = 'desc';
        }
        setSortConfig({
            key,
            direction
        });
    };
    const resetSort = () => {
        setSortConfig({
            key: null,
            direction: 'asc'
        });
        setSortSubmissionConfig({
            key: null,
            direction: 'asc'
        });
        setPaymentSortConfig({
            key: null,
            direction: 'asc'
        });
    };
    useEffect(() => {
        fetchData();
    }, [fetchData]);
    return {
        // Data
        enrollments,
        submissions,
        courses,
        // Loading
        loading,
        // Search
        searchQuery,
        setSearchQuery,
        // Enrollment
        currentPage,
        setCurrentPage,
        totalPages,
        totalElements,
        currentStatus,
        setCurrentStatus,
        // Submission
        currentSubmissionPage,
        setSubmissionCurrentPage,
        submissionTotalPages,
        submissionTotalElements,
        submissionStatus,
        // Sorting
        sortConfig,
        setSortConfig,
        sortSubmissionConfig,
        setSortSubmissionConfig,
        requestSort,
        resetSort,
        // Actions
        refresh: fetchData,
        handleUpdateStatus,
        deleteRecord,
        // Audit
        auditData,
        auditLoading,
        fetchEnrollmentAudit
    };
};