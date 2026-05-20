import { useEffect, useState } from 'react';
import { moduleService } from '../services/moduleService';
import { pageService } from '../services/pageService';

export const useOutline = (course) => {
    const [modules, setModules] = useState(course.modules || []);
    const [newSections, setNewSectons] = useState([]);
    const [expandedModule, setExpandedModule] = useState(null);

    useEffect(() => {
        if (course?.modules) {
            setModules(course.modules);
        }
    }, [course]);

    const allModules = [...modules, ...newSections];

    const toggleModule = async (moduleId) => {
        const targetModule = modules.find(m => m.id === moduleId);
        
        if (expandedModule !== moduleId && (!targetModule.pages || targetModule.pages.length === 0)) {
            try {
                const pages = await pageService.getAll(course.id, moduleId);
                setModules(prev => prev.map(m => 
                    m.id === moduleId ? { ...m, pages: pages } : m
                ));
            } catch (err) {
                console.error("Could not load pages:", err);
            }
        }
        
        setExpandedModule(expandedModule === moduleId ? null : moduleId);
    };

    const addModule = () => {
        const hasPendingSection = newSections.some(s => s.title === "");
        if (hasPendingSection) {
            alert("Finish naming the current new section before adding another.");
            return;
        }
        const nextOrder = allModules.length + 1;
        const tempId = Date.now();

        setNewSectons(prev => [
            ...prev,
            { id: tempId, title: '', pages: [], order: nextOrder, isTemp: true }
        ]);
    };

    const saveModule = async (tempId, newTitle) => {
        if (!newTitle.trim()) return;

        const pending = newSections.find(s => s.id === tempId);
        try {
            const payload = {
                title: newTitle,
                order: pending.order,
                complete_by_week:1
            };
            const createdModule = await moduleService.create(course.id, payload);

            const introPagePayload={
                title:'Introduction',
                order:1,
                passing_score:1,
            };
            try{
                const introPage=await pageService.create(course.id, createdModule.id,introPagePayload);
                const moduleWithPage={
                    ...createdModule,
                    pages:[introPage]
                };
                setModules(prev => [...prev, moduleWithPage]);
                setNewSectons(prev => prev.filter(s => s.id !== tempId));

                setExpandedModule(createdModule.id);
            }catch(pageErr){
                console.error("Module created, but failed to create into page: ", pageErr);
                setModules(prev => [...prev, { ...createdModule, pages: [] }]);
                setNewSectons(prev => prev.filter(s => s.id !== tempId));
            }
            
            
        } catch (err) {
            console.error('Failed to save module:', err);
            alert("Save failed: " + err);
        }
    };

    const cancelModule = (tempId) => {
        setNewSectons(prev =>
            prev.filter(s => s.id !== tempId)
        );  
    };

    const updateModuleTitle = async (id, newTitle) => {
        try {
            setModules(prev => prev.map(m => m.id === id ? { ...m, title: newTitle } : m));
            await moduleService.update(course.id, id, newTitle);
        } catch (err) {
            console.error('Update Module Title Error:', err);
        }
    };

    const deleteModule = async (id) => {
        if (!window.confirm(`Delete this module?`)) return;
        try {
            await moduleService.delete(course.id, id);
            setModules(prev => prev.filter(m => m.id !== id));
        } catch (err) {
            alert("Delete failed: " + err);
        }
    };

    const addPage = async (moduleId, isFinalQuiz=false) => {
        try {
            const parentModule = modules.find(m => m.id === moduleId);
            const nextPageOrder = (parentModule.pages?.length || 0) + 1;
            console.log(isFinalQuiz);
            const payload = {
                title: 'New Page',
                final_quiz: isFinalQuiz,
                order: nextPageOrder,
                passing_score:1,
            };

            const createdPage = await pageService.create(course.id, moduleId, payload);
            
            setModules(prev => prev.map(m => 
                m.id === moduleId ? { ...m, pages: [...(m.pages || []), createdPage] } : m
            ));
        } catch (err) {
            alert("Create Page failed: " + err);
        }
    };

    const updatePageTitle = async (moduleId, pageId, newTitle) => {
        try {
            setModules(prev => prev.map(m => {
                if (m.id === moduleId) {
                    return { 
                        ...m, 
                        pages: m.pages.map(p => p.id === pageId ? { ...p, title: newTitle } : p) 
                    };
                }
                return m;
            }));
            await pageService.update(course.id, moduleId, pageId, newTitle);
        } catch (err) {
            alert("Update Page failed: " + err);
        }
    };

    const deletePage = async (moduleId, pageId) => {
        if (!window.confirm(`Are you sure?`)) return;
        try {
            await pageService.delete(course.id, moduleId, pageId);
            setModules(prev => prev.map(m => 
                m.id === moduleId ? { ...m, pages: m.pages.filter(p => p.id !== pageId) } : m
            ));
        } catch (err) {
            alert("Delete Page failed: " + err);
        }
    };

    return {
        allModules,
        expandedModule,
        toggleModule,
        addModule,
        saveModule,
        updateModuleTitle,
        deleteModule,
        addPage,
        updatePageTitle,
        deletePage,
        cancelModule
    };
};