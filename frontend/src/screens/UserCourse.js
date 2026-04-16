import {useState} from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView} from 'react-native';
import { ListPlus, ChevronRight, ChevronLeft } from 'lucide-react-native';
import Checkbox from 'expo-checkbox';

import CourseCard from '../components/CourseCard.js';
import { useUserDashboard } from '../hooks/useUserDashboard';

const UserCourse = ({ navigation }) => {

    return(
        <Text>User Course Screen</Text>
    );
}

export default UserCourse;