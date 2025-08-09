/**
 * Ideator API Route Tests
 * APIエンドポイントのテスト
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST, GET } from '../../app/api/agents/ideator/route';

// モジュールのモック
jest.mock('@/lib/agents/ideator', () => ({
  IdeatorAgent: jest.fn().mockImplementation(() => ({
    generateIdeas: jest.fn(),
    getMetrics: jest.fn().mockReturnValue({
      tokenUsage: {
        promptTokens: 100,
        completionTokens: 500,
        totalTokens: 600
      },
      performanceMetrics: {
        lastInvocationTime: 100,
        averageInvocationTime: 150,
        retryCount: 0,
        successCount: 1,
        errorCount: 0
      }
    })
  }))
}));

jest.mock('@/lib/agents/broad-researcher', () => ({
  BroadResearcherAgent: jest.fn().mockImplementation(() => ({
    research: jest.fn(),
    enhance: jest.fn()
  }))
}));

describe('Ideator API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.SERPER_API_KEY = 'test-key';
  });

  describe('POST /api/agents/ideator', () => {
    const mockEnhancedOutput = {
      processedResearch: {
        summary: 'Test research summary',
        sources: ['source1', 'source2'],
        queries: ['query1']
      },
      facts: ['fact1', 'fact2'],
      metrics: {
        marketSize: 1000000000,
        growthRate: 15
      },
      entities: [
        { name: 'Entity1', type: 'company', relevance: 0.9 }
      ],
      detailedAnalysis: {
        marketTrends: ['trend1'],
        competitiveLandscape: 'competitive',
        opportunities: ['opportunity1'],
        challenges: ['challenge1'],
        recommendations: ['recommendation1']
      }
    };

    const mockIdeatorOutput = {
      ideas: [
        {
          id: 'idea-1',
          title: 'Test Idea',
          description: 'Test idea description that is long enough',
          targetCustomers: ['Customer1'],
          customerPains: ['Pain1'],
          valueProposition: 'Test value proposition',
          revenueModel: 'Subscription model',
          estimatedRevenue: 100000000,
          implementationDifficulty: 'medium' as const,
          marketOpportunity: 'Large market opportunity'
        }
      ],
      summary: 'Generated 1 idea',
      metadata: {
        totalIdeas: 1,
        averageRevenue: 100000000,
        marketSize: 1000000000,
        generationDate: new Date().toISOString()
      }
    };

    it('should generate ideas with provided research data', async () => {
      const { IdeatorAgent } = await import('@/lib/agents/ideator');
      const mockGenerateIdeas = jest.fn().mockResolvedValue(mockIdeatorOutput);
      (IdeatorAgent as jest.Mock).mockImplementation(() => ({
        generateIdeas: mockGenerateIdeas,
        getMetrics: jest.fn().mockReturnValue({
          tokenUsage: { promptTokens: 100, completionTokens: 500, totalTokens: 600 },
          performanceMetrics: {}
        })
      }));

      const request = new NextRequest('http://localhost:3000/api/agents/ideator', {
        method: 'POST',
        body: JSON.stringify({
          query: 'AI business opportunities',
          researchOutput: mockEnhancedOutput,
          skipResearch: true,
          ideationRequest: {
            numberOfIdeas: 3,
            temperature: 0.8
          }
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.ideas).toHaveLength(1);
      expect(data.data.ideas[0].title).toBe('Test Idea');
      expect(mockGenerateIdeas).toHaveBeenCalledWith(
        mockEnhancedOutput,
        expect.objectContaining({
          numberOfIdeas: 3,
          temperature: 0.8
        })
      );
    });

    it('should conduct research when skipResearch is false', async () => {
      const { BroadResearcherAgent } = await import('@/lib/agents/broad-researcher');
      const mockResearch = jest.fn().mockResolvedValue({});
      const mockEnhance = jest.fn().mockResolvedValue(mockEnhancedOutput);
      
      (BroadResearcherAgent as jest.Mock).mockImplementation(() => ({
        research: mockResearch,
        enhance: mockEnhance
      }));

      const { IdeatorAgent } = await import('@/lib/agents/ideator');
      (IdeatorAgent as jest.Mock).mockImplementation(() => ({
        generateIdeas: jest.fn().mockResolvedValue(mockIdeatorOutput),
        getMetrics: jest.fn().mockReturnValue({
          tokenUsage: { promptTokens: 100, completionTokens: 500, totalTokens: 600 },
          performanceMetrics: {}
        })
      }));

      const request = new NextRequest('http://localhost:3000/api/agents/ideator', {
        method: 'POST',
        body: JSON.stringify({
          query: 'AI business opportunities',
          skipResearch: false
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockResearch).toHaveBeenCalledWith('AI business opportunities');
      expect(mockEnhance).toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const request = new NextRequest('http://localhost:3000/api/agents/ideator', {
        method: 'POST',
        body: JSON.stringify({
          // Missing required 'query' field
          ideationRequest: {
            numberOfIdeas: 3
          }
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request parameters');
    });

    it('should handle API errors gracefully', async () => {
      const { IdeatorAgent } = await import('@/lib/agents/ideator');
      (IdeatorAgent as jest.Mock).mockImplementation(() => ({
        generateIdeas: jest.fn().mockRejectedValue(new Error('API key invalid')),
        getMetrics: jest.fn()
      }));

      const request = new NextRequest('http://localhost:3000/api/agents/ideator', {
        method: 'POST',
        body: JSON.stringify({
          query: 'test query',
          researchOutput: mockEnhancedOutput,
          skipResearch: true
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('API configuration error');
    });

    it('should handle rate limit errors', async () => {
      const { IdeatorAgent } = await import('@/lib/agents/ideator');
      (IdeatorAgent as jest.Mock).mockImplementation(() => ({
        generateIdeas: jest.fn().mockRejectedValue(new Error('rate limit exceeded')),
        getMetrics: jest.fn()
      }));

      const request = new NextRequest('http://localhost:3000/api/agents/ideator', {
        method: 'POST',
        body: JSON.stringify({
          query: 'test query',
          researchOutput: mockEnhancedOutput,
          skipResearch: true
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toContain('Rate limit exceeded');
    });
  });

  describe('GET /api/agents/ideator', () => {
    it('should return API status', async () => {
      const request = new NextRequest('http://localhost:3000/api/agents/ideator', {
        method: 'GET'
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('ready');
      expect(data.configuration.openai).toBe('configured');
      expect(data.configuration.serper).toBe('configured');
      expect(data.version).toBe('1.0.0');
    });

    it('should indicate missing API keys', async () => {
      delete process.env.OPENAI_API_KEY;
      delete process.env.SERPER_API_KEY;

      const request = new NextRequest('http://localhost:3000/api/agents/ideator', {
        method: 'GET'
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.configuration.openai).toBe('missing');
      expect(data.configuration.serper).toBe('missing');
    });
  });
});