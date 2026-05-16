import React,{ useRef, useEffect, useState } from 'react';
import { View, Text, Pressable, Animated, StyleSheet, useWindowDimensions } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';

const SlidingTabs=({ tabs, activeTab, onTabChange, fullWidth = false, collapseOnCompact = false })=>{
    const [containerWidth, setContainerWidth] = useState(0);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const { width } = useWindowDimensions();
    const useDropdown = collapseOnCompact && width < 700;
    const activeIndex = Math.max(0, tabs.findIndex(t => t.id === activeTab));
    const slideAnim = useRef(new Animated.Value(activeIndex)).current;

    useEffect(() => {
        Animated.spring(slideAnim, {
            toValue: activeIndex,
            useNativeDriver: false,
            friction: 8,
            tension: 40,
        }).start();
    }, [activeIndex]);

    const tabWidth = fullWidth
        ? containerWidth / tabs.length
        : 110;
    const translateX = slideAnim.interpolate({
        inputRange: tabs.map((_, i) => i),
        outputRange: tabs.map((_, i) => i * tabWidth),
    });

    if (useDropdown) {
        const activeLabel = tabs.find((tab) => tab.id === activeTab)?.label || tabs[0]?.label;
        return (
            <View style={styles.dropdownWrapper}>
                <Pressable style={styles.dropdownTrigger} onPress={() => setDropdownOpen((prev) => !prev)}>
                    <Text style={styles.dropdownTriggerText}>{activeLabel}</Text>
                    {dropdownOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </Pressable>
                {dropdownOpen && (
                    <View style={styles.dropdownMenu}>
                        {tabs.map((tab) => (
                            <Pressable
                                key={tab.id}
                                style={[styles.dropdownItem, activeTab === tab.id && styles.dropdownItemActive]}
                                onPress={() => {
                                    onTabChange(tab.id);
                                    setDropdownOpen(false);
                                }}
                            >
                                <Text style={[styles.dropdownItemText, activeTab === tab.id && styles.dropdownItemTextActive]}>
                                    {tab.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                )}
            </View>
        );
    }

    return (
        <View 
            style={[
                styles.tabWrapper,
                fullWidth ? styles.fullWidth : { width: tabWidth * tabs.length },
            ]}
            onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        >
            <View style={styles.tabContainer}>
                {tabs.map((tab) => (
                    <Pressable
                        key={tab.id}
                        style={[
                            styles.tab,
                            { width: fullWidth ? tabWidth : 110 },
                        ]}
                        onPress={() => onTabChange(tab.id)}
                    >
                        <Text
                            numberOfLines={1}
                            style={activeTab === tab.id ? styles.activeText : styles.tabText}
                        >
                            {tab.label}
                        </Text>
                    </Pressable>
                ))}
            </View>
            {containerWidth > 0 && (
                <Animated.View
                    style={[
                        styles.slidingLine,
                        {
                            width: tabWidth * 0.8,
                            left: tabWidth * 0.1,
                            transform: [{ translateX }],
                        },
                    ]}
                />
            )}
        </View>
    );
};

const styles=StyleSheet.create({
    tabWrapper:{
        position:'relative',
    },
    fullWidth: {
        width: '100%',
    },
    tabContainer:{
        flexDirection:'row'
    },
    slidingLine:{
        position:"absolute",
        bottom:0,
        height:3,
        backgroundColor:'#0a6340',
        borderRadius:3
    },
    tab:{
        paddingVertical:10,
        alignItems:'center'
    },
    activeText:{
        color:'#065133c6',
        fontWeight:'bold',
    },
    tabText:{
        fontSize:14,
        color:'#666',
    },
    dropdownWrapper: {
        position: 'relative',
        zIndex: 800,
        Width: '100%',
    },
    dropdownTrigger: {
        minHeight: 42,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 10,
        backgroundColor: 'white',
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dropdownTriggerText: {
        fontWeight: '600',
        color: '#111827',
    },
    dropdownMenu: {
        position: 'absolute',
        top: 48,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 10,
        overflow: 'hidden',
    },
    dropdownItem: {
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    dropdownItemActive: {
        backgroundColor: '#f0fdf4',
    },
    dropdownItemText: {
        color: '#374151',
    },
    dropdownItemTextActive: {
        color: '#0a6340',
        fontWeight: '700',
    },
})

export default SlidingTabs;
