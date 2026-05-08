const BASE_URL = 'http://localhost:5000/api';

export const userDashboardService = {
    getUserType: async () => {
        const res = await fetch(`${BASE_URL}/userType`);
        return await res.json();
    },

    getProgress: async () => {
        const res = await fetch(`${BASE_URL}/progress`);
        return await res.json();
    },

    getCourses: async () => {
        const res = await fetch(`${BASE_URL}/courses`);
        return await res.json();
    },

    getTodos: async () => {
        const res = await fetch(`${BASE_URL}/todos`);
        return await res.json();
    }
};