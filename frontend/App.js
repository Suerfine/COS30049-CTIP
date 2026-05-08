import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer} from '@react-navigation/native';
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

// Define
const Stack=createStackNavigator();

export default function App() {
  const linking = {
    prefixes: ['http://localhost:8081'], // your dev server URL
    config: {
      screens: {
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
      linking={linking}
    >

      <View style={styles.root}>
        <View style={styles.container}>
          {/* <SideBar navigation={navigation}/> */}
          <NavBar navigation={navigation}/>
          
          
          {/* Main Content Area */}
          <View style={styles.content}>
            <Stack.Navigator initialRouteName="Course Management">
              <Stack.Screen name="Course Management" component={AdminCourse} options={{headerShown: false}}/>
              <Stack.Screen name="Course Details" component={EditCourseDetails}/>
              <Stack.Screen name="User Dashboard" component={UserDashboard} options={{headerShown: false}}/>
              <Stack.Screen name="User Management" component={UserManagement} options={{headerShown: false}}/>
              <Stack.Screen name="User Module" component={UserModule} options={{headerShown: false}}/>
              <Stack.Screen name="User Course" component={UserCourse} options={{headerShown: false}}/>
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
    // flexDirection: 'row', 
    flexDirection: 'column',
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    backgroundColor:"#f2f2f2"
  }
});
