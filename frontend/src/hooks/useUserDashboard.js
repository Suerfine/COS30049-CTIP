import { useState, useEffect, useMemo, useCallback} from 'react';
import { userDashboardService } from '../services/userDashboardService';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { courseService } from '../services/courseService';
import { eventService } from '../services/eventService';

export const useUserDashboard = () => {
    const {t, i18n}=useTranslation();
    const [courses, setCourses] = useState([]);
    const [events, setEvents] = useState([]);
    const [userType, setUserType] = useState('');
    const [progressData, setProgressData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [account, setAccount] = useState(null);
    const {currentUser}=useAuth();
    const [categories, setCategories] = useState([]);

    // Share between Mobile and Web
    const [selectedDate, setSelectedDate] = useState(null);
    const [filter, setFilter] = useState("upcoming");
    const [courseFilter, setCourseFilter]=useState('in progress');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isExpanded, setIsExpanded]=useState(false);

    const weekLabels=[t('Fri'), t('Sat'),t('Sun'), t('Mon'), t('Tue'), t('Wed'), t('Thu')];

    // Upcoming (normal, pending), Completed (normal, completed), workshop (workshop) 
    const eventTab= useMemo(() => ([
        {id: 'upcoming', label:t('upcoming')},
        {id: 'completed', label:t('status.completed')},
        {id: 'workshop', label:t('workshop')},
    ]), [t]);

    const toggleEvent = async (id) => {
        const targetEvent = events.find(event => EventTypes.id === id);
        if (!targetEvent) return;

        const nextStatus = targetEvent.status === 'completed' ? 'pending' : 'completed';

        try {
            await eventService.updateStatus(id, nextStatus);

            setEvents(prev => prev.map(event => event.id === id ? {...event, status: nextStatus} : event));
        } catch (err) {
            console.error("Toggle event status error:", err);
        }
    }

    const courseTab = useMemo(() => ([
        { id: "in progress", label: t("status.in progress") },
        { id: "completed", label: t("status.completed") },
    ]), [t]);

    const fetchDashboardData = async () => {
        if (!currentUser) return;
        
        setLoading(true);
        try {
            const [progressRes, coursesRes, eventsRes, fullProfileRes, tagsRes] = await Promise.allSettled([
                userDashboardService.getProgress(),
                userDashboardService.getCourses(),
                eventService.getEvents(),
                userDashboardService.getUserProfile(),
                courseService.getAllTags() 
            ]);

            if (progressRes.status === 'fulfilled') setProgressData(progressRes.value);
            if (coursesRes.status === 'fulfilled') setCourses(coursesRes.value);
            if (eventsRes.status === 'fulfilled') setEvents(eventsRes.value);
            if (fullProfileRes.status === 'fulfilled') setUser(fullProfileRes.value);
            if (tagsRes.status === 'fulfilled') setCategories(tagsRes.value?.data || tagsRes.value || []);

            // Log any failures for debugging
            [progressRes, coursesRes, eventsRes, fullProfileRes, tagsRes].forEach((r, i) => {
                if (r.status === 'rejected') console.error(`Fetch #${i} failed:`, r.reason);
            });

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

    const filteredEvents = useMemo(() => {
        let result = events;
        if (selectedDate) {
            result = result.filter(event => {
                const eventDate = new Date(event.event_start_at).toDateString();
                const selected = new Date(selectedDate).toDateString();
                return eventDate === selected;
            });
        }
        if (filter === "upcoming") {
            return result.filter(event =>
                event.type === "normal" && event.status === "pending"
            );
        }
        if (filter === "completed") {
            return result.filter(event =>
                event.type === "normal" && event.status === "completed"
            );
        }
        if (filter === "workshop") {
            return result.filter(event => 
                event.type === "workshop");
        }
        return result;
    }, [events, selectedDate, filter]);

    // dot indicator for dates with todo item(s)
    const hasPendingEventOnDate = (date) => {
        if (!date) return false;

        const calendarStr = formatLocalDate(date);

        return events.some(event => {
            const eventDate = formatLocalDate(new Date(event.event_start_at));
            return eventDate === calendarStr;
        });
    };

    return { 
        courses, 
        events,  
        progressData, 
        loading, 
        setEvents, 
        user, 
        selectedDate, setSelectedDate,
        filter, setFilter,
        courseFilter, setCourseFilter,
        currentDate, setCurrentDate,
        isExpanded, setIsExpanded,
        weekDates, getDaysInMonth, filteredEvents,
        hasPendingEventOnDate, refreshData: fetchDashboardData,
        weekLabels, eventTab, courseTab, categories, formatLocalDate,  
        // inProgressCourses,
        // completedCourses,
    };
};