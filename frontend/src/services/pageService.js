const BASE_URL='http://localhost:5000/api/courses';

export const pageService={
    // POST: Create new page
    create: async(courseId, moduleId, pageData)=>{
        try{
            const res=await fetch(`${BASE_URL}/${courseId}/modules/${moduleId}/pages`,{
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body: JSON.stringify(pageData)
            });
            return res;
        } catch(err){
            console.error("Failed to create new page", err);
            throw err;
        }
    },

    // PUT: update the existing page
    update: async(courseId, moduleId, pageId, newTitle)=>{
        try{
            const res=await fetch(`${BASE_URL}/${courseId}/modules/${moduleId}/pages/${pageId}`,{
                method:'PUT',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({title:newTitle}),
            });
            return res;
        } catch(err){
            console.error("Failed to update page ",err);
            throw err;
        }
    },

    // DELETE: delete the existing page
    delete: async(courseId, moduleId, pageId)=>{
        try{
            const res=await fetch(`${BASE_URL}/${courseId}/modules/${moduleId}/pages/${pageId}`,{
                method:'DELETE',
            });
            return res;
        }catch(err){
            console.error("Failed to delete page ",err);
            throw err;
        }
    }
}