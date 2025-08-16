/**
 * Google Custom Search API Service
 * Google Custom Search APIを使用した検索サービス
 */

import { z } from 'zod';

// Google Custom Search API レスポンスのスキーマ
const googleSearchResponseSchema = z.object({
  items: z.array(z.object({
    title: z.string(),
    link: z.string(),
    snippet: z.string(),
    htmlSnippet: z.string().optional(),
  })).optional(),
  searchInformation: z.object({
    totalResults: z.string(),
    searchTime: z.number(),
  }).optional(),
});

export interface GoogleSearchConfig {
  apiKey: string;
  searchEngineId: string; // cx parameter
  defaultLimit?: number;
}

export interface SearchQuery {
  query: string;
  limit?: number;
  language?: string;
  country?: string;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  content?: string;
}

export interface SearchResponse {
  searchResults: SearchResult[];
  totalResults: number;
  searchTime: number;
  cached?: boolean;
}

export class GoogleSearchService {
  private apiKey: string;
  private searchEngineId: string;
  private baseUrl = 'https://www.googleapis.com/customsearch/v1';
  private cache = new Map<string, SearchResult[]>();
  private defaultLimit: number;

  constructor(config: GoogleSearchConfig) {
    this.apiKey = config.apiKey;
    this.searchEngineId = config.searchEngineId;
    this.defaultLimit = config.defaultLimit || 10;
  }

  /**
   * Google Custom Search APIで検索を実行
   */
  async search(searchQuery: SearchQuery): Promise<SearchResponse> {
    const cacheKey = JSON.stringify(searchQuery);
    
    // キャッシュチェック
    if (this.cache.has(cacheKey)) {
      console.log(`[GoogleSearchService] Cache hit for query: "${searchQuery.query}"`);
      const cached = this.cache.get(cacheKey)!;
      return {
        searchResults: cached,
        totalResults: cached.length,
        searchTime: 0,
        cached: true
      };
    }

    console.log(`[GoogleSearchService] 🔍 API Call - Query: "${searchQuery.query}"`);
    
    try {
      // URLパラメータの構築
      const params = new URLSearchParams({
        key: this.apiKey,
        cx: this.searchEngineId,
        q: searchQuery.query,
        num: String(searchQuery.limit || this.defaultLimit),
      });

      // 言語設定
      if (searchQuery.language) {
        params.append('lr', `lang_${searchQuery.language}`);
      }
      
      // 国設定
      if (searchQuery.country) {
        params.append('gl', searchQuery.country);
      }

      const response = await fetch(`${this.baseUrl}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google Search API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        throw new Error(`Google Search API failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const validatedData = googleSearchResponseSchema.parse(data);

      // 結果を変換
      const searchResults: SearchResult[] = (validatedData.items || []).map(item => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet,
        content: item.snippet, // Google APIでは全文は取得できない
      }));

      // キャッシュに保存
      this.cache.set(cacheKey, searchResults);

      // 15分後にキャッシュをクリア
      setTimeout(() => {
        this.cache.delete(cacheKey);
      }, 15 * 60 * 1000);

      return {
        searchResults,
        totalResults: parseInt(validatedData.searchInformation?.totalResults || '0'),
        searchTime: validatedData.searchInformation?.searchTime || 0,
        cached: false
      };

    } catch (error) {
      console.error('Google Search API error:', error);
      throw error;
    }
  }

  /**
   * エラー時のモックデータ
   */
  private getMockData(query: string): SearchResponse {
    console.error(`[GoogleSearchService] API call failed for query: "${query}"`);
    throw new Error('Google Search API failed and no fallback is allowed');
  }

  /**
   * 複数のクエリを並列実行
   */
  async searchMultiple(queries: string[]): Promise<SearchResponse[]> {
    const promises = queries.map(query => 
      this.search({ query, limit: 5 })
    );
    return Promise.all(promises);
  }
}