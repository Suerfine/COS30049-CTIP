import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import Screens
import AdminCourse from './src/screens/AdminCourse';
import SideBar from './src/components/SideBar';
import NavBar from './src/components/NavBar';
import EditCourseDetails from './src/screens/EditCourseDetail';
import UserDashboard from './src/screens/UserDashboard';
import UserManagement from './src/screens/UserManagement';
import UserModule from './src/screens/UserModule';
import UserCourse from './src/screens/UserCourse';
import Login from './src/screens/Login';
import SignUp from './src/screens/SignUp';
import ForgotPassword from './src/screens/ForgotPassword';
import { AuthProvider, useAuth } from './src/context/AuthContext';

const Stack=createStackNavigator();

function AppNavigator() {
  const { currentUser, authLoading } = useAuth();
  const navigationRef = useNavigationContainerRef();
  const [currentRouteName, setCurrentRouteName] = useState('');

  const hideNavBarRoutes = ['Login', 'Sign Up', 'Forgot Password'];
  const shouldHideNavBar = hideNavBarRoutes.includes(currentRouteName) || !currentUser;

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const linking = {
    prefixes: ['http://localhost:8081'], // your dev server URL
    config: {
      screens: {
        'Login': 'login',
        'Sign Up': 'signup',
        'Forgot Password': 'forgot-password',
        'Course Management': 'courseManagement',
        'Course Details': 'course/:id',
        'User Dashboard': 'dashboard',
        'User Management': 'userManagement',
        'User Module':'userModule/:id',
        'User Course':'usercourse',
      },
    },
  };

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
      onReady={() => {
        setCurrentRouteName(navigationRef.getCurrentRoute()?.name || '');
      }}
      onStateChange={() => {
        setCurrentRouteName(navigationRef.getCurrentRoute()?.name || '');
      }}
    >

      <View style={styles.root}>
        <View style={styles.container}>
          {/* <SideBar navigation={navigation}/> */}
          {!shouldHideNavBar && <NavBar />}
          
          
          {/* Main Content Area */}
          <View style={styles.content}>
            <Stack.Navigator initialRouteName={currentUser ? (currentUser.role === 'admin' ? 'Course Management' : 'User Dashboard') : 'Login'}>
              {!currentUser && (
                <>
                  <Stack.Screen name="Login" component={Login} options={{headerShown: false}}/>
                  <Stack.Screen name="Sign Up" component={SignUp} options={{headerShown: false}}/>
                  <Stack.Screen name="Forgot Password" component={ForgotPassword} options={{headerShown: false}}/>
                </>
              )}

              {currentUser?.role === 'admin' && (
                <>
                  <Stack.Screen name="Course Management" component={AdminCourse} options={{headerShown: false}}/>
                  <Stack.Screen name="Course Details" component={EditCourseDetails}/>
                  <Stack.Screen name="User Management" component={UserManagement} options={{headerShown: false}}/>
                </>
              )}

              {currentUser?.role === 'parkguide' && (
                <>
                  <Stack.Screen name="User Dashboard" component={UserDashboard} options={{headerShown: false}}/>
                  <Stack.Screen name="User Module" component={UserModule} options={{headerShown: false}}/>
                  <Stack.Screen name="User Course" component={UserCourse} options={{headerShown: false}}/>
                </>
              )}
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
    padding:0,
    margin:0
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,           
    // flexDirection: 'row', 
    flexDirection: 'column',
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    backgroundColor:"#f2f2f2"
  }
});
