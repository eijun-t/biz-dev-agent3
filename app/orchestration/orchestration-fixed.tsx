'use client'

import React, { useState } from 'react'
import { Play, Loader2 } from 'lucide-react'

export default function OrchestrationFixed() {
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const executeGeneration = async () => {
    const trimmedTopic = topic.trim()
    
    if (!trimmedTopic) {
      setError('テーマを入力してください')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/agents/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ topic: trimmedTopic })
      })

      if (response.ok) {
        const data = await response.json()
        setResult(data)
      } else {
        throw new Error('APIエラー')
      }
    } catch (err) {
      setError('エラーが発生しました')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ backgroundColor: '#f9fafb', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '20px', textAlign: 'center' }}>
          AIオーケストレーション
        </h1>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            ビジネステーマを入力
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value)
              if (error) setError('')
            }}
            placeholder="例: スタジアム事業"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              fontSize: '16px',
              marginBottom: '16px',
              boxSizing: 'border-box'
            }}
          />
          
          <button
            onClick={executeGeneration}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#9ca3af' : '#3b82f6',
              color: 'white',
              padding: '12px 32px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '16px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {loading ? (
              <>
                <Loader2 size={20} />
                処理中...
              </>
            ) : (
              <>
                <Play size={20} />
                生成開始
              </>
            )}
          </button>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px',
            color: '#991b1b'
          }}>
            {error}
          </div>
        )}

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
            <pre style={{
              backgroundColor: '#f9fafb',
              padding: '16px',
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '14px'
            }}>
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}