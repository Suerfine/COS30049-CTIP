import React, { useState } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { View, Platform } from "react-native";

// Import screens
import AdminCourse from "../screens/AdminCourse";
import EditCourseDetail from "../screens/EditCourseDetail";
import RegistrationManagement from "../screens/RegistrationManagement";
import AccountsManagement from "../screens/AccountsManagement";
import EnrollmentManagement from "../screens/EnrollmentManagement";
import UserProfile from "../screens/UserProfile";

// Import components
import NavBar from "../components/NavBar";
import SideBar from "../components/SideBar";

const Stack = createStackNavigator();

export default function AdminNavigator() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = Platform.OS !== "web";

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: "row", flex: 1 }}>
        {!isMobile && <NavBar />}
        <View style={{ flex: 1 }}>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
            }}
            initialRouteName="Course Management"
          >
            <Stack.Screen name="Course Management" component={AdminCourse} />
            <Stack.Screen name="Course Details" component={EditCourseDetail} />
            <Stack.Screen
              name="Registration Management"
              component={RegistrationManagement}
            />
            <Stack.Screen
              name="Account Management"
              component={AccountsManagement}
            />
            <Stack.Screen
              name="Enrollment Management"
              component={EnrollmentManagement}
            />
            <Stack.Screen name="User Profile" component={UserProfile} />
          </Stack.Navigator>
        </View>
      </View>
      {!isMobile && (
        <SideBar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}
    </View>
  );
}
