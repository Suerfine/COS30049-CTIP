const BASE_URL='http://localhost:5000/api/accounts';

export const AccountService={
    // GET: fetch all accounts
    getAll: async()=>{
        const res=await fetch(BASE_URL);
        return await res.json();
    },
}