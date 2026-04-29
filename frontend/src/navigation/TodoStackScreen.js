import { createStackNavigator } from "@react-navigation/stack";
import TaskDetails from "../screens/TaskDetails.native";
import Calendar  from "../screens/Calendar.native";

const ToDoStack=createStackNavigator();

export default function TodoStackScreen(){
    return(
        <ToDoStack.Navigator screenOptions={{headerShown:false}}>
            <ToDoStack.Screen name="To Do" component={Calendar}/>
            <ToDoStack.Screen name="TaskDetails" component={TaskDetails}/>
        </ToDoStack.Navigator>
    );
}