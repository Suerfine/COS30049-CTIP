import {
  AlertTriangle,
  Book,
  ClipboardList,
  Flag,
  MapPin,
  RefreshCcw,
  User,
  RotateCcw,
  Pin,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";

import apiClient from "../config/apiConfig";
import { useAnomalyMapEvents } from "../hooks/useAnomalyMapEvents";
import { formatDate } from "../utils/formatDate";
import {
  DEFAULT_MAP_CENTER,
  LEAFLET_CSS,
  EVENT_LABELS,
  getSeverityConfig,
} from "../utils/AnomalyConstant";
import { useAdminDashboard } from "../hooks/useAdminDashboard";
import { useNotification } from "../hooks/useNotification";
import { useAuth } from "../context/AuthContext";
import { navigateNotification } from "../utils/navigateNotification";

const getEventTypeLabel = (eventType) => {
  if (!eventType) {
    return "Unknown";
  }

  return EVENT_LABELS[eventType.toLowerCase()] || eventType;
};

const getEventSeverity = (eventType) => {
  const normalizedType = eventType?.toLowerCase();

  if (["forest_fire", "flooding"].includes(normalizedType)) {
    return "high";
  }

  if (
    [
      "plucking_plants",
      "hitting_animal",
      "extended_plant_touch",
      "extended_animal_touch",
      "loud_noise",
      "trespassing",
    ].includes(normalizedType)
  ) {
    return "high";
  }

  return "low";
};

const getUserLabel = (event) => {
  const user = event.user;
  const fullName = [user?.firstname, user?.lastname].filter(Boolean).join(" ");

  return fullName || user?.username || `User ${event.user_id || "-"}`;
};

const getConfidenceLabel = (metadata) => {
  const rawConfidence = metadata?.detection_confidence ?? metadata?.confidence;
  const confidence = Number(rawConfidence);

  if (!Number.isFinite(confidence)) {
    return null;
  }

  return `${Math.round(confidence * 100)}%`;
};

const getMapCenter = (events) => {
  if (!events.length) {
    return DEFAULT_MAP_CENTER;
  }

  const totals = events.reduce(
    (acc, event) => ({
      latitude: acc.latitude + Number(event.latitude),
      longitude: acc.longitude + Number(event.longitude),
    }),
    { latitude: 0, longitude: 0 },
  );

  return [totals.latitude / events.length, totals.longitude / events.length];
};

const MapViewport = ({ events, center }) => {
  const map = useMap();

  useEffect(() => {
    if (!events.length) {
      map.setView(center, 13);
      return;
    }

    if (events.length === 1) {
      map.setView(
        [Number(events[0].latitude), Number(events[0].longitude)],
        15,
      );
      return;
    }

    map.fitBounds(
      events.map((event) => [Number(event.latitude), Number(event.longitude)]),
      {
        padding: [28, 28],
        maxZoom: 15,
      },
    );
  }, [center, events, map]);

  return null;
};

const HoverDetailCard = ({ event, isPinned, resolvingId, onResolve }) => {
  const { t } = useTranslation();
  const severityConfig = getSeverityConfig();
  const severity = getEventSeverity(event.event_type);
  const confidence = getConfidenceLabel(event.metadata);

  return (
    <View style={styles.hoverCard}>
      <View style={styles.hoverHeader}>
        <Text style={styles.hoverTitle}>
          {getEventTypeLabel(event.event_type)}
        </Text>

        <View
          style={[
            styles.hoverBadge,
            { backgroundColor: severityConfig[severity].fillColor },
          ]}
        >
          <Text style={styles.hoverBadgeText}>
            {severityConfig[severity].label}
          </Text>
        </View>
      </View>
      <Text style={styles.hoverRow}>
        {t("detected")}: {formatDate(event.created_at)}
      </Text>
      <Text style={styles.hoverRow}>
        {t("coordinates")}: {Number(event.latitude).toFixed(6)},{" "}
        {Number(event.longitude).toFixed(6)}
      </Text>
      <Text style={styles.hoverRow}>
        {t("users")}: {getUserLabel(event)}
      </Text>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        {confidence ? (
          <Text style={styles.hoverRow}>
            {t("confidence")}: {confidence}
          </Text>
        ) : null}
        {isPinned && <Pin size={14} color="#b96363" fill="#b96363" />}
      </View>
      {isPinned && !event.is_resolved ? (
        <Pressable
          onPress={() => onResolve?.(event.id)}
          disabled={resolvingId === event.id}
          style={({ pressed }) => [
            styles.resolveBtn,
            resolvingId === event.id && styles.resolveBtnDisabled,
            pressed && !resolvingId && styles.resolveBtnPressed,
          ]}
        >
          <Text style={styles.resolveText}>
            {resolvingId === event.id ? "Resolving..." : "Mark as Resolved"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const AdminDashboard = () => {
  const { t } = useTranslation();
  const severityConfig = getSeverityConfig();
  const navigation = useNavigation();
  const { currentUser } = useAuth();
  const {
    events,
    loading: mapLoading,
    error: mapError,
    refresh,
  } = useAnomalyMapEvents();
  const { stats } = useAdminDashboard();
  const {
    notifications,
    loading: notificationsLoading,
    error: notificationsError,
    fetchNotifications,
  } = useNotification();
  const [resolvingAnomalyId, setResolvingAnomalyId] = useState(null);

  const [hoveredAnomaly, setHoveredAnomaly] = useState(null);
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const { width } = useWindowDimensions();
  const isCompact = width < 1200;
  const mapCenter = useMemo(() => getMapCenter(events), [events]);

  const severityCounts = useMemo(
    () =>
      events.reduce(
        (acc, event) => {
          acc[getEventSeverity(event.event_type)] += 1;
          return acc;
        },
        { high: 0, medium: 0, low: 0 },
      ),
    [events],
  );

  const latestNotifications = useMemo(() => {
    return (notifications || [])
      .slice()
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 20);
  }, [notifications]);

  const resolveAnomaly = async (eventId) => {
    if (!eventId) return;
    setResolvingAnomalyId(eventId);
    try {
      try {
        await apiClient.post(`/anomaly-events/${eventId}/resolve`);
      } catch (firstError) {
        await apiClient.post(`/Anomaly-events/${eventId}/resolve`);
      }
      setSelectedAnomaly(null);
      setHoveredAnomaly(null);
      refresh();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to resolve anomaly event.";
      alert(message);
    } finally {
      setResolvingAnomalyId(null);
    }
  };

  return (
    <ScrollView style={styles.screenContainer}>
      <style>{LEAFLET_CSS}</style>
      <View style={[styles.cards, isCompact && styles.cardsCompact]}>
        <View style={[styles.adminCard, isCompact && styles.adminCardCompact]}>
          <View>
            <Text style={styles.label}>
              {t("total")} {t("users")}
            </Text>
            <Text style={styles.value}>{stats.totalUsers}</Text>
          </View>
          <View style={[styles.iconContainer, styles.usersTheme]}>
            <User size={30} color="#4338ca" />
          </View>
        </View>
        <View style={[styles.adminCard, isCompact && styles.adminCardCompact]}>
          <View>
            <Text style={styles.label}>
              {t("total")} {t("courses")}
            </Text>
            <Text style={styles.value}>{stats.totalCourses}</Text>
          </View>
          <View style={[styles.iconContainer, styles.coursesTheme]}>
            <Book size={30} color="#ea580c" />
          </View>
        </View>
        <View style={[styles.adminCard, isCompact && styles.adminCardCompact]}>
          <View>
            <Text style={styles.label}>
              {t("total")} {t("enrollments")}
            </Text>
            <Text style={styles.value}>{stats.totalEnrollments}</Text>
          </View>
          <View style={[styles.iconContainer, styles.enrollTheme]}>
            <ClipboardList size={30} color="#16a34a" />
          </View>
        </View>
        <View style={[styles.adminCard, isCompact && styles.adminCardCompact]}>
          <View>
            <Text style={styles.label}>{t("mapped anomalies")}</Text>
            <Text style={styles.value}>{stats.totalAnomalies}</Text>
          </View>
          <View style={[styles.iconContainer, styles.alertTheme]}>
            <Flag size={30} color="#dc2626" />
          </View>
        </View>
      </View>

      <View style={[styles.mapRow, isCompact && styles.mapRowCompact]}>
        <View
          style={[styles.mapSection, isCompact && styles.mapSectionCompact]}
        >
          <View
            style={[styles.mapHeader, isCompact && styles.mapHeaderCompact]}
          >
            <View>
              <Text style={styles.mapTitle}>{t("anomaly map")}</Text>
              <Text style={styles.mapSubtitle}>
                {t("all anomaly events with valid coordinates")}
              </Text>
            </View>
            <View
              style={[styles.mapActions, isCompact && styles.mapActionsCompact]}
            >
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: severityConfig.high.fillColor },
                    ]}
                  />
                  <Text style={styles.legendText}>
                    {t("anomaly live count")}: {severityCounts.high}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={refresh}
                style={({ hovered }) => [
                  styles.refreshBtn,
                  hovered && styles.refreshBtnHover,
                ]}
              >
                <RefreshCcw size={17} color="#0a6340" />
                <Text style={styles.refreshText}>{t("refresh")}</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.mapShell}>
            {mapLoading ? (
              <View style={styles.mapState}>
                <ActivityIndicator size="large" color="#0a6340" />
                <Text style={styles.stateText}>
                  {t("loading")} {t("anomaly map")}...
                </Text>
              </View>
            ) : mapError ? (
              <View style={styles.mapState}>
                <AlertTriangle size={42} color="#dc2626" />
                <Text style={styles.errorText}>
                  {t("failed to load anomaly map")}
                </Text>
                <Text style={styles.errorDetail}>{mapError}</Text>
                <Pressable
                  onPress={refresh}
                  style={({ hovered }) => [
                    styles.retryBtn,
                    hovered && styles.retryBtnHover,
                  ]}
                >
                  <Text style={styles.retryText}>{t("try again")}</Text>
                </Pressable>
              </View>
            ) : (
              <MapContainer
                center={mapCenter}
                zoom={13}
                scrollWheelZoom
                style={webStyles.map}
              >
                <MapViewport events={events} center={mapCenter} />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {events.map((event) => {
                  const severity = getEventSeverity(event.event_type);
                  const config = severityConfig[severity];

                  return (
                    <CircleMarker
                      key={event.id}
                      center={[Number(event.latitude), Number(event.longitude)]}
                      radius={8}
                      eventHandlers={{
                        mouseover: () => setHoveredAnomaly(event),
                        mouseout: () => setHoveredAnomaly(null),
                        click: () => {
                          setSelectedAnomaly((prev) =>
                            prev?.id === event.id ? null : event,
                          );
                        },
                      }}
                      pathOptions={{
                        color:
                          selectedAnomaly?.id === event.id
                            ? "#161515"
                            : config.color,
                        fillColor: config.fillColor,
                        fillOpacity: 0.82,
                        weight: selectedAnomaly?.id === event.id ? 3 : 2,
                      }}
                    ></CircleMarker>
                  );
                })}
              </MapContainer>
            )}

            {!mapLoading && !mapError && (selectedAnomaly || hoveredAnomaly) ? (
              <HoverDetailCard
                event={selectedAnomaly || hoveredAnomaly}
                isPinned={!!selectedAnomaly}
                resolvingId={resolvingAnomalyId}
                onResolve={resolveAnomaly}
              />
            ) : null}

            {!mapLoading && !mapError && events.length === 0 ? (
              <View style={styles.emptyOverlay}>
                <MapPin size={32} color="#9ca3af" />
                <Text style={styles.emptyText}>
                  {t("no coordinate-bearing anomalies found")}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View
          style={[
            styles.latestUpdatesSection,
            isCompact && styles.latestUpdatesSectionCompact,
          ]}
        >
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>{t("latest updates")}</Text>
              <Text style={styles.sectionSubtitle}>
                20 {t("most recent notifications")}
              </Text>
            </View>
            <Pressable
              onPress={fetchNotifications}
              disabled={notificationsLoading}
              style={styles.refreshBtn}
            >
              <RotateCcw size={20} color="#666" />
            </Pressable>
          </View>

          {notificationsError ? (
            <View style={styles.centerContainer}>
              <Text style={styles.errorText}>
                {t("failed to load updates")}
              </Text>
              <Text style={styles.errorDetail}>{notificationsError}</Text>
            </View>
          ) : notificationsLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#2f6618fe" />
            </View>
          ) : latestNotifications.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>{t("no notifications")}</Text>
            </View>
          ) : (
            <ScrollView style={styles.latestUpdatesList}>
              {latestNotifications.map((notification) => (
                <Pressable
                  key={notification.id}
                  onPress={() =>
                    navigateNotification(
                      navigation,
                      notification.url,
                      currentUser,
                    )
                  }
                  style={({ hovered, pressed }) => [
                    styles.notificationItem,
                    hovered && styles.notificationItemHover,
                    pressed && styles.notificationItemPressed,
                  ]}
                >
                  <View style={styles.notificationContent}>
                    <View style={styles.titleRow}>
                      <Text style={styles.notificationTitle}>
                        {notification.title}
                      </Text>
                    </View>
                    <Text style={styles.notificationMessage}>
                      {notification.message}
                    </Text>
                    <Text style={styles.notificationDate}>
                      {new Date(notification.created_at).toLocaleDateString()}{" "}
                      at{" "}
                      {new Date(notification.created_at).toLocaleTimeString(
                        [],
                        { hour: "2-digit", minute: "2-digit" },
                      )}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    height: "100vh",
    backgroundColor: "#f6f8f7",
    padding: 20,
    gap: 20,
    overflow: "hidden",
  },
  content: {
    paddingVertical: 20,
    paddingHorizontal: 40,
    gap: 24,
  },
  adminCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: 250,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    flex: 1,
  },
  adminCardCompact: {
    width: "48%",
    minWidth: "48%", // Ensures explicit control over width bounds
    flex: 0,
  },
  label: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  iconContainer: {
    backgroundColor: "#f0f7f4",
    padding: 10,
    borderRadius: 8,
  },
  cards: {
    flexDirection: "row",
    gap: 25,
    flexWrap: "nowrap",
    marginHorizontal: 20,
    marginVertical: 10,
    minHeight: 120,
  },
  cardsCompact: {
    flexWrap: "wrap",
    height: "auto",
    justifyContent: "space-between",
    gap: 10,
  },
  usersTheme: { backgroundColor: "#eef2ff" },
  coursesTheme: { backgroundColor: "#fff7ed" },
  enrollTheme: { backgroundColor: "#f0fdf4" },
  alertTheme: { backgroundColor: "#fef2f2" },
  mapRow: {
    flex: 1,
    flexDirection: "row",
    gap: 20,
    minHeight: 560,
    paddingHorizontal: 20,
  },
  mapRowCompact: {
    flexDirection: "column",
    minHeight: 0,
  },
  mapSection: {
    backgroundColor: "white",
    borderRadius: 8,
    overflow: "hidden",
    flex: 2,
    minWidth: 520,
    minHeight: 560,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  mapSectionCompact: {
    minWidth: 0,
    minHeight: 0,
  },
  latestUpdatesSection: {
    backgroundColor: "white",
    borderRadius: 8,
    overflow: "hidden",
    flex: 1,
    minWidth: 360,
    minHeight: 560,
    maxHeight: 560,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  latestUpdatesSectionCompact: {
    minWidth: 0,
    minHeight: 0,
    maxHeight: "none",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  sectionSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#6b7280",
  },
  latestUpdatesList: {
    maxHeight: 520,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  mapHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    zIndex: 1000,
  },
  mapHeaderCompact: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  mapTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  mapSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#6b7280",
  },
  mapActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  mapActionsCompact: {
    width: "100%",
    justifyContent: "space-between",
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: "#4b5563",
    fontWeight: "500",
  },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    backgroundColor: "#f0fdf4",
  },
  refreshBtnHover: {
    backgroundColor: "#dcfce7",
  },
  refreshText: {
    color: "#0a6340",
    fontWeight: "600",
    fontSize: 13,
  },
  mapShell: {
    flex: 1,
    position: "relative",
  },
  mapState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  stateText: {
    marginTop: 12,
    color: "#6b7280",
    fontSize: 14,
  },
  errorText: {
    marginTop: 12,
    color: "#dc2626",
    fontSize: 16,
    fontWeight: "700",
  },
  errorDetail: {
    marginTop: 8,
    color: "#6b7280",
    textAlign: "center",
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: "#0a6340",
    borderRadius: 6,
  },
  retryBtnHover: {
    backgroundColor: "#065f2e",
  },
  retryText: {
    color: "white",
    fontWeight: "700",
  },
  emptyOverlay: {
    position: "absolute",
    top: 20,
    left: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    boxShadow: "0 8px 20px rgba(15, 23, 42, 0.12)",
  },
  emptyText: {
    color: "#6b7280",
    fontWeight: "600",
  },
  hoverCard: {
    position: "absolute",
    top: 18,
    right: 18,
    width: 250,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    boxShadow: "0 14px 30px rgba(15, 23, 42, 0.18)",
    zIndex: 1200,
  },
  hoverHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 8,
  },
  hoverTitle: {
    flex: 1,
    color: "#111827",
    fontWeight: "700",
    fontSize: 14,
  },
  hoverBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  hoverBadgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "700",
  },
  hoverRow: {
    color: "#4b5563",
    fontSize: 12,
    lineHeight: 18,
  },
  resolveBtn: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#065f46",
    borderRadius: 8,
    alignItems: "center",
  },
  resolveBtnPressed: {
    opacity: 0.9,
  },
  resolveBtnDisabled: {
    opacity: 0.6,
  },
  resolveText: {
    color: "white",
    fontWeight: "700",
    fontSize: 12,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 220,
    paddingHorizontal: 20,
  },
  notificationItem: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    cursor: "pointer",
  },
  notificationItemHover: {
    borderColor: "#b7d5b0",
    backgroundColor: "#fbfdfb",
  },
  notificationItemPressed: {
    opacity: 0.88,
  },
  notificationContent: {
    flex: 1,
    marginRight: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  notificationMessage: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationDate: {
    fontSize: 12,
    color: "#9ca3af",
  },
  notificationActions: {
    paddingLeft: 10,
  },
  dismissBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    transitionDuration: "150ms",
  },
  dismissBtnHover: {
    backgroundColor: "#fee2e2",
  },
});

const webStyles = {
  map: {
    width: "100%",
    height: "100%",
    zIndex: 0,
  },
};

export default AdminDashboard;
