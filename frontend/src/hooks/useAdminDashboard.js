import { useState, useEffect, useCallback } from 'react';
import { AccountService } from '../services/AccountService';
import { courseService } from '../services/courseService';
import { enrollmentService } from '../services/EnrollmentService';
import { AnomalyService } from '../services/AnomalyService';

export const useAdminDashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalCourses: 0,
        totalEnrollments: 0,
        totalAnomalies: 0,
    });
    const [loading, setLoading] = useState(true);

    const fetchAllStats = useCallback(async () => {
        try {
            setLoading(true);
            const [users, courses, enrollments, anomaly] = await Promise.all([
                AccountService.getAll(1, 1000), 
                courseService.getAll(),
                enrollmentService.getAll(),
                AnomalyService.getAll(),
            ]);
            console.log("courses response:", courses);
            setStats({
                totalUsers: users?.totalElements || 0,
                totalCourses: courses?.totalElements || 0,
                totalEnrollments: enrollments?.totalElements || 0,
                totalAnomalies:anomaly?.totalElements|| 0,
            });
        } catch (error) {
            console.error("Dashboard Hook Error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllStats();
    }, [fetchAllStats]);

    return { stats, loading, refresh: fetchAllStats };
};