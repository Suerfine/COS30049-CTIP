import { useState, useEffect } from "react";
import { AccountService } from "../services/AccountService";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";

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
      const errorMessage = err.response?.data?.message || "An error occurred";
      return {
        success: false,
        displayMessage: `* ${errorMessage}`,
      };
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAccount = async (IdleDeadline, formData, imageFile=null) => {
    setLoading(true);
    try {
        if (imageFile) {
            await AccountService.updateProfilePicture(IdleDeadline, imageFile);
        }
        const result = await AccountService.update(IdleDeadline, formData);
        // if (refresh) {
        //     await refresh();
        // }
        await fetchAccounts();
        return { success: true, data: result };
    } catch (errString) {
        return { success: false, serverError: errString };
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
            Alert.alert("Permission required", "Please allow access to your photo library.");
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
  };
};
