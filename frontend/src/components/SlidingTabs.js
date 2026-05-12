import React,{useRef} from 'react';
import {View, Text, Pressable, Animated, StyleSheet} from 'react-native';

const SlidingTabs=({tabs, activeTab, onTabChange})=>{
    const initialIndex = tabs.findIndex(t => t.id === activeTab);
    const slideAnim = useRef(new Animated.Value(initialIndex >= 0 ? initialIndex : 0)).current;

    const handlePress=(tabId, index)=>{
        onTabChange(tabId);
        Animated.spring(slideAnim, {
            toValue:index,
            useNativeDriver:false,
            friction:8,
            tension:40
        }).start();
    };

    const translateX=slideAnim.interpolate({
        inputRange:tabs.map((item,i)=>i),
        outputRange:tabs.map((item,i)=>i*103),
    });

    return (
        <View style={styles.tabWrapper}>
            <View style={styles.tabContainer}>
                {tabs.map((tab,index)=>(
                    <Pressable key={tab.id} style={styles.tab} onPress={()=>handlePress(tab.id, index)}>
                        <Text style={activeTab===tab.id ? styles.activeText : styles.tabText}
                        >{tab.label}</Text>
                    </Pressable>
                ))}
            </View>
            <Animated.View style={[styles.slidingLine, {transform:[{translateX}]}]}/>
        </View>
    )
};

const styles=StyleSheet.create({
    tabWrapper:{
        position:'relative',
        justifyContent:'space-between',
    },
    tabContainer:{
        width:'100%',
        flexDirection:'row'
    },
    slidingLine:{
        position:"absolute",
        bottom:0,
        width:95,
        height:3,
        backgroundColor:'#0a6340',
        borderRadius:3
    },
    tab:{
        paddingVertical:10,
        width:100,
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