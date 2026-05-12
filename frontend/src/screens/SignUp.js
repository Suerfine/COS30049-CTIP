import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  Image,
  useWindowDimensions,
} from "react-native";
import {
  User,
  Mail,
  Phone,
  IdCard,
  FileUp,
  FileCheck,
  FileIcon,
  X,
} from "lucide-react-native";

// Import other hook and component
import { useSignUp } from "../hooks/useSignUp";

const SignUp = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 980;
  const {
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
  } = useSignUp();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View
          style={[
            styles.shell,
            isDesktop ? styles.shellDesktop : styles.shellMobile,
          ]}
        >
          {isDesktop && (
            <View style={styles.heroPanel}>
              <Image
                source={require("../../assets/forest.png")}
                style={styles.heroImageFill}
                accessibilityLabel="Forest background"
              />
              <View style={styles.heroOverlay} />
              <View style={styles.heroContent}>
                <Text style={styles.heroTitle}>Train With Purpose</Text>
                <Text style={styles.heroSubtitle}>
                  Create your account to access assigned courses, certification
                  paths, and field-readiness modules.
                </Text>
                <View style={styles.heroChipRow}>
                  <Text style={styles.heroChip}>Role-Based Access</Text>
                  <Text style={styles.heroChip}>Security First</Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.formPanel}>
            <View style={styles.brandRow}>
              <Image
                source={require("../../assets/sfc_logo.png")}
                style={styles.brandLogo}
                accessibilityLabel="SFC logo"
              />
              <View>
                <Text style={styles.brandTitle}>SFC Digital Training</Text>
                <Text style={styles.brandCaption}>
                  Official Internal Learning Platform
                </Text>
              </View>
            </View>

            <View style={styles.header}>
              <Text style={styles.title}>Registration</Text>
              <Text style={styles.subtitle}>
                Register to start your training and compliance modules.
              </Text>
            </View>

            {error.backend && (
              <View style={styles.errorAlert}>
                <Text style={styles.errorAlertText}>{error.backend}</Text>
              </View>
            )}

            <View style={styles.form}>
              <View style={styles.row}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>First Name</Text>
                  <View style={styles.inputContainer}>
                    <User size={20} color="#2f6618fe" style={styles.icon} />
                    <TextInput
                      style={styles.input}
                      placeholder="John"
                      placeholderTextColor="#8f8f8f"
                      value={fname}
                      editable={!loading}
                      onChangeText={setFname}
                    />
                  </View>
                  {error.fname && (
                    <Text style={styles.errorText}>{error.fname}</Text>
                  )}
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Last Name</Text>
                  <View style={styles.inputContainer}>
                    <User size={20} color="#2f6618fe" style={styles.icon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Doe"
                      placeholderTextColor="#8f8f8f"
                      value={lname}
                      editable={!loading}
                      onChangeText={setLname}
                    />
                  </View>
                  {error.lname && (
                    <Text style={styles.errorText}>{error.lname}</Text>
                  )}
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputContainer}>
                    <Mail size={20} color="#2f6618fe" style={styles.icon} />
                    <TextInput
                      style={styles.input}
                      placeholder="johndoe@example.com"
                      placeholderTextColor="#8f8f8f"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      editable={!loading}
                    />
                  </View>
                  {error.email && (
                    <Text style={styles.errorText}>{error.email}</Text>
                  )}
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Telephone</Text>
                  <View style={styles.inputContainer}>
                    <Phone size={20} color="#2f6618fe" style={styles.icon} />
                    <TextInput
                      style={styles.input}
                      placeholder="01x-xxxxxxx"
                      placeholderTextColor="#8f8f8f"
                      editable={!loading}
                      onChangeText={setTelephone}
                      value={telephone}
                    />
                  </View>
                  {error.tel && (
                    <Text style={styles.errorText}>{error.tel}</Text>
                  )}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Passport/IC.</Text>
                <View style={styles.inputContainer}>
                  <IdCard size={20} color="#2f6618fe" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your IC"
                    placeholderTextColor="#8f8f8f"
                    value={ic}
                    onChangeText={setIc}
                    editable={!loading}
                  />
                </View>
                {error.ic && <Text style={styles.errorText}>{error.ic}</Text>}
              </View>

              {/* Resume/CV */}
              <View>
                <Text style={styles.label}>Resume / CV (PDF or Word)</Text>
                {!file ? (
                  <Pressable
                    style={({ pressed }) => [
                      styles.uploadBox,
                      pressed && { backgroundColor: "#f0fdf4" },
                    ]}
                    onPress={handleUpload}
                  >
                    <FileUp size={32} color="#666" />
                    <Text style={styles.uploadText}>
                      Click here to upload resume
                    </Text>
                    <Text style={styles.subtext}>
                      PDF, DOC, or DOCX (Max 5MB)
                    </Text>
                  </Pressable>
                ) : (
                  <View style={styles.fileCard}>
                    <View style={styles.fileInfo}>
                      <FileCheck size={24} color="#0a6340" />
                      <Text style={styles.fileName} numberOfLines={1}>
                        {file.name}
                      </Text>
                    </View>
                    <Pressable onPress={removeFile} style={styles.removeBtn}>
                      <X size={20} color="#ff4d4d" />
                    </Pressable>
                  </View>
                )}
              </View>
              {error.file && <Text style={styles.errorText}>{error.file}</Text>}
              <Pressable
                style={[styles.signupButton, loading && styles.disabledButton]}
                onPress={() => handleSignUp(navigation)}
              >
                <Text style={styles.signupButtonText}>
                  {loading ? "Creating Account..." : "Create Account"}
                </Text>
              </Pressable>

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <Pressable onPress={() => navigation.navigate("Login")}>
                  <Text style={styles.loginLink}>Sign In</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: "100vh",
    backgroundColor: "#e8efe7",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    padding: 24,
  },
  shell: {
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d8e2d6",
  },
  shellDesktop: {
    flexDirection: "row",
  },
  shellMobile: {
    flexDirection: "column",
  },
  heroPanel: {
    width: "45%",
    justifyContent: "flex-end",
    position: "relative",
    overflow: "hidden",
  },
  heroImageFill: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(24, 46, 17, 0.62)",
  },
  heroContent: {
    padding: 28,
    gap: 12,
    userSelect: "none",
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 30,
    fontWeight: "700",
  },
  heroSubtitle: {
    color: "#d4f0cf",
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 380,
  },
  heroChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },
  heroChip: {
    color: "#e2ffd8",
    borderWidth: 1,
    borderColor: "#8ccd7e",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: "600",
    backgroundColor: "rgba(52, 95, 44, 0.55)",
  },
  formPanel: {
    flex: 1,
    padding: 28,
    justifyContent: "space-between",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 15,
  },
  brandLogo: {
    width: 78,
    height: 34,
    resizeMode: "contain",
  },
  brandTitle: {
    color: "#1f4f13",
    fontSize: 17,
    fontWeight: "700",
  },
  brandCaption: {
    color: "#6f786d",
    fontSize: 12,
  },
  header: {
    marginBottom: 22,
  },
  passwordHint: {
    color: "#7b8d76",
    fontSize: 12,
    marginTop: 6,
    lineHeight: 17,
  },
  title: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#1f4f13",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: "#60735b",
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginLeft: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fbfdfb",
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#d4ddd3",
    height: 52,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 40,
    outlineStyle: "none",
  },
  strengthContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
    marginLeft: 5,
  },
  strengthBars: {
    flexDirection: "row",
    gap: 4,
    flex: 1,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  matchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    marginLeft: 5,
  },
  matchText: {
    fontSize: 12,
    fontWeight: "500",
  },
  signupButton: {
    backgroundColor: "#2f6618fe",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 6,
  },
  disabledButton: {
    opacity: 0.6,
  },
  signupButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  warningContainer: {
    backgroundColor: "#fff3cd",
    borderLeftWidth: 4,
    borderLeftColor: "#f57c00",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginTop: 10,
  },
  warningText: {
    color: "#856404",
    fontSize: 13,
    fontWeight: "500",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  dividerText: {
    marginHorizontal: 10,
    color: "#999",
    fontSize: 12,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    color: "#60735b",
    fontSize: 14,
  },
  loginLink: {
    color: "#2f6618fe",
    fontSize: 14,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  uploadBox: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#ccc",
    borderRadius: 12,
    padding: 30,
    alignItems: "center",
    backgroundColor: "#fafafa",
    marginTop: 10,
  },
  uploadText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  subtext: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  fileCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#eafaf1",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#0a6340",
    marginTop: 10,
  },
  fileInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  fileName: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  removeBtn: {
    padding: 5,
  },
  errorText: {
    color: "#b42318",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
    textAlign: "left",
  },
  errorAlert: {
    backgroundColor: "#fee2e2",
    borderLeftWidth: 4,
    borderLeftColor: "#dc2626",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorAlertText: {
    color: "#991b1b",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default SignUp;
