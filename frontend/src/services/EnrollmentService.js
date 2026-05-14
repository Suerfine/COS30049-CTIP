import { API_BASE_URL } from '../config/DummyapiConfig';
const BASE_URL=`${API_BASE_URL}/api/enrollments`;

export const enrollmentService={
    // GET: fetch all enrollments
    getAll: async()=>{
        const res=await fetch(BASE_URL);
        return await res.json();
    },  
}