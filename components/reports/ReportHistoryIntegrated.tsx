'use client';

/**
 * Fully Integrated Report History Component
 * MVP Worker3 + Worker1 Collaboration
 * Complete with all features and optimizations
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  useReportSearch,
  useReportComparison,
  useReportExport,
  useReportDelete,
  useReportBatch
} from '@/workspace/ui-revolution/hooks/use-report-api';
import SearchFilterPanel from '@/workspace/ui-revolution/components/search/SearchFilterPanel';
import { FilterCriteria } from '@/workspace/ui-revolution/lib/search/advanced-filter';
import { formatDistanceToNow } from 'date-fns';

interface ReportHistoryIntegratedProps {
  className?: string;
  onReportSelect?: (report: any) => void;
}

/**
 * Fully Integrated Report History Component
 */
export default function ReportHistoryIntegrated({
  className = '',
  onReportSelect
}: ReportHistoryIntegratedProps) {
  // State management
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  // API hooks
  const {
    reports,
    total,
    page,
    totalPages,
    isLoading,
    isFetching,
    error,
    criteria,
    updateCriteria,
    clearFilters,
    responseTime,
    isCached
  } = useReportSearch();

  const {
    selectedReports: compareSelection,
    comparison,
    isComparing,
    compare,
    toggleSelection: toggleCompareSelection,
    canCompare
  } = useReportComparison();

  const {
    exportReports,
    isExporting,
    progress: exportProgress
  } = useReportExport();

  const {
    deleteReport,
    isDeleting
  } = useReportDelete();

  const {
    selectedIds: batchSelection,
    batchOperation,
    isProcessing,
    toggleSelection: toggleBatchSelection,
    selectAll,
    clearSelection,
    hasSelection
  } = useReportBatch();

  // Handlers
  const handleSearch = useCallback(() => {
    // Search is triggered automatically by criteria changes
    console.log('Searching with criteria:', criteria);
  }, [criteria]);

  const handleFilterChange = useCallback((filters: FilterCriteria) => {
    updateCriteria(filters);
  }, [updateCriteria]);

  const handleExport = useCallback(async (format: 'pdf' | 'excel' | 'csv' | 'json') => {
    if (hasSelection) {
      await exportReports(batchSelection, format);
    } else {
      // Export all current results
      const allIds = reports.map(r => r.id);
      await exportReports(allIds, format);
    }
  }, [exportReports, batchSelection, hasSelection, reports]);

  const handleDelete = useCallback(async (reportId: string) => {
    if (confirm('Are you sure you want to delete this report?')) {
      await deleteReport(reportId);
    }
  }, [deleteReport]);

  const handleBatchDelete = useCallback(async () => {
    if (confirm(`Delete ${batchSelection.length} reports?`)) {
      await batchOperation({ operation: 'delete' });
    }
  }, [batchOperation, batchSelection]);

  const handleCompare = useCallback(() => {
    if (canCompare) {
      compare();
    }
  }, [compare, canCompare]);

  // Render loading state
  if (isLoading && reports.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error loading reports: {(error as Error).message}</p>
        <button
          onClick={clearFilters}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`report-history-integrated ${className}`}>
      {/* Header */}
      <div className="header mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Report History</h2>
            <p className="text-gray-600">
              {total} reports • Page {page}/{totalPages}
              {responseTime && ` • ${responseTime}ms`}
              {isCached && ' • Cached'}
            </p>
          </div>
          
          <div className="flex gap-2">
            {/* View mode toggle */}
            <div className="btn-group">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded-l ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-r ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                List
              </button>
            </div>
            
            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              {showFilters ? 'Hide' : 'Show'} Filters
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-6">
          <SearchFilterPanel
            onFilterChange={handleFilterChange}
            onSearch={handleSearch}
          />
        </div>
      )}

      {/* Action bar */}
      {(hasSelection || canCompare) && (
        <div className="action-bar mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              {hasSelection && (
                <span className="text-sm">
                  {batchSelection.length} reports selected
                </span>
              )}
              {canCompare && (
                <span className="text-sm ml-4">
                  {compareSelection.length} reports ready to compare
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              {hasSelection && (
                <>
                  <button
                    onClick={handleBatchDelete}
                    disabled={isProcessing}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                  >
                    Delete Selected
                  </button>
                  <button
                    onClick={() => batchOperation({ operation: 'archive' })}
                    disabled={isProcessing}
                    className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
                  >
                    Archive Selected
                  </button>
                </>
              )}
              
              {canCompare && (
                <button
                  onClick={handleCompare}
                  disabled={isComparing}
                  className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                >
                  Compare Reports
                </button>
              )}
              
              <button
                onClick={clearSelection}
                className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export progress */}
      {isExporting && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center">
            <span className="text-sm mr-3">Exporting...</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
            <span className="text-sm ml-3">{exportProgress}%</span>
          </div>
        </div>
      )}

      {/* Reports grid/list */}
      <div className={`reports-container ${viewMode}`}>
        {reports.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No reports found</p>
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
            {reports.map((report: any) => (
              <div
                key={report.id}
                className={`report-card bg-white rounded-lg shadow hover:shadow-lg transition-shadow ${
                  viewMode === 'grid' ? 'p-4' : 'p-3 flex items-center'
                } ${
                  selectedReport?.id === report.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => {
                  setSelectedReport(report);
                  onReportSelect?.(report);
                }}
              >
                {/* Selection checkboxes */}
                <div className="flex gap-2 mb-2" onClick={(e) => e.stopPropagation()}>
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={batchSelection.includes(report.id)}
                      onChange={() => toggleBatchSelection(report.id)}
                      className="mr-1"
                    />
                    Select
                  </label>
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={compareSelection.includes(report.id)}
                      onChange={() => toggleCompareSelection(report.id)}
                      className="mr-1"
                    />
                    Compare
                  </label>
                </div>
                
                {/* Report content */}
                {viewMode === 'grid' ? (
                  <>
                    <h3 className="font-semibold text-lg mb-2">{report.title}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                      {report.summary}
                    </p>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className={`px-2 py-1 rounded ${
                        report.status === 'completed' ? 'bg-green-100 text-green-800' :
                        report.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {report.status}
                      </span>
                      <span className="text-gray-500">
                        {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    
                    <div className="mt-3 flex justify-between items-center">
                      <div className="flex gap-1">
                        {report.tags?.slice(0, 3).map((tag: string) => (
                          <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <span className="font-bold text-lg">{report.score}</span>
                    </div>
                    
                    {/* Actions */}
                    <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleExport('pdf')}
                        className="flex-1 px-2 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200"
                      >
                        PDF
                      </button>
                      <button
                        onClick={() => handleDelete(report.id)}
                        disabled={isDeleting}
                        className="flex-1 px-2 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex-1">
                      <h3 className="font-semibold">{report.title}</h3>
                      <p className="text-gray-600 text-sm">{report.summary}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-2 py-1 rounded text-sm ${
                        report.status === 'completed' ? 'bg-green-100 text-green-800' :
                        report.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {report.status}
                      </span>
                      <span className="font-bold">{report.score}</span>
                      <span className="text-gray-500 text-sm">
                        {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <div className="flex gap-2">
            <button
              onClick={() => updateCriteria({ ...criteria, page: Math.max(1, page - 1) })}
              disabled={page === 1 || isFetching}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              Previous
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(page - 2 + i, totalPages - 4)) + i;
              if (pageNum > totalPages) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => updateCriteria({ ...criteria, page: pageNum })}
                  disabled={isFetching}
                  className={`px-4 py-2 rounded ${
                    pageNum === page
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => updateCriteria({ ...criteria, page: Math.min(totalPages, page + 1) })}
              disabled={page === totalPages || isFetching}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Export menu */}
      <div className="mt-6 flex justify-end">
        <div className="dropdown relative inline-block">
          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Export Reports ▼
          </button>
          <div className="dropdown-content hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg">
            <button
              onClick={() => handleExport('pdf')}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              Export as PDF
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              Export as Excel
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              Export as CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              Export as JSON
            </button>
          </div>
        </div>
      </div>

      {/* Comparison results modal */}
      {comparison && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-auto">
            <h3 className="text-xl font-bold mb-4">Comparison Results</h3>
            <p className="mb-4">Similarity: {Math.round(comparison.similarity * 100)}%</p>
            <p className="mb-4">{comparison.summary}</p>
            <button
              onClick={() => toggleCompareSelection('')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .dropdown:hover .dropdown-content {
          display: block;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}