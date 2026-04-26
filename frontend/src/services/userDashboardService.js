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
    },

    // get first name, email, telefon, id, pfp
    getUserProfile: async () => {
        const res = await fetch('http://localhost:5000/api/users');
        const data = await res.json();

        // assuming single user (index 0)
        return data[0];
    },

    // get joined at date
    getAccount: async () => {
    const res = await fetch(`${BASE_URL}/accounts`);
    const data = await res.json();
    
    // assuming single account (index 0)
    return data[0]; 
}
};