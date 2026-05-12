import { StyleSheet } from "react-native";

export const ModalStyle=StyleSheet.create({
    container:{
        padding:25,
    },
    row:{
        flexDirection:'row',
        gap:5,
    },
    header:{
        justifyContent:'space-between',
        marginBottom:20
    },
    title:{
        fontWeight:'bold',
        fontSize:20
    }, 
    content:{
        justifyContent:'space-between',
        borderRightWidth:1,
        borderRightColor: '#ddd',
        paddingRight:20,
        minWidth:450,
    },
    upload:{
        padding:20,
        flex:1
    },
    label:{
        marginBottom:7,
        fontWeight:550
    },
    input:{
        borderWidth:1, 
        borderColor:'#ddd',
        borderRadius:10,
        padding:12,
        marginBottom:10,
        flex:1,
        minWidth:220,
        maxHeight: 35,
    },
    imagePicker: { 
        height: 170, 
        backgroundColor: '#fcfdfe', 
        borderRadius: 10, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginBottom: 15, 
        borderStyle: 'dashed', 
        borderWidth: 1, 
        borderColor: '#ccc',
        marginTop:15
    },
    previewImage: { 
        width: '100%', 
        height: '100%', 
        borderRadius: 10,
        resizeMode:'fill'
    },
    Btn:{
        maxWidth:100,
        alignItems:'center',
        backgroundColor:'#ffc95c',
        borderRadius:5,
        paddingHorizontal:20,
        paddingVertical:8,
        marginTop:35,
    },
})