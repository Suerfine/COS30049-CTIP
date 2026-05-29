import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, ActivityIndicator, View } from "react-native"; // Added View and Indicator
import AsyncStorage from "@react-native-async-storage/async-storage";
import "./src/i18n";

import RootNavigator from "./src/navigation/RootNavigator";
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
        },
      },
      ResetPassword: "reset-password",
      "Course Management": "courseManagement",
      "Course Details": "course/",
      Dashboard: "dashboard",
      "Registration Management": "registrationManagement",
      "User Module": "userModule/:id",
      Courses: "courses",
      UserProfile: "profile",
      "Enrollment Management": "enrollmentManagement",
      Notification: "notification",
      Badge: "badge",
      Payment: "payment",
      PaymentReview: "paymentReview",
      UserAnomaly: "anomaly",
    },
  },
};

export default function App() {
  const [initialState, setInitialState] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const restoreNavigationState = async () => {
      try {
        const savedState = await AsyncStorage.getItem("navigationState");
        if (savedState) {
          setInitialState(JSON.parse(savedState));
        }
      } catch (error) {
        console.error("Failed to restore navigation state:", error);
      } finally {
        setIsReady(true);
      }
    };

    restoreNavigationState();
  }, []);

  const handleStateChange = async (state) => {
    try {
      await AsyncStorage.setItem("navigationState", JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save navigation state:", error);
    }
  };

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2f6618fe" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <NavigationContainer
        linking={linking}
        initialState={initialState}
        onStateChange={handleStateChange}
      >
        <RootNavigator />
        <StatusBar style="auto" />
      </NavigationContainer>
    </AuthProvider>
  );
}
