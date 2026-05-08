const API_URL='http://localhost:5000/api/courses';

export const courseService={
    // Get: fetch all course from backend api
    getAll:async()=>{
        const res=await fetch(API_URL);
        return await res.json();
    },

    // Post: create new course
    create:async(formData)=>{
        const data=await transformFormData(formData);
        return await fetch(API_URL,{
            method:'POST',
            body:data,
            headers:{'Accept' : 'application/json'},
        });
    },

    // Put: update existing course
    update: async(id, formData)=>{
        const data=await transformFormData(formData);
        return await fetch(`${API_URL}/${id}`,{
            method:'PUT',
            body:data,
            headers:{'Accept':'application/json'},
        })
    },

    // Delete: delete existing course
    delete:async(id)=>{
        return await fetch(`${API_URL}/${id}`,{
            method:"DELETE",
            headers:{'Accept':'application/json'}
        });
    }
};

async function transformFormData(formData){
    const data=new FormData();
    data.append('courseTitle', formData.courseTitle);
    data.append('duration', formData.duration);
    const dateString = formData.expiryDate instanceof Date 
    ? formData.expiryDate.toISOString().split('T')[0] 
    : formData.expiryDate;
    data.append('expiryDate', dateString);
    data.append('description', formData.description);
    if(formData.image){
        const response = await fetch(formData.image);
        const blob = await response.blob();
        data.append('image', blob, 'course_photo.jpg');
    }
    return data;
}