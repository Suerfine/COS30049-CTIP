import { StyleSheet } from 'react-native';

export const markdownStyles = StyleSheet.create({
    body: {
        fontSize: 15,
        color: '#4A4A4A',
        lineHeight: 24,
    },
    heading1: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#3d3d3d',
        marginTop: 20,
        marginBottom: 10,
    },
    heading2: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        marginTop: 15,
        marginBottom: 8,
    },
    bullet_list: {
        marginVertical: 10,
    },
    list_item: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    bullet_list_icon: {
        color: '#0a6340', 
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 10,
    },
    strong: {
        fontWeight: 'bold',
        color: '#000',
    },
    em: {
        fontStyle: 'italic',
    },
});