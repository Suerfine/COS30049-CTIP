import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

// Import screens
import Landing from "../screens/Landing";
import Login from "../screens/Login";
import SignUp from "../screens/SignUp";
import ForgotPassword from "../screens/ForgotPassword";
import ResetPassword from "../screens/ResetPassword";

const Stack = createStackNavigator();

export default function UnloggedInNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
      }}
      initialRouteName="Landing"
    >
      <Stack.Screen
        name="Landing"
        component={Landing}
        options={{
          animationEnabled: false,
        }}
      />
      <Stack.Screen
        name="Login"
        component={Login}
        options={{
          animationEnabled: true,
        }}
      />
      <Stack.Screen
        name="SignUp"
        component={SignUp}
        options={{
          animationEnabled: true,
        }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPassword}
        options={{
          animationEnabled: true,
        }}
      />
      <Stack.Screen
        name="ResetPassword"
        component={ResetPassword}
        options={{
          animationEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
}
