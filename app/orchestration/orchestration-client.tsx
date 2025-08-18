'use client'

import React, { useState } from 'react'
import { 
  Brain, Zap, Search, Lightbulb, Gavel, 
  TrendingUp, FileText, Play, Loader2,
  CheckCircle, Clock, AlertCircle
} from 'lucide-react'

const agentStyles = {
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #e5e7eb',
    marginBottom: '20px',
    transition: 'all 0.3s'
  },
  activeCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 6px rgba(59,130,246,0.2)',
    border: '2px solid #3b82f6',
    marginBottom: '20px',
    transition: 'all 0.3s'
  }
}

const agents = [
  { id: 'researcher', name: 'Researcher', icon: Search, color: '#3b82f6', description: 'Web検索で情報収集' },
  { id: 'ideator', name: 'Ideator', icon: Lightbulb, color: '#eab308', description: 'アイデア生成' },
  { id: 'critic', name: 'Critic', icon: Gavel, color: '#ef4444', description: 'アイデア評価' },
  { id: 'analyst', name: 'Analyst', icon: TrendingUp, color: '#10b981', description: '市場分析' },
  { id: 'writer', name: 'Writer', icon: FileText, color: '#8b5cf6', description: 'レポート作成' }
]

export default function OrchestrationClient() {
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentAgent, setCurrentAgent] = useState('')
  const [completedAgents, setCompletedAgents] = useState<string[]>([])
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim()) return

    setLoading(true)
    setError('')
    setResult(null)
    setCompletedAgents([])
    setProgress(0)

    try {
      // 実際のAPI呼び出し
      const response = await fetch('/api/agents/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ topic })
      })

      // エージェントの順次実行をシミュレート（API実装までの暫定）
      const agentSequence = ['researcher', 'ideator', 'critic', 'analyst', 'writer']
      
      for (let i = 0; i < agentSequence.length; i++) {
        setCurrentAgent(agentSequence[i])
        setProgress((i + 1) * 20)
        await new Promise(resolve => setTimeout(resolve, 2000))
        setCompletedAgents(prev => [...prev, agentSequence[i]])
      }

      if (response.ok) {
        const data = await response.json()
        setResult(data)
      } else {
        // APIがまだない場合のモック結果
        setResult({
          success: true,
          data: {
            ideator: { ideas: ['アイデア1', 'アイデア2', 'アイデア3'] },
            critic: { selectedIdeas: ['アイデア1', 'アイデア3'] },
            writer: { 
              htmlContent: `
                <h2>ビジネスレポート: ${topic}</h2>
                <h3>概要</h3>
                <p>このビジネスアイデアは、${topic}分野における革新的なソリューションを提供します。</p>
                <h3>市場機会</h3>
                <p>推定市場規模: 500億円</p>
                <h3>提案価値</h3>
                <ul>
                  <li>顧客の課題を効率的に解決</li>
                  <li>既存ソリューションより30%コスト削減</li>
                  <li>導入期間を50%短縮</li>
                </ul>
              `
            }
          }
        })
      }
    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setCurrentAgent('')
      setLoading(false)
    }
  }

  const getAgentStatus = (agentId: string) => {
    if (completedAgents.includes(agentId)) return 'completed'
    if (currentAgent === agentId) return 'active'
    return 'idle'
  }

  return (
    <div style={{ backgroundColor: '#f9fafb', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* ヘッダー */}
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <h1 style={{ 
            fontSize: '36px', 
            fontWeight: 'bold',
            background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '12px'
          }}>
            AIオーケストレーション
          </h1>
          <p style={{ color: '#6b7280', fontSize: '18px' }}>
            5つのAIエージェントが協調してビジネスアイデアを生成
          </p>
        </div>

        {/* 入力フォーム */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '40px'
        }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                ビジネステーマを入力
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="例: AI教育、サステナブルファッション、スマートシティ"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '16px'
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !topic.trim()}
              style={{
                backgroundColor: loading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                padding: '12px 32px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '16px',
                fontWeight: '500',
                cursor: loading || !topic.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                  処理中...
                </>
              ) : (
                <>
                  <Play size={20} />
                  生成開始
                </>
              )}
            </button>
          </form>

          {/* プログレスバー */}
          {loading && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>進捗</span>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{progress}%</span>
              </div>
              <div style={{ 
                width: '100%', 
                height: '8px', 
                backgroundColor: '#e5e7eb', 
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${progress}%`,
                  height: '100%',
                  backgroundColor: '#3b82f6',
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>
          )}
        </div>

        {/* エージェントの状態表示 */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '20px' }}>
            エージェント稼働状況
          </h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px'
          }}>
            {agents.map(agent => {
              const status = getAgentStatus(agent.id)
              const Icon = agent.icon
              const isActive = status === 'active'
              const isCompleted = status === 'completed'
              
              return (
                <div key={agent.id} style={isActive ? agentStyles.activeCard : agentStyles.card}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      backgroundColor: isActive || isCompleted ? agent.color : '#e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s'
                    }}>
                      <Icon size={20} color="white" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500' }}>{agent.name}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{agent.description}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {isCompleted && (
                      <>
                        <CheckCircle size={16} color="#10b981" />
                        <span style={{ fontSize: '12px', color: '#10b981' }}>完了</span>
                      </>
                    )}
                    {isActive && (
                      <>
                        <Loader2 size={16} color="#3b82f6" style={{ animation: 'spin 1s linear infinite' }} />
                        <span style={{ fontSize: '12px', color: '#3b82f6' }}>実行中</span>
                      </>
                    )}
                    {!isActive && !isCompleted && (
                      <>
                        <Clock size={16} color="#9ca3af" />
                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>待機中</span>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <AlertCircle size={20} color="#ef4444" />
            <span style={{ color: '#991b1b' }}>{error}</span>
          </div>
        )}

        {/* 結果表示 */}
        {result?.success && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '20px' }}>
              生成結果
            </h2>
            <div style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', gap: '40px' }}>
                <div>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>生成アイデア数</span>
                  <p style={{ fontSize: '24px', fontWeight: '600', color: '#059669' }}>
                    {result.data?.ideator?.ideas?.length || 0}
                  </p>
                </div>
                <div>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>選定アイデア数</span>
                  <p style={{ fontSize: '24px', fontWeight: '600', color: '#059669' }}>
                    {result.data?.critic?.selectedIdeas?.length || 0}
                  </p>
                </div>
              </div>
            </div>
            {result.data?.writer?.htmlContent && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
                  ビジネスレポート
                </h3>
                <div 
                  dangerouslySetInnerHTML={{ __html: result.data.writer.htmlContent }}
                  style={{
                    padding: '20px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    lineHeight: '1.6'
                  }}
                />
              </div>
            )}
          </div>
        )}

        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  )
}