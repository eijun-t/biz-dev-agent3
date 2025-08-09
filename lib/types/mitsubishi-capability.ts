/**
 * Mitsubishi Estate Capability Definitions
 * 三菱地所のケイパビリティ定義
 */

/**
 * 三菱地所のケイパビリティ定義
 */
export const MITSUBISHI_CAPABILITIES = {
  // 不動産開発・運営
  real_estate_development: {
    category: 'real_estate_development' as const,
    name: '不動産開発・運営',
    capabilities: [
      {
        name: '大規模複合開発',
        description: '丸の内エリア30棟を中心とした大規模都市開発の実績とノウハウ',
        specificAssets: [
          '丸の内ビルディング',
          '新丸の内ビルディング',
          '丸の内オアゾ',
          '丸の内ブリックスクエア',
          'JP タワー',
          '丸の内永楽ビルディング',
          '大手町パークビルディング',
          '大手門タワー・ENEOSビル',
          '大手町ビル',
          '新大手町ビル'
        ],
      },
      {
        name: 'オフィス運営管理',
        description: '約3,000社のテナント企業との関係性と運営ノウハウ',
        specificAssets: [
          'テナント企業3,000社',
          '就業者約28万人',
          '年間賃料収入5,000億円以上',
        ],
      },
      {
        name: '商業施設運営',
        description: '丸の内仲通り、丸ビル、新丸ビル等の商業施設運営',
        specificAssets: [
          '丸の内仲通り（ブランドストリート）',
          '丸ビル・新丸ビル商業ゾーン',
          'KITTE',
          '丸の内ブリックスクエア',
        ],
      },
      {
        name: 'ホテル・サービスレジデンス',
        description: 'ロイヤルパークホテルズ、サービスアパートメント運営',
        specificAssets: [
          'ロイヤルパークホテルズ（全国展開）',
          'アスコット丸の内東京',
          'オークウッドプレミア東京',
        ],
      },
    ],
  },

  // 施設運営・サービス
  operations: {
    category: 'operations' as const,
    name: '施設運営・サービス',
    capabilities: [
      {
        name: 'ビル管理・メンテナンス',
        description: '三菱地所プロパティマネジメントによる総合管理',
        specificAssets: [
          '管理床面積900万㎡',
          '24時間365日監視体制',
          'BCP対応（事業継続計画）',
        ],
      },
      {
        name: 'リテール・商業運営',
        description: '三菱地所リテールマネジメントによる商業施設運営',
        specificAssets: [
          'プレミアムアウトレット（9施設）',
          'マークイズ（商業施設）',
          'アクアシティお台場',
        ],
      },
      {
        name: '空港運営',
        description: '地方空港の運営参画実績',
        specificAssets: [
          '高松空港',
          '福岡空港',
          '北海道内7空港',
          '熊本空港',
          '広島空港',
        ],
      },
      {
        name: '物流施設',
        description: 'ロジクロス等の物流施設開発・運営',
        specificAssets: [
          'ロジクロスシリーズ',
          '全国主要エリアでの展開',
        ],
      },
    ],
  },

  // 金融・投資
  finance: {
    category: 'finance' as const,
    name: '金融・投資',
    capabilities: [
      {
        name: 'REIT運用',
        description: '日本ビルファンド、ジャパンリアルエステイト投資法人の運用',
        specificAssets: [
          '日本ビルファンド（資産規模1.4兆円）',
          'ジャパンリアルエステイト投資法人（資産規模1.2兆円）',
          '日本オープンエンド不動産投資法人',
        ],
      },
      {
        name: '不動産ファンド',
        description: '私募ファンド、開発型ファンドの組成・運用',
        specificAssets: [
          '三菱地所投資顧問',
          'TA Realty（米国）',
          'Europa Capital（欧州）',
        ],
      },
      {
        name: '海外不動産投資',
        description: 'アジア、米国、欧州での不動産開発・投資',
        specificAssets: [
          'ロックフェラーグループ（米国）',
          'シンガポール事業',
          'ベトナム事業',
          'タイ事業',
          'インドネシア事業',
          '中国事業',
          'オーストラリア事業',
        ],
      },
    ],
  },

  // イノベーション・新規事業
  innovation: {
    category: 'innovation' as const,
    name: 'イノベーション・新規事業',
    capabilities: [
      {
        name: 'スタートアップ支援',
        description: 'FINOLAB、xLINK、Inspired.Lab等のイノベーション拠点運営',
        specificAssets: [
          'FINOLAB（フィンテック拠点）',
          'xLINK（ライフサイエンス拠点）',
          'Inspired.Lab（AI・ロボティクス拠点）',
          'TMIP（Tokyo Marunouchi Innovation Platform）',
          'EGG JAPAN（起業家支援施設）',
        ],
      },
      {
        name: 'コーポレートベンチャーキャピタル',
        description: '三菱地所アクセラレータープログラム、投資活動',
        specificAssets: [
          '年間投資額100億円規模',
          'アクセラレータープログラム（年2回）',
          'スタートアップ投資実績100社以上',
        ],
      },
      {
        name: 'DX・スマートシティ',
        description: '丸の内データコンソーシアム、スマートシティ推進',
        specificAssets: [
          'ビル内外のビッグデータ活用',
          'AI・IoT実証実験フィールド',
          '丸の内MaaS',
          'スマートビルディング',
        ],
      },
      {
        name: '脱炭素・サステナビリティ',
        description: 'RE100対応、カーボンニュートラル推進',
        specificAssets: [
          '2050年ネットゼロ目標',
          '再生可能エネルギー100%（RE100）',
          'ZEB（ネット・ゼロ・エネルギー・ビル）開発',
          'グリーンビルディング認証取得',
        ],
      },
    ],
  },

  // グループシナジー
  group_synergy: {
    category: 'group_synergy' as const,
    name: 'グループシナジー',
    capabilities: [
      {
        name: '三菱グループ連携',
        description: '三菱グループ各社との事業連携',
        specificAssets: [
          '三菱商事（総合商社）',
          '三菱UFJフィナンシャルグループ（金融）',
          '三菱重工業（重工業）',
          '三菱電機（電機）',
          '三菱ケミカル（化学）',
          'キリンホールディングス（食品）',
          '日本郵船（海運）',
        ],
      },
      {
        name: '産官学連携',
        description: '大学、研究機関、行政との連携',
        specificAssets: [
          '東京大学',
          '慶應義塾大学',
          '早稲田大学',
          '東京都',
          '千代田区',
          '内閣府',
          '経済産業省',
        ],
      },
    ],
  },
};

