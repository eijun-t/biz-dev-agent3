/**
 * React Hooks for Report API
 * MVP Worker3 Support - Easy Integration for Worker1
 * With React Query, optimistic updates, and error recovery
 */

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportApi, SearchResponse, CompareResponse } from '../lib/api/report-client';
import { FilterCriteria } from '../lib/search/advanced-filter';
import { errorHandler } from '../lib/error/error-handler';

/**
 * Hook for searching reports
 */
export function useReportSearch(initialCriteria?: FilterCriteria) {
  const [criteria, setCriteria] = useState<FilterCriteria>(initialCriteria || {});
  const queryClient = useQueryClient();

  const {
    data,
    error,
    isLoading,
    isFetching,
    refetch
  } = useQuery<SearchResponse>({
    queryKey: ['reports', 'search', criteria],
    queryFn: async () => {
      try {
        return await reportApi.search(criteria);
      } catch (error: any) {
        await errorHandler.handleError(error, {
          category: 'api',
          component: 'useReportSearch'
        });
        throw error;
      }
    },
    staleTime: 30000, // 30 seconds
    cacheTime: 300000, // 5 minutes
    retry: 2,
    retryDelay: 1000
  });

  // Prefetch next page
  useEffect(() => {
    if (data && data.page < data.totalPages) {
      const nextPageCriteria = { ...criteria, page: (data.page || 1) + 1 };
      queryClient.prefetchQuery({
        queryKey: ['reports', 'search', nextPageCriteria],
        queryFn: () => reportApi.search(nextPageCriteria)
      });
    }
  }, [data, criteria, queryClient]);

  const updateCriteria = useCallback((newCriteria: FilterCriteria) => {
    setCriteria(newCriteria);
  }, []);

  const clearFilters = useCallback(() => {
    setCriteria({});
  }, []);

  return {
    reports: data?.data || [],
    total: data?.total || 0,
    page: data?.page || 1,
    totalPages: data?.totalPages || 1,
    aggregations: data?.aggregations,
    isLoading,
    isFetching,
    error,
    criteria,
    updateCriteria,
    clearFilters,
    refetch,
    responseTime: data?.responseTime,
    isCached: data?.cached || false
  };
}

/**
 * Hook for comparing reports
 */
export function useReportComparison() {
  const [selectedReports, setSelectedReports] = useState<string[]>([]);

  const mutation = useMutation<CompareResponse, Error, { reportIds: string[]; options?: any }>({
    mutationFn: async ({ reportIds, options }) => {
      try {
        return await reportApi.compareReports(reportIds, options);
      } catch (error: any) {
        await errorHandler.handleError(error, {
          category: 'api',
          component: 'useReportComparison'
        });
        throw error;
      }
    },
    retry: 1
  });

  const compare = useCallback(
    (reportIds?: string[], options?: any) => {
      const ids = reportIds || selectedReports;
      if (ids.length < 2) {
        throw new Error('At least 2 reports required for comparison');
      }
      return mutation.mutate({ reportIds: ids, options });
    },
    [selectedReports, mutation]
  );

  const toggleSelection = useCallback((reportId: string) => {
    setSelectedReports(prev => {
      if (prev.includes(reportId)) {
        return prev.filter(id => id !== reportId);
      }
      return [...prev, reportId];
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedReports([]);
  }, []);

  return {
    selectedReports,
    comparison: mutation.data,
    isComparing: mutation.isLoading,
    error: mutation.error,
    compare,
    toggleSelection,
    clearSelection,
    canCompare: selectedReports.length >= 2
  };
}

/**
 * Hook for exporting reports
 */
export function useReportExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const exportReports = useCallback(
    async (
      reportIds: string[],
      format: 'pdf' | 'excel' | 'csv' | 'json',
      options?: any
    ) => {
      setIsExporting(true);
      setProgress(0);

      try {
        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        const blob = await reportApi.exportReports(reportIds, format, options);
        
        clearInterval(progressInterval);
        setProgress(100);

        // Download the file
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reports_${Date.now()}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        return { success: true };
      } catch (error: any) {
        await errorHandler.handleError(error, {
          category: 'api',
          component: 'useReportExport',
          severity: 'medium'
        });
        throw error;
      } finally {
        setIsExporting(false);
        setTimeout(() => setProgress(0), 1000);
      }
    },
    []
  );

  return {
    exportReports,
    isExporting,
    progress
  };
}

/**
 * Hook for saving reports
 */
export function useReportSave() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (report: any) => {
      try {
        return await reportApi.saveReport(report);
      } catch (error: any) {
        await errorHandler.handleError(error, {
          category: 'api',
          component: 'useReportSave',
          severity: 'high'
        });
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate all report queries
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
    // Optimistic update
    onMutate: async (newReport) => {
      await queryClient.cancelQueries({ queryKey: ['reports'] });
      
      const previousReports = queryClient.getQueryData(['reports', 'search']);
      
      queryClient.setQueryData(['reports', 'search'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: [newReport, ...old.data]
        };
      });
      
      return { previousReports };
    },
    onError: (err, newReport, context) => {
      // Rollback on error
      if (context?.previousReports) {
        queryClient.setQueryData(['reports', 'search'], context.previousReports);
      }
    }
  });

  return {
    saveReport: mutation.mutate,
    isSaving: mutation.isLoading,
    error: mutation.error,
    isSuccess: mutation.isSuccess
  };
}

