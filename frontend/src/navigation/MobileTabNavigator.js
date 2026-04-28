import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, Book, Award, Group, ListTodo } from 'lucide-react-native';

// Import screens
import UserDashboard from '../screens/UserDashboard';

const Tab=createBottomTabNavigator();

export default function MobileTabNavigator(){
    return (
        <Tab.Navigator screenOptions={{
            headerShown:false
        }}>
            <Tab.Screen
                name='Dashboard'
                component={UserDashboard}
                options={{tabBarIcon:({color})=><LayoutDashboard color={color} size={20}/>}}
            />
        </Tab.Navigator>
    )
}