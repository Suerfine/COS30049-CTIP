import {
  AlertTriangle,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Circle,
  MapPin,
  RotateCcw,
  Search,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useTranslation } from "react-i18next";

import { useAnomalyDetection } from "../hooks/useAnomalyDetection";
import { sensorService } from "../services/SensorService";
import { formatDate } from "../utils/formatDate";

const PAGE_SIZE = 10;
const TABS = {
  ANOMALIES: "anomalies",
  SENSORS: "sensors",
};

const STATUS_STYLES = {
  normal: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    color: "#059669",
  },
  alerting: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    color: "#dc2626",
  },
  maintenance: {
    backgroundColor: "#fffbeb",
    borderColor: "#fde68a",
    color: "#d97706",
  },
  deactivated: {
    backgroundColor: "#f3f4f6",
    borderColor: "#d1d5db",
    color: "#6b7280",
  },
  default: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
    color: "#2563eb",
  },
};

const emptyPaginatedState = {
  data: [],
  page: 1,
  size: PAGE_SIZE,
  totalElements: 0,
  totalPages: 1,
};

const normalizePaginatedResponse = (response) => {
  const data = Array.isArray(response?.data) ? response.data : [];

  return {
    data,
    page: response?.page ?? 1,
    size: response?.size ?? PAGE_SIZE,
    totalElements: response?.totalElements ?? data.length,
    totalPages: response?.totalPages ?? 1,
  };
};

const extractErrorMessage = (error, fallbackMessage) =>
  error?.response?.data?.message || error?.message || fallbackMessage;

const formatCoordinates = (sensor) => {
  if (
    sensor?.latitude === null ||
    sensor?.latitude === undefined ||
    sensor?.longitude === null ||
    sensor?.longitude === undefined
  ) {
    return "-";
  }

  return `${Number(sensor.latitude).toFixed(4)}, ${Number(sensor.longitude).toFixed(4)}`;
};

const formatStatusLabel = (value) => {
  if (!value) {
    return "Unknown";
  }

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const formatLogData = (value) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  let output;
  if (typeof value === "string") {
    output = value;
  } else {
    try {
      output = JSON.stringify(value);
    } catch {
      output = String(value);
    }
  }

  return output.length > 110 ? `${output.slice(0, 107)}...` : output;
};

const getStatusStyle = (status) => {
  const key = String(status || "").toLowerCase();
  return STATUS_STYLES[key] || STATUS_STYLES.default;
};

const getEventTypeLabel = (eventType, t) => {
  const typeMap = {
    touching_plant: t("touch_plant"),
    touching_animal: t("touch_animal"),
    plucking_plants: t("plucking_plant"),
    hitting_animal: t("animal_strike"),
    extended_plant_touch: t("extended_touch_plant"),
    extended_animal_touch: t("extended_touch_animal"),
    forest_fire: t("forest_fire"),
    other: t("other"),
  };

  return typeMap[eventType?.toLowerCase()] || eventType || "-";
};

