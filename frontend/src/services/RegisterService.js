import { API_ENDPOINTS } from "../config/apiConfig";

export const RegisterService={
    // GET: fetch all registration
    getAll: async(page=1, size=100)=>{
        try{
            const response=await fetch(`${API_ENDPOINTS.USER.SIGNUP}?page=${page}&size=${size}`,{
                method:'GET',
                headers:{
                    'Content-Type':'application/json',
                },
            });
            const data=await response.json();

            if(!response.ok){
                throw new Error(data.message || 'Failed to fetch registration records');
            }

            return data;
        } catch(error){
            console.error('Get Registrations Error:', error);
            throw error;
        }
    },

    // POST: Create new registration
    registerUser: async(userData)=>{
        try{
            const formData=new FormData();

            formData.append('firstname', userData.fname);
            formData.append('lastname', userData.lname);
            formData.append('identification', userData.ic);
            formData.append('personal_email', userData.email);
            formData.append('tel', userData.telephone);

            if(userData.file){
                formData.append('file', {
                    uri:userData.file.uri,
                    name: userData.file.name,
                    type: userData.file.type || 'application/pdf',
                });
            }

            const response = await fetch(API_ENDPOINTS.USER.SIGNUP, {
                method: 'POST',
                body: formData,
                headers: { Accept: 'application/json' },
            });

            const text = await response.text();
            console.log("RAW RESPONSE:", text);

            let data;
            try {
                data = JSON.parse(text);
            } catch {
                throw new Error("Server did not return valid JSON");
            }

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed.');
            }

            return data;
        }catch(error){
            console.error("Register Service Error: ",error);
            throw error;
        }
    },

    // // PUT: update user status
    // // Dont have id on api and database for user
    // updateStatus: async (id, status) => {
    //     const response = await fetch(`${API_ENDPOINTS.REGISTER}/${id}/status`, {
    //     method: 'PATCH',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ status }),
    //     });
    //     if (!response.ok) throw new Error("Failed to update status");
    //     return await response.json();
    // }

};