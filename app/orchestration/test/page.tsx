'use client'

import { useState } from 'react'

export default function TestPage() {
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleClick = () => {
    console.log('Button clicked!')
    setMessage(`クリックされました！入力値: ${topic}`)
    if (topic) {
      setLoading(true)
      setTimeout(() => {
        setLoading(false)
        setMessage('処理完了！')
      }, 2000)
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>テストページ</h1>
      <input
        type="text"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="何か入力してください"
        style={{
          padding: '10px',
          marginRight: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}
      />
      <button
        onClick={handleClick}
        disabled={loading}
        style={{
          padding: '10px 20px',
          backgroundColor: loading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? '処理中...' : 'クリック'}
      </button>
      <p>{message}</p>
    </div>
  )
}