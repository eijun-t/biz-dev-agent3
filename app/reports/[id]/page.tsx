'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Clock, FileText, Loader2 } from 'lucide-react'

interface Report {
  id: string
  title: string
  topic: string
  created_at: string
  completed_at?: string
  status: string
  result?: any
  final_report?: any
}

export default function ReportDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchReport()
  }, [params.id])

  const fetchReport = async () => {
    try {
      const response = await fetch(`/api/reports/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setReport(data.report)
      } else {
        setError('レポートが見つかりません')
      }
    } catch (err) {
      setError('レポートの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={48} style={{ animation: 'spin 1s linear infinite', color: '#3b82f6', margin: '0 auto' }} />
          <p style={{ marginTop: '16px', color: '#6b7280' }}>レポートを読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '40px 20px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <p style={{ color: '#991b1b', fontSize: '18px' }}>{error || 'レポートが見つかりません'}</p>
            <button
              onClick={() => router.push('/dashboard')}
              style={{
                marginTop: '16px',
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              ダッシュボードに戻る
            </button>
          </div>
        </div>
      </div>
    )
  }

  // HTMLコンテンツを取得
  const htmlContent = report.result?.htmlContent || 
                      report.result?.htmlReport || 
                      report.final_report?.writer?.htmlContent ||
                      report.final_report?.writer?.htmlReport

  // アイデア情報を取得
  const ideas = report.result?.ideas || report.final_report?.ideas || []
  const selectedIdeas = report.result?.selectedIdeas || report.final_report?.selectedIdeas || []

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* ヘッダー */}
        <div style={{ marginBottom: '32px' }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#374151',
              marginBottom: '24px'
            }}
          >
            <ArrowLeft size={16} />
            ダッシュボードに戻る
          </button>

          <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
            {report.title}
          </h1>
          
          <div style={{ display: 'flex', gap: '24px', color: '#6b7280', fontSize: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={16} />
              作成日: {formatDate(report.created_at)}
            </div>
            {report.completed_at && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} />
                完了日: {formatDate(report.completed_at)}
              </div>
            )}
          </div>
        </div>

        {/* メインコンテンツ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
          {/* レポート本文 */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            {htmlContent ? (
              <div 
                dangerouslySetInnerHTML={{ __html: htmlContent }}
                style={{
                  lineHeight: '1.8',
                  fontSize: '16px'
                }}
              />
            ) : (
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px' }}>
                  ビジネスレポート
                </h2>
                
                {ideas.length > 0 && (
                  <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                      生成されたアイデア
                    </h3>
                    <ul style={{ paddingLeft: '20px' }}>
                      {ideas.map((idea: string, i: number) => (
                        <li key={i} style={{ marginBottom: '8px' }}>{idea}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedIdeas.length > 0 && (
                  <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                      選定されたアイデア
                    </h3>
                    <ul style={{ paddingLeft: '20px' }}>
                      {selectedIdeas.map((idea: string, i: number) => (
                        <li key={i} style={{ 
                          marginBottom: '8px', 
                          color: '#059669',
                          fontWeight: '500'
                        }}>
                          {idea}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* JSON形式のフォールバック */}
                {!ideas.length && !selectedIdeas.length && report.result && (
                  <pre style={{
                    backgroundColor: '#f9fafb',
                    padding: '16px',
                    borderRadius: '8px',
                    overflow: 'auto',
                    fontSize: '14px'
                  }}>
                    {JSON.stringify(report.result, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* サイドバー */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 統計情報 */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                レポート統計
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>
                    生成アイデア数
                  </p>
                  <p style={{ fontSize: '24px', fontWeight: '600', color: '#3b82f6' }}>
                    {report.final_report?.idea_count || ideas.length || 0}
                  </p>
                </div>
                <div>
                  <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>
                    選定アイデア数
                  </p>
                  <p style={{ fontSize: '24px', fontWeight: '600', color: '#059669' }}>
                    {report.final_report?.selected_count || selectedIdeas.length || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* アクション */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                アクション
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => window.print()}
                  style={{
                    padding: '10px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  印刷
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `report-${report.id}.json`
                    a.click()
                  }}
                  style={{
                    padding: '10px',
                    backgroundColor: 'white',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  JSONをダウンロード
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media print {
          button { display: none; }
        }
      `}</style>
    </div>
  )
}