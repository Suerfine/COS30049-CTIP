import { View, Pressable, Image, Text, StyleSheet} from 'react-native';
import {BookOpenText, Timer, ClockAlert, SquarePen, Trash2} from 'lucide-react-native'
import ProgressBar from './ProgressBar.js';

const CourseCard=({imagePath, courseTitle, numModules,duration,expiry,userType, progress, onPress, onEdit, onDelete, onEnroll})=>{
    return (
        // Title need change to course ID later
        // Not enrolled courses cannot view course content
        <Pressable style={styles.card} onPress={progress === null || progress === 0 ? undefined : onPress}>
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
            
            {userType === 'admin' && (
                <View style={styles.icon}>
                    <Pressable onPress={onEdit} style={({ hovered }) => [
                        hovered && styles.btnHover, 
                    ]}>
                        <SquarePen size={20}/>
                    </Pressable>
                    <Pressable onPress={onDelete} style={({ hovered }) => [
                        hovered && styles.btnHover, 
                    ]}>
                        <Trash2 size={20}/>
                    </Pressable>
                </View>
            )}
            {userType !== 'admin' && (
                <>
                    {progress === null || progress === 0 ? (
                        <Pressable style={styles.enrollBtn} onPress={onEnroll}>
                            <Text style={styles.enrollText}>
                                Enroll
                            </Text>
                        </Pressable>
                    ) : (
                        <ProgressBar progress={progress} />
                    )}
                </>
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
        height:170,
        resizeMode:'cover',
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
    icon:{
        flexDirection:'row',
        color:'#474747',
        marginTop:10,
        gap:10,
        justifyContent:'flex-end',
    },
    btnHover:{
        color:'#efab21'
    },
    enrollBtn: {
        marginTop: 10,
        backgroundColor: '#efab21',
        padding: 8,
        borderRadius: 6,
    },
    enrollText:{
        color: 'black', 
        textAlign: 'center' 
    }
});

export default CourseCard;

