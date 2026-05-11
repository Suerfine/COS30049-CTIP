import { useState, useEffect, useCallback } from 'react';
import { enrollmentService } from '../services/EnrollmentService';

export const useEnrollmentManagement = () => {
    const [enrollments, setEnrollments] = useState([]);
    const [courses, setCourses] = useState([]);

    const [loading, setLoading] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    // Filters
    const [currentStatus, setCurrentStatus] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Sorting
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: 'asc'
    });

    const fetchEnrollments = useCallback(async () => {
        setLoading(true);

        try {
            const enrollData = await enrollmentService.getAll(
                currentPage,
                10,
                searchQuery,
                sortConfig,
                currentStatus
            );

            setEnrollments(enrollData.data || []);
            setCourses(enrollData.courses || []);
            setTotalPages(enrollData.totalPages || 1);
            setTotalElements(enrollData.totalElements || 0);

        } catch (err) {
            console.error("Enrollment Fetch Error:", err);

            setEnrollments([]);
            setCourses([]);

        } finally {
            setLoading(false);
        }

    }, [
        currentPage,
        searchQuery,
        sortConfig,
        currentStatus
    ]);

    // Update Status
    const handleUpdateStatus = async (
        enrollmentId,
        newStatus
    ) => {
        try {
            await enrollmentService.updateStatus(
                enrollmentId,
                newStatus
            );

            await fetchEnrollments();

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

    // Delete
    const deleteRecord = async (enrollmentId) => {
        try {
            await enrollmentService.delete(enrollmentId);

            await fetchEnrollments();

            return { success: true };

        } catch (err) {
            console.error("Delete Error:", err);

            return {
                success: false,
                error: err.message
            };
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
    };

    useEffect(() => {
        fetchEnrollments();
    }, [fetchEnrollments]);

    return {
        enrollments,
        courses,
        loading,
        searchQuery,
        setSearchQuery,
        currentPage,
        setCurrentPage,
        totalPages,
        totalElements,
        currentStatus,
        setCurrentStatus,
        sortConfig,
        setSortConfig,
        requestSort,
        resetSort,
        refreshEnrollments: fetchEnrollments,
        handleUpdateStatus,
        deleteRecord
    };
};