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
        const nextOrder=allModules.length+1;
        const maxId = allModules.reduce((max, m) => Math.max(max, m.moduleId), 0);
        const nextId = maxId + 1;

        setNewSectons(prev=>[
            ...prev,
            {moduleId:nextId, title: '', pages: [], order:nextOrder, isTemp:true}
        ])
    };

    const saveModule=async(moduleId, newTitle)=>{
        if(!newTitle.trim()){
            return;
        }
        const pending=newSections.find(s=>s.id===tempId);
        try{
            const payload={
                title:newTitle,
                order:pending.order
            };
            const createdModule=await moduleService.create(course.id, payload);
            setModules(prev=>[...prev, createdModule]);
            setNewSectons(prev=>prev.filter(s=>s.moduleId!==moduleId));
            const res=await moduleService.create(course.id,{moduleId,newTitle, pages: []});
        }catch(err){
            console.error('Failed to update section or create intro page',err);
            alert(err);
        }
    };

    const updateModuleTitle=async(moduleId,newTitle)=>{
        try{
            setModules(prev=>prev.map(m=>m.moduleId === moduleId ? {...m,title:newTitle} : m));
            await moduleService.update(course.id, moduleId, newTitle);
        }catch(err){
            console.error('Update Module Title Error:',err);
        }
        
        // setNewSectons(prev=>prev.map(s=>(s.moduleId===moduleId ? {...s, title:newTitle} :s)));

    };

    const deleteModule=async(moduleId)=>{
        const confirmed=window.confirm(`Are you sure you want to delete this module and all its pages?`);
        if(!confirmed){
            return;
        }
        try{
            await moduleService.delete(course.id, moduleId);
            setModules(prev=>prev.filter(m=>m.id !== moduleId));
        }catch(err){
            alert("Delete failed:"+err);
        }
    };

    // Page Function
    const addPage=async(moduleId)=>{
        try{
            const parentModule=modules.find(m=>m.moduleId===moduleId);
            const nextPageOrder=(parentModule.pages?.length || 0)+1;

            const payload={
                title:'New Page',
                order:nextPageOrder
            };

            const createdPage=await pageService.create(course.id, moduleId, newPage);
            setModules(prev => prev.map(m => 
                m.moduleId === moduleId ? { ...m, pages: [...m.pages, newPage] } : m
            ));
        } catch(err){
            alert("Create Page failed:"+err);
        }
    };

    const updatePageTitle=async(moduleId, pageId, newTitle)=>{
        try{
            setModules(prev=>prev.map(m=>{
                if(m.moduleId===moduleId){
                    return {...m,pages:m.pages.map(p=>p.pageId===pageId?{...p,title:newTitle}:p)};
                }
                return m;
            }));
            await pageService.update(course.id,moduleId,pageId,newTitle);
        }catch(err){
            alert("Update Page failed:"+err);
        }
    };

    const deletePage=async(moduleId, pageId)=>{
        const confirmed = window.confirm(`Are you sure you want to delete this page?`);
        if (!confirmed) return;

        try{
            await pageService.delete(course.id, moduleId, pageId);
            setModules(prev => prev.map(m => 
                m.moduleId === moduleId ? { ...m, pages: m.pages.filter(p => p.pageId !== pageId) } : m
            ));
        }catch(err){
            alert("Delete Page failed:"+err);
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
