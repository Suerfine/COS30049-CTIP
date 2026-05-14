import { API_BASE_URL } from '../config/DummyapiConfig';
const BASE_URL=`${API_BASE_URL}/api/submissions`;

export const submissionService={
    // GET: fetch all submissions
    getAll: async()=>{
        const res=await fetch(BASE_URL);
        return await res.json();
    },
}