'use client'

import React, { useState, useEffect } from 'react'
import { FileText, Calendar, Clock, ExternalLink, Search, Filter } from 'lucide-react'
import Link from 'next/link'

interface Report {
  id: string
  title: string
  topic: string
  created_at: string
  status: 'completed' | 'processing' | 'error'
  idea_count?: number
  selected_count?: number
}

export default function ReportListDashboard() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/reports', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setReports(data.reports || [])
      } else {
        // APIがまだない場合のモックデータ
        setReports([
          {
            id: '1',
            title: 'AI教育プラットフォーム',
            topic: 'AI教育',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            status: 'completed',
            idea_count: 5,
            selected_count: 2
          },
          {
            id: '2',
            title: 'サステナブルファッション',
            topic: 'エコファッション',
            created_at: new Date(Date.now() - 172800000).toISOString(),
            status: 'completed',
            idea_count: 3,
            selected_count: 1
          },
          {
            id: '3',
            title: 'スマートシティソリューション',
            topic: 'スマートシティ',
            created_at: new Date(Date.now() - 259200000).toISOString(),
            status: 'processing',
            idea_count: 0,
            selected_count: 0
          }
        ])
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err)
      setError('レポートの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const filteredReports = reports.filter(report =>
    report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.topic.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981'
      case 'processing': return '#3b82f6'
      case 'error': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '完了'
      case 'processing': return '処理中'
      case 'error': return 'エラー'
      default: return '不明'
    }
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* ヘッダー */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
            レポート一覧
          </h1>
          <p style={{ color: '#6b7280' }}>
            過去に生成されたビジネスレポートを確認できます
          </p>
        </div>

        {/* 新規作成ボタンと検索 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <Link href="/orchestration" style={{ textDecoration: 'none' }}>
            <button style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FileText size={20} />
              新規レポート作成
            </button>
          </Link>

          <div style={{ position: 'relative', minWidth: '300px' }}>
            <Search 
              size={20} 
              style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: '#6b7280'
              }} 
            />
            <input
              type="text"
              placeholder="レポートを検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        {/* レポート一覧 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#6b7280' }}>読み込み中...</p>
          </div>
        ) : error ? (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '16px',
            color: '#991b1b'
          }}>
            {error}
          </div>
        ) : filteredReports.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '60px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <FileText size={48} style={{ margin: '0 auto 16px', color: '#d1d5db' }} />
            <p style={{ color: '#6b7280', marginBottom: '16px' }}>
              {searchTerm ? '検索結果が見つかりませんでした' : 'まだレポートがありません'}
            </p>
            {!searchTerm && (
              <Link href="/orchestration" style={{ textDecoration: 'none' }}>
                <button style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}>
                  最初のレポートを作成
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
            {filteredReports.map(report => (
              <div
                key={report.id}
                onClick={() => window.location.href = `/reports/${report.id}`}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s',
                  border: '1px solid #e5e7eb'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
                    {report.title}
                  </h3>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    backgroundColor: `${getStatusColor(report.status)}20`,
                    color: getStatusColor(report.status),
                    fontWeight: '500'
                  }}>
                    {getStatusText(report.status)}
                  </span>
                </div>

                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
                  トピック: {report.topic}
                </p>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                  {report.status === 'completed' && (
                    <>
                      <div>
                        <span style={{ color: '#6b7280', fontSize: '12px' }}>アイデア数</span>
                        <p style={{ fontSize: '16px', fontWeight: '600' }}>{report.idea_count || 0}</p>
                      </div>
                      <div>
                        <span style={{ color: '#6b7280', fontSize: '12px' }}>選定数</span>
                        <p style={{ fontSize: '16px', fontWeight: '600' }}>{report.selected_count || 0}</p>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  paddingTop: '12px',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b7280', fontSize: '12px' }}>
                    <Calendar size={14} />
                    {formatDate(report.created_at)}
                  </div>
                  {report.status === 'completed' && (
                    <ExternalLink size={16} style={{ color: '#3b82f6' }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}