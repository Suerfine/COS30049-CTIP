import React,{useState} from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, Book, Award, Group, ListTodo } from 'lucide-react-native';

// Import screens
import UserDashboard from '../screens/UserDashboard';
import MobileTopBar from '../components/MobileTopBar';
import MobileSideBar from '../components/MobileSideBar';
import UserCourse from '../screens/UserCourse';

const Tab=createBottomTabNavigator();

export default function MobileTabNavigator(){
    const [isSidebarOpen, setIsSidebarOpen]=useState(false);

    return (
        <>
            <Tab.Navigator screenOptions={{
                headerShown:true,
                header: (props) => {
                    const { options } = props;
                    const routeParams = props.route.params || {};
                    
                    return (
                        <MobileTopBar 
                            {...props} 
                            routeName={props.route.name}
                            onToggleSidebar={() => setIsSidebarOpen(true)} 
                            onFilterPress={routeParams.openFilters}
                        />
                    );
                }
            }}>
                <Tab.Screen
                    name='Dashboard'
                    component={UserDashboard}
                    options={{tabBarIcon:({color})=><LayoutDashboard color={color} size={20}/>}}
                />
                <Tab.Screen
                    name='Courses'
                    component={UserCourse}
                    options={{tabBarIcon:({color})=><Book color={color} size={20}/>}}
                />
            </Tab.Navigator>
            <MobileSideBar isOpen={isSidebarOpen} onClose={()=>setIsSidebarOpen(false)}/>
        </>
    )
}