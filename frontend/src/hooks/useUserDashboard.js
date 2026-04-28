import { useState, useEffect, useMemo} from 'react';
import { userDashboardService } from '../services/userDashboardService';

export const useUserDashboard = () => {
    const [courses, setCourses] = useState([]);
    const [todos, setTodos] = useState([]);
    const [userType, setUserType] = useState('');
    const [progressData, setProgressData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [account, setAccount] = useState(null);

    // Share between Mobile and Web
    const [selectedDate, setSelectedDate] = useState(null);
    const [filter, setFilter] = useState("all");
    const [courseFilter, setCourseFilter]=useState('in progress');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isExpanded, setIsExpanded]=useState(false);

    const weekLabels=['Fri', 'Sat','Sun', 'Mon', 'Tue', 'Wed', 'Thu'];
    const todoTab=[
        {id: 'all', label:'All'},
        {id: 'completed', label:'Completed'},
        {id: 'pending', label:'Pending'},
    ];

    const courseTab=[
        {id: 'in progress', label:'In Progress'},
        {id: 'completed', label:'Completed'}
    ];

    // Dummy tag
    const categories = [
        { id: '1', name: 'Flora & Fauna' },
        { id: '2', name: 'Navigation' },
        { id: '3', name: 'First Aid' },
        { id: '4', name: 'Survival' },
        { id: '5', name: 'History' },
    ];

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

    // CALENDAR LOGIC
    // get start of week (Sunday)
    const getStartOfWeek = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const startDay=5;
        const diff=(day-startDay+7)%7;
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
            days.push(new Date(year, month, i));
        }

        return days;
    };

    // dot indicator for dates with todo item(s)
    const hasPendingTodoOnDate = (date) => {
        return todos.some(todo =>
            !todo.completed &&
            new Date(todo.date).toDateString() === date.toDateString()
        );
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
        userType, 
        progressData, 
        loading, 
        setTodos, 
        user, 
        account,
        selectedDate, setSelectedDate,
        filter, setFilter,
        courseFilter, setCourseFilter,
        currentDate, setCurrentDate,
        isExpanded, setIsExpanded,
        weekDates, getDaysInMonth, filteredTodos, inProgressCourses,
        toggleTodo, hasPendingTodoOnDate, refreshData: fetchDashboardData,
        weekLabels,todoTab, courseTab, categories,

    };
};