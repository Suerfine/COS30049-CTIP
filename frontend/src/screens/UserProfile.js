import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  ImageBackground,
  Dimensions,
  Modal,
  Platform,
  useWindowDimensions,
} from "react-native";
import { SquarePen, ShieldCheck } from "lucide-react-native";
import { Eye, EyeOff, FileUp } from "lucide-react-native";

// Import other hooks and components
import ChangePfpContent from "../components/ChangePfpContent";
import ChangePasswordContent from "../components/ChangePasswordContent";
import ModalLayout from "../components/ModalLayout";
import { ModalStyle } from "../components/ModalStyle";
import { useUserProfile } from "../hooks/useUserProfile";
import { userProfileService } from "../services/userProfileService";
import { useSignUp } from "../hooks/useSignUp";
import {
  isValidEmail,
  isOnlyLetters,
  phoneRegex,
  isValidPassword,
  isValidIdentification,
} from "../utils/Validation";
import { useTranslation } from "react-i18next";

const UserProfile = ({ navigation }) => {
  const {
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
    loading,
  } = useUserProfile();
  const [originalData, setOriginalData] = useState(null);
  const [errors, setErrors] = useState({});
  const { handleUpload, file, setFile } = useSignUp();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 768;
  const { t, i18n } = useTranslation();

  // validate form
  const validateForm = () => {
    let tempErrors = {};

    if (!form.firstname?.trim()) {
      tempErrors.firstname = "* First name is required.";
    } else if (form.firstname.trim().length < 3) {
      tempErrors.firstname = "* First name must be at least 3 characters.";
    } else if (!isOnlyLetters(form.firstname)) {
      tempErrors.firstname = "* First name must only contain letters.";
    }

    if (!form.lastname?.trim()) {
      tempErrors.lastname = "* Last name is required.";
    } else if (form.lastname.trim().length < 2) {
      tempErrors.lastname = "* Last name must be at least 2 characters.";
    } else if (!isOnlyLetters(form.lastname)) {
      tempErrors.lastname = "* Last name must only contain letters.";
    }

    if (!form.identification?.trim()) {
      tempErrors.identification = "* IC / Passport is required.";
    } else if (!isValidIdentification(form.identification)) {
      tempErrors.identification =
        "* Invalid IC/Passport format. Use 12 digit for IC or 1 uppercase letter followed by 8 digits for Passport.";
    }

    if (!form.personal_email?.trim()) {
      tempErrors.personal_email = "* Email is required.";
    } else if (!isValidEmail(form.personal_email)) {
      tempErrors.personal_email = "* Invalid email format.";
    }

    if (!form.tel?.trim()) {
      tempErrors.tel = "* Phone number is required.";
    } else if (!phoneRegex.test(form.tel)) {
      tempErrors.tel =
        "* Invalid phone number. Expected formats: 01XXXXXXXX or 01XXXXXXXXX.";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {/* Background Image */}
          <ImageBackground
            source={require("../../assets/forest.png")}
            style={styles.backgroundImage}
          ></ImageBackground>

          {/* Pfp and name */}
          <View style={styles.pfpRow}>
            <View style={styles.pfpWrapper}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.pfp} />
              ) : (
                <View style={styles.pfpPlaceholder}>
                  <Text style={styles.pfpInitials}>
                    {form.firstname ? form.firstname[0].toUpperCase() : "?"}
                  </Text>
                </View>
              )}

              {/* edit profile button */}
              <Pressable
                style={({ hovered }) => [
                  styles.pfpEditBtn,
                  hovered && styles.hoverBtn,
                ]}
                onPress={() => setPfpModalVisible(true)}
              >
                <SquarePen size={18} color="white" />
              </Pressable>
            </View>

            <Text style={styles.name}>
              {form.firstname || form.lastname
                ? `${form.firstname} ${form.lastname}`.trim()
                : "Name"}
            </Text>
          </View>

          {/* Change pfp modal */}
          <ModalLayout
            visible={pfpModalVisible}
            onClose={() => {
              setPfpModalVisible(false);
              setNewImagePath("");
            }}
          >
            <ChangePfpContent
              image={newImagePath}
              onPickImage={pickImage}
              onSave={async () => {
                const result = await handleSavePfp();
                if (result?.success && result.pfp_url) {
                  setProfileImage(result.pfp_url);
                }
              }}
              onClose={() => {
                setPfpModalVisible(false);
                setNewImagePath("");
              }}
              loading={loading}
            />
          </ModalLayout>
        </View>

        {/* Personal Information */}
        <View style={[styles.section, isSmallScreen && styles.sectionMobile]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("personal information")}</Text>
            <View style={styles.actionButtons}>
              {!isEditing ? (
                <Pressable
                  style={styles.saveBtn}
                  onPress={() => {
                    setOriginalData(form);
                    setIsEditing(true);
                  }}
                >
                  <Text style={styles.saveBtnText}>{t("edit")}</Text>
                </Pressable>
              ) : (
                <>
                  <Pressable
                    style={styles.cancelBtn}
                    onPress={() => {
                      if (originalData) {
                        setForm(originalData);
                      }
                      setIsEditing(false);
                    }}
                  >
                    <Text style={styles.cancelBtnText}>{t("cancel")}</Text>
                  </Pressable>

                  <Pressable
                    style={styles.saveBtn}
                    onPress={() => {
                      if (validateForm()) {
                        handleSave();
                      }
                    }}
                  >
                    <Text style={styles.saveBtnText}>{t("save changes")}</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>

          {/* first name, last name and IC row*/}
          <View
            style={[styles.fieldRow, isSmallScreen && styles.fieldRowMobile]}
          >
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t("first name")}</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={form.firstname}
                onChangeText={(text) => {
                  updateField("firstname", text);
                  setErrors((prev) => ({ ...prev, firstname: null }));
                }}
                editable={isEditing}
                placeholder="First name"
                placeholderTextColor="grey"
              />
              {errors.firstname && (
                <Text style={styles.errorText}>{errors.firstname}</Text>
              )}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t("last name")}</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={form.lastname}
                onChangeText={(text) => {
                  updateField("lastname", text);
                  setErrors((prev) => ({ ...prev, lastname: null }));
                }}
                editable={isEditing}
                placeholder="Last name"
                placeholderTextColor="grey"
              />
              {errors.lastname && (
                <Text style={styles.errorText}>{errors.lastname}</Text>
              )}
            </View>
          </View>

          <View
            style={[styles.fieldRow, isSmallScreen && styles.fieldRowMobile]}
          >
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>IC / Passport No.</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={form.identification}
                onChangeText={(text) => {
                  updateField("identification", text);
                  setErrors((prev) => ({ ...prev, identification: null }));
                }}
                editable={isEditing}
                placeholder="e.g. 040506101234 or A01234567"
                placeholderTextColor="grey"
              />
              {errors.identification && (
                <Text style={styles.errorText}>{errors.identification}</Text>
              )}
            </View>
          </View>

          <View
            style={[styles.fieldRow, isSmallScreen && styles.fieldRowMobile]}
          >
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t("email")}</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={form.personal_email}
                onChangeText={(text) => {
                  updateField("personal_email", text);
                  setErrors((prev) => ({ ...prev, personal_email: null }));
                }}
                editable={isEditing}
                placeholder="address@gmail.com"
                placeholderTextColor="grey"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.personal_email && (
                <Text style={styles.errorText}>{errors.personal_email}</Text>
              )}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t("phone number")}</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={form.tel}
                onChangeText={(text) => {
                  updateField("tel", text);
                  setErrors((prev) => ({ ...prev, tel: null }));
                }}
                editable={isEditing}
                placeholder="0123456789"
                placeholderTextColor="grey"
                keyboardType="phone-pad"
              />
              {errors.tel && <Text style={styles.errorText}>{errors.tel}</Text>}
            </View>
          </View>
        </View>

        {/* Security */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("Security")}</Text>
          </View>
          <Pressable
            style={({ hovered }) => [
              styles.securityBtn,
              hovered && styles.securityBtnHover,
            ]}
            onPress={() => navigation.navigate("Security")}
          >
            <ShieldCheck size={18} color="#2f6618fe" />
            <Text style={styles.securityBtnText}>
              {t("password_two_factor_auth")}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Profile header
  profileHeader: {
    marginBottom: 8,
  },
  backgroundImage: {
    width: "100%",
    height: 160,
    overflow: "hidden",
  },
  pfpRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 14,
    marginTop: -40,
    marginBottom: 20,
    marginLeft: 20,
  },
  pfpWrapper: {
    position: "relative",
    width: 90,
    height: 90,
  },
  pfp: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 5,
    borderColor: "white",
  },
  pfpPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#2f6618fe",
    borderWidth: 5,
    borderColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  pfpInitials: {
    fontSize: 32,
    fontWeight: "700",
    color: "white",
  },
  pfpEditBtn: {
    position: "absolute",
    bottom: -20,
    right: -30,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#2f6618fe",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  name: {
    fontSize: 20,
    fontWeight: "600",
    color: "black",
    marginTop: 50,
    marginLeft: 40,
  },
  // Personal info section
  section: {
    backgroundColor: "white",
    width: "90%",
    maxWidth: 1000,
    alignSelf: "center",
    marginVertical: 16,
    borderRadius: 12,
    padding: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionMobile: {
    width: "92%",
    padding: 18,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 12,
    flexWrap: "wrap",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "black",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: "#2f6618fe",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  cancelBtnText: {
    fontSize: 13,
    color: "#2f6618fe",
    fontWeight: "500",
  },
  saveBtn: {
    backgroundColor: "#2f6618fe",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  saveBtnText: {
    fontSize: 13,
    color: "white",
    fontWeight: "600",
  },
  // Input fields
  fieldRow: {
    flexDirection: "row",
    gap: 40,
    marginBottom: 25,
  },
  fieldRowMobile: {
    flexDirection: "column",
    gap: 16,
  },
  fieldGroup: {
    flex: 1,
    minWidth: 0,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "black",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#2f6618fe",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "black",
    backgroundColor: "white",
  },
  inputDisabled: {
    backgroundColor: "#F3F4F6",
    color: "grey",
  },
  // Upload resume
  resumeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  resumeInput: {
    flex: 1,
  },
  uploadBtn: {
    borderWidth: 1,
    borderColor: "#2f6618fe",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  uploadBtnText: {
    fontSize: 13,
    color: "#2f6618fe",
    fontWeight: "500",
  },
  // hover button styles
  hoverBtn: {
    backgroundColor: "#A5D6A7",
  },
  hoverBtnOutline: {
    backgroundColor: "#e6f2e6",
  },
  errorText: {
    color: "#b42318",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
    textAlign: "left",
  },
  securityBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#2f6618fe",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: "flex-start",
  },
  securityBtnHover: {
    backgroundColor: "#e6f2e6",
  },
  securityBtnText: {
    fontSize: 14,
    color: "#2f6618fe",
    fontWeight: "500",
  },
});

export default UserProfile;
