import { AlertTriangle, Book, ClipboardList, Flag, MapPin, RefreshCcw, User } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";

import { useAnomalyMapEvents } from "../hooks/useAnomalyMapEvents";
import { formatDate } from "../utils/formatDate";

const DEFAULT_MAP_CENTER = [1.5533, 110.3592];

const LEAFLET_CSS = `
.leaflet-container {
  background: #dbe7ef;
  font-family: inherit;
  overflow: hidden;
  position: relative;
  touch-action: pan-x pan-y;
}
.leaflet-pane,
.leaflet-tile,
.leaflet-marker-icon,
.leaflet-marker-shadow,
.leaflet-tile-container,
.leaflet-pane > svg,
.leaflet-pane > canvas,
.leaflet-zoom-box,
.leaflet-image-layer,
.leaflet-layer {
  left: 0;
  position: absolute;
  top: 0;
}
.leaflet-pane > svg {
  pointer-events: none;
}
.leaflet-container img {
  max-width: none !important;
  max-height: none !important;
}
.leaflet-tile {
  filter: inherit;
  user-select: none;
  visibility: hidden;
}
.leaflet-tile-loaded {
  visibility: inherit;
}
.leaflet-map-pane canvas,
.leaflet-map-pane svg {
  z-index: 200;
}
.leaflet-tile-pane {
  z-index: 200;
}
.leaflet-overlay-pane {
  z-index: 400;
}
.leaflet-shadow-pane {
  z-index: 500;
}
.leaflet-marker-pane {
  z-index: 600;
}
.leaflet-tooltip-pane {
  z-index: 650;
}
.leaflet-popup-pane {
  z-index: 700;
}
.leaflet-control {
  position: relative;
  z-index: 800;
  pointer-events: visiblePainted;
  pointer-events: auto;
}
.leaflet-top,
.leaflet-bottom {
  pointer-events: none;
  position: absolute;
  z-index: 1000;
}
.leaflet-top {
  top: 0;
}
.leaflet-right {
  right: 0;
}
.leaflet-bottom {
  bottom: 0;
}
.leaflet-left {
  left: 0;
}
.leaflet-control {
  clear: both;
  float: left;
}
.leaflet-right .leaflet-control {
  float: right;
}
.leaflet-top .leaflet-control {
  margin-top: 10px;
}
.leaflet-bottom .leaflet-control {
  margin-bottom: 10px;
}
.leaflet-left .leaflet-control {
  margin-left: 10px;
}
.leaflet-right .leaflet-control {
  margin-right: 10px;
}
.leaflet-control-zoom {
  border: 1px solid rgba(0, 0, 0, 0.18);
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.14);
  overflow: hidden;
}
.leaflet-control-zoom a {
  background: #fff;
  border-bottom: 1px solid #d1d5db;
  color: #111827;
  display: block;
  font-size: 18px;
  font-weight: 700;
  height: 30px;
  line-height: 30px;
  text-align: center;
  text-decoration: none;
  width: 30px;
}
.leaflet-control-zoom a:last-child {
  border-bottom: 0;
}
.leaflet-control-attribution {
  background: rgba(255, 255, 255, 0.86);
  color: #4b5563;
  font-size: 11px;
  padding: 2px 6px;
}
.leaflet-control-attribution a {
  color: #0f766e;
}
.leaflet-popup {
  margin-bottom: 20px;
  position: absolute;
  text-align: center;
}
.leaflet-popup-content-wrapper {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.2);
  padding: 1px;
  text-align: left;
}
.leaflet-popup-content {
  line-height: 1.4;
  margin: 14px 16px;
}
.leaflet-popup-tip-container {
  height: 20px;
  left: 50%;
  margin-left: -20px;
  overflow: hidden;
  pointer-events: none;
  position: absolute;
  width: 40px;
}
.leaflet-popup-tip {
  background: #fff;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.16);
  height: 16px;
  margin: -8px auto 0;
  transform: rotate(45deg);
  width: 16px;
}
.leaflet-popup-close-button {
  color: #6b7280;
  font: 18px/24px Arial, sans-serif;
  height: 24px;
  position: absolute;
  right: 4px;
  text-align: center;
  text-decoration: none;
  top: 4px;
  width: 24px;
}
.leaflet-tooltip {
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.16);
  color: #111827;
  padding: 8px 10px;
  pointer-events: none;
  position: absolute;
  white-space: nowrap;
}
.leaflet-interactive {
  cursor: pointer;
  pointer-events: auto;
}
`;

const EVENT_LABELS = {
  touching_plant: "Touching Plant",
  touching_animal: "Touching Animal",
  plucking_plants: "Plucking Plants",
  hitting_animal: "Hitting Animal",
  extended_plant_touch: "Extended Plant Touch",
  extended_animal_touch: "Extended Animal Touch",
  forest_fire: "Forest Fire",
  flooding: "Flooding",
  loud_noise: "Loud Noise",
  trespassing: "Trespassing",
  other: "Other",
};

