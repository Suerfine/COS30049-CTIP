import { useState, useEffect, useCallback } from "react";
import { ElementService } from "../services/ElementService";
import { pageService } from "../services/pageService";

export const useElements=(courseId, moduleId, pageId)=>{
    const [elements, setElements]=useState([]);
    const [loading, setLoading]=useState(false);
    const [error, setError]=useState(null);
    const [workshops, setWorkshops] = useState([]);
    const [workshopsLoading, setWorkshopsLoading] = useState(false);

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

    const updateExistingElement = async (elementId, payload) => {
        try {
            const updated = await ElementService.update(courseId, moduleId, pageId, elementId, payload);
            setElements(prev => prev.map(el => el.id === elementId ? updated : el));
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    };

    const deleteElement = async (elementId) => {
        try {
            await ElementService.delete(courseId, moduleId, pageId, elementId);
            setElements(prev => prev.filter(el => el.id !== elementId));
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    };

    const moveElement = async (elementId, direction) => {
        const index = elements.findIndex(el => el.id === elementId);
    
        if ((direction === 'up' && index === 0) || 
            (direction === 'down' && index === elements.length - 1)) {
            return;
        }

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        const currentElement = elements[index];
        const targetElement = elements[newIndex];

        try {
            await ElementService.updateOrder(courseId, moduleId, pageId, currentElement.id, targetElement.order);
            await ElementService.updateOrder(courseId, moduleId, pageId, targetElement.id, currentElement.order);

            const updatedElements = [...elements];
            
            const tempOrder = currentElement.order;
            currentElement.order = targetElement.order;
            targetElement.order = tempOrder;
            
            updatedElements[index] = targetElement;
            updatedElements[newIndex] = currentElement;

            setElements(updatedElements);
            return true;
        } catch (err) {
            console.error("Reorder Logic Error:", err);
            alert("Failed to change order. Please refresh.");
            return false;
        }
    };

    const loadWorkshops = useCallback(async () => {
        if (!courseId) return;
        setWorkshopsLoading(true);
        try {
            const data = await ElementService.getWorkshops(courseId);
            setWorkshops(data);
        } catch (err) {
            console.error("useElements Workshop Error: ", err);
        } finally {
            setWorkshopsLoading(false);
        }
    }, [courseId]);

    const updatePageSettings = async (targetPageId, settings) => {
        try {
            await pageService.updateDetails(courseId, moduleId, targetPageId, {
                max_tries: parseInt(settings.max_attempts),
                passing_score: parseInt(settings.passing_score)
            });
            return true;
        } catch (err) {
            console.error("Failed to update page settings:", err);
            return false;
        }
    };

    useEffect(()=>{
        loadElements();
    },[loadElements]);

    return {elements, loading, error, refresh: loadElements, createNewElement, updateExistingElement, deleteElement, moveElement, workshopsLoading,loadWorkshops, workshops, updatePageSettings};
}