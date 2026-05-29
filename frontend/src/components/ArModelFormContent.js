import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Platform } from "react-native";
import { X, Upload } from "lucide-react-native";
import * as DocumentPicker from "expo-document-picker";
import apiClient from "../config/apiConfig";
import { ModalStyle as styles } from "./ModalStyle";

const MAX_MODEL_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ["glb", "gltf"];
const DEFAULT_PATTERN_NAME = "pattern-SFC_Logo.patt";
const backendBase = (apiClient.defaults.baseURL || "").replace(/\/api$/, "");
const DEFAULT_PATTERN_URL = `${backendBase}/public/ar/default_pattern/${DEFAULT_PATTERN_NAME}`;

const ArModelFormContent = ({ onSubmit, onCancel, isLoading }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [modelFile, setModelFile] = useState(null);
  const [patternFile, setPatternFile] = useState(null);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");

  const isTooLarge = modelFile?.size && modelFile.size > MAX_MODEL_SIZE_BYTES;

  useEffect(() => {
    if (patternFile || Platform.OS !== "web") {
      return;
    }

    let isActive = true;

    const loadDefaultPattern = async () => {
      try {
        const response = await fetch(DEFAULT_PATTERN_URL);
        if (!response.ok) {
          return;
        }
        const blob = await response.blob();
        if (typeof File === "undefined" || !isActive) {
          return;
        }
        const file = new File([blob], DEFAULT_PATTERN_NAME, {
          type: blob.type || "text/plain",
        });
        setPatternFile(file);
      } catch {
        // Default pattern remains optional if the fetch fails.
      }
    };

    loadDefaultPattern();

    return () => {
      isActive = false;
    };
  }, [patternFile]);

  const pickModel = async () => {
    setError("");
    setWarning("");

    const result = await DocumentPicker.getDocumentAsync({
      type: ["*/*"],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const file = result.assets[0];
    const extension = (file.name || "").split(".").pop()?.toLowerCase();

    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
      setError("Only .glb or .gltf files are allowed");
      return;
    }

    if (file.size && file.size > MAX_MODEL_SIZE_BYTES) {
      setWarning("This file exceeds 10MB and may load slowly in the park.");
    }

    setModelFile(file);
  };

  const pickPattern = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["*/*"],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const file = result.assets[0];
    const extension = (file.name || "").split(".").pop()?.toLowerCase();

    if (extension !== "patt") {
      setError("Pattern file must end with .patt");
      return;
    }

    setPatternFile(file);
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (!modelFile) {
      setError("Please upload a 3D model (.glb or .gltf)");
      return;
    }

    if (isTooLarge) {
      setError("Please upload a model smaller than 10MB");
      return;
    }

    onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      modelFile,
      patternFile,
    });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, styles.row]}>
        <Text style={styles.title}>Upload AR Model</Text>
        <Pressable onPress={onCancel}>
          <X color="#333" />
        </Pressable>
      </View>
      <View style={styles.row}>
        <View style={styles.content}>
          <Text style={styles.label}>Model Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Rafflesia Map"
            placeholderTextColor="#8f8f8f"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, localStyles.textArea]}
            placeholder="Short description for admins"
            placeholderTextColor="#8f8f8f"
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <Text style={styles.label}>3D Model File (.glb/.gltf)</Text>
          <Pressable
            style={({ hovered }) => [
              localStyles.fileButton,
              hovered && localStyles.fileButtonHover,
            ]}
            onPress={pickModel}
          >
            <Upload size={16} />
            <Text>Choose File</Text>
          </Pressable>
          <Text style={localStyles.fileMeta}>
            {modelFile ? modelFile.name : "No file selected"}
          </Text>
          {warning ? <Text style={localStyles.warning}>{warning}</Text> : null}

          <Text style={[styles.label, { marginTop: 16 }]}>Pattern File (.patt)</Text>
          <Pressable
            style={({ hovered }) => [
              localStyles.fileButton,
              hovered && localStyles.fileButtonHover,
            ]}
            onPress={pickPattern}
          >
            <Upload size={16} />
            <Text>Upload Pattern (Optional)</Text>
          </Pressable>
          <Text style={localStyles.fileMeta}>
            {patternFile ? patternFile.name : "No pattern file uploaded"}
          </Text>
          <Text style={localStyles.helpText}>
            Generate a .patt file from the QR marker using the AR.js marker tool.
          </Text>

          {error ? <Text style={localStyles.error}>{error}</Text> : null}
        </View>
      </View>
      <View style={styles.row}>
        <Pressable
          style={({ hovered }) => [
            styles.Btn,
            hovered && localStyles.submitHover,
          ]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text>{isLoading ? "Uploading..." : "Upload"}</Text>
        </Pressable>
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  textArea: {
    minHeight: 90,
  },
  fileButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#f6f8f7",
    borderWidth: 1,
    borderColor: "#d5dfd9",
    marginBottom: 6,
  },
  fileButtonHover: {
    backgroundColor: "#edf3ef",
  },
  fileMeta: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  helpText: {
    fontSize: 12,
    color: "#6b7280",
  },
  warning: {
    color: "#b45309",
    fontSize: 12,
    marginBottom: 8,
  },
  error: {
    color: "#b91c1c",
    marginTop: 10,
    fontSize: 12,
  },
  submitHover: {
    opacity: 0.9,
  },
});

export default ArModelFormContent;
