import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { PlusCircle, ExternalLink, Download, QrCode, Trash2 } from "lucide-react-native";
import QRCode from "qrcode";

import { useArModels } from "../hooks/useArModels";
import ModalLayout from "../components/ModalLayout";
import ArModelFormContent from "../components/ArModelFormContent";
import { formatDate } from "../utils/formatDate";

const buildMarkerPng = async (viewerUrl) => {
  const qrDataUrl = await QRCode.toDataURL(viewerUrl, {
    errorCorrectionLevel: "H",
    width: 640,
    margin: 1,
  });

  const img = await new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = qrDataUrl;
  });

  const borderSize = 140;
  const size = img.width + borderSize * 2;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas is not available");
  }

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#fff";
  ctx.fillRect(borderSize, borderSize, img.width, img.height);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, borderSize, borderSize, img.width, img.height);

  return canvas.toDataURL("image/png");
};

const AdminArModels = () => {
  const { models, loading, createModel, deleteModel } = useArModels();
  const [modalVisible, setModalVisible] = useState(false);
  const [markerById, setMarkerById] = useState({});
  const [markerLoading, setMarkerLoading] = useState({});

  const handleAdd = () => {
    setModalVisible(true);
  };

  const handleFormSubmit = async (payload) => {
    const success = await createModel(payload);
    if (success) {
      setModalVisible(false);
    } else {
      Alert.alert(
        "Upload Failed",
        "There was an issue uploading your model. Check your connection or file size."
      );
    }
  };

  const handleGenerateMarker = async (model) => {
    if (!model?.ar_viewer_url) {
      return;
    }

    setMarkerLoading((prev) => ({ ...prev, [model.id]: true }));
    try {
      const marker = await buildMarkerPng(model.ar_viewer_url);
      setMarkerById((prev) => ({ ...prev, [model.id]: marker }));
    } catch (error) {
      console.error("Marker generation failed", error);
    } finally {
      setMarkerLoading((prev) => ({ ...prev, [model.id]: false }));
    }
  };

  const downloadMarker = (modelId) => {
    const marker = markerById[modelId];
    if (!marker) {
      return;
    }

    const link = document.createElement("a");
    link.href = marker;
    link.download = `ar-marker-${modelId}.png`;
    link.click();
  };

  const openViewer = (url) => {
    if (url) {
      window.open(url, "_blank");
    }
  };

  const handleDelete = (model) => {
    Alert.alert(
      "Delete Model",
      `Are you sure you want to delete "${model.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const success = await deleteModel(model.id);
            if (!success) {
              Alert.alert("Error", "Failed to delete the model. Please try again.");
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.subtitle}>Manage AR-ready models and markers.</Text>
          <Text style={styles.title}>AR Model Library</Text>
        </View>
        <Pressable
          onPress={handleAdd}
          style={({ hovered }) => [styles.addButton, hovered && styles.addHover]}
        >
          <PlusCircle size={18} color="#fff" />
          <Text style={styles.addButtonText}>Upload Model</Text>
        </Pressable>
      </View>

      <ModalLayout visible={modalVisible} onClose={() => setModalVisible(false)}>
        <ArModelFormContent
          onSubmit={handleFormSubmit}
          onCancel={() => setModalVisible(false)}
          isLoading={loading}
        />
      </ModalLayout>

      {loading && models.length === 0 ? (
        <ActivityIndicator size="large" color="#18704d" style={{ marginTop: 40 }} />
      ) : (
        <View style={styles.cards}>
          {models.length === 0 ? (
            <Text style={styles.empty}>No AR models uploaded yet.</Text>
          ) : (
            models.map((model) => {
              const marker = markerById[model.id];
              const isMarkerLoading = markerLoading[model.id];
              const sizeMb = model.model_size_bytes
                ? (model.model_size_bytes / (1024 * 1024)).toFixed(2)
                : "0";

              return (
                <View key={model.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{model.title}</Text>
                    <Text style={styles.cardMeta}>
                      Uploaded {formatDate(model.created_at, false)}
                    </Text>
                  </View>
                  <Text style={styles.cardDetail}>
                    Format: {model.model_format.toUpperCase()} | Size: {sizeMb} MB
                  </Text>
                  <Text style={styles.cardDetail}>
                    Pattern: {model.pattern_url ? "Uploaded" : "Missing"}
                  </Text>
                  
                  <View style={styles.actions}>
                    {/* 1. Generate Marker Button */}
                    <Pressable
                      style={({ hovered }) => [
                        styles.actionButton,
                        hovered && styles.actionHover,
                      ]}
                      onPress={() => handleGenerateMarker(model)}
                    >
                      <QrCode size={16} color="#4b5563" />
                      <Text style={styles.actionText}>
                        {isMarkerLoading ? "Generating..." : "Generate Marker"}
                      </Text>
                    </Pressable>

                    {/* 2. Open Viewer Button */}
                    <Pressable
                      style={({ hovered }) => [
                        styles.actionButton,
                        hovered && styles.actionHover,
                      ]}
                      onPress={() => openViewer(model.ar_viewer_url)}
                    >
                      <ExternalLink size={16} color="#4b5563" />
                      <Text style={styles.actionText}>Open Viewer</Text>
                    </Pressable>

                    {/* 3. Download PNG Button */}
                    <Pressable
                      style={({ hovered }) => [
                        styles.actionButton,
                        hovered && styles.actionHover,
                        !marker && styles.disabledButton,
                      ]}
                      onPress={() => downloadMarker(model.id)}
                      disabled={!marker}
                    >
                      <Download size={16} color={marker ? "#4b5563" : "#9ca3af"} />
                      <Text style={[styles.actionText, !marker && styles.disabledText]}>Download PNG</Text>
                    </Pressable>

                    {/* 4. Delete Button */}
                    <Pressable
                      style={({ hovered }) => [
                        styles.actionButton,
                        styles.deleteButton,
                        hovered && styles.deleteHover,
                      ]}
                      onPress={() => handleDelete(model)}
                    >
                      <Trash2 size={16} color="#dc2626" />
                      <Text style={styles.deleteText}>Delete</Text>
                    </Pressable>
                  </View>

                  {marker ? (
                    <View style={styles.markerPreview}>
                      <Image
                        source={{ uri: marker }}
                        style={styles.markerImage}
                        accessibilityLabel={`QR marker for ${model.title}`}
                      />
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    color: "#4b5563",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#18704d",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  addButtonText: {
    color: "#fff",
  },
  addHover: {
    backgroundColor: "#14583c",
  },
  cards: {
    gap: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  cardMeta: {
    color: "#6b7280",
    fontSize: 12,
  },
  cardDetail: {
    color: "#4b5563",
    fontSize: 13,
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionText: {
    color: "#4b5563",
  },
  actionHover: {
    backgroundColor: "#e5e7eb",
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: "#9ca3af",
  },
  deleteButton: {
    backgroundColor: "#fef2f2",
    borderColor: "#fca5a5",
    borderWidth: 1,
  },
  deleteHover: {
    backgroundColor: "#fee2e2",
  },
  deleteText: {
    color: "#dc2626",
  },
  markerPreview: {
    marginTop: 16,
    alignItems: "flex-start",
  },
  markerImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  empty: {
    textAlign: "center",
    color: "#6b7280",
    marginTop: 40,
  },
});

export default AdminArModels;