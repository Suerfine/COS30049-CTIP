import { useEffect, useState } from 'react'; 
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView, Image, ImageBackground, StatusBar } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';

const UserProfile=({navigation})=>{
    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            <StatusBar barStyle="dark-content"/>
            <View style={styles.topSection}>
                {/* Top Section */}
                <Pressable onPress={()=>navigation.goBack()} style={({pressed})=>[styles.backButton, pressed && styles.btnPressed]}>
                    <ChevronLeft size={24} color="black"/>
                </Pressable>
            </View>
        </SafeAreaView>
    )
};

const styles=StyleSheet.create({
    container: {
        flex: 1,
        marginHorizontal: 10
    },
    backButton:{
        width:40,
        height:40,
        zIndex:10,
        backgroundColor:'rgba(168, 168, 168, 0.3)',
        padding:8,
        borderRadius:50,
        marginLeft:10,
    },
    topSection:{
        justifyContent:"space-between",
        flexDirection:'row',
        marginTop:15
    },
    btnPressed:{
        opacity:0.8,
        transform:[{scale:0.98}],
    },
});

export default UserProfile;