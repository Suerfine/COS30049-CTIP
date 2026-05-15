import { useState, useEffect } from "react";
import { userProfileService } from "../services/userProfileService";
import { Alert } from "react-native";
import { useUserDashboard } from "./useUserDashboard";
import { isValidPassword } from "../utils/Validation";
import * as ImagePicker from "expo-image-picker";
import apiClient from "../config/apiConfig";
import { useAuth } from "../context/AuthContext";

export const useUserProfile = () => {
  const { user } = useUserDashboard();
  // Personal Information state
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    identification: "",
    personal_email: "",
    tel: "",
  });

  const updateField = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };
  const [isEditing, setIsEditing] = useState(false);

  // Account Security state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Edit mode toggles
  const [editingUsername, setEditingUsername] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);

  // Modal visibility
  const [pfpModalVisible, setPfpModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);

  // image path
  const { profileImage, setProfileImage } = useAuth();
  const [newImagePath, setNewImagePath] = useState("");

  // Password visibility
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");

  const [loading, setLoading] = useState(false);

  // PROFILE
  // save updated info
  const handleSave = async () => {
    setLoading(true);

    try {
      const result = await userProfileService.update(user.id, form);

      if (result.success) {
        Alert.alert("Success", "Profile updated successfully.");
        setIsEditing(false);
      } else {
        Alert.alert("Error", result.serverError);
      }

      return result;
    } finally {
      setLoading(false);
    }
  };

  // select image for ChangePfpContent modal
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      alert("Permission to access gallery is required!");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setNewImagePath(result.assets[0]);
    }
  };

  // handle save pfp
  const handleSavePfp = async () => {
    if (!newImagePath) return;
    // log
    console.log('[handleSavePfp] newImagePath:', JSON.stringify(newImagePath));
    setLoading(true);
    try {
      const result = await userProfileService.update(user.id, {
        pfp: newImagePath,
      });

      if (result.success) {
        // add cache busting parameter to force image refresh on mobile
        const pfpUrl = result.data?.pfp_url;
        const cacheBustingUrl = pfpUrl
          ? `${pfpUrl}${pfpUrl.includes("?") ? "&" : "?"}t=${Date.now()}`
          : null;
        setProfileImage(cacheBustingUrl);
        setPfpModalVisible(false);
        setNewImagePath("");
        Alert.alert("Success", "Profile picture updated successfully.");
        return { success: true, pfp_url: cacheBustingUrl };
      } else {
        Alert.alert(
          "Error",
          result.serverError || "Failed to update profile picture.",
        );
        return { success: false };
      }
    } catch (err) {
      Alert.alert("Error", "Failed to update profile picture.");
      console.log("Profile picture update error:", err);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // SECURITY
  const handleSaveUsername = async () => {
    try {
      const result = await userProfileService.update(user.id, { username });
      if (result.success) {
        window.alert("Success", "Username updated successfully.");
        setEditingUsername(false);
      } else {
        window.alert("Error", result.serverError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSavePassword = async (currentPw, newPw) => {
    if (!currentPw || !newPw) return;

    setLoading(true);
    try {
      const result = await userProfileService.changePassword(
        user.id,
        currentPw,
        newPw,
      );

      if (result.success) {
        window.alert("Password updated successfully.");
        setPasswordModalVisible(false);
        setPassword("");
        setCurrentPassword("");
        return { success: true };
      } else {
        // Return error so ChangePasswordContent shows it inline
        return { error: result };
      }
    } finally {
      setLoading(false);
    }
  };

  // Populate fields
  useEffect(() => {
    if (user) {
      setForm({
        firstname: user.firstname || "",
        lastname: user.lastname || "",
        identification: user.identification || "",
        personal_email: user.personal_email || "",
        tel: user.tel || "",
      });
      setUsername(user.username || "");
      setProfileImage(user.pfp_url || null);
    }
  }, [user]);

  return {
    user,
    form,
    setForm,
    updateField,
    username,
    setUsername,
    password,
    setPassword,
    profileImage,
    setProfileImage,
    editingUsername,
    setEditingUsername,
    editingPassword,
    setEditingPassword,
    pfpModalVisible,
    setPfpModalVisible,
    passwordModalVisible,
    setPasswordModalVisible,
    newImagePath,
    setNewImagePath,
    showCurrentPassword,
    setShowCurrentPassword,
    showNewPassword,
    setShowNewPassword,
    currentPassword,
    setCurrentPassword,
    pickImage,
    handleSavePfp,
    isEditing,
    setIsEditing,
    handleSave,
    handleSavePassword,
    handleSaveUsername,
    loading,
  };
};
