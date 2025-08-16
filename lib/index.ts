/**
 * 自律型アイディエーションエージェントAI
 * メインエクスポートファイル
 */

// オーケストレーション
export { MainOrchestration } from './orchestration/main';
export type { OrchestrationConfig, OrchestrationResult } from './orchestration/main';

// 5つのエージェント (Kiro仕様準拠)
export { ProductionResearcherAgent } from './agents/broad-researcher/production-researcher-agent';
export { IdeatorAgentAdapter } from './agents/ideator/ideator-agent-adapter';
export { CriticAgentAdapter } from './agents/critic/critic-agent-adapter';
export { AnalystAgentImpl } from './agents/analyst/analyst-agent-impl';
export { WriterAgent } from './agents/writer/writer-agent';

// 基本インターフェース
export type { BaseAgent, BaseAgentContext, AgentExecutionResult } from './interfaces/base-agent';

// サポートサービス
export { GoogleSearchService } from './services/google/google-search-service';