import apiClient from "../config/apiConfig";
import { API_ENDPOINTS } from "../config/ApiEndpoints";

export const courseService={
    // Get: fetch all course from backend api
    getAll:async()=>{
        try{
            const response=await apiClient.get(API_ENDPOINTS.COURSE.LIST);
            return response.data;
        }catch(err){
            console.error("Fetch Courses Error: ", err);
            const errorMessage=error.response?.data?.message || 'Failed to fetch all courses.';
            return Promise.reject(errorMessage);
        }
    },

    // Post: create new course
    create:async(formData)=>{
        try{
            const data=new FormData();
            data.append('title',formData.courseTitle);
            data.append('description', formData.description);
            data.append('status', "unreleased");
            data.append('expected_completion_weeks',formData.duration);
            data.append('must_complete_in_weeks', formData.expiryWeeks);
            data.append('badge_expire_in_months', formData.badgeExpiry);

            if(formData.image){
                const uriParts=formData.image.split('.');
                const fileType=uriParts[uriParts.length-1];
                data.append("image", {
                    uri:formData.image,
                    name:`course_cover.${fileType}`,
                    type:`image/${fileType}`,
                });
            }

            if (formData.badgeImage) {
                const badgeParts = formData.badgeImage.split('.');
                const badgeType = badgeParts[badgeParts.length - 1];
                data.append('badge', {
                    uri: formData.badgeImage,
                    name: `badge.${badgeType}`,
                    type: `image/${badgeType}`,
                });
            }
            const response=await apiClient.post(API_ENDPOINTS.COURSE.LIST,data,{
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
        }catch(error){
            return Promise.reject(error.response?.data?.message || 'Failed to create a new course.');
        }
    },

    // Put: update existing course
    update: async(id, courseData)=>{
        try{
            const payload={
                title: courseData.courseTitle,
                description:courseData.description,
                status:courseData.status,
                expected_completion_weeks: parseInt(courseData.duration,10),
                must_complete_in_weeks:parseInt(courseData.expiryWeeks,10),
                badge:courseData.badgeImage,
                badge_expire_in_months: parseInt(courseData.badgeExpiry,10),
            };
            const response=await apiClient.put(API_ENDPOINTS.COURSE.DETAIL(id),payload);
            return response.data;
        }catch(error){
            const message=error.response?.data?.message || 'Failed to update course.';
            return Promise.reject(message);
        }
    },

    // Delete: delete existing course
    delete:async(id)=>{
        try{
            const response=await apiClient.delete(API_ENDPOINTS.COURSE.DETAIL(id));
            return response.data;
        }catch(error){
            return Promise.reject(error.response?.data?.message || "Failed to delete a course.");
        }
    }
};
