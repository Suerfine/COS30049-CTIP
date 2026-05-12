import { useCallback, useEffect, useMemo, useState } from "react";

import { AnomalyService } from "../services/AnomalyService";

const hasValidCoordinates = (event) =>
  Number.isFinite(Number(event?.latitude)) && Number.isFinite(Number(event?.longitude));

export const useAnomalyMapEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await AnomalyService.getMapEvents();
      const rawEvents = Array.isArray(response) ? response : response?.data || [];

      setEvents(rawEvents.filter(hasValidCoordinates));
    } catch (err) {
      console.error("Failed to fetch anomaly map events:", err);
      setError(err.response?.data?.message || err.message || "Failed to fetch anomaly map events");
      setEvents([]);
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
    loading,
    error,
    refresh: fetchEvents,
    counts,
  };
};
