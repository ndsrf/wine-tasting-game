'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Wine } from 'lucide-react'

export default function TestPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const createTestRoom = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/test/create-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Failed to create test room')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Wine className="h-12 w-12 text-wine-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Test Room Creator</h1>
          <p className="text-gray-600 mt-2">Create a test game room with code 00000</p>
        </div>

        <Card>
          <div className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="text-center">
              <Button
                onClick={createTestRoom}
                loading={loading}
                className="w-full"
              >
                Create Test Room (Code: 00000)
              </Button>
            </div>

            {result && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="font-semibold text-green-800 mb-4">Test Room Created Successfully!</h3>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-green-700">Game Details:</h4>
                    <p className="text-sm text-green-600">Code: {result.game.code}</p>
                    <p className="text-sm text-green-600">Difficulty: {result.game.difficulty}</p>
                    <p className="text-sm text-green-600">Wine Count: {result.game.wineCount}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-green-700">Test Wines:</h4>
                    <ul className="text-sm text-green-600 space-y-1">
                      {result.game.wines.map((wine: any) => (
                        <li key={wine.id}>
                          {wine.number}. {wine.name} ({wine.year})
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-green-700">Quick Access Links:</h4>
                    <div className="space-y-2">
                      <div>
                        <a
                          href={result.testUrls.director}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 underline block"
                        >
                          🎮 Director Control Panel
                        </a>
                      </div>
                      <div>
                        <a
                          href={result.testUrls.player}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 underline block"
                        >
                          🍷 Player Interface
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                    <p className="text-sm text-blue-700">
                      <strong>Note:</strong> The director panel requires authentication.
                      Use the test credentials if needed, or create a regular game through
                      the login flow.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        <div className="text-center mt-6">
          <a
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}