const BASE_URL='http://localhost:4000/api/enrollments';

export const enrollmentService={
    // GET: fetch all enrollments
    getAll: async()=>{
        const res=await fetch(BASE_URL);
        return await res.json();
    },  
}