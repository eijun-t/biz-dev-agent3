/**
 * Orchestration Validation Schemas
 * 
 * オーケストレーション用のZodバリデーションスキーマ
 */

import { z } from 'zod';

/**
 * GraphState Zodスキーマ
 */
export const GraphStateSchema = z.object({
  // Core fields
  sessionId: z.string().uuid(),
  userId: z.string().uuid(),
  theme: z.string().min(1).max(500),
  
  // Agent states
  currentPhase: z.enum([
    'initializing',
    'researching',
    'ideating',
    'critiquing',
    'analyzing',
    'writing',
    'completed',
    'error'
  ]),
  currentAgent: z.enum([
    'researcher',
    'ideator',
    'critic',
    'analyst',
    'writer'
  ]).nullable(),
  
  // Progress tracking
  progress: z.number().min(0).max(100),
  startTime: z.date(),
  lastUpdateTime: z.date(),
  
  // Agent outputs (optional, validated separately)
  researcherOutput: z.any().optional(),
  ideatorOutput: z.any().optional(),
  criticOutput: z.any().optional(),
  analystOutput: z.any().optional(),
  writerOutput: z.any().optional(),
  
  // Error handling
  error: z.object({
    message: z.string(),
    agent: z.string().optional(),
    timestamp: z.date(),
    retryCount: z.number().min(0)
  }).optional()
});

/**
 * Job入力スキーマ
 */
export const JobInputSchema = z.object({
  theme: z.string().min(1).max(500),
  options: z.object({
    priority: z.number().min(-10).max(10).default(0),
    timeout: z.number().min(60000).max(3600000).optional(), // 1分〜1時間
    maxRetries: z.number().min(0).max(5).default(3),
    checkpointInterval: z.number().min(30000).optional(), // 30秒以上
    llmModel: z.string().optional(),
    temperature: z.number().min(0).max(2).optional()
  }).optional()
});

/**
 * Jobスキーマ
 */
export const JobSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  sessionId: z.string().uuid(),
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']),
  priority: z.number(),
  input: JobInputSchema,
  output: z.any().optional(),
  error: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional()
});

/**
 * 進捗イベントスキーマ
 */
export const ProgressEventSchema = z.object({
  type: z.enum([
    'progress',
    'phase_change',
    'agent_start',
    'agent_complete',
    'error',
    'completed'
  ]),
  sessionId: z.string().uuid(),
  timestamp: z.date(),
  data: z.object({
    progress: z.number().min(0).max(100).optional(),
    phase: z.enum([
      'initializing',
      'researching',
      'ideating',
      'critiquing',
      'analyzing',
      'writing',
      'completed',
      'error'
    ]).optional(),
    agent: z.enum([
      'researcher',
      'ideator',
      'critic',
      'analyst',
      'writer'
    ]).nullable().optional(),
    message: z.string().optional(),
    error: z.string().optional()
  })
});

/**
 * Checkpointスキーマ
 */
export const CheckpointSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  state: GraphStateSchema,
  createdAt: z.date()
});

/**
 * ResearcherOutput検証スキーマ
 */
export const ResearcherOutputSchema = z.object({
  research: z.object({
    theme: z.string(),
    insights: z.array(z.any()),
    sources: z.array(z.any())
  }),
  metrics: z.object({
    searchQueries: z.number(),
    resultsAnalyzed: z.number(),
    tokensUsed: z.number(),
    processingTimeMs: z.number()
  })
});

/**
 * IdeatorOutput検証スキーマ
 */
export const IdeatorOutputSchema = z.object({
  sessionId: z.string().uuid(),
  ideas: z.array(z.object({
    id: z.string(),
    title: z.string().max(30),
    description: z.string().max(500),
    targetCustomers: z.array(z.string()),
    customerPains: z.array(z.string()),
    valueProposition: z.string(),
    revenueModel: z.string(),
    estimatedRevenue: z.number(),
    implementationDifficulty: z.enum(['low', 'medium', 'high']),
    marketOpportunity: z.string()
  })).length(5), // 正確に5つのアイデア
  metadata: z.object({
    generatedAt: z.date(),
    modelUsed: z.string(),
    tokensUsed: z.number(),
    processingTimeMs: z.number(),
    researchDataId: z.string()
  }),
  qualityMetrics: z.object({
    structureCompleteness: z.number().min(0).max(100),
    contentConsistency: z.number().min(0).max(100),
    marketClarity: z.number().min(0).max(100)
  })
});

/**
 * CriticOutput検証スキーマ
 */
