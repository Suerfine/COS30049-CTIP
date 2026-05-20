import { useEffect, useState } from "react";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  ImageBackground,
  StatusBar,
  Modal,
} from "react-native";
import { ChevronLeft, SquarePen, X, Check } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";

import { useUserProfile } from "../hooks/useUserProfile";
import {
  isValidEmail,
  isOnlyLetters,
  phoneRegex,
  isValidIdentification,
} from "../utils/Validation";
import ModalLayout from "../components/ModalLayout";
import ChangePfpContent from "../components/ChangePfpContent";

const UserProfile = ({ navigation }) => {
  const { t } = useTranslation();
  const {
    user,
    form,
    setForm,
    updateField,
    pfpModalVisible,
    setPfpModalVisible,
    newImagePath,
    setNewImagePath,
    profileImage,
    setProfileImage,
    pickImage,
    handleSavePfp,
    isEditing,
    setIsEditing,
    handleSave,
    loading,
  } = useUserProfile();
  const [errors, setErrors] = useState({});
  const [originalData, setOriginalData] = useState(null);

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
        "* Invalid IC/Passport format. Use format XXXXXX-XX-XXXX (IC) or 5-20 alphanumeric characters (Passport).";
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
        "* Invalid phone number. Expected formats: 01X-XXXXXXX, 0X-XXXXXX, or +61XXXXXXXXX";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.topSection}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.btnPressed,
          ]}
        >
          <ChevronLeft size={24} color="white" />
        </Pressable>
      </View>
      <ScrollView>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <ImageBackground
            source={require("../../assets/forest.png")}
            style={styles.backgroundImage}
          >
            <LinearGradient
              colors={["transparent", "rgba(242, 242, 242, 0.2)", "#f2f2f2"]}
              style={StyleSheet.absoluteFillObject}
            />
          </ImageBackground>

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

              <Pressable
                style={({ hovered }) => [
                  styles.pfpEditBtn,
                  hovered && styles.hoverBtn,
                ]}
                onPress={() => setPfpModalVisible(true)}
              >
                <SquarePen size={15} color="white" />
              </Pressable>
            </View>

            <Text style={styles.name}>
              {form.firstname || form.lastname
                ? `${form.firstname} ${form.lastname}`.trim()
                : t("name")}
            </Text>
          </View>

          <ModalLayout
            visible={pfpModalVisible}
            onClose={() => setPfpModalVisible(false)}
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
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("personal information")}</Text>
            <Pressable
              style={styles.editBtn}
              onPress={() => {
                setOriginalData(form);
                setIsEditing(true);
              }}
            >
              <Text style={styles.editBtnText}>{t("edit")}</Text>
            </Pressable>
          </View>

          <View style={styles.fieldRow}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t("first name")}</Text>
              <Text style={styles.fieldValue}>{form.firstname}</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t("last name")}</Text>
              <Text style={styles.fieldValue}>{form.lastname}</Text>
            </View>
          </View>

          <View style={styles.fieldRow}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                {t("ic")} / {t("passport")} No.
              </Text>
              <Text style={styles.fieldValue}>{form.identification}</Text>
            </View>
          </View>

          <View style={styles.fieldRow}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t("email address")}</Text>
              <Text style={styles.fieldValue}>{form.personal_email}</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t("phone number")}</Text>
              <Text style={styles.fieldValue}>{form.tel}</Text>
            </View>
          </View>
        </View>

        {/* Edit Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isEditing}
          onRequestClose={() => {
            if (originalData) setForm(originalData);
            setIsEditing(false);
          }}
        >
          <View style={styles.fullModalOverlay}>
            <View style={styles.fullModalContent}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Pressable
                  onPress={() => {
                    if (originalData) setForm(originalData);
                    setIsEditing(false);
                  }}
                  style={({ pressed }) => [
                    styles.icon,
                    pressed && styles.btnPressed,
                  ]}
                >
                  <X size={24} />
                </Pressable>
                <Text style={styles.modalTitle}>
                  {t("edit")} {t("profile")}
                </Text>
                <Pressable
                  onPress={async () => {
                    const ok = validateForm();
                    if (ok) await handleSave();
                  }}
                  style={({ pressed }) => [
                    styles.icon,
                    pressed && styles.btnPressed,
                  ]}
                >
                  <Check size={24} />
                </Pressable>
              </View>

              <ScrollView
                style={styles.modalBody}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.modalSectionHint}>
                  {t("update your personal details below.")}
                </Text>

                {/* Names Row */}
                <View style={styles.modalFieldRow}>
                  <View style={[styles.modalFieldGroup, { marginRight: 10 }]}>
                    <Text style={styles.modalInputLabel}>
                      {t("first name")}
                    </Text>
                    <TextInput
                      style={styles.modalInput}
                      value={form.firstname}
                      onChangeText={(text) => {
                        updateField("firstname", text);
                        setErrors((prev) => ({
                          ...prev,
                          firstname: undefined,
                        }));
                      }}
                      placeholder="e.g. Sin Mim"
                    />
                    {errors.firstname ? (
                      <Text style={styles.errorText}>{errors.firstname}</Text>
                    ) : null}
                  </View>
                  <View style={styles.modalFieldGroup}>
                    <Text style={styles.modalInputLabel}>{t("last name")}</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={form.lastname}
                      onChangeText={(text) => {
                        updateField("lastname", text);
                        setErrors((prev) => ({ ...prev, lastname: undefined }));
                      }}
                      placeholder="e.g. Fam"
                    />
                    {errors.lastname ? (
                      <Text style={styles.errorText}>{errors.lastname}</Text>
                    ) : null}
                  </View>
                </View>

                {/* IC / Passport */}
                <View style={styles.modalFieldGroup}>
                  <Text style={styles.modalInputLabel}>
                    {t("ic")} / {t("passport")} No.
                  </Text>
                  <TextInput
                    style={styles.modalInput}
                    value={form.identification}
                    onChangeText={(text) => {
                      updateField("identification", text);
                      setErrors((prev) => ({
                        ...prev,
                        identification: undefined,
                      }));
                    }}
                    keyboardType="default"
                  />
                  {errors.identification ? (
                    <Text style={styles.errorText}>
                      {errors.identification}
                    </Text>
                  ) : null}
                </View>

                {/* Email */}
                <View style={styles.modalFieldGroup}>
                  <Text style={styles.modalInputLabel}>
                    {t("email address")}
                  </Text>
                  <TextInput
                    style={styles.modalInput}
                    value={form.personal_email}
                    onChangeText={(text) => {
                      updateField("personal_email", text);
                      setErrors((prev) => ({
                        ...prev,
                        personal_email: undefined,
                      }));
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  {errors.personal_email ? (
                    <Text style={styles.errorText}>
                      {errors.personal_email}
                    </Text>
                  ) : null}
                </View>

                {/* Phone */}
                <View style={styles.modalFieldGroup}>
                  <Text style={styles.modalInputLabel}>
                    {t("phone number")}
                  </Text>
                  <TextInput
                    style={styles.modalInput}
                    value={form.tel}
                    onChangeText={(text) => {
                      updateField("tel", text);
                      setErrors((prev) => ({ ...prev, tel: undefined }));
                    }}
                    keyboardType="phone-pad"
                  />
                  {errors.tel ? (
                    <Text style={styles.errorText}>{errors.tel}</Text>
                  ) : null}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    zIndex: 10,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    padding: 8,
    borderRadius: 50,
    marginLeft: 10,
    position: "absolute",
    marginTop: 15,
  },
  btnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
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
    marginTop: -50,
  },
  pfpWrapper: {
    position: "relative",
    width: 90,
    height: 90,
  },
  pfp: {
    width: 100,
    height: 100,
    borderRadius: 60,
    borderWidth: 5,
    borderColor: "white",
  },
  pfpPlaceholder: {
    width: 100,
    height: 100,
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
    bottom: -10,
    right: -10,
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
    fontSize: 18,
    fontWeight: "600",
    color: "black",
    marginTop: 50,
    marginLeft: 20,
  },
  section: {
    backgroundColor: "white",
    borderRadius: 12,
    marginTop: 20,
    marginHorizontal: 10,
    paddingVertical: 20,
    paddingHorizontal: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "black",
  },
  editBtn: {
    backgroundColor: "#2f6618fe",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  editBtnText: {
    fontSize: 13,
    color: "white",
    fontWeight: "600",
  },
  fieldRow: {
    flexDirection: "row",
    gap: 40,
    marginBottom: 16,
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  fieldGroup: {
    flex: 1,
    minWidth: 140,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#8a8e93",
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 15,
    color: "#1a1a1a",
    fontWeight: "400",
  },
  fullModalOverlay: {
    justifyContent: "flex-end",
    flex: 1,
  },
  fullModalContent: {
    height: "93%",
    backgroundColor: "#f2f2f7",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  icon: {
    width: 40,
    height: 40,
    zIndex: 10,
    backgroundColor: "rgba(168, 168, 168, 0.3)",
    padding: 8,
    borderRadius: 50,
  },
  modalBody: {
    padding: 20,
  },
  modalSectionHint: {
    fontSize: 14,
    color: "#666",
    marginBottom: 25,
  },
  modalFieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalFieldGroup: {
    flex: 1,
    marginBottom: 20,
  },
  modalInputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0a6340",
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
  },
  errorText: {
    color: "#d32f2f",
    marginTop: 6,
    fontSize: 13,
  },
});

export default UserProfile;
