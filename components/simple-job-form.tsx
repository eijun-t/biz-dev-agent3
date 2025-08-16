'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles } from 'lucide-react';

export function SimpleJobForm() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/agents/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ topic }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'エラーが発生しました');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            ビジネスアイデア生成
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="topic">トピック</Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="例: AI教育、サステナブルファッション"
                disabled={loading}
              />
            </div>

            <Button type="submit" disabled={loading || !topic.trim()}>
              {loading ? '処理中...' : '生成開始'}
            </Button>
          </form>

          {error && (
            <Alert className="mt-4" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result?.success && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <h3 className="font-bold mb-2">生成完了</h3>
              <p>アイデア数: {result.data?.ideator?.ideas?.length || 0}</p>
              <p>選定数: {result.data?.critic?.selectedIdeas?.length || 0}</p>
              {(result.data?.writer?.htmlContent || result.data?.writer?.htmlReport) && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-3">ビジネスレポート</h4>
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: result.data.writer.htmlContent || result.data.writer.htmlReport 
                    }}
                    className="prose prose-sm max-w-none mt-2 p-4 bg-white rounded border"
                  />
                </div>
              )}
              {!result.data?.writer && (
                <p className="text-orange-600 mt-2">レポート生成中にエラーが発生した可能性があります</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}