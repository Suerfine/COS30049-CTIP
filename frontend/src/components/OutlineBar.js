import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, TextInput, Modal, TouchableOpacity } from 'react-native';
import { Plus, ChevronRight, ChevronDown, Search, Trash2, Lock, CheckCircle2, XCircle, HelpCircle } from 'lucide-react-native';
import { useOutline } from '../hooks/useOutline';
import * as Progress from 'react-native-progress';

const OutlineBar = ({ course, progressMap = {}, onSelectPage, editable, isCollapsed, isLocked, isFailed, isPublished, activePage, dropdown = false }) => {
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
    const [isPageModalVisible, setIsPageModalVisible]=useState(false);
    const [pendingModuleId, setPendingModuleId]=useState(null);

    if (!course) return null;

    const initiateAddPage = (moduleId) => {
        setPendingModuleId(moduleId);
        setIsPageModalVisible(true);
    };

    const confirmAddPage = (isFinalQuiz) => {
        if (pendingModuleId) {
            addPage(pendingModuleId, isFinalQuiz); 
        }
        setIsPageModalVisible(false);
        setPendingModuleId(null);
    };

    useEffect(() => {
        if (activePage) {
            setSelectedItem(activePage);
        }
    }, [activePage]);

    useEffect(() => {
        if (activePage?.type === 'page' && activePage.page?.module_id) {
            const mid = activePage.page.module_id;
            if (expandedModule !== mid) {
                toggleModule(mid); 
            }
        }
    }, [activePage]);

    const handleSelect = (item) => {
        if (isLocked && item.type !== 'overview') return;
        setSelectedItem(item);
        onSelectPage(item);
    };

    const getHighlightedText = (text, query) => {
        if (!query || !text) return <Text>{text}</Text>;
        const sanitizedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const parts = text.split(new RegExp(`(${sanitizedQuery})`, 'gi'));
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
        if (localSearch.trim().length > 0) {
            const matchingModule = allModules.find(module =>
                module.pages?.some(p =>
                    p.title.toLowerCase().includes(localSearch.toLowerCase())
                )
            );

            if (matchingModule && expandedModule !== matchingModule.id) {
                toggleModule(matchingModule.id);
            }
        }
    }, [localSearch]);

    return (
        <View style={[styles.outlinebar, dropdown && styles.dropdownOutline, isCollapsed && styles.collapsed]}>

            {/* SEARCH */}
            {!isCollapsed && (
                <View style={styles.search}>
                    <Search size={18} color="#8f8f8f" />
                    <TextInput
                        style={styles.input}
                        placeholder='Search...'
                        value={localSearch}
                        onChangeText={setLocalSearch}
                    />
                </View>
            )}

            {/* OVERVIEW */}
            {!isCollapsed && (
                <Pressable
                    style={[styles.item, selectedItem?.type === 'overview' && styles.selected]}
                    onPress={() => handleSelect({ type: 'overview', course })}
                    onMouseEnter={() => setHoveredItem({ type: 'overview' })}
                    onMouseLeave={() => setHoveredItem(null)}
                >
                    <Text style={styles.overview}>Course Overview</Text>

                    {editable && !isPublished && hoveredItem?.type === 'overview' && (
                        <Pressable onPress={addModule}>
                            <Plus size={16} />
                        </Pressable>
                    )}
                </Pressable>
            )}

            {/* MODULES */}
            <FlatList
                data={[...allModules].sort((a, b) => (a.order || 0) - (b.order || 0))}
                keyExtractor={(m) => m.id.toString()}
                extraData={progressMap}
                ListHeaderComponent={
                    <>
                    {/* Forum */}
                    {!isCollapsed && (
                        <Pressable
                            disabled={isLocked}
                            style={[styles.item, selectedItem?.type === 'forum' && styles.selected, isLocked && styles.lockedItem]}
                            onPress={() => handleSelect({ type: 'forum', course })}
                            onMouseEnter={() => setHoveredItem({ type: 'forum' })}
                            onMouseLeave={() => setHoveredItem(null)}
                        >
                            <Text style={styles.forum}>Discussion Forum</Text>
                        </Pressable>
                    )}
                    
                    {/* Workshop */}
                    {!isCollapsed && !editable && (
                        <Pressable
                            disabled={isLocked}
                            style={[styles.item, selectedItem?.type === 'workshops' && styles.selected, isLocked && styles.lockedItem]}
                            onPress={() => handleSelect({ type: 'workshops', course })}
                            onMouseEnter={() => setHoveredItem({ type: 'workshops' })}
                            onMouseLeave={() => setHoveredItem(null)}
                        >
                            <Text style={styles.forum}>Course Workshops</Text>
                        </Pressable>
                    )}
                    </>
                }
                renderItem={({ item: module, index }) => {
                    const mid = module.id;
                    const displayModuleNum = index + 1;

                    const isSelected =
                        selectedItem?.module?.id === mid;

                    const isEditingModule =
                        editingItem?.type === 'module' && editingItem.id === mid;

                    const isNewModule =
                        editable && !isPublished && module.title === "";

                    const isEditing = isEditingModule || isNewModule;

                    const modStatus = progressMap[`module_${mid}`] || { percent: 0 };

                    return (
                        <View style={isSelected && styles.selectedModule}>

                            {/* MODULE */}
                            <View
                                onMouseEnter={() => setHoveredItem({ type: 'module', id: mid })}
                                onMouseLeave={() => setHoveredItem(null)}
                            >
                                {!editable && !isLocked && (
                                    <View style={[styles.progressBar, { width: `${modStatus.percent}%` }]} />
                                )}

                                <Pressable
                                    style={[styles.moduleBlock, isSelected && styles.selected, isLocked && styles.lockedItem]}
                                    onPress={() => {
                                        if (isLocked || isEditing) return;
                                        toggleModule(mid);
                                        if (editable && !isPublished && expandedModule !== mid) {
                                            setEditingItem({
                                                type: 'module',
                                                id: mid
                                            });
                                        }
                                    }}
                                >
                                    <Text style={styles.moduleTitle}>
                                        Module {displayModuleNum}:{" "}
                                        {isEditing ? (
                                            <TextInput
                                                style={styles.section}
                                                defaultValue={module.title}
                                                autoFocus
                                                onBlur={(e) => {
                                                    const val = e.nativeEvent.text;
                                                    isNewModule ? saveModule(mid, val) : updateModuleTitle(mid, val);
                                                    setEditingItem(null);
                                                }}
                                            />
                                        ) : (
                                            getHighlightedText(module.title, localSearch)
                                        )}
                                    </Text>

                                    {expandedModule === mid ? <ChevronDown size={15}/> : <ChevronRight size={15}/>}

                                    {editable && !isPublished && !isEditing && hoveredItem?.id === mid && (
                                        <Pressable onPress={() => deleteModule(mid)}>
                                            <Trash2 size={16} />
                                        </Pressable>
                                    )}
                                </Pressable>
                            </View>

                            {/* PAGES */}
                            {expandedModule === mid && (
                                <View>
                                    {module.pages?.map((page, i) => {
                                        const displayPageNum = `${displayModuleNum}.${i + 1}`;

                                        const status = progressMap[page.id] || {
                                            isLocked: page.isLocked, 
                                            percent: page.percent,
                                            isCompleted: page.isCompleted
                                        };

                                        const isPageLocked = isLocked || (!editable && status.isLocked);

                                        const isEditingPage =
                                            editingItem?.type === 'page' &&
                                            editingItem.pageId === page.id;

                                        const isHoveringPage =
                                            hoveredItem?.type === 'page' &&
                                            hoveredItem.pageId === page.id;

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
                                                    if (editable && !isPublished) {
                                                        setEditingItem({ type: 'page', moduleId: mid, pageId: page.id });
                                                    }
                                                }}
                                                onMouseEnter={() =>
                                                    setHoveredItem({ type: 'page', moduleId: mid, pageId: page.id })
                                                }
                                                onMouseLeave={() => setHoveredItem(null)}
                                            >
                                                <View style={styles.pageBlock}>
                                                    <Text>
                                                        
                                                        {displayPageNum}{" "}
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
                                                   <View>
                                                        {!editable && !isLocked && (
                                                            status.isCompleted
                                                                ? <CheckCircle2 size={20} color="#0a6340"/>
                                                                : isFailed 
                                                                    ? <XCircle size={20} color="#dc2626"/> 
                                                                    : status.isLocked
                                                                        ? <Lock size={14}/>
                                                                        : <Progress.Circle 
                                                                            color="#0a6340" 
                                                                            progress={Math.min(Number(status.percent || 0) / 100, 1)} 
                                                                            size={20} 
                                                                            thickness={2}
                                                                        />
                                                        )}
                                                    </View>
                                                    
                                                    {editable && !isPublished && isHoveringPage && !isEditingPage && (
                                                        <Pressable onPress={() => deletePage(mid, page.id)}>
                                                            <Trash2 size={16} color="red"/>
                                                        </Pressable>
                                                    )}
                                                </View>
                                            </Pressable>
                                        );
                                    })}

                                    {editable && !isPublished && (
                                        <Pressable onPress={() => initiateAddPage(mid)} style={styles.pageItem}>
                                            <Text style={styles.addPage}>+ Add New Page</Text>
                                        </Pressable>
                                    )}
                                </View>
                            )}
                        </View>
                    );
                }}
            />
            <Modal visible={isPageModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.confirmCard}>
                        <Text style={styles.confirmTitle}>New Lesson Page</Text>
                        <Text style={styles.confirmSub}>Is this page intended to be a <Text style={{fontWeight:'bold'}}>Final Assessment</Text>?</Text>
                        
                        <View style={styles.confirmActionRow}>
                            <TouchableOpacity 
                                style={[styles.confirmBtn, styles.btnSecondary]} 
                                onPress={() => confirmAddPage(false)}
                            >
                                <Text style={styles.btnTextDark}>Standard Lesson</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.confirmBtn, styles.btnPrimary]} 
                                onPress={() => confirmAddPage(true)}
                            >
                                <Text style={styles.btnTextLight}>Final Assessment</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity 
                            onPress={() => setIsPageModalVisible(false)} 
                            style={styles.cancelLink}
                        >
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    dropdownOutline:{
        width:'100%',
        minHeight:'auto',
        maxHeight:420,
        borderWidth:1,
        borderColor:'#e5e7eb',
        borderRadius:12,
        overflow:'hidden',
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
        marginBottom:10,
        marginHorizontal:15,
        paddingHorizontal:5
    },
    input:{
        flex:1,
        outlineStyle:'none',
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
    forum: {
        fontSize:16,
        fontWeight:'600',
        paddingLeft:20,
        paddingVertical:5,
        paddingRight:50
    },
    item:{
        paddingVertical:10,
        flexDirection:"row",
        alignItems:'center'
    },
    pageItem:{
        paddingVertical:10,
        paddingHorizontal:15
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
        flex:1,
        gap:5
    },
    highlight: {
        backgroundColor: '#ffd07d', 
        fontWeight: '700',
        color: '#000',
    },
    lockedItem:{
        opacity: 0.4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    confirmCard: {
        width: 350,
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 25,
        alignItems: 'center',
        elevation: 10
    },
    confirmTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333'
    },
    confirmSub: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 25,
        lineHeight: 20
    },
    confirmActionRow: {
        flexDirection: 'row',
        gap: 10,
        width: '100%'
    },
    confirmBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center'
    },
    btnPrimary: {
        backgroundColor: '#0a6340',
    },
    btnSecondary: {
        backgroundColor: '#f1f1f1',
        borderWidth: 1,
        borderColor: '#ddd'
    },
    btnTextLight: {
        color: 'white',
        fontWeight: '700',
        fontSize: 13
    },
    btnTextDark: {
        color: '#444',
        fontWeight: '700',
        fontSize: 13
    },
    cancelLink: {
        marginTop: 20
    },
    cancelText: {
        color: '#999',
        textDecorationLine: 'underline'
    }
});

export default OutlineBar;
