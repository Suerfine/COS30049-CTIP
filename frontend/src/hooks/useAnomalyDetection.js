import { useState, useEffect, useCallback, useRef } from "react";
import { AnomalyService } from "../services/AnomalyService";
import { sensorService } from "../services/SensorService";

const PAGE_SIZE = 10;
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

export const useAnomalyDetection = () => {
  const [anomalies, setAnomalies] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAnomalies, setTotalAnomalies] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sensorsPage, setSensorsPage] = useState(1);
  const [sensorState, setSensorState] = useState(emptyPaginatedState);
  const [sensorLoading, setSensorLoading] = useState(true);
  const [sensorError, setSensorError] = useState(null);
  const [sensorLogsPage, setSensorLogsPage] = useState(1);
  const [sensorLogsState, setSensorLogsState] = useState(emptyPaginatedState);
  const [sensorLogsLoading, setSensorLogsLoading] = useState(false);
  const [sensorLogsError, setSensorLogsError] = useState(null);
  const anomalyFetchingRef = useRef(false);
  const sensorFetchingRef = useRef(false);
  const sensorLogFetchingRef = useRef(false);

  const [anomalyFilters, setAnomalyFilters] = useState({
    status: "all",
    eventType: [],
    time: "anytime",
  })

  // Fetch all anomalies
  const fetchAnomalies = useCallback(async ({ silent = false } = {}) => {
    if (anomalyFetchingRef.current) return;
    anomalyFetchingRef.current = true;

    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      const response = await AnomalyService.getAll(
        currentPage,
        10,
        searchQuery,
        sortConfig,
        anomalyFilters
      );

      const rawAnomalies = Array.isArray(response)
        ? response
        : response.data || [];

      setAnomalies(rawAnomalies);
      setTotalAnomalies(
        response.totalElements ??
        response.total ??
        rawAnomalies.length
      );
      setTotalPages(
        response.totalPages  ??
        response.pages       ??
        1
      );
    } catch (err) {
      console.error("Failed to fetch anomalies: ", err);
      setError(err.message || "Failed to fetch anomalies");
      if (!silent) {
        setAnomalies([]);
        setTotalAnomalies(0);
        setTotalPages(1);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
      anomalyFetchingRef.current = false;
    }
  }, [currentPage, searchQuery, sortConfig, anomalyFilters]);

  useEffect(() => {
    fetchAnomalies();
  }, [fetchAnomalies]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const requestSort = (key) => {
    let direction = "desc"; // Default to descending for chronological order

    if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    }

    setSortConfig({ key, direction });
  };

  const resetSort = () => {
    setSortConfig({
      key: "created_at",
      direction: "desc",
    });
    setCurrentPage(1);
  };

  const refresh = useCallback(async (options) => {
    await fetchAnomalies(options);
  }, [fetchAnomalies]);

  const resolveAnomaly = useCallback(async (eventId) => {
    await AnomalyService.resolve(eventId);
    await fetchAnomalies();
  }, [fetchAnomalies]);

  const loadSensors = useCallback(async ({ silent = false } = {}) => {
    if (sensorFetchingRef.current) return;
    sensorFetchingRef.current = true;

    if (!silent) {
      setSensorLoading(true);
    }
    setSensorError(null);

    try {
      const response = await sensorService.getAll({
        page: sensorsPage,
        size: PAGE_SIZE,
        orderBy: "id asc",
      });

      setSensorState(
        normalizePaginatedResponse(response)
      );
    } catch (loadError) {
      setSensorError(
        extractErrorMessage(
          loadError,
          "Unable to load sensors"
        )
      );

      if (!silent) {
        setSensorState(emptyPaginatedState);
      }
    } finally {
      if (!silent) {
        setSensorLoading(false);
      }
      sensorFetchingRef.current = false;
    }
  }, [sensorsPage]);

  const loadSensorLogs = useCallback(async (sensorId, page = 1, { silent = false } = {}) => {
    if (!sensorId) return;
    if (sensorLogFetchingRef.current) return;
    sensorLogFetchingRef.current = true;

    if (!silent) {
      setSensorLogsLoading(true);
    }
    setSensorLogsError(null);

    try {
      const response =
        await sensorService.getLogsBySensor(
          sensorId,
          {
            page,
            size: PAGE_SIZE,
            orderBy: "created_at desc",
          }
        );

      setSensorLogsState(
        normalizePaginatedResponse(response)
      );
    } catch (loadError) {
      setSensorLogsError(
        extractErrorMessage(
          loadError,
          "Unable to load sensor logs"
        )
      );

      if (!silent) {
        setSensorLogsState(emptyPaginatedState);
      }
    } finally {
      if (!silent) {
        setSensorLogsLoading(false);
      }
      sensorLogFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadSensors();
  }, [loadSensors]);

  const refreshSensors = useCallback(async (options) => {
    await loadSensors(options);
  }, [loadSensors]);

  return {
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
  };
};
