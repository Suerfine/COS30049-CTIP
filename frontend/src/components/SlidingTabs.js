import React,{ useRef, useEffect, useState } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';

const SlidingTabs=({ tabs, activeTab, onTabChange })=>{
    const [containerWidth, setContainerWidth] = useState(0);
    const initialIndex = tabs.findIndex(t => t.id === activeTab);
    const slideAnim = useRef(new Animated.Value(initialIndex >= 0 ? initialIndex : 0)).current;

    useEffect(() => {
        const index = tabs.findIndex(t => t.id === activeTab);
        if (index >= 0) {
            Animated.spring(slideAnim, {
                toValue: index,
                useNativeDriver: false,
                friction: 8,
                tension: 40,
            }).start();
        }
    }, [activeTab, tabs]);

    const tabWidth = containerWidth / tabs.length;
    const translateX = slideAnim.interpolate({
        inputRange: tabs.map((_, i) => i),
        outputRange: tabs.map((_, i) => i * tabWidth),
    });

    const handlePress=(tabId, index)=>{
        onTabChange(tabId);
        Animated.spring(slideAnim, {
            toValue:index,
            useNativeDriver:false,
            friction:8,
            tension:40
        }).start();
    };

    return (
        <View 
            style={styles.tabWrapper}
            onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        >
            <View style={styles.tabContainer}>
                {tabs.map((tab,index)=>(
                    <Pressable 
                        key={tab.id} 
                        style={[styles.tab, { width: tabWidth || `${100 / tabs.length}%` }]}
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
    tabContainer:{
        width:'100%',
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
})

export default SlidingTabs;