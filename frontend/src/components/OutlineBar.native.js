import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, TextInput, Animated, Dimensions} from 'react-native';
import { Plus, ChevronRight, ChevronDown, Search, Trash2, Lock, CheckCircle2, XCircle, X } from 'lucide-react-native';
import { useOutline } from '../hooks/useOutline';
import * as Progress from 'react-native-progress';

const { width } = Dimensions.get('window');

const OutlineBar = ({ course, progressMap = {}, onSelectPage, editable, isOpen, onClose, isLocked, isFailed }) => {
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
        deletePage,
    } = useOutline(course);

    const slideAnim = useRef(new Animated.Value(-width)).current;
    const [shouldRender, setShouldRender] = useState(isOpen);

    const [selectedItem, setSelectedItem] = useState({ type: 'overview' });
    const [hoveredItem, setHoveredItem] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    const [localSearch, setLocalSearch] = useState('');
    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: -width,
                duration: 300,
                useNativeDriver: true,
            }).start(() => setShouldRender(false));
        }
    }, [isOpen]);
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

    if (!shouldRender || !course) return null;

    // handlers
    const handleSelect = (item) => {
        if (isLocked && item.type !== 'overview') return;
        setSelectedItem(item);
        onSelectPage(item); // handleSelectPage in UserModule sets selectedPage AND calls setOutlineOpen(false)
    };

    const getHighlightedText = (text, query) => {
        if (!query || !text) return <Text>{text}</Text>;
        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return (
            <Text>
                {parts.map((part, i) =>
                    part.toLowerCase() === query.toLowerCase()
                        ? <Text key={i} style={styles.highlight}>{part}</Text>
                        : <Text key={i}>{part}</Text>
                )}
            </Text>
        );
    };

    return (
        <View style={[StyleSheet.absoluteFill, {zIndex: 99999, elevation: 99999, }]} pointerEvents={isOpen ? 'auto' : 'none'}>

            <Pressable style={styles.overlay} onPress={onClose} />

            <Animated.View style={[
                styles.sidebarContainer,
                { transform: [{ translateX: slideAnim }] }
            ]}>
                <View style={styles.search}>
                    <Search size={18} color="#8f8f8f" />
                    <TextInput
                        style={styles.input}
                        placeholder="Search..."
                        placeholderTextColor="#8f8f8f"
                        value={localSearch}
                        onChangeText={setLocalSearch}
                    />
                </View>

                <Pressable
                    style={[styles.item, selectedItem?.type === 'overview' && styles.selected]}
                    onPress={() => handleSelect({ type: 'overview', course })}
                >
                    <Text style={styles.overview}>Course Overview</Text>
                </Pressable>

                <FlatList
                    data={[...allModules].sort((a, b) => (a.order || 0) - (b.order || 0))}
                    keyExtractor={(m) => m.id.toString()}
                    extraData={progressMap}
                    ListHeaderComponent={
                        <>
                            {/* Forum */}
                            <Pressable
                                disabled={isLocked}
                                style={[styles.item, selectedItem?.type === 'forum' && styles.selected, isLocked && styles.lockedItem]}
                                onPress={() => handleSelect({ type: 'forum', course })}
                            >
                                <Text style={styles.forum}>Discussion Forum</Text>
                            </Pressable>

                            {/* Workshop */}
                            {!editable && (
                                <Pressable
                                    disabled={isLocked}
                                    style={[styles.item, selectedItem?.type === 'workshops' && styles.selected, isLocked && styles.lockedItem]}
                                    onPress={() => handleSelect({ type: 'workshops', course })}
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
                            editable && module.title === "";
                        const isEditing = isEditingModule || isNewModule;
                        const modStatus = progressMap[`module_${mid}`] || { percent: 0 };

                        return (
                            <View style={isSelected && styles.selectedModule}>

                                {/* MODULE */}
                                <View
                                    onMouseEnter={() => setHoveredItem({ type: 'module', id: mid })}
                                    onMouseLeave={() => setHoveredItem(null)}
                                >
                                    <Pressable
                                        style={[styles.moduleBlock, isSelected && styles.selected, isLocked && styles.lockedItem]}
                                        onPress={() => {
                                            if (isLocked || isEditing) return;
                                            toggleModule(mid);
                                            if (editable && expandedModule !== mid) {
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
                                    </Pressable>

                                    {/* {!editable && !isLocked && (
                                        <View style={[styles.progressBar, { width: `${modStatus.percent}%` }]} />
                                    )} */}
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
                                                        isPageLocked && styles.lockedItem,
                                                    ]}
                                                    onPress={() => {
                                                        if (isPageLocked) return;
                                                        handleSelect({ type: 'page', module, page });
                                                        if (editable) {
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

                                                        {editable && isHoveringPage && !isEditingPage && (
                                                            <Pressable onPress={() => deletePage(mid, page.id)}>
                                                                <Trash2 size={16} color="red"/>
                                                            </Pressable>
                                                        )}
                                                    </View>
                                                </Pressable>
                                            );
                                        })}

                                        {/* {editable && (
                                            <Pressable onPress={() => addPage(mid)} style={styles.pageItem}>
                                                <Text style={styles.addPage}>+ Add New Page</Text>
                                            </Pressable>
                                        )} */}
                                    </View>
                                )}
                            </View>
                        );
                    }}
                />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1,
        elevation: 1,
    },
    sidebarContainer: {
        width: width * 0.72,
        height: '100%',
        backgroundColor: 'white',
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        elevation: 10,
        paddingTop: 50,
        paddingBottom: 20,
        zIndex: 2,
        elevation: 2,
    },
    search: {
        flexDirection: 'row',
        gap: 6,
        borderWidth: 1,
        borderColor: '#d0d0d0',
        paddingVertical: 2,
        backgroundColor: 'white',
        borderRadius: 15,
        alignItems: 'center',
        marginBottom: 10,
        marginHorizontal: 15,
        paddingHorizontal: 10,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },
    overview: {
        fontSize: 16,
        fontWeight: '600',
        paddingLeft: 20,
        paddingVertical: 5,
        paddingRight: 20,
    },
    forum: {
        fontSize: 16,
        fontWeight: '600',
        paddingLeft: 20,
        paddingVertical: 5,
        paddingRight: 20,
    },
    item: {
        paddingVertical: 10,
        flexDirection: 'row',
    },
    moduleBlock: {
        flexDirection: 'row',
        minHeight: 50,
        alignItems: 'center',
        paddingRight: 10,
        paddingLeft: 15,
        paddingVertical: 15,
        justifyContent: 'space-between',
    },
    moduleTitle: {
        flex: 1,
        fontWeight: '600',
        marginRight: 8,
    },
    pageItem: {
        paddingVertical: 10,
        paddingHorizontal: 15,
    },
    pageBlock: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flex: 1,
        gap: 5,
        alignItems: 'center',
    },
    section: {
        borderWidth: 1,
        borderColor: '#8f8f8f',
        borderRadius: 6,
        backgroundColor: '#f9f9f9',
        paddingVertical: 6,
        paddingHorizontal: 10,
        marginTop: 5,
    },
    progressBar: {
        height: 3,
        backgroundColor: '#A5D6A7',
    },
    selected: {
        backgroundColor: '#A5D6A7',
    },
    selectedModule: {
        backgroundColor: '#E8F5E9',
    },
    selectedPage: {
        backgroundColor: '#9ee5a375',
    },
    highlight: {
        backgroundColor: '#ffd07d',
        fontWeight: '700',
        color: '#000',
    },
    lockedItem: {
        opacity: 0.4,
    },
});

export default OutlineBar;