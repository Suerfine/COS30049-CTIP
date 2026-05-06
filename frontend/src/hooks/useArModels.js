import { useCallback, useEffect, useState } from "react";
import { arModelService } from "../services/arModelService";

export const useArModels = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalElements: 0,
  });

  const loadModels = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const response = await arModelService.getAll(params);
      setModels(response.data || []);
      setPagination({
        currentPage: response.page,
        totalPages: response.totalPages,
        totalElements: response.totalElements,
      });
    } catch (error) {
      console.error("Fetch AR models failed", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

    const createModel = async (payload) => {
    setLoading(true);
    try {
      await arModelService.create(payload);
      await loadModels();
      return true;
    } catch (error) {
      console.error("Create AR model failed", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteModel = async (id) => {
    setLoading(true);
    try {
      await arModelService.delete(id);
      await loadModels();
      return true;
    } catch (error) {
      console.error("Delete AR model failed", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    models,
    loading,
    pagination,
    loadModels,
    createModel,
    deleteModel,
  };
};