/**
 * ケイパビリティカテゴリの型定義
 */
export type CapabilityCategory = keyof typeof MITSUBISHI_CAPABILITIES;

/**
 * ケイパビリティ詳細の型定義
 */
export interface CapabilityDetail {
  name: string;
  description: string;
  specificAssets?: string[];
}

/**
 * ケイパビリティグループの型定義
 */
export interface CapabilityGroup {
  category: string;
  name: string;
  capabilities: CapabilityDetail[];
}

/**
 * 全ケイパビリティを配列として取得
 */
export function getAllCapabilities(): CapabilityGroup[] {
  return Object.values(MITSUBISHI_CAPABILITIES);
}

/**
 * 特定カテゴリのケイパビリティを取得
 */
export function getCapabilityByCategory(category: CapabilityCategory): CapabilityGroup {
  return MITSUBISHI_CAPABILITIES[category];
}

/**
 * ケイパビリティのフラットリストを取得
 */
export function getFlatCapabilityList(): Array<{
  category: string;
  categoryName: string;
  capability: CapabilityDetail;
}> {
  const result: Array<{
    category: string;
    categoryName: string;
    capability: CapabilityDetail;
  }> = [];

  Object.values(MITSUBISHI_CAPABILITIES).forEach((group) => {
    group.capabilities.forEach((capability) => {
      result.push({
        category: group.category,
        categoryName: group.name,
        capability,
      });
    });
  });

  return result;
}

/**
 * ケイパビリティの総資産数を取得
 */
export function getTotalAssetCount(): number {
  let count = 0;
  Object.values(MITSUBISHI_CAPABILITIES).forEach((group) => {
    group.capabilities.forEach((capability) => {
      count += capability.specificAssets?.length || 0;
    });
  });
  return count;
}

/**
 * ケイパビリティの説明文を生成
 */
export function generateCapabilityDescription(): string {
  const groups = getAllCapabilities();
  const descriptions: string[] = [];

  groups.forEach((group) => {
    const capabilities = group.capabilities.map(c => c.name).join('、');
    descriptions.push(`${group.name}（${capabilities}）`);
  });

  return descriptions.join('、');
}