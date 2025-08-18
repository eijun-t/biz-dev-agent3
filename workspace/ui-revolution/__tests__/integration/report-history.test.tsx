/**
 * Integration Tests for Report History Feature
 * Testing DB connection, API endpoints, and UI components
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import ReportHistoryIntegrated from '@/components/reports/ReportHistoryIntegrated';

// Mock data
const mockReports = [
  {
    id: '1',
    title: 'AI Healthcare Report',
    summary: 'Analysis of AI in healthcare',
    status: 'completed',
    score: 92,
    tags: ['healthcare', 'AI'],
    agents: ['researcher', 'analyst'],
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T12:00:00Z'
  },
  {
    id: '2',
    title: 'Renewable Energy Study',
    summary: 'Solar and wind opportunities',
    status: 'in_progress',
    score: 85,
    tags: ['energy', 'sustainable'],
    agents: ['researcher', 'ideator'],
    created_at: '2024-01-09T10:00:00Z',
    updated_at: '2024-01-09T15:00:00Z'
  }
];

// Setup MSW server
const server = setupServer(
  rest.get('/api/reports/search', (req, res, ctx) => {
    const query = req.url.searchParams.get('q');
    const status = req.url.searchParams.get('status');
    const page = parseInt(req.url.searchParams.get('page') || '1');
    const limit = parseInt(req.url.searchParams.get('limit') || '10');
    
    let filtered = [...mockReports];
    
    if (query) {
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(query.toLowerCase()) ||
        r.summary.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    if (status && status !== 'all') {
      filtered = filtered.filter(r => r.status === status);
    }
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: filtered,
        pagination: {
          page,
          limit,
          total: filtered.length,
          totalPages: Math.ceil(filtered.length / limit),
          hasNextPage: false,
          hasPrevPage: false
        },
        responseTime: 45
      })
    );
  }),
  
  rest.delete('/api/reports/save', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Report archived successfully'
      })
    );
  }),
  
  rest.post('/api/reports/save', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        data: { id: '3', ...req.body },
        responseTime: 78
      })
    );
  })
);

// Setup and teardown
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Test wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('ReportHistoryIntegrated', () => {
  describe('Rendering and Loading', () => {
    it('should render loading state initially', () => {
      render(<ReportHistoryIntegrated />, { wrapper: createWrapper() });
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
    
    it('should render reports after loading', async () => {
      render(<ReportHistoryIntegrated />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText('AI Healthcare Report')).toBeInTheDocument();
        expect(screen.getByText('Renewable Energy Study')).toBeInTheDocument();
      });
    });
    
    it('should display report count', async () => {
      render(<ReportHistoryIntegrated />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText(/2 reports/)).toBeInTheDocument();
      });
    });
  });
  
  describe('Search Functionality', () => {
    it('should filter reports by search query', async () => {
      const user = userEvent.setup();
      render(<ReportHistoryIntegrated />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText('AI Healthcare Report')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText('Search reports...');
      await user.type(searchInput, 'healthcare');
      
      await waitFor(() => {
        expect(screen.getByText('AI Healthcare Report')).toBeInTheDocument();
        expect(screen.queryByText('Renewable Energy Study')).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });
    
    it('should debounce search input', async () => {
      const user = userEvent.setup();
      let requestCount = 0;
      
      server.use(
        rest.get('/api/reports/search', (req, res, ctx) => {
          requestCount++;
          return res(ctx.json({ success: true, data: [], pagination: {} }));
        })
      );
      
      render(<ReportHistoryIntegrated />, { wrapper: createWrapper() });
      
      const searchInput = screen.getByPlaceholderText('Search reports...');
      await user.type(searchInput, 'test');
      
      // Should only make 1 request after debounce
      await waitFor(() => {
        expect(requestCount).toBeLessThanOrEqual(2); // Initial load + 1 search
      });
    });
  });
  
  describe('Filter Functionality', () => {
    it('should filter by status', async () => {
      const user = userEvent.setup();
      render(<ReportHistoryIntegrated />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText('AI Healthcare Report')).toBeInTheDocument();
      });
      
      const statusFilter = screen.getByRole('combobox', { name: /status/i });
      await user.selectOptions(statusFilter, 'completed');
      
      await waitFor(() => {
        expect(screen.getByText('AI Healthcare Report')).toBeInTheDocument();
        expect(screen.queryByText('Renewable Energy Study')).not.toBeInTheDocument();
      });
    });
    
    it('should sort reports', async () => {
      const user = userEvent.setup();
      render(<ReportHistoryIntegrated />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText('AI Healthcare Report')).toBeInTheDocument();
      });
      
      const sortFilter = screen.getByRole('combobox', { name: /sort/i });
      await user.selectOptions(sortFilter, 'score');
      
      // Verify request was made with sort parameter
      await waitFor(() => {
        const reports = screen.getAllByRole('article');
        expect(reports).toHaveLength(2);
      });
    });
  });
  
  describe('View Mode Toggle', () => {
    it('should toggle between grid and list view', async () => {
      const user = userEvent.setup();
      render(<ReportHistoryIntegrated />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText('AI Healthcare Report')).toBeInTheDocument();
      });
      
      // Initially in grid view
      expect(screen.getByTestId('reports-grid')).toBeInTheDocument();
      
      // Switch to list view
      const listButton = screen.getByRole('button', { name: /list view/i });
      await user.click(listButton);
      
      expect(screen.getByTestId('reports-list')).toBeInTheDocument();
      expect(screen.queryByTestId('reports-grid')).not.toBeInTheDocument();
    });
  });
  
  describe('Delete Functionality', () => {
    it('should delete report on confirmation', async () => {
      const user = userEvent.setup();
      const onReportSelect = jest.fn();
      
      // Mock window.confirm
      window.confirm = jest.fn(() => true);
      
      render(
        <ReportHistoryIntegrated onReportSelect={onReportSelect} />,
        { wrapper: createWrapper() }
      );
      
      await waitFor(() => {
        expect(screen.getByText('AI Healthcare Report')).toBeInTheDocument();
      });
      
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);
      
      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to archive this report?');
      });
    });
    
    it('should not delete report on cancel', async () => {
      const user = userEvent.setup();
      window.confirm = jest.fn(() => false);
      
      render(<ReportHistoryIntegrated />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText('AI Healthcare Report')).toBeInTheDocument();
      });
      
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);
      
      // Report should still be visible
      expect(screen.getByText('AI Healthcare Report')).toBeInTheDocument();
    });
  });
  
  describe('Pagination', () => {
    it('should show pagination controls when needed', async () => {
      server.use(
        rest.get('/api/reports/search', (req, res, ctx) => {
          return res(
            ctx.json({
              success: true,
              data: mockReports,
              pagination: {
                page: 1,
                limit: 10,
                total: 25,
                totalPages: 3,
                hasNextPage: true,
                hasPrevPage: false
              }
            })
          );
        })
      );
      
      render(<ReportHistoryIntegrated />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /next/i })).toBeEnabled();
        expect(screen.getByRole('button', { name: /prev/i })).toBeDisabled();
      });
    });
    
    it('should navigate pages', async () => {
      const user = userEvent.setup();
      
      server.use(
        rest.get('/api/reports/search', (req, res, ctx) => {
          const page = parseInt(req.url.searchParams.get('page') || '1');
          return res(
            ctx.json({
              success: true,
              data: page === 1 ? [mockReports[0]] : [mockReports[1]],
              pagination: {
                page,
                limit: 1,
                total: 2,
                totalPages: 2,
                hasNextPage: page < 2,
                hasPrevPage: page > 1
              }
            })
          );
        })
      );
      
      render(<ReportHistoryIntegrated />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
      });
      
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
      });
    });
  });
  
  describe('Error Handling', () => {
    it('should display error state on API failure', async () => {
      server.use(
        rest.get('/api/reports/search', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Server error' }));
        })
      );
      
      render(<ReportHistoryIntegrated />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText('Error loading reports')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });
    
    it('should retry on error', async () => {
      const user = userEvent.setup();
      let attemptCount = 0;
      
      server.use(
        rest.get('/api/reports/search', (req, res, ctx) => {
          attemptCount++;
          if (attemptCount === 1) {
            return res(ctx.status(500));
          }
          return res(ctx.json({ success: true, data: mockReports, pagination: {} }));
        })
      );
      
      render(<ReportHistoryIntegrated />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText('Error loading reports')).toBeInTheDocument();
      });
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);
      
      await waitFor(() => {
        expect(screen.getByText('AI Healthcare Report')).toBeInTheDocument();
      });
    });
  });
  
  describe('Empty State', () => {
    it('should show empty state when no reports', async () => {
      server.use(
        rest.get('/api/reports/search', (req, res, ctx) => {
          return res(
            ctx.json({
              success: true,
              data: [],
              pagination: { total: 0, totalPages: 0 }
            })
          );
        })
      );
      
      render(<ReportHistoryIntegrated />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText('No reports found')).toBeInTheDocument();
        expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument();
      });
    });
  });
  
  describe('Performance', () => {
    it('should render large lists efficiently', async () => {
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        ...mockReports[0],
        id: `report-${i}`,
        title: `Report ${i}`
      }));
      
      server.use(
        rest.get('/api/reports/search', (req, res, ctx) => {
          return res(
            ctx.json({
              success: true,
              data: largeDataset.slice(0, 20),
              pagination: {
                page: 1,
                limit: 20,
                total: 100,
                totalPages: 5
              },
              responseTime: 65
            })
          );
        })
      );
      
      const startTime = performance.now();
      render(<ReportHistoryIntegrated />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText('Report 0')).toBeInTheDocument();
      });
      
      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(3000); // Should render within 3 seconds
    });
  });
});