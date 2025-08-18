import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// レポート取得用フック
export const useReports = (filters?: any) => {
  return useQuery({
    queryKey: ['reports', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.searchQuery) params.append('q', filters.searchQuery);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.tags?.length) params.append('tags', filters.tags.join(','));
      if (filters?.starred) params.append('starred', 'true');
      if (filters?.dateRange) params.append('dateRange', filters.dateRange);
      if (filters?.sortBy) params.append('sort', filters.sortBy);

      const response = await fetch(`/api/reports/search?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch reports');
      
      const data = await response.json();
      return data.reports || [];
    },
    staleTime: 30000,
    cacheTime: 300000,
  });
};

// レポート保存用フック
export const useSaveReport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (report: any) => {
      const response = await fetch('/api/reports/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      });
      
      if (!response.ok) throw new Error('Failed to save report');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};

// レポート更新用フック
export const useUpdateReport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const response = await fetch(`/api/reports/save?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) throw new Error('Failed to update report');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};

// お気に入り切り替え用フック
export const useToggleStar = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, starred }: { id: string; starred: boolean }) => {
      const response = await fetch(`/api/reports/save?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starred: !starred }),
      });
      
      if (!response.ok) throw new Error('Failed to toggle star');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};

// レポート削除用フック
export const useDeleteReport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/reports/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete report');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};