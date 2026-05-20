import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { X } from "lucide-react-native";
import { ModalStyle as styles } from "./ModalStyle";
import { isValidEmail, isOnlyLetters, phoneRegex } from "../utils/Validation";

const UsersFormContent = ({ onSubmit, onCancel, isLoading }) => {
  const { width } = useWindowDimensions();
  const isCompact = width < 720;
  const [form, setForm] = useState({
    ic: "",
    email: "",
    image: null,
    fname: "",
    lname: "",
    telefon: "",
    role: "parkguide",
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    let tempErrors = {};
    if (!form.fname.trim()) {
      tempErrors.fname = "* First name is required.";
    } else if (!isOnlyLetters(form.fname)) {
      tempErrors.fname = "* First name must only contain letters.";
    }
    if (!form.lname.trim()) {
      tempErrors.lname = "* Last name is required.";
    } else if (!isOnlyLetters(form.lname)) {
      tempErrors.lname = "* Last name must only contain letters.";
    }
    if (!form.ic.trim()) {
      tempErrors.ic = "* IC/Passport No. is required.";
    }
    if (!form.email.trim()) {
      tempErrors.email = "* Personal Email is required.";
    } else if (!isValidEmail(form.email)) {
      tempErrors.email = "* Personal Email is invalid format.";
    }
    if (!form.telefon.trim()) {
      tempErrors.telefon = "* Phone Number is required.";
    } else if (!phoneRegex.test(form.telefon)) {
      tempErrors.telefon = "* Invalid phone number.";
    }
    setErrors(tempErrors);

    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) await onSubmit(form);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Permission to access gallery is required!");
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) setForm({ ...form, image: result.assets[0].uri });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, localStyles.rowHeader]}>
        <Text style={styles.title}>Add New User</Text>
        <Pressable onPress={onCancel}>
          <X />
        </Pressable>
      </View>

      <View
        style={[localStyles.formContainer, isCompact && localStyles.formStack]}
      >
        {/* Inputs Container - Appears on Left (Desktop) or Top (Mobile) */}
        <View
          style={[localStyles.fieldsColumn, isCompact && localStyles.fullWidth]}
        >
          <View
            style={[localStyles.rowFields, isCompact && localStyles.rowCompact]}
          >
            <View style={localStyles.fieldGroup}>
              <Text style={styles.label}>First Name:</Text>
              <TextInput
                style={styles.input}
                value={form.fname}
                placeholder="John"
                placeholderTextColor="#8f8f8f"
                onChangeText={(text) => setForm({ ...form, fname: text })}
              />
              {errors.fname && (
                <Text style={localStyles.errorText}>{errors.fname}</Text>
              )}
            </View>
            <View style={localStyles.fieldGroup}>
              <Text style={styles.label}>Last Name:</Text>
              <TextInput
                style={styles.input}
                value={form.lname}
                placeholder="Doe"
                placeholderTextColor="#8f8f8f"
                onChangeText={(text) => setForm({ ...form, lname: text })}
              />
              {errors.lname && (
                <Text style={localStyles.errorText}>{errors.lname}</Text>
              )}
            </View>
          </View>

          <View style={localStyles.singleFieldGroup}>
            <Text style={styles.label}>Passport/IC:</Text>
            <TextInput
                style={styles.input}
                value={form.ic}
                placeholder="e.g. 040506101234 or A01234567"
                placeholderTextColor="#8f8f8f"
                onChangeText={(text) => setForm({ ...form, ic: text })}
            />
            {errors.ic && (
              <Text style={localStyles.errorText}>{errors.ic}</Text>
            )}
          </View>

          <View
            style={[localStyles.rowFields, isCompact && localStyles.rowCompact]}
          >
            <View style={localStyles.fieldGroup}>
              <Text style={styles.label}>Email:</Text>
              <TextInput
                style={styles.input}
                value={form.email}
                placeholder="address@email.com"
                placeholderTextColor="#8f8f8f"
                onChangeText={(text) => setForm({ ...form, email: text })}
              />
              {errors.email && (
                <Text style={localStyles.errorText}>{errors.email}</Text>
              )}
            </View>
            <View style={localStyles.fieldGroup}>
              <Text style={styles.label}>Telefon:</Text>
              <TextInput
                style={styles.input}
                value={form.telefon}
                placeholder="0123456789"
                placeholderTextColor="#8f8f8f"
                onChangeText={(text) => setForm({ ...form, telefon: text })}
              />
              {errors.telefon && (
                <Text style={localStyles.errorText}>{errors.telefon}</Text>
              )}
            </View>
          </View>

          <View style={localStyles.singleFieldGroup}>
            <Text style={styles.label}>Role:</Text>
            <View style={localStyles.radioGroupRow}>
              <TouchableOpacity
                style={localStyles.radioOption}
                onPress={() => setForm({ ...form, role: "admin" })}
              >
                <View style={localStyles.radioCircle}>
                  {form.role === "admin" && (
                    <View style={localStyles.selectedRb} />
                  )}
                </View>
                <Text style={localStyles.radioText}>Admin</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={localStyles.radioOption}
                onPress={() => setForm({ ...form, role: "parkguide" })}
              >
                <View style={localStyles.radioCircle}>
                  {form.role === "parkguide" && (
                    <View style={localStyles.selectedRb} />
                  )}
                </View>
                <Text style={localStyles.radioText}>Park Guide</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Upload Section - Appears on Right (Desktop) or Bottom (Mobile) */}
        <View
          style={[
            styles.upload,
            localStyles.uploadSection,
            isCompact && localStyles.fullWidth,
          ]}
        >
          <Text style={styles.label}>Upload Images</Text>
          <Pressable style={styles.imagePicker} onPress={pickImage}>
            {form.image ? (
              <Image source={{ uri: form.image }} style={styles.previewImage} />
            ) : (
              <View style={localStyles.uploadPlaceholder}>
                <Image
                  source={require("../../assets/upload_placeholder.png")}
                  accessibilityLabel="Upload Placeholder Image"
                  style={localStyles.placeholder}
                />
                <Text style={localStyles.muted}>Select your image</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <Pressable style={styles.Btn} onPress={handleSubmit} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={{ fontWeight: "600" }}>Add User</Text>
        )}
      </Pressable>
    </View>
  );
};

const localStyles = StyleSheet.create({
  formContainer: {
    flexDirection: "row",
    gap: 30,
    width: "100%",
    alignItems: "flex-start",
  },
  formStack: {
    flexDirection: "column",
    gap: 25,
  },
  fieldsColumn: {
    flex: 2,
    gap: 15,
  },
  uploadSection: {
    flex: 1,
    minWidth: 220,
  },
  fullWidth: {
    width: "100%",
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 15,
  },
  rowFields: {
    flexDirection: "row",
    gap: 16,
    width: "100%",
  },
  rowCompact: {
    flexDirection: "column",
    gap: 15,
  },
  fieldGroup: {
    flex: 1,
  },
  singleFieldGroup: {
    width: "100%",
    marginTop: 5,
  },
  radioGroupRow: {
    flexDirection: "row",
    gap: 24,
    marginTop: 8,
    alignItems: "center",
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioCircle: {
    height: 18,
    width: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#2c3e50",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  selectedRb: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2c3e50",
  },
  radioText: {
    fontSize: 14,
    color: "#333",
  },
  placeholder: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginBottom: 8,
  },
  uploadPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  muted: {
    color: "#646464",
    fontSize: 13,
  },
  errorText: {
    color: "red",
  },
});

export default UsersFormContent;
