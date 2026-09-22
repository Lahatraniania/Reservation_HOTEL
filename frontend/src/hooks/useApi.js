import { useState, useEffect, useCallback } from 'react';

export const useApi = (apiFunction, dependencies = [], options = {}) => {
  const { immediate = true, onSuccess, onError } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFunction(...args);
      setData(result);
      if (onSuccess) onSuccess(result);
      return result;
    } catch (err) {
      const message = err.response?.data?.detail || err.message || 'Une erreur est survenue';
      setError(message);
      if (onError) onError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, onSuccess, onError]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return { data, loading, error, execute, setData };
};