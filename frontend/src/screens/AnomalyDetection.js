import {
  ArrowUpNarrowWide,
  ArrowDownWideNarrow,
  Search,
  RotateCcw,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  AlertTriangle,
  Circle,
  MapPin,
} from "lucide-react-native";
import React, { useState, useEffect } from "react";
import {
  Pressable,
  StyleSheet,
  FlatList,
  View,
  Text,
  TextInput,
  ActivityIndicator,
  Modal,
} from "react-native";

import { useAnomalyDetection } from "../hooks/useAnomalyDetection";
import { formatDate } from "../utils/formatDate";

const AnomalyDetection = () => {
  const {
    anomalies,
    currentPage,
    setCurrentPage,
    totalPages,
    totalAnomalies,
    searchQuery,
    handleSearch,
    sortConfig,
    requestSort,
    resetSort,
    loading,
    error,
    refresh,
  } = useAnomalyDetection();

  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);

  // Calculate pagination info
  const itemsPerPage = 10;
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const indexOfLastItem = indexOfFirstItem + anomalies.length;

  // Get severity badge color
  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "high":
        return "#dc2626";
      case "medium":
        return "#f59e0b";
      case "low":
        return "#10b981";
      default:
        return "#6b7280";
    }
  };

  // Get event type label
  const getEventTypeLabel = (eventType) => {
    const typeMap = {
      touching_plant: "Touching Plant",
      touching_animal: "Touching Animal",
      plucking_plants: "Plucking Plants",
      hitting_animal: "Hitting Animal",
      extended_plant_touch: "Extended Plant Touch",
      extended_animal_touch: "Extended Animal Touch",
      forest_fire: "Forest Fire",
      other: "Other",
    };
    return typeMap[eventType?.toLowerCase()] || eventType;
  };

  // Get event type severity
  const getEventTypeSeverity = (eventType) => {
    const severityMap = {
      touching_plant: "low",
      touching_animal: "low",
      plucking_plants: "medium",
      hitting_animal: "medium",
      extended_plant_touch: "medium",
      extended_animal_touch: "medium",
      forest_fire: "high",
      other: "medium",
    };
    return severityMap[eventType?.toLowerCase()] || "medium";
  };

  const renderHeader = () => (
    <View style={[styles.tableHeader, styles.row]}>
      <Text style={[styles.headerRow, { flex: 0.8, textAlign: "center" }]}>
        <Text style={styles.headerText}>ID</Text>
      </Text>
      <Pressable
        onPress={() => requestSort("event_type")}
        style={[styles.headerRow, { flex: 2 }]}
      >
        <Text style={styles.headerText}>Event Type</Text>
        {sortConfig.key === "event_type" && sortConfig.direction === "asc" ? (
          <ArrowUpNarrowWide size={14} color="white" />
        ) : (
          <ArrowDownWideNarrow size={14} color="white" />
        )}
      </Pressable>
      <Pressable
        onPress={() => requestSort("coordinates")}
        style={[styles.headerRow, { flex: 2.5 }]}
      >
        <Text style={styles.headerText}>Coordinates</Text>
        {sortConfig.key === "coordinates" && sortConfig.direction === "asc" ? (
          <ArrowUpNarrowWide size={14} color="white" />
        ) : (
          <ArrowDownWideNarrow size={14} color="white" />
        )}
      </Pressable>
      <Pressable
        onPress={() => requestSort("created_at")}
        style={[styles.headerRow, { flex: 1.8 }]}
      >
        <Text style={styles.headerText}>Detected At</Text>
        {sortConfig.key === "created_at" && sortConfig.direction === "asc" ? (
          <ArrowUpNarrowWide size={14} color="white" />
        ) : (
          <ArrowDownWideNarrow size={14} color="white" />
        )}
      </Pressable>
      <Text style={[styles.headerRow, { flex: 0.8, textAlign: "center" }]}>
        <Text style={styles.headerText}>User</Text>
      </Text>
    </View>
  );

  const renderAnomalyItem = ({ item }) => (
    <Pressable
      onPress={() => setSelectedAnomaly(item)}
      style={({ hovered }) => [
        styles.row,
        styles.tableRow,
        hovered && { backgroundColor: "#f9f9f9" },
        selectedAnomaly?.id === item.id && { backgroundColor: "#fff8e1" },
      ]}
    >
      {/* ID */}
      <Text style={{ flex: 0.8, textAlign: "center", fontWeight: "600" }}>
        {item.id}
      </Text>

      {/* Event Type */}
      <Text style={{ flex: 2 }}>{getEventTypeLabel(item.event_type)}</Text>


      {/* Description */}
      <Pressable 
        style={{ flex: 2.5, paddingHorizontal: 5 }}
        onPress={() => {
          if (item.latitude && item.longitude) {
            setSelectedAnomaly(item);
            setShowMapModal(true);
          }
        }}
      >
        {item.latitude && item.longitude ? (
          <View style={styles.coordinateContainer}>
            <MapPin size={14} color="#217837" />
            <Text style={styles.coordinateText}>
              {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
            </Text>
          </View>
        ) : (
          <Text style={{ color: "#999" }}>—</Text>
        )}
      </Pressable>

      {/* Detected At */}
      <Text style={{ flex: 1.8, color: "#666" }}>
        {formatDate(item.created_at)}
      </Text>

      {/* User ID */}
      <Text style={{ flex: 0.8, textAlign: "center" }}>
        {item.user_id || "—"}
      </Text>
    </Pressable>
  );

  const renderPagination = () => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }

    return (
      <View style={[styles.paginationContainer, styles.row]}>
        <Text style={styles.pageInfo}>
          Showing {anomalies.length > 0 ? indexOfFirstItem + 1 : 0} to{" "}
          {indexOfLastItem} of {totalAnomalies} anomalies
        </Text>
        <View style={styles.row}>
          <Pressable
            disabled={currentPage === 1}
            onPress={() => setCurrentPage(1)}
            style={[styles.pageBtn, currentPage === 1 && styles.btnDisabled]}
          >
            <Text
              style={[
                currentPage === 1 ? styles.disabledText : styles.pageBtnText,
                styles.arrowBtn,
              ]}
            >
              <ChevronsLeft size={20} />
            </Text>
          </Pressable>
          <Pressable
            disabled={currentPage === 1}
            onPress={() => setCurrentPage((prev) => prev - 1)}
            style={[styles.pageBtn, currentPage === 1 && styles.btnDisabled]}
          >
            <Text
              style={[
                currentPage === 1 ? styles.disabledText : styles.pageBtnText,
                styles.arrowBtn,
              ]}
            >
              <ChevronLeft size={20} />
            </Text>
          </Pressable>
          {pageNumbers.map((number) => (
            <Pressable
              key={number}
              onPress={() => setCurrentPage(number)}
              style={[
                styles.pageBtn,
                currentPage === number && styles.activePageBtn,
              ]}
            >
              <Text
                style={[
                  styles.pageBtnText,
                  currentPage === number && { color: "white" },
                ]}
              >
                {number}
              </Text>
            </Pressable>
          ))}
          <Pressable
            disabled={currentPage === totalPages}
            onPress={() => setCurrentPage((prev) => prev + 1)}
            style={[
              styles.pageBtn,
              currentPage === totalPages && styles.btnDisabled,
            ]}
          >
            <Text
              style={[
                currentPage === totalPages
                  ? styles.disabledText
                  : styles.pageBtnText,
                styles.arrowBtn,
              ]}
            >
              <ChevronRight size={20} />
            </Text>
          </Pressable>
          <Pressable
            disabled={currentPage === totalPages}
            onPress={() => setCurrentPage(totalPages)}
            style={[
              styles.pageBtn,
              currentPage === totalPages && styles.btnDisabled,
            ]}
          >
            <Text
              style={[
                currentPage === totalPages
                  ? styles.disabledText
                  : styles.pageBtnText,
                styles.arrowBtn,
              ]}
            >
              <ChevronsRight size={20} />
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderMapModal = () => {
    if (!selectedAnomaly?.latitude || !selectedAnomaly?.longitude) {
      return null;
    }

    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${(
      selectedAnomaly.longitude - 0.01
    ).toFixed(4)},${(selectedAnomaly.latitude - 0.01).toFixed(
      4
    )},${(selectedAnomaly.longitude + 0.01).toFixed(
      4
    )},${(selectedAnomaly.latitude + 0.01).toFixed(
      4
    )}&layer=mapnik&marker=${selectedAnomaly.latitude.toFixed(
      4
    )},${selectedAnomaly.longitude.toFixed(4)}`;

    return (
      <Modal
        visible={showMapModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMapModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowMapModal(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.mapContainer}>
              <View style={styles.mapHeader}>
                <Text style={styles.mapTitle}>
                  {getEventTypeLabel(selectedAnomaly.event_type)}
                </Text>
                <Pressable onPress={() => setShowMapModal(false)}>
                  <Text style={styles.mapCloseBtn}>✕</Text>
                </Pressable>
              </View>
              <iframe
                title="anomaly-map"
                style={styles.iframe}
                src={mapUrl}
                frameBorder="0"
                marginHeight="0"
                marginWidth="0"
                scrolling="no"
              />
              <View style={styles.mapFooter}>
                <View style={styles.coordinateInfo}>
                  <MapPin size={16} color="#059669" />
                  <Text style={styles.coordinateLabel}>
                    {selectedAnomaly.latitude.toFixed(6)},{" "}
                    {selectedAnomaly.longitude.toFixed(6)}
                  </Text>
                </View>
                <Text style={styles.mapTimestamp}>
                  {formatDate(selectedAnomaly.created_at)}
                </Text>
              </View>
            </View>
          </View>
        </Pressable>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Anomaly Detection</Text>

      <View style={[styles.toolbar, styles.row]}>
        <View style={styles.row}>
          <Pressable
            onPress={resetSort}
            style={({ hovered }) => [
              styles.iconBtn,
              hovered && styles.iconBtnHover,
            ]}
          >
            <RotateCcw size={20} />
          </Pressable>
          <View style={[styles.search, styles.row]}>
            <Search size={18} />
            <TextInput
              style={styles.input}
              placeholder="Search anomalies..."
              placeholderTextColor="#8f8f8f"
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0a6340" />
          <Text style={styles.loadingText}>Loading anomalies...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <AlertTriangle size={48} color="#dc2626" />
          <Text style={styles.errorText}>Failed to load anomalies</Text>
          <Text style={styles.errorDetail}>{error}</Text>
          <Pressable
            onPress={refresh}
            style={({ hovered }) => [
              styles.retryBtn,
              hovered && styles.retryBtnHover,
            ]}
          >
            <Text style={styles.retryBtnText}>Try Again</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.tableContainer}>
            <FlatList
              style={styles.table}
              data={anomalies}
              ListHeaderComponent={renderHeader}
              renderItem={renderAnomalyItem}
              keyExtractor={(item) => item.id.toString()}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <AlertTriangle size={48} color="#d1d5db" />
                  <Text style={styles.emptyText}>No anomalies detected</Text>
                </View>
              }
            />
          </View>
          {totalPages > 1 ? renderPagination() : null}
        </>
      )}

      {renderMapModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 25,
    fontWeight: 500,
    marginBottom: 20,
  },
  toolbar: {
    justifyContent: "space-between",
    marginVertical: 20,
    zIndex: 500,
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
  },
  iconBtn: {
    alignSelf: "center",
    padding: 8,
    marginRight: 20,
    color: "#217837",
    borderRadius: 50,
    backgroundColor: "white",
  },
  iconBtnHover: {
    backgroundColor: "#217837",
    color: "white",
  },
  search: {
    gap: 7,
    borderWidth: 1,
    borderColor: "#8f8f8f",
    minWidth: 300,
    padding: 5,
    backgroundColor: "white",
    borderRadius: 15,
    alignItems: "center",
    maxHeight: 35,
    alignSelf: "center",
  },
  input: {
    flex: 1,
    paddingVertical: 2,
    outlineStyle: "none",
  },
  tableContainer: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 0,
  },
  table: {
    backgroundColor: "white",
  },
  tableHeader: {
    backgroundColor: "#0a6340",
    paddingVertical: 8,
    userSelect: "none",
  },
  headerText: {
    color: "white",
    alignSelf: "center",
    fontWeight: 500,
    fontSize: 13,
  },
  headerRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  tableRow: {
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#8f8f8f84",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  badge: {
    gap: 8,
    alignItems: "center",
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: "#9ca3af",
    fontWeight: "500",
  },
  paginationContainer: {
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#8f8f8f84",
  },
  pageInfo: {
    color: "#666",
    fontSize: 14,
  },
  pageBtn: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  pageBtnText: {
    color: "#ecaa25",
    fontWeight: "600",
  },
  btnDisabled: {
    backgroundColor: "#f0f0f0",
    borderColor: "#eee",
  },
  disabledText: {
    color: "#bbb",
  },
  arrowBtn: {
    paddingTop: 2,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#dc2626",
  },
  errorDetail: {
    marginTop: 8,
    fontSize: 13,
    color: "#9ca3af",
    textAlign: "center",
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#0a6340",
    borderRadius: 6,
  },
  retryBtnHover: {
    backgroundColor: "#065f2e",
  },
  retryBtnText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  activePageBtn: {
    backgroundColor: "#ffc758",
    borderWidth: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
  },
  coordinateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#f0fdf4",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  coordinateText: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "500",
    fontFamily: "monospace",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    width: "90%",
    maxWidth: 900,
    maxHeight: "90%",
  },
  mapContainer: {
    width: "100%",
    height: 600,
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  mapHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  mapCloseBtn: {
    fontSize: 24,
    color: "#6b7280",
    cursor: "pointer",
    width: 32,
    height: 32,
    textAlign: "center",
    lineHeight: 32,
  },
  iframe: {
    flex: 1,
    width: "100%",
    border: "none",
  },
  mapFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  coordinateInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  coordinateLabel: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "500",
    fontFamily: "monospace",
  },
  mapTimestamp: {
    fontSize: 12,
    color: "#6b7280",
  },
});

export default AnomalyDetection;
