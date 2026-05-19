import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  Platform,
} from "react-native";
import {
  PlusCircle,
  ExternalLink,
  Download,
  QrCode,
  Trash2,
} from "lucide-react-native";
import QRCode from "qrcode";

import { useArModels } from "../hooks/useArModels";
import ModalLayout from "../components/ModalLayout";
import ArModelFormContent from "../components/ArModelFormContent";
import { formatDate } from "../utils/formatDate";
import apiClient from "../config/apiConfig";

const backendBase = (apiClient.defaults.baseURL || "").replace(/\/api$/, "");
const SFC_LOGO_URL = `${backendBase}/public/ar/sfclogo/SFC_Logo.png`;

const getViewerUrl = (url) => {
  if (!url) {
    return "";
  }

  try {
    const parsed = new URL(url);
    parsed.hostname = "localhost";
    return parsed.toString();
  } catch {
    return url;
  }
};

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const buildMarkerPng = async (viewerUrl) => {
  const qrDataUrl = await QRCode.toDataURL(viewerUrl, {
    errorCorrectionLevel: "H",
    width: 640,
    margin: 1,
  });

  const [qrImg, logoImg] = await Promise.all([
    loadImage(qrDataUrl),
    loadImage(SFC_LOGO_URL).catch(() => null),
  ]);

  const borderSize = 140;
  const size = qrImg.width + borderSize * 2;
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
  ctx.fillRect(borderSize, borderSize, qrImg.width, qrImg.height);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(qrImg, borderSize, borderSize, qrImg.width, qrImg.height);

  if (logoImg) {
    const logoSize = Math.round(qrImg.width * 0.22);
    const logoPadding = 8;
    const centerX = borderSize + qrImg.width / 2;
    const centerY = borderSize + qrImg.height / 2;

    ctx.fillStyle = "#fff";
    ctx.fillRect(
      centerX - logoSize / 2 - logoPadding,
      centerY - logoSize / 2 - logoPadding,
      logoSize + logoPadding * 2,
      logoSize + logoPadding * 2,
    );
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(
      logoImg,
      centerX - logoSize / 2,
      centerY - logoSize / 2,
      logoSize,
      logoSize,
    );
  }

  return canvas.toDataURL("image/png");
};