const PaginatedTableControls = ({
  page,
  totalPages,
  totalElements,
  size,
  onPageChange,
  itemLabel,
}) => {
  if (totalPages <= 1) {
    return null;
  }
  const { t } = useTranslation();
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i += 1) {
    pageNumbers.push(i);
  }

  const firstItem = totalElements === 0 ? 0 : (page - 1) * size + 1;
  const lastItem =
    totalElements === 0 ? 0 : Math.min(totalElements, page * size);

  return (
    <View style={[styles.paginationContainer, styles.row]}>
      <Text style={styles.pageInfo}>
        {t("showing")} {firstItem} {t("to")} {lastItem} {t("of")} {totalElements} {itemLabel}
      </Text>
      <View style={styles.row}>
        <Pressable
          disabled={page === 1}
          onPress={() => onPageChange(1)}
          style={[styles.pageBtn, page === 1 && styles.btnDisabled]}
        >
          <Text
            style={[
              page === 1 ? styles.disabledText : styles.pageBtnText,
              styles.arrowBtn,
            ]}
          >
            <ChevronsLeft size={20} />
          </Text>
        </Pressable>
        <Pressable
          disabled={page === 1}
          onPress={() => onPageChange(page - 1)}
          style={[styles.pageBtn, page === 1 && styles.btnDisabled]}
        >
          <Text
            style={[
              page === 1 ? styles.disabledText : styles.pageBtnText,
              styles.arrowBtn,
            ]}
          >
            <ChevronLeft size={20} />
          </Text>
        </Pressable>
        {pageNumbers.map((number) => (
          <Pressable
            key={number}
            onPress={() => onPageChange(number)}
            style={[styles.pageBtn, page === number && styles.activePageBtn]}
          >
            <Text
              style={[
                styles.pageBtnText,
                page === number && { color: "white" },
              ]}
            >
              {number}
            </Text>
          </Pressable>
        ))}
        <Pressable
          disabled={page === totalPages}
          onPress={() => onPageChange(page + 1)}
          style={[styles.pageBtn, page === totalPages && styles.btnDisabled]}
        >
          <Text
            style={[
              page === totalPages ? styles.disabledText : styles.pageBtnText,
              styles.arrowBtn,
            ]}
          >
            <ChevronRight size={20} />
          </Text>
        </Pressable>
        <Pressable
          disabled={page === totalPages}
          onPress={() => onPageChange(totalPages)}
          style={[styles.pageBtn, page === totalPages && styles.btnDisabled]}
        >
          <Text
            style={[
              page === totalPages ? styles.disabledText : styles.pageBtnText,
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

const StatusBadge = ({ value }) => {
  const style = getStatusStyle(value);

  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor: style.backgroundColor,
          borderColor: style.borderColor,
        },
      ]}
    >
      <View style={[styles.statusDot, { backgroundColor: style.color }]} />
      <Text style={[styles.statusBadgeText, { color: style.color }]}>
        {formatStatusLabel(value)}
      </Text>
    </View>
  );
};

