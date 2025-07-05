import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';

// Generic hook for API calls
export const useApi = (apiCall, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      setData(result);
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// Hook for user data
export const useUser = (userId) => {
  return useApi(() => apiService.getUser(userId), [userId]);
};

// Hook for user transactions
export const useTransactions = (userId, params = {}) => {
  return useApi(
    () => apiService.getUserTransactions(userId, params), 
    [userId, JSON.stringify(params)]
  );
};

// Hook for user budgets
export const useBudgets = (userId) => {
  return useApi(() => apiService.getUserBudgets(userId), [userId]);
};

// Hook for spending analysis
export const useSpendingAnalysis = (userId, months = 12) => {
  return useApi(
    () => apiService.getSpendingAnalysis(userId, months), 
    [userId, months]
  );
};

// Hook for financial health score
export const useFinancialHealthScore = (userId) => {
  return useApi(() => apiService.getFinancialHealthScore(userId), [userId]);
};

// Hook for budget alerts
export const useBudgetAlerts = (userId) => {
  return useApi(() => apiService.getBudgetAlerts(userId), [userId]);
};

// Hook for manual API calls (mutations)
export const useApiMutation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(async (apiCall) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      return result;
    } catch (err) {
      setError(err.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutate, loading, error };
};