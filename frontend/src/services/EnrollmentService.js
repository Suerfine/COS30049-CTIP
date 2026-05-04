import { API_ENDPOINTS } from "../config/ApiEndpoints";

export const enrollmentService={
    // GET: fetch all enrollments
    getAll: async () => {
        try {
            const [enrollRes, userRes] = await Promise.all([
                fetch(API_ENDPOINTS.ENROLLMENT.LIST),
                fetch(API_ENDPOINTS.USER.ACCOUNT)
            ]);

            if (!enrollRes.ok || !userRes.ok) {
                throw new Error("Failed to fetch enrollment or user data");
            }

            const enrollments = await enrollRes.json();
            const users = await userRes.json();

            return enrollments.map(enroll => {
                const user = users.find(u => u.id === enroll.user_id);
                return {
                    ...enroll,
                    fullName: user ? `${user.firstname} ${user.lastname}` : `User #${enroll.user_id}`
                };
            });
        } catch (error) {
            console.error("Enrollment Service Error:", error);
            return [];
        }
        
    },  

    getByUserId: async (userId) => {
        const allEnrollments = await enrollmentService.getAll();
        return allEnrollments.filter(enroll => enroll.user_id === userId);
    },
    
    enroll: async (courseId, userId) => {
        const res = await fetch(API_ENDPOINTS.ENROLLMENT.ENROLL(courseId), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId }),
        });
        return await res.json();
    }
}