const BASE_URL='http://localhost:5000/api/registrations';

export const RegisterService={
    // GET: fetch all users
    getAll: async()=>{
        const res=await fetch(BASE_URL);
        return await res.json();
    },
}