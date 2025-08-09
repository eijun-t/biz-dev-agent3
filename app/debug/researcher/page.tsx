'use client'

import { useState } from 'react'
import { ResearcherInput, ResearcherOutput } from '@/lib/types/agents'

export default function ResearcherDebugPage() {
  const [theme, setTheme] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/agents/researcher-debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          theme,
          sessionId: crypto.randomUUID(),
          userId: 'debug-user'
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        console.error('API Error:', data)
        setError(data.error || `HTTP ${response.status}: ${response.statusText}`)
        return
      }
      
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Broad Researcher Agent Debug</h1>
      
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Research Theme
          </label>
          <input
            type="text"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="AIを活用した不動産価格査定の最新技術"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Researching...' : 'Start Research'}
        </button>
      </form>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-8">
          {/* Input Data */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Input Data</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
              {JSON.stringify({ theme, sessionId: result.sessionId }, null, 2)}
            </pre>
          </section>

          {/* Execution Trace */}
          {result.messages && (
            <section>
              <h2 className="text-xl font-semibold mb-4">Execution Trace</h2>
              <div className="space-y-2">
                {result.messages.map((msg: any, i: number) => (
                  <div key={i} className="bg-gray-50 p-3 rounded">
                    <div className="font-medium">
                      [{msg.data?.phase || 'unknown'}] {msg.message}
                    </div>
                    {msg.data && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-gray-600">
                          View Data
                        </summary>
                        <pre className="text-xs mt-2 overflow-x-auto">
                          {JSON.stringify(msg.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Output Data */}
          {result.success && result.data && (
            <>
              {/* Summary */}
              <section>
                <h2 className="text-xl font-semibold mb-4">Research Summary</h2>
                <div className="bg-white p-4 rounded border">
                  <div className="prose max-w-none" 
                    dangerouslySetInnerHTML={{ __html: result.data.research.summary.replace(/\n/g, '<br>') }}
                  />
                </div>
              </section>

              {/* Key Findings */}
              {result.data.research.keyFindings?.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold mb-4">Key Findings</h2>
                  <ul className="list-disc list-inside space-y-2">
                    {result.data.research.keyFindings.map((finding: string, i: number) => (
                      <li key={i}>{finding}</li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Sources */}
              <section>
                <h2 className="text-xl font-semibold mb-4">Sources</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">Japanese Sources ({result.data.research.sources.japanese.length})</h3>
                    <ul className="text-sm space-y-1">
                      {result.data.research.sources.japanese.slice(0, 5).map((url: string, i: number) => (
                        <li key={i}>
                          <a href={url} target="_blank" rel="noopener noreferrer" 
                            className="text-blue-600 hover:underline truncate block"
                          >
                            {url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Global Sources ({result.data.research.sources.global.length})</h3>
                    <ul className="text-sm space-y-1">
                      {result.data.research.sources.global.slice(0, 5).map((url: string, i: number) => (
                        <li key={i}>
                          <a href={url} target="_blank" rel="noopener noreferrer" 
                            className="text-blue-600 hover:underline truncate block"
                          >
                            {url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              {/* Metrics */}
              <section>
                <h2 className="text-xl font-semibold mb-4">Metrics</h2>
                <div className="bg-gray-100 p-4 rounded">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Execution Time</div>
                      <div className="font-semibold">{(result.data.metrics.executionTime / 1000).toFixed(2)}s</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Tokens Used</div>
                      <div className="font-semibold">{result.data.metrics.tokensUsed.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">API Calls</div>
                      <div className="font-semibold">{result.data.metrics.apiCallsCount}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Cache Hit Rate</div>
                      <div className="font-semibold">{result.data.metrics.cacheHitRate.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Raw JSON */}
              <section>
                <h2 className="text-xl font-semibold mb-4">Raw Output Data</h2>
                <details>
                  <summary className="cursor-pointer bg-gray-200 px-4 py-2 rounded">
                    View Full JSON
                  </summary>
                  <pre className="bg-gray-100 p-4 rounded mt-2 overflow-x-auto text-xs">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              </section>
            </>
          )}
        </div>
      )}
    </div>
  )
}