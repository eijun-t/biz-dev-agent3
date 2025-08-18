'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { FilterCriteria, FilterPresets, FilterSuggestions } from '@/workspace/ui-revolution/lib/search/advanced-filter';
import { format } from 'date-fns';

interface SearchFilterPanelProps {
  onFilterChange: (filters: FilterCriteria) => void;
  onSearch: () => void;
  className?: string;
}

/**
 * Advanced Search Filter Panel
 * MVP Worker3 Support - Complete UI for Worker1
 */
export default function SearchFilterPanel({
  onFilterChange,
  onSearch,
  className = ''
}: SearchFilterPanelProps) {
  // State management
  const [filters, setFilters] = useState<FilterCriteria>({});
  const [isExpanded, setIsExpanded] = useState(false);
  const [activePreset, setActivePreset] = useState<string>('');
  const [suggestions, setSuggestions] = useState<FilterCriteria[]>([]);
  const [searchHistory, setSearchHistory] = useState<FilterCriteria[]>([]);

  // Load presets on mount
  useEffect(() => {
    FilterPresets.loadPresets();
  }, []);

  // Get suggestions when filters change
  useEffect(() => {
    const getSuggestions = async () => {
      const newSuggestions = await FilterSuggestions.getSuggestions(
        filters,
        searchHistory
      );
      setSuggestions(newSuggestions);
    };
    
    getSuggestions();
  }, [filters, searchHistory]);

  // Handle filter updates
  const updateFilter = useCallback((key: keyof FilterCriteria, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  }, [filters, onFilterChange]);

  // Handle search
  const handleSearch = useCallback(() => {
    // Add to history
    setSearchHistory(prev => [...prev.slice(-9), filters]);
    onSearch();
  }, [filters, onSearch]);

  // Apply preset
  const applyPreset = useCallback((presetName: string) => {
    const preset = FilterPresets.getPreset(presetName);
    if (preset) {
      setFilters(preset);
      onFilterChange(preset);
      setActivePreset(presetName);
    }
  }, [onFilterChange]);

  // Save current as preset
  const saveAsPreset = useCallback(() => {
    const name = prompt('Enter preset name:');
    if (name) {
      FilterPresets.savePreset(name, filters);
      setActivePreset(name);
    }
  }, [filters]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({});
    onFilterChange({});
    setActivePreset('');
  }, [onFilterChange]);

  // Apply suggestion
  const applySuggestion = useCallback((suggestion: FilterCriteria) => {
    setFilters(suggestion);
    onFilterChange(suggestion);
  }, [onFilterChange]);

  return (
    <div className={`search-filter-panel ${className} bg-white rounded-lg shadow-lg p-4`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Advanced Search</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-500 hover:text-blue-700"
        >
          {isExpanded ? 'Collapse ▼' : 'Expand ▶'}
        </button>
      </div>

      {/* Quick Search Bar */}
      <div className="quick-search mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search reports..."
            value={filters.query || ''}
            onChange={(e) => updateFilter('query', e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Search
          </button>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="presets mb-4">
        <div className="flex flex-wrap gap-2">
          {FilterPresets.getAllPresets().slice(0, 5).map(({ name }) => (
            <button
              key={name}
              onClick={() => applyPreset(name)}
              className={`px-3 py-1 rounded-full text-sm ${
                activePreset === name
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {name}
            </button>
          ))}
          <button
            onClick={saveAsPreset}
            className="px-3 py-1 rounded-full text-sm bg-green-500 text-white hover:bg-green-600"
          >
            + Save Preset
          </button>
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="expanded-filters space-y-4">
          {/* Search Fields */}
          <div className="filter-group">
            <label className="block text-sm font-medium mb-2">Search in:</label>
            <div className="flex gap-2 flex-wrap">
              {['title', 'summary', 'content', 'tags'].map(field => (
                <label key={field} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.queryFields?.includes(field as any) ?? true}
                    onChange={(e) => {
                      const currentFields = filters.queryFields || ['title', 'summary', 'tags'];
                      const newFields = e.target.checked
                        ? [...currentFields, field]
                        : currentFields.filter(f => f !== field);
                      updateFilter('queryFields', newFields);
                    }}
                    className="mr-1"
                  />
                  <span className="text-sm">{field}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="filter-group">
            <label className="block text-sm font-medium mb-2">Status:</label>
            <div className="flex gap-2 flex-wrap">
              {['draft', 'in_progress', 'completed', 'archived'].map(status => (
                <label key={status} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.status?.includes(status as any) ?? false}
                    onChange={(e) => {
                      const currentStatus = filters.status || [];
                      const newStatus = e.target.checked
                        ? [...currentStatus, status]
                        : currentStatus.filter(s => s !== status);
                      updateFilter('status', newStatus.length > 0 ? newStatus : undefined);
                    }}
                    className="mr-1"
                  />
                  <span className="text-sm">{status.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Score Range */}
          <div className="filter-group">
            <label className="block text-sm font-medium mb-2">Score Range:</label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min="0"
                max="100"
                placeholder="Min"
                value={filters.scoreMin || ''}
                onChange={(e) => updateFilter('scoreMin', e.target.value ? Number(e.target.value) : undefined)}
                className="w-20 px-2 py-1 border rounded"
              />
              <span>-</span>
              <input
                type="number"
                min="0"
                max="100"
                placeholder="Max"
                value={filters.scoreMax || ''}
                onChange={(e) => updateFilter('scoreMax', e.target.value ? Number(e.target.value) : undefined)}
                className="w-20 px-2 py-1 border rounded"
              />
              <div className="flex-1 mx-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.scoreMin || 0}
                  onChange={(e) => updateFilter('scoreMin', Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="filter-group">
            <label className="block text-sm font-medium mb-2">Date Range:</label>
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={filters.dateFrom ? format(filters.dateFrom, 'yyyy-MM-dd') : ''}
                onChange={(e) => updateFilter('dateFrom', e.target.value ? new Date(e.target.value) : undefined)}
                className="px-2 py-1 border rounded"
              />
              <span>to</span>
              <input
                type="date"
                value={filters.dateTo ? format(filters.dateTo, 'yyyy-MM-dd') : ''}
                onChange={(e) => updateFilter('dateTo', e.target.value ? new Date(e.target.value) : undefined)}
                className="px-2 py-1 border rounded"
              />
              <select
                value={filters.dateField || 'created_at'}
                onChange={(e) => updateFilter('dateField', e.target.value)}
                className="px-2 py-1 border rounded"
              >
                <option value="created_at">Created</option>
                <option value="updated_at">Updated</option>
              </select>
            </div>
          </div>

          {/* Tags Input */}
          <div className="filter-group">
            <label className="block text-sm font-medium mb-2">Tags:</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter tags separated by commas"
                onBlur={(e) => {
                  const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                  updateFilter('tags', tags.length > 0 ? tags : undefined);
                }}
                className="flex-1 px-2 py-1 border rounded"
              />
              <select
                value={filters.tagMatch || 'any'}
                onChange={(e) => updateFilter('tagMatch', e.target.value)}
                className="px-2 py-1 border rounded"
              >
                <option value="any">Any tag</option>
                <option value="all">All tags</option>
              </select>
            </div>
          </div>

          {/* Agents Filter */}
          <div className="filter-group">
            <label className="block text-sm font-medium mb-2">Agents:</label>
            <div className="flex gap-2 flex-wrap">
              {['researcher', 'ideator', 'critic', 'analyst', 'writer'].map(agent => (
                <label key={agent} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.agents?.includes(agent) ?? false}
                    onChange={(e) => {
                      const currentAgents = filters.agents || [];
                      const newAgents = e.target.checked
                        ? [...currentAgents, agent]
                        : currentAgents.filter(a => a !== agent);
                      updateFilter('agents', newAgents.length > 0 ? newAgents : undefined);
                    }}
                    className="mr-1"
                  />
                  <span className="text-sm">{agent}</span>
                </label>
              ))}
              <select
                value={filters.agentMatch || 'any'}
                onChange={(e) => updateFilter('agentMatch', e.target.value)}
                className="ml-2 px-2 py-1 border rounded text-sm"
              >
                <option value="any">Any agent</option>
                <option value="all">All agents</option>
              </select>
            </div>
          </div>

          {/* Sort Options */}
          <div className="filter-group">
            <label className="block text-sm font-medium mb-2">Sort by:</label>
            <div className="flex gap-2">
              <select
                value={filters.sortBy || 'created_at'}
                onChange={(e) => updateFilter('sortBy', e.target.value)}
                className="px-2 py-1 border rounded"
              >
                <option value="created_at">Created Date</option>
                <option value="updated_at">Updated Date</option>
                <option value="score">Score</option>
                <option value="title">Title</option>
                <option value="relevance">Relevance</option>
              </select>
              <select
                value={filters.sortOrder || 'desc'}
                onChange={(e) => updateFilter('sortOrder', e.target.value)}
                className="px-2 py-1 border rounded"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>

          {/* Favorites */}
          <div className="filter-group">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.isFavorite ?? false}
                onChange={(e) => updateFilter('isFavorite', e.target.checked ? true : undefined)}
                className="mr-2"
              />
              <span className="text-sm font-medium">Favorites only</span>
            </label>
          </div>
        </div>
      )}

      {/* Smart Suggestions */}
      {suggestions.length > 0 && (
        <div className="suggestions mt-4 p-3 bg-blue-50 rounded">
          <p className="text-sm font-medium mb-2">Suggested filters:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.slice(0, 3).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => applySuggestion(suggestion)}
                className="px-3 py-1 bg-white rounded-full text-sm hover:bg-blue-100"
              >
                💡 {Object.keys(suggestion).slice(0, 2).join(' + ')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="actions mt-4 flex justify-between">
        <button
          onClick={clearFilters}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Clear All
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Active Filters Summary */}
      {Object.keys(filters).length > 0 && (
        <div className="active-filters mt-4 p-3 bg-gray-50 rounded">
          <p className="text-sm font-medium mb-2">Active filters:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(filters).map(([key, value]) => (
              <span
                key={key}
                className="px-2 py-1 bg-white rounded-full text-xs border"
              >
                {key}: {Array.isArray(value) ? value.join(', ') : String(value)}
                <button
                  onClick={() => updateFilter(key as any, undefined)}
                  className="ml-1 text-red-500"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}