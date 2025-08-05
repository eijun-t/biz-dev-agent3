import { WebSearchResult } from '@/lib/types'

export interface WebSearchQuery {
  query: string
  gl?: string // 地域コード (例: jp)
  hl?: string // 言語コード (例: ja)
  num?: number // 結果数
  type?: 'search' | 'news' | 'images'
}

export interface WebSearchResponse {
  searchResults: WebSearchResult[]
  totalResults: number
  searchTime: number
  cached: boolean
}

export interface WebSearchService {
  search(query: WebSearchQuery): Promise<WebSearchResponse>
  clearCache(): void
}