import { useState, useEffect, useMemo, useCallback} from 'react';
import { userDashboardService } from '../services/userDashboardService';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { courseService } from '../services/courseService';

export const useUserDashboard = () => {
    const {t, i18n}=useTranslation();
    const [courses, setCourses] = useState([]);
    const [todos, setTodos] = useState([]);
    const [userType, setUserType] = useState('');
    const [progressData, setProgressData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [account, setAccount] = useState(null);
    const {currentUser}=useAuth();
    const [categories, setCategories] = useState([]);

    // Share between Mobile and Web
    const [selectedDate, setSelectedDate] = useState(null);
    const [filter, setFilter] = useState("all");
    const [courseFilter, setCourseFilter]=useState('in progress');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isExpanded, setIsExpanded]=useState(false);

    const weekLabels=[t('Fri'), t('Sat'),t('Sun'), t('Mon'), t('Tue'), t('Wed'), t('Thu')];

    const todoTab=[
        {id: 'all', label:t('status.all')},
        {id: 'completed', label:t('status.completed')},
        {id: 'pending', label:t('status.pending')},
    ];

    const courseTab=[
        {id: 'in progress', label:t('status.in progress')},
        {id: 'completed', label:t('status.completed')}
    ];

    const fetchDashboardData = async () => {
        if (!currentUser) return;
        
        setLoading(true);
        try {
            const [progress, courses, todos, fullProfile, tagsRes] = await Promise.all([
                userDashboardService.getProgress(),
                userDashboardService.getCourses(),
                userDashboardService.getTodos(),
                userDashboardService.getUserProfile(),
                courseService.getAllTags() 
            ]);

            setProgressData(progress);
            setCourses(courses);
            setTodos(todos);
            setUser(fullProfile);
            setCategories(tagsRes.data || tagsRes || []); 

        } catch (err) {
            console.error("Dashboard fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [currentUser]);

    // CALENDAR LOGIC
    // get start of week (Sunday)
    const getStartOfWeek = (date) => {
        const d = new Date(date);
        d.setHours(12, 0, 0, 0); 
        
        const day = d.getDay();
        const startDay = 5;
        const diff = (day - startDay + 7) % 7;
        d.setDate(d.getDate() - diff);
        return d;
    };

    // generate 7 days
    const getWeekDates = (date) => {
        const start = getStartOfWeek(date);
        return Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            return d;
        });
    };

    const weekDates = getWeekDates(currentDate);

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDate = new Date(year, month + 1, 0).getDate();
        
        const startDay = 5; 
        const firstDayIndex = (firstDay.getDay() - startDay + 7) % 7;
        
        const days = [];
        for (let i = 0; i < firstDayIndex; i++) {
            days.push(null);
        }
        for (let i = 1; i <= lastDate; i++) {
            const d = new Date(year, month, i);
            d.setHours(0, 0, 0, 0); 
            days.push(d);
        }
        return days;
    };

    const formatLocalDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // dot indicator for dates with todo item(s)
    const hasPendingTodoOnDate = (date) => {
        if (!date) return false;
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const calendarStr = `${year}-${month}-${day}`;
        return todos.some(todo => {
            return todo.date === calendarStr;
        });
    };
    
    // COURSES LOGIC
    // get in progress courses
    const inProgressCourses = courses.filter(course => {
        const progressObj = progressData.find(p => p.courseId === course.id);
        const progress = progressObj ? progressObj.progress : null;

        return progress !== null && progress > 0 && progress < 1;
    });

     // TODOLIST LOGIC
    // Toggle checkbox
    const toggleTodo = (id) => {
        setTodos(prev =>
            prev.map(todo =>
                todo.id === id ? { ...todo, completed: !todo.completed } : todo
            )
        );
    };

    const filteredTodos = useMemo(() => {
        let result = todos;
        if (selectedDate) {
            result = result.filter(t => 
                new Date(t.date).toDateString() === new Date(selectedDate).toDateString()
            );
        }
        if (filter === "completed") return result.filter(t => t.completed);
        if (filter === "pending") return result.filter(t => !t.completed);
        return result;
    }, [todos, selectedDate, filter]);

    return { 
        courses, 
        todos,  
        progressData, 
        loading, 
        setTodos, 
        user, 
        selectedDate, setSelectedDate,
        filter, setFilter,
        courseFilter, setCourseFilter,
        currentDate, setCurrentDate,
        isExpanded, setIsExpanded,
        weekDates, getDaysInMonth, filteredTodos, inProgressCourses,
        toggleTodo, hasPendingTodoOnDate, refreshData: fetchDashboardData,
        weekLabels,todoTab, courseTab, categories,formatLocalDate

    };
};