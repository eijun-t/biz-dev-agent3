'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReportHistoryPage } from '@/pages/ReportHistoryPage';
import { AppLayout } from '@/components/layout/AppLayout';

// React Query クライアント
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function ReportsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppLayout>
        <ReportHistoryPage />
      </AppLayout>
    </QueryClientProvider>
  );
}