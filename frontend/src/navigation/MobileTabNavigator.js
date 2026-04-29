import React,{useState} from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, Book, Award, Group, ListTodo } from 'lucide-react-native';
import { createStackNavigator } from "@react-navigation/stack";

// Import screens
import UserDashboard from '../screens/UserDashboard';
import MobileTopBar from '../components/MobileTopBar';
import MobileSideBar from '../components/MobileSideBar';
import UserCourse from '../screens/UserCourse';
import TaskDetails from "../screens/TaskDetails.native";
import Calendar  from "../screens/Calendar.native";
import UserProfile from '../screens/UserProfile.native';
import { useNavigation } from '@react-navigation/native';

const Tab=createBottomTabNavigator();
const ToDoStack=createStackNavigator();


function TodoStackScreen(){
    return(
        <ToDoStack.Navigator screenOptions={{headerShown:false}}>
            <ToDoStack.Screen name="To Do" component={Calendar}/>
            <ToDoStack.Screen name="TaskDetails" component={TaskDetails}/>
        </ToDoStack.Navigator>
    );
}

export default function MobileTabNavigator(){
    const [isSidebarOpen, setIsSidebarOpen]=useState(false);
    const navigation=useNavigation();

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
                <Tab.Screen
                    name='To Do'
                    component={TodoStackScreen}
                    options={{tabBarIcon:({color})=><ListTodo color={color} size={20}/>}}
                />
                <Tab.Screen
                    name='Badge'
                    component={Award}
                />
                <Tab.Screen
                    name='UserProfile'
                    component={UserProfile}
                    options={{
                    tabBarButton: () => null,
                    tabBarItemStyle: { display: 'none' },
                }}
                />
            </Tab.Navigator>
            <MobileSideBar isOpen={isSidebarOpen} onClose={()=>setIsSidebarOpen(false)} />
        </>
    )
}