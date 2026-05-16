import { useState, useEffect, useCallback } from 'react';
import { paymentService } from '../services/PaymentService';
import { enrollmentService } from '../services/EnrollmentService';

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

            const paymentData = res?.data || [];

            setPayments(
                paymentData.map(p => ({
                    ...p,
                    fullName:
                        p.fullName ||
                        p.user_fullname ||
                        `User #${p.user_id}`,

                    profileImage:
                        p.profileImage ||
                        p.user_profile_image ||
                        p.user_profile_img ||
                        null
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
            const targetPayment = payments.find(
                p => Number(p.id) === Number(paymentId)
            );
            if (!targetPayment) {
                throw new Error("Payment not found");
            }

            await paymentService.verifyPayment(
                paymentId,
                status,
                adminRemark
            );

            if (targetPayment.enrollment_id) {
                if (status === 'paid') {
                    await enrollmentService.updateStatus(
                        targetPayment.enrollment_id,
                        'in_review'
                    );
                }
                if (status === 'failed') {
                    await enrollmentService.updateStatus(
                        targetPayment.enrollment_id,
                        'rejected'
                    );
                }
            }
            await fetchPayments();

            return { success: true };
        } catch (err) {
            console.error(err);
            return { 
                success: false,
                error:
                    err?.response?.data?.message ||
                    err.message ||
                    'Failed to verify payment' 
            };
        }
    };

    const deletePayment = async (paymentId) => {
        try {

            await paymentService.delete(paymentId);
            await fetchPayments();
            return {
                success: true
            };

        } catch (err) {
            console.error("Delete Payment Error:", err);
            return {
                success: false,
                error:
                    err?.response?.data?.message ||
                    err.message ||
                    'Failed to delete payment'
            };
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
        fetchPayments,
        handleVerifyPayment,
        deletePayment
    };
};