import { useState, useEffect, useCallback } from 'react';
import { discussionService } from '../services/discussionService';

export const useDiscussions = (courseId, forumType) => {
    const [discussions, setDiscussions] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchDiscussions = useCallback(async () => {
        if (!courseId) return;
        setLoading(true);
        try {
            const response = await discussionService.getDiscussions(courseId);
            
            const actualDiscussions = response?.data || (Array.isArray(response) ? response : []);
            
            const filtered = actualDiscussions.filter(d => {
                const isPublic = Boolean(d.is_public); 
                return forumType === 'Public' ? isPublic : !isPublic;
            });
            console.log(filtered);
            
            setDiscussions(filtered);
        } catch (err) {
            console.error("Discussion Hook Error:", err);
            setDiscussions([]); 
        } finally {
            setLoading(false);
        }
    }, [courseId, forumType]);

    useEffect(() => {
        fetchDiscussions();
    }, [fetchDiscussions]);

    return { discussions, loading, refreshDiscussions: fetchDiscussions };
};