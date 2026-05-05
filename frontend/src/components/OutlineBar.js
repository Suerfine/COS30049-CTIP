import React,{use, useState, useEffect} from 'react';
import {View, Text, StyleSheet, Pressable, FlatList,TextInput} from 'react-native';
import {Plus, ChevronRight, ChevronDown,Search, Trash2} from 'lucide-react-native';
import { useOutline } from '../hooks/useOutline';

const OutlineBar=({course, onSelectPage, editable, isCollapsed, isLocked})=>{
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
    const [localSearch, setLocalSearch] = useState("");
    

    if(!course){
        return;
    }

    const handleSelect=(item)=>{
        if (isLocked && item.type !== 'overview') return;
        setSelectedItem(item);
        onSelectPage(item);
    }

    const getHighlightedText = (text, query) => {
        if (!query || !text) return <Text>{text}</Text>;
        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        
        return (
            <Text>
                {parts.map((part, i) => 
                    part.toLowerCase() === query.toLowerCase() ? (
                        <Text key={i} style={styles.highlight}>{part}</Text>
                    ) : (
                        <Text key={i}>{part}</Text>
                    )
                )}
            </Text>
        );
    };

    useEffect(() => {
        if (localSearch.length > 0) {
            allModules.forEach(module => {
                const hasMatch = module.pages?.some(p => 
                    p.title.toLowerCase().includes(localSearch.toLowerCase())
                );
                if (hasMatch && expandedModule !== module.id) {
                    toggleModule(module.id);
                }
            });
        }
    }, [localSearch]);

    return(
        <View style={[styles.outlinebar, isCollapsed ? styles.collapsed : null]}>
            {!isCollapsed && (
                <View style={styles.search}>
                    <Search size={18}/>
                    <TextInput 
                        style={styles.input} 
                        placeholder='Search...' 
                        placeholderTextColor="#8f8f8f"
                        value={localSearch}
                        onChangeText={setLocalSearch}
                    />
                </View>
            )}
            
            {/* Overview */}
            {!isCollapsed && (
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
            </Pressable>)}
            {/* Modules */}
            <FlatList
                data={[...allModules].sort((a, b) => (a.order || 0) - (b.order || 0))}
                keyExtractor={module => module.id}
                renderItem={({ item: module, index:moduleIndex}) => {
                    const mid=module.id;
                    const displayModuleNum=moduleIndex+1;
                    const sortedPages=[...(module.pages||[])].sort((a,b)=>(a.order || 0)-(b.order || 0));
                    const isNewSection=(editable && module.title==="");
                    const isEditingExisting= (editingItem?.type==="module" && editingItem.id===mid);
                    const isEditing=isNewSection || isEditingExisting;
                    const isSelected=(selectedItem?.type==="module" && selectedItem?.module?.id===mid) || (selectedItem?.type ==="page" && selectedItem?.module?.id===mid);
                    return (
                    <View style={[isSelected ? styles.selectedModule : null]}>

                        <Pressable style={[styles.moduleBlock, isSelected ? styles.selected : null, isLocked && styles.lockedItem]} 
                              onPress={()=> {
                                if (isLocked) return;
                                if(isEditing){
                                    return;
                                }
                                handleSelect({type:'module', module}); 
                                toggleModule(mid);
                                if(editable && expandedModule!==(mid) && module.title !== ""){
                                    setEditingItem({type:'module', id:mid});
                                };
                                }}
                                onMouseEnter={()=>setHoveredItem({type:'module', id:mid})}
                                onMouseLeave={()=>setHoveredItem(null)}
                              >
                            <Text style={styles.moduleTitle}>Module {displayModuleNum}:{" "} 
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
                                            saveModule(mid,val);
                                        } else {
                                            updateModuleTitle(mid,val);
                                            setEditingItem(null);
                                        }
                                    }}
                                    />
                                ) : (
                                    // Show Module Title or Editing Input
                                    editingItem?.type === 'module' && editingItem.id === mid ? (
                                    <TextInput
                                        style={styles.section}
                                        defaultValue={module.title}
                                        onBlur={(e) => {
                                            const val=e.nativeEvent.text;
                                            if (isNewSection) {
                                                saveModule(mid,val);
                                            } else {
                                                updateModuleTitle(mid,val);
                                                setEditingItem(null);
                                            }
                                    }}
                                    />
                                    ) : (
                                    <Text>
                                        {getHighlightedText(module.title, localSearch)}
                                    </Text>
                                    )
                                )}  

                            </Text>
                            {expandedModule === mid ? <ChevronDown size={15}/> : <ChevronRight size={15}/>}
                                {editable && !isEditing && (hoveredItem?.id === mid || isSelected) && (
                                    <Pressable onPress={()=>deleteModule(mid)}>
                                        <Trash2 size={16}/>
                                    </Pressable>
                                )}
                            </Pressable>
                            
                        {/* Show Expanded Pages */}
                        {expandedModule === mid && (
                            <View 
                                onMouseEnter={() => setHoveredItem({ type: 'page', moduleId: mid })}
                                onMouseLeave={() => setHoveredItem(null)}
                            >
                                {module.pages?.map((page, pageIndex) => {
                                    const displayPageNum = `${displayModuleNum}.${pageIndex}`;
                                    const isEditingPage = editingItem?.type === 'page' && editingItem.pageId === page.id;
                                    
                                    const isHoveringPage = hoveredItem?.type === 'page' && hoveredItem.pageId === page.id;

                                    return page.title === '' ? (
                                        <View key={page.id} style={styles.PageSection}>
                                            <Text>{displayPageNum}:</Text>
                                            <TextInput
                                                style={styles.section}
                                                placeholder="Enter page title..."
                                                placeholderTextColor="#8f8f8f"
                                                defaultValue={page.title}
                                                autoFocus
                                                onBlur={(e) => {
                                                    updatePageTitle(mid, page.id, e.nativeEvent.text);
                                                    setEditingItem(null);
                                                }}
                                            />
                                        </View>
                                    ) : (
                                        <Pressable
                                            key={page.id} 
                                            style={[
                                                styles.pageItem, 
                                                selectedItem?.type === 'page' && selectedItem?.page?.id === page.id && styles.selectedPage, isLocked && styles.lockedItem,
                                            ]}
                                            onPress={() => {
                                                if (isLocked) return;
                                                handleSelect({ type: 'page', module, page });
                                                if (editable) {
                                                    setEditingItem({ type: 'page', moduleId: mid, pageId: page.id });
                                                }
                                            }}
                                            onMouseEnter={() => setHoveredItem({ type: 'page', moduleId: mid, pageId: page.id })}
                                            onMouseLeave={() => setHoveredItem(null)}
                                        >
                                            <View style={styles.pageBlock}>
                                                <Text style={{ flex: 1 }}>
                                                    {displayPageNum}: {" "} 
                                                    {isEditingPage ? (
                                                        <TextInput
                                                            style={styles.section}
                                                            defaultValue={page.title}
                                                            autoFocus
                                                            onBlur={(e) => {
                                                                updatePageTitle(mid, page.id, e.nativeEvent.text);
                                                                setEditingItem(null);
                                                            }}
                                                        />
                                                    ) : (
                                                        <Text>{getHighlightedText(page.title, localSearch)}</Text>
                                                    )}
                                                </Text>
                                                
                                                {/* Trash Icon Logic */}
                                                {editable && isHoveringPage && !isEditingPage && pageIndex!==0 && (
                                                    <Pressable onPress={() => deletePage(mid, page.id)}>
                                                        <Trash2 size={16} color="#ef4444" />
                                                    </Pressable>
                                                )}
                                            </View>
                                        </Pressable>
                                    );
                                })}

                                {editable && expandedModule === mid && (
                                    <Pressable
                                        onPress={() => addPage(mid)}
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
        width:240,
        flexShrink:0,
        minHeight:'90vh',
        userSelect:'none',
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
        paddingRight:50
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
        fontWeight:'600'
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
        borderColor: '#8f8f8f', 
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
    },
    highlight: {
        backgroundColor: '#ffd07d', 
        fontWeight: '700',
        color: '#000',
    },
    lockedItem:{
        opacity: 0.4,
    }
});

export default OutlineBar;