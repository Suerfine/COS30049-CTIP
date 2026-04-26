const BASE_URL='http://localhost:4000/api/courses';

export const moduleService={
    // POST: Create new module
    create: async(courseId, moduleData)=>{
        try{
            const res=await fetch(`${BASE_URL}/${courseId}/modules`,{
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body: JSON.stringify(moduleData)
            });
            return res;
        } catch(err){
            console.error("Failed to create new module", err);
            throw err;
        }
    },

    // PUT: update the existing module
    update: async(courseId, moduleId, newTitle)=>{
        try{
            const res=await fetch(`${BASE_URL}/${courseId}/modules/${moduleId}`,{
                method:'PUT',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({title:newTitle}),
            });
            return res;
        } catch(err){
            console.error("Failed to update module",err);
            throw err;
        }
    },

    // DELETE: delete the existing module
    delete: async(courseId, moduleId)=>{
        try{
            const res=await fetch(`${BASE_URL}/${courseId}/modules/${moduleId}`,{
                method:'DELETE',
            });
            return res;
        }catch(err){
            console.error("Failed to delete module ",err);
            throw err;
        }
    }
}