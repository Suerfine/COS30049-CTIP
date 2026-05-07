import React, { useState } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { View } from "react-native";

// Import screens
import AdminCourse from "../screens/AdminCourse";
import EditCourseDetail from "../screens/EditCourseDetail";
import RegistrationManagement from "../screens/RegistrationManagement";
import AccountsManagement from "../screens/AccountsManagement";
import EnrollmentManagement from "../screens/EnrollmentManagement";
import UserProfile from "../screens/UserProfile";
import AdminDashboard from "../screens/AdminDashboard";
import NotificationScreen from "../screens/NotificationScreen";

// Import components
import SideBar from "../components/SideBar";

const Stack = createStackNavigator();

export default function AdminNavigator() {

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: "row", flex: 1 }}>
        <SideBar/>
        <View style={{ flex: 1 }}>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
            }}
            initialRouteName="Admin Dashboard"
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
            <Stack.Screen
              name="Admin Dashboard"
              component={AdminDashboard}
            />
            <Stack.Screen name="User Profile" component={UserProfile} />
            <Stack.Screen
              name="Notification Management"
              component={NotificationScreen}
            />
          </Stack.Navigator>
        </View>
      </View>
    </View>
  );
}
