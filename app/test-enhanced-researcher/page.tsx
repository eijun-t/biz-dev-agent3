'use client'

import { useState } from 'react'

export default function TestEnhancedResearcherPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const runTest = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Call API endpoint
      const response = await fetch('/api/test-enhanced-researcher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          theme: 'AIを活用したビジネス自動化',
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'API request failed')
      }

      setResult(data)
    } catch (err) {
      console.error('Test error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Enhanced Researcher Agent Test</h1>
        
        <button
          onClick={runTest}
          disabled={loading}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 mb-8"
        >
          {loading ? 'Running Test...' : 'Run Enhanced Research Test'}
        </button>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Execution Result</h2>
              <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>

            {result.success && result.data?.research && (
              <>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-4">Summary</h2>
                  <p className="text-gray-700">{result.data.research.summary}</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-4">Detailed Analysis</h2>
                  {result.data.research.detailedAnalysis && (
                    <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
                      {JSON.stringify(result.data.research.detailedAnalysis, null, 2)}
                    </pre>
                  )}
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-4">Enriched Data</h2>
                  {result.data.research.enrichedData && (
                    <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
                      {JSON.stringify(result.data.research.enrichedData, null, 2)}
                    </pre>
                  )}
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-4">Metrics</h2>
                  <pre className="bg-gray-100 p-4 rounded">
                    {JSON.stringify(result.data.metrics, null, 2)}
                  </pre>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}