import { useState, useEffect } from "react";
import { AccountService } from "../services/AccountService";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  isOnlyLetters,
  isValidIdentification,
  phoneRegex,
  isValidEmail,
} from "../utils/Validation";

export const useAccountManagement = () => {
  const [accounts, setAccounts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });
  const [loading, setLoading] = useState(false);
  const [currentRole, setCurrentRole] = useState("all");
  const [editErrors, setEditErrors] = useState({});
  const [editForm, setEditForm] = useState(null);

  // Fetch all accounts
  const fetchAccounts = async () => {
    try {
      const roleParam = currentRole === "all" ? "" : currentRole;
      const response = await AccountService.getAll(
        currentPage,
        10,
        searchQuery,
        sortConfig,
        roleParam,
      );
      const rawUsers = Array.isArray(response)
        ? response
        : response.data || response.users || [];
      const initializedData = rawUsers.map((u) => ({
        ...u,
        selected: false,
        profileImage:
          u.profileImage ||
          u.pfp_url ||
          u.pfp ||
          u.user_profile_image ||
          u.profile_image ||
          null,
      }));
      setAccounts(initializedData);
      setTotalUsers(response.totalElements);
      setTotalPages(response.totalPages);
    } catch (err) {
      console.log("Failed to fetch all users: ", err);
      setAccounts([]);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [currentPage, searchQuery, sortConfig, currentRole]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const requestSort = (key) => {
    let direction = "asc";

    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }

    setSortConfig({ key, direction });
  };

  const resetSort = () => {
    setSortConfig({ key: null, direction: "asc" });
  };

  const handleCreateAccount = async (formData) => {
    if (
      !formData.fname ||
      !formData.email ||
      !formData.ic ||
      !formData.telefon
    ) {
      Alert.alert(
        "Missing fields",
        "Please ensure First Name, Email, Telephone and IC are filled.",
      );
      return;
    }
    setLoading(true);
    try {
      await AccountService.create(formData);
      Alert.alert("Success", "Account created successfully.");
      return { success: true };
    } catch (err) {
      // err is a string message from the service
      const errorMessage = typeof err === "string" ? err : "An error occurred";
      Alert.alert("Error", errorMessage);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const validateEditForm = () => {
    let tempErrors = {};

    if (!editForm?.firstname?.trim()) {
      tempErrors.firstname = "* First name is required.";
    } else if (!isOnlyLetters(editForm.firstname)) {
      tempErrors.firstname = "* First name must contain only letters.";
    }

    if (!editForm?.lastname?.trim()) {
      tempErrors.lastname = "* Last name is required.";
    } else if (!isOnlyLetters(editForm.lastname)) {
      tempErrors.lastname = "* Last name must contain only letters.";
    }

    if (!editForm?.username?.trim()) {
      tempErrors.username = "* Username is required.";
    }

    if (!editForm?.identification?.trim()) {
      tempErrors.identification = "* Passport/IC number is required.";
    } else if (!isValidIdentification(editForm.identification)) {
      tempErrors.identification = "* Invalid Passport or IC layout format.";
    }

    if (!editForm?.tel?.trim()) {
      tempErrors.tel = "* Telephone number is required.";
    } else if (!phoneRegex.test(editForm.tel)) {
      tempErrors.tel =
        "* Invalid phone number arrangement format. Must start from 01xxxxxxxx";
    }

    if (!editForm?.personal_email?.trim()) {
      tempErrors.personal_email = "* Personal Email is required.";
    } else if (!isValidEmail(editForm.personal_email)) {
      tempErrors.personal_email = "* Invalid email layout formula format.";
    }

    setEditErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleUpdateAccount = async (
    IdleDeadline,
    formData,
    imageFile = null,
  ) => {
    setLoading(true);
    try {
      if (imageFile) {
        await AccountService.updateProfilePicture(IdleDeadline, imageFile);
      }
      const result = await AccountService.update(IdleDeadline, formData);
      await fetchAccounts();
      return { success: true, data: result };
    } catch (errString) {
      const errorMessage =
        typeof errString === "string" ? errString : "Failed to update account.";

      if (
        errorMessage.toLowerCase().includes("personal email already exists")
      ) {
        window.alert("Personal email already exists.");
      }

      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (id) => {
    setLoading(true);
    try {
      await AccountService.delete(id);
      if (refresh) {
        await refresh();
      }
      return { success: true };
    } catch (errString) {
      return { success: false, serverError: errString };
    } finally {
      setLoading(false);
    }
  };

  const pickProfilePicture = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "Please allow access to your photo library.",
      );
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (result.canceled) return null;
    return result.assets[0];
  };

  return {
    accounts,
    currentPage,
    setCurrentPage,
    totalPages,
    totalUsers,
    selectedUser,
    setSelectedUser,
    handleSearch,
    searchQuery,
    sortConfig,
    requestSort,
    resetSort,
    handleCreateAccount,
    loading,
    refresh: fetchAccounts,
    handleUpdateAccount,
    handleDeleteAccount,
    pickProfilePicture,
    currentRole,
    setCurrentRole,
    setEditErrors,
    editErrors,
    validateEditForm,
    editForm,
    setEditForm,
  };
};
