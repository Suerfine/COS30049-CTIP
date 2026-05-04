import { useState, useEffect, useCallback } from "react";
import { ElementService } from "../services/ElementService";

export const useElements=(courseId, moduleId, pageId)=>{
    const [elements, setElements]=useState([]);
    const [loading, setLoading]=useState(false);
    const [error, setError]=useState(null);

    const loadElements=useCallback(async()=>{
        if(!courseId || !moduleId || !pageId){
            setElements([]);
            return;
        }

        setLoading(true);
        setError(null);
        try{
            const data=await ElementService.getAll(courseId, moduleId, pageId);
            setElements(data.sort((a,b)=>a.order-b.order));
        }catch(err){
            setError(err.message || 'Failed to load content.');
            console.error("useElements Error: ", err);
        }finally{
            setLoading(false);
        }
    },[courseId, moduleId, pageId]);

    const createNewElement = async (payload) => {
        try {
            const newElement = await ElementService.create(courseId, moduleId, pageId, payload);
            setElements(prev => [...prev, newElement]);
            return true;
        } catch (err) {
            console.error("Create Element Error:", err);
            return false;
        }
    };

    useEffect(()=>{
        loadElements();
    },[loadElements]);

    return {elements, loading, error, refresh: loadElements, createNewElement};
}