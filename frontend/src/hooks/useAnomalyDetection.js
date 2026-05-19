import { useState, useEffect } from "react";
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

  // Fetch all anomalies
  const fetchAnomalies = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await AnomalyService.getAll(
        currentPage,
        10,
        searchQuery,
        sortConfig,
        { excludeType: "touching" } 
      );

      console.log("Anomaly Response:", response);

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
      setAnomalies([]);
      setTotalAnomalies(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, [currentPage, searchQuery, sortConfig]);

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

  const refresh = async () => {
    await fetchAnomalies();
  };

  const resolveAnomaly = async (eventId) => {
    await AnomalyService.resolve(eventId);
    await fetchAnomalies();
  };

  const loadSensors = async () => {
    setSensorLoading(true);
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

      setSensorState(emptyPaginatedState);
    } finally {
      setSensorLoading(false);
    }
  };

  const loadSensorLogs = async (
    sensorId,
    page = 1
  ) => {
    if (!sensorId) return;

    setSensorLogsLoading(true);
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

      setSensorLogsState(emptyPaginatedState);
    } finally {
      setSensorLogsLoading(false);
    }
  };

  useEffect(() => {
    loadSensors();
  }, [sensorsPage]);

  const refreshSensors = async () => {
    await loadSensors();
  };

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
  };
};