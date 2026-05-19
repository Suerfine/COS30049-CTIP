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
  Alert,
  useWindowDimensions,
} from "react-native";
import { SquarePen, ShieldCheck, ShieldOff } from "lucide-react-native";
import { Eye, EyeOff } from "lucide-react-native";

// Import other hooks and components
import ChangePasswordContent from "../components/ChangePasswordContent";
import ModalLayout from "../components/ModalLayout";
import { ModalStyle } from "../components/ModalStyle";
import { useUserProfile } from "../hooks/useUserProfile";
import { useTranslation } from "react-i18next";
import { totpService } from "../services/totpService";

const Security = ({ navigation }) => {
  const {
    user,
    username,
    setUsername,
    password,
    setPassword,
    editingUsername,
    setEditingUsername,
    editingPassword,
    setEditingPassword,
    passwordModalVisible,
    setPasswordModalVisible,
    showCurrentPassword,
    setShowCurrentPassword,
    showNewPassword,
    setShowNewPassword,
    currentPassword,
    setCurrentPassword,
    handleSavePassword,
    handleSaveUsername,
  } = useUserProfile();
  const { t, i18n } = useTranslation();
  const [errors, setErrors] = useState({});
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // 2FA disable flow
  const [disableModalVisible, setDisableModalVisible] = useState(false);
  const [disableCode, setDisableCode] = useState("");
  const [disableError, setDisableError] = useState("");
  const [disableLoading, setDisableLoading] = useState(false);
  const totpEnabled = user?.totp_enabled ?? false;

  const handleDisable2FA = async () => {
    if (disableCode.length !== 6) {
      setDisableError(
        t("enter_6_digit_code"),
      );
      return;
    }
    setDisableError("");
    setDisableLoading(true);
    try {
      await totpService.disable(disableCode);
      setDisableModalVisible(false);
      setDisableCode("");
      window.alert(t("two_factor_disabled"));
    } catch (err) {
      setDisableError(err.message);
    } finally {
      setDisableLoading(false);
    }
  };

  const clearError = (field) => {
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
  };

  const validateUsername = () => {
    let tempErrors = {};

    if (!username.trim()) {
      tempErrors.username = t("username_required");
    } else if (!/^[A-Za-z]+#[0-9]{4}$/.test(username)) {
      tempErrors.username =
        t("username_format_validation");
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Account Security */}
        <View style={[styles.section, isMobile && styles.sectionMobile]}>
          <Text style={styles.sectionTitle}>{t("account security")}</Text>

          {/* Username */}
          <View style={styles.securityField}>
            <Text style={styles.fieldLabel}>{t("username")}</Text>
            <View
              style={[styles.securityRow, isMobile && styles.securityRowMobile]}
            >
              <TextInput
                style={[
                  styles.input,
                  styles.securityInput,
                  !editingUsername && styles.inputDisabled,
                ]}
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  clearError("username");
                }}
                placeholder={t("username")}
                placeholderTextColor="grey"
                editable={editingUsername}
                autoCapitalize="none"
              />
              <Pressable
                style={({ hovered }) => [
                  styles.changeBtn,
                  hovered && styles.hoverBtn,
                ]}
                onPress={() => {
                  if (editingUsername) {
                    if (validateUsername()) {
                      handleSaveUsername();
                    }
                  } else {
                    setEditingUsername(true);
                  }
                }}
              >
                <Text style={styles.changeBtnText}>
                  {editingUsername ? t("confirm") : t("change")}
                </Text>
              </Pressable>

              {editingUsername && (
                <Pressable
                  style={({ hovered }) => [
                    styles.cancelBtn,
                    hovered && styles.hoverBtnOutline,
                  ]}
                  onPress={() => {
                    setEditingUsername(false);
                    setUsername(user?.username || "");
                  }}
                >
                  <Text style={styles.cancelBtnText}>{t("cancel")}</Text>
                </Pressable>
              )}
            </View>
            {errors.username && (
              <Text style={styles.errorText}>{errors.username}</Text>
            )}
          </View>

          {/* Password */}
          <View style={styles.securityField}>
            <Text style={styles.fieldLabel}>{t("password")}</Text>
            <View style={styles.securityRow}>
              <TextInput
                style={[
                  styles.input,
                  styles.securityInput,
                  styles.inputDisabled,
                ]}
                value="••••••••"
                editable={false}
              />
              <Pressable
                style={({ hovered }) => [
                  styles.changeBtn,
                  hovered && styles.hoverBtn,
                ]}
                onPress={() => setPasswordModalVisible(true)}
              >
                <Text style={styles.changeBtnText}>{t("change")}</Text>
              </Pressable>
            </View>

            {/* Change password modal */}
            <ModalLayout
              visible={passwordModalVisible}
              onClose={() => setPasswordModalVisible(false)}
            >
              <ChangePasswordContent
                currentPassword={currentPassword}
                setCurrentPassword={setCurrentPassword}
                password={password}
                setPassword={setPassword}
                showCurrentPassword={showCurrentPassword}
                setShowCurrentPassword={setShowCurrentPassword}
                showNewPassword={showNewPassword}
                setShowNewPassword={setShowNewPassword}
                onClose={() => setPasswordModalVisible(false)}
                onSave={(currentPw, newPw) =>
                  handleSavePassword(currentPw, newPw)
                }
              />
            </ModalLayout>
          </View>
        </View>

        {/* Two-Factor Authentication */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("two_factor_authentication")}
          </Text>

          <View style={styles.twoFARow}>
            <View style={styles.twoFAInfo}>
              {totpEnabled ? (
                <ShieldCheck size={22} color="#2f6618fe" />
              ) : (
                <ShieldOff size={22} color="#8f8f8f" />
              )}
              <View style={styles.twoFAText}>
                <Text style={styles.twoFAStatus}>
                  {totpEnabled ? t("enabled") : t("disabled")}
                </Text>
                <Text style={styles.twoFAHint}>
                  {totpEnabled
                    ? t("account_protected_authenticator")
                    : t("extra_security_layer")}
                </Text>
              </View>
            </View>

            {totpEnabled ? (
              <Pressable
                style={({ hovered }) => [
                  styles.dangerBtn,
                  hovered && styles.dangerBtnHover,
                ]}
                onPress={() => setDisableModalVisible(true)}
              >
                <Text style={styles.dangerBtnText}>{t("disable")}</Text>
              </Pressable>
            ) : (
              <Pressable
                style={({ hovered }) => [
                  styles.changeBtn,
                  hovered && styles.hoverBtn,
                ]}
                onPress={() => navigation.navigate("TotpSetup")}
              >
                <Text style={styles.changeBtnText}>{t("enable")}</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Disable 2FA modal */}
        <ModalLayout
          visible={disableModalVisible}
          onClose={() => {
            setDisableModalVisible(false);
            setDisableCode("");
            setDisableError("");
          }}
        >
          <View style={styles.disableModal}>
            <Text style={styles.disableModalTitle}>
              {t("disable_two_factor_authentication")}
            </Text>
            <Text style={styles.disableModalHint}>
              {t("enter_2fa_code")}
            </Text>
            <TextInput
              style={styles.codeInput}
              value={disableCode}
              onChangeText={(v) => {
                setDisableCode(v.replace(/[^0-9]/g, "").slice(0, 6));
                if (disableError) setDisableError("");
              }}
              placeholder="000000"
              placeholderTextColor="#8f8f8f"
              keyboardType="number-pad"
              maxLength={6}
              editable={!disableLoading}
              autoFocus
            />
            {!!disableError && (
              <Text style={styles.errorText}>{disableError}</Text>
            )}
            <View style={styles.disableModalButtons}>
              <Pressable
                style={({ hovered }) => [
                  styles.cancelBtn,
                  hovered && styles.hoverBtnOutline,
                ]}
                onPress={() => {
                  setDisableModalVisible(false);
                  setDisableCode("");
                  setDisableError("");
                }}
              >
                <Text style={styles.cancelBtnText}>{t("cancel")}</Text>
              </Pressable>
              <Pressable
                style={[styles.dangerBtn, disableLoading && styles.disabledBtn]}
                onPress={handleDisable2FA}
                disabled={disableLoading}
              >
                <Text style={styles.dangerBtnText}>
                  {disableLoading ? t("disabling") : t("disable_2fa")}
                </Text>
              </Pressable>
            </View>
          </View>
        </ModalLayout>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    backgroundColor: "white",
    width: "90%",
    maxWidth: 900,
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
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 20,
    fontSize: 17,
    fontWeight: "700",
    color: "black",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: "#2f6618fe",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
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
    flexWrap: "wrap",
  },
  fieldGroup: {
    flex: 1,
    minWidth: 140,
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
  // Account Security
  securityField: {
    marginBottom: 18,
  },
  securityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  securityRowMobile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  securityInput: {
    flex: 1,
    minWidth: 0,
  },
  changeBtn: {
    borderWidth: 1,
    borderColor: "#2f6618fe",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 90,
  },
  changeBtnText: {
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
  // 2FA section
  twoFARow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 16,
  },
  twoFAInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
  },
  twoFAText: { gap: 4 },
  twoFAStatus: { fontSize: 14, fontWeight: "700", color: "#1f4f13" },
  twoFAHint: { fontSize: 13, color: "#60735b", maxWidth: 380 },
  dangerBtn: {
    borderWidth: 1,
    borderColor: "#b42318",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  dangerBtnHover: { backgroundColor: "#fde8e8" },
  dangerBtnText: { fontSize: 13, color: "#b42318", fontWeight: "500" },
  disabledBtn: { opacity: 0.6 },
  disableModal: { gap: 14 },
  disableModalTitle: { fontSize: 17, fontWeight: "700", color: "#1f4f13" },
  disableModalHint: { fontSize: 14, color: "#60735b" },
  codeInput: {
    borderWidth: 1,
    borderColor: "#d4ddd3",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 56,
    fontSize: 24,
    fontWeight: "700",
    color: "#1f4f13",
    backgroundColor: "#fbfdfb",
    textAlign: "center",
    letterSpacing: 10,
    outlineStyle: "none",
  },
  disableModalButtons: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end",
  },
});

export default Security;