const AdminArModels = () => {
  const { models, loading, createModel, deleteModel } = useArModels();
  const [modalVisible, setModalVisible] = useState(false);
  const [markerById, setMarkerById] = useState({});
  const [markerLoading, setMarkerLoading] = useState({});
  const { width } = useWindowDimensions();
  const isCompact = width < 700;
  const [markerError, setMarkerError] = useState({});

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
        "There was an issue uploading your model. Check your connection or file size.",
      );
    }
  };

  const handleGenerateMarker = useCallback(async (model) => {
    const viewerUrl = getViewerUrl(model?.ar_viewer_url);
    if (!viewerUrl) {
      return;
    }

    setMarkerLoading((prev) => ({ ...prev, [model.id]: true }));
    setMarkerError((prev) => ({ ...prev, [model.id]: false }));
    try {
      const marker = await buildMarkerPng(viewerUrl);
      setMarkerById((prev) => ({ ...prev, [model.id]: marker }));
    } catch (error) {
      console.error("Marker generation failed", error);
      setMarkerError((prev) => ({ ...prev, [model.id]: true }));
    } finally {
      setMarkerLoading((prev) => ({ ...prev, [model.id]: false }));
    }
  }, []);

  useEffect(() => {
    models.forEach((model) => {
      if (
        model?.id &&
        model.ar_viewer_url &&
        !markerById[model.id] &&
        !markerLoading[model.id] &&
        !markerError[model.id]
      ) {
        handleGenerateMarker(model);
      }
    });
  }, [handleGenerateMarker, markerById, markerError, markerLoading, models]);

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
    const viewerUrl = getViewerUrl(url);
    if (viewerUrl) {
      window.open(viewerUrl, "_blank");
    }
  };

  const handleDelete = (model) => {
    const executeDelete = async () => {
      const success = await deleteModel(model.id);
      if (!success) {
        if (Platform.OS === "web") {
          window.alert("Failed to delete the model. Please try again.");
        } else {
          Alert.alert("Error", "Failed to delete the model. Please try again.");
        }
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm(`Are you sure you want to delete "${model.title}"?`)) {
        executeDelete();
      }
    } else {
      Alert.alert(
        "Delete Model",
        `Are you sure you want to delete "${model.title}"?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: executeDelete },
        ],
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, isCompact && styles.headerCompact]}>
        <View>
          <Text style={styles.subtitle}>
            Manage AR-ready models and markers.
          </Text>
          <Text style={styles.title}>AR Model Library</Text>
        </View>
        <Pressable
          onPress={handleAdd}
          style={({ hovered }) => [
            styles.addButton,
            hovered && styles.addHover,
          ]}
        >
          <PlusCircle size={18} color="#fff" />
          <Text style={styles.addButtonText}>Upload Model</Text>
        </Pressable>
      </View>

      <ModalLayout
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      >
        <ArModelFormContent
          onSubmit={handleFormSubmit}
          onCancel={() => setModalVisible(false)}
          isLoading={loading}
        />
      </ModalLayout>

      {loading && models.length === 0 ? (
        <ActivityIndicator
          size="large"
          color="#18704d"
          style={{ marginTop: 40 }}
        />
      ) : (
        <View style={styles.cards}>
          {models.length === 0 ? (
            <Text style={styles.empty}>No AR models uploaded yet.</Text>
          ) : (
            models.map((model) => {
              const marker = markerById[model.id];
              const isMarkerLoading = markerLoading[model.id];
              const hasMarkerError = markerError[model.id];
              const viewerUrl = getViewerUrl(model.ar_viewer_url);
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
                    Format: {model.model_format.toUpperCase()} | Size: {sizeMb}{" "}
                    MB
                  </Text>
                  <Text style={styles.cardDetail}>
                    Pattern: {model.pattern_url ? "Uploaded" : "Missing"}
                  </Text>

                  <View style={styles.actions}>
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

                    <Pressable
                      style={({ hovered }) => [
                        styles.actionButton,
                        hovered && styles.actionHover,
                        !marker && styles.disabledButton,
                      ]}
                      onPress={() => downloadMarker(model.id)}
                      disabled={!marker}
                    >
                      <Download
                        size={16}
                        color={marker ? "#4b5563" : "#9ca3af"}
                      />
                      <Text
                        style={[
                          styles.actionText,
                          !marker && styles.disabledText,
                        ]}
                      >
                        Download PNG
                      </Text>
                    </Pressable>

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

                  {viewerUrl ? (
                    <Text style={styles.viewerUrl} selectable>
                      Viewer link: {viewerUrl}
                    </Text>
                  ) : null}

                  {marker ? (
                    <View style={styles.markerPreview}>
                      <Image
                        source={{ uri: marker }}
                        style={styles.markerImage}
                        accessibilityLabel={`QR marker for ${model.title}`}
                      />
                    </View>
                  ) : isMarkerLoading ? (
                    <View style={styles.markerStatus}>
                      <QrCode size={16} color="#6b7280" />
                      <Text style={styles.markerStatusText}>
                        Generating QR marker...
                      </Text>
                    </View>
                  ) : hasMarkerError ? (
                    <Text style={styles.markerError}>
                      QR marker could not be generated.
                    </Text>
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
  headerCompact: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 12,
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
  viewerUrl: {
    color: "#2563eb",
    fontSize: 12,
    marginTop: 10,
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
  markerStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },
  markerStatusText: {
    color: "#6b7280",
    fontSize: 13,
  },
  markerError: {
    color: "#dc2626",
    fontSize: 13,
    marginTop: 16,
  },
  empty: {
    textAlign: "center",
    color: "#6b7280",
    marginTop: 40,
  },
});

export default AdminArModels;
