import React, { useState } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Menu, X } from "lucide-react-native";

// Import screens
import AdminCourse from "../screens/AdminCourse";
import EditCourseDetail from "../screens/EditCourseDetail";
import RegistrationManagement from "../screens/RegistrationManagement";
import AccountsManagement from "../screens/AccountsManagement";
import EnrollmentManagement from "../screens/EnrollmentManagement";
import UserProfile from "../screens/UserProfile";
import AdminDashboard from "../screens/AdminDashboard";
import AnomalyDetection from "../screens/AnomalyDetection";
import AdminArModels from "../screens/AdminArModels";
import Notification from "../screens/Notification";

// Import components
import SideBar from "../components/SideBar";

const Stack = createStackNavigator();

export default function AdminNavigator() {
  const { width } = useWindowDimensions();
  const isCompact = width < 900;
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <View style={styles.shell}>
      {isCompact && (
        <View style={styles.mobileHeader}>
          <Pressable
            style={styles.mobileMenuButton}
            onPress={() => setIsMobileSidebarOpen(true)}
          >
            <Menu size={22} color="#0a6340" />
          </Pressable>
          <Text style={styles.mobileHeaderTitle}>Admin Panel</Text>
        </View>
      )}

      <View style={styles.body}>
        {!isCompact && (
          <SideBar />
        )}

        {isCompact && isMobileSidebarOpen && (
          <>
            <Pressable
              style={styles.backdrop}
              onPress={() => setIsMobileSidebarOpen(false)}
            />
            <View style={styles.drawer}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>Navigation</Text>
                <Pressable onPress={() => setIsMobileSidebarOpen(false)}>
                  <X size={20} color="#374151" />
                </Pressable>
              </View>
              <SideBar mobile onNavigate={() => setIsMobileSidebarOpen(false)} />
            </View>
          </>
        )}

        <View style={styles.mainColumn}>
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
            <Stack.Screen name="Admin Dashboard" component={AdminDashboard} />
            <Stack.Screen
              name="Anomaly Detection"
              component={AnomalyDetection}
            />
            <Stack.Screen name="AR Models" component={AdminArModels} />
            <Stack.Screen name="User Profile" component={UserProfile} />
            <Stack.Screen
              name="Notification Management"
              component={Notification}
            />
          </Stack.Navigator>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: "#f6f8f7" },
  body: { flex: 1, flexDirection: "row", minHeight: 0 },
  mainColumn: { flex: 1, minWidth: 0, minHeight: 0 },
  mobileHeader: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  mobileMenuButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#f0fdf4",
  },
  mobileHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
    zIndex: 1000,
  },
  drawer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 280,
    maxWidth: "85%",
    backgroundColor: "#fff",
    zIndex: 1001,
    borderRightWidth: 1,
    borderRightColor: "#e5e7eb",
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  drawerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
});