export const CriticOutputSchema = z.object({
  sessionId: z.string().uuid(),
  evaluationResults: z.array(z.object({
    ideaId: z.string(),
    ideaTitle: z.string(),
    marketScore: z.object({
      total: z.number().min(0).max(50),
      breakdown: z.object({
        marketSize: z.number().min(0).max(20),
        growthPotential: z.number().min(0).max(15),
        profitability: z.number().min(0).max(15)
      }),
      reasoning: z.string(),
      evidence: z.array(z.string())
    }),
    synergyScore: z.object({
      total: z.number().min(0).max(50),
      breakdown: z.object({
        capabilityMatch: z.number().min(0).max(20),
        synergyEffect: z.number().min(0).max(15),
        uniqueAdvantage: z.number().min(0).max(15)
      }),
      reasoning: z.string()
    }),
    totalScore: z.number().min(0).max(100),
    rank: z.number().min(1).max(5).optional(),
    recommendation: z.string(),
    risks: z.array(z.string()),
    opportunities: z.array(z.string())
  })),
  selectedIdea: z.any(), // 最高評価のアイデア
  summary: z.string(),
  metadata: z.object({
    evaluationId: z.string(),
    startTime: z.date(),
    endTime: z.date(),
    processingTime: z.number(),
    tokensUsed: z.number(),
    llmCalls: z.number(),
    cacheHits: z.number(),
    errors: z.array(z.string())
  })
});

/**
 * AnalystOutput検証スキーマ
 */
export const AnalystOutputSchema = z.object({
  sessionId: z.string().uuid(),
  ideaId: z.string(),
  analystData: z.object({
    businessIdea: z.any(),
    marketAnalysis: z.object({
      tam: z.number(),
      pam: z.number(),
      sam: z.number(),
      growthRate: z.number(),
      competitors: z.array(z.any()),
      marketTrends: z.array(z.string()),
      regulations: z.array(z.string())
    }),
    synergyAnalysis: z.object({
      totalScore: z.number(),
      breakdown: z.record(z.number()),
      initiatives: z.array(z.any()),
      risks: z.array(z.any())
    }),
    validationPlan: z.object({
      phases: z.array(z.any()),
      totalDuration: z.number(),
      requiredBudget: z.number()
    })
  }),
  metadata: z.object({
    generatedAt: z.date(),
    version: z.string(),
    tokensUsed: z.number().optional(),
    processingTimeMs: z.number().optional()
  })
});

/**
 * WriterOutput (HTMLReport)検証スキーマ
 */
export const WriterOutputSchema = z.object({
  id: z.string(),
  sessionId: z.string().uuid(),
  ideaId: z.string(),
  title: z.string(),
  htmlContent: z.string(),
  sections: z.array(z.object({
    id: z.string(),
    type: z.enum(['summary', 'business_model', 'market', 'synergy', 'validation']),
    title: z.string(),
    content: z.string(),
    order: z.number()
  })),
  metrics: z.object({
    tam: z.number(),
    pam: z.number(),
    sam: z.number(),
    revenueProjection3Y: z.number(),
    synergyScore: z.number().min(0).max(100),
    implementationDifficulty: z.enum(['low', 'medium', 'high']),
    timeToMarket: z.number()
  }),
  generatedAt: z.date(),
  generationTime: z.number()
});

/**
 * API Request/Response検証
 */
export const GenerateRequestSchema = z.object({
  theme: z.string().min(1).max(500),
  priority: z.number().min(-10).max(10).optional(),
  options: z.object({
    timeout: z.number().optional(),
    maxRetries: z.number().optional(),
    llmModel: z.string().optional(),
    temperature: z.number().optional()
  }).optional()
});

export const GenerateResponseSchema = z.object({
  jobId: z.string().uuid(),
  sessionId: z.string().uuid(),
  status: z.enum(['pending', 'processing']),
  estimatedCompletionTime: z.number().optional(),
  streamUrl: z.string().url()
});

export const JobStatusResponseSchema = z.object({
  job: JobSchema,
  progress: z.number().min(0).max(100).optional(),
  currentPhase: z.string().optional(),
  result: z.any().optional()
});

/**
 * エラーレスポンススキーマ
 */
export const ErrorResponseSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  details: z.any().optional(),
  retryable: z.boolean().optional()
});

/**
 * バリデーション関数のエクスポート
 */
export const validateGraphState = (data: unknown) => GraphStateSchema.parse(data);
export const validateJobInput = (data: unknown) => JobInputSchema.parse(data);
export const validateJob = (data: unknown) => JobSchema.parse(data);
export const validateProgressEvent = (data: unknown) => ProgressEventSchema.parse(data);
export const validateCheckpoint = (data: unknown) => CheckpointSchema.parse(data);
export const validateGenerateRequest = (data: unknown) => GenerateRequestSchema.parse(data);
export const validateGenerateResponse = (data: unknown) => GenerateResponseSchema.parse(data);

// Type exports
export type GraphState = z.infer<typeof GraphStateSchema>;
export type JobInput = z.infer<typeof JobInputSchema>;
export type Job = z.infer<typeof JobSchema>;
export type ProgressEvent = z.infer<typeof ProgressEventSchema>;
export type Checkpoint = z.infer<typeof CheckpointSchema>;
export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;
export type GenerateResponse = z.infer<typeof GenerateResponseSchema>;
export type JobStatusResponse = z.infer<typeof JobStatusResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;