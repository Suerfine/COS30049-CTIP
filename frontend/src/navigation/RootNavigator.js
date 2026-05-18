import React from "react";
import { View, ActivityIndicator } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";

// Import navigators
import UnloggedInNavigator from "./UnloggedInNavigator";
import AdminNavigator from "./AdminNavigator";
import ParkGuideNavigator from "./ParkGuideNavigator";

// Import screens that must be reachable regardless of auth state
import ResetPassword from "../screens/ResetPassword";
import ForceChangePassword from "../screens/ForceChangePassword";

// Import auth context
import { useAuth } from "../context/AuthContext";

// Import enums
import { UserRoles } from "../enum/UserRoles";

const Stack = createStackNavigator();

export default function RootNavigator() {
  const { currentUser, isLoading, userToken, mustChangePassword } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Logged-in user who must change password — block all other navigation
  if (currentUser && mustChangePassword) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="ForceChangePassword"
          component={ForceChangePassword}
        />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!currentUser ? (
        <Stack.Screen
          name="SFC"
          component={UnloggedInNavigator}
          options={{ animationEnabled: false }}
        />
      ) : currentUser.role === UserRoles.ADMIN ? (
        <Stack.Screen
          name="AdminStack"
          component={AdminNavigator}
          initialParams={{ screen: "Admin Dashboard" }}
          options={{
            animationEnabled: false,
          }}
        />
      ) : (
        <Stack.Screen
          name="ParkGuideStack"
          component={ParkGuideNavigator}
          initialParams={{ screen: "Dashboard" }}
          options={{
            animationEnabled: false,
          }}
        />
      )}
      {/* Always reachable via deep link regardless of auth state */}
      <Stack.Screen name="ResetPassword" component={ResetPassword} />
    </Stack.Navigator>
  );
}
