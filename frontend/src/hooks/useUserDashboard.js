import { useState, useEffect } from 'react';
import { userDashboardService } from '../services/userDashboardService';
import { useAuth } from '../context/AuthContext';

export const useUserDashboard = () => {
    const { currentUser } = useAuth();
    const [courses, setCourses] = useState([]);
    const [todos, setTodos] = useState([]);
    const [userType, setUserType] = useState('');
    const [progressData, setProgressData] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [progress, courses, todos] = await Promise.all([
                userDashboardService.getProgress(),
                userDashboardService.getCourses(),
                userDashboardService.getTodos()
            ]);

            setUserType(currentUser?.role || 'parkguide');
            setProgressData(progress);
            setCourses(courses);
            setTodos(todos);

        } catch (err) {
            console.error("Dashboard fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [currentUser?.role]);

    return {
        courses,
        todos,
        userType,
        progressData,
        loading,
        setTodos
    };
};