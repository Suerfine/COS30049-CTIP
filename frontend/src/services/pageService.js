import apiClient from "../config/apiConfig";
import { API_ENDPOINTS } from "../config/ApiEndpoints";

export const pageService={
    // GET:Fetch all pages
    getAll:async(courseId, moduleId)=>{
        try{
            const response=await apiClient.get(
                API_ENDPOINTS.COURSE.PAGES(courseId,moduleId)
            );
            return response.data;
        }catch(err){
            console.error("Fetch pages Error:",err);
            return Promise.reject(err.response?.data?.message || 'Failed to fetch pages.');
        }
    },
    
    // POST: Create new page
    create: async(courseId, moduleId, pageData)=>{
        try{
            const response=await apiClient.post(API_ENDPOINTS.COURSE.PAGES(courseId, moduleId),{
                title:pageData.title,
                order:pageData.order,
                passing_score:pageData.passing_score,
                final_quiz: pageData.final_quiz,
            });
            return response.data;
        } catch(err){
            console.error("Create pages Error:",err);
            return Promise.reject(err.response?.data?.message || 'Failed to create pages.');
        }
    },

    // PUT: update the existing page
    update: async(courseId, moduleId, pageId, newTitle)=>{
        try{
            const response=await apiClient.put(API_ENDPOINTS.COURSE.PAGES_DETAIL(courseId,moduleId,pageId),{title:newTitle});
            return response.data;
        } catch(err){
            console.error("Update pages Error:",err);
            return Promise.reject(err.response?.data?.message || 'Failed to update pages.');
        }
    },

    // DELETE: delete the existing page
    delete: async(courseId, moduleId, pageId)=>{
        try{
            const response=await apiClient.delete(API_ENDPOINTS.COURSE.PAGES_DETAIL(courseId,moduleId,pageId));
            return response.data;
        }catch(err){
            console.error("Delete pages Error:",err);
            return Promise.reject(err.response?.data?.message || 'Failed to delete pages.');
        }
    },

    // POST: update the other details page
    updateDetails: async (courseId, moduleId, pageId, data) => {
        try {
            const response = await apiClient.put(
                API_ENDPOINTS.COURSE.PAGES_DETAIL(courseId, moduleId, pageId), 
                data
            );
            return response.data;
        } catch (err) {
            console.error("Update pages Error:", err);
            return Promise.reject(err.response?.data?.message || 'Failed to update pages.');
        }
    },
}