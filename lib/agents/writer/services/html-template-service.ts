/**
 * HTML Template Service
 * HTMLテンプレートサービス - HTMLコンテンツの生成とスタイリング
 */

import { ReportSection, ReportMetrics } from '@/lib/types/writer';

export class HtmlTemplateService {
  /**
   * HTMLレポートを生成
   */
  async generateHtml(
    data: any,
    sections: ReportSection[],
    metrics: ReportMetrics
  ): Promise<string> {
    const { businessIdea } = data;
    
    return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(businessIdea.title)} - ビジネスアイデアレポート</title>
    ${this.generateStyles()}
</head>
<body>
    <div class="container">
        ${this.generateHeader(businessIdea.title, new Date())}
        ${this.generateMetricsBar(metrics)}
        ${this.generateNavigation(sections)}
        <main class="content">
            ${sections.map(section => this.generateSection(section)).join('')}
        </main>
        ${this.generateFooter()}
    </div>
    ${this.generateScripts()}
</body>
</html>`;
  }

  /**
   * CSSスタイルを生成
   */
  private generateStyles(): string {
    return `<style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans JP', sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        
        header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            text-align: center;
        }
        
        h1 {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
        }
        
        .date {
            opacity: 0.9;
            font-size: 0.9rem;
        }
        
        .metrics-bar {
            background: #f8f9fa;
            padding: 1.5rem;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            border-bottom: 2px solid #e9ecef;
        }
        
        .metric-item {
            text-align: center;
        }
        
        .metric-label {
            font-size: 0.8rem;
            text-transform: uppercase;
            color: #6c757d;
            margin-bottom: 0.25rem;
        }
        
        .metric-value {
            font-size: 1.5rem;
            font-weight: bold;
            color: #495057;
        }
        
        nav {
            background: white;
            padding: 1rem 2rem;
            border-bottom: 1px solid #dee2e6;
            position: sticky;
            top: 0;
            z-index: 100;
        }
        
        nav ul {
            list-style: none;
            display: flex;
            gap: 2rem;
            overflow-x: auto;
        }
        
        nav a {
            color: #495057;
            text-decoration: none;
            padding: 0.5rem 0;
            border-bottom: 2px solid transparent;
            transition: all 0.3s;
            white-space: nowrap;
        }
        
        nav a:hover {
            color: #667eea;
            border-bottom-color: #667eea;
        }
        
        .content {
            padding: 2rem;
        }
        
        .section {
            margin-bottom: 3rem;
            scroll-margin-top: 80px;
        }
        
        .section h2 {
            font-size: 1.8rem;
            margin-bottom: 1rem;
            color: #495057;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #667eea;
        }
        
        .section-content {
            line-height: 1.8;
            color: #495057;
        }
        
        .section-content p {
            margin-bottom: 1rem;
        }
        
        .section-content ul, .section-content ol {
            margin: 1rem 0 1rem 2rem;
        }
        
        .section-content li {
            margin-bottom: 0.5rem;
        }
        
        .highlight {
            background: #fff3cd;
            padding: 1rem;
            border-left: 4px solid #ffc107;
            margin: 1rem 0;
        }
        
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 1rem 0;
        }
        
        .data-table th,
        .data-table td {
            padding: 0.75rem;
            text-align: left;
            border-bottom: 1px solid #dee2e6;
        }
        
        .data-table th {
            background: #f8f9fa;
            font-weight: 600;
        }
        
        .data-table tr:hover {
            background: #f8f9fa;
        }
        
        footer {
            background: #343a40;
            color: white;
            text-align: center;
            padding: 1.5rem;
            font-size: 0.9rem;
        }
        
        @media print {
            nav {
                display: none;
            }
            
            .section {
                page-break-inside: avoid;
            }
        }
        
        @media (max-width: 768px) {
            h1 {
                font-size: 1.8rem;
            }
            
            .metrics-bar {
                grid-template-columns: 1fr;
            }
            
            nav ul {
                flex-direction: column;
                gap: 0.5rem;
            }
        }
    </style>`;
  }

  /**
   * ヘッダーを生成
   */
  private generateHeader(title: string, date: Date): string {
    return `
    <header>
        <h1>${this.escapeHtml(title)}</h1>
        <div class="date">生成日: ${date.toLocaleDateString('ja-JP')} ${date.toLocaleTimeString('ja-JP')}</div>
    </header>`;
  }

  /**
   * メトリクスバーを生成
   */
  private generateMetricsBar(metrics: ReportMetrics): string {
    const formatCurrency = (amount: number): string => {
      if (amount >= 100000000) {
        return `¥${(amount / 100000000).toFixed(1)}億`;
      }
      if (amount >= 10000) {
        return `¥${(amount / 10000).toFixed(0)}万`;
      }
      return `¥${amount.toLocaleString()}`;
    };

    const difficultyLabel = {
      low: '低',
      medium: '中',
      high: '高',
    };

    return `
    <div class="metrics-bar">
        <div class="metric-item">
            <div class="metric-label">TAM (総市場規模)</div>
            <div class="metric-value">${formatCurrency(metrics.tam)}</div>
        </div>
        <div class="metric-item">
            <div class="metric-label">SAM (獲得可能市場)</div>
            <div class="metric-value">${formatCurrency(metrics.sam)}</div>
        </div>
        <div class="metric-item">
            <div class="metric-label">3年後収益予測</div>
            <div class="metric-value">${formatCurrency(metrics.revenueProjection3Y)}</div>
        </div>
        <div class="metric-item">
            <div class="metric-label">シナジースコア</div>
            <div class="metric-value">${metrics.synergyScore}点</div>
        </div>
        <div class="metric-item">
            <div class="metric-label">実装難易度</div>
            <div class="metric-value">${difficultyLabel[metrics.implementationDifficulty]}</div>
        </div>
        <div class="metric-item">
            <div class="metric-label">市場投入期間</div>
            <div class="metric-value">${metrics.timeToMarket}ヶ月</div>
        </div>
    </div>`;
  }

  /**
   * ナビゲーションを生成
   */
  private generateNavigation(sections: ReportSection[]): string {
    const navItems = sections
      .map(section => `
        <li>
            <a href="#${section.type}">${this.escapeHtml(section.title)}</a>
        </li>
      `)
      .join('');

    return `
    <nav>
        <ul>
            ${navItems}
        </ul>
    </nav>`;
  }

  /**
   * セクションを生成
   */
  private generateSection(section: ReportSection): string {
    return `
    <section id="${section.type}" class="section">
        <h2>${this.escapeHtml(section.title)}</h2>
        <div class="section-content">
            ${section.content}
        </div>
    </section>`;
  }

  /**
   * フッターを生成
   */
  private generateFooter(): string {
    return `
    <footer>
        <p>© 2024 Mitsubishi Estate Co., Ltd. - Autonomous Ideation Agent AI</p>
        <p>このレポートは自動生成されたものです。最終的な意思決定は人間の判断で行ってください。</p>
    </footer>`;
  }

  /**
   * JavaScriptを生成
   */
  private generateScripts(): string {
    return `<script>
        // スムーススクロール
        document.querySelectorAll('nav a').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // アクティブセクションのハイライト
        const sections = document.querySelectorAll('.section');
        const navLinks = document.querySelectorAll('nav a');

        window.addEventListener('scroll', () => {
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;
                if (pageYOffset >= sectionTop - 100) {
                    current = section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                link.style.borderBottomColor = 'transparent';
                if (link.getAttribute('href') === '#' + current) {
                    link.style.borderBottomColor = '#667eea';
                }
            });
        });
    </script>`;
  }

  /**
   * HTMLエスケープ
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * テーブルを生成
   */
  generateTable(headers: string[], rows: string[][]): string {
    const headerRow = headers
      .map(h => `<th>${this.escapeHtml(h)}</th>`)
      .join('');
    
    const dataRows = rows
      .map(row => 
        `<tr>${row.map(cell => `<td>${this.escapeHtml(cell)}</td>`).join('')}</tr>`
      )
      .join('');

    return `
    <table class="data-table">
        <thead>
            <tr>${headerRow}</tr>
        </thead>
        <tbody>
            ${dataRows}
        </tbody>
    </table>`;
  }

  /**
   * ハイライトボックスを生成
   */
  generateHighlight(content: string): string {
    return `<div class="highlight">${content}</div>`;
  }
}

/**
 * HtmlTemplateServiceのシングルトンインスタンス
 */
let instance: HtmlTemplateService | null = null;

export function getHtmlTemplateService(): HtmlTemplateService {
  if (!instance) {
    instance = new HtmlTemplateService();
  }
  return instance;
}