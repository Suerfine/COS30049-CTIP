import apiClient from "../config/apiConfig";
import { API_ENDPOINTS } from "../config/ApiEndpoints";

export const courseService = {
    // Get: fetch all course from backend api
    getAll: async (params = {}) => {
        try {
            const response = await apiClient.get(API_ENDPOINTS.COURSE.LIST, {
                params: {
                    page: params.page || 1,
                    size: params.size || 20,
                    filter: params.filter || "",
                }
            });
            return response.data;
        } catch (err) {
            console.error("Fetch Courses Error: ", err);
            const errorMessage = err.response?.data?.message || 'Failed to fetch all courses.';
            return Promise.reject(errorMessage);
        }
    },

    // GET: by id
    getById: async (id) => {
        try {
            const response = await apiClient.get(`/courses/${id}`);
            return response.data;
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to fetch course details';
            console.error('Unable to fetch course: ',err);
            return Promise.reject(errorMessage);
        }
    },

    // Post: create new course
    create: async (formData) => {
        try {
            const data = new FormData();

            data.append('title', formData.courseTitle);
            data.append('description', formData.description);
            data.append('status', "unreleased");
            data.append('expected_completion_weeks', formData.duration);
            data.append('must_complete_in_weeks', formData.expiryWeeks);
            data.append('badge_expire_in_months', formData.badgeExpiry);

            const prerequisiteGroups = [
                {
                    prerequisites: formData.prerequisites.map(p => ({
                        course_id: p.id
                    }))
                }
            ];

            data.append('prerequisite_groups', JSON.stringify(prerequisiteGroups));

            const getMimeType = (ext) => {
                if (ext === 'jpg') return 'image/jpeg';
                if (ext === 'jpeg') return 'image/jpeg';
                if (ext === 'png') return 'image/png';
                return `image/${ext}`;
            };

            if (formData.image) {
                const uriParts = formData.image.split('.');
                const fileType = uriParts[uriParts.length - 1].toLowerCase();

                data.append("cover", {
                    uri: formData.image,
                    name: `course_cover.${fileType}`,
                    type: getMimeType(fileType),
                });
            }

            if (formData.badgeImage) {
                const badgeParts = formData.badgeImage.split('.');
                const badgeType = badgeParts[badgeParts.length - 1].toLowerCase();

                data.append("badge", {
                    uri: formData.badgeImage,
                    name: `badge.${badgeType}`,
                    type: getMimeType(badgeType),
                });
            }

            const response = await apiClient.post(
                API_ENDPOINTS.COURSE.LIST,
                data
            );

            return response.data;

        } catch (error) {
            return Promise.reject(
                error.response?.data?.message || 'Failed to create a new course.'
            );
        }
    },

    update: async (id, courseData) => {
    try {
        const payload = {
            title: courseData.courseTitle,
            description: courseData.description || "",
            status: courseData.status,
            expected_completion_weeks: parseInt(courseData.duration, 10),
            must_complete_in_weeks: parseInt(courseData.expiryWeeks, 10),
            badge_expire_in_months: parseInt(courseData.badgeExpiry, 10),
            
            prerequisite_groups: (courseData.prerequisite_groups || []).map(group => ({
                id: group.id || undefined, 
                prerequisites: group.prerequisites.map(p => ({
                    id: p.id || undefined, 
                    course_id: p.course_id 
                }))
            }))
        };

        const response = await apiClient.put(
            API_ENDPOINTS.COURSE.DETAIL(id),
            payload
        );

        return response.data;
    } catch (error) {
        return Promise.reject(
            error.response?.data?.message || 'Failed to update course.'
        );
    }
},

    // Delete: delete existing course
    delete: async (id) => {
        try {
            const response = await apiClient.delete(API_ENDPOINTS.COURSE.DETAIL(id));
            return response.data;
        } catch (error) {
            return Promise.reject(error.response?.data?.message || "Failed to delete a course.");
        }
    }

    
};
