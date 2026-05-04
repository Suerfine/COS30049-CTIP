import { API_ENDPOINTS } from "../config/ApiEndpoints";
import apiClient from "../config/apiConfig";

export const enrollmentService = {
    /**
     * GET: Fetch all enrollments enriched with User names (Admin View)
     */
    getAll: async () => {
        try {
            const [enrollRes, userRes, courseRes] = await Promise.all([
                apiClient.get(API_ENDPOINTS.ENROLLMENT.LIST),
                apiClient.get(API_ENDPOINTS.USER.ACCOUNT),
                apiClient.get(API_ENDPOINTS.COURSE.LIST)
            ]);

            const enrollments = enrollRes.data?.data || enrollRes.data || []; 
            const usersArray = userRes.data?.data || userRes.data || [];
            const coursesArray = courseRes.data?.data || courseRes.data || [];

            if (!Array.isArray(enrollments)) {
                console.error("Enrollments is not an array:", enrollments);
                return [];
            }

            return enrollments.map(enroll => {
                const user = Array.isArray(usersArray) 
                    ? usersArray.find(u => Number(u.id) === Number(enroll.user_id)) 
                    : null;

                const course = Array.isArray(coursesArray)
                    ? coursesArray.find(c => Number(c.id) === Number(enroll.course_id))
                    : null;

                return {
                    ...enroll,
                    fullName: user ? `${user.firstname} ${user.lastname}` : `User #${enroll.user_id}`,
                    courseName: course ? course.title : `Course #${enroll.course_id}`,
                    courseCode: course ? course.course_code : 'N/A'
                };
            });
        } catch (error) {
            console.error("Enrollment Service Error:", error);
            return [];
        }
    },
    /**
     * GET: My personal enrollments (Current User View)
     */
    getMyEnrollments: async () => {
        try {
            const res = await apiClient.get(API_ENDPOINTS.ENROLLMENT.MY_ENROLLMENTS);
            return res.data;
        } catch (error) {
            console.error("My Enrollments Error:", error);
            return [];
        }
    },

    /**
     * GET: Filter enrollments based on user id locally
     */
    getByUserId: async (userId) => {
        const allEnrollments = await enrollmentService.getAll();
        return allEnrollments.filter(enroll => enroll.user_id === userId);
    },

    /**
     * POST: Create new Enrollment
     */
    enroll: async (courseId, userId) => {
        const res = await apiClient.post(API_ENDPOINTS.ENROLLMENT.ENROLL(courseId), {
            user_id: userId 
        });
        return res.data;
    },

    /**
     * PATCH: Update enrollment status (Approval Logic)
     */
    updateStatus: async (enrollmentId, status) => {
        try {
            const res = await apiClient.patch(
                API_ENDPOINTS.ENROLLMENT.UPDATE_STATUS(enrollmentId, status)
            );
            return res.data;
        } catch (error) {
            console.error("Update Status Error:", error);
            throw error;
        }
    }
};