import React, { useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import { Alert } from "react-native";

// Import other hook and service
import { RegisterService } from "../services/RegisterService";
import { isValidEmail, isOnlyLetters, phoneRegex } from "../utils/Validation";

export const useSignUp = () => {
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [ic, setIc] = useState("");
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState({});

  // // Password strength calculation
  // const calculatePasswordStrength = (pwd) => {
  //     if (!pwd) return { score: 0, label: '', color: '#999' };

  //     let score = 0;
  //     if (pwd.length >= 8) score++;
  //     if (pwd.length >= 12) score++;
  //     if (/[a-z]/.test(pwd)) score++;
  //     if (/[A-Z]/.test(pwd)) score++;
  //     if (/[0-9]/.test(pwd)) score++;
  //     if (/[^a-zA-Z0-9]/.test(pwd)) score++;

  //     if (score <= 2) return { score: 1, label: 'Weak', color: '#d32f2f' };
  //     if (score <= 4) return { score: 2, label: 'Medium', color: '#f57c00' };
  //     return { score: 3, label: 'Strong', color: '#2f6618fe' };
  // };

  // const passwordStrength = calculatePasswordStrength(password);

  const validateForm = () => {
    let tempErrors = {};
    if (!fname.trim()) {
      tempErrors.fname = "* First Name is required.";
    } else if (!isOnlyLetters(fname)) {
      tempErrors.fname = "* First Name must only contain letters.";
    }
    if (!lname.trim()) {
      tempErrors.lname = "* Last Name is required.";
    } else if (!isOnlyLetters(lname)) {
      tempErrors.lname = "* Last Name must only contain letters.";
    }
    if (!email.trim()) {
      tempErrors.email = "* Email Address is required.";
    } else if (!isValidEmail(email.trim())) {
      tempErrors.email = "* Please enter a valid email address.";
    }
    if (!telephone.trim()) {
      tempErrors.tel = "* Telephone is required.";
    } else if (!phoneRegex.test(telephone.trim())) {
      tempErrors.tel = "* Invalid format. use 01x-xxxxxxx";
    }
    if (!ic.trim()) {
      tempErrors.ic = "* Passport/IC is required.";
    }
    if (!file) {
      tempErrors.file = "* Resume is required.";
    }
    setError(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Resume upload
  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setFile(result.assets[0]);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to pick a document");
    }
  };

  const removeFile = () => setFile(null);

  const handleSignUp = async (navigation) => {
    if (!validateForm()) return;

    setLoading(true);
    setError({}); // Clear previous backend errors
    try {
      const userData = {
        fname,
        lname,
        ic,
        email,
        telephone,
        file: file,
      };

      await RegisterService.registerUser(userData);

      Alert.alert("Success", "Account created successfully! Please log in.");
      navigation.navigate("Login");
    } catch (error) {
      const errorMessage =
        error.message || "Registration failed. Please try again.";
      setError({ backend: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return {
    fname,
    setFname,
    lname,
    setLname,
    email,
    setEmail,
    file,
    setFile,
    telephone,
    setTelephone,
    ic,
    setIc,
    loading,
    setLoading,
    handleSignUp,
    handleUpload,
    removeFile,
    error,
    setError,
  };
};
