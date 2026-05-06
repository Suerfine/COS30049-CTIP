import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, TextInput } from 'react-native';
import { Plus, ChevronRight, ChevronDown, Search, Trash2, Lock, CheckCircle2 } from 'lucide-react-native';
import { useOutline } from '../hooks/useOutline';
import * as Progress from 'react-native-progress';

const OutlineBar = ({ course, progressMap, onSelectPage, editable, isCollapsed, isLocked }) => {
    const {
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
    } = useOutline(course);

    const [selectedItem, setSelectedItem] = useState({ type: 'overview' });
    const [hoveredItem, setHoveredItem] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    const [localSearch, setLocalSearch] = useState("");

    if (!course) return null;

    const handleSelect = (item) => {
        // Hard Lock: Prevent access to modules if the user is not enrolled
        if (isLocked && item.type !== 'overview') return; 
        setSelectedItem(item);
        onSelectPage(item);
    };

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
    }, [localSearch, allModules]);

    return (
        <View style={[styles.outlinebar, isCollapsed ? styles.collapsed : null]}>
            {!isCollapsed && (
                <View style={styles.search}>
                    <Search size={18} color="#8f8f8f" />
                    <TextInput 
                        style={styles.input} 
                        placeholder='Search...' 
                        placeholderTextColor="#8f8f8f"
                        value={localSearch}
                        onChangeText={setLocalSearch}
                    />
                </View>
            )}
            
            {!isCollapsed && (
                <Pressable 
                    style={[styles.item, selectedItem?.type === 'overview' && styles.selected]} 
                    onPress={() => handleSelect({ type: 'overview', course })} 
                >
                    <Text style={styles.overview}>Course Overview</Text>
                </Pressable>
            )}

            <FlatList
                data={[...allModules].sort((a, b) => (a.order || 0) - (b.order || 0))}
                keyExtractor={module => module.id.toString()}
                renderItem={({ item: module, index: moduleIndex }) => {
                    const mid = module.id;
                    const displayModuleNum = moduleIndex + 1;
                    const modStatus = progressMap[`module_${mid}`] || { percent: 0 };
                    const isSelected = (selectedItem?.type === "module" && selectedItem?.module?.id === mid) || 
                                       (selectedItem?.type === "page" && selectedItem?.module?.id === mid);
                    
                    const isEditingModule = editingItem?.type === "module" && editingItem.id === mid;
                    const isNewModule = editable && module.title === "";

                    return (
                        <View style={[isSelected ? styles.selectedModule : null]}>
                            <View style={styles.moduleWrapper}>
                                {/* Module-level Progress Bar*/}
                                {!editable && !isLocked && (
                                    <View style={[styles.moduleProgressBar, { width: `${modStatus.percent}%` }]} />
                                )}
                                
                                <Pressable 
                                    style={[styles.moduleBlock, isSelected ? styles.selected : null, isLocked && styles.lockedItem]} 
                                    onPress={() => {
                                        if (isLocked || isEditingModule || isNewModule) return;
                                        handleSelect({ type: 'module', module }); 
                                        toggleModule(mid);
                                        if (editable && expandedModule !== mid && module.title !== "") {
                                            setEditingItem({ type: 'module', id: mid });
                                        }
                                    }}
                                >
                                    <Text style={styles.moduleTitle}>
                                        Module {displayModuleNum}:{" "}
                                        {(isEditingModule || isNewModule) ? (
                                            <TextInput
                                                style={styles.section}
                                                defaultValue={module.title}
                                                autoFocus
                                                onBlur={(e) => {
                                                    if (isNewModule) saveModule(mid, e.nativeEvent.text);
                                                    else updateModuleTitle(mid, e.nativeEvent.text);
                                                    setEditingItem(null);
                                                }}
                                            />
                                        ) : (
                                            getHighlightedText(module.title, localSearch)
                                        )}
                                    </Text>
                                    {expandedModule === mid ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                                </Pressable>
                            </View>

                            {/* Expanded Pages Block */}
                            {expandedModule === mid && (
                                <View>
                                    {module.pages?.map((page, pageIndex) => {
                                        const displayPageNum = `${displayModuleNum}.${pageIndex + 1}`;
                                        const status = progressMap[page.id] || { isLocked: true, percent: 0, isCompleted: false };
                                        const isPageLocked = isLocked || (!editable && status.isLocked);
                                        const isEditingPage = editingItem?.type === 'page' && editingItem.pageId === page.id;

                                        return (
                                            <Pressable
                                                key={page.id}
                                                disabled={isPageLocked}
                                                style={[
                                                    styles.pageItem, 
                                                    selectedItem?.page?.id === page.id && styles.selectedPage, 
                                                    isPageLocked && styles.lockedItem
                                                ]}
                                                onPress={() => {
                                                    if (isPageLocked) return;
                                                    handleSelect({ type: 'page', module, page });
                                                    if (editable) setEditingItem({ type: 'page', moduleId: mid, pageId: page.id });
                                                }}
                                            >
                                                <View style={styles.pageBlock}>
                                                    <Text style={[styles.pageText, isPageLocked && styles.lockedText]}>
                                                        {displayPageNum} {" "}
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
                                                            getHighlightedText(page.title, localSearch)
                                                        )}
                                                    </Text>
                                                    {/* Page Progress Indicator*/}
                                                    {!editable && !isLocked && (
                                                        <View style={styles.statusIconContainer}>
                                                            {status.isCompleted ? (
                                                                <CheckCircle2 size={20} color="#0a6340" />
                                                            ) : status.isLocked ? (
                                                                <Lock size={14} color="#9ca3af" />
                                                            ) : (
                                                                <Progress.Circle 
                                                                    progress={status.percent / 100} 
                                                                    size={21} 
                                                                    color="#0a6340" 
                                                                    thickness={3} 
                                                                />
                                                            )}
                                                        </View>
                                                    )}
                                                </View>
                                            </Pressable>
                                        );
                                    })}

                                    {editable && (
                                        <Pressable onPress={() => addPage(mid)} style={styles.pageItem}>
                                            <Text style={styles.addPage}>+ Add New Page</Text>
                                        </Pressable>
                                    )}
                                </View>
                            )}
                        </View>
                    );
                }}
            />
        </View>
    );
};

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