/**
 * Hook for deleting reports
 */
export function useReportDelete() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (reportId: string) => {
      try {
        return await reportApi.deleteReport(reportId);
      } catch (error: any) {
        await errorHandler.handleError(error, {
          category: 'api',
          component: 'useReportDelete',
          severity: 'high'
        });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
    // Optimistic delete
    onMutate: async (reportId) => {
      await queryClient.cancelQueries({ queryKey: ['reports'] });
      
      const previousReports = queryClient.getQueryData(['reports', 'search']);
      
      queryClient.setQueryData(['reports', 'search'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.filter((r: any) => r.id !== reportId)
        };
      });
      
      return { previousReports };
    },
    onError: (err, reportId, context) => {
      if (context?.previousReports) {
        queryClient.setQueryData(['reports', 'search'], context.previousReports);
      }
    }
  });

  return {
    deleteReport: mutation.mutate,
    isDeleting: mutation.isLoading,
    error: mutation.error
  };
}

/**
 * Hook for batch operations
 */
export function useReportBatch() {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const mutation = useMutation({
    mutationFn: async ({
      operation,
      reportIds
    }: {
      operation: 'delete' | 'archive' | 'restore';
      reportIds?: string[];
    }) => {
      const ids = reportIds || selectedIds;
      if (ids.length === 0) {
        throw new Error('No reports selected');
      }
      
      try {
        return await reportApi.batchOperation(operation, ids);
      } catch (error: any) {
        await errorHandler.handleError(error, {
          category: 'api',
          component: 'useReportBatch',
          severity: 'high'
        });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setSelectedIds([]);
    }
  });

  const toggleSelection = useCallback((reportId: string) => {
    setSelectedIds(prev => {
      if (prev.includes(reportId)) {
        return prev.filter(id => id !== reportId);
      }
      return [...prev, reportId];
    });
  }, []);

  const selectAll = useCallback((reportIds: string[]) => {
    setSelectedIds(reportIds);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  return {
    selectedIds,
    batchOperation: mutation.mutate,
    isProcessing: mutation.isLoading,
    error: mutation.error,
    toggleSelection,
    selectAll,
    clearSelection,
    hasSelection: selectedIds.length > 0
  };
}

/**
 * Hook for getting a single report
 */
export function useReport(reportId: string | null) {
  const { data, error, isLoading } = useQuery({
    queryKey: ['reports', reportId],
    queryFn: async () => {
      if (!reportId) return null;
      
      try {
        return await reportApi.getReport(reportId);
      } catch (error: any) {
        await errorHandler.handleError(error, {
          category: 'api',
          component: 'useReport'
        });
        throw error;
      }
    },
    enabled: !!reportId,
    staleTime: 60000,
    cacheTime: 300000
  });

  return {
    report: data,
    isLoading,
    error
  };
}

// Export all hooks
export default {
  useReportSearch,
  useReportComparison,
  useReportExport,
  useReportSave,
  useReportDelete,
  useReportBatch,
  useReport
};