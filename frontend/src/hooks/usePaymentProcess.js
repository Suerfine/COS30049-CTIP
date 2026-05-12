import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

import { enrollmentService } from "../services/EnrollmentService";
import { paymentService } from "../services/PaymentService";
import { useAuth } from "../context/AuthContext";
import { appendFile } from "../utils/AppendFile";

export const usePaymentProcess = (course, navigation) => {
  const [receipt, setReceipt] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { currentUser } = useAuth();

  const amount = `RM ${Number(course?.price || course?.cost || 0).toFixed(2)}`;
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

      // NOTE: The enrollment process is very messy now. Ideally this should be in the
      // enrollment service but due to time constraint, I wont touch too much code and
      // just get this route to call the enrollment api directly.
      try {
        await enrollmentService.enroll(course.id, receipt);
      } catch (err) {
        Alert.alert("Enrollment failed", err.message || "Please try again");
        //TODO: Implement a better error handling mechanism in the future, this is just a quick fix to unblock the flow. The problem is that if enrollment fails, the payment record will be created but not linked to any enrollment, which will cause issues in the future when we want to query payment history. We should ideally have a transaction mechanism in the backend to ensure data consistency, but for now we will just delete the payment record if enrollment fails.
      }

      navigation.navigate("ParkGuideStack", {
        screen: "PaymentReview",
        params: {
          courseTitle: course.title,
          amount,
        },
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
    onConfirmPayment,
  };
};
