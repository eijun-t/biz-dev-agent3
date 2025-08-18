/**
 * Report Comparison API
 * MVP Worker3 - Diff Algorithm Implementation
 * Highlights differences between reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as diff from 'diff';

// Comparison request schema
const CompareSchema = z.object({
  reportIds: z.array(z.string()).min(2).max(5),
  compareFields: z.array(z.enum([
    'title', 'summary', 'content', 'score', 'tags', 'agents', 'metadata'
  ])).optional(),
  diffMode: z.enum(['unified', 'split', 'inline']).optional(),
  contextLines: z.number().min(0).max(10).optional()
});

type CompareRequest = z.infer<typeof CompareSchema>;

// Diff result interface
interface DiffResult {
  field: string;
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  oldValue?: any;
  newValue?: any;
  changes?: Array<{
    type: 'add' | 'remove' | 'normal';
    value: string;
    lineNumber?: number;
  }>;
  similarity?: number;
}

// Report comparison engine
class ComparisonEngine {
  /**
   * Compare multiple reports
   */
  static compareReports(
    reports: any[],
    fields: string[] = ['title', 'summary', 'content', 'score', 'tags']
  ): {
    comparison: Record<string, DiffResult[]>;
    similarity: number;
    summary: string;
  } {
    const comparison: Record<string, DiffResult[]> = {};
    let totalSimilarity = 0;
    let fieldCount = 0;

    // Compare each field
    fields.forEach(field => {
      comparison[field] = this.compareField(reports, field);
      
      // Calculate average similarity
      const fieldSimilarity = comparison[field]
        .map(d => d.similarity || 0)
        .reduce((a, b) => a + b, 0) / comparison[field].length;
      
      totalSimilarity += fieldSimilarity;
      fieldCount++;
    });

    const overallSimilarity = fieldCount > 0 ? totalSimilarity / fieldCount : 0;

    return {
      comparison,
      similarity: Math.round(overallSimilarity * 100) / 100,
      summary: this.generateSummary(comparison, overallSimilarity)
    };
  }

  /**
   * Compare a specific field across reports
   */
  private static compareField(reports: any[], field: string): DiffResult[] {
    const results: DiffResult[] = [];
    
    // Compare consecutive pairs
    for (let i = 0; i < reports.length - 1; i++) {
      const report1 = reports[i];
      const report2 = reports[i + 1];
      
      const value1 = report1[field];
      const value2 = report2[field];
      
      if (value1 === value2) {
        results.push({
          field,
          type: 'unchanged',
          oldValue: value1,
          newValue: value2,
          similarity: 1.0
        });
      } else if (typeof value1 === 'string' && typeof value2 === 'string') {
        // Text comparison
        const changes = this.getTextDiff(value1, value2);
        const similarity = this.calculateTextSimilarity(value1, value2);
        
        results.push({
          field,
          type: 'modified',
          oldValue: value1,
          newValue: value2,
          changes,
          similarity
        });
      } else if (Array.isArray(value1) && Array.isArray(value2)) {
        // Array comparison
        const changes = this.getArrayDiff(value1, value2);
        const similarity = this.calculateArraySimilarity(value1, value2);
        
        results.push({
          field,
          type: 'modified',
          oldValue: value1,
          newValue: value2,
          changes,
          similarity
        });
      } else {
        // Simple value comparison
        results.push({
          field,
          type: value1 === undefined ? 'added' : value2 === undefined ? 'removed' : 'modified',
          oldValue: value1,
          newValue: value2,
          similarity: value1 === value2 ? 1.0 : 0.0
        });
      }
    }
    
    return results;
  }

  /**
   * Get text differences
   */
  private static getTextDiff(text1: string, text2: string): DiffResult['changes'] {
    const changes = diff.diffWords(text1, text2);
    
    return changes.map((part, index) => ({
      type: part.added ? 'add' : part.removed ? 'remove' : 'normal' as any,
      value: part.value,
      lineNumber: index + 1
    }));
  }

  /**
   * Calculate text similarity (Levenshtein distance)
   */
  private static calculateTextSimilarity(text1: string, text2: string): number {
    const maxLength = Math.max(text1.length, text2.length);
    if (maxLength === 0) return 1.0;
    
    const distance = this.levenshteinDistance(text1, text2);
    return 1 - (distance / maxLength);
  }

  /**
   * Levenshtein distance algorithm
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Get array differences
   */
  private static getArrayDiff(arr1: any[], arr2: any[]): DiffResult['changes'] {
    const changes: DiffResult['changes'] = [];
    
    // Items removed
    arr1.forEach(item => {
      if (!arr2.includes(item)) {
        changes.push({
          type: 'remove',
          value: String(item)
        });
      }
    });
    
    // Items added
    arr2.forEach(item => {
      if (!arr1.includes(item)) {
        changes.push({
          type: 'add',
          value: String(item)
        });
      }
    });
    
    // Items unchanged
    arr1.forEach(item => {
      if (arr2.includes(item)) {
        changes.push({
          type: 'normal',
          value: String(item)
        });
      }
    });
    
    return changes;
  }

  /**
   * Calculate array similarity (Jaccard index)
   */
  private static calculateArraySimilarity(arr1: any[], arr2: any[]): number {
    const set1 = new Set(arr1);
    const set2 = new Set(arr2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Generate comparison summary
   */
  private static generateSummary(
    comparison: Record<string, DiffResult[]>,
    similarity: number
  ): string {
    const changes = Object.values(comparison)
      .flat()
      .filter(d => d.type !== 'unchanged');
    
    if (changes.length === 0) {
      return 'Reports are identical';
    }
    
    const modifiedFields = Object.keys(comparison)
      .filter(field => comparison[field].some(d => d.type === 'modified'));
    
    return `${Math.round(similarity * 100)}% similar. Modified fields: ${modifiedFields.join(', ')}`;
  }
}

// Mock data fetcher
async function fetchReports(ids: string[]): Promise<any[]> {
  // In production, fetch from database
  // For demo, return mock data
  return ids.map((id, index) => ({
    id,
    title: `Report ${id}`,
    summary: `Summary for report ${id} with ${index % 2 === 0 ? 'different' : 'similar'} content`,
    content: `This is the detailed content for report ${id}. ${index % 2 === 0 ? 'Version A' : 'Version B'}`,
    score: 80 + index * 5,
    tags: ['ai', 'innovation', index % 2 === 0 ? 'healthcare' : 'energy'],
    agents: ['researcher', 'analyst', index % 2 === 0 ? 'writer' : 'ideator'],
    created_at: new Date(Date.now() - index * 86400000).toISOString(),
    metadata: {
      version: index + 1,
      author: `user${index}`
    }
  }));
}

// Main API handler
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse request
    const body = await request.json();
    const params = CompareSchema.parse(body);
    
    // Fetch reports
    const reports = await fetchReports(params.reportIds);
    
    if (reports.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 reports required for comparison' },
        { status: 400 }
      );
    }
    
    // Perform comparison
    const result = ComparisonEngine.compareReports(
      reports,
      params.compareFields
    );
    
    // Return comparison result
    return NextResponse.json({
      success: true,
      reportIds: params.reportIds,
      reports: reports.map(r => ({
        id: r.id,
        title: r.title,
        created_at: r.created_at
      })),
      comparison: result.comparison,
      similarity: result.similarity,
      summary: result.summary,
      responseTime: Date.now() - startTime
    }, {
      headers: {
        'X-Response-Time': `${Date.now() - startTime}ms`,
        'Cache-Control': 'private, max-age=300'
      }
    });
    
  } catch (error) {
    console.error('Comparison error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof z.ZodError
          ? 'Invalid comparison parameters'
          : 'Comparison failed',
        details: error instanceof z.ZodError ? error.errors : undefined,
        responseTime: Date.now() - startTime
      },
      { status: 400 }
    );
  }
}

// Export for testing
export { ComparisonEngine };