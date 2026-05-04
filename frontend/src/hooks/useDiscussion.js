import { useState, useEffect, useCallback } from 'react';
import { discussionService } from '../services/discussionService';

export const useDiscussions = (courseId, forumType) => {
    const [discussions, setDiscussions] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadDiscussions = useCallback(async () => {
        if (!courseId) return;
        setLoading(true);
        try {
            const data = await discussionService.getDiscussions(courseId);
            const isPublicRequest = forumType === 'Public';
            setDiscussions(data.filter(d => d.is_public === isPublicRequest));
        } catch (err) {
            console.error("Failed to load discussions", err);
        } finally {
            setLoading(false);
        }
    }, [courseId, forumType]);

    useEffect(() => {
        loadDiscussions();
    }, [loadDiscussions]);

    return { discussions, loading, refresh: loadDiscussions };
};