const SEVERITY_CONFIG = {
  high: {
    color: "#dc2626",
    fillColor: "#ef4444",
    label: "High",
  },
  medium: {
    color: "#d97706",
    fillColor: "#f59e0b",
    label: "Medium",
  },
  low: {
    color: "#059669",
    fillColor: "#10b981",
    label: "Low",
  },
};

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

const getMetadataRows = (metadata) => {
  if (!metadata || typeof metadata !== "object") {
    return [];
  }

  return Object.entries(metadata).map(([key, value]) => ({
    key,
    value: typeof value === "object" ? JSON.stringify(value) : String(value),
  }));
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
    { latitude: 0, longitude: 0 }
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
      map.setView([Number(events[0].latitude), Number(events[0].longitude)], 15);
      return;
    }

    map.fitBounds(
      events.map((event) => [Number(event.latitude), Number(event.longitude)]),
      {
        padding: [28, 28],
        maxZoom: 15,
      }
    );
  }, [center, events, map]);

  return null;
};

const AnomalyTooltipContent = ({ event }) => {
  const confidence = getConfidenceLabel(event.metadata);

  return (
    <div style={webStyles.tooltip}>
      <strong>{getEventTypeLabel(event.event_type)}</strong>
      <span>{formatDate(event.created_at)}</span>
      <span>
        {Number(event.latitude).toFixed(6)}, {Number(event.longitude).toFixed(6)}
      </span>
      <span>{getUserLabel(event)}</span>
      {confidence ? <span>Confidence: {confidence}</span> : null}
    </div>
  );
};

