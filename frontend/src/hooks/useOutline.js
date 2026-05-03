import React, {useEffect, useState} from 'react';
import { moduleService } from '../services/moduleService';
import { pageService } from '../services/pageService';

export const useOutline=(course)=>{
    const [modules, setModules]=useState(course.modules || []);
    const [newSections, setNewSectons]=useState([]);
    const [expandedModule, setExpandedModule]=useState(null);

    useEffect(()=>{
        if(course?.modules){
            setModules(course.modules);
        }
    }, [course]);

    const allModules=[...modules, ...newSections];

    // Module Function
    const toggleModule=(moduleId)=>{
        setExpandedModule(expandedModule===moduleId ? null :moduleId);
    };

    const addModule=()=>{
        const hasPendingSection=newSections.some(s=>s.title==="");
        if(hasPendingSection){
            alert("Finish naming the current new section before adding another.");
            return alert; 
        }
        const maxId = allModules.reduce((max, m) => Math.max(max, m.moduleId), 0);
        const nextId = maxId + 1;

        setNewSectons(prev=>[
            ...prev,
            {moduleId:nextId, title: '', pages: []}
        ])
    };

    const saveModule=async(moduleId, newTitle)=>{
        if(!newTitle.trim()){
            return;
        }
        try{
            const res=await moduleService.create(course.id,{moduleId,newTitle, pages: []});
            if(res.ok){
                const createdModule={moduleId,newTitle, pages: [{ pageId: `${moduleId}.0`, title: 'Introduction' }]};
                await moduleService.create(course.id,moduleId,createdModule.pages[0]);
                setModules(prev=>[...prev, createdModule]);
                setNewSectons(prev=>prev.filter(s=>s.moduleId!==moduleId));
            }
        }catch(err){
            console.error('Failed to update section or create intro page',err);
        }
    };

    const updateModuleTitle=async(moduleId,newTitle)=>{
        setModules(prev=>prev.map(m=>m.moduleId === moduleId ? {...m,title:newTitle} : m));
        setNewSectons(prev=>prev.map(s=>(s.moduleId===moduleId ? {...s, title:newTitle} :s)));
        await moduleService.update(course.id,moduleId,newTitle);
    };

    const deleteModule=async(moduleId)=>{
        const confirmed=window.confirm(`Are you sure you want to delete this module and all its pages?`);
        if(!confirmed){
            return;
        }
        const res=await moduleService.delete(course.id,moduleId);
        if(res.ok){
            setModules(prev => prev.filter(m => m.moduleId !== moduleId));
        }
    };

    // Page Function
    const addPage=async(moduleId)=>{
        const targetModule=modules.find(m=>m.moduleId===moduleId);
        const newPageId = `${moduleId}.${targetModule.pages.length}`;
        const newPage={pageId: newPageId, title: 'New Page'};

        const res=await pageService.create(course.id,moduleId,newPage);
        if(res.ok){
            setModules(prev => prev.map(m => 
                m.moduleId === moduleId ? { ...m, pages: [...m.pages, newPage] } : m
            ));
        }
    };

    const updatePageTitle=async(moduleId, pageId, newTitle)=>{
        setModules(prev=>prev.map(m=>{
            if(m.moduleId===moduleId){
                return {...m,pages:m.pages.map(p=>p.pageId===pageId?{...p,title:newTitle}:p)};
            }
            return m;
        }));
        await pageService.update(course.id,moduleId,pageId,newTitle);
    };

    const deletePage=async(moduleId, pageId)=>{
        const confirmed = window.confirm(`Are you sure you want to delete this page?`);
        if (!confirmed) return;

        const res=await pageService.delete(course.id, moduleId,pageId);
        if(res.ok){
            setModules(prev => prev.map(m => 
                m.moduleId === moduleId ? { ...m, pages: m.pages.filter(p => p.pageId !== pageId) } : m
            ));
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
        deletePage
    }
};  
