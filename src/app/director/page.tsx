'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { Wine, Plus, Trash2, AlertTriangle } from 'lucide-react'
import { Difficulty } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { authenticatedFetch } from '@/lib/auth-client'
import '@/lib/i18n'
import { QRCodeSVG } from 'qrcode.react'

interface WineEntry {
  name: string
  year: number
}

export default function DirectorPage() {
  const router = useRouter()
  const { t, ready: i18nReady, i18n } = useTranslation()
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
      setError(t('director.fillAllWineNames'))
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
          language: i18n.language || 'en',
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
          // Handle translatable errors (like low confidence wines)
          if (data.translatable && data.error === 'LOW_CONFIDENCE_WINES' && data.lowConfidenceWines) {
            const winesList = data.lowConfidenceWines
              .map((w: any) => t('errors.confidenceScore', { name: w.name, year: w.year, confidence: w.confidence }))
              .join(', ')
            const errorMessage = `${t('errors.lowConfidenceWines')} ${t('errors.lowConfidenceWinesList', { wines: winesList })}`
            setError(errorMessage)
          } else {
            setError(data.error || t('errors.failedToCreateGame'))
          }
        }
      }
    } catch (err) {
      setError(t('errors.tryAgain'))
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
  if (!mounted || authLoading || !i18nReady) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Wine className="h-12 w-12 text-wine-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">{i18nReady ? t('common.loading') : 'Loading...'}</h2>
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
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('common.loading')}</h2>
        </div>
      </div>
    )
  }

  if (gameCode) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-end mb-4">
            <LanguageSwitcher />
          </div>
          <div className="text-center mb-8">
            <Wine className="h-12 w-12 text-wine-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900">{t('director.gameCreated')}</h1>
            <p className="text-gray-600 mt-2">{t('director.shareCode')}</p>
          </div>

          <Card className="text-center">
            <div className="bg-wine-50 rounded-lg p-6 mb-6">
              <p className="text-sm text-gray-600 mb-2">{t('director.gameCode')}</p>
              <p className="text-4xl font-bold tracking-widest text-wine-600">{gameCode}</p>
            </div>

            <div className="flex flex-col items-center mb-6">
              <p className="text-sm text-gray-600 mb-3">{t('director.scanToJoin')}</p>
              <div className="bg-white p-4 rounded-lg border-2 border-wine-200">
                <QRCodeSVG
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/game/${gameCode}`}
                  size={200}
                  level="H"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {typeof window !== 'undefined' ? `${window.location.origin}/game/${gameCode}` : ''}
              </p>
            </div>

            {similarityWarning && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-6 flex items-start">
                <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{t('director.similarityWarning')}</p>
              </div>
            )}

            <div className="space-y-4">
              <Button onClick={handleStartGame} className="w-full">
                {t('common.start')}
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setGameCode('')
                  setSimilarityWarning('')
                }}
                className="w-full"
              >
                {t('director.createAnotherGame')}
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
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>
        <div className="text-center mb-8">
          <Wine className="h-12 w-12 text-wine-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">{t('director.createNewGame')}</h1>
          <p className="text-gray-600 mt-2">{t('director.welcomeBack', { username: user.username })}</p>
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
                {t('director.difficultyLevel')}
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
                    <div className="font-medium text-sm">{t(`homepage.${level.toLowerCase()}`)}</div>
                    <div className="text-xs text-gray-500">
                      {level === 'NOVICE' && t('homepage.characteristicsPerCategory', { count: 3 })}
                      {level === 'INTERMEDIATE' && t('homepage.characteristicsPerCategory', { count: 5 })}
                      {level === 'SOMMELIER' && t('homepage.characteristicsPerCategory', { count: 10 })}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('director.numberOfWines')}
              </label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setWineCount(Math.max(1, wineCount - 1))}
                  disabled={wineCount <= 1}
                  className="px-4"
                >
                  -
                </Button>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={wineCount}
                  onChange={(e) => setWineCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                  className="text-center"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setWineCount(Math.min(10, wineCount + 1))}
                  disabled={wineCount >= 10}
                  className="px-4"
                >
                  +
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('director.wineDetails')}
              </label>
              <div className="space-y-3">
                {wines.map((wine, index) => (
                  <div key={index} className="grid grid-cols-3 gap-2 items-end">
                    <div className="col-span-2">
                      <Input
                        placeholder={t('director.wineName', { number: index + 1 })}
                        value={wine.name}
                        onChange={(e) => updateWine(index, 'name', e.target.value)}
                      />
                    </div>
                    <Input
                      type="number"
                      placeholder={t('director.year')}
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
              {t('common.create')}
            </Button>
          </div>
        </Card>

        <div className="text-center mt-6">
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {t('navigation.signOut')}
          </button>
        </div>
      </div>
    </div>
  )
}