const AnomalyPopupContent = ({ event }) => {
  const metadataRows = getMetadataRows(event.metadata);
  const severity = getEventSeverity(event.event_type);

  return (
    <div style={webStyles.popup}>
      <div style={webStyles.popupHeader}>
        <strong>{getEventTypeLabel(event.event_type)}</strong>
        <span
          style={{
            ...webStyles.severityPill,
            backgroundColor: SEVERITY_CONFIG[severity].fillColor,
          }}
        >
          {SEVERITY_CONFIG[severity].label}
        </span>
      </div>
      <div style={webStyles.popupRow}>
        <span style={webStyles.popupLabel}>Detected</span>
        <span>{formatDate(event.created_at)}</span>
      </div>
      <div style={webStyles.popupRow}>
        <span style={webStyles.popupLabel}>Coordinates</span>
        <span>
          {Number(event.latitude).toFixed(6)}, {Number(event.longitude).toFixed(6)}
        </span>
      </div>
      <div style={webStyles.popupRow}>
        <span style={webStyles.popupLabel}>User</span>
        <span>{getUserLabel(event)}</span>
      </div>
      {metadataRows.length ? (
        <div style={webStyles.metadata}>
          <strong>Metadata</strong>
          {metadataRows.map((row) => (
            <div key={row.key} style={webStyles.popupRow}>
              <span style={webStyles.popupLabel}>{row.key.replaceAll("_", " ")}</span>
              <span>{row.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={webStyles.emptyMetadata}>No metadata available</div>
      )}
    </div>
  );
};

const HoverDetailCard = ({ event }) => {
  const severity = getEventSeverity(event.event_type);
  const confidence = getConfidenceLabel(event.metadata);

  return (
    <View style={styles.hoverCard}>
      <View style={styles.hoverHeader}>
        <Text style={styles.hoverTitle}>{getEventTypeLabel(event.event_type)}</Text>
        <View style={[styles.hoverBadge, { backgroundColor: SEVERITY_CONFIG[severity].fillColor }]}>
          <Text style={styles.hoverBadgeText}>{SEVERITY_CONFIG[severity].label}</Text>
        </View>
      </View>
      <Text style={styles.hoverRow}>Detected: {formatDate(event.created_at)}</Text>
      <Text style={styles.hoverRow}>
        Coordinates: {Number(event.latitude).toFixed(6)}, {Number(event.longitude).toFixed(6)}
      </Text>
      <Text style={styles.hoverRow}>User: {getUserLabel(event)}</Text>
      {confidence ? <Text style={styles.hoverRow}>Confidence: {confidence}</Text> : null}
    </View>
  );
};

const AdminDashboard = () => {
  const { events, loading, error, refresh, counts } = useAnomalyMapEvents();
  const [hoveredAnomaly, setHoveredAnomaly] = useState(null);
  const mapCenter = useMemo(() => getMapCenter(events), [events]);

  const severityCounts = useMemo(
    () =>
      events.reduce(
        (acc, event) => {
          acc[getEventSeverity(event.event_type)] += 1;
          return acc;
        },
        { high: 0, medium: 0, low: 0 }
      ),
    [events]
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <style>{LEAFLET_CSS}</style>
      <View style={styles.cards}>
        <View style={styles.adminCard}>
          <View>
            <Text style={styles.label}>Total Users</Text>
            <Text style={styles.value}>21342</Text>
          </View>
          <View style={[styles.iconContainer, styles.usersTheme]}>
            <User size={30} color="#4338ca" />
          </View>
        </View>
        <View style={styles.adminCard}>
          <View>
            <Text style={styles.label}>Total Courses</Text>
            <Text style={styles.value}>21342</Text>
          </View>
          <View style={[styles.iconContainer, styles.coursesTheme]}>
            <Book size={30} color="#ea580c" />
          </View>
        </View>
        <View style={styles.adminCard}>
          <View>
            <Text style={styles.label}>Total Enrollments</Text>
            <Text style={styles.value}>21342</Text>
          </View>
          <View style={[styles.iconContainer, styles.enrollTheme]}>
            <ClipboardList size={30} color="#16a34a" />
          </View>
        </View>
        <View style={styles.adminCard}>
          <View>
            <Text style={styles.label}>Mapped Anomalies</Text>
            <Text style={styles.value}>{counts.total}</Text>
          </View>
          <View style={[styles.iconContainer, styles.alertTheme]}>
            <Flag size={30} color="#dc2626" />
          </View>
        </View>
      </View>

      <View style={styles.mapSection}>
        <View style={styles.mapHeader}>
          <View>
            <Text style={styles.mapTitle}>Anomaly Map</Text>
            <Text style={styles.mapSubtitle}>All anomaly events with valid coordinates</Text>
          </View>
          <View style={styles.mapActions}>
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: SEVERITY_CONFIG.high.fillColor }]} />
                <Text style={styles.legendText}>Anomaly Live Count: {severityCounts.high}</Text>
              </View>
            </View>
            <Pressable
              onPress={refresh}
              style={({ hovered }) => [styles.refreshBtn, hovered && styles.refreshBtnHover]}
            >
              <RefreshCcw size={17} color="#0a6340" />
              <Text style={styles.refreshText}>Refresh</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.mapShell}>
          {loading ? (
            <View style={styles.mapState}>
              <ActivityIndicator size="large" color="#0a6340" />
              <Text style={styles.stateText}>Loading anomaly map...</Text>
            </View>
          ) : error ? (
            <View style={styles.mapState}>
              <AlertTriangle size={42} color="#dc2626" />
              <Text style={styles.errorText}>Failed to load anomaly map</Text>
              <Text style={styles.errorDetail}>{error}</Text>
              <Pressable
                onPress={refresh}
                style={({ hovered }) => [styles.retryBtn, hovered && styles.retryBtnHover]}
              >
                <Text style={styles.retryText}>Try Again</Text>
              </Pressable>
            </View>
          ) : (
            <MapContainer center={mapCenter} zoom={13} scrollWheelZoom style={webStyles.map}>
              <MapViewport events={events} center={mapCenter} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {events.map((event) => {
                const severity = getEventSeverity(event.event_type);
                const severityConfig = SEVERITY_CONFIG[severity];

                return (
                  <CircleMarker
                    key={event.id}
                    center={[Number(event.latitude), Number(event.longitude)]}
                    radius={8}
                    eventHandlers={{
                      mouseover: () => setHoveredAnomaly(event),
                      mouseout: () => setHoveredAnomaly(null),
                    }}
                    pathOptions={{
                      color: severityConfig.color,
                      fillColor: severityConfig.fillColor,
                      fillOpacity: 0.82,
                      weight: 2,
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                      <AnomalyTooltipContent event={event} />
                    </Tooltip>
                    <Popup>
                      <AnomalyPopupContent event={event} />
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          )}

          {!loading && !error && hoveredAnomaly ? <HoverDetailCard event={hoveredAnomaly} /> : null}

          {!loading && !error && events.length === 0 ? (
            <View style={styles.emptyOverlay}>
              <MapPin size={32} color="#9ca3af" />
              <Text style={styles.emptyText}>No coordinate-bearing anomalies found</Text>
            </View>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f8f7",
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
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
    marginHorizontal: 20,
  },
  usersTheme: { backgroundColor: "#eef2ff" },
  coursesTheme: { backgroundColor: "#fff7ed" },
  enrollTheme: { backgroundColor: "#f0fdf4" },
  alertTheme: { backgroundColor: "#fef2f2" },
  mapSection: {
    backgroundColor: "white",
    borderRadius: 8,
    overflow: "hidden",
    alignSelf: "flex-start",
    marginLeft: 20,
    width: "50vw",
    maxWidth: "70vw",
    borderWidth: 1,
    borderColor: "#e5e7eb",
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
    height: 520,
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
    width: 300,
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
});

const webStyles = {
  map: {
    width: "100%",
    height: "100%",
  },
  tooltip: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    fontSize: 12,
    color: "#111827",
  },
  popup: {
    minWidth: 240,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    fontSize: 13,
    color: "#111827",
  },
  popupHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingBottom: 6,
    borderBottom: "1px solid #e5e7eb",
  },
  popupRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
  },
  popupLabel: {
    color: "#6b7280",
    textTransform: "capitalize",
  },
  severityPill: {
    color: "white",
    borderRadius: 999,
    padding: "2px 8px",
    fontSize: 11,
    fontWeight: 700,
  },
  metadata: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    paddingTop: 6,
    borderTop: "1px solid #e5e7eb",
  },
  emptyMetadata: {
    color: "#6b7280",
    paddingTop: 6,
    borderTop: "1px solid #e5e7eb",
  },
};

export default AdminDashboard;
