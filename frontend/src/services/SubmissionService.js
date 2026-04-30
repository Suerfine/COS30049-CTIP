const BASE_URL='http://localhost:4000/api/submissions';

export const submissionService={
    // GET: fetch all submissions
    getAll: async()=>{
        const res=await fetch(BASE_URL);
        return await res.json();
    },
}