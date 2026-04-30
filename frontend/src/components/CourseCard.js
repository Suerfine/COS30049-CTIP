import { View, Pressable, Image, Text, StyleSheet, Platform} from 'react-native';
import {BookOpenText, Timer, ClockAlert, SquarePen, Trash2} from 'lucide-react-native'
import ProgressBar from './ProgressBar.js';

const CourseCard=({imagePath, courseTitle, numModules,duration,expiry,userType, progress, onPress, onEdit, onDelete, onEnroll})=>{
    const isWeb=Platform.OS==='web';

    return (
        // Title need change to course ID later
        // Not enrolled courses cannot view course content
        <Pressable 
            style={({ pressed, hovered }) => [
                styles.card,
                isWeb && hovered && styles.cardHover,
                !isWeb && pressed && styles.cardPressed
            ]} 
            onPress={progress === null || progress === 0 ? undefined : onPress}
        >
            <Image source={imagePath} style={styles.courseImg} accessibilityLabel='Cover Photo of Course'/>
            <View style={styles.details}>                
                    <Text style={styles.CourseTitle}>{courseTitle}</Text>
                <View style={styles.row}> 
                    <View>
                        <View style={styles.courseDetails}>
                            <BookOpenText size={isWeb ? 20 : 15}/>
                            <Text style={styles.DetailsText}>{numModules} Modules</Text>
                        </View>
                        <View style={styles.courseDetails}>
                            <Timer size={isWeb ? 20 : 15}/>
                            <Text style={styles.DetailsText}>{duration}</Text>
                        </View>
                        <View style={styles.courseDetails}>
                            <ClockAlert size={isWeb ? 20 : 15}/>
                            <Text style={styles.DetailsText}>{expiry}</Text>
                        </View>
                    </View>
                    
                    {userType !== 'admin' && !isWeb && (
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
                </View>
                
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
            {userType !== 'admin' && isWeb && (
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
        borderRadius:12,
        paddingHorizontal: Platform.select({
            web:17,
            default:0
        }),
        paddingVertical: Platform.select({
            web:10,
            default:0
        }),
        borderRadius: Platform.select({
            web:12,
            default:15
        }),
        width: Platform.select({
            web:280,
            default:190
        }),
        elevation:4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    courseImg:{
        width: Platform.select({
            web:250,
            default:'100%'
        }),
        height: Platform.select({
            web:170,
            default:150
        }),
        resizeMode:'fill',
        alignSelf:'center'
    },
    CourseTitle:{
        borderBottomColor:'#8f8f8f',
        borderBottomWidth:1,
        fontSize: Platform.select({
            web:19,
            default:14
        }),
        paddingVertical: Platform.select({
            web:10,
            default:5
        }),
        marginBottom:10,
        textAlign: Platform.select({
            web:'center',
            default:'left'
        }),
        fontWeight:'bold'
    },
    courseDetails:{
        flexDirection:'row',
        alignContent:'center',
        padding:2,
        color:'#3e3e3e',
        gap:5,
        marginBottom: Platform.select({
            web:3,
            default:0
        }),
    },
    DetailsText:{
        color:'#3e3e3e',
        fontSize: Platform.select({
            web:14,
            default:11
        }),
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
        maxHeight:35,
    },
    enrollText:{
        color: 'white', 
        textAlign: 'center',
        fontWeight:'600'
    },
    details:{
        paddingHorizontal: Platform.select({
            web:0,
            default:10
        }),
        paddingBottom: Platform.select({
            web:0,
            default:10
        }),
    },
    cardHover: {
        transform: [{ translateY: -5 }],
        shadowOpacity: 0.2,
    },
    cardPressed:{
        opacity:0.8,
        transform:[{scale:0.98}]
    },
    row:{
        flexDirection:'row',
        justifyContent:'space-between'
    },
    
});

export default CourseCard;

