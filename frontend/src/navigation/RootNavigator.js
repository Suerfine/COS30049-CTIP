import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { ActivityIndicator, View } from "react-native";

// Import navigators
import UnloggedInNavigator from "./UnloggedInNavigator";
import AdminNavigator from "./AdminNavigator";
import ParkGuideNavigator from "./ParkGuideNavigator";

// Import auth context
import { useAuth } from "../context/AuthContext";

// Import enums
import { UserRoles } from "../enum/UserRoles";

const Stack = createStackNavigator();

export default function RootNavigator() {
  const { currentUser, isLoading, userToken } = useAuth();

  {userToken == null && (
    <Stack.Screen name="Auth" component={UnloggedInNavigator} />
  )}

  if (isLoading) {
    return null;
  }

  // No user logged in - show unlogged in stack
  if (!currentUser) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="SFC"
          component={UnloggedInNavigator}
          options={{
            animationEnabled: false,
          }}
        />
      </Stack.Navigator>
    );
  }

  // User is logged in - show role-based navigator
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {currentUser.role === UserRoles.ADMIN ? (
        <Stack.Screen
          name="AdminStack"
          component={AdminNavigator}
          initialParams={{screen: 'Admin Dashboard'}}
          options={{
            animationEnabled: false,
          }}
        />
      ) : (
        <Stack.Screen
          name="ParkGuideStack"
          component={ParkGuideNavigator}
          initialParams={{screen: 'Dashboard'}}
          options={{
            animationEnabled: false,
          }}
        />
      )}
    </Stack.Navigator>
  );
}
