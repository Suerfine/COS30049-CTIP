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
  CircleCheckBig,
  SlidersHorizontal,
  MapPin,
  X,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
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
  Platform
} from "react-native";
import { useTranslation } from "react-i18next";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

import { useAnomalyDetection } from "../hooks/useAnomalyDetection";
import { formatDate } from "../utils/formatDate";

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

const formatStatusLabel = (value) => {
  if (!value) {
    return "Unknown";
  }

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const formatSensorDataValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    return value.map((item) => formatSensorDataValue(item)).join(", ");
  }

  return String(value);
};

const renderSensorLogData = (value) => {
  if (value === null || value === undefined || value === "") {
    return <Text style={styles.sensorLogEmptyValue}>-</Text>;
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    return (
      <Text style={styles.sensorLogSingleValue}>
        {formatSensorDataValue(value)}
      </Text>
    );
  }

  const entries = Object.entries(value);
  if (entries.length === 0) {
    return <Text style={styles.sensorLogEmptyValue}>-</Text>;
  }

  return (
    <View style={styles.sensorLogDataWrap}>
      {entries.map(([key, entryValue]) => (
        <View key={key} style={styles.sensorLogDataChip}>
          <Text style={styles.sensorLogDataLabel}>{formatStatusLabel(key)}</Text>
          <Text style={styles.sensorLogDataValue}>
            {formatSensorDataValue(entryValue)}
          </Text>
        </View>
      ))}
    </View>
  );
};

const isIotAnomaly = (event) => event?.metadata?.source === "iot_sensor";

const formatEvidenceValue = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
};

