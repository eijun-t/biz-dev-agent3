/**
 * Advanced Search Filter System
 * MVP Worker3 Support for Worker1
 * High-performance filtering with multiple criteria
 */

import { z } from 'zod';

// Filter schema validation
export const FilterSchema = z.object({
  // Text search
  query: z.string().optional(),
  queryFields: z.array(z.enum(['title', 'summary', 'content', 'tags'])).optional(),
  
  // Status filters
  status: z.array(z.enum(['draft', 'in_progress', 'completed', 'archived'])).optional(),
  
  // Score range
  scoreMin: z.number().min(0).max(100).optional(),
  scoreMax: z.number().min(0).max(100).optional(),
  
  // Date range
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  dateField: z.enum(['created_at', 'updated_at']).optional(),
  
  // Agents filter
  agents: z.array(z.string()).optional(),
  agentMatch: z.enum(['any', 'all']).optional(),
  
  // Tags filter
  tags: z.array(z.string()).optional(),
  tagMatch: z.enum(['any', 'all']).optional(),
  
  // Favorites
  isFavorite: z.boolean().optional(),
  
  // Author
  author: z.string().optional(),
  
  // Sorting
  sortBy: z.enum(['created_at', 'updated_at', 'score', 'title', 'relevance']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  
  // Pagination
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional()
});

export type FilterCriteria = z.infer<typeof FilterSchema>;

/**
 * Advanced Filter Builder
 * Builds optimized SQL/Query for database
 */
export class FilterBuilder {
  private filters: FilterCriteria;
  private queryParts: string[] = [];
  private params: any = {};
  private paramIndex = 1;

  constructor(filters: FilterCriteria) {
    this.filters = FilterSchema.parse(filters);
  }

  /**
   * Build SQL WHERE clause
   */
  buildWhereClause(): { where: string; params: any } {
    this.queryParts = [];
    this.params = {};
    this.paramIndex = 1;

    // Full-text search
    if (this.filters.query) {
      this.addTextSearch();
    }

    // Status filter
    if (this.filters.status?.length) {
      this.addStatusFilter();
    }

    // Score range
    if (this.filters.scoreMin !== undefined || this.filters.scoreMax !== undefined) {
      this.addScoreFilter();
    }

    // Date range
    if (this.filters.dateFrom || this.filters.dateTo) {
      this.addDateFilter();
    }

    // Agents filter
    if (this.filters.agents?.length) {
      this.addAgentsFilter();
    }

    // Tags filter
    if (this.filters.tags?.length) {
      this.addTagsFilter();
    }

    // Favorites filter
    if (this.filters.isFavorite !== undefined) {
      this.addFavoriteFilter();
    }

    // Author filter
    if (this.filters.author) {
      this.addAuthorFilter();
    }

    const whereClause = this.queryParts.length > 0 
      ? `WHERE ${this.queryParts.join(' AND ')}`
      : '';

    return { where: whereClause, params: this.params };
  }

  /**
   * Build ORDER BY clause
   */
  buildOrderByClause(): string {
    const { sortBy = 'created_at', sortOrder = 'desc' } = this.filters;
    
    // Special handling for relevance sorting
    if (sortBy === 'relevance' && this.filters.query) {
      return `ORDER BY ts_rank(search_vector, plainto_tsquery($${this.paramIndex++})) DESC`;
    }
    
    return `ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;
  }

  /**
   * Build LIMIT OFFSET clause
   */
  buildPaginationClause(): string {
    const { page = 1, limit = 20 } = this.filters;
    const offset = (page - 1) * limit;
    
    return `LIMIT ${limit} OFFSET ${offset}`;
  }

  /**
   * Get complete SQL query
   */
  getQuery(): { sql: string; params: any } {
    const { where, params } = this.buildWhereClause();
    const orderBy = this.buildOrderByClause();
    const pagination = this.buildPaginationClause();
    
    const sql = `
      SELECT * FROM reports
      ${where}
      ${orderBy}
      ${pagination}
    `.trim();
    
    return { sql, params };
  }

  // Private helper methods
  private addTextSearch() {
    const fields = this.filters.queryFields || ['title', 'summary', 'tags'];
    const searchConditions = fields.map(field => {
      if (field === 'tags') {
        return `array_to_string(${field}, ' ') ILIKE $${this.paramIndex}`;
      }
      return `${field} ILIKE $${this.paramIndex}`;
    });
    
    this.queryParts.push(`(${searchConditions.join(' OR ')})`);
    this.params[`$${this.paramIndex++}`] = `%${this.filters.query}%`;
  }

  private addStatusFilter() {
    this.queryParts.push(`status = ANY($${this.paramIndex})`);
    this.params[`$${this.paramIndex++}`] = this.filters.status;
  }

  private addScoreFilter() {
    if (this.filters.scoreMin !== undefined) {
      this.queryParts.push(`score >= $${this.paramIndex}`);
      this.params[`$${this.paramIndex++}`] = this.filters.scoreMin;
    }
    if (this.filters.scoreMax !== undefined) {
      this.queryParts.push(`score <= $${this.paramIndex}`);
      this.params[`$${this.paramIndex++}`] = this.filters.scoreMax;
    }
  }

  private addDateFilter() {
    const field = this.filters.dateField || 'created_at';
    
    if (this.filters.dateFrom) {
      this.queryParts.push(`${field} >= $${this.paramIndex}`);
      this.params[`$${this.paramIndex++}`] = this.filters.dateFrom;
    }
    if (this.filters.dateTo) {
      this.queryParts.push(`${field} <= $${this.paramIndex}`);
      this.params[`$${this.paramIndex++}`] = this.filters.dateTo;
    }
  }

  private addAgentsFilter() {
    const match = this.filters.agentMatch || 'any';
    
    if (match === 'all') {
      this.queryParts.push(`agents @> $${this.paramIndex}`);
    } else {
      this.queryParts.push(`agents && $${this.paramIndex}`);
    }
    
    this.params[`$${this.paramIndex++}`] = this.filters.agents;
  }

  private addTagsFilter() {
    const match = this.filters.tagMatch || 'any';
    
    if (match === 'all') {
      this.queryParts.push(`tags @> $${this.paramIndex}`);
    } else {
      this.queryParts.push(`tags && $${this.paramIndex}`);
    }
    
    this.params[`$${this.paramIndex++}`] = this.filters.tags;
  }

  private addFavoriteFilter() {
    this.queryParts.push(`is_favorite = $${this.paramIndex}`);
    this.params[`$${this.paramIndex++}`] = this.filters.isFavorite;
  }

  private addAuthorFilter() {
    this.queryParts.push(`author ILIKE $${this.paramIndex}`);
    this.params[`$${this.paramIndex++}`] = `%${this.filters.author}%`;
  }
}

/**
 * Filter Preset Manager
 * Save and load common filter combinations
 */
export class FilterPresets {
  private static presets = new Map<string, FilterCriteria>();

  // Default presets
  static {
    this.presets.set('recent', {
      sortBy: 'created_at',
      sortOrder: 'desc',
      limit: 10
    });

    this.presets.set('high-score', {
      scoreMin: 80,
      sortBy: 'score',
      sortOrder: 'desc'
    });

    this.presets.set('completed', {
      status: ['completed'],
      sortBy: 'updated_at',
      sortOrder: 'desc'
    });

    this.presets.set('favorites', {
      isFavorite: true,
      sortBy: 'created_at',
      sortOrder: 'desc'
    });

    this.presets.set('today', {
      dateFrom: new Date(new Date().setHours(0, 0, 0, 0)),
      dateTo: new Date(new Date().setHours(23, 59, 59, 999))
    });
  }

  static getPreset(name: string): FilterCriteria | undefined {
    return this.presets.get(name);
  }

  static savePreset(name: string, filters: FilterCriteria) {
    this.presets.set(name, filters);
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      const allPresets = Object.fromEntries(this.presets);
      localStorage.setItem('filterPresets', JSON.stringify(allPresets));
    }
  }

  static loadPresets() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('filterPresets');
      if (saved) {
        const presets = JSON.parse(saved);
        Object.entries(presets).forEach(([name, filters]) => {
          this.presets.set(name, filters as FilterCriteria);
        });
      }
    }
  }

  static getAllPresets(): Array<{ name: string; filters: FilterCriteria }> {
    return Array.from(this.presets.entries()).map(([name, filters]) => ({
      name,
      filters
    }));
  }
}

/**
 * Smart Filter Suggestions
 * AI-powered filter recommendations
 */
export class FilterSuggestions {
  static async getSuggestions(
    currentFilters: FilterCriteria,
    searchHistory: FilterCriteria[]
  ): Promise<FilterCriteria[]> {
    const suggestions: FilterCriteria[] = [];

    // Suggest based on current query
    if (currentFilters.query) {
      // Suggest related tags
      const relatedTags = await this.findRelatedTags(currentFilters.query);
      if (relatedTags.length > 0) {
        suggestions.push({
          ...currentFilters,
          tags: relatedTags
        });
      }
    }

    // Suggest based on history
    if (searchHistory.length > 0) {
      const commonFilters = this.findCommonPatterns(searchHistory);
      suggestions.push(...commonFilters);
    }

    // Time-based suggestions
    const timeBasedSuggestion = this.getTimeBasedSuggestion();
    if (timeBasedSuggestion) {
      suggestions.push(timeBasedSuggestion);
    }

    return suggestions.slice(0, 5); // Return top 5 suggestions
  }

  private static async findRelatedTags(query: string): Promise<string[]> {
    // Simulate tag relationship lookup
    const tagRelations: Record<string, string[]> = {
      'ai': ['machine-learning', 'deep-learning', 'artificial-intelligence'],
      'healthcare': ['medical', 'health-tech', 'biotech'],
      'energy': ['renewable', 'solar', 'wind', 'sustainable']
    };

    const lowerQuery = query.toLowerCase();
    return tagRelations[lowerQuery] || [];
  }

  private static findCommonPatterns(history: FilterCriteria[]): FilterCriteria[] {
    // Analyze history for common patterns
    const patterns: FilterCriteria[] = [];
    
    // Find most used status
    const statusCounts = new Map<string, number>();
    history.forEach(filter => {
      filter.status?.forEach(status => {
        statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
      });
    });

    if (statusCounts.size > 0) {
      const mostUsedStatus = Array.from(statusCounts.entries())
        .sort((a, b) => b[1] - a[1])[0][0];
      
      patterns.push({
        status: [mostUsedStatus as any]
      });
    }

    return patterns;
  }

  private static getTimeBasedSuggestion(): FilterCriteria | null {
    const hour = new Date().getHours();
    
    // Morning: Show today's reports
    if (hour >= 6 && hour < 12) {
      return FilterPresets.getPreset('today') || null;
    }
    
    // Afternoon: Show high-priority
    if (hour >= 12 && hour < 18) {
      return FilterPresets.getPreset('high-score') || null;
    }
    
    // Evening: Show recent
    if (hour >= 18) {
      return FilterPresets.getPreset('recent') || null;
    }
    
    return null;
  }
}

// Export utilities
export default {
  FilterSchema,
  FilterBuilder,
  FilterPresets,
  FilterSuggestions
};