const AnomalyDetection = () => {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const isCompact = width < 700;

  const [activeTab, setActiveTab] = useState(TABS.ANOMALIES);
  const [sensorsPage, setSensorsPage] = useState(1);
  const [sensorState, setSensorState] = useState(emptyPaginatedState);
  const [sensorLoading, setSensorLoading] = useState(true);
  const [sensorError, setSensorError] = useState(null);
  const [selectedSensorForLogs, setSelectedSensorForLogs] = useState(null);
  const [showSensorLogsModal, setShowSensorLogsModal] = useState(false);
  const [sensorLogsPage, setSensorLogsPage] = useState(1);
  const [sensorLogsState, setSensorLogsState] = useState(emptyPaginatedState);
  const [sensorLogsLoading, setSensorLogsLoading] = useState(false);
  const [sensorLogsError, setSensorLogsError] = useState(null);

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
    resolveAnomaly,
  } = useAnomalyDetection();

  const [resolvingId, setResolvingId] = useState(null);
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);

  const loadSensors = useCallback(async () => {
    setSensorLoading(true);
    setSensorError(null);

    try {
      const response = await sensorService.getAll({
        page: sensorsPage,
        size: PAGE_SIZE,
        orderBy: "id asc",
      });
      setSensorState(normalizePaginatedResponse(response));
    } catch (loadError) {
      setSensorError(extractErrorMessage(loadError, "Unable to load sensors"));
      setSensorState(emptyPaginatedState);
    } finally {
      setSensorLoading(false);
    }
  }, [sensorsPage]);

  const loadSensorLogs = useCallback(async (sensorId, page) => {
    if (!sensorId) {
      return;
    }

    setSensorLogsLoading(true);
    setSensorLogsError(null);

    try {
      const response = await sensorService.getLogsBySensor(sensorId, {
        page,
        size: PAGE_SIZE,
        orderBy: "created_at desc",
      });
      setSensorLogsState(normalizePaginatedResponse(response));
    } catch (loadError) {
      setSensorLogsError(
        extractErrorMessage(loadError, "Unable to load sensor logs"),
      );
      setSensorLogsState(emptyPaginatedState);
    } finally {
      setSensorLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSensors();
  }, [loadSensors]);

  useEffect(() => {
    if (!showSensorLogsModal || !selectedSensorForLogs?.id) {
      return;
    }

    loadSensorLogs(selectedSensorForLogs.id, sensorLogsPage);
  }, [
    showSensorLogsModal,
    selectedSensorForLogs,
    sensorLogsPage,
    loadSensorLogs,
  ]);

  const refreshActiveTab = () => {
    if (activeTab === TABS.ANOMALIES) {
      refresh();
      return;
    }

    if (activeTab === TABS.SENSORS) {
      loadSensors();
      return;
    }
  };

  const openSensorLogsModal = (sensor) => {
    setSelectedSensorForLogs(sensor);
    setSensorLogsPage(1);
    setSensorLogsState(emptyPaginatedState);
    setSensorLogsError(null);
    setShowSensorLogsModal(true);
  };

  const closeSensorLogsModal = () => {
    setShowSensorLogsModal(false);
    setSelectedSensorForLogs(null);
    setSensorLogsPage(1);
    setSensorLogsState(emptyPaginatedState);
    setSensorLogsError(null);
  };

  const renderTabButton = (tabKey, title, subtitle) => {
    const isActive = activeTab === tabKey;

    return (
      <Pressable
        onPress={() => setActiveTab(tabKey)}
        style={({ hovered }) => [
          styles.tabButton,
          isActive && styles.tabButtonActive,
          hovered && styles.tabButtonHover,
        ]}
      >
        <Text style={[styles.tabTitle, isActive && styles.tabTitleActive]}>
          {title}
        </Text>
        <Text
          style={[styles.tabSubtitle, isActive && styles.tabSubtitleActive]}
        >
          {subtitle}
        </Text>
      </Pressable>
    );
  };

  const renderSensorHeader = () => (
    <View style={[styles.tableHeader, styles.row]}>
      <Text style={[styles.headerCell, styles.sensorIdCell]}>{t("id")}</Text>
      <Text style={[styles.headerCell, styles.sensorNameCell]}>{t("name")}</Text>
      <Text style={[styles.headerCell, styles.sensorTypeCell]}>{t("type")}</Text>
      <Text style={[styles.headerCell, styles.sensorLocationCell]}>
        {t("location")}
      </Text>
      <Text style={[styles.headerCell, styles.sensorStatusCell]}>{t("status_label")}</Text>
    </View>
  );

  const renderSensorItem = ({ item }) => (
    <Pressable
      onPress={() => openSensorLogsModal(item)}
      style={({ hovered }) => [
        styles.row,
        styles.tableRow,
        styles.sensorRowPressable,
        hovered && styles.sensorRowHover,
      ]}
    >
      <Text style={[styles.cellText, styles.sensorIdCell]}>{item.id}</Text>
      <Text style={[styles.cellText, styles.sensorNameCell]}>
        {item.name || "-"}
      </Text>
      <Text style={[styles.cellText, styles.sensorTypeCell]}>
        {item.type || "-"}
      </Text>
      <View style={[styles.cellContent, styles.sensorLocationCell]}>
        <MapPin size={14} color="#059669" />
        <Text style={styles.coordinateText}>{formatCoordinates(item)}</Text>
      </View>
      <View style={[styles.cellContent, styles.sensorStatusCell]}>
        <StatusBadge value={item.current_status} />
      </View>
    </Pressable>
  );

  const renderSensorLogsHeader = () => (
    <View style={[styles.tableHeader, styles.row]}>
      <Text style={[styles.headerCell, styles.logIdCell]}>{t("id")}</Text>
      <Text style={[styles.headerCell, styles.logStatusCell]}>{t("status_label")}</Text>
      <Text style={[styles.headerCell, styles.logDataCell]}>{t("data")}</Text>
      <Text style={[styles.headerCell, styles.logDateCell]}>{t("created_at")}</Text>
    </View>
  );

  const renderSensorLogItem = ({ item }) => (
    <View style={[styles.row, styles.tableRow]}>
      <Text style={[styles.cellText, styles.logIdCell]}>{item.id}</Text>
      <View style={[styles.cellContent, styles.logStatusCell]}>
        <StatusBadge value={item.status} />
      </View>
      <Text style={[styles.cellText, styles.logDataCell]} numberOfLines={2}>
        {formatLogData(item.data)}
      </Text>
      <Text style={[styles.cellText, styles.logDateCell]}>
        {formatDate(item.created_at)}
      </Text>
    </View>
  );

  const renderAnomalyHeader = () => (
    <View style={[styles.tableHeader, styles.row]}>
      <Text style={[styles.headerCell, styles.anomalyIdCell]}>{t("id")}</Text>
      <Pressable
        onPress={() => requestSort("event_type")}
        style={[styles.headerPressableCell, styles.anomalyTypeCell]}
      >
        <Text style={styles.headerCell}>{t("event_type")}</Text>
        {sortConfig.key === "event_type" && sortConfig.direction === "asc" ? (
          <ArrowUpNarrowWide size={14} color="white" />
        ) : (
          <ArrowDownWideNarrow size={14} color="white" />
        )}
      </Pressable>
      <View style={[styles.headerPressableCell, styles.anomalyCoordinateCell]}>
        <Text style={styles.headerCell}>{t("coordinates")}</Text>
      </View>
      <Pressable
        onPress={() => requestSort("created_at")}
        style={[styles.headerPressableCell, styles.anomalyDetectedCell]}
      >
        <Text style={styles.headerCell}>{t("detected_at")}</Text>
        {sortConfig.key === "created_at" && sortConfig.direction === "asc" ? (
          <ArrowUpNarrowWide size={14} color="white" />
        ) : (
          <ArrowDownWideNarrow size={14} color="white" />
        )}
      </Pressable>
      <Text style={[styles.headerCell, styles.anomalyUserCell]}>{t("user")}</Text>
      <Text style={[styles.headerCell, styles.anomalyStatusCell]}>{t("status_label")}</Text>
      <Text style={[styles.headerCell, styles.anomalyActionCell]}>{t("action")}</Text>
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
      <Text
        style={[styles.cellText, styles.anomalyIdCell, styles.centeredText]}
      >
        {item.id}
      </Text>

      <Text style={[styles.cellText, styles.anomalyTypeCell]}>
        {getEventTypeLabel(item.event_type, t)}
      </Text>

      <Pressable
        style={[styles.anomalyCoordinateCell, styles.coordinatePressable]}
        onPress={() => {
          if (item.latitude && item.longitude) {
            setSelectedAnomaly(item);
            setShowMapModal(true);
          }
        }}
      >
        {item.latitude && item.longitude ? (
          <View style={styles.coordinateChip}>
            <MapPin size={14} color="#217837" />
            <Text style={styles.coordinateText}>
              {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
            </Text>
          </View>
        ) : (
          <Text style={styles.mutedText}>-</Text>
        )}
      </Pressable>

      <Text
        style={[styles.cellText, styles.anomalyDetectedCell, styles.mutedText]}
      >
        {formatDate(item.created_at)}
      </Text>

      <Text
        style={[styles.cellText, styles.anomalyUserCell, styles.centeredText]}
      >
        {item.user_id || "-"}
      </Text>

      <View style={[styles.anomalyStatusCell, styles.centeredCell]}>
        {item.is_resolved ? (
          <View style={styles.resolvedBadge}>
            <CheckCircle size={12} color="#059669" />
            <Text style={styles.resolvedBadgeText}>{t("resolved")}</Text>
          </View>
        ) : (
          <View style={styles.unresolvedBadge}>
            <Circle size={12} color="#dc2626" />
            <Text style={styles.unresolvedBadgeText}>{t("open")}</Text>
          </View>
        )}
      </View>

      <View style={[styles.anomalyActionCell, styles.centeredCell]}>
        {!item.is_resolved && (
          <Pressable
            onPress={async (e) => {
              e.stopPropagation?.();
              setResolvingId(item.id);
              try {
                await resolveAnomaly(item.id);
              } finally {
                setResolvingId(null);
              }
            }}
            disabled={resolvingId === item.id}
            style={({ hovered }) => [
              styles.resolveBtn,
              hovered && styles.resolveBtnHover,
              resolvingId === item.id && styles.resolveBtnDisabled,
            ]}
          >
            {resolvingId === item.id ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.resolveBtnText}>{t("resolved")}</Text>
            )}
          </Pressable>
        )}
      </View>
    </Pressable>
  );

  const renderAnomalyTableState = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0a6340" />
          <Text style={styles.loadingText}>{t("loading_anomalies")}</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <AlertTriangle size={48} color="#dc2626" />
          <Text style={styles.errorText}>{t("failed_load_anomalies")}</Text>
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
      );
    }

    return (
      <>
        <View style={[styles.toolbar, styles.row]}>
          <View style={styles.row}>
            <Pressable
              onPress={resetSort}
              style={({ hovered }) => [
                styles.iconBtn,
                hovered && styles.iconBtnHover,
              ]}
            >
              <RotateCcw size={18} />
            </Pressable>
            <View style={[styles.search, styles.row]}>
              <Search size={18} color="#5b6b63" />
              <TextInput
                style={styles.input}
                placeholder={t("search")}
                placeholderTextColor="#8f8f8f"
                value={searchQuery}
                onChangeText={handleSearch}
              />
            </View>
          </View>
        </View>

        <View style={styles.tableContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            contentContainerStyle={styles.tableScrollContent}
          >
            <View style={[styles.tableInner, styles.anomalyTableInner]}>
              <FlatList
                style={styles.table}
                scrollEnabled={false}
                data={anomalies}
                ListHeaderComponent={renderAnomalyHeader}
                renderItem={renderAnomalyItem}
                keyExtractor={(item) => item.id.toString()}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <AlertTriangle size={48} color="#d1d5db" />
                    <Text style={styles.emptyText}>{t("no_anomalies_detected")}</Text>
                  </View>
                }
              />
            </View>
          </ScrollView>
        </View>

        <PaginatedTableControls
          page={currentPage}
          totalPages={totalPages}
          totalElements={totalAnomalies}
          size={PAGE_SIZE}
          itemLabel={t("anomalies")}
          onPageChange={setCurrentPage}
        />
      </>
    );
  };

  const renderSensorState = () => {
    if (sensorLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0a6340" />
          <Text style={styles.loadingText}>{t("loading_sensors")}</Text>
        </View>
      );
    }

    if (sensorError) {
      return (
        <View style={styles.errorContainer}>
          <AlertTriangle size={48} color="#dc2626" />
          <Text style={styles.errorText}>{t("failed_load_sensors")}</Text>
          <Text style={styles.errorDetail}>{sensorError}</Text>
          <Pressable
            onPress={refreshActiveTab}
            style={({ hovered }) => [
              styles.retryBtn,
              hovered && styles.retryBtnHover,
            ]}
          >
            <Text style={styles.retryBtnText}>Try Again</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <>
        <View style={styles.tableContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            contentContainerStyle={styles.tableScrollContent}
          >
            <View style={[styles.tableInner, styles.sensorTableInner]}>
              <FlatList
                style={styles.table}
                scrollEnabled={false}
                data={sensorState.data}
                ListHeaderComponent={renderSensorHeader}
                renderItem={renderSensorItem}
                keyExtractor={(item) => item.id.toString()}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <AlertTriangle size={48} color="#d1d5db" />
                    <Text style={styles.emptyText}>No sensors found</Text>
                  </View>
                }
              />
            </View>
          </ScrollView>
        </View>
        <PaginatedTableControls
          page={sensorsPage}
          totalPages={sensorState.totalPages}
          totalElements={sensorState.totalElements}
          size={sensorState.size}
          itemLabel={t("sensors")}
          onPageChange={setSensorsPage}
        />
      </>
    );
  };

  const renderSensorLogsModal = () => {
    if (!showSensorLogsModal || !selectedSensorForLogs) {
      return null;
    }

    return (
      <Modal
        visible={showSensorLogsModal}
        transparent
        animationType="fade"
        onRequestClose={closeSensorLogsModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeSensorLogsModal}>
          <View
            style={styles.sensorLogsModalContent}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.sensorLogsModalHeader}>
              <Text style={styles.sensorLogsModalTitle}>
                {t("sensor_logs")} -{" "}
                {selectedSensorForLogs.name ||
                  `Sensor #${selectedSensorForLogs.id}`}
              </Text>
              <Pressable onPress={closeSensorLogsModal}>
                <Text style={styles.mapCloseBtn}>x</Text>
              </Pressable>
            </View>

            {sensorLogsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0a6340" />
                <Text style={styles.loadingText}>{t("loading_sensor_logs")}</Text>
              </View>
            ) : sensorLogsError ? (
              <View style={styles.errorContainer}>
                <AlertTriangle size={48} color="#dc2626" />
                <Text style={styles.errorText}>{t("failed_load_sensor_logs")}</Text>
                <Text style={styles.errorDetail}>{sensorLogsError}</Text>
                <Pressable
                  onPress={() =>
                    loadSensorLogs(selectedSensorForLogs.id, sensorLogsPage)
                  }
                  style={({ hovered }) => [
                    styles.retryBtn,
                    hovered && styles.retryBtnHover,
                  ]}
                >
                  <Text style={styles.retryBtnText}>{t("try_again")}</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <View style={styles.tableContainer}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator
                    contentContainerStyle={styles.tableScrollContent}
                  >
                    <View style={[styles.tableInner, styles.logTableInner]}>
                      <FlatList
                        style={styles.table}
                        scrollEnabled={false}
                        data={sensorLogsState.data}
                        ListHeaderComponent={renderSensorLogsHeader}
                        renderItem={renderSensorLogItem}
                        keyExtractor={(item) => item.id.toString()}
                        ListEmptyComponent={
                          <View style={styles.emptyContainer}>
                            <AlertTriangle size={48} color="#d1d5db" />
                            <Text style={styles.emptyText}>
                              No sensor logs found
                            </Text>
                          </View>
                        }
                      />
                    </View>
                  </ScrollView>
                </View>
                <PaginatedTableControls
                  page={sensorLogsPage}
                  totalPages={sensorLogsState.totalPages}
                  totalElements={sensorLogsState.totalElements}
                  size={sensorLogsState.size}
                  itemLabel={t("sensor_logs")}
                  onPageChange={setSensorLogsPage}
                />
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    );
  };

  const renderMapModal = () => {
    if (!selectedAnomaly?.latitude || !selectedAnomaly?.longitude) {
      return null;
    }

    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${(
      selectedAnomaly.longitude - 0.01
    ).toFixed(4)},${(selectedAnomaly.latitude - 0.01).toFixed(4)},${(
      selectedAnomaly.longitude + 0.01
    ).toFixed(4)},${(selectedAnomaly.latitude + 0.01).toFixed(
      4,
    )}&layer=mapnik&marker=${selectedAnomaly.latitude.toFixed(
      4,
    )},${selectedAnomaly.longitude.toFixed(4)}`;

    return (
      <Modal
        visible={showMapModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMapModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowMapModal(false)}
        >
          <View
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
          >
            <View
              style={[
                styles.mapContainer,
                isCompact && { height: Math.min(height * 0.75, 520) },
              ]}
            >
              <View style={styles.mapHeader}>
                <Text style={styles.mapTitle}>
                  {getEventTypeLabel(selectedAnomaly.event_type, t)}
                </Text>
                <Pressable onPress={() => setShowMapModal(false)}>
                  <Text style={styles.mapCloseBtn}>x</Text>
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
    <ScrollView
      style={styles.pageScroll}
      contentContainerStyle={styles.container}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>{t('anomaly_detection')}</Text>
          <Text style={styles.subtitle}>
            {t("sensor_inventory_tracking")}
          </Text>
        </View>
        <Pressable
          onPress={refreshActiveTab}
          style={({ hovered }) => [
            styles.iconBtn,
            hovered && styles.iconBtnHover,
          ]}
        >
          <RotateCcw size={18} />
        </Pressable>
      </View>

      <View style={[styles.tabStrip, isCompact && styles.tabStripCompact]}>
        {renderTabButton(
          TABS.ANOMALIES,
          t("anomalies"),
          `${totalAnomalies} ${t("total_anomalies")}`,
        )}
        {renderTabButton(
          TABS.SENSORS,
          t("sensors"),
          `${sensorState.totalElements} ${t("total_sensors")}`,
        )}
      </View>

      <View style={styles.panel}>
        {activeTab === TABS.ANOMALIES
          ? renderAnomalyTableState()
          : renderSensorState()}
      </View>

      {activeTab === TABS.ANOMALIES ? renderMapModal() : null}
      {renderSensorLogsModal()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  pageScroll: {
    flex: 1,
    backgroundColor: "#f8faf7",
  },
  container: {
    paddingVertical: 24,
    paddingHorizontal: 28,
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#102219",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#5b6b63",
  },
  toolbar: {
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 14,
    alignItems: "center",
  },
  iconBtn: {
    alignSelf: "flex-start",
    padding: 10,
    borderRadius: 999,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#d7e0da",
  },
  iconBtnHover: {
    backgroundColor: "#edf7f0",
    borderColor: "#b7cfbf",
  },
  search: {
    gap: 7,
    borderWidth: 1,
    borderColor: "#d7e0da",
    minWidth: 280,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "white",
    borderRadius: 14,
    alignItems: "center",
    marginLeft: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
    color: "#1f2933",
    outlineStyle: "none",
  },
  tabStrip: {
    flexDirection: "row",
    gap: 12,
  },
  tabStripCompact: {
    flexDirection: "column",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dde5df",
    shadowColor: "#102219",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  tabButtonActive: {
    backgroundColor: "#0a6340",
    borderColor: "#0a6340",
  },
  tabButtonHover: {
    borderColor: "#9eb8a5",
  },
  tabTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#102219",
  },
  tabTitleActive: {
    color: "white",
  },
  tabSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: "#627169",
  },
  tabSubtitleActive: {
    color: "rgba(255,255,255,0.78)",
  },
  panel: {
    borderRadius: 20,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#dce6df",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
  },
  tableContainer: {
    width: "100%",
    backgroundColor: "white",
  },
  tableScrollContent: {
    minWidth: "100%",
  },
  tableInner: {
    minWidth: 980,
    width: "100%",
  },
  anomalyTableInner: {
    minWidth: 1080,
  },
  sensorTableInner: {
    minWidth: 920,
  },
  logTableInner: {
    minWidth: 1040,
  },
  table: {
    backgroundColor: "white",
  },
  tableHeader: {
    backgroundColor: "#0a6340",
    paddingVertical: 10,
    userSelect: "none",
  },
  headerCell: {
    color: "white",
    fontWeight: "600",
    fontSize: 13,
    paddingHorizontal: 10,
    alignSelf: "center",
  },
  headerPressableCell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
  },
  tableRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e7ece8",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  cellText: {
    fontSize: 13,
    color: "#1f2933",
    paddingHorizontal: 10,
  },
  cellContent: {
    paddingHorizontal: 10,
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  centeredText: {
    textAlign: "center",
  },
  centeredCell: {
    alignItems: "center",
    justifyContent: "center",
  },
  mutedText: {
    color: "#6b7280",
  },
  sensorIdCell: {
    width: 70,
    textAlign: "center",
  },
  sensorNameCell: {
    flex: 1.5,
  },
  sensorTypeCell: {
    flex: 1.2,
  },
  sensorLocationCell: {
    flex: 1.4,
  },
  sensorStatusCell: {
    width: 170,
    justifyContent: "center",
  },
  sensorRowPressable: {
    cursor: "pointer",
  },
  sensorRowHover: {
    backgroundColor: "#f7fbf8",
  },
  logIdCell: {
    width: 70,
    textAlign: "center",
  },
  logStatusCell: {
    width: 170,
    justifyContent: "center",
  },
  logDataCell: {
    flex: 1.8,
  },
  logDateCell: {
    width: 200,
  },
  anomalyIdCell: {
    width: 70,
  },
  anomalyTypeCell: {
    flex: 1.7,
  },
  anomalyCoordinateCell: {
    flex: 1.9,
  },
  anomalyDetectedCell: {
    flex: 1.5,
  },
  anomalyUserCell: {
    width: 90,
    textAlign: "center",
  },
  anomalyStatusCell: {
    width: 130,
    textAlign: "center",
  },
  anomalyActionCell: {
    width: 100,
    textAlign: "center",
  },
  coordinatePressable: {
    paddingHorizontal: 10,
  },
  coordinateChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#f0fdf4",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  coordinateText: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "500",
    fontFamily: "monospace",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  resolvedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  resolvedBadgeText: {
    fontSize: 11,
    color: "#059669",
    fontWeight: "600",
  },
  unresolvedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  unresolvedBadgeText: {
    fontSize: 11,
    color: "#dc2626",
    fontWeight: "600",
  },
  resolveBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#0a6340",
    borderRadius: 6,
    minWidth: 64,
    alignItems: "center",
  },
  resolveBtnHover: {
    backgroundColor: "#065f2e",
  },
  resolveBtnDisabled: {
    backgroundColor: "#9ca3af",
  },
  resolveBtnText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 44,
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
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: "#fbfcfb",
    borderTopWidth: 1,
    borderTopColor: "#e7ece8",
  },
  pageInfo: {
    color: "#5b6b63",
    fontSize: 14,
  },
  pageBtn: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#d0d8d2",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  pageBtnText: {
    color: "#0a6340",
    fontWeight: "700",
  },
  btnDisabled: {
    backgroundColor: "#f3f4f6",
    borderColor: "#e5e7eb",
  },
  disabledText: {
    color: "#b6bdba",
  },
  arrowBtn: {
    paddingTop: 2,
  },
  activePageBtn: {
    backgroundColor: "#0a6340",
    borderColor: "#0a6340",
  },
  loadingContainer: {
    paddingVertical: 64,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
  },
  errorContainer: {
    paddingVertical: 64,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "700",
    color: "#dc2626",
  },
  errorDetail: {
    marginTop: 8,
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#0a6340",
    borderRadius: 8,
  },
  retryBtnHover: {
    backgroundColor: "#065f2e",
  },
  retryBtnText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
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
  sensorLogsModalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    width: "92%",
    maxWidth: 1050,
    maxHeight: "90%",
  },
  sensorLogsModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  sensorLogsModalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
});

export default AnomalyDetection;
