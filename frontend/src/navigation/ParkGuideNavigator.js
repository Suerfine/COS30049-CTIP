import React, { useState } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Platform } from "react-native";
import { LayoutDashboard, Book, Award, ListTodo } from "lucide-react-native";

// Import screens
import UserDashboard from "../screens/UserDashboard";
import UserCourse from "../screens/UserCourse";
import UserModule from "../screens/UserModule";
import UserProfile from "../screens/UserProfile";
import Calendar from "../screens/Calendar.native";
import TaskDetails from "../screens/TaskDetails.native";

// Import components
import MobileTopBar from "../components/MobileTopBar";
import MobileSideBar from "../components/MobileSideBar";
import NavBar from "../components/NavBar";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack for To Do tab
function TodoStackScreen() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="To Do Calendar" component={Calendar} />
      <Stack.Screen name="TaskDetails" component={TaskDetails} />
    </Stack.Navigator>
  );
}

// Mobile tab navigator for park guide
function MobileTabNavigator() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: true,
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
          },
        }}
      >
        <Tab.Screen
          name="Dashboard"
          component={UserDashboard}
          options={{
            tabBarIcon: ({ color }) => (
              <LayoutDashboard color={color} size={20} />
            ),
          }}
        />
        <Tab.Screen
          name="Courses"
          component={UserCourse}
          options={{
            tabBarIcon: ({ color }) => <Book color={color} size={20} />,
          }}
        />
        <Tab.Screen
          name="To Do"
          component={TodoStackScreen}
          options={{
            tabBarIcon: ({ color }) => <ListTodo color={color} size={20} />,
          }}
        />
        <Tab.Screen
          name="Badge"
          component={Award}
          options={{
            tabBarIcon: ({ color }) => <Award color={color} size={20} />,
          }}
        />
        <Tab.Screen
          name="Profile"
          component={UserProfile}
          options={{
            tabBarButton: () => null,
            tabBarItemStyle: { display: "none" },
          }}
        />
      </Tab.Navigator>
      <MobileSideBar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
    </>
  );
}

export default function ParkGuideNavigator() {
  const isMobile = Platform.OS !== "web";

  if (isMobile) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="ParkGuideMobileRoot"
          component={MobileTabNavigator}
        />
        <Stack.Screen name="UserModule" component={UserModule} />
      </Stack.Navigator>
    );
  }

  // Web view with sidebar
  return (
    <View style={{ flex: 1, flexDirection: "column" }}>
      <NavBar/>
      <View style={{ flex: 1 }}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
          initialRouteName="Dashboard"
        >
          <Stack.Screen name="Dashboard" component={UserDashboard} />
          <Stack.Screen name="Courses" component={UserCourse} />
          <Stack.Screen name="UserModule" component={UserModule} />
          <Stack.Screen name="UserProfile" component={UserProfile} />
        </Stack.Navigator>
      </View>
    </View>
  );
}
