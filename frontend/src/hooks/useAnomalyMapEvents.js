import { useCallback, useEffect, useMemo, useState } from "react";

import { AnomalyService } from "../services/AnomalyService";
import SensorService from "../services/SensorService";

const hasValidCoordinates = (event) =>
  Number.isFinite(Number(event?.latitude)) &&
  Number.isFinite(Number(event?.longitude));

export const useAnomalyMapEvents = () => {
  const [events, setEvents] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetching all anomaly events detected by AI cameras
      const response = await AnomalyService.getMapEvents();
      const rawEvents = Array.isArray(response)
        ? response
        : response?.data || [];
      setEvents(rawEvents.filter(hasValidCoordinates));

      // Fetching all sensors currently in the system to display on the map
      const sensorResponse = await SensorService.getAll();
      const rawSensors = Array.isArray(sensorResponse)
        ? sensorResponse
        : sensorResponse?.data || [];
      setSensors(rawSensors);
    } catch (err) {
      console.error("Failed to fetch anomaly map events:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch anomaly map events",
      );
      setEvents([]);
      setSensors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const counts = useMemo(() => {
    const byType = events.reduce((acc, event) => {
      const eventType = event.event_type || "unknown";
      acc[eventType] = (acc[eventType] || 0) + 1;
      return acc;
    }, {});

    return {
      total: events.length,
      byType,
    };
  }, [events]);

  return {
    events,
    sensors,
    loading,
    error,
    refresh: fetchEvents,
    counts,
  };
};
