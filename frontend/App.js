import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { navigationRef } from './src/utils/navigationRef';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { Platform } from 'react-native';
import MobileTabNavigator from './src/navigation/MobileTabNavigator';

// Import Screens
import AdminCourse from './src/screens/AdminCourse';
import SideBar from './src/components/SideBar';
import EditCourseDetails from './src/screens/EditCourseDetail';
import UserDashboard from './src/screens/UserDashboard';
import RegistrationManagement from './src/screens/RegistrationManagement';
import UserModule from './src/screens/UserModule';
import UserCourse from './src/screens/UserCourse';
import AccountManagement from './src/screens/AccountsManagement';
import EnrollmentManagement from './src/screens/EnrollmentManagement';
import UserProfile from './src/screens/UserProfile';
import NavBar from './src/components/NavBar';
import TaskDetails from './src/screens/TaskDetails.native';


// Define
const Stack=createStackNavigator();

export default function App() {
  const isMobile=Platform.OS !== 'web';

  const linking = {
    prefixes: ['http://localhost:8081'],
    config: {
      screens: {
        'Course Management': 'courseManagement',
        'Course Details': 'course/:id',
        'User Dashboard': 'dashboard',
        'Registration Management': 'registrationManagement',
        'User Module':'userModule/:id',
        'User Course':'usercourse',
        'User Profile':'userprofile',
        'Enrollment Management': 'enrollmentManagement',
      },
    },
  };

  return (
    <NavigationContainer
      linking={linking}
      ref={navigationRef}
    >

      <View style={styles.root}>
        <View style={styles.container}>
          {/* {!isMobile && <SideBar/>} */}
          {!isMobile && <NavBar/>}
          {/* Main Content Area */}
          <View style={styles.content}>
              <Stack.Navigator initialRouteName={isMobile ? "MobileRoot" : "User Dashboard"}>
                  {isMobile && (
                    <Stack.Screen name='MobileRoot' component={MobileTabNavigator} options={{headerShown:false}}/>
                  )}
                  <Stack.Screen name="Course Management" component={AdminCourse} options={{headerShown: false}}/>
                  <Stack.Screen name="Course Details" component={EditCourseDetails} options={{headerShown: false}}/>
                  <Stack.Screen name="User Dashboard" component={UserDashboard} options={{headerShown: false}}/>
                  <Stack.Screen name="Registration Management" component={RegistrationManagement} options={{headerShown: false}}/>
                  <Stack.Screen name="User Module" component={UserModule} options={{headerShown: false}}/>
                  <Stack.Screen name="User Course" component={UserCourse} options={{headerShown: false}}/>
                  <Stack.Screen name="Account Management" component={AccountManagement} options={{headerShown: false}}/>
                  <Stack.Screen name="User Profile" component={UserProfile} options={{headerShown: false}}/>
                  <Stack.Screen name="Enrollment Management" component={EnrollmentManagement} options={{headerShown: false}}/>
              </Stack.Navigator>
          </View>
        </View>

        <StatusBar style="auto" />
      </View>
    </NavigationContainer>
    
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1, 
    padding:0,
    margin:0
  },
  container: {
    flex: 1,           
    flexDirection: 'column',
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    backgroundColor:"#f2f2f2",
  }
});