const renderEvidenceValue = (value) => {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <Text style={styles.evidenceValue}>-</Text>;
    }

    return (
      <View style={styles.evidenceChipWrap}>
        {value.map((item, index) => (
          <Text key={`${item}-${index}`} style={styles.evidenceChip}>
            {formatEvidenceValue(item)}
          </Text>
        ))}
      </View>
    );
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value);

    if (entries.length === 0) {
      return <Text style={styles.evidenceValue}>-</Text>;
    }

    return (
      <View style={styles.evidenceObjectList}>
        {entries.map(([key, nestedValue]) => (
          <View key={key} style={styles.evidenceObjectRow}>
            <Text style={styles.evidenceObjectKey}>
              {formatStatusLabel(key)}
            </Text>
            <Text style={styles.evidenceObjectValue}>
              {formatEvidenceValue(nestedValue)}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  return <Text style={styles.evidenceValue}>{formatEvidenceValue(value)}</Text>;
};

const getIotEvidenceRows = (event) => {
  const metadata = event?.metadata || {};
  const sensorData = metadata.sensor_data || {};

  return [
    ["Source", "IoT sensor"],
    ["Sensor ID", metadata.sensor_id],
    ["Sensor Name", metadata.sensor_name],
    ["Sensor Type", metadata.sensor_type],
    ["Sensor Status", metadata.sensor_status],
    ["Sensor Log ID", metadata.sensor_log_id],
    ...Object.entries(sensorData).map(([key, value]) => [
      formatStatusLabel(key),
      value,
    ]),
  ];
};

const getStatusStyle = (status) => {
  const key = String(status || "").toLowerCase();
  return STATUS_STYLES[key] || STATUS_STYLES.default;
};

const getEventTypeLabel = (type, t) => {
  switch (type) {
    case "touching_plant":
      return "Touching Plant";

    case "touching_animal":
      return "Touching Animal";

    case "plucking_plants":
      return "Plucking Plants";

    case "hitting_animal":
      return "Hitting Animal";

    case "extended_plant_touch":
      return "Extended Plant Touch";

    case "extended_animal_touch":
      return "Extended Animal Touch";

    case "forest_fire":
      return "Forest Fire";

    case "flooding":
      return "Flooding";

    case "loud_noise":
      return "Loud Noise";

    case "trespassing":
      return "Trespassing";

    default:
      return type;
  }
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
  const lastItem = Math.min(totalElements, page * size);

  return (
    <View style={[styles.paginationContainer, styles.row]}>
      <Text style={styles.pageInfo}>
        {t("showing")} {firstItem} {t("to")} {lastItem} {t("of")}{" "}
        {totalElements} {itemLabel}
      </Text>
      <View style={styles.paginationControls}>
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

const splitSensorNameLocation = (name = "") => {
  const [sensorName, ...locationParts] = String(name).split(" - ");

  return {
    sensorName: sensorName || "-",
    nameLocation: locationParts.join(" - ") || "-",
  };
};

const AnomalyDetection = () => {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const isCompact = width < 700;

  const [activeTab, setActiveTab] = useState(TABS.ANOMALIES);

  const [filterVisible, setFilterVisible] = useState(false);

  const [tempAnomalyFilters, setTempAnomalyFilters] = useState({
    status: "all",
    eventType: [],
    time: "anytime",
  });

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
    sensorsPage,
    setSensorsPage,
    sensorState,
    sensorLoading,
    sensorError,
    sensorLogsPage,
    setSensorLogsPage,
    sensorLogsState,
    sensorLogsLoading,
    sensorLogsError,
    loadSensors,
    loadSensorLogs,
    refreshSensors,
    anomalyFilters,
    setAnomalyFilters,
  } = useAnomalyDetection();

  const [resolvingId, setResolvingId] = useState(null);
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [selectedSensor, setSelectedSensor] = useState(null);
    const [hoveredRowId, setHoveredRowId] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!selectedSensor?.id) {
      return;
    }

    loadSensorLogs(
      selectedSensor.id,
      sensorLogsPage
    );
  }, [selectedSensor?.id, sensorLogsPage]);

  useEffect(() => {
    if (!selectedSensor?.id) return;

    const latestSelectedSensor = sensorState.data.find(
      (sensor) => Number(sensor.id) === Number(selectedSensor.id),
    );

    if (latestSelectedSensor) {
      setSelectedSensor((previous) => ({
        ...previous,
        ...latestSelectedSensor,
      }));
    }
  }, [sensorState.data, selectedSensor?.id]);

  useEffect(() => {
    if (activeTab !== TABS.SENSORS) return;

    let isMounted = true;
    
    const fetchInitialData = async () => {
      await refreshSensors({ silent: true });
      if (selectedSensor?.id && isMounted) {
        await loadSensorLogs(selectedSensor.id, sensorLogsPage, { silent: true });
      }
    };

    fetchInitialData();

    const interval = setInterval(async () => {
      if (!isMounted) return;
      
      await refreshSensors({ silent: true });
      if (selectedSensor?.id) {
        await loadSensorLogs(selectedSensor.id, sensorLogsPage, { silent: true });
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeTab, selectedSensor?.id, sensorLogsPage]);

  useEffect(() => {
    if (activeTab !== TABS.ANOMALIES) return;

    const interval = setInterval(() => {
      refresh({ silent: true });
    }, 7000);

    return () => clearInterval(interval);
  }, [activeTab, refresh]);

  const refreshActiveTab = () => {
    if (activeTab === TABS.ANOMALIES) {
      refresh();
      return;
    }

    if (activeTab === TABS.SENSORS) {
      refreshSensors();
      return;
    }
  };

  const handleSelectSensor = (sensor) => {
    setSelectedSensor(sensor);
    setSensorLogsPage(1);
  };

  const sortedSensorLogs = useMemo(
    () => selectedSensor ? [...sensorLogsState.data].reverse() : [],
    [selectedSensor, sensorLogsState.data],
  );

  const sensorChartData = useMemo(() => ({
    labels: selectedSensor
      ? sortedSensorLogs.map((log) =>
          new Date(log.created_at).toLocaleTimeString()
        )
      : [],

    datasets: [
      {
        label: t("sensor_readings"),
        data: selectedSensor
          ? sortedSensorLogs.map((log) => {
              if (typeof log.data === "number") return log.data;

              if (typeof log.data === "object" && log.data !== null) {
                return Number(Object.values(log.data)[0]) || 0;
              }

              return Number(log.data) || 0;
            })
          : [],

        borderColor: "#0a6340",
        backgroundColor: "rgba(10, 99, 64, 0.15)",
        borderWidth: 2,
        tension: 0.3,
        fill: true,
      },
    ],
  }), [selectedSensor, sortedSensorLogs, t]);

  const sensorChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        display: !!selectedSensor,
        position: "top",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }), [selectedSensor]);

  const AnomalyFilterSidebar = () => {
    const statusOptions = ["all", "active", "resolved"];

    const eventTypeOptions = [
      "touching_plant",
      "touching_animal",
      "plucking_plants",
      "hitting_animal",
      "extended_plant_touch",
      "extended_animal_touch",
      "forest_fire",
      "flooding",
      "loud_noise",
      "trespassing",
    ];

    const timeOptions = ["anytime", "today", "3_days", "1_week"];

    const toggleEventType = (type) => {
      setTempAnomalyFilters((prev) => {
        const selected = prev.eventType.includes(type);

        return {
          ...prev,
          eventType: selected
            ? prev.eventType.filter((item) => item !== type)
            : [...prev.eventType, type],
        };
      });
    };

    const FilterItem = ({ label, selected, onPress }) => (
      <Pressable style={styles.filterItem} onPress={onPress}>
        {selected ? (
          <CircleCheckBig size={18} color="#0a6340" />
        ) : (
          <Circle size={18} color="gray" />
        )}
        <Text
          style={[
            styles.filterItemText,
            selected && styles.filterItemTextActive,
          ]}
        >
          {label}
        </Text>
      </Pressable>
    );

    return (
      <>
        {filterVisible && (
          <Pressable
            style={styles.filterBackdrop}
            onPress={() => setFilterVisible(false)}
          />
        )}

        {filterVisible && (
          <View style={styles.filterSidebar}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>{t("filters")}</Text>
              <Pressable onPress={() => setFilterVisible(false)}>
                <X size={22} color="#666" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>
                  {t("status_label")}
                </Text>

                {statusOptions.map((status) => (
                  <FilterItem
                    key={status}
                    label={
                      status === "all"
                        ? t("status.all")
                        : status === "active"
                          ? t("active")
                          : t("resolved")
                    }
                    selected={tempAnomalyFilters.status === status}
                    onPress={() =>
                      setTempAnomalyFilters((prev) => ({
                        ...prev,
                        status,
                      }))
                    }
                  />
                ))}
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>{t("event_type")}</Text>

                {eventTypeOptions.map((type) => (
                  <FilterItem
                    key={type}
                    label={getEventTypeLabel(type, t)}
                    selected={tempAnomalyFilters.eventType.includes(type)}
                    onPress={() => toggleEventType(type)}
                  />
                ))}
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>
                  {" "}
                  {t("detected_within")}
                </Text>

                {timeOptions.map((time) => (
                  <FilterItem
                    key={time}
                    label={t(time)}
                    selected={tempAnomalyFilters.time === time}
                    onPress={() =>
                      setTempAnomalyFilters((prev) => ({
                        ...prev,
                        time,
                      }))
                    }
                  />
                ))}
              </View>
            </ScrollView>

            <View style={styles.filterButtons}>
              <Pressable
                style={styles.applyBtn}
                onPress={() => {
                  setAnomalyFilters(tempAnomalyFilters);
                  setCurrentPage(1);
                  setFilterVisible(false);
                }}
              >
                <Text style={styles.filterBtnText}>{t("apply")}</Text>
              </Pressable>

              <Pressable
                style={styles.resetBtn}
                onPress={() => {
                  const resetValue = {
                    status: "all",
                    eventType: [],
                    time: "anytime",
                  };

                  setTempAnomalyFilters(resetValue);
                  setAnomalyFilters(resetValue);
                  setCurrentPage(1);
                  setFilterVisible(false);
                }}
              >
                <Text style={styles.filterBtnText}>{t("reset")}</Text>
              </Pressable>
            </View>
          </View>
        )}
      </>
    );
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
      <Text style={[styles.headerCell, styles.sensorNameLocationCell]}>
        {t("location")}
      </Text>
      <Text style={[styles.headerCell, styles.sensorCoordinateCell]}>
        {t("coordinates")}
      </Text>
      <Text style={[styles.headerCell, styles.sensorStatusCell]}>
        {t("status_label")}
      </Text>
    </View>
  );

  const renderSensorItem = ({ item }) => {
    const isHovered = hoveredRowId === item.id;
    const { sensorName, nameLocation } = splitSensorNameLocation(item.name);
    return (
      <View style={[styles.rowContainerRelative, isHovered && { zIndex: 10 }]}
      onPointerMove={(e) => {
          if (Platform.OS === 'web') {
            const containerBounds = e.currentTarget.getBoundingClientRect();
            setMousePos({ 
              x: e.nativeEvent.clientX - containerBounds.left, 
              y: e.nativeEvent.clientY - containerBounds.top 
            });
          }
        }}>
        <Pressable
          onPress={() => handleSelectSensor(item)}
          onHoverIn={() => setHoveredRowId(item.id)}
          onHoverOut={() => setHoveredRowId(null)}
          style={({ hovered }) => [
            styles.row,
            styles.tableRow,
            styles.sensorRowPressable,
            hovered && styles.sensorRowHover,
            selectedSensor?.id === item.id && { backgroundColor: "#eefbf3" },
          ]}
        >
          {isHovered && Platform.OS === 'web' && (
            <View style={[styles.rowTooltip, { left: mousePos.x + 15, top: mousePos.y - 35 }]}>
              <Text style={styles.tooltipText}>Click to load real-time telemetry analytics</Text>
            </View>
          )}

          <Text style={[styles.cellText, styles.sensorIdCell, isHovered && styles.cellTextHover]}>
            {item.id}
          </Text>

          <Text style={[styles.cellText, styles.cellTextBold, styles.sensorNameCell, isHovered && styles.cellTextHover]}>
            {sensorName}
          </Text>

          <Text style={[styles.cellText, styles.sensorNameLocationCell, isHovered && styles.cellTextHover]}>
            {item.location}
          </Text>

          <View style={[styles.cellContent, styles.sensorCoordinateCell]}>
            <MapPin size={14} color="#059669" />
            <Text style={styles.coordinateText}>{formatCoordinates(item)}</Text>
          </View>

          <View style={[styles.cellContent, styles.sensorStatusCell]}>
            <StatusBadge value={item.current_status} />
          </View>
        </Pressable>
      </View>
    );
  };

  const renderSensorLogsHeader = () => (
    <View style={[styles.tableHeader, styles.row]}>
      <Text style={[styles.headerCell, styles.logIdCell]}>{t("id")}</Text>
      <Text style={[styles.headerCell, styles.logStatusCell]}>
        {t("status_label")}
      </Text>
      <Text style={[styles.headerCell, styles.logDataCell]}>{t("data")}</Text>
      <Text style={[styles.headerCell, styles.logDateCell]}>
        {t("created_at")}
      </Text>
    </View>
  );

  const renderSensorLogItem = ({ item }) => (
    <View style={[styles.row, styles.tableRow]}>
      <Text style={[styles.cellText, styles.logIdCell]}>{item.id}</Text>
      <View style={[styles.cellContent, styles.logStatusCell]}>
        <StatusBadge value={item.status} />
      </View>
      <View style={[styles.cellContent, styles.logDataCell]}>
        {renderSensorLogData(item.data)}
      </View>
      <Text style={[styles.cellText, styles.logDateCell]}>
        {formatDate(item.created_at)}
      </Text>
    </View>
  );

  const renderAnomalyHeader = () => (
    <View style={[styles.tableHeader, styles.row]}>
      <Text style={[styles.headerText, { flex: 1, textAlign: "center" }]}>
        {t("id")}
      </Text>

      <View style={[styles.headerPressRow, { flex: 3 }]}>
        <Text style={styles.headerText}>{t("event_type")}</Text>
      </View>

      <View style={[styles.headerPressRow, { flex: 3 }]}>
        <Text style={styles.headerText}>{t("location")}</Text>
      </View>

      <Text style={[styles.headerText, { flex: 3 }]}>{t("coordinates")}</Text>

      <Pressable
        onPress={() => requestSort("created_at")}
        style={[styles.headerPressRow, { flex: 2 }]}
      >
        <Text style={styles.headerText}>{t("detected_at")}</Text>
        {sortConfig.key === "created_at" && sortConfig.direction === "asc" ? (
          <ArrowUpNarrowWide size={14} color="white" />
        ) : (
          <ArrowDownWideNarrow size={14} color="white" />
        )}
      </Pressable>

      <Text style={[styles.headerText, { flex: 1, textAlign: "center" }]}>
        {t("user")}
      </Text>

      <Text style={[styles.headerText, { flex: 2, textAlign: "center" }]}>
        {t("status_label")}
      </Text>
    </View>
  );

  const renderAnomalyItem = ({ item }) => {
    const isHovered = hoveredRowId === item.id;
    return (
      <View style={[styles.rowContainerRelative, isHovered && { zIndex: 10 }]}
      onPointerMove={(e) => {
          if (Platform.OS === 'web') {
            const containerBounds = e.currentTarget.getBoundingClientRect();
            setMousePos({ 
              x: e.nativeEvent.clientX - containerBounds.left, 
              y: e.nativeEvent.clientY - containerBounds.top 
            });
          }
        }}>
        <Pressable
          onPress={() => setSelectedAnomaly(item)}
          onHoverIn={() => setHoveredRowId(item.id)}
          onHoverOut={() => setHoveredRowId(null)}
          style={({ hovered }) => [
            styles.row,
            styles.tableRow,
            hovered && { backgroundColor: "#f8fafc" },
            selectedAnomaly?.id === item.id && { backgroundColor: "#fff8e1" },
          ]}
        >
          {isHovered && Platform.OS === 'web' && (
            <View 
              style={[
                styles.rowTooltip, 
                { 
                  left: mousePos.x + 15, 
                  top: mousePos.y - 35   
                }
              ]}
            >
              <Text style={styles.tooltipText}>Click to view evidence & resolve anomaly</Text>
            </View>
          )}

          <Text style={[styles.cellText, { flex: 1, textAlign: "center" }, isHovered && styles.cellTextHover]}>
            {item.id}
          </Text>

          <Text style={[styles.cellText, styles.cellTextBold, { flex: 3 }, isHovered && styles.cellTextHover]}>
            {getEventTypeLabel(item.event_type, t)}
          </Text>

          <Text style={[styles.cellText, styles.cellTextBold, { flex: 3 }, isHovered && styles.cellTextHover]}>
            {item.location}
          </Text>

          <View style={[{ flex: 3 }, styles.coordinatePressable]}>
            {item.latitude && item.longitude ? (
              <View style={styles.coordinateChip}>
                <MapPin size={14} color="#217837" />
                <Text style={styles.coordinateText}>
                  {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                </Text>
              </View>
            ) : (
              <Text style={[styles.cellText, styles.mutedText]}>-</Text>
            )}
          </View>

          <Text style={[styles.cellText, styles.mutedText, { flex: 2 }, isHovered && styles.cellTextHover]}>
            {formatDate(item.created_at)}
          </Text>

          <Text style={[styles.cellText, { flex: 1, textAlign: "center" }, isHovered && styles.cellTextHover]}>
            {item.user_id || "-"}
          </Text>

          <View style={[{ flex: 2 }, styles.centeredCell]}>
            {item.is_resolved ? (
              <View style={styles.resolvedBadge}>
                <CheckCircle size={12} color="#059669" />
                <Text style={styles.resolvedBadgeText}>{t("resolved")}</Text>
              </View>
            ) : (
              <View style={styles.unresolvedBadge}>
                <Circle size={12} color="#dc2626" />
                <Text style={styles.unresolvedBadgeText}>{t("active")}</Text>
              </View>
            )}
          </View>
        </Pressable>
      </View>
    );
  };

  const renderAnomalyEvidence = (event) => {
    if (!event) return null;

    if (isIotAnomaly(event)) {
      return (
        <View style={styles.evidenceSection}>
          <Text style={styles.evidenceTitle}>Sensor Evidence</Text>
          <View style={styles.evidenceGrid}>
            {getIotEvidenceRows(event).map(([label, value]) => (
              <View key={label} style={styles.evidenceRow}>
                <Text style={styles.evidenceLabel}>{label}</Text>
                <View style={styles.evidenceValueContainer}>
                  {renderEvidenceValue(value)}
                </View>
              </View>
            ))}
          </View>
        </View>
      );
    }

    return (
      <View style={styles.evidenceSection}>
        <Text style={styles.evidenceTitle}>AI Evidence</Text>
        {event.annotated_frame_base64 ? (
          <img
            alt="Annotated anomaly evidence"
            src={`data:image/jpeg;base64,${event.annotated_frame_base64}`}
            style={styles.evidenceImage}
          />
        ) : (
          <View style={styles.emptyEvidence}>
            <Text style={styles.emptyEvidenceText}>
              No anomaly photo available
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderAnomalyDetailModal = () => {
    if (!selectedAnomaly) return null;

    return (
      <Modal
        visible={!!selectedAnomaly}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedAnomaly(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedAnomaly(null)}
        >
          <View
            style={styles.anomalyDetailModalContent}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.sensorLogsModalHeader}>
              <View>
                <Text style={styles.sensorLogsModalTitle}>
                  {getEventTypeLabel(selectedAnomaly.event_type, t)}
                </Text>
                <Text style={styles.detailSubtitle}>
                  {isIotAnomaly(selectedAnomaly) ? "IoT anomaly" : "AI anomaly"}{" "}
                  · {formatDate(selectedAnomaly.created_at)}
                </Text>
              </View>
              <Pressable onPress={() => setSelectedAnomaly(null)}>
                <Text style={styles.mapCloseBtn}>x</Text>
              </Pressable>
            </View>

            <ScrollView
              style={styles.detailScroll}
              contentContainerStyle={styles.detailScrollContent}
            >
              <View style={styles.detailMetaGrid}>
                <View style={styles.detailMetaItem}>
                  <Text style={styles.evidenceLabel}>Status</Text>
                  <Text style={styles.evidenceValue}>
                    {selectedAnomaly.is_resolved ? t("resolved") : t("active")}
                  </Text>
                </View>
                <View style={styles.detailMetaItem}>
                  <Text style={styles.evidenceLabel}>Coordinates</Text>
                  <Text style={styles.evidenceValue}>
                    {selectedAnomaly.latitude && selectedAnomaly.longitude
                      ? `${Number(selectedAnomaly.latitude).toFixed(6)}, ${Number(
                          selectedAnomaly.longitude,
                        ).toFixed(6)}`
                      : "-"}
                  </Text>
                </View>
                <View style={styles.detailMetaItem}>
                  <Text style={styles.evidenceLabel}>User ID</Text>
                  <Text style={styles.evidenceValue}>
                    {selectedAnomaly.user_id || "-"}
                  </Text>
                </View>
              </View>

              <View style={styles.detailMediaRow}>
                <View style={styles.detailMediaColumn}>
                  {renderAnomalyEvidence(selectedAnomaly)}
                </View>

                {selectedAnomaly.latitude && selectedAnomaly.longitude && (
                  <View style={styles.detailMediaColumn}>
                    <View style={styles.evidenceSection}>
                      <Text style={styles.evidenceTitle}>{t("location")}</Text>

                      <iframe
                        title="anomaly-location-map"
                        style={styles.detailMap}
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${(
                          selectedAnomaly.longitude - 0.01
                        ).toFixed(
                          4,
                        )},${(selectedAnomaly.latitude - 0.01).toFixed(4)},${(
                          selectedAnomaly.longitude + 0.01
                        ).toFixed(4)},${(
                          selectedAnomaly.latitude + 0.01
                        ).toFixed(
                          4,
                        )}&layer=mapnik&marker=${selectedAnomaly.latitude.toFixed(
                          4,
                        )},${selectedAnomaly.longitude.toFixed(4)}`}
                        frameBorder="0"
                        marginHeight="0"
                        marginWidth="0"
                        scrolling="no"
                      />
                    </View>
                  </View>
                )}
              </View>

              {!selectedAnomaly.is_resolved && (
                <View style={[{ flex: 2 }, styles.resolveBtnContainer]}>
                  {!selectedAnomaly.is_resolved && (
                    <Pressable
                      onPress={async (e) => {
                        e.stopPropagation?.();
                        setResolvingId(selectedAnomaly.id);
                        try {
                          await resolveAnomaly(selectedAnomaly.id);
                        } finally {
                          setResolvingId(null);
                          setSelectedAnomaly(null);
                        }
                      }}
                      
                      disabled={resolvingId === selectedAnomaly.id}
                      style={({ hovered }) => [
                        styles.resolveBtn,
                        hovered && styles.resolveBtnHover,
                        resolvingId === selectedAnomaly.id &&
                          styles.resolveBtnDisabled,
                      ]}
                    >
                      {resolvingId === selectedAnomaly.id ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text style={styles.resolveBtnText}>
                          {t("resolve")}
                        </Text>
                      )}
                    </Pressable>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    );
  };

  const filteredAnomalies = anomalies.filter((item) => {
    // status filter
    if (anomalyFilters.status === "active" && item.is_resolved) {
      return false;
    }

    if (anomalyFilters.status === "resolved" && !item.is_resolved) {
      return false;
    }

    // event type filter
    if (
      anomalyFilters.eventType.length > 0 &&
      !anomalyFilters.eventType.includes(item.event_type)
    ) {
      return false;
    }

    // time filter
    if (anomalyFilters.time !== "anytime") {
      const createdAt = new Date(item.created_at);
      const now = new Date();
      const start = new Date();

      if (anomalyFilters.time === "today") {
        start.setHours(0, 0, 0, 0);
      }

      if (anomalyFilters.time === "3_days") {
        start.setDate(now.getDate() - 3);
      }

      if (anomalyFilters.time === "1_week") {
        start.setDate(now.getDate() - 7);
      }

      if (createdAt < start) {
        return false;
      }
    }

    return true;
  });

  const anomalyPageSize = 10;

  const hasActiveAnomalyFilter =
    anomalyFilters.status !== "all" ||
    anomalyFilters.eventType.length > 0 ||
    anomalyFilters.time !== "anytime";

  const displayAnomalies = hasActiveAnomalyFilter
    ? filteredAnomalies.slice(
        (currentPage - 1) * anomalyPageSize,
        currentPage * anomalyPageSize,
      )
    : anomalies;

  const displayTotalElements = hasActiveAnomalyFilter
    ? filteredAnomalies.length
    : totalAnomalies;

  const displayTotalPages = hasActiveAnomalyFilter
    ? Math.ceil(filteredAnomalies.length / anomalyPageSize)
    : totalPages;

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
            <Text style={styles.retryBtnText}>{t("try_again")}</Text>
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
            <View style={[styles.tableInner, styles.anomalyTableInner]}>
              <FlatList
                style={styles.table}
                scrollEnabled={false}
                data={displayAnomalies}
                ListHeaderComponent={renderAnomalyHeader}
                renderItem={renderAnomalyItem}
                keyExtractor={(item) => item.id.toString()}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <AlertTriangle size={48} color="#d1d5db" />
                    <Text style={styles.emptyText}>
                      {t("no_anomalies_detected")}
                    </Text>
                  </View>
                }
              />
            </View>
          </ScrollView>
        </View>

        {displayTotalPages > 1 && (
          <PaginatedTableControls
            page={currentPage}
            totalPages={displayTotalPages}
            totalElements={displayTotalElements}
            size={anomalyPageSize}
            itemLabel={t("anomalies")}
            onPageChange={setCurrentPage}
          />
        )}
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
                    <Text style={styles.emptyText}>
                      {t("no_sensors_found")}
                    </Text>
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
        {selectedSensor && (
          <View style={styles.sensorDashboard}>
            <View style={styles.sensorDashboardHeader}>
              <Text style={styles.sensorDashboardTitle}>
                {selectedSensor ? selectedSensor.name : t("sensor_overview")}
              </Text>

              {selectedSensor ? (
                <StatusBadge value={selectedSensor.current_status} />
              ) : (
                <Text style={styles.mutedText}>{t("select_sensor_to_view_details")}</Text>
              )}
            </View>

            <View style={styles.sensorDashboardContent}>
              <View style={styles.sensorMapCard}>
                <Text style={styles.dashboardCardTitle}>{t("location")}</Text>

                <iframe
                  title="sensor-map"
                  style={styles.sensorMap}
                  src={
                    selectedSensor?.latitude && selectedSensor?.longitude
                      ? `https://www.openstreetmap.org/export/embed.html?bbox=${(
                          selectedSensor.longitude - 0.01
                        ).toFixed(4)},${(selectedSensor.latitude - 0.01).toFixed(4)},${(
                          selectedSensor.longitude + 0.01
                        ).toFixed(4)},${(selectedSensor.latitude + 0.01).toFixed(
                          4
                        )}&layer=mapnik&marker=${selectedSensor.latitude.toFixed(
                          4
                        )},${selectedSensor.longitude.toFixed(4)}`
                      : "https://www.openstreetmap.org/export/embed.html?bbox=110.25,1.45,110.45,1.65&layer=mapnik"
                  }
                />
              </View>

              <View style={styles.sensorChartCard}>
                <Text style={styles.dashboardCardTitle}>{t("sensor_readings")}</Text>

                <View style={styles.chartWrapper}>
                  <Line data={sensorChartData} options={sensorChartOptions} />
                </View>
              </View>
            </View>

            {selectedSensor && (
              <View style={styles.sensorLogsSection}>
                <FlatList
                  style={styles.table}
                  scrollEnabled={false}
                  data={sensorLogsState.data}
                  ListHeaderComponent={renderSensorLogsHeader}
                  renderItem={renderSensorLogItem}
                  keyExtractor={(item) => item.id.toString()}
                />

                <PaginatedTableControls
                  page={sensorLogsPage}
                  totalPages={sensorLogsState.totalPages}
                  totalElements={sensorLogsState.totalElements}
                  size={sensorLogsState.size}
                  itemLabel={t("sensor_logs")}
                  onPageChange={setSensorLogsPage}
                />
              </View>
            )}
          </View>
        )}
        
      </>
    );
  };

  return (
    <ScrollView
      style={styles.pageScroll}
      contentContainerStyle={styles.container}
    >
      <View>
        <Text style={styles.title}>{t("anomaly_detection")}</Text>
        <Text style={styles.subtitle}>{t("sensor_inventory_tracking")}</Text>
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

      {activeTab === TABS.ANOMALIES && (
        <View style={styles.filterButtonRow}>
          <Pressable
            style={({ hovered }) => [
              styles.filter,
              hovered && styles.filterHover,
            ]}
            onPress={() => {
              setTempAnomalyFilters(anomalyFilters);
              setFilterVisible(true);
            }}
          >
            <SlidersHorizontal
              color={
                anomalyFilters.status !== "all" ||
                anomalyFilters.eventType.length > 0 ||
                anomalyFilters.time !== "anytime"
                  ? "#0a6340"
                  : "#6b7280"
              }
            />
          </Pressable>
        </View>
      )}

      <View style={styles.panel}>
        {activeTab === TABS.ANOMALIES
          ? renderAnomalyTableState()
          : renderSensorState()}
      </View>

      {activeTab === TABS.ANOMALIES ? renderAnomalyDetailModal() : null}
      {activeTab === TABS.ANOMALIES && <AnomalyFilterSidebar />}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  pageScroll: {
    flex: 1,
    backgroundColor: "#f8faf7",
    minHeight: "100vh",
  },
  container: {
    paddingVertical: 24,
    paddingHorizontal: 28,
    gap: 16,
    minHeight: "100vh",
  },
  headerRow: {
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: {
    color: "white",
    alignSelf: "center",
    fontWeight: "500",
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
    backgroundColor: "transparent",
  },
  row: {
    flexDirection: "row",
  },
  tableContainer: {
    width: "100%",
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
    paddingVertical: 8,
    userSelect: "none",
  },
  headerPressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
  },
  headerCell: {
    color: "white",
    alignSelf: "center",
    fontWeight: "500",
  },
  headerPressableCell: {
    flexDirection: "row",
    alignSelf: "center",
    gap: 10,
    paddingHorizontal: 10,
  },
  tableRow: {
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#8f8f8f84",
    alignItems: "center",
  },
  cellText: {
    color: "#1f2933",
    paddingHorizontal: 10,
  },
  cellContent: {
    flexDirection: "row",
  },
  resolveBtnContainer: {
    alignSelf: "flex-start",
  },
  centeredText: {
    textAlign: "center",
  },
  centeredCell: {
    alignSelf: "center",
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
    flex: 1,
  },
  sensorTypeCell: {
    flex: 2,
  },
  sensorLocationCell: {
    flex: 3,
  },
  sensorNameLocationCell: {
    flex: 2,
  },
  sensorCoordinateCell: {
    flex: 2,
  },
  sensorNameHover: {
    textDecorationLine: "underline",
  },
  sensorStatusCell: {
    flex:1,
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
  },
  logDataCell: {
    flex: 1.8,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  logDateCell: {
    width: 200,
  },
  sensorLogDataWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  sensorLogDataChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
  },
  sensorLogDataLabel: {
    color: "#6b7280",
    fontSize: 11,
    fontWeight: "700",
  },
  sensorLogDataValue: {
    color: "#111827",
    fontSize: 12,
    fontWeight: "600",
  },
  sensorLogSingleValue: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "600",
  },
  sensorLogEmptyValue: {
    color: "#9ca3af",
    fontSize: 13,
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
    color: "#059669",
    fontWeight: "500",
    fontFamily: "monospace",
  },
  statusBadge: {
    flexDirection: "row",
    alignSelf: "flex-start",
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
    alignSelf: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
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
    alignSelf: "center",
    gap: 4,
    paddingHorizontal: 14,
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
    paddingHorizontal: 15,
    paddingVertical: 10,
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
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: "white",
  },
  paginationControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  pageInfo: {
    color: "#5b6b63",
    fontSize: 14,
  },
  pageBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    backgroundColor: "#ffc758",
    borderColor: "#ffc758",
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
    paddingHorizontal: 20,
    paddingTop: 84,
    paddingBottom: 24,
    zIndex: 9999,
    elevation: 9999,
    cursor: "default",
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
  anomalyDetailModalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    width: "92%",
    maxWidth: 820,
    maxHeight: "calc(100vh - 120px)",
    zIndex: 10000,
    elevation: 10000,
  },
  detailSubtitle: {
    marginTop: 4,
    color: "#6b7280",
    fontSize: 12,
  },
  detailScroll: {
    flexGrow: 0,
  },
  detailScrollContent: {
    padding: 16,
    paddingBottom: 20,
  },
  detailMetaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  detailMetaItem: {
    flexGrow: 1,
    minWidth: 180,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#f9fafb",
  },
  detailMap: {
    width: "100%",
    height: 280,
    border: "none",
    borderRadius: 8,
  },
  detailMediaRow: {
    flexDirection: "row",
    gap: 14,
    alignItems: "stretch",
  },
  detailMediaColumn: {
    flex: 1,
  },
  evidenceSection: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    backgroundColor: "#ffffff",
  },
  evidenceTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  evidenceGrid: {
    gap: 8,
  },
  evidenceRow: {
    flexDirection: "row",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingBottom: 10,
    alignItems: "flex-start",
  },
  evidenceLabel: {
    width: 140,
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "700",
  },
  evidenceValue: {
    flex: 1,
    color: "#111827",
    fontSize: 13,
  },
  evidenceValueContainer: {
    flex: 1,
    minWidth: 0,
  },
  evidenceChipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  evidenceChip: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    borderWidth: 1,
    borderRadius: 999,
    color: "#047857",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  evidenceObjectList: {
    gap: 6,
  },
  evidenceObjectRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: "#f9fafb",
    borderRadius: 6,
  },
  evidenceObjectKey: {
    width: 130,
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "700",
  },
  evidenceObjectValue: {
    flex: 1,
    color: "#111827",
    fontSize: 12,
  },
  evidenceImage: {
    width: "100%",
    height: 320,
    objectFit: "contain",
    borderRadius: 8,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  emptyEvidence: {
    padding: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#d1d5db",
    borderRadius: 8,
    backgroundColor: "#f9fafb",
  },
  emptyEvidenceText: {
    color: "#6b7280",
    fontSize: 13,
  },
  resolveDetailBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: "#0a6340",
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
    marginBottom: 16,
  },
  filterButtonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  filter: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingRight: 10,
    borderRadius: 5,
  },
  filterHover: {
    color: "#efab21",
  },
  filterBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 10,
  },
  filterSidebar: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 280,
    backgroundColor: "white",
    padding: 20,
    zIndex: 20,
    elevation: 20,
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  filterSection: {
    marginBottom: 22,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#444",
    marginBottom: 10,
  },
  filterItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  filterItemText: {
    fontSize: 14,
    color: "#333",
  },
  filterItemTextActive: {
    color: "#0a6340",
    fontWeight: "600",
  },
  filterButtons: {
    marginTop: "auto",
    gap: 10,
  },
  applyBtn: {
    backgroundColor: "#2f6618fe",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  resetBtn: {
    backgroundColor: "gray",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  filterBtnText: {
    color: "white",
    fontWeight: "600",
  },
  sensorDashboard: {
    marginTop: 20,
    gap: 16,
  },

  sensorDashboardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sensorDashboardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#102219",
  },

  sensorDashboardContent: {
    flexDirection: "row",
    gap: 16,
  },

  sensorMapCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
  },

  sensorChartCard: {
    flex: 1.4,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
  },

  dashboardCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
  },

  sensorMap: {
    width: "100%",
    height: 320,
    border: "none",
    borderRadius: 8,
  },

  sensorLogsSection: {
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
  },
  chartWrapper: {
    width: "100%",
    height: 300,
  },
  rowContainerRelative: {
    position: "relative",
    width: "100%",
  },
  rowTooltip: {
    position: "absolute",
    backgroundColor: "#1e293b",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    zIndex: 9999,
    pointerEvents: "none", 
    ...Platform.select({
      web: { whiteSpace: "nowrap" }
    })
  },
  tooltipText: {
    color: "white",
    fontSize: 11,
    fontWeight: "500",
  },
  cellText: {
    color: "#334155",
    paddingHorizontal: 10,
    alignSelf: "center",
    ...Platform.select({
      web: {
        transition: "color 0.15s ease",
      }
    })
  },
  cellTextHover: {
    color: "#1b5e20",
    ...Platform.select({
      web: {
        textDecorationLine: "underline",
      }
    })
  },
});

export default AnomalyDetection;
