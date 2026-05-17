import {
  AlertTriangle,
  Book,
  CheckCircle,
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
  TileLayer,
  useMap,
} from "react-leaflet";

import { useAnomalyMapEvents } from "../hooks/useAnomalyMapEvents";
import { AnomalyService } from "../services/AnomalyService";
import { formatDate } from "../utils/formatDate";
import {
  DEFAULT_MAP_CENTER,
  SEVERITY_CONFIG,
  EVENT_LABELS,
} from "../utils/AnomalyConstant";
import { useAdminDashboard } from "../hooks/useAdminDashboard";
import { useNotification } from "../hooks/useNotification";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { navigateNotification } from "../utils/navigateNotification";

/* ---------------- Helpers ---------------- */

const getEventTypeLabel = (eventType) =>
  EVENT_LABELS[eventType?.toLowerCase()] || eventType || "Unknown";

const getEventSeverity = (type) => {
  const t = type?.toLowerCase();
  if (["forest_fire", "flooding"].includes(t)) return "high";
  if (
    [
      "plucking_plants",
      "hitting_animal",
      "trespassing",
      "loud_noise",
    ].includes(t)
  )
    return "high";
  return "low";
};

const getUserLabel = (event) => {
  const user = event.user;
  return (
    [user?.firstname, user?.lastname].filter(Boolean).join(" ") ||
    user?.username ||
    `User ${event.user_id}`
  );
};

const getMapCenter = (events) => {
  if (!events.length) return DEFAULT_MAP_CENTER;

  const sum = events.reduce(
    (acc, e) => ({
      lat: acc.lat + Number(e.latitude),
      lng: acc.lng + Number(e.longitude),
    }),
    { lat: 0, lng: 0 }
  );

  return [sum.lat / events.length, sum.lng / events.length];
};

/* ---------------- Map Viewport ---------------- */

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
        15
      );
      return;
    }

    map.fitBounds(
      events.map((e) => [Number(e.latitude), Number(e.longitude)]),
      { padding: [30, 30], maxZoom: 15 }
    );
  }, [events, center, map]);

  return null;
};

/* ---------------- Hover Card ---------------- */

const HoverDetailCard = ({ event, isPinned, onResolve, resolving }) => {
  const severity = getEventSeverity(event.event_type);

  return (
    <View style={styles.hoverCard}>
      <Text style={styles.hoverTitle}>
        {getEventTypeLabel(event.event_type)}
      </Text>

      <Text style={styles.hoverRow}>
        Time: {formatDate(event.created_at)}
      </Text>

      <Text style={styles.hoverRow}>
        User: {getUserLabel(event)}
      </Text>

      <Text style={styles.hoverRow}>
        Lat/Lng: {Number(event.latitude)}, {Number(event.longitude)}
      </Text>

      {isPinned && (
        <Pressable
          onPress={onResolve}
          disabled={resolving}
          style={styles.resolveBtn}
        >
          {resolving ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <CheckCircle size={14} color="white" />
              <Text style={styles.resolveBtnText}>Resolve</Text>
            </>
          )}
        </Pressable>
      )}
    </View>
  );
};

/* ---------------- MAIN COMPONENT ---------------- */

const AdminDashboard = () => {
  const { events, loading, error, refresh } = useAnomalyMapEvents();
  const { stats } = useAdminDashboard();
  const { notifications, fetchNotifications } = useNotification();
  const { currentUser } = useAuth();
  const navigation = useNavigation();

  const { width } = useWindowDimensions();
  const isCompact = width < 1200;

  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [resolvingId, setResolvingId] = useState(null);

  const mapCenter = useMemo(() => getMapCenter(events), [events]);

  const severityCounts = useMemo(() => {
    return events.reduce(
      (acc, e) => {
        acc[getEventSeverity(e.event_type)]++;
        return acc;
      },
      { high: 0, low: 0 }
    );
  }, [events]);

  const handleResolve = async (event) => {
    setResolvingId(event.id);
    try {
      await AnomalyService.resolve(event.id);
      setSelected(null);
      refresh();
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <ScrollView style={styles.screen}>
      <View style={styles.cards}>
        <Text>Total Users: {stats.totalUsers}</Text>
        <Text>Total Courses: {stats.totalCourses}</Text>
        <Text>Total Enrollments: {stats.totalEnrollments}</Text>
        <Text>Active Anomalies: {severityCounts.high}</Text>
      </View>

      {/* MAP */}
      <View style={styles.mapContainer}>
        {loading ? (
          <ActivityIndicator />
        ) : error ? (
          <Text>Error loading map</Text>
        ) : (
          <MapContainer center={mapCenter} zoom={13} style={styles.map}>
            <MapViewport events={events} center={mapCenter} />

            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {events.map((event) => {
              const severity = getEventSeverity(event.event_type);

              return (
                <CircleMarker
                  key={event.id}
                  center={[
                    Number(event.latitude),
                    Number(event.longitude),
                  ]}
                  radius={8}
                  pathOptions={{
                    color: severity === "high" ? "red" : "green",
                    fillOpacity: 0.7,
                  }}
                  eventHandlers={{
                    click: () =>
                      setSelected((prev) =>
                        prev?.id === event.id ? null : event
                      ),
                    mouseover: () => setHovered(event),
                    mouseout: () => setHovered(null),
                  }}
                />
              );
            })}
          </MapContainer>
        )}

        {/* Hover Card */}
        {(selected || hovered) && (
          <HoverDetailCard
            event={selected || hovered}
            isPinned={!!selected}
            onResolve={() => handleResolve(selected)}
            resolving={resolvingId === selected?.id}
          />
        )}
      </View>

      {/* NOTIFICATIONS */}
      <View style={styles.notifications}>
        {notifications?.map((n) => (
          <Text key={n.id}>{n.title}</Text>
        ))}
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
  resolveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: "#0a6340",
    borderRadius: 6,
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
});

const webStyles = {
  map: {
    width: "100%",
    height: "100%",
    zIndex: 0,
  },
};

export default AdminDashboard;
