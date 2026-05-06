import React, { useState } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Platform } from "react-native";
import { LayoutDashboard, Book, Award, ListTodo } from "lucide-react-native";
import { useNavigationState, useNavigation } from '@react-navigation/native';

// Import screens
import UserDashboard from "../screens/UserDashboard";
import UserCourse from "../screens/UserCourse";
import UserModule from "../screens/UserModule";
import UserProfile from "../screens/UserProfile";
import Calendar from "../screens/Calendar.native";
import TaskDetails from "../screens/TaskDetails.native";
import Settings from "../screens/Settings.native";
import UserAnomaly from "../screens/UserAnomaly";
import Badge from "../screens/Badge";
import Notifications from "../screens/NotificationScreen";

// Import components
import MobileTopBar from "../components/MobileTopBar";
import MobileSideBar from "../components/MobileSideBar";
import NavBar from "../components/NavBar";
import ProfileStack from "./ProfileStack";

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
                navigation={props.navigation}
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
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              e.preventDefault();

              navigation.navigate('To Do', {
                screen: 'To Do Calendar',
                params: { layout: 'list' },
              });
            },
          })}
        />
        <Tab.Screen
          name="Badge"
          component={Badge}
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
        <Tab.Screen
          name="Settings"
          component={Settings}
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

  const currentRoute = useNavigationState((state) => {
    if (!state) return null;

    let route = state.routes[state.index];
    while (route.state) {
      route = route.state.routes[route.state.index];
    }

    return route.name;
  });

  const showProfileSidebar =
    currentRoute === "UserProfile" ||
    currentRoute === "Preferences" ||
    currentRoute === "Security";

  // Web view with navbar
  return (
    <View style={{ flex: 1, flexDirection: "column" }}>
      <View style={{ zIndex: 9999, elevation: 999 }}>
        <NavBar/>
      </View>
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
          <Stack.Screen name="UserAnomaly" component={UserAnomaly}/>
          <Stack.Screen name="Badge" component={Badge}/>
          <Stack.Screen name="Notifications" component={Notifications}/>

          {/* UserProfile, Preferences and Security screens */}
          <Stack.Screen name="ProfileStack" component={ProfileStack} />
        </Stack.Navigator>
      </View>
    </View>
  );
}
