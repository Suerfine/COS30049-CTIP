import { API_ENDPOINTS } from "../config/apiConfig";

export const RegisterService={
    // GET: fetch all registration
    getAll: async(page=1, size=10, search, status)=>{
        try{
            let url = `${API_ENDPOINTS.USER.SIGNUP}?page=${page}&size=${size}`;
            let filters = [];
            if (status && status !== 'All') {
                filters.push(`status eq ${status.toLowerCase()}`);
            }
            if (search) {
                filters.push(`firstname lk ${search}`);
            }
            if (filters.length > 0) {
                url += `&filter=${filters.join(' and ')}`;
            }
            const response=await fetch(url,{
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

    // POST: approve account
    approve:async (id)=>{
        const response=await fetch(`${API_ENDPOINTS.REGISTER}/${id}/approve`,{
            method:'POST',
            headers:{
                'Content-Type':'application/json',
            },
        });
        if (!response.ok) {
            // Log the text so you can see the HTML error in the console
            const errorHtml = await response.text();
            console.log("Server Error HTML:", errorHtml);
            throw new Error("Check console for HTML error");
        }
        return await response.json();
    }

};