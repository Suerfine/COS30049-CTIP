import React,{useState} from 'react';
import {View, Text, StyleSheet, Pressable, FlatList,TextInput} from 'react-native';
import {Plus, ChevronRight, ChevronDown,Search, Trash2} from 'lucide-react-native';

const OutlineBar=({course, onSelectPage, editable})=>{
    // Set State
    const [expandedModule, setExpandedModule]=useState(null);
    const [selectedItem, setSelectedItem]=useState({type:'overview'});
    const [hoveredItem, setHoveredItem]=useState(null);
    const [newSections, setNewSectons]=useState([]);
    const [editingItem, setEditingItem]=useState(null);
    const [modules, setModules]=useState(course.modules);
    const allModules=[...modules, ...newSections];

    if(!course){
        return;
    }

    // Function
    const toggleModule=(moduleId)=>{
        setExpandedModule(expandedModule===moduleId ? null :moduleId);
    };

    const handleSelect=(item)=>{
        setSelectedItem(item);
        onSelectPage(item);
    }

    const handleAddSection=()=>{
        if(!editable){
            return;
        }
        const hasPendingSection = newSections.some(s => s.title === "");
        if (hasPendingSection) {
            alert("Finish naming the current new section before adding another.");
            return;
        }
        const existingIds=[
            ...course.modules.map(m=>m.moduleId),
            ...newSections.map(s=>s.moduleId)
        ];
        const nextId=existingIds.length>0 ? Math.max(...existingIds) + 1 :1;

        setNewSectons([...newSections, {moduleId:nextId, title:'', pages:[{pageId:'1.0', title:'Introduction'}]}]);
    };

    const handleBlur=async(moduleId, value)=>{
        if(!editable){
            return;
        }

        // Update local state
        setNewSectons((prev)=>
            prev.map((s)=>(s.moduleId===moduleId ? {...s, title: value} :s))    
        );

        const newModule={
            moduleId,
            title:value,
            pages:[]
        };

        // Call backend API to persist
        try {
            await fetch(`http://localhost:5000/api/courses/${course.id}/modules`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newModule),
            });
        } catch (err) {
        console.error('Failed to update section:', err);
        }
    };

    const handleModuleUpdate=async(moduleId, newTitle)=>{
        if(!newTitle.trim()){
            setEditingItem(null);
            return;
        }
        setModules(prev=>prev.map(m=>m.moduleId === moduleId ? {...m,title:newTitle} : m))
        setNewSectons(prev=>prev.map(s=>(s.moduleId===moduleId ? {...s, title:newTitle} :s)));
        setEditingItem(null);
        try{
            await fetch(`http://localhost:5000/api/courses/${course.id}/modules/${moduleId}`,{
                method:'PUT',
                headers:{'Content-Type': 'application/json'},
                body: JSON.stringify({title:newTitle}),
            });
        }catch (err){
            console.error('Failed to update module:', err);
        }
    };

    const handleAddPage = (moduleId) => {
        // Helper to add a page to a module object
        const addPageToModule = (m) => {
            if (m.moduleId === moduleId) {
                const hasPendingPage = m.pages.some(p => p.title === "");
                if (hasPendingPage) {
                    return m;
                }
                const existingCount = m.pages.length;
                const newPageId = `${moduleId}.${existingCount}`;
                return {
                    ...m,
                    pages: [...m.pages, { pageId: newPageId, title: '' }]
                };
            }
            return m;
        };

        // Update whichever state contains the module
        setModules(prev => prev.map(addPageToModule));
        setNewSectons(prev => prev.map(addPageToModule));
    };

    const handlePageBlur = async (moduleId, pageId, value) => {
        if (!value.trim()) return; 

        const updatePageInModule = (m) => {
            if (m.moduleId === moduleId) {
                return {
                    ...m,
                    pages: m.pages.map(p => p.pageId === pageId ? { ...p, title: value } : p)
                };
            }
            return m;
        };

        setModules(prev => prev.map(updatePageInModule));
        setNewSectons(prev => prev.map(updatePageInModule));

        // API Call
        try {
            await fetch(`http://localhost:5000/api/courses/${course.id}/modules/${moduleId}/pages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pageId, title: value }),
            });
        } catch (err) {
            console.error('Failed to add page', err);
        }
    };

    const handlePageUpdate=async(moduleId, pageId, newTitle)=>{
        setEditingItem(null);
        if(!newTitle.trim()){
            setEditingItem(null);
            return;
        }
        setModules(prev=>prev.map(m=>{
            if(m.moduleId===moduleId){
                return{
                    ...m, pages:m.pages.map(p=>p.pageId === pageId ? {...p, title:newTitle} :p)
                };
            }
            return m;
        }));

        try{
            await fetch(`http://localhost:5000/api/courses/${course.id}/modules/${moduleId}/pages/${pageId}`,{
                method:'PUT',
                headers:{'Content-Type': 'application/json'},
                body: JSON.stringify({title:newTitle}),
            });
        } catch(err){
            console.error('Failed to update page:', err);
        }
    }

    const handleDeleteModule=async(moduleId)=>{
        const confirmed=window.confirm(`Are you sure you want to delete this module and all its pages?`);
        if(!confirmed){
            return;
        }
        try{
            await fetch(`http://localhost:5000/api/courses/${course.id}/modules/${moduleId}`,{
                method:'DELETE',
            });

            setModules(prev=>prev.filter(m=>m.moduleId!==moduleId));
            setNewSectons(prev=>prev.filter(s=>s.moduleId !== moduleId));
        }catch(err){
            console.error('Failed to delete module',err);
        }
    }

    const handleDeletePage = async (moduleId, pageId) => {
        const confirmed = window.confirm(`Are you sure you want to delete this page?`);
        if (!confirmed) return;

        try {
            const response = await fetch(`http://localhost:5000/api/courses/${course.id}/modules/${moduleId}/pages/${pageId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                console.error('Server error during deletion');
                return;
            }

            // Logic to update the list
            const filterPage = (prevList) => 
                prevList.map((m) => {
                    // Ensure we compare IDs correctly (cast both to String to be safe)
                    if (String(m.moduleId) === String(moduleId)) {
                        return { 
                            ...m, 
                            pages: m.pages.filter((p) => String(p.pageId) !== String(pageId)) 
                        };
                    }
                    return m;
                });
            setModules(prev => filterPage(prev));
            setNewSectons(prev => filterPage(prev)); 

            if (selectedItem?.page?.pageId === pageId) {
                setSelectedItem({ type: 'overview' });
            }

        } catch (err) {
            console.error('Failed to delete page:', err);
        }
    };

    return(
        <View style={styles.outlinebar}>
            {/* Search Component */}
            <View style={styles.search}>
                <Search size={18}/>
                <TextInput style={styles.input} placeholder='Search...' placeholderTextColor="#8f8f8f"/>
            </View>
            {/* Overview */}
            <Pressable style={[styles.item,selectedItem?.type === 'overview' && styles.selected]} 
            onPress={()=> handleSelect({type:'overview', course})} 
            onMouseEnter={()=>setHoveredItem({type: 'overview'})}
            onMouseLeave={()=>setHoveredItem(null)}
            >
                <Text style={styles.overview}>Course Overview</Text>
                {editable && hoveredItem?.type==='overview' && (
                    <Pressable onPress={handleAddSection}>
                        <Plus size={16}/>
                    </Pressable>
                )}
            </Pressable>
            {/* Modules */}
            <FlatList
                data={allModules}
                keyExtractor={module => module.moduleId.toString()}
                renderItem={({ item: module }) => (
                    <View style={[
                        (selectedItem?.type==='module' && selectedItem?.module?.moduleId===module.moduleId) || (selectedItem?.type==='page' && selectedItem?.module?.moduleId===module.moduleId) 
                        ? styles.selectedModule : null]}>

                        <Pressable style={[styles.moduleBlock,
                             (selectedItem?.type==='module' && selectedItem?.module?.moduleId===module.moduleId) ||
                             (selectedItem?.type==='page' && selectedItem?.module?.moduleId === module.moduleId)
                              ? styles.selected : null]} 
                              onPress={()=> {
                                if(editingItem?.id === module.moduleId){
                                    return;
                                }
                                handleSelect({type:'module', module}); 
                                toggleModule(module.moduleId);
                                if(editable){
                                    setEditingItem({type:'module', id:module.moduleId});
                                };
                                }}
                                onMouseEnter={()=>setHoveredItem({type:'module', id:module.moduleId})}
                                onMouseLeave={()=>setHoveredItem(null)}
                              >
                            <Text style={styles.moduleTitle}>Module {module.moduleId}:{" "} 
                                {/* Add New Section (blank title) */}
                                {editable && module.title === "" ? (
                                    <TextInput
                                    style={styles.section}
                                    placeholder="Enter module name..."
                                    placeholderTextColor="#8f8f8f"
                                    defaultValue={module.title}
                                    onBlur={(e) => handleBlur(module.moduleId, e.nativeEvent.text)}
                                    />
                                ) : (
                                    // Show Module Title or Editing Input
                                    editingItem?.type === 'module' && editingItem.id === module.moduleId ? (
                                    <TextInput
                                        style={styles.section}
                                        defaultValue={module.title}
                                        autoFocus
                                        onBlur={(e) => handleModuleUpdate(module.moduleId, e.nativeEvent.text)}
                                    />
                                    ) : (
                                    <Text>{module.title}
                                    </Text>
                                    )
                                )}  

                            </Text>
                            {expandedModule === module.moduleId ? <ChevronDown size={15}/> : <ChevronRight size={15}/>}
                            {/* Delete Course Icon */}
                            {editable && hoveredItem?.type==='module' && hoveredItem?.id===module.moduleId && (
                                <Pressable onPress={()=>handleDeleteModule(module.moduleId)}>
                                    <Trash2 size={16}/>
                                </Pressable>
                            )}
                        </Pressable>
                        
                        {/* Show Expanded Pages */}
                        {expandedModule === module.moduleId && (
                            <View onMouseEnter={() => setHoveredItem({ type: 'page', moduleId: module.moduleId})}
                                onMouseLeave={() => setHoveredItem(null)}>
                                
                                {module.pages.map(page => 
                                    page.title==='' ? (
                                        <View style={styles.PageSection}>
                                            <Text>{page.pageId}:</Text>
                                            <TextInput
                                                key={page.pageId}
                                                style={styles.section}
                                                placeholder="Enter page title..."
                                                placeholderTextColor="#8f8f8f"
                                                defaultValue={page.title}
                                                onBlur={(e) => handlePageBlur(module.moduleId, page.pageId, e.nativeEvent.text)}
                                            />
                                        </View>
                                    ):(
                                        <Pressable
                                        key={page.pageId} style={[styles.pageItem, selectedItem?.type==='page' && selectedItem?.page.pageId === page.pageId && styles.selectedPage]}
                                        onPress={() => {
                                            handleSelect({ type: 'page', module, page });
                                            if (editable) {
                                                setEditingItem({ type: 'page', moduleId: module.moduleId, pageId: page.pageId });
                                            }
                                        }}
                                        onMouseEnter={()=> setHoveredItem({type:'page', moduleId: module.moduleId, pageId: page.pageId})}
                                        
                                        >
                                            <Text>{typeof page.pageId === 'number' ? page.pageId.toFixed(1) : page.pageId}: {" "} 
                                                {editable && editingItem?.type === 'page' && editingItem.pageId === page.pageId ? (
                                                <TextInput
                                                    style={styles.section}
                                                    defaultValue={page.title}
                                                    autoFocus
                                                    onBlur={(e) => handlePageUpdate(module.moduleId, page.pageId, e.nativeEvent.text)}
                                                />
                                            ) : (
                                                <View style={styles.pageBlock}>
                                                    <Text>{page.title} </Text>
                                                    {/* Trash icon for page */}
                                                    {editable && hoveredItem?.type==='page' && hoveredItem?.pageId===page.pageId && (
                                                        <Pressable onPress={()=>handleDeletePage(module.moduleId,page.pageId)}>
                                                            <Trash2 size={16}/>
                                                        </Pressable>
                                                    )}
                                                </View>
                                                
                                            )}
                                            </Text>
                                        </Pressable>
                                    )
                                )}
                                {/* Show + Add New Page when hovering */}
                                {editable && hoveredItem?.type === 'page' && hoveredItem.moduleId === module.moduleId && (
                                    <Pressable
                                    onPress={() => handleAddPage(module.moduleId)}
                                    style={styles.pageItem}
                                    >
                                        <Text style={styles.addPage}>+ Add New Page</Text>
                                    </Pressable>
                                )}

                            </View>
                        )}
                    </View>
                )}
            />
            
        </View>
    );
}

const styles=StyleSheet.create({
    outlinebar:{
        maxWidth:'240px',
        minHeight:'90vh',
        userSelect:'none',
        flex:1,
        backgroundColor:'white',
        paddingVertical:15
    },
    overview:{
        fontSize:16,
        fontWeight:'600',
        paddingLeft:20,
        paddingVertical:5,
        paddingRight:70
    },
    moduleBlock:{
        flexDirection:'row',
        minHeight:'50px',
        alignItems:'center',
        paddingRight:10,
        paddingLeft:15,
        paddingVertical:15,
        justifyContent:'space-between'
    },
    moduleTitle:{
        width:'175px',
    },
    search:{
        flexDirection:'row',
        gap:3,
        borderWidth:1,
        borderColor:'#8f8f8f',
        maxWidth:185,
        paddingVertical:5,
        paddingHorizontal:3,
        backgroundColor:'white',
        borderRadius:15,
        alignItems:"center",
        marginBottom:25,
        marginHorizontal:20,
    },
    input:{
        flex:1,
        maxWidth:140,
        outlineStyle:'none'
    },
    selected:{
        backgroundColor:'#A5D6A7'
    },
    selectedModule:{
        backgroundColor:'#E8F5E9'
    },
    selectedPage:{
        backgroundColor:'#9ee5a375'
    },
    item:{
        paddingVertical:10,
        flexDirection:"row",
        alignItems:'center'
    },
    pageItem:{
        paddingLeft:30,
        paddingRight:10,
        paddingVertical:10,
    },
    section:{
        borderWidth: 1,
        borderColor: '#8f8f8f',  // subtle gray border
        borderRadius: 6,
        backgroundColor: '#f9f9f9',
        paddingVertical:6,
        paddingHorizontal:10,
        marginTop:5,
    },
    addPage:{
        color:'#3f3f3f'
    },
    PageSection:{
        paddingHorizontal:30,
        paddingVertical:6,
    },
    pageBlock:{
        flexDirection:'row',
        justifyContent:"space-between",
        width:'160px'
    }
});

export default OutlineBar;