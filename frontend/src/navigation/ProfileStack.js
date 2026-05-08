import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import ProfileSideBar from "../components/ProfileSideBar";

import UserProfile from "../screens/UserProfile";
import Preferences from "../screens/Preferences";
import Security from "../screens/Security";

import { View } from "react-native";

const Stack = createStackNavigator();

function ProfileWrapper({ children }) {
  return (
    <View style={{ flex: 1, flexDirection: "row" }}>
      <ProfileSideBar />
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

export default function ProfileStack() {
  return (
    <ProfileWrapper>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="UserProfile" component={UserProfile} />
        <Stack.Screen name="Preferences" component={Preferences} />
        <Stack.Screen name="Security" component={Security} />
      </Stack.Navigator>
    </ProfileWrapper>
  );
}