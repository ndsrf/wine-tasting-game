'use client'

import { useState, useEffect, useMemo, useRef, Fragment } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Wine, Users } from 'lucide-react'
import { useSocket } from '@/hooks/useSocket'
import { GameState, Player } from '@/types'
import { VISUAL_CHARACTERISTICS, SMELL_CHARACTERISTICS, TASTE_CHARACTERISTICS } from '@/lib/wine-options'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'
import { normalizeCharacteristicToEnglish } from '@/lib/i18n'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { saveGameSession, getGameSession, clearGameSession } from '@/lib/session-storage'

function GamePageComponent() {
  const params = useParams()
  const code = params.code as string
  const { t, ready: i18nReady } = useTranslation()
  const [nickname, setNickname] = useState('')
  const [player, setPlayer] = useState<Player | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [gameInfo, setGameInfo] = useState<any>(null) // Store basic game info for welcome screen
  const [error, setError] = useState('')
  const [joining, setJoining] = useState(false)
  const hasAttemptedReconnect = useRef(false)

  const { isConnected, isReconnecting, joinGame, submitAnswer, socket } = useSocket({
    onGameState: (state) => setGameState(state),
    onPlayerJoined: (newPlayer) => {
      setGameState((prevState) => {
        if (!prevState) return prevState
        return {
          ...prevState,
          players: [...prevState.players, newPlayer]
        }
      })
    },
    onJoinedAsPlayer: (data) => {
      console.log('Joined as player:', data)
      setPlayer(data.player)
      setJoining(false) // Stop the joining loading state
      setError('') // Clear any errors

      // Save session for reconnection
      saveGameSession({
        playerId: data.player.id,
        nickname: data.player.nickname,
        gameCode: code,
        isDirector: false
      })
    },
    onError: (err) => {
      setError(err.message)
      setJoining(false) // Stop the joining loading state on error
    },
    onGameStarted: (state) => setGameState(state),
    onPhaseChanged: (data) => {
      setGameState((prevState) => {
        if (!prevState) return prevState
        return {
          ...prevState,
          currentPhase: (typeof data === 'object' && data.phase ? data.phase : data) as any
        }
      })
    },
    onWineChanged: (state) => setGameState(state),
    onAnswerSubmitted: (data) => {
      console.log('Answer submitted:', data)
      if (data.error) {
        console.error('Answer submission error:', data.error)
      } else {
        console.log(`Score: ${data.correctCount}/${data.totalQuestions} (+${data.roundScore} points)`)
      }
    },
    onScoreUpdated: (data) => {
      console.log('Score updated:', data)
      // Player scores are updated via Socket.io game state, so this is handled automatically
    },
    onGameFinished: (state) => {
      console.log('Game finished:', state)
      setGameState(state)
    }
  })

  const handleJoinGame = async () => {
    if (!nickname.trim()) {
      setError(t('game.enterNicknameError'))
      return
    }

    setJoining(true)
    setError('')

    try {
      // Game validation already done in useEffect, just join via socket
      joinGame({ code, nickname: nickname.trim() })
    } catch (err) {
      setError(t('game.failedToJoin'))
      setJoining(false)
    }
    // Don't set joining to false here - let the socket response handle it
  }

  // Auto-reconnect effect - runs when socket reconnects
  useEffect(() => {
    if (!isConnected || !socket || hasAttemptedReconnect.current) return

    // Check if we have a saved session for this game
    const savedSession = getGameSession()
    if (savedSession && savedSession.gameCode === code && !savedSession.isDirector) {
      console.log('Found saved player session, attempting auto-reconnect:', savedSession)
      hasAttemptedReconnect.current = true

      // Restore player state immediately
      setNickname(savedSession.nickname)

      // Rejoin the game with saved session
      joinGame({
        code: savedSession.gameCode,
        nickname: savedSession.nickname,
        playerId: savedSession.playerId,
        isReconnect: true
      })
    }
  }, [isConnected, socket, code, joinGame])

  useEffect(() => {
    // Only fetch game info to validate the code exists and show basic info on welcome screen
    if (isConnected && !player && !gameInfo) {
      fetch(`/api/games/${code}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            setError(data.error)
          } else {
            setGameInfo(data.game) // Store basic game info for welcome screen
          }
        })
        .catch(() => {
          setError(t('errors.connectionError'))
        })
    }
  }, [isConnected, code, player, gameInfo, t])

  // Clear session when game finishes
  useEffect(() => {
    if (gameState?.isGameFinished) {
      clearGameSession()
    }
  }, [gameState?.isGameFinished])

  // Show connecting state after mounted but before socket connects
  if (!isConnected || !i18nReady) {
    const savedSession = getGameSession()
    const isReconnectAttempt = savedSession && savedSession.gameCode === code

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="text-center">
          <Wine className="h-12 w-12 text-wine-600 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {isReconnecting || isReconnectAttempt ? t('game.reconnecting') || 'Reconnecting...' : t('game.connecting')}
          </h2>
          <p className="text-gray-600 mb-4">
            {isReconnectAttempt
              ? `Restoring your session as ${savedSession.nickname}...`
              : t('game.connectingDescription')}
          </p>
          {(isReconnecting || isReconnectAttempt) && (
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="mt-2"
            >
              {t('game.refreshPage')}
            </Button>
          )}
        </Card>
      </div>
    )
  }

  if (!player) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="absolute top-4 right-4">
            <LanguageSwitcher />
          </div>

          <div className="text-center mb-8">
            <Wine className="h-12 w-12 text-wine-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900">{t('game.joinGame')}</h1>
            <p className="text-gray-600 mt-2">{t('game.gameCode', { code })}</p>
          </div>

          <Card>
            <div className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {gameInfo && (
                <div className="bg-wine-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-wine-700 mb-2">{t('game.gameInfo')}</h3>
                  <p className="text-sm text-wine-600">{t('game.difficulty', { difficulty: gameInfo.difficulty || 'Unknown' })}</p>
                  <p className="text-sm text-wine-600">{t('game.wines', { count: gameInfo.wineCount || 0 })}</p>
                  <p className="text-sm text-wine-600">{t('game.status', { status: gameInfo.status || 'Unknown' })}</p>
                  {gameInfo.players && gameInfo.players.length > 0 && (
                    <p className="text-sm text-wine-600">{t('game.playersJoined', { count: gameInfo.players.length })}</p>
                  )}
                </div>
              )}

              <Input
                label={t('game.yourNickname')}
                placeholder={t('game.enterNickname')}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                onKeyPress={(e) => e.key === 'Enter' && handleJoinGame()}
              />

              <Button
                onClick={handleJoinGame}
                loading={joining}
                className="w-full"
                disabled={!nickname.trim()}
              >
                {t('game.joinGame')}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return <PlayerGameInterface player={player} gameState={gameState} submitAnswer={submitAnswer} code={code} />
}

function PlayerGameInterface({ player, gameState, submitAnswer, code }: { player: Player; gameState: GameState | null; submitAnswer: (data: any) => void; code: string }) {
  const { t } = useTranslation()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [gameData, setGameData] = useState<any>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submissionState, setSubmissionState] = useState<'idle' | 'submitting' | 'submitted'>('idle')

  useEffect(() => {
    if (gameState && !gameData) {
      fetch(`/api/games/${code}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setGameData(data.game)
          }
        })
        .catch(console.error)
    }
  }, [gameState, gameData, code])

  // Reset submission state when phase or wine changes
  useEffect(() => {
    setSubmissionState('idle')
    setAnswers({}) // Clear answers when moving to new phase/wine
  }, [gameState?.currentPhase, gameState?.currentWine])

  // Show phase change notification
  const [phaseChangeNotification, setPhaseChangeNotification] = useState('')

  useEffect(() => {
    if (gameState?.currentPhase) {
      const phaseName = gameState.currentPhase.charAt(0) + gameState.currentPhase.slice(1).toLowerCase()
      setPhaseChangeNotification(t('game.phase', { phase: phaseName }))
      const timer = setTimeout(() => {
        setPhaseChangeNotification('')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [gameState?.currentPhase, t])

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="text-center">
          <Wine className="h-12 w-12 text-wine-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('game.loadingGame')}</h2>
        </Card>
      </div>
    )
  }

  if (!gameState.isGameStarted) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-2xl mx-auto">
          <div className="absolute top-4 right-4">
            <LanguageSwitcher />
          </div>

          <div className="text-center mb-8">
            <Wine className="h-12 w-12 text-wine-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900">{t('game.waitingForGame')}</h1>
            <p className="text-gray-600 mt-2">{t('game.welcome', { nickname: player.nickname })}</p>
          </div>

          <Card>
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center text-gray-600">
                <Users className="h-5 w-5 mr-2" />
                <span>{t('game.playersJoined', { count: gameState.players.length })}</span>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">{t('director.players', { count: gameState.players.length })}:</h3>
                <div className="flex flex-wrap gap-2">
                  {gameState.players.map((p) => (
                    <span
                      key={p.id}
                      className={`px-3 py-1 rounded-full text-sm ${
                        p.id === player.id
                          ? 'bg-wine-100 text-wine-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {p.nickname}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-gray-600">
                {t('game.waitingDescription')}
              </p>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  if (gameState.isGameFinished) {
    return <PlayerResults player={player} gameState={gameState} code={code} />
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>

        {phaseChangeNotification && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-wine-600 text-white px-4 py-2 rounded-lg shadow-lg transition-all duration-300">
            {phaseChangeNotification}
          </div>
        )}

        <div className="text-center mb-6">
          <Wine className="h-8 w-8 text-wine-600 mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-gray-900">
            {t('game.wineNumber', { number: gameState.currentWine })}
          </h1>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              gameState.currentPhase === 'VISUAL' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {t('director.visual')}
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              gameState.currentPhase === 'SMELL' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {t('director.smell')}
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              gameState.currentPhase === 'TASTE' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {t('director.taste')}
            </div>
          </div>
          <p className="text-gray-600">
            {t('director.currentPhase')}: {gameState.currentPhase.charAt(0) + gameState.currentPhase.slice(1).toLowerCase()}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {t('game.yourScore', { score: player.score })}
          </p>
        </div>

        <Card>
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">
                {t('game.guessCharacteristics', { phase: gameState.currentPhase.toLowerCase() })}
              </h2>
              <p className="text-gray-600 text-sm">
                {t('game.matchCharacteristics')}
              </p>
            </div>

            <WineCharacteristicsGame
              gameData={gameData}
              gameState={gameState}
              answers={answers}
              setAnswers={setAnswers}
              submissionState={submissionState}
              playerId={player.id}
              code={code}
              onSubmitAnswers={(playerAnswers) => {
                setSubmissionState('submitting')
                submitAnswer({
                  code,
                  playerId: player.id,
                  wineNumber: gameState.currentWine,
                  characteristicType: gameState.currentPhase,
                  answers: playerAnswers
                })
                // Set to submitted after a short delay to show feedback
                setTimeout(() => {
                  setSubmissionState('submitted')
                }, 500)
              }}
            />
          </div>
        </Card>
      </div>
    </div>
  )
}

function WineCharacteristicsGame({
  gameData,
  gameState,
  answers,
  setAnswers,
  submissionState,
  onSubmitAnswers,
  playerId,
  code
}: {
  gameData: any
  gameState: GameState
  answers: Record<string, string>
  setAnswers: (answers: Record<string, string>) => void
  submissionState: 'idle' | 'submitting' | 'submitted'
  onSubmitAnswers: (answers: Record<string, string>) => void
  playerId: string
  code: string
}) {
  const { t, i18n } = useTranslation()
  const [hint, setHint] = useState<string | null>(null)
  const [isLoadingHint, setIsLoadingHint] = useState(false)
  const [hintError, setHintError] = useState<string | null>(null)

  // Reset hint when phase or wine changes
  useEffect(() => {
    setHint(null)
    setHintError(null)
  }, [gameState.currentPhase, gameState.currentWine])

  // Function to get translated characteristic label
  const getCharacteristicLabel = (label: string): string => {
    const labelMap: Record<string, string> = {
      'Colour': t('game.colour'),
      'Clarity': t('game.clarity'),
      'Intensity': t('game.intensity'),
      'Appearance': t('game.appearance'),
      'Hue': t('game.hue'),
      'Primary Aroma': t('game.primaryAroma'),
      'Secondary Aroma': t('game.secondaryAroma'),
      'Tertiary Aroma': t('game.tertiaryAroma'),
      'Bouquet': t('game.bouquet'),
      'Nose': t('game.nose'),
      'Sweetness': t('game.sweetness'),
      'Acidity': t('game.acidity'),
      'Tannins': t('game.tannins'),
      'Body': t('game.body'),
      'Finish': t('game.finish'),
    }
    return labelMap[label] || label
  }

  // Function to translate characteristic value
  const translateCharacteristic = (value: string): string => {
    if (!value) return value
    // First normalize to English (in case value is in Spanish/French from old games)
    const normalizedValue = normalizeCharacteristicToEnglish(value)
    // Then translate to current language
    const translated = t(`game.wineChar_${normalizedValue}`, { defaultValue: normalizedValue })
    return translated
  }

  const { categoryOptions, wineData, totalAnswersNeeded, categoryName, characteristicLabels } = useMemo(() => {
    if (!gameData?.wines || gameData.wines.length === 0) {
      return {
        categoryOptions: {},
        wineData: [],
        totalAnswersNeeded: 0,
        categoryName: 'Characteristic',
        characteristicLabels: []
      }
    }
    const currentPhase = gameState.currentPhase.toLowerCase()
    const wineData: Array<{ wineNumber: number; characteristics: string[] }> = []

    let allCategoryOptions: Record<string, string[]> = {}
    let categoryName = ''
    let characteristicLabels: string[] = []

    switch (gameState.currentPhase) {
      case 'VISUAL':
        allCategoryOptions = VISUAL_CHARACTERISTICS
        categoryName = 'visual'
        characteristicLabels = Object.keys(VISUAL_CHARACTERISTICS) as (keyof typeof VISUAL_CHARACTERISTICS)[]
        break
      case 'SMELL':
        allCategoryOptions = SMELL_CHARACTERISTICS
        categoryName = 'aroma'
        characteristicLabels = Object.keys(SMELL_CHARACTERISTICS) as (keyof typeof SMELL_CHARACTERISTICS)[]
        break
      case 'TASTE':
        allCategoryOptions = TASTE_CHARACTERISTICS
        categoryName = 'tasteCategory'
        characteristicLabels = Object.keys(TASTE_CHARACTERISTICS) as (keyof typeof TASTE_CHARACTERISTICS)[]
        break
      default:
        allCategoryOptions = {}
        categoryName = 'characteristic'
        characteristicLabels = []
    }

    // Filter options based on difficulty
    const difficulty = gameData.difficulty || 'NOVICE'
    const wineCount = gameData.wineCount || 3

    // Determine how many options to show per category based on difficulty
    let optionsMultiplier: number
    switch (difficulty) {
      case 'NOVICE':
        optionsMultiplier = 1 // Same as wine count or +1
        break
      case 'INTERMEDIATE':
        optionsMultiplier = 1.5 // ~50% more options
        break
      case 'SOMMELIER':
        optionsMultiplier = 2.5 // Much more options for challenge
        break
      default:
        optionsMultiplier = 1
    }

    // Filter category options to show appropriate number based on difficulty
    // Use a stable seed based on game data to ensure options don't change on re-render
    const seed = `${gameData.id}-${gameState.currentWine}-${gameState.currentPhase}`
    const seededRandom = (str: string, index: number) => {
      let hash = 0
      const combined = str + index
      for (let i = 0; i < combined.length; i++) {
        hash = ((hash << 5) - hash) + combined.charCodeAt(i)
        hash = hash & hash
      }
      return Math.abs(hash) / 2147483647
    }

    // Get the correct characteristics for the current wine to ensure they're always included
    const currentWineIndex = gameState.currentWine - 1
    const correctCharacteristics: string[] = []

    if (gameData.wines[currentWineIndex]) {
      const wine = gameData.wines[currentWineIndex]
      // Try both lowercase and uppercase keys for the phase
      const wineChars = wine.characteristics?.[currentPhase] || wine.characteristics?.[gameState.currentPhase]
      if (wineChars) {
        correctCharacteristics.push(...wineChars)
        console.log('DEBUG - Correct characteristics for wine', gameState.currentWine, 'phase', gameState.currentPhase, ':', correctCharacteristics)
      } else {
        console.log('DEBUG - No characteristics found. wine.characteristics:', wine.characteristics, 'currentPhase:', currentPhase, 'gameState.currentPhase:', gameState.currentPhase)
      }
    }

    const categoryOptions: Record<string, string[]> = {}
    Object.keys(allCategoryOptions).forEach((key, keyIndex) => {
      const allOptions = allCategoryOptions[key]
      const targetCount = Math.max(
        wineCount,
        Math.min(allOptions.length, Math.ceil(wineCount * optionsMultiplier) + 1)
      )

      // Get the correct answer for this characteristic category (if it exists)
      const correctAnswer = correctCharacteristics[keyIndex]

      // Use seeded shuffle to ensure stable ordering
      const shuffled = [...allOptions].sort((a, b) => {
        const aHash = seededRandom(seed + key, allOptions.indexOf(a))
        const bHash = seededRandom(seed + key, allOptions.indexOf(b))
        return aHash - bHash
      })

      // Take the target count of options
      let selectedOptions = shuffled.slice(0, targetCount)

      // Ensure the correct answer is always included
      if (correctAnswer && !selectedOptions.includes(correctAnswer)) {
        console.log('DEBUG - Adding missing correct answer:', correctAnswer, 'to category:', key)
        // Replace the last option with the correct answer
        selectedOptions[selectedOptions.length - 1] = correctAnswer
      } else if (correctAnswer) {
        console.log('DEBUG - Correct answer', correctAnswer, 'already in options for category:', key)
      }

      categoryOptions[key] = selectedOptions
    })

    // Only show the current wine
    if (gameData.wines[currentWineIndex]) {
      const wine = gameData.wines[currentWineIndex]
      if (wine.characteristics && wine.characteristics[currentPhase]) {
        const wineCharacteristics = wine.characteristics[currentPhase]
        wineData.push({
          wineNumber: gameState.currentWine,
          characteristics: wineCharacteristics
        })
      }
    }

    const totalAnswersNeeded = wineData.reduce((total, wine) => total + wine.characteristics.length, 0)

    return { categoryOptions, wineData, totalAnswersNeeded, categoryName, characteristicLabels }
  }, [gameData?.wines, gameData?.difficulty, gameData?.wineCount, gameData?.id, gameState.currentPhase, gameState.currentWine])

  if (!gameData?.wines || gameData.wines.length === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600">
          {t('common.loading')}
        </p>
      </div>
    )
  }

  const handleCharacteristicSelect = (wineNumber: number, characteristicIndex: number, selectedCharacteristic: string) => {
    const answerKey = `wine-${wineNumber}-char-${characteristicIndex}`
    setAnswers({
      ...answers,
      [answerKey]: selectedCharacteristic
    })
  }

  const handleSubmit = () => {
    const characteristicAnswers: Record<string, string> = {}

    wineData.forEach((wine) => {
      wine.characteristics.forEach((_, index) => {
        const answerKey = `wine-${wine.wineNumber}-char-${index}`
        const selectedChar = answers[answerKey]
        if (selectedChar) {
          // Don't translate - server expects "Wine N" format
          characteristicAnswers[selectedChar] = `Wine ${wine.wineNumber}`
        }
      })
    })

    onSubmitAnswers(characteristicAnswers)
  }

  const answeredCount = Object.keys(answers).length
  const isAllAnswered = answeredCount === totalAnswersNeeded

  const handleGetHint = async () => {
    setIsLoadingHint(true)
    setHintError(null)

    try {
      const response = await fetch(`/api/games/${code}/hint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId,
          wineNumber: gameState.currentWine,
          phase: gameState.currentPhase,
          language: i18n.language || 'en'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get hint')
      }

      setHint(data.hint)
    } catch (error: any) {
      console.error('Error getting hint:', error)
      setHintError(error.message || 'Failed to get hint')
    } finally {
      setIsLoadingHint(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="bg-wine-50 p-4 rounded-lg">
          <h3 className="font-semibold text-wine-700 mb-2">
            {t('game.instructions')}
          </h3>
          <p className="text-sm text-wine-600">
            {t('game.selectCharacteristicsInstructions', { categoryName: t(`game.${categoryName}`) })}
          </p>
        </div>

        {/* Hint Section */}
        <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
          {!hint ? (
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">
                  {t('game.needHelp')}
                </h3>
                <p className="text-sm text-blue-700">
                  {t('game.hintDescription')}
                </p>
              </div>
              <Button
                onClick={handleGetHint}
                loading={isLoadingHint}
                disabled={isLoadingHint}
                variant="outline"
                className="ml-4 bg-blue-100 hover:bg-blue-200 text-blue-900 border-blue-300"
              >
                {t('game.getHint')}
              </Button>
            </div>
          ) : (
            <div>
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                <span className="mr-2">💡</span> {t('game.hint')}
              </h3>
              <p className="text-sm text-blue-800 italic">&ldquo;{hint}&rdquo;</p>
            </div>
          )}
          {hintError && (
            <p className="text-sm text-red-600 mt-2">{hintError}</p>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-gray-700">
            {t('game.matchCharacteristics')}
          </h3>

          {wineData.map((wine) => (
            <div
              key={wine.wineNumber}
              className="border rounded-lg p-4 bg-white space-y-3"
            >
              <h4 className="font-semibold text-lg text-wine-700">
                {t('game.wineNumber', { number: wine.wineNumber })}
              </h4>

              <div className="space-y-2">
                {wine.characteristics.map((_, characteristicIndex) => {
                  const label = characteristicLabels[characteristicIndex]
                  const translatedLabel = getCharacteristicLabel(label)
                  const options = categoryOptions[label] || []
                  return (
                    <div
                      key={characteristicIndex}
                      className="flex items-center gap-3"
                    >
                      <span className="text-sm text-gray-600 min-w-fit">
                        {translatedLabel || `${categoryName} ${characteristicIndex + 1}`}:
                      </span>
                      <select
                        value={answers[`wine-${wine.wineNumber}-char-${characteristicIndex}`] || ''}
                        onChange={(e) => handleCharacteristicSelect(wine.wineNumber, characteristicIndex, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-wine-500 focus:border-wine-500"
                      >
                        <option value="">{t('game.select', { categoryName: t(`game.${categoryName}`) })}</option>
                        {options.map((characteristic) => (
                          <option key={characteristic} value={characteristic}>
                            {translateCharacteristic(characteristic)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600 text-center">
            {t('game.progress', { answered: answeredCount, total: totalAnswersNeeded })}
          </p>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!isAllAnswered || submissionState === 'submitting'}
          loading={submissionState === 'submitting'}
          className={`w-full transition-colors ${
            submissionState === 'submitted'
              ? 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500'
              : ''
          }`}
        >
          {submissionState === 'submitted' ? (
            t('game.answersSubmitted')
          ) : submissionState === 'submitting' ? (
            t('game.submitting')
          ) : (
            t('game.submitAnswers', { answered: answeredCount, total: totalAnswersNeeded })
          )}
        </Button>
      </div>
    </div>
  )
}

function PlayerResults({ player, gameState, code }: { player: Player; gameState: GameState; code: string }) {
  const { t, i18n } = useTranslation()
  const [results, setResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [explanations, setExplanations] = useState<Record<string, { visual: string; smell: string; taste: string }> | null>(null)
  const retryCountRef = useRef(0)

  // Function to translate wine characteristic values
  const translateWineChar = (value: string | undefined): string => {
    if (!value || value === '-') return '-'

    // Handle comma-separated strings (shouldn't happen but defensive coding)
    if (value.includes(',')) {
      return value.split(',').map(v => {
        const trimmed = v.trim()
        const normalizedValue = normalizeCharacteristicToEnglish(trimmed)
        return t(`game.wineChar_${normalizedValue}`, { defaultValue: normalizedValue })
      }).join(', ')
    }

    // First normalize to English (in case value is in Spanish/French from old games)
    const normalizedValue = normalizeCharacteristicToEnglish(value)
    // Then translate to current language
    const translated = t(`game.wineChar_${normalizedValue}`, { defaultValue: normalizedValue })
    return translated
  }

  useEffect(() => {
    const maxRetries = 10
    retryCountRef.current = 0

    const fetchResults = async () => {
      try {
        console.log(`Fetching results for game ${code}...`)
        const currentLanguage = i18n.language || 'en'
        const response = await fetch(`/api/games/${code}/results?language=${currentLanguage}`)
        const data = await response.json()

        if (!response.ok) {
          // If game not finished yet and we haven't exceeded retries, retry after delay
          if (data.error === 'Game not finished yet' && retryCountRef.current < maxRetries) {
            retryCountRef.current++
            console.log(`Game not finished yet, retrying (${retryCountRef.current}/${maxRetries})...`)
            setTimeout(fetchResults, 1500) // Retry after 1.5 seconds
            return
          }
          throw new Error(data.error || t('errors.failedToCreateGame'))
        }

        console.log('Results fetched successfully:', data.results)
        console.log('Explanations received:', data.results.explanations)
        setResults(data.results)
        setExplanations(data.results.explanations || null)
        setIsLoading(false)
      } catch (err: any) {
        console.error('Failed to fetch results:', err)
        setError(err.message)
        setIsLoading(false)
      }
    }

    // Add initial delay to allow socket handler to complete
    setTimeout(fetchResults, 500)
  }, [code, t])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="text-center">
          <Wine className="h-12 w-12 text-wine-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('common.loading')}</h2>
        </Card>
      </div>
    )
  }

  if (error || !results) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-2xl mx-auto">
          <div className="absolute top-4 right-4">
            <LanguageSwitcher locked={true} />
          </div>

          <div className="text-center mb-8">
            <Wine className="h-12 w-12 text-wine-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900">{t('game.gameFinished')}</h1>
            <p className="text-gray-600 mt-2">{t('game.finalResults')}</p>
          </div>

          <Card>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-center">{t('game.finalScores')}</h3>
              <div className="space-y-2">
                {gameState.players
                  .sort((a, b) => b.score - a.score)
                  .map((p, index) => (
                    <div
                      key={p.id}
                      className={`flex justify-between items-center p-3 rounded-lg ${
                        p.id === player.id
                          ? 'bg-wine-100 border-2 border-wine-300'
                          : index === 0
                          ? 'bg-yellow-100 border-2 border-yellow-400'
                          : 'bg-gray-50'
                      }`}
                    >
                      <span className="font-medium">
                        {index === 0 && '🏆 '}
                        #{index + 1} {p.nickname}
                        {p.id.startsWith('director-') && ` (${t('results.director')})`}
                      </span>
                      <span className="font-bold text-lg">{p.score} {t('results.points')}</span>
                    </div>
                  ))}
              </div>
              <div className="pt-4 border-t border-gray-200">
                <Link href="/">
                  <Button variant="outline" className="w-full">
                    Return to Home Page
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
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
          <Wine className="h-12 w-12 text-wine-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">{t('results.gameCompleted')}</h1>
          <p className="text-gray-600 mt-2">{t('game.finalResults')}</p>
        </div>

        {/* Scores Summary */}
        <Card className="mb-8">
          <h3 className="text-xl font-semibold text-center mb-4">{t('results.finalScores')}</h3>
          <div className="space-y-2">
            {results.players
              .sort((a: any, b: any) => b.score - a.score)
              .map((p: any, index: number) => (
                <div
                  key={p.nickname}
                  className={`flex justify-between items-center p-3 rounded-lg ${
                    p.nickname === player.nickname
                      ? 'bg-wine-100 border-2 border-wine-300'
                      : index === 0
                      ? 'bg-yellow-100 border-2 border-yellow-400'
                      : 'bg-gray-50'
                  }`}
                >
                  <div className="flex-1">
                    <span className="font-medium">
                      {index === 0 && '🏆 '}
                      #{index + 1} {p.nickname}
                    </span>
                    {p.totalHintsUsed > 0 && (
                      <span className="ml-2 text-sm text-blue-600">
                        (💡 {p.totalHintsUsed} {t('results.hintsUsed')})
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-lg">{p.score} {t('results.points')}</span>
                </div>
              ))}
          </div>
        </Card>

                {/* Detailed Results Table */}

                <Card>

                  <h2 className="text-2xl font-semibold mb-4 flex items-center">

                    <Wine className="h-6 w-6 mr-3" />

                    {t('results.detailedResults')}

                  </h2>

                  <div className="overflow-x-auto">

                    <table className="w-full border-collapse">

                      <thead>

                        <tr className="border-b-2 border-gray-300">

                          <th className="text-left p-3 font-semibold bg-green-100">{t('results.factsCorrectAnswers')}</th>

                          {/* Director column - only show if director exists */}

                          {results.players.find((p: any) => p.id && p.id.startsWith('director-')) && (

                            <th className="text-left p-3 font-semibold bg-gray-100">{t('results.director')}</th>

                          )}

                          {results.players.filter((p: any) => !p.id || !p.id.startsWith('director-')).map((p: any) => (

                            <th key={p.nickname} className={`text-left p-3 font-semibold ${

                              p.nickname === player.nickname ? 'bg-wine-100' : 'bg-gray-50'

                            }`}>

                              {p.nickname}

                            </th>

                          ))}

                        </tr>

                      </thead>

                      <tbody>

                        {results.wines.map((wine: any, wineIndex: number) => {

                          const directorPlayer = results.players.find((p: any) => p.id && p.id.startsWith('director-'))

                          const regularPlayers = results.players.filter((p: any) => !p.id || !p.id.startsWith('director-'))

        

                          // Get characteristics with lowercase keys

                          const visualChars = wine.characteristics?.visual || wine.characteristics?.VISUAL || []

                          const smellChars = wine.characteristics?.smell || wine.characteristics?.SMELL || []

                          const tasteChars = wine.characteristics?.taste || wine.characteristics?.TASTE || []

                          // Translate characteristics - handle both arrays and comma-separated strings
                          const translateCharsList = (chars: any): string => {
                            if (!chars) return ''
                            if (Array.isArray(chars)) {
                              return chars.map((c: string) => translateWineChar(c)).join(', ')
                            }
                            if (typeof chars === 'string' && chars.includes(',')) {
                              return chars.split(',').map((c: string) => translateWineChar(c.trim())).join(', ')
                            }
                            return translateWineChar(chars)
                          }

                          const visualStr = translateCharsList(visualChars)
                          const smellStr = translateCharsList(smellChars)
                          const tasteStr = translateCharsList(tasteChars)

                          return (

                            <Fragment key={wine.id}>

                              {/* Visual characteristic */}

                              <tr key={`${wine.id}-visual`} className={wineIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>

                                <td className="p-3 bg-green-50 font-medium">

                                  {wine.name} ({wine.year}) - {t('director.visual')}: {visualStr}

                                </td>

                                {/* Director column - only show if director exists */}

                                {directorPlayer && (

                                  <td className={`p-3 ${

                                    directorPlayer.answers.find((a: any) => a.wineId === wine.id && a.characteristicType === 'VISUAL')?.isCorrect

                                      ? 'bg-green-100 font-semibold'

                                      : ''

                                  }`}>

                                    {translateWineChar(directorPlayer.answers.find((a: any) => a.wineId === wine.id && a.characteristicType === 'VISUAL')?.answer)}

                                  </td>

                                )}

                                {regularPlayers.map((p: any) => {

                                  const wineAnswer = p.answers.find(

                                    (a: any) => a.wineId === wine.id && a.characteristicType === 'VISUAL'

                                  ) || { answer: '-', isCorrect: false }



                                  return (

                                    <td

                                      key={p.nickname}

                                      className={`p-3 ${wineAnswer.isCorrect ? 'bg-green-100 font-semibold' : ''} ${

                                        p.nickname === player.nickname ? 'bg-wine-50' : ''

                                      }`}

                                    >

                                      {translateWineChar(wineAnswer.answer)}

                                    </td>

                                  )

                                })}

                              </tr>

                              {/* Smell characteristic */}

                              <tr key={`${wine.id}-smell`} className={wineIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>

                                <td className="p-3 bg-green-50 font-medium">

                                  {wine.name} ({wine.year}) - {t('director.smell')}: {smellStr}

                                </td>

                                {/* Director column - only show if director exists */}

                                {directorPlayer && (

                                  <td className={`p-3 ${

                                    directorPlayer.answers.find((a: any) => a.wineId === wine.id && a.characteristicType === 'SMELL')?.isCorrect

                                      ? 'bg-green-100 font-semibold'

                                      : ''

                                  }`}>

                                    {translateWineChar(directorPlayer.answers.find((a: any) => a.wineId === wine.id && a.characteristicType === 'SMELL')?.answer)}

                                  </td>

                                )}

                                {regularPlayers.map((p: any) => {

                                  const wineAnswer = p.answers.find(

                                    (a: any) => a.wineId === wine.id && a.characteristicType === 'SMELL'

                                  ) || { answer: '-', isCorrect: false }



                                  return (

                                    <td

                                      key={p.nickname}

                                      className={`p-3 ${wineAnswer.isCorrect ? 'bg-green-100 font-semibold' : ''} ${

                                        p.nickname === player.nickname ? 'bg-wine-50' : ''

                                      }`}

                                    >

                                      {translateWineChar(wineAnswer.answer)}

                                    </td>

                                  )

                                })}

                              </tr>

                              {/* Taste characteristic */}

                              <tr key={`${wine.id}-taste`} className={`${wineIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-300`}>

                                <td className="p-3 bg-green-50 font-medium">

                                  {wine.name} ({wine.year}) - {t('director.taste')}: {tasteStr}

                                </td>

                                {/* Director column - only show if director exists */}

                                {directorPlayer && (

                                  <td className={`p-3 ${

                                    directorPlayer.answers.find((a: any) => a.wineId === wine.id && a.characteristicType === 'TASTE')?.isCorrect

                                      ? 'bg-green-100 font-semibold'

                                      : ''

                                  }`}>

                                    {translateWineChar(directorPlayer.answers.find((a: any) => a.wineId === wine.id && a.characteristicType === 'TASTE')?.answer)}

                                  </td>

                                )}

                                {regularPlayers.map((p: any) => {

                                  const wineAnswer = p.answers.find(

                                    (a: any) => a.wineId === wine.id && a.characteristicType === 'TASTE'

                                  ) || { answer: '-', isCorrect: false }



                                  return (

                                    <td

                                      key={p.nickname}

                                      className={`p-3 ${wineAnswer.isCorrect ? 'bg-green-100 font-semibold' : ''} ${

                                        p.nickname === player.nickname ? 'bg-wine-50' : ''

                                      }`}

                                    >

                                      {translateWineChar(wineAnswer.answer)}

                                    </td>

                                  )

                                })}

                              </tr>

                            </Fragment>

                          )

                        })}

                      </tbody>

                    </table>

                  </div>

                </Card>

        

                {/* Wines Tasted */}

                <Card className="mt-8">

                  <h2 className="text-2xl font-semibold mb-4 flex items-center">

                    <Wine className="h-6 w-6 mr-3" />

                    Wines Tasted

                  </h2>

                  <ul className="space-y-2">

                    {results.wines.map((wine: any) => (

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

                {/* Wine Explanations */}
                {explanations && Object.keys(explanations).length > 0 && (
                  <Card className="mt-8">
                    <h2 className="text-2xl font-semibold mb-4 flex items-center">
                      <Wine className="h-6 w-6 mr-3" />
                      {t('results.wineExplanations')}
                    </h2>
                    <div className="space-y-6">
                      {results?.wines.map((wine: any, index: number) => {
                        const wineKey = `Wine ${index + 1}`
                        const wineExplanations = explanations[wineKey]

                        if (!wineExplanations) {
                          console.log(`No explanations found for ${wineKey}`)
                          return null
                        }

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

                <div className="text-center mt-8">

                  <Link href="/">

                    <Button variant="outline">

                      Return to Home Page

                    </Button>

                  </Link>

                </div>
      </div>
    </div>
  )
}

// Wrapper component that only renders on client side
function ClientOnlyGamePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="text-center">
          <Wine className="h-12 w-12 text-wine-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Loading Game...</h2>
          <p className="text-gray-600">Please wait while we load the game interface.</p>
        </Card>
      </div>
    )
  }

  return <GamePageComponent />
}

export default function GamePage() {
  return <ClientOnlyGamePage />
}
