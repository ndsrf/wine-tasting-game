'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { authenticatedFetch } from '@/lib/auth-client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Wine, Trophy, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

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
  const { t, ready: i18nReady } = useTranslation()
  const [results, setResults] = useState<ResultsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=/director/results/${code}`)
      return
    }

    const fetchResults = async () => {
      try {
        const response = await authenticatedFetch(`/api/games/${code}/results`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || t('errors.failedToCreateGame'))
        }

        setResults(data.results)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [authLoading, isAuthenticated, code, router, t])

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
          <LanguageSwitcher />
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
            {results.players.map((player, index) => (
              <div
                key={player.nickname}
                className={`flex justify-between items-center p-4 rounded-lg ${
                  index === 0 ? 'bg-yellow-100' :
                  index === 1 ? 'bg-gray-200' :
                  index === 2 ? 'bg-yellow-50' : 'bg-gray-50'
                }`}>
                <div className="flex items-center">
                  <span className="text-lg font-bold w-8">{index + 1}.</span>
                  <span className="font-medium text-lg">{player.nickname}</span>
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
                  {results.players.find((p: any) => p.id && p.id.startsWith('director-')) && (
                    <th className="text-left p-3 font-semibold bg-gray-100">Director</th>
                  )}
                  {/* Regular player columns */}
                  {results.players.filter((p: any) => !p.id || !p.id.startsWith('director-')).map(player => (
                    <th key={player.nickname} className="text-left p-3 font-semibold bg-gray-50">
                      {player.nickname}
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



        <div className="text-center mt-8">
          <Button onClick={() => router.push('/director')}>
            {t('director.backToDashboard')}
          </Button>
        </div>
      </div>
    </div>
  )
}
