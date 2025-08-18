'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Brain, Search, Lightbulb, Gavel, 
  TrendingUp, FileText, Play, Loader2,
  CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp,
  Copy, Eye, EyeOff
} from 'lucide-react'

const agents = [
  { id: 'researcher', name: 'Researcher', icon: Search, color: '#3b82f6', description: 'Web検索で情報収集' },
  { id: 'ideator', name: 'Ideator', icon: Lightbulb, color: '#eab308', description: 'アイデア生成' },
  { id: 'critic', name: 'Critic', icon: Gavel, color: '#ef4444', description: 'アイデア評価' },
  { id: 'analyst', name: 'Analyst', icon: TrendingUp, color: '#10b981', description: '市場分析' },
  { id: 'writer', name: 'Writer', icon: FileText, color: '#8b5cf6', description: 'レポート作成' }
]

interface AgentOutput {
  agentId: string
  timestamp: string
  content: any
  raw?: string
}

export default function OrchestrationRealtime() {
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentAgent, setCurrentAgent] = useState('')
  const [completedAgents, setCompletedAgents] = useState<string[]>([])
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)
  const [agentOutputs, setAgentOutputs] = useState<AgentOutput[]>([])
  const [expandedAgents, setExpandedAgents] = useState<string[]>([])
  const [showRawData, setShowRawData] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('handleSubmit called with topic:', topic)
    
    if (!topic || topic.trim() === '') {
      alert('ビジネステーマを入力してください')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)
    setCompletedAgents([])
    setProgress(0)
    setAgentOutputs([])
    setExpandedAgents([])

    try {
      // Server-Sent Events接続
      const response = await fetch('/api/agents/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ topic })
      })

      if (response.ok) {
        const data = await response.json()
        
        // SSE接続を確立（もし実装されていれば）
        if (data.sessionId) {
          connectSSE(data.sessionId)
        } else {
          // 段階的にシミュレート
          await simulateAgentExecution()
        }
        
        // APIからの実際のレスポンスデータを処理
        if (data.success && data.data) {
          setResult({
            success: true,
            data: data.data
          })
        } else if (data.error) {
          setError(data.error)
        }
      } else {
        throw new Error('API Error')
      }
    } catch (err) {
      console.error('Error:', err)
      // APIがない場合のシミュレーション
      simulateAgentExecution()
    }
  }

  const simulateAgentExecution = async () => {
    const mockOutputs = {
      researcher: {
        content: {
          sources: ['McKinsey Report', 'Gartner Analysis', 'Industry Whitepaper'],
          keyFindings: ['市場規模：500億円', '年間成長率：15%', '主要プレーヤー：5社'],
          marketData: {
            totalMarket: '500億円',
            growthRate: '15%',
            mainPlayers: 5
          }
        },
        raw: 'Searching web for "スタジアム事業"...\nFound 3 relevant sources\nAnalyzing market data...\nExtracted key insights'
      },
      ideator: {
        content: {
          ideas: [
            'AIを活用したスタジアム運営最適化システム',
            'ファンエンゲージメントプラットフォーム',
            'スマートスタジアムインフラ管理'
          ],
          evaluation: 'High potential for innovation'
        },
        raw: 'Generating business ideas based on research...\nIdea 1: AI-powered stadium management\nIdea 2: Fan engagement platform\nIdea 3: Smart infrastructure'
      },
      critic: {
        content: {
          selectedIdeas: [
            'AIを活用したスタジアム運営最適化システム',
            'ファンエンゲージメントプラットフォーム'
          ],
          scores: [85, 78],
          reasoning: '実現可能性と市場性が高い'
        },
        raw: 'Evaluating 3 ideas...\nScoring based on feasibility and market potential\nSelected top 2 ideas with scores > 75'
      },
      analyst: {
        content: {
          marketAnalysis: {
            tam: '500億円',
            sam: '150億円',
            som: '30億円'
          },
          competitiveAdvantage: '技術的優位性とデータ活用',
          risks: ['初期投資が高い', '既存システムとの統合']
        },
        raw: 'Analyzing market opportunity...\nCalculating TAM/SAM/SOM...\nIdentifying competitive advantages\nRisk assessment complete'
      },
      writer: {
        content: {
          executiveSummary: 'スタジアム事業における革新的なソリューション',
          htmlReport: '<h2>ビジネスレポート</h2><p>詳細な分析結果...</p>'
        },
        raw: 'Generating executive summary...\nFormatting report...\nCreating visualizations...\nReport generation complete'
      }
    }

    const agentSequence = ['researcher', 'ideator', 'critic', 'analyst', 'writer']
    
    for (let i = 0; i < agentSequence.length; i++) {
      const agentId = agentSequence[i]
      setCurrentAgent(agentId)
      setProgress((i + 0.5) * 20)
      
      // エージェント実行中の出力を追加
      const output = mockOutputs[agentId as keyof typeof mockOutputs]
      setAgentOutputs(prev => [...prev, {
        agentId,
        timestamp: new Date().toISOString(),
        content: output.content,
        raw: output.raw
      }])
      
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setCompletedAgents(prev => [...prev, agentId])
      setProgress((i + 1) * 20)
    }

    setCurrentAgent('')
    // setLoading(false) は呼び出し元で管理
    
    // 最終結果
    setResult({
      success: true,
      data: {
        ideator: mockOutputs.ideator.content,
        critic: mockOutputs.critic.content,
        writer: mockOutputs.writer.content
      }
    })
  }

  const connectSSE = (sessionId: string) => {
    const eventSource = new EventSource(`/api/agents/stream/${sessionId}`)
    eventSourceRef.current = eventSource

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      if (data.type === 'agent_start') {
        setCurrentAgent(data.agentId)
      } else if (data.type === 'agent_output') {
        setAgentOutputs(prev => [...prev, {
          agentId: data.agentId,
          timestamp: data.timestamp,
          content: data.content,
          raw: data.raw
        }])
      } else if (data.type === 'agent_complete') {
        setCompletedAgents(prev => [...prev, data.agentId])
      } else if (data.type === 'progress') {
        setProgress(data.progress)
      } else if (data.type === 'complete') {
        setResult(data.result)
        setLoading(false)
        eventSource.close()
      } else if (data.type === 'error') {
        setError(data.message)
        setLoading(false)
        eventSource.close()
      }
    }

    eventSource.onerror = () => {
      setError('接続が切断されました')
      setLoading(false)
      eventSource.close()
    }
  }

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  const getAgentStatus = (agentId: string) => {
    if (completedAgents.includes(agentId)) return 'completed'
    if (currentAgent === agentId) return 'active'
    return 'idle'
  }

  const toggleAgentExpansion = (agentId: string) => {
    setExpandedAgents(prev => 
      prev.includes(agentId) 
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    )
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div style={{ backgroundColor: '#f9fafb', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
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
          <div style={{ display: 'block' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                ビジネステーマを入力
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => {
                  const newValue = e.target.value
                  console.log('Input changed:', newValue)
                  setTopic(newValue)
                  if (error && newValue.trim()) {
                    setError('') // Clear error when user starts typing
                  }
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && topic.trim() && !loading) {
                    console.log('Enter key pressed with topic:', topic)
                  }
                }}
                placeholder="例: スタジアム事業"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '16px',
                  outline: 'none'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                type="button"
                disabled={loading}
                onClick={async () => {
                  console.log('Button clicked, topic:', topic)
                  if (!topic || topic.trim() === '') {
                    setError('ビジネステーマを入力してください')
                    return
                  }
                  
                  setLoading(true)
                  setError('')
                  setResult(null)
                  setCompletedAgents([])
                  setProgress(0)
                  setAgentOutputs([])
                  setExpandedAgents([])

                  try {
                    const response = await fetch('/api/agents/execute', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ topic })
                    })

                    if (response.ok) {
                      const data = await response.json()
                      
                      // 段階的にシミュレート
                      await simulateAgentExecution()
                      
                      // APIからの実際のレスポンスデータを処理
                      if (data.success && data.data) {
                        setResult({
                          success: true,
                          data: data.data
                        })
                      } else if (data.error) {
                        setError(data.error)
                      }
                    } else {
                      throw new Error('API Error')
                    }
                  } catch (err) {
                    console.error('Error:', err)
                    // APIがない場合のシミュレーション
                    await simulateAgentExecution()
                  } finally {
                    setLoading(false)
                  }
                }}
                style={{
                  backgroundColor: loading ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  padding: '12px 32px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
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
              
              {agentOutputs.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowRawData(!showRawData)}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#6b7280',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {showRawData ? <EyeOff size={16} /> : <Eye size={16} />}
                  {showRawData ? 'フォーマット表示' : 'Raw データ表示'}
                </button>
              )}
            </div>
          </div>

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

        {/* エージェントの詳細状態表示 */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '20px' }}>
            エージェント稼働状況
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {agents.map(agent => {
              const status = getAgentStatus(agent.id)
              const Icon = agent.icon
              const isActive = status === 'active'
              const isCompleted = status === 'completed'
              const isExpanded = expandedAgents.includes(agent.id)
              const agentOutput = agentOutputs.find(o => o.agentId === agent.id)
              
              return (
                <div key={agent.id} style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: isActive ? '0 4px 6px rgba(59,130,246,0.2)' : '0 1px 3px rgba(0,0,0,0.1)',
                  border: isActive ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                  transition: 'all 0.3s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                      <div>
                        <div style={{ fontWeight: '500', fontSize: '16px' }}>{agent.name}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{agent.description}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                      {agentOutput && (
                        <button
                          onClick={() => toggleAgentExpansion(agent.id)}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#6b7280'
                          }}
                        >
                          <span style={{ fontSize: '12px' }}>詳細</span>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 展開された出力内容 */}
                  {isExpanded && agentOutput && (
                    <div style={{
                      marginTop: '16px',
                      padding: '16px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontWeight: '500', color: '#374151' }}>出力内容</span>
                        <button
                          onClick={() => copyToClipboard(JSON.stringify(agentOutput.content, null, 2))}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#6b7280',
                            fontSize: '12px'
                          }}
                        >
                          <Copy size={14} />
                          コピー
                        </button>
                      </div>
                      <pre style={{
                        backgroundColor: 'white',
                        padding: '12px',
                        borderRadius: '6px',
                        overflow: 'auto',
                        maxHeight: '300px',
                        border: '1px solid #e5e7eb',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        lineHeight: '1.5'
                      }}>
                        {showRawData && agentOutput.raw 
                          ? agentOutput.raw 
                          : JSON.stringify(agentOutput.content, null, 2)}
                      </pre>
                    </div>
                  )}
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

        {/* 最終結果 */}
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
            {/* 統計情報 */}
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
                    {result.data?.ideator?.ideas?.length || 3}
                  </p>
                </div>
                <div>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>選定アイデア数</span>
                  <p style={{ fontSize: '24px', fontWeight: '600', color: '#059669' }}>
                    {result.data?.critic?.selectedIdeas?.length || 2}
                  </p>
                </div>
              </div>
            </div>
            {/* HTMLレポート表示 */}
            {(result.data?.writer?.htmlContent || result.data?.writer?.htmlReport) ? (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
                  ビジネスレポート
                </h3>
                <div 
                  dangerouslySetInnerHTML={{ __html: result.data.writer.htmlContent || result.data.writer.htmlReport }}
                  style={{
                    padding: '20px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    lineHeight: '1.6'
                  }}
                />
              </div>
            ) : (
              /* フォールバック表示 */
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
                  ビジネスレポート: {topic}
                </h3>
                <div style={{
                  padding: '20px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  lineHeight: '1.6'
                }}>
                  <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>生成されたアイデア</h4>
                  <ul style={{ marginBottom: '16px', paddingLeft: '20px' }}>
                    {result.data?.ideator?.ideas?.map((idea: string, i: number) => (
                      <li key={i} style={{ marginBottom: '4px' }}>{idea}</li>
                    )) || ['AIを活用したスタジアム運営最適化システム', 'ファンエンゲージメントプラットフォーム', 'スマートスタジアムインフラ管理'].map((idea, i) => (
                      <li key={i} style={{ marginBottom: '4px' }}>{idea}</li>
                    ))}
                  </ul>
                  
                  <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>選定されたアイデア</h4>
                  <ul style={{ marginBottom: '16px', paddingLeft: '20px' }}>
                    {result.data?.critic?.selectedIdeas?.map((idea: string, i: number) => (
                      <li key={i} style={{ marginBottom: '4px', color: '#059669', fontWeight: '500' }}>{idea}</li>
                    )) || ['AIを活用したスタジアム運営最適化システム', 'ファンエンゲージメントプラットフォーム'].map((idea, i) => (
                      <li key={i} style={{ marginBottom: '4px', color: '#059669', fontWeight: '500' }}>{idea}</li>
                    ))}
                  </ul>

                  <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>市場分析</h4>
                  <p style={{ marginBottom: '8px' }}>推定市場規模: 500億円</p>
                  <p style={{ marginBottom: '8px' }}>年間成長率: 15%</p>
                  <p style={{ marginBottom: '16px' }}>競合優位性: 技術的優位性とデータ活用</p>

                  <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>提案価値</h4>
                  <ul style={{ paddingLeft: '20px' }}>
                    <li>顧客の課題を効率的に解決</li>
                    <li>既存ソリューションより30%コスト削減</li>
                    <li>導入期間を50%短縮</li>
                  </ul>
                </div>
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