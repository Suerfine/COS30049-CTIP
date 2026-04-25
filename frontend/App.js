import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import AdminCourse from './src/screens/AdminCourse';
import NavBar from './src/components/NavBar';
import EditCourseDetails from './src/screens/EditCourseDetail';
import UserDashboard from './src/screens/UserDashboard';
import UserManagement from './src/screens/UserManagement';
import UserModule from './src/screens/UserModule';
import UserCourse from './src/screens/UserCourse';
import Login from './src/screens/Login';
import SignUp from './src/screens/SignUp';
import ForgotPassword from './src/screens/ForgotPassword';
import { AuthProvider } from './src/context/AuthContext';

const Stack = createStackNavigator();

function AppNavigator() {
  const navigationRef = useNavigationContainerRef();
  const [currentRouteName, setCurrentRouteName] = useState('Login');

  const linking = {
    prefixes: ['http://localhost:8081'],
    config: {
      screens: {
        Login: 'login',
        SignUp: 'signup',
        ForgotPassword: 'forgot-password',
        'Course Management': 'courseManagement',
        'Course Details': 'course/:id',
        'User Dashboard': 'dashboard',
        'User Management': 'userManagement',
        'User Module': 'userModule/:id',
        'User Course': 'usercourse',
      },
    },
  };

  const hideNavBarRoutes = ['Login', 'SignUp', 'ForgotPassword'];
  const shouldHideNavBar = hideNavBarRoutes.includes(currentRouteName);

  return (
    <NavigationContainer
      linking={linking}
      ref={navigationRef}
      onReady={() => setCurrentRouteName(navigationRef.getCurrentRoute()?.name || 'Login')}
      onStateChange={() => setCurrentRouteName(navigationRef.getCurrentRoute()?.name || 'Login')}
    >
      <View style={styles.root}>
        <View style={styles.container}>
          {!shouldHideNavBar && <NavBar />}

          <View style={styles.content}>
            <Stack.Navigator initialRouteName="Login">
              <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
              <Stack.Screen name="SignUp" component={SignUp} options={{ headerShown: false }} />
              <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{ headerShown: false }} />
              <Stack.Screen name="Course Management" component={AdminCourse} options={{ headerShown: false }} />
              <Stack.Screen name="Course Details" component={EditCourseDetails} />
              <Stack.Screen name="User Dashboard" component={UserDashboard} options={{ headerShown: false }} />
              <Stack.Screen name="User Management" component={UserManagement} options={{ headerShown: false }} />
              <Stack.Screen name="User Module" component={UserModule} options={{ headerShown: false }} />
              <Stack.Screen name="User Course" component={UserCourse} options={{ headerShown: false }} />
            </Stack.Navigator>
          </View>
        </View>

        <StatusBar style="auto" />
      </View>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 0,
    margin: 0,
  },
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
});
