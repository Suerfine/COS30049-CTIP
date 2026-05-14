import { API_ENDPOINTS } from "../config/ApiEndpoints";
import apiClient from "../config/apiConfig";

/**
 * Helper: normalize API response
 */
const getData = (res) => res?.data?.data ?? res?.data ?? [];

/**
 * Helper: format full name
 */
const formatName = (user) =>
    user ? `${user.firstname} ${user.lastname}` : null;

export const paymentService = {
    /**
     * GET: All payments (raw or enriched)
     */
    getAll: async (
        page = 1,
        size = 10,
        searchQuery = "",
        sortConfig = null,
        status = "All"
    ) => {
        try {
            const params = { page, size };

            // filters
            if (status !== "All") {
                params.filter = `status eq "${status}"`;
            }

            // sorting
            if (sortConfig?.key) {
                params.orderBy = `${sortConfig.key} ${sortConfig.direction}`;
            }

            const [paymentRes, userRes] = await Promise.all([
                apiClient.get(API_ENDPOINTS.PAYMENT.LIST, { params }),
                apiClient.get(API_ENDPOINTS.USER.ACCOUNT, { params: { size: 100 } })
            ]);

            const paymentData = paymentRes?.data || {};
            const payments = paymentData?.data || [];
            const users = userRes?.data?.data || [];

            let enriched = payments.map(p => {
                const user = users.find(u => Number(u.id) === Number(p.user_id));

                return {
                    ...p,
                    fullName: user 
                        ? `${user.firstname} ${user.lastname}` 
                        : `User #${p.user_id}`,
                    user_profile_image: user?.profile_image || null,
                };
            });

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();

                enriched = enriched.filter((p) =>
                    String(p.user_fullname || "")
                        .toLowerCase()
                        .includes(q) ||
                    String(p.course_id || "")
                        .toLowerCase()
                        .includes(q) ||
                    String(p.status || "")
                        .toLowerCase()
                        .includes(q)
                );
            }

            return {
                data: enriched,
                totalPages: paymentData?.totalPages || 1,
                totalElements: paymentData?.totalElements || enriched.length,
            };
        } catch (error) {
            console.error("Payment Service Error:", error);
            throw new Error("Failed to fetch payment records");
        }
    },

    /**
     * GET: Payment by ID
     */
    getById: async (paymentId) => {
        try {
            const res = await apiClient.get(
                API_ENDPOINTS.PAYMENT.DETAIL(paymentId)
            );
            return res.data;
        } catch (error) {
            console.error("Payment Detail Error:", error);
            throw error;
        }
    },

    /**
     * POST: Create payment
     */
    create: async (payload) => {
        console.log(payload);
        try {
            const res = await apiClient.post(
                API_ENDPOINTS.PAYMENT.SUBMIT,
                payload
            );
            return res.data;
        } catch (error) {
            console.error("Create Payment Error:", error);
            throw error;
        }
    },

    /**
     * PATCH: Update status
     * Cleaner: uses body instead of URL params
     */
    updateStatus: async (paymentId, status) => {
        try {
            const res = await apiClient.patch(
                API_ENDPOINTS.PAYMENT.DETAIL(paymentId),
                { status }
            );
            return res.data;
        } catch (error) {
            console.error("Update Payment Status Error:", error);
            throw error;
        }
    },

    /**
     * DELETE: Remove payment
     */
    delete: async (paymentId) => {
        try {
            const res = await apiClient.delete(
                API_ENDPOINTS.PAYMENT.DETAIL(paymentId)
            );
            return res.data;
        } catch (error) {
            console.error("Delete Payment Error:", error);
            throw error;
        }
    },

    /**
     * OPTIONAL (recommended): Enrichment layer moved out of service
     * Call this only when UI needs full display data
     */
    enrichPayments: (payments, users = [], courses = []) => {
        return payments.map((payment) => {
            const user = users.find(
                (u) => Number(u.id) === Number(payment.user_id)
            );

            const course = courses.find(
                (c) => Number(c.id) === Number(payment.course_id)
            );

            return {
                ...payment,
                fullName: formatName(user) || `User #${payment.user_id}`,
                courseName: course?.title || `Course #${payment.course_id}`,
                course
            };
        });
    },

    /**
     * Verify Payment
     */
    verifyPayment: async (
        paymentId,
        status,
        adminRemark = ''
    ) => {
        try {
            const res = await apiClient.patch(
                API_ENDPOINTS.PAYMENT.UPDATE_STATUS(paymentId, status),
                {
                    status,
                    admin_id: 1,
                    admin_remark: adminRemark
                }
            );

            return res.data;
        } catch (error) {
            console.error("Verify Payment Error:", error);
            throw error;
        }
    },

    downloadReceipt: async (paymentId) => {
        const res = await apiClient.get(
            API_ENDPOINTS.PAYMENT.RECEIPT(paymentId),
            { responseType: 'blob' }
        );
        return res;
    },
};
