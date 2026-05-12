import { useState, useEffect, useCallback } from 'react';
import { submissionService } from '../services/SubmissionService';

export const useSubmissionManagement = () => {
    const [submissions, setSubmissions] = useState([]);

    const [loading, setLoading] = useState(false);

    // Pagination
    const [currentSubmissionPage, setSubmissionCurrentPage] = useState(1);
    const [submissionTotalPages, setSubmissionTotalPages] = useState(1);
    const [submissionTotalElements, setSubmissionTotalElements] = useState(0);

    // Filters
    const [submissionStatus, setSubmissionStatus] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Sorting
    const [sortSubmissionConfig, setSortSubmissionConfig] = useState({
        key: null,
        direction: 'asc'
    });

    // Audit
    const [auditData, setAuditData] = useState(null);
    const [auditLoading, setAuditLoading] = useState(false);

    const fetchSubmissions = useCallback(async () => {
        setLoading(true);

        try {
            const submissionData =
                await submissionService.getSummaries(
                    currentSubmissionPage,
                    10,
                    searchQuery,
                    submissionStatus,
                    sortSubmissionConfig
                );

            setSubmissions(
                (submissionData.data || [])
            );
            setSubmissionTotalPages(
                submissionData.totalPages || 1
            );
            setSubmissionTotalElements(
                submissionData.totalElements || 0
            );

        } catch (err) {
            console.error("Submission Fetch Error:", err);

            setSubmissions([]);

        } finally {
            setLoading(false);
        }

    }, [
        currentSubmissionPage,
        searchQuery,
        submissionStatus,
        sortSubmissionConfig
    ]);

    // Audit
    const fetchEnrollmentAudit = async (id) => {
        setAuditLoading(true);

        try {
            const data =
                await submissionService.getEnrollmentAudit(id);

            setAuditData(data);

        } catch (err) {
            console.error("Audit Fetch Error:", err);

        } finally {
            setAuditLoading(false);
        }
    };

    // Sorting
    const requestSubmissionSort = (key) => {
        let direction = 'asc';

        if (
            sortSubmissionConfig.key === key &&
            sortSubmissionConfig.direction === 'asc'
        ) {
            direction = 'desc';
        }

        setSortSubmissionConfig({
            key,
            direction
        });
    };

    const resetSubmissionSort = () => {
        setSortSubmissionConfig({
            key: null,
            direction: 'asc'
        });
    };

    useEffect(() => {
        fetchSubmissions();
    }, [fetchSubmissions]);

    return {
        submissions,
        loading,
        searchQuery,
        setSearchQuery,
        currentSubmissionPage,
        setSubmissionCurrentPage,
        submissionTotalPages,
        submissionTotalElements,
        submissionStatus,
        setSubmissionStatus,
        sortSubmissionConfig,
        setSortSubmissionConfig,
        requestSubmissionSort,
        resetSubmissionSort,
        auditData,
        auditLoading,
        fetchEnrollmentAudit,
        refreshSubmissions: fetchSubmissions, resetSubmissionSort
    };
};