import { useState, useEffect, useCallback } from 'react';
import { paymentService } from '../services/PaymentService';

export const usePayment = (searchQuery = '') => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(false);

    // Pagination
    const [currentPaymentPage, setPaymentCurrentPage] = useState(1);
    const [paymentTotalPages, setPaymentTotalPages] = useState(1);
    const [paymentTotalElements, setPaymentTotalElements] = useState(0);

    // Filter
    const [paymentStatus, setPaymentStatus] = useState('All');

    // Sorting
    const [paymentSortConfig, setPaymentSortConfig] = useState({
        key: null,
        direction: 'asc'
    });

    const fetchPayments = useCallback(async () => {
        setLoading(true);
        try {
            const res = await paymentService.getAll(
                currentPaymentPage,
                10,
                searchQuery,
                paymentSortConfig,
                paymentStatus
            );

            setPayments(
                (res?.data || res || []).map(p => ({
                    ...p,
                    fullName: p.user_fullname,
                    profileImage: p.user_profile_image
                }))
            );
            setPaymentTotalPages(res?.totalPages || 1);
            setPaymentTotalElements(res?.totalElements || 0);

        } catch (err) {
            console.error("Payment Fetch Error:", err);
            setPayments([]);
        } finally {
            setLoading(false);
        }
    }, [
        currentPaymentPage,
        searchQuery,
        paymentSortConfig,
        paymentStatus
    ]);

    // Sort
    const requestPaymentSort = (key) => {
        let direction = 'asc';

        if (
            paymentSortConfig.key === key &&
            paymentSortConfig.direction === 'asc'
        ) {
            direction = 'desc';
        }

        setPaymentSortConfig({ key, direction });
    };

    const resetPaymentSort = () => {
        setPaymentSortConfig({
            key: null,
            direction: 'asc'
        });
    };

    const handleVerifyPayment = async (
        paymentId,
        status,
        adminRemark = ''
    ) => {
        try {
            await paymentService.verifyPayment(
                paymentId,
                status,
                adminRemark
            );

            await fetchPayments();

            return { success: true };
        } catch (err) {
            console.error(err);
            return { success: false };
        }
    };

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    return {
        // data
        payments,
        loading,

        // pagination
        currentPaymentPage,
        setPaymentCurrentPage,
        paymentTotalPages,
        paymentTotalElements,

        // filter
        paymentStatus,
        setPaymentStatus,

        // sorting
        paymentSortConfig,
        setPaymentSortConfig,
        requestPaymentSort,
        resetPaymentSort,

        // actions
        refreshPayments: fetchPayments,
        handleVerifyPayment
    };
};