'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { authenticatedFetch } from '@/lib/auth-client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Wine, Trophy, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import RateWineModal from '@/components/RateWineModal'

interface Answer {
  wineId: string
  characteristicType: string
  answer: string
  isCorrect: boolean
}

interface PlayerResult {
  nickname: string
  score: number
  answers: Answer[]
}

interface Wine {
  id: string
  number: number
  name: string
  year: number
  characteristics: {
    VISUAL: string
    SMELL: string
    TASTE: string
  }
}

interface ResultsData {
  players: PlayerResult[]
  wines: Wine[]
  correctAnswers: Record<string, any>
}

export default function ResultsPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const { t, ready: i18nReady, i18n } = useTranslation()
  const [results, setResults] = useState<ResultsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [explanations, setExplanations] = useState<Record<string, { visual: string; smell: string; taste: string }> | null>(null)
  const [winesSaved, setWinesSaved] = useState(false)
  const [showRateModal, setShowRateModal] = useState(false)
  const [selectedWine, setSelectedWine] = useState<Wine | null>(null)
  const [ratedWines, setRatedWines] = useState<Set<string>>(new Set())
  const saveAttemptedRef = useRef(false)

  // Auto-save wines to history when results are loaded
  useEffect(() => {
    const saveWinesToHistory = async () => {
      if (!isAuthenticated || !results || saveAttemptedRef.current) return
      
      saveAttemptedRef.current = true
      
      try {
        const response = await authenticatedFetch(`/api/games/${code}/save-to-history`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('Wines saved to history:', data)
          setWinesSaved(true)
        }
      } catch (err) {
        console.error('Failed to save wines to history:', err)
        // Silently fail - user can still manually save later
      }
    }

    saveWinesToHistory()
  }, [isAuthenticated, results, code])

  // Handler for rating wine
  const handleRateWine = (wine: Wine) => {
    setSelectedWine(wine)
    setShowRateModal(true)
  }

  const handleSubmitRating = async (data: {
    rating: number
    location?: string
    occasion?: string
    comments?: string
  }) => {
    if (!selectedWine) return

    try {
      const response = await authenticatedFetch('/api/tastings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wineId: selectedWine.id,
          gameId: undefined, // Director results page doesn't have direct access to gameId
          ...data,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save rating')
      }

      // Mark wine as rated
      setRatedWines(prev => new Set(Array.from(prev).concat([selectedWine.id])))
      alert(t('rateWine.ratingSaved') || 'Wine rating saved successfully!')
    } catch (error) {
      console.error('Error saving rating:', error)
      throw error
    }
  }

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=/director/results/${code}`)
      return
    }

    const fetchResults = async () => {
      try {
        const currentLanguage = i18n.language || 'en'
        const response = await authenticatedFetch(`/api/games/${code}/results?language=${currentLanguage}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || t('errors.failedToCreateGame'))
        }

        setResults(data.results)
        setExplanations(data.results.explanations || null)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [authLoading, isAuthenticated, code, router, t, i18n.language])

  if (isLoading || authLoading || !i18nReady) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="text-center">
          <Wine className="h-12 w-12 text-wine-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('common.loading')}</h2>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">{t('common.error')}</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.push('/director')}>
            {t('director.backToDashboard')}
          </Button>
        </Card>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('errors.gameNotFound')}</h2>
          <p className="text-gray-600 mb-4">Could not find results for this game.</p>
          <Button onClick={() => router.push('/director')}>
            {t('director.backToDashboard')}
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher locked={true} />
        </div>

        <div className="text-center mb-8">
          <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">{t('results.gameResults')}</h1>
          <p className="text-gray-600">{t('game.gameCode', { code })}</p>
        </div>

        {/* Scores Summary */}
        <Card className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <Users className="h-6 w-6 mr-3" />
            {t('results.finalRanking')}
          </h2>
          <div className="space-y-2">
            {results.players
              .sort((a: any, b: any) => b.score - a.score)
              .map((player, index) => (
              <div
                key={player.nickname}
                className={`flex justify-between items-center p-4 rounded-lg ${
                  index === 0 ? 'bg-yellow-100' :
                  index === 1 ? 'bg-gray-200' :
                  index === 2 ? 'bg-yellow-50' : 'bg-gray-50'
                }`}>
                <div className="flex items-center flex-1">
                  <span className="text-lg font-bold w-8">{index + 1}.</span>
                  <div className="flex-1">
                    <span className="font-medium text-lg">{player.nickname}</span>
                    {(player as any).totalHintsUsed > 0 && (
                      <span className="ml-2 text-sm text-blue-600">
                        (💡 {(player as any).totalHintsUsed} {t('results.hintsUsed')})
                      </span>
                    )}
                  </div>
                </div>
                <span className="font-bold text-lg">{t('results.score', { score: player.score })}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Wines Tasted */}
        <Card className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <Wine className="h-6 w-6 mr-3" />
            Wines Tasted
          </h2>
          <ul className="space-y-2">
            {results.wines.map(wine => (
              <li key={wine.id} className="flex justify-between items-center">
                <span>{wine.name} ({wine.year})</span>
                <a
                  href={`https://www.wine-searcher.com/find/${encodeURIComponent(wine.name)}+${wine.year}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-wine-600 hover:text-wine-700 font-medium"
                >
                  Search on Wine-Searcher
                </a>
              </li>
            ))}
          </ul>
        </Card>

        {/* Detailed Results Table */}
        <Card>
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <Wine className="h-6 w-6 mr-3" />
            {t('results.playerAnswers')}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left p-3 font-semibold bg-green-100">Wine</th>
                  <th className="text-left p-3 font-semibold bg-green-100">{t('results.correctAnswers')}</th>
                  {/* Director column */}
                  {results.players.find((p: any) => p.id && p.id.startsWith('director-')) && (() => {
                    const director = results.players.find((p: any) => p.id && p.id.startsWith('director-'))
                    return (
                      <th className="text-left p-3 font-semibold bg-gray-100">
                        <div>Director</div>
                        {(director as any)?.totalHintsUsed > 0 && (
                          <div className="text-xs font-normal text-blue-600 mt-1">
                            💡 {(director as any).totalHintsUsed} {t('results.hintsUsed')}
                          </div>
                        )}
                      </th>
                    )
                  })()}
                  {/* Regular player columns */}
                  {results.players.filter((p: any) => !p.id || !p.id.startsWith('director-')).map(player => (
                    <th key={player.nickname} className="text-left p-3 font-semibold bg-gray-50">
                      <div>{player.nickname}</div>
                      {(player as any).totalHintsUsed > 0 && (
                        <div className="text-xs font-normal text-blue-600 mt-1">
                          💡 {(player as any).totalHintsUsed} {t('results.hintsUsed')}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.wines.map((wine, wineIndex) => {
                  // Get characteristics
                  const visualChars = wine.characteristics?.VISUAL || ''
                  const smellChars = wine.characteristics?.SMELL || ''
                  const tasteChars = wine.characteristics?.TASTE || ''

                  // Format characteristics
                  const visualStr = Array.isArray(visualChars) ? visualChars.join(', ') : visualChars
                  const smellStr = Array.isArray(smellChars) ? smellChars.join(', ') : smellChars
                  const tasteStr = Array.isArray(tasteChars) ? tasteChars.join(', ') : tasteChars

                  // Separate director and regular players
                  const directorPlayer = results.players.find((p: any) => p.id && p.id.startsWith('director-'))
                  const regularPlayers = results.players.filter((p: any) => !p.id || !p.id.startsWith('director-'))

                  // Debug logging
                  if (wineIndex === 0) {
                    console.log('All players:', results.players.map((p: any) => ({ id: (p as any).id, nickname: p.nickname, answerCount: p.answers?.length })))
                    console.log('Director player:', directorPlayer ? { id: (directorPlayer as any).id, nickname: directorPlayer.nickname, answerCount: directorPlayer.answers?.length } : 'NOT FOUND')
                  }

                  return (
                    <tr key={wine.id} className={`${wineIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-300`}>
                      <td className="p-3 font-medium border-r border-gray-200">
                        {wine.name} ({wine.year})
                      </td>
                      <td className="p-3 bg-green-50 font-medium">
                        <div><strong>{t('director.visual')}:</strong> {visualStr}</div>
                        <div><strong>{t('director.smell')}:</strong> {smellStr}</div>
                        <div><strong>{t('director.taste')}:</strong> {tasteStr}</div>
                      </td>
                      {/* Director answers */}
                      {directorPlayer && (() => {
                        const visualAnswer = directorPlayer.answers.find((a: any) => a.wineId === wine.id && a.characteristicType === 'VISUAL')
                        const smellAnswer = directorPlayer.answers.find((a: any) => a.wineId === wine.id && a.characteristicType === 'SMELL')
                        const tasteAnswer = directorPlayer.answers.find((a: any) => a.wineId === wine.id && a.characteristicType === 'TASTE')

                        const hasCorrect = visualAnswer?.isCorrect || smellAnswer?.isCorrect || tasteAnswer?.isCorrect

                        return (
                          <td
                            key={`director-${wine.id}`}
                            className={`p-3 ${hasCorrect ? 'bg-green-100 font-semibold' : ''}`}
                          >
                            <div><strong>{t('director.visual')}:</strong> {visualAnswer?.answer || '-'}</div>
                            <div><strong>{t('director.smell')}:</strong> {smellAnswer?.answer || '-'}</div>
                            <div><strong>{t('director.taste')}:</strong> {tasteAnswer?.answer || '-'}</div>
                          </td>
                        )
                      })()}
                      {/* Regular player answers */}
                      {regularPlayers.map(player => {
                        const visualAnswer = player.answers.find((a: any) => a.wineId === wine.id && a.characteristicType === 'VISUAL')
                        const smellAnswer = player.answers.find((a: any) => a.wineId === wine.id && a.characteristicType === 'SMELL')
                        const tasteAnswer = player.answers.find((a: any) => a.wineId === wine.id && a.characteristicType === 'TASTE')

                        const hasCorrect = visualAnswer?.isCorrect || smellAnswer?.isCorrect || tasteAnswer?.isCorrect

                        return (
                          <td
                            key={player.nickname}
                            className={`p-3 ${hasCorrect ? 'bg-green-100 font-semibold' : ''}`}
                          >
                            <div><strong>{t('director.visual')}:</strong> {visualAnswer?.answer || '-'}</div>
                            <div><strong>{t('director.smell')}:</strong> {smellAnswer?.answer || '-'}</div>
                            <div><strong>{t('director.taste')}:</strong> {tasteAnswer?.answer || '-'}</div>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Wine Explanations */}
        {explanations && Object.keys(explanations).length > 0 && (
          <Card className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <Wine className="h-6 w-6 mr-3" />
              {t('results.wineExplanations')}
            </h2>
            <div className="space-y-6">
              {results?.wines.map((wine, index) => {
                const wineKey = `Wine ${index + 1}`
                const wineExplanations = explanations[wineKey]

                if (!wineExplanations) return null

                return (
                  <div key={wine.id} className="border-l-4 border-wine-600 pl-4">
                    <h3 className="text-lg font-semibold text-wine-700 mb-3">
                      {wine.name} ({wine.year})
                    </h3>
                    <div className="space-y-3">
                      <div className="bg-blue-50 p-3 rounded">
                        <h4 className="font-semibold text-blue-900 mb-1">
                          {t('director.visual')}
                        </h4>
                        <p className="text-sm text-blue-800">{wineExplanations.visual}</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded">
                        <h4 className="font-semibold text-green-900 mb-1">
                          {t('director.smell')}
                        </h4>
                        <p className="text-sm text-green-800">{wineExplanations.smell}</p>
                      </div>
                      <div className="bg-purple-50 p-3 rounded">
                        <h4 className="font-semibold text-purple-900 mb-1">
                          {t('director.taste')}
                        </h4>
                        <p className="text-sm text-purple-800">{wineExplanations.taste}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Rate Wines Section */}
        {results?.wines && results.wines.length > 0 && (
          <Card className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <span className="mr-3">⭐</span>
              {t('rateWine.rateTheWines')}
            </h2>
            {winesSaved && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-green-800 flex items-center">
                  <span className="mr-2">✓</span>
                  {t('rateWine.winesSavedToHistory')}
                </p>
              </div>
            )}
            <p className="text-gray-600 mb-4">
              {t('rateWine.description')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {results.wines.map((wine) => (
                <button
                  key={wine.id}
                  onClick={() => handleRateWine(wine)}
                  className={`flex items-center justify-between p-4 rounded-lg transition-colors border ${
                    ratedWines.has(wine.id)
                      ? 'bg-green-50 hover:bg-green-100 border-green-200'
                      : 'bg-purple-50 hover:bg-purple-100 border-purple-200'
                  }`}
                >
                  <div className="text-left">
                    <p className={`font-semibold ${ratedWines.has(wine.id) ? 'text-green-900' : 'text-purple-900'}`}>
                      {wine.name} ({wine.year})
                    </p>
                    <p className={`text-sm ${ratedWines.has(wine.id) ? 'text-green-700' : 'text-purple-700'}`}>
                      {ratedWines.has(wine.id) ? t('rateWine.rated') : t('rateWine.clickToRate')}
                    </p>
                  </div>
                  <svg className={`w-6 h-6 ${ratedWines.has(wine.id) ? 'text-green-400' : 'text-yellow-400'}`} fill="currentColor" viewBox="0 0 20 20">
                    {ratedWines.has(wine.id) ? (
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    ) : (
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    )}
                  </svg>
                </button>
              ))}
            </div>
          </Card>
        )}

        <div className="text-center mt-8">
          <Button onClick={() => router.push('/director')}>
            {t('director.backToDashboard')}
          </Button>
        </div>

        {/* Rate Wine Modal */}
        {showRateModal && selectedWine && (
          <RateWineModal
            wineName={selectedWine.name}
            wineYear={selectedWine.year}
            wineId={selectedWine.id}
            onClose={() => {
              setShowRateModal(false)
              setSelectedWine(null)
            }}
            onSubmit={handleSubmitRating}
          />
        )}
      </div>
    </div>
  )
}
