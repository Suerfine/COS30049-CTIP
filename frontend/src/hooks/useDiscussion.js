import { useState, useEffect, useCallback } from 'react';
import { discussionService } from '../services/discussionService';

export const useDiscussions = (courseId, forumType) => {
    const [discussions, setDiscussions] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchDiscussions = useCallback(async () => {
        setLoading(true);
        try {
            const data = await discussionService.getDiscussions(courseId);
            
            // Only set state if the data actually exists
            // This stops the loop if the service returns a new empty array [] 
            // that React thinks is different from the previous empty array []
            setDiscussions(prev => {
                if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
                return data;
            });
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, [courseId]); 

    useEffect(() => {
        fetchDiscussions();
    }, [fetchDiscussions, forumType]);

    return { discussions, loading, refreshDiscussions: fetchDiscussions };
};