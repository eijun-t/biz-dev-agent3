/**
 * Analyst Agent Implementation
 * 詳細市場分析とビジネス戦略深堀りエージェント
 */

import { BaseAgent, BaseAgentContext, AgentExecutionResult } from '@/lib/interfaces/base-agent';
import { ChatOpenAI } from '@langchain/openai';
import type { AnalystInput, AnalystOutput } from '@/lib/types/orchestration';
import { v4 as uuidv4 } from 'uuid';

export class AnalystAgentImpl extends BaseAgent {
  private llm: ChatOpenAI;

  constructor(context: BaseAgentContext) {
    super(context);
    this.llm = new ChatOpenAI({
      modelName: context.model || 'gpt-4o',
      temperature: 0.5, // 分析は低めの温度で
      maxTokens: context.maxTokens || 4000,
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  getAgentName(): 'analyst' {
    return 'analyst';
  }

  async execute(input: AnalystInput): Promise<AgentExecutionResult> {
    const startTime = Date.now();

    try {
      console.log('[Analyst] Starting detailed analysis...');
      
      // 選定されたアイデアとリサーチデータから詳細分析を生成
      const analysisPrompt = `
あなたは三菱地所の戦略分析専門家です。
以下の選定されたビジネスアイデアについて、詳細な市場分析とビジネス戦略を作成してください。

# 選定されたアイデア
タイトル: ${input.selectedIdea?.ideaTitle || input.selectedIdea?.title}
説明: ${input.selectedIdea?.recommendation || input.selectedIdea?.description || ''}
市場スコア: ${input.selectedIdea?.marketScore?.total || 'N/A'}
シナジースコア: ${input.selectedIdea?.synergyScore?.total || 'N/A'}

# リサーチデータ
${JSON.stringify(input.researchData?.research || input.researchData, null, 2)}

# 分析要件
以下の形式で純粋なJSON（コメントなし）を出力してください。コメントは絶対に含めないでください：
{
  "marketAnalysis": {
    "tam": [総市場規模（円）],
    "pam": [到達可能市場（円）],
    "sam": [獲得可能市場（円）],
    "growthRate": [年間成長率%],
    "competitors": [
      {
        "name": "競合企業名",
        "marketShare": [市場シェア%],
        "strengths": ["強み1", "強み2"],
        "weaknesses": ["弱み1", "弱み2"]
      }
    ],
    "marketTrends": ["トレンド1", "トレンド2", "トレンド3"],
    "regulations": ["規制1", "規制2"],
    "opportunities": ["機会1", "機会2"],
    "risks": ["リスク1", "リスク2"]
  },
  "synergyAnalysis": {
    "totalScore": [0-100のスコア],
    "breakdown": {
      "realEstateUtilization": [不動産活用スコア],
      "customerBaseUtilization": [顧客基盤活用スコア],
      "brandValueEnhancement": [ブランド価値向上スコア]
    },
    "capabilities": ["必要な能力1", "必要な能力2"],
    "resources": ["必要なリソース1", "必要なリソース2"],
    "synergies": ["シナジー効果1", "シナジー効果2"],
    "advantages": ["競争優位性1", "競争優位性2"],
    "initiatives": [
      {
        "title": "イニシアチブ名",
        "priority": "high/medium/low",
        "expectedImpact": "期待される影響"
      }
    ],
    "risks": [
      {
        "description": "リスク説明",
        "mitigation": "対策"
      }
    ]
  },
  "implementation": {
    "phase1": "第1フェーズ（0-6ヶ月）の実施内容",
    "phase2": "第2フェーズ（6-12ヶ月）の実施内容",
    "phase3": "第3フェーズ（12ヶ月以降）の実施内容",
    "keyMilestones": ["マイルストーン1", "マイルストーン2"],
    "successMetrics": ["成功指標1", "成功指標2"]
  }
}
`;

      console.log('[AnalystAgent] 🤖 Calling OpenAI GPT-4 for detailed market analysis...');
      const response = await this.llm.invoke(analysisPrompt);
      console.log('[AnalystAgent] ✅ GPT-4 analysis completed');
      const content = response.content.toString();
      console.log('[Analyst] Raw response:', content);
      
      // JSONを抽出（コードブロックにも対応）
      let jsonStr = content;
      
      // ```json ... ``` ブロックから抽出
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1];
      } else {
        // 通常のJSON抽出
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }
      }
      
      // JSONコメントを除去（// と /* */ スタイル）
      jsonStr = jsonStr
        .replace(/\/\*[\s\S]*?\*\//g, '') // /* ... */ コメントを削除
        .replace(/\/\/.*$/gm, ''); // // コメントを削除
      
      let analysisData;
      try {
        analysisData = JSON.parse(jsonStr);
        console.log('[Analyst] Successfully parsed analysis data');
      } catch (parseError) {
        console.error('[Analyst] JSON parse error:', parseError);
        console.error('[Analyst] Attempted to parse:', jsonStr.substring(0, 200));
        // エラーを再スロー（フォールバックを使用しない）
        throw new Error(`Failed to parse JSON response: ${parseError.message}`);
      }
      
      // AnalystOutput形式に整形
      // ideaIdがUUID形式でない場合は新しいUUIDを生成
      let ideaId = input.selectedIdea?.ideaId;
      if (!ideaId || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(ideaId)) {
        ideaId = uuidv4();
        console.log(`[Analyst] Generated new UUID: ${ideaId} (original was: ${input.selectedIdea?.ideaId})`);
      }
      
      const output: AnalystOutput = {
        sessionId: input.sessionId,
        ideaId: ideaId,
        analystData: {
          businessIdea: {
            id: ideaId,
            title: input.selectedIdea?.ideaTitle || input.selectedIdea?.title || 'ビジネスアイデア',
            description: input.selectedIdea?.recommendation || input.selectedIdea?.description || '',
            targetCustomer: {
              segment: '一般企業',
              ageRange: '30-60歳',
              occupation: 'ビジネスパーソン',
              needs: ['効率化', 'コスト削減', 'イノベーション'],
            },
            customerProblem: {
              problems: ['既存システムの非効率', '高コスト', '柔軟性の欠如'],
              priority: 'high' as const,
            },
            valueProposition: {
              uniqueValue: input.selectedIdea?.uniqueValue || '独自の価値提供',
              competitiveAdvantage: ['技術的優位性', 'ブランド力', '顧客基盤'],
            },
            revenueStructure: {
              sources: ['サブスクリプション', 'ライセンス販売', 'コンサルティング'],
              pricing: '段階的価格設定',
              costStructure: '変動費中心',
            },
          },
          marketAnalysis: analysisData.marketAnalysis,
          synergyAnalysis: {
            ...analysisData.synergyAnalysis,
            score: analysisData.synergyAnalysis.totalScore,
            implementation: analysisData.implementation,
          },
          validationPlan: {
            phases: [
              {
                name: 'POC' as const,
                duration: 3,
                milestones: [
                  analysisData.implementation?.phase1 || 'POC完了',
                  '技術検証',
                  'プロトタイプ作成'
                ],
                kpis: [
                  { metric: '技術的実現可能性', target: 100 },
                  { metric: 'プロトタイプ完成度', target: 80 }
                ],
                requiredResources: {
                  personnel: 5,
                  budget: 10000000,
                  technology: ['クラウド基盤', 'AI/MLツール'],
                },
                goNoGoCriteria: ['技術的実現可能性の確認', 'コスト妥当性'],
              },
              {
                name: 'Pilot' as const,
                duration: 6,
                milestones: [
                  analysisData.implementation?.phase2 || 'パイロット導入',
                  '効果測定',
                  'フィードバック収集'
                ],
                kpis: [
                  { metric: '顧客満足度', target: 85 },
                  { metric: '導入企業数', target: 5 }
                ],
                requiredResources: {
                  personnel: 10,
                  budget: 50000000,
                  technology: ['本番環境', '監視システム'],
                },
                goNoGoCriteria: ['ビジネス価値の実証', 'ROIの確認'],
              },
              {
                name: 'FullScale' as const,
                duration: 12,
                milestones: [
                  analysisData.implementation?.phase3 || '全面展開',
                  '収益化達成',
                  '市場シェア獲得'
                ],
                kpis: [
                  { metric: '月間売上', target: 100000000 },
                  { metric: '市場シェア', target: 10 }
                ],
                requiredResources: {
                  personnel: 20,
                  budget: 200000000,
                  technology: ['スケーラブルインフラ', 'グローバル対応'],
                },
                goNoGoCriteria: ['収益性の確認', '持続可能性'],
              },
            ],
            totalDuration: 21, // 3 + 6 + 12 = 21ヶ月
            requiredBudget: 260000000, // 10M + 50M + 200M = 260M
          },
        },
        metadata: {
          analysisId: `analysis-${Date.now()}`,
          completedAt: new Date(),
          confidence: 0.85,
          assumptions: [],
        },
      };

      console.log('[Analyst] Analysis completed successfully');
      
      return {
        success: true,
        data: output,
        metadata: {
          executionTime: Date.now() - startTime,
          tokensUsed: 0,
          model: this.context.model || 'gpt-4o',
        },
      };
    } catch (error) {
      console.error('[Analyst] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
        metadata: {
          executionTime: Date.now() - startTime,
          tokensUsed: 0,
          model: this.context.model || 'gpt-4o',
        },
      };
    }
  }

  getConfig(): Record<string, any> {
    return {
      name: this.getAgentName(),
      model: this.context.model || 'gpt-4o',
      temperature: 0.5,
      maxTokens: this.context.maxTokens || 4000,
    };
  }
}