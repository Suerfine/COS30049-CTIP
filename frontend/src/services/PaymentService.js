import { API_ENDPOINTS } from "../config/ApiEndpoints";
import apiClient from "../config/apiConfig";

export const paymentService = {
    /**
        * GET: Fetch all payments enriched with User + Course names
    */
    getAll: async (
        page = 1,
        size = 10,
        searchQuery = '',
        sortConfig = null,
        status = 'All'
    ) => {
        try {
            const params = { page, size };
            let filters = [];

            // filter status
            if (status && status !== 'All') {
                filters.push(`status eq "${status}"`);
            }
            if (filters.length > 0) {
                params.filter = filters.join(' and ');
            }

            // sorting
            if (sortConfig?.key) {
                params.orderBy = `${sortConfig.key} ${sortConfig.direction}`;
            }

            // fetch all required data
            const [paymentRes, userRes, courseRes] = await Promise.all([
                apiClient.get(API_ENDPOINTS.PAYMENT.LIST, { params }),

                apiClient.get(API_ENDPOINTS.USER.ACCOUNT, {
                    params: { size: 100 }
                }),

                apiClient.get(API_ENDPOINTS.COURSE.LIST, {
                    params: { size: 100 }
                })
            ]);

            const paymentData = paymentRes.data;
            const rawPayments = paymentData?.data || [];
            const usersArray = userRes.data?.data || userRes.data || [];
            const coursesArray = courseRes.data?.data || courseRes.data || [];

            let enrichedData = rawPayments.map(payment => {
                const user = usersArray.find(
                    u => Number(u.id) === Number(payment.user_id)
                );

                const course = coursesArray.find(
                    c => Number(c.id) === Number(payment.course_id)
                );

                return {
                    ...payment,

                    fullName: user
                        ? `${user.firstname} ${user.lastname}`
                        : `User #${payment.user_id}`,

                    courseName: course
                        ? course.title
                        : `Course #${payment.course_id}`,

                    course: course
                };
            });

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                enrichedData = enrichedData.filter(item => 
                    item.fullName.toLowerCase().includes(q) ||
                    item.courseName.toLowerCase().includes(q)
                );
            }

            return {
                ...paymentData,
                data: enrichedData
            };
        } catch (error) {
            console.error("Payment Service Error:", error);
            throw new Error('Failed to fetch payment records');
        }
    },
    /**
        * GET: Payment Detail
    */
    getById: async (paymentId) => {
        try {
            const res = await apiClient.get (
                API_ENDPOINTS.PAYMENT.DETAIL(paymentId)
            );
            return res.data;
        } catch (error) {
            console.error("Payment Detail Error:", error);
            throw error;
        }
    },

    /**
        * POST: Create Payment
    */
    create: async (payload) => {
        try {
            const res = await apiClient.post(
                API_ENDPOINTS.PAYMENT.CREATE,
                payload
            );
            return res.data;
        } catch (error) {
            console.error("Create Payment Error:", error);
            throw error;
        }
    },

    /**
        * PATCH: Update payment status
    */
    updateStatus: async (paymentId, status) => {
        try {
            const res = await apiClient.patch(
                API_ENDPOINTS.PAYMENT.UPDATE_STATUS(paymentId, status)
            );
            return res.data;
        } catch (error) {
            console.error("Update Payment Status Error: ", error);
            throw error;
        }
    },

    /**
        * DELETE: Remove Payment
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
    }
};