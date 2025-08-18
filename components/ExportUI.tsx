'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, FileText, FileSpreadsheet, FileJson,
  Loader2, CheckCircle, AlertCircle, Info,
  Settings, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  includeMetrics: boolean;
  includeTags: boolean;
  includeCharts: boolean;
  includeLogs: boolean;
  dateFormat: 'iso' | 'jp' | 'us';
}

interface ExportUIProps {
  reportIds: string[];
  onExport: (options: ExportOptions) => Promise<void>;
  className?: string;
}

export const ExportUI: React.FC<ExportUIProps> = ({
  reportIds,
  onExport,
  className
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState<'idle' | 'preparing' | 'exporting' | 'success' | 'error'>('idle');
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    includeMetrics: true,
    includeTags: true,
    includeCharts: true,
    includeLogs: false,
    dateFormat: 'jp'
  });
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // エクスポート実行
  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus('preparing');
    setExportProgress(0);

    try {
      // 準備フェーズ
      await new Promise(resolve => setTimeout(resolve, 500));
      setExportProgress(20);
      setExportStatus('exporting');

      // エクスポート処理のシミュレーション
      for (let i = 30; i <= 90; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setExportProgress(i);
      }

      // 実際のエクスポート処理
      await onExport(exportOptions);
      
      setExportProgress(100);
      setExportStatus('success');
      
      toast({
        title: 'エクスポート完了',
        description: `${reportIds.length}件のレポートを${exportOptions.format.toUpperCase()}形式でエクスポートしました`,
      });

      // 3秒後にリセット
      setTimeout(() => {
        setExportStatus('idle');
        setExportProgress(0);
        setIsExporting(false);
      }, 3000);
    } catch (error) {
      setExportStatus('error');
      toast({
        title: 'エクスポートエラー',
        description: 'エクスポート中にエラーが発生しました',
        variant: 'destructive',
      });
      setIsExporting(false);
    }
  };

  // フォーマットアイコン取得
  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf':
        return FileText;
      case 'excel':
        return FileSpreadsheet;
      case 'csv':
        return FileSpreadsheet;
      case 'json':
        return FileJson;
      default:
        return FileText;
    }
  };

  // フォーマット説明
  const formatDescriptions = {
    pdf: 'レイアウトを保持した印刷用フォーマット',
    excel: 'データ分析に適したスプレッドシート形式',
    csv: 'シンプルなカンマ区切りテキスト形式',
    json: 'プログラムで処理しやすい構造化データ'
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className={cn('gap-2', className)}>
          <Download className="h-4 w-4" />
          エクスポート
          {reportIds.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {reportIds.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>レポートのエクスポート</DialogTitle>
          <DialogDescription>
            {reportIds.length}件のレポートをエクスポートします
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* フォーマット選択 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">エクスポート形式</Label>
            <RadioGroup
              value={exportOptions.format}
              onValueChange={(value) => 
                setExportOptions({ ...exportOptions, format: value as any })
              }
            >
              <div className="grid grid-cols-2 gap-3">
                {(['pdf', 'excel', 'csv', 'json'] as const).map((format) => {
                  const Icon = getFormatIcon(format);
                  return (
                    <motion.div
                      key={format}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Label
                        htmlFor={format}
                        className={cn(
                          'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                          exportOptions.format === format
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-muted/50'
                        )}
                      >
                        <RadioGroupItem value={format} id={format} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className="h-4 w-4" />
                            <span className="font-medium uppercase">{format}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatDescriptions[format]}
                          </p>
                        </div>
                      </Label>
                    </motion.div>
                  );
                })}
              </div>
            </RadioGroup>
          </div>

          {/* 詳細オプション */}
          <Collapsible
            open={showAdvancedOptions}
            onOpenChange={setShowAdvancedOptions}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="gap-2 w-full justify-between">
                <span className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  詳細設定
                </span>
                <ChevronDown className={cn(
                  'h-4 w-4 transition-transform',
                  showAdvancedOptions && 'rotate-180'
                )} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3">
              {/* 含める内容 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">含める内容</Label>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={exportOptions.includeMetrics}
                      onCheckedChange={(checked) =>
                        setExportOptions({ ...exportOptions, includeMetrics: checked as boolean })
                      }
                    />
                    メトリクス（市場規模、成長率など）
                  </Label>
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={exportOptions.includeTags}
                      onCheckedChange={(checked) =>
                        setExportOptions({ ...exportOptions, includeTags: checked as boolean })
                      }
                    />
                    タグ情報
                  </Label>
                  {exportOptions.format === 'pdf' && (
                    <Label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={exportOptions.includeCharts}
                        onCheckedChange={(checked) =>
                          setExportOptions({ ...exportOptions, includeCharts: checked as boolean })
                        }
                      />
                      グラフ・チャート
                    </Label>
                  )}
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={exportOptions.includeLogs}
                      onCheckedChange={(checked) =>
                        setExportOptions({ ...exportOptions, includeLogs: checked as boolean })
                      }
                    />
                    エージェントログ
                  </Label>
                </div>
              </div>

              {/* 日付形式 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">日付形式</Label>
                <RadioGroup
                  value={exportOptions.dateFormat}
                  onValueChange={(value) =>
                    setExportOptions({ ...exportOptions, dateFormat: value as any })
                  }
                >
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2 cursor-pointer">
                      <RadioGroupItem value="jp" />
                      日本形式（2024年1月17日）
                    </Label>
                    <Label className="flex items-center gap-2 cursor-pointer">
                      <RadioGroupItem value="iso" />
                      ISO形式（2024-01-17）
                    </Label>
                    <Label className="flex items-center gap-2 cursor-pointer">
                      <RadioGroupItem value="us" />
                      US形式（01/17/2024）
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* エクスポート進捗 */}
          <AnimatePresence>
            {isExporting && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    {exportStatus === 'preparing' && (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        準備中...
                      </>
                    )}
                    {exportStatus === 'exporting' && (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        エクスポート中...
                      </>
                    )}
                    {exportStatus === 'success' && (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        完了しました！
                      </>
                    )}
                    {exportStatus === 'error' && (
                      <>
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        エラーが発生しました
                      </>
                    )}
                  </span>
                  <span className="font-medium">{exportProgress}%</span>
                </div>
                <Progress value={exportProgress} className="h-2" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* 情報メッセージ */}
          {!isExporting && (
            <div className="flex gap-2 p-3 bg-muted rounded-lg">
              <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground">
                エクスポートされたファイルは、ブラウザの設定に従ってダウンロードフォルダに保存されます。
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setExportOptions({
              format: 'pdf',
              includeMetrics: true,
              includeTags: true,
              includeCharts: true,
              includeLogs: false,
              dateFormat: 'jp'
            })}
            disabled={isExporting}
          >
            リセット
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || reportIds.length === 0}
            className="gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                エクスポート中...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                エクスポート開始
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportUI;