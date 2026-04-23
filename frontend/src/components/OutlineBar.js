import React,{use, useState} from 'react';
import {View, Text, StyleSheet, Pressable, FlatList,TextInput} from 'react-native';
import {Plus, ChevronRight, ChevronDown,Search, Trash2} from 'lucide-react-native';
import { useOutline } from '../hooks/useOutline';

const OutlineBar=({course, onSelectPage, editable, isCollapsed})=>{
    const{
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
    } =useOutline(course);

    // Set State
    const [selectedItem, setSelectedItem]=useState({type:'overview'});
    const [hoveredItem, setHoveredItem]=useState(null);
    const [editingItem, setEditingItem]=useState(null);

    if(!course){
        return;
    }

    const handleSelect=(item)=>{
        setSelectedItem(item);
        onSelectPage(item);
    }

    return(
        <View style={[styles.outlinebar, isCollapsed ? styles.collapsed : null]}>
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
                    <Pressable onPress={addModule}>
                        <Plus size={16}/>
                    </Pressable>
                )}
            </Pressable>
            {/* Modules */}
            <FlatList
                data={allModules}
                keyExtractor={module => module.moduleId.toString()}
                renderItem={({ item: module }) => {
                    const isNewSection=(editable && module.title==="");
                    const isEditingExisting= (editingItem?.type==="module" && editingItem.id===module.moduleId);
                    const isEditing=isNewSection || isEditingExisting;
                    const isSelected=(selectedItem?.type==="module" && selectedItem?.module?.moduleId===module.moduleId) || (selectedItem?.type ==="page" && selectedItem?.module?.moduleId===module.moduleId);
                    return (
                    <View style={[isSelected ? styles.selectedModule : null]}>

                        <Pressable style={[styles.moduleBlock, isSelected ? styles.selected : null]} 
                              onPress={()=> {
                                if(isEditing){
                                    return;
                                }
                                handleSelect({type:'module', module}); 
                                toggleModule(module.moduleId);
                                if(editable && module.title !== ""){
                                    setEditingItem({type:'module', id:module.moduleId});
                                };
                                }}
                                onMouseEnter={()=>setHoveredItem({type:'module', id:module.moduleId})}
                                onMouseLeave={()=>setHoveredItem(null)}
                              >
                            <Text style={styles.moduleTitle}>Module {module.moduleId}:{" "} 
                                {/* Add New Section (blank title) */}
                                {isEditing ? (
                                    <TextInput
                                    style={styles.section}
                                    placeholder="Enter module name..."
                                    placeholderTextColor="#8f8f8f"
                                    defaultValue={module.title}
                                    onBlur={(e) => {
                                        const val=e.nativeEvent.text;
                                        if (isNewSection) {
                                            saveModule(module.moduleId,val);
                                        } else {
                                            updateModuleTitle(module.moduleId,val);
                                            setEditingItem(null);
                                        }
                                    }}
                                    />
                                ) : (
                                    // Show Module Title or Editing Input
                                    editingItem?.type === 'module' && editingItem.id === module.moduleId ? (
                                    <TextInput
                                        style={styles.section}
                                        defaultValue={module.title}
                                        onBlur={(e) => {
                                            const val=e.nativeEvent.text;
                                            if (isNewSection) {
                                                saveModule(module.moduleId,val);
                                            } else {
                                                updateModuleTitle(module.moduleId,val);
                                                setEditingItem(null);
                                            }
                                    }}
                                    />
                                    ) : (
                                    <Text>{module.title}
                                    </Text>
                                    )
                                )}  

                            </Text>
                            {expandedModule === module.moduleId ? <ChevronDown size={15}/> : <ChevronRight size={15}/>}
                            {/* Delete Course Icon */}
                            {editable && !isEditing && (hoveredItem?.id === module.moduleId || isSelected) && (
                                <Pressable onPress={()=>deleteModule(module.moduleId)}>
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
                                                onBlur={(e) => {
                                                                updatePageTitle(module.moduleId, page.pageId, e.nativeEvent.text);
                                                                setEditingItem(null);
                                                            }}
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
                                                    onBlur={(e) => {
                                                                updatePageTitle(module.moduleId, page.pageId, e.nativeEvent.text);
                                                                setEditingItem(null);
                                                            }}
                                                />
                                            ) : (
                                                <View style={styles.pageBlock}>
                                                    <Text>{page.title} </Text>
                                                    {/* Trash icon for page */}
                                                    {editable && hoveredItem?.type==='page' && hoveredItem?.pageId===page.pageId && Number(page.pageId) % 1 !== 0 && (
                                                        <Pressable onPress={()=>deletePage(module.moduleId, page.pageId)}>
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
                                    onPress={() => addPage(module.moduleId)}
                                    style={styles.pageItem}
                                    >
                                        <Text style={styles.addPage}>+ Add New Page</Text>
                                    </Pressable>
                                )}

                            </View>
                        )}
                    </View>)
                }}
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
        paddingVertical:15,
    },
    collapsed:{
        maxWidth:'0px',
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
        paddingVertical:5,
        backgroundColor:'white',
        borderRadius:15,
        alignItems:"center",
        marginBottom:25,
        marginHorizontal:15,
        paddingHorizontal:5
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