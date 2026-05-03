import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import './src/i18n';

// Import navigation
import RootNavigator from "./src/navigation/RootNavigator";

// Import context
import { AuthProvider } from "./src/context/AuthContext";

const linking = {
  prefixes: ["http://localhost:8081", "parkguide://"],
  config: {
    screens: {
      Landing: "landing",
      Login: "login",
      SignUp: "signup",
      ForgotPassword: "forgot-password",
      "Course Management": "courseManagement",
      "Course Details": "course/",
      Dashboard: "dashboard",
      "Registration Management": "registrationManagement",
      "User Module": "userModule/:id",
      Courses: "courses",
      UserProfile: "profile",
      "Enrollment Management": "enrollmentManagement",
    },
  },
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer linking={linking}>
        <RootNavigator />
        <StatusBar style="auto" />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
