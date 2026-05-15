import React,{ useRef, useEffect, useState } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';

const SlidingTabs=({ tabs, activeTab, onTabChange, fullWidth = false })=>{
    const [containerWidth, setContainerWidth] = useState(0);
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
})

export default SlidingTabs;