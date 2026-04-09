import { View, Pressable, Image, Text, StyleSheet} from 'react-native';
import {BookOpenText, CheckCheck, Timer, ClockAlert} from 'lucide-react-native'
import ProgressBar from './ProgressBar.js';

const CourseCard=({id,imagePath, courseTitle, numModules,duration,expiry,userType, progress, onPress})=>{
    return (
        // Title need change to course ID later
        <Pressable style={styles.card} onPress={onPress}>
            <Image source={imagePath} style={styles.courseImg} accessibilityLabel='Cover Photo of Course'/>
            <Text style={styles.CourseTitle}>{courseTitle}</Text>
            
            <View style={styles.courseDetails}>
                <BookOpenText size={20}/>
                <Text style={styles.DetailsText}>{numModules} Modules</Text>
            </View>
            <View style={styles.courseDetails}>
                <Timer size={20}/>
                <Text style={styles.DetailsText}>{duration}</Text>
            </View>
            <View style={styles.courseDetails}>
                <ClockAlert size={20}/>
                <Text style={styles.DetailsText}>{expiry}</Text>
            </View>
            
            {userType === 'admin' ? (
                <Pressable style={styles.Publishbtn}>
                    <CheckCheck/>
                    <Text>Published</Text>
                </Pressable>
            ) : (
                progress !== undefined && <ProgressBar progress={progress} />
                
            )}
        </Pressable>
    )
}

const styles=StyleSheet.create({
    card:{
        backgroundColor:"white",
        borderRadius:5,
        paddingHorizontal:17,
        paddingVertical:10,
        borderRadius:10,
        maxWidth:300
    },
    courseImg:{
        width:250,
        height:180,
        resizeMode:'contain',
        alignSelf:'center'
    },
    CourseTitle:{
        borderBottomColor:'#8f8f8f',
        borderBottomWidth:1,
        fontSize:19,
        paddingVertical:10,
        marginBottom:10,
        textAlign:'center',
        fontWeight:'bold'
    },
    courseDetails:{
        flexDirection:'row',
        alignContent:'center',
        padding:2,
        color:'#3e3e3e',
        gap:5,
        marginBottom:3
    },
    DetailsText:{
        color:'#3e3e3e',
        fontSize:14
    },
    Publishbtn:{
        flexDirection:'row',
        gap:8,
        alignItems:'center',
        alignSelf:'center',
        backgroundColor:'#ffb116',
        borderRadius:10,
        paddingHorizontal:20,
        paddingVertical:8,
        marginTop:15,
    },
});

export default CourseCard;