'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, FileText, TrendingUp, Users, Lightbulb } from 'lucide-react';
import Link from 'next/link';

interface ReportData {
  id: string;
  title: string;
  topic: string;
  createdAt: string;
  summary: string;
  ideas: Array<{
    title: string;
    description: string;
    marketSize?: string;
    targetAudience?: string;
    feasibility?: number;
    uniqueness?: number;
  }>;
  marketAnalysis?: {
    totalMarketSize: string;
    growthRate: string;
    keyTrends: string[];
  };
  competitiveAnalysis?: {
    mainCompetitors: string[];
    marketGaps: string[];
  };
}

export default function ReportPage() {
  const params = useParams();
  const reportId = params.id as string;
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // シミュレートされたレポートデータを生成
    setTimeout(() => {
      const mockReport: ReportData = {
        id: reportId,
        title: 'OOH広告メディア事業 - ビジネスアイデアレポート',
        topic: 'OOH広告メディア事業',
        createdAt: new Date().toISOString(),
        summary: 'OOH（Out-of-Home）広告メディア事業に関する5つの革新的なビジネスアイデアを生成しました。デジタルサイネージ、AI技術、位置情報データを活用した新しい広告配信モデルに重点を置いています。',
        ideas: [
          {
            title: 'AI搭載インタラクティブデジタルサイネージネットワーク',
            description: '顔認識と感情分析AIを搭載したデジタルサイネージで、視聴者の属性や感情に応じてリアルタイムで広告コンテンツを最適化。プライバシー保護に配慮した匿名化技術を採用。',
            marketSize: '2,500億円',
            targetAudience: '大手広告主、商業施設オーナー',
            feasibility: 85,
            uniqueness: 90
          },
          {
            title: 'モビリティ連動型動的OOH広告プラットフォーム',
            description: 'バス、タクシー、配送車両の外装をデジタルディスプレイ化し、位置情報と時間帯に応じて広告を動的に変更。移動する広告媒体として新しい価値を創出。',
            marketSize: '800億円',
            targetAudience: '地域密着型企業、イベント主催者',
            feasibility: 70,
            uniqueness: 95
          },
          {
            title: 'AR/VR統合型OOH広告エコシステム',
            description: '物理的な看板とAR/VRコンテンツを融合し、スマートフォンアプリを通じてインタラクティブな広告体験を提供。ゲーミフィケーション要素で engagement を向上。',
            marketSize: '1,200億円',
            targetAudience: 'Z世代、ミレニアル世代向けブランド',
            feasibility: 75,
            uniqueness: 88
          },
          {
            title: 'サステナブルOOH広告ソリューション',
            description: 'ソーラーパネル搭載の自己発電型デジタルサイネージ。カーボンクレジット取得可能で、SDGs対応を重視する企業向けの環境配慮型広告媒体。',
            marketSize: '600億円',
            targetAudience: 'ESG重視企業、自治体',
            feasibility: 80,
            uniqueness: 82
          },
          {
            title: 'プログラマティックOOH広告取引所',
            description: 'リアルタイムビッディング（RTB）システムを活用したOOH広告の自動売買プラットフォーム。在庫管理、価格最適化、効果測定を一元化。',
            marketSize: '1,800億円',
            targetAudience: 'メディアエージェンシー、DSP事業者',
            feasibility: 78,
            uniqueness: 85
          }
        ],
        marketAnalysis: {
          totalMarketSize: '6,500億円',
          growthRate: '年率8.5%',
          keyTrends: [
            'デジタル化の加速',
            'プログラマティック広告の普及',
            'パーソナライゼーション需要の増加',
            '環境配慮型メディアへの関心'
          ]
        },
        competitiveAnalysis: {
          mainCompetitors: [
            'JCDecaux',
            'Clear Channel Outdoor',
            'Lamar Advertising',
            '東急エージェンシー'
          ],
          marketGaps: [
            'インタラクティブ性の不足',
            '効果測定の精度',
            '在庫の可視化',
            '小規模広告主へのアクセス'
          ]
        }
      };
      setReport(mockReport);
      setLoading(false);
    }, 1000);
  }, [reportId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">レポートを読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-gray-500">レポートが見つかりません</p>
            <div className="text-center mt-4">
              <Link href="/orchestration">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  ダッシュボードに戻る
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <Link href="/orchestration">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            ダッシュボードに戻る
          </Button>
        </Link>
        <Button>
          <Download className="w-4 h-4 mr-2" />
          PDFダウンロード
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <FileText className="w-6 h-6" />
            {report.title}
          </CardTitle>
          <div className="flex gap-2 mt-2">
            <Badge variant="secondary">{report.topic}</Badge>
            <Badge variant="outline">
              {new Date(report.createdAt).toLocaleDateString('ja-JP')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">{report.summary}</p>
        </CardContent>
      </Card>

      {report.marketAnalysis && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              市場分析
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">市場規模</p>
                <p className="text-xl font-semibold">{report.marketAnalysis.totalMarketSize}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">成長率</p>
                <p className="text-xl font-semibold">{report.marketAnalysis.growthRate}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">主要トレンド</p>
              <div className="flex flex-wrap gap-2">
                {report.marketAnalysis.keyTrends.map((trend, index) => (
                  <Badge key={index} variant="outline">{trend}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          ビジネスアイデア
        </h2>
        {report.ideas.map((idea, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-lg">{index + 1}. {idea.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{idea.description}</p>
              <div className="grid md:grid-cols-4 gap-4">
                {idea.marketSize && (
                  <div>
                    <p className="text-sm text-gray-500">推定市場規模</p>
                    <p className="font-semibold">{idea.marketSize}</p>
                  </div>
                )}
                {idea.targetAudience && (
                  <div>
                    <p className="text-sm text-gray-500">ターゲット</p>
                    <p className="font-semibold">{idea.targetAudience}</p>
                  </div>
                )}
                {idea.feasibility && (
                  <div>
                    <p className="text-sm text-gray-500">実現可能性</p>
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${idea.feasibility}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold">{idea.feasibility}%</span>
                    </div>
                  </div>
                )}
                {idea.uniqueness && (
                  <div>
                    <p className="text-sm text-gray-500">独自性</p>
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${idea.uniqueness}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold">{idea.uniqueness}%</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {report.competitiveAnalysis && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              競合分析
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-2">主要競合</p>
                <ul className="space-y-1">
                  {report.competitiveAnalysis.mainCompetitors.map((competitor, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                      {competitor}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">市場ギャップ</p>
                <ul className="space-y-1">
                  {report.competitiveAnalysis.marketGaps.map((gap, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                      {gap}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}