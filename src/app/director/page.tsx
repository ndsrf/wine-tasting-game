'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Wine, Plus, Trash2, AlertTriangle } from 'lucide-react'
import { Difficulty } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { authenticatedFetch } from '@/lib/auth-client'

interface WineEntry {
  name: string
  year: number
}

export default function DirectorPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth()
  const [difficulty, setDifficulty] = useState<Difficulty>('NOVICE')
  const [wineCount, setWineCount] = useState(3)
  const [wines, setWines] = useState<WineEntry[]>([
    { name: '', year: new Date().getFullYear() }
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [gameCode, setGameCode] = useState('')
  const [similarityWarning, setSimilarityWarning] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (mounted && !authLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/director')
    }
  }, [mounted, authLoading, isAuthenticated, router])

  useEffect(() => {
    setWines(prevWines => {
      const newWines = Array.from({ length: wineCount }, (_, i) =>
        prevWines[i] || { name: '', year: new Date().getFullYear() }
      )
      return newWines
    })
  }, [wineCount])

  const updateWine = (index: number, field: keyof WineEntry, value: string | number) => {
    const updatedWines = [...wines]
    updatedWines[index] = { ...updatedWines[index], [field]: value }
    setWines(updatedWines)
  }

  const handleCreateGame = async () => {
    if (!mounted || !user) return

    const incompleteWines = wines.some(wine => !wine.name.trim())
    if (incompleteWines) {
      setError('Please fill in all wine names')
      return
    }

    setLoading(true)
    setError('')
    setSimilarityWarning('')

    try {
      const response = await authenticatedFetch('/api/games/create', {
        method: 'POST',
        body: JSON.stringify({
          difficulty,
          wineCount,
          wines,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setGameCode(data.game.code)
        if (data.similarityWarning) {
          setSimilarityWarning(data.similarityWarning)
        }
      } else {
        if (response.status === 401) {
          // Unauthorized - redirect to login
          router.push('/auth/login?redirect=/director')
        } else {
          setError(data.error || 'Failed to create game')
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleStartGame = () => {
    if (gameCode) {
      router.push(`/director/game/${gameCode}`)
    }
  }

  const handleSignOut = async () => {
    await logout()
  }

  // Show loading state until mounted and auth resolved
  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Wine className="h-12 w-12 text-wine-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Loading...</h2>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated (redirect will happen via useEffect)
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Wine className="h-12 w-12 text-wine-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Authenticating...</h2>
        </div>
      </div>
    )
  }

  if (gameCode) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Wine className="h-12 w-12 text-wine-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900">Game Created!</h1>
            <p className="text-gray-600 mt-2">Share this code with your players</p>
          </div>

          <Card className="text-center">
            <div className="bg-wine-50 rounded-lg p-6 mb-6">
              <p className="text-sm text-gray-600 mb-2">Game Code:</p>
              <p className="text-4xl font-bold tracking-widest text-wine-600">{gameCode}</p>
            </div>

            {similarityWarning && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-6 flex items-start">
                <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{similarityWarning}</p>
              </div>
            )}

            <div className="space-y-4">
              <Button onClick={handleStartGame} className="w-full">
                Start Game
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setGameCode('')
                  setSimilarityWarning('')
                }}
                className="w-full"
              >
                Create Another Game
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Wine className="h-12 w-12 text-wine-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Create New Game</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user.username}!</p>
        </div>

        <Card>
          <div className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['NOVICE', 'INTERMEDIATE', 'SOMMELIER'] as Difficulty[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDifficulty(level)}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      difficulty === level
                        ? 'border-wine-600 bg-wine-50 text-wine-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-sm">{level}</div>
                    <div className="text-xs text-gray-500">
                      {level === 'NOVICE' && '3 per category'}
                      {level === 'INTERMEDIATE' && '5 per category'}
                      {level === 'SOMMELIER' && '10 per category'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Wines
              </label>
              <Input
                type="number"
                min="1"
                max="10"
                value={wineCount}
                onChange={(e) => setWineCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wine Details
              </label>
              <div className="space-y-3">
                {wines.map((wine, index) => (
                  <div key={index} className="grid grid-cols-3 gap-2 items-end">
                    <div className="col-span-2">
                      <Input
                        placeholder={`Wine ${index + 1} name`}
                        value={wine.name}
                        onChange={(e) => updateWine(index, 'name', e.target.value)}
                      />
                    </div>
                    <Input
                      type="number"
                      placeholder="Year"
                      min="1900"
                      max={new Date().getFullYear()}
                      value={wine.year}
                      onChange={(e) => updateWine(index, 'year', parseInt(e.target.value) || new Date().getFullYear())}
                    />
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={handleCreateGame}
              loading={loading}
              className="w-full"
              disabled={wines.some(wine => !wine.name.trim())}
            >
              Create Game
            </Button>
          </div>
        </Card>

        <div className="text-center mt-6">
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}