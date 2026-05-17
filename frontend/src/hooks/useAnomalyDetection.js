import { useState, useEffect } from "react";
import { AnomalyService } from "../services/AnomalyService";

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
  };
};