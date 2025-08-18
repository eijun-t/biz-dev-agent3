import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { create } from 'zustand';
import { createClient } from '@supabase/supabase-js';

// Supabaseクライアント初期化
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// レポートの型定義
export interface Report {
  id: string;
  title: string;
  theme: string;
  description?: string;
  created_at: string;
  updated_at: string;
  status: 'completed' | 'processing' | 'failed' | 'draft';
  progress?: number;
  tags: string[];
  starred: boolean;
  user_id: string;
  metrics?: {
    market_size?: string;
    growth_rate?: string;
    competition?: 'low' | 'medium' | 'high';
    feasibility?: number;
    investment_required?: string;
    roi_estimate?: string;
  };
  summary?: string;
  content?: any;
  agent_logs?: any[];
}

// フィルターオプション
export interface FilterOptions {
  status?: Report['status'] | 'all';
  tags?: string[];
  dateRange?: 'all' | 'today' | 'week' | 'month' | 'year';
  starred?: boolean;
  searchQuery?: string;
  sortBy?: 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'status';
}

// Zustand ストア
interface ReportHistoryStore {
  filters: FilterOptions;
  selectedReportId: string | null;
  viewMode: 'grid' | 'list';
  setFilters: (filters: FilterOptions) => void;
  setSelectedReport: (id: string | null) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  resetFilters: () => void;
}

export const useReportHistoryStore = create<ReportHistoryStore>((set) => ({
  filters: {
    status: 'all',
    tags: [],
    dateRange: 'all',
    starred: false,
    searchQuery: '',
    sortBy: 'date-desc'
  },
  selectedReportId: null,
  viewMode: 'grid',
  setFilters: (filters) => set({ filters }),
  setSelectedReport: (id) => set({ selectedReportId: id }),
  setViewMode: (mode) => set({ viewMode: mode }),
  resetFilters: () => set({
    filters: {
      status: 'all',
      tags: [],
      dateRange: 'all',
      starred: false,
      searchQuery: '',
      sortBy: 'date-desc'
    }
  })
}));

// レポート取得フック
export const useReportHistory = () => {
  const { filters } = useReportHistoryStore();
  const queryClient = useQueryClient();

  // レポート一覧取得
  const {
    data: reports,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['reports', filters],
    queryFn: async () => {
      let query = supabase
        .from('reports')
        .select('*');

      // ステータスフィルター
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // お気に入りフィルター
      if (filters.starred) {
        query = query.eq('starred', true);
      }

      // タグフィルター
      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      // 検索クエリ
      if (filters.searchQuery) {
        query = query.or(
          `title.ilike.%${filters.searchQuery}%,theme.ilike.%${filters.searchQuery}%,summary.ilike.%${filters.searchQuery}%`
        );
      }

      // 日付フィルター
      if (filters.dateRange && filters.dateRange !== 'all') {
        const now = new Date();
        let startDate = new Date();
        
        switch (filters.dateRange) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        }
        
        query = query.gte('created_at', startDate.toISOString());
      }

      // ソート
      switch (filters.sortBy) {
        case 'date-asc':
          query = query.order('created_at', { ascending: true });
          break;
        case 'name-asc':
          query = query.order('title', { ascending: true });
          break;
        case 'name-desc':
          query = query.order('title', { ascending: false });
          break;
        case 'status':
          query = query.order('status', { ascending: true });
          break;
        case 'date-desc':
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as Report[];
    },
    staleTime: 30000, // 30秒
    cacheTime: 300000, // 5分
  });

  // お気に入り切り替え
  const toggleStarMutation = useMutation({
    mutationFn: async ({ reportId, starred }: { reportId: string; starred: boolean }) => {
      const { error } = await supabase
        .from('reports')
        .update({ starred: !starred })
        .eq('id', reportId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    }
  });

  // レポート削除
  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    }
  });

  // タグ更新
  const updateTagsMutation = useMutation({
    mutationFn: async ({ reportId, tags }: { reportId: string; tags: string[] }) => {
      const { error } = await supabase
        .from('reports')
        .update({ tags })
        .eq('id', reportId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    }
  });

  // 全タグ取得
  const getAllTags = useCallback(() => {
    if (!reports) return [];
    const tagsSet = new Set<string>();
    reports.forEach(report => {
      report.tags?.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }, [reports]);

  // 統計情報取得
  const getStatistics = useCallback(() => {
    if (!reports) return {
      total: 0,
      completed: 0,
      processing: 0,
      failed: 0,
      starred: 0,
      thisWeek: 0
    };

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      total: reports.length,
      completed: reports.filter(r => r.status === 'completed').length,
      processing: reports.filter(r => r.status === 'processing').length,
      failed: reports.filter(r => r.status === 'failed').length,
      starred: reports.filter(r => r.starred).length,
      thisWeek: reports.filter(r => new Date(r.created_at) > weekAgo).length
    };
  }, [reports]);

  return {
    reports: reports || [],
    isLoading,
    error,
    refetch,
    toggleStar: toggleStarMutation.mutate,
    deleteReport: deleteReportMutation.mutate,
    updateTags: updateTagsMutation.mutate,
    getAllTags,
    getStatistics,
    isTogglingStar: toggleStarMutation.isLoading,
    isDeletingReport: deleteReportMutation.isLoading,
    isUpdatingTags: updateTagsMutation.isLoading
  };
};

// 単一レポート取得フック
export const useReport = (reportId: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['report', reportId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', reportId)
        .single();
      
      if (error) throw error;
      return data as Report;
    },
    enabled: !!reportId,
    staleTime: 30000,
    cacheTime: 300000,
  });

  return {
    report: data,
    isLoading,
    error
  };
};

// リアルタイム更新フック
export const useReportRealtimeUpdates = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('reports-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reports'
        },
        (payload) => {
          // レポート一覧を再取得
          queryClient.invalidateQueries({ queryKey: ['reports'] });
          
          // 変更されたレポートのキャッシュを更新
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            queryClient.setQueryData(
              ['report', payload.new.id],
              payload.new
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};

// エクスポート機能
export const useExportReports = () => {
  const exportToCSV = useCallback((reports: Report[]) => {
    const headers = ['ID', 'タイトル', 'テーマ', 'ステータス', '作成日', 'タグ', 'お気に入り'];
    const rows = reports.map(report => [
      report.id,
      report.title,
      report.theme,
      report.status,
      new Date(report.created_at).toLocaleString('ja-JP'),
      report.tags.join(', '),
      report.starred ? '★' : ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reports_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }, []);

  const exportToJSON = useCallback((reports: Report[]) => {
    const jsonContent = JSON.stringify(reports, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reports_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  }, []);

  return {
    exportToCSV,
    exportToJSON
  };
};