import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

import { enrollmentService } from '../services/EnrollmentService';
import { paymentService } from '../services/PaymentService';
import { useAuth } from '../context/AuthContext';

export const usePaymentProcess = (course, navigation) => {
    const [receipt, setReceipt] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const {currentUser}=useAuth();

    const amount = `RM ${(Number(course?.price || course?.cost || 0)).toFixed(2)}`;
    const onUploadReceipt = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (!permission.granted) {
            Alert.alert("Permission required", "Allow access to photos.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
        });

        if (!result.canceled) {
            setReceipt(result.assets[0]);
        }
    };

    const onRemoveReceipt = () => {
        setReceipt(null);
    };

    const onConfirmPayment = async () => {
        console.log(course);
        try {
            if (!receipt) {
                Alert.alert("Upload receipt first");
                return;
            }

            setSubmitting(true);

            const enrollmentRes = await enrollmentService.enroll(
                course.id
            );

            const enrollmentId =
                enrollmentRes?.data?.id || enrollmentRes?.id;

            await paymentService.create({
                enrollment_id: enrollmentId,
                course_id: course.id,
                amount: Number(course.price || course.cost || 0),
                payment_method: 'bank_transfer',
                receipt_filepath: receipt.uri,
                status: 'pending'
            });

            navigation.navigate('ParkGuideStack', {
                screen: 'PaymentReview',
                params: {
                    courseTitle: course.title,
                    amount
                }
            });

        } catch (err) {
            console.error(err);
            Alert.alert("Payment failed");
        } finally {
            setSubmitting(false);
        }
    };

    return {
        receipt,
        submitting,
        amount,
        onUploadReceipt,
        onRemoveReceipt,
        onConfirmPayment
    };
};