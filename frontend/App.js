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
  prefixes: ["https://localhost:8081", "http://localhost:8081", "parkguide://"],
  config: {
    screens: {
      SFC: {
        screens: {
          Landing: "landing",
          Login: "login",
          SignUp: "signup",
          ForgotPassword: "forgot-password",
        }
      },
      ResetPassword: "reset-password",
      "Course Management": "courseManagement",
      "Course Details": "course/:id",
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
