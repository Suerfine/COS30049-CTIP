import { useState, useEffect } from 'react';
import { userDashboardService } from '../services/userDashboardService';

export const useUserDashboard = () => {
    const [courses, setCourses] = useState([]);
    const [todos, setTodos] = useState([]);
    const [userType, setUserType] = useState('');
    const [progressData, setProgressData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [account, setAccount] = useState(null);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [userType, progress, courses, todos, user, account] = await Promise.all([
                userDashboardService.getUserType(),
                userDashboardService.getProgress(),
                userDashboardService.getCourses(),
                userDashboardService.getTodos(),
                userDashboardService.getUserProfile(),
                userDashboardService.getAccount()
            ]);

            setUserType(userType);
            setProgressData(progress);
            setCourses(courses);
            setTodos(todos);
            setUser(user);
            setAccount(account);

        } catch (err) {
            console.error("Dashboard fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    return { courses, todos, userType, progressData, loading, setTodos, user, account};
};