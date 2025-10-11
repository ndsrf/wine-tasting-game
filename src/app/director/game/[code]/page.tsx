'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Wine, Users, Play, ArrowRight, RotateCcw, Trophy } from 'lucide-react'
import { useSocket } from '@/hooks/useSocket'
import { GameState, CharacteristicType, Difficulty, GameStatus, Player } from '@/types'
import { VISUAL_CHARACTERISTICS, SMELL_CHARACTERISTICS, TASTE_CHARACTERISTICS } from '@/lib/wine-options'
import { useAuth } from '@/hooks/useAuth'
import { authenticatedFetch } from '@/lib/auth-client'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'
import { normalizeCharacteristicToEnglish } from '@/lib/i18n'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

function DirectorGamePageComponent() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const { t, ready: i18nReady } = useTranslation()
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [error, setError] = useState('')
  const [isStartingGame, setIsStartingGame] = useState(false)
  const hasJoinedSocketRef = useRef(false)

  // Director gameplay state
  const [directorAnswers, setDirectorAnswers] = useState<Record<string, string>>({})
  const [gameData, setGameData] = useState<any>(null)
  const [showDirectorGameplay, setShowDirectorGameplay] = useState(true)
  const [directorSubmissionState, setDirectorSubmissionState] = useState<'idle' | 'submitting' | 'submitted'>('idle')
  const [directorPlayer, setDirectorPlayer] = useState<Player | null>(null)
  const [mounted, setMounted] = useState(false)
  const [showFinishConfirm, setShowFinishConfirm] = useState(false)
  const [showBackConfirm, setShowBackConfirm] = useState(false)
  // Track which players have submitted for each phase: { playerId: { VISUAL: true, SMELL: false, TASTE: false } }
  const [submittedPlayers, setSubmittedPlayers] = useState<Record<string, Record<CharacteristicType, boolean>>>({})

  const { isConnected, joinGame, startGame, changePhase, nextWine, submitAnswer, finishGame } = useSocket({
    onGameState: (state) => {
      // Always preserve the game object and merge with socket state
      setGameState(prevState => {
        // If we have previous state with game data, preserve it
        if (prevState?.game) {
          return {
            ...prevState,
            players: state.players || prevState.players,
            currentWine: state.currentWine || prevState.currentWine,
            currentPhase: state.currentPhase || prevState.currentPhase,
            isGameStarted: state.isGameStarted !== undefined ? state.isGameStarted : prevState.isGameStarted,
            isGameFinished: state.isGameFinished !== undefined ? state.isGameFinished : prevState.isGameFinished
          }
        }
        // If socket state includes game data, use it
        if (state.game) {
          return state
        }
        // Otherwise, store socket state and wait for HTTP API data
        return prevState || state
      })
    },
    onPlayerSubmitted: (data) => {
      console.log('Player submitted:', data)
      setSubmittedPlayers(prev => ({
        ...prev,
        [data.playerId]: {
          ...(prev[data.playerId] || {}),
          [data.characteristicType as CharacteristicType]: true
        }
      }))
    },
    onSubmissionsCleared: () => {
      console.log('Submissions cleared for new wine')
      setSubmittedPlayers({})
    },
    onPlayerJoined: (newPlayer) => {
      setGameState(prevState => {
        if (prevState) {
          return {
            ...prevState,
            players: [...prevState.players, newPlayer]
          }
        }
        return prevState
      })
    },
    onJoinedAsDirector: (data) => {
      console.log('Director joined:', data)
    },
    onError: (err) => setError(err.message),
    onGameStarted: (state) => {
      setIsStartingGame(false)
      setGameState(prevState => {
        if (prevState) {
          return {
            ...prevState,
            players: state.players || prevState.players,
            currentWine: state.currentWine || prevState.currentWine || 1,
            currentPhase: state.currentPhase || prevState.currentPhase || 'VISUAL',
            isGameStarted: true,
            isGameFinished: false
          }
        }
        // If no previous state, create new state with what we have
        return {
          game: state.game || null,
          players: state.players || [],
          currentWine: state.currentWine || 1,
          currentPhase: state.currentPhase || 'VISUAL',
          isGameStarted: true,
          isGameFinished: false
        }
      })
    },
    onPhaseChanged: (data) => {
      setGameState(prevState => {
        if (prevState) {
          return {
            ...prevState,
            currentPhase: (typeof data === 'object' && data.phase ? data.phase : data) as CharacteristicType
          }
        }
        return prevState
      })
    },
    onWineChanged: (state) => {
      setGameState(prevState => {
        if (prevState) {
          return {
            ...prevState,
            currentWine: state.currentWine,
            currentPhase: state.currentPhase
          }
        }
        return prevState
      })
      // Reset director submission state when wine changes
      setDirectorSubmissionState('idle')
      setDirectorAnswers({})
    },
    onAnswerSubmitted: (data) => {
      console.log('Director answer submitted:', data)
      if (data.error) {
        console.error('Director answer submission error:', data.error)
        setDirectorSubmissionState('idle')
      } else {
        setDirectorSubmissionState('submitted')
        console.log(`Director Score: ${data.correctCount}/${data.totalQuestions} (+${data.roundScore} points)`)
      }
    },
    onGameFinished: (state) => {
      console.log('Game finished:', state)
      setGameState(prevState => {
        if (prevState) {
          return {
            ...prevState,
            players: state.players || prevState.players,
            isGameFinished: true
          }
        }
        return state
      })
      setShowFinishConfirm(false)
    },
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (mounted && !authLoading && !isAuthenticated) {
      router.push(`/auth/login?redirect=/director/game/${code}`)
    }
  }, [mounted, authLoading, isAuthenticated, router, code])

  useEffect(() => {
    if (isConnected && user) {
      // Try to load game from API first
      authenticatedFetch(`/api/games/${code}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            // If game doesn't exist in database, create a development game state
            setGameState(prevState => {
              const newGameState = {
                game: {
                  id: `dev-${code}`,
                  code: code,
                  status: 'CREATED' as GameStatus,
                  difficulty: 'NOVICE' as Difficulty,
                  wineCount: 3,
                  directorId: user.id,
                  createdAt: new Date(),
                  updatedAt: new Date()
                },
                currentWine: 1,
                currentPhase: 'VISUAL' as CharacteristicType,
                players: prevState?.players || [],
                isGameStarted: prevState?.isGameStarted || false,
                isGameFinished: prevState?.isGameFinished || false
              }
              return newGameState
            })
          } else {
            // Store game data for director gameplay
            setGameData(data.game)

            // Merge with existing socket state if available
            setGameState(prevState => {
              const newGameState = {
                game: data.game,
                currentWine: 1,
                currentPhase: 'VISUAL' as CharacteristicType,
                players: data.game.players || [],
                isGameStarted: data.game.status === 'IN_PROGRESS',
                isGameFinished: data.game.status === 'FINISHED'
              }

              // If we have previous socket state, merge it with game data
              if (prevState) {
                return {
                  ...newGameState,
                  currentWine: prevState.currentWine || newGameState.currentWine,
                  currentPhase: prevState.currentPhase || newGameState.currentPhase,
                  players: prevState.players || newGameState.players,
                  isGameStarted: prevState.isGameStarted !== undefined ? prevState.isGameStarted : newGameState.isGameStarted,
                  isGameFinished: prevState.isGameFinished !== undefined ? prevState.isGameFinished : newGameState.isGameFinished
                }
              }

              return newGameState
            })
          }

          // Join the Socket.io room as director (only once)
          if (!hasJoinedSocketRef.current) {
            joinGame({ code, userId: user.id })
            hasJoinedSocketRef.current = true
          }
        })
        .catch(() => {
          // If API fails, create a development game state
          setGameState(prevState => {
            const newGameState = {
              game: {
                id: `temp-${code}`,
                code: code,
                status: 'CREATED' as GameStatus,
                difficulty: 'NOVICE' as Difficulty,
                wineCount: 3,
                directorId: user.id,
                createdAt: new Date(),
                updatedAt: new Date()
              },
              currentWine: 1,
              currentPhase: 'VISUAL' as CharacteristicType,
              players: prevState?.players || [],
              isGameStarted: prevState?.isGameStarted || false,
              isGameFinished: prevState?.isGameFinished || false
            }
            return newGameState
          })

          // Join the Socket.io room as director (only once)
          if (!hasJoinedSocketRef.current) {
            joinGame({ code, userId: user.id })
            hasJoinedSocketRef.current = true
          }
        })
    }
  }, [isConnected, code, user, joinGame])

  // Reset director submission state when phase changes
  useEffect(() => {
    setDirectorSubmissionState('idle')
    setDirectorAnswers({})
  }, [gameState?.currentPhase])

  // Clear submission tracking when wine changes
  useEffect(() => {
    setSubmittedPlayers({})
  }, [gameState?.currentWine])

  // Create director player object for submissions
  useEffect(() => {
    if (user && gameState && code) {
      setDirectorPlayer({
        id: `director-${user.id}-${code}`,
        gameId: gameState.game?.id || '',
        nickname: user.email || 'Director',
        sessionId: 'director-session',
        score: 0,
        joinedAt: new Date()
      })
    }
  }, [user, gameState, code])

  const handleStartGame = () => {
    if (user && code && !isStartingGame) {
      setIsStartingGame(true)
      startGame({ code, userId: user.id })

      // Add a timeout as a fallback in case the socket event doesn't fire
      setTimeout(() => {
        setIsStartingGame(false)
      }, 5000)
    }
  }

  const handleChangePhase = (phase: CharacteristicType) => {
    if (user && code) {
      changePhase({ code, userId: user.id, phase })
    }
  }

  const handleNextWine = () => {
    if (user && code) {
      nextWine({ code, userId: user.id })
    }
  }

  const handleFinishGame = () => {
    if (!mounted || !user) {
      console.log('Cannot finish game: mounted=', mounted, 'user=', user)
      return
    }

    console.log('Finishing game:', code, 'userId:', user.id)
    // Emit socket event to finish game for all players
    finishGame({ code, userId: user.id })
  }

  const handleDirectorSubmitAnswers = (playerAnswers: Record<string, string>) => {
    if (directorPlayer && gameState) {
      setDirectorSubmissionState('submitting')
      submitAnswer({
        code,
        playerId: directorPlayer.id,
        wineNumber: gameState.currentWine,
        characteristicType: gameState.currentPhase,
        answers: playerAnswers
      })
      // Set to submitted after a short delay to show feedback
      setTimeout(() => {
        if (directorSubmissionState !== 'submitted') {
          setDirectorSubmissionState('submitted')
        }
      }, 500)
    }
  }

  // Show loading state until mounted and auth resolved
  if (!mounted || authLoading || !i18nReady) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="text-center">
          <Wine className="h-12 w-12 text-wine-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('common.loading')}</h2>
        </Card>
      </div>
    )
  }

  // Don't render if not authenticated (redirect will happen via useEffect)
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="text-center">
          <Wine className="h-12 w-12 text-wine-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('common.loading')}</h2>
        </Card>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="text-center">
          <Wine className="h-12 w-12 text-wine-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('game.connecting')}</h2>
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

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>

        <div className="text-center mb-6">
          <Wine className="h-8 w-8 text-wine-600 mx-auto mb-2" />
          <h1 className="text-3xl font-bold text-gray-900">{t('director.controlPanel')}</h1>
          <p className="text-gray-600">{t('game.gameCode', { code })}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              {t('director.players', { count: gameState.players.length })}
            </h2>
            <div className="space-y-2">
              {gameState.players.length === 0 ? (
                <p className="text-gray-500 text-sm">{t('director.noPlayersJoined')}</p>
              ) : (
                gameState.players.map((player) => {
                  const playerSubmissions = submittedPlayers[player.id] || {}
                  const showScore = !gameState.isGameStarted || gameState.isGameFinished
                  return (
                    <div key={player.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{player.nickname}</span>
                        {gameState.isGameStarted && !gameState.isGameFinished && (
                          <div className="flex gap-1">
                            {(['VISUAL', 'SMELL', 'TASTE'] as CharacteristicType[]).map((phase) => {
                              const hasSubmittedPhase = playerSubmissions[phase] || false
                              return (
                                <span
                                  key={phase}
                                  className={`text-xs px-1.5 py-0.5 rounded ${
                                    hasSubmittedPhase
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-gray-200 text-gray-500'
                                  }`}
                                  title={`${t(`director.${phase.toLowerCase()}`)}: ${hasSubmittedPhase ? t('director.submitted') : t('director.pending')}`}
                                >
                                  {phase.charAt(0)}
                                </span>
                              )
                            })}
                          </div>
                        )}
                      </div>
                      {showScore && (
                        <span className="text-sm text-gray-600">{player.score} {t('director.points')}</span>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold mb-4">{t('director.gameStatus')}</h2>
            <div className="space-y-2">
              <p key="status"><span className="font-medium">{t('director.status')}</span> {
                gameState?.isGameFinished ? 'FINISHED' :
                gameState?.isGameStarted ? 'IN_PROGRESS' :
                gameState?.game?.status || 'CREATED'
              }</p>
              <p key="difficulty"><span className="font-medium">{t('director.difficulty')}</span> {gameState?.game?.difficulty || t('common.loading')}</p>
              <p key="total-wines"><span className="font-medium">{t('director.totalWines')}</span> {gameState?.game?.wineCount || t('common.loading')}</p>
              {gameState?.isGameStarted && (
                <>
                  <p key="current-wine"><span className="font-medium">{t('director.currentWine')}</span> {gameState.currentWine}</p>
                  <p key="current-phase"><span className="font-medium">{t('director.currentPhase')}</span> {gameState.currentPhase}</p>
                </>
              )}
            </div>
          </Card>
        </div>

        {!gameState?.isGameStarted && (
          <Card className="text-center">
            <h2 className="text-xl font-semibold mb-4">{t('director.readyToStart')}</h2>
            <p className="text-gray-600 mb-6">
              {t('director.startDescription')}
            </p>
            <Button
              onClick={handleStartGame}
              className="inline-flex items-center"
              disabled={!gameState?.players || gameState.players.length === 0 || isStartingGame}
              loading={isStartingGame}
            >
              <Play className="h-4 w-4 mr-2" />
              {isStartingGame ? t('common.loading') : t('common.start')}
            </Button>
          </Card>
        )}

        {gameState?.isGameStarted && !gameState?.isGameFinished && (
          <>
            <Card>
              <h2 className="text-xl font-semibold mb-4">{t('director.gameControls')}</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">{t('director.phaseControls')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {(['VISUAL', 'SMELL', 'TASTE'] as CharacteristicType[]).map((phase) => (
                      <Button
                        key={phase}
                        onClick={() => handleChangePhase(phase)}
                        variant={gameState?.currentPhase === phase ? 'primary' : 'outline'}
                        size="sm"
                      >
                        {t(`director.${phase.toLowerCase()}`)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleNextWine}
                    className="inline-flex items-center"
                    disabled={!gameState?.game?.wineCount || gameState.currentWine >= gameState.game.wineCount}
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    {t('director.nextWine')}
                  </Button>

                  {gameState?.game?.wineCount && gameState.currentWine >= gameState.game.wineCount && (
                    <Button
                      onClick={() => setShowFinishConfirm(true)}
                      variant="secondary"
                      className="inline-flex items-center"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      {t('director.finishGame')}
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {showDirectorGameplay && gameData && (
              <Card>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">{t('director.directorGameplay')}</h2>
                  <Button
                    onClick={() => setShowDirectorGameplay(!showDirectorGameplay)}
                    variant="ghost"
                    size="sm"
                  >
                    {showDirectorGameplay ? t('director.hide') : t('director.show')}
                  </Button>
                </div>
                <DirectorGameplayMatrix
                  gameData={gameData}
                  gameState={gameState}
                  answers={directorAnswers}
                  setAnswers={setDirectorAnswers}
                  onSubmitAnswers={handleDirectorSubmitAnswers}
                  submissionState={directorSubmissionState}
                  playerId={directorPlayer?.id || ''}
                  code={code}
                />
              </Card>
            )}
          </>
        )}

        {gameState?.isGameFinished && (
          <DirectorResults gameState={gameState} code={code} />
        )}

        <div className="text-center mt-6">
          <Button
            variant="ghost"
            onClick={() => {
              // If game is finished, go back immediately
              if (gameState?.isGameFinished) {
                router.push('/')
              } else {
                // Otherwise, show confirmation
                setShowBackConfirm(true)
              }
            }}
          >
            {t('director.backToDashboard')}
          </Button>
        </div>

        {/* Finish Game Confirmation Dialog */}
        {showFinishConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Finish Game?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to finish the game? This will end the game for all players and display the final results.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowFinishConfirm(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleFinishGame}
                  variant="primary"
                  className="flex-1"
                >
                  Finish Game
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Back to Dashboard Confirmation Dialog */}
        {showBackConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Leave Game?</h3>
              <p className="text-gray-600 mb-6">
                The game is still in progress. Are you sure you want to leave? Players will still be able to continue playing.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowBackConfirm(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => router.push('/')}
                  variant="primary"
                  className="flex-1"
                >
                  Leave Game
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

function DirectorResults({ gameState, code }: { gameState: GameState; code: string }) {
  const { t } = useTranslation()
  const [results, setResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
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
        const response = await authenticatedFetch(`/api/games/${code}/results`)
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
        setResults(data.results)
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
      <Card>
        <div className="text-center">
          <Wine className="h-12 w-12 text-wine-600 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('common.loading')}</h2>
        </div>
      </Card>
    )
  }

  if (error || !results) {
    return (
      <Card>
        <div className="text-center mb-6">
          <Trophy className="h-12 w-12 text-wine-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('director.gameCompleted')}</h2>
          <p className="text-gray-600">{t('director.gameEndedDescription')}</p>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-center">{t('results.finalScores')}</h3>
          <div className="space-y-2">
            {gameState.players
              .sort((a, b) => b.score - a.score)
              .map((p, index) => (
                <div
                  key={p.id}
                  className={`flex justify-between items-center p-3 rounded-lg ${
                    index === 0
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
          {error && (
            <p className="text-sm text-gray-500 text-center mt-4">
              Detailed results unavailable: {error}
            </p>
          )}
        </div>
      </Card>
    )
  }

  return (
    <>
      {/* Scores Summary */}
      <Card className="mb-6">
        <div className="text-center mb-6">
          <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">{t('results.gameCompleted')}</h2>
        </div>

        <h3 className="text-xl font-semibold text-center mb-4">{t('results.finalScores')}</h3>
        <div className="space-y-2">
          {results.players
            .sort((a: any, b: any) => b.score - a.score)
            .map((p: any, index: number) => (
              <div
                key={p.nickname}
                className={`flex justify-between items-center p-3 rounded-lg ${
                  index === 0
                    ? 'bg-yellow-100 border-2 border-yellow-400'
                    : 'bg-gray-50'
                }`}
              >
                <span className="font-medium">
                  {index === 0 && '🏆 '}
                  #{index + 1} {p.nickname}
                </span>
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
                <th className="text-left p-3 font-semibold bg-green-100">{t('results.wineLabel')}</th>
                <th className="text-left p-3 font-semibold bg-green-100">{t('results.characteristicsCorrectAnswers')}</th>
                <th className="text-left p-3 font-semibold bg-gray-100">{t('results.director')}</th>
                {results.players.filter((p: any) => !p.id || !p.id.startsWith('director-')).map((p: any) => (
                  <th key={p.nickname} className="text-left p-3 font-semibold bg-gray-50">
                    {p.nickname}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.wines.map((wine: any, wineIndex: number) => {
                // Director player has an ID starting with "director-"
                const directorPlayer = results.players.find((p: any) => p.id && p.id.startsWith('director-'))
                const regularPlayers = results.players.filter((p: any) => !p.id || !p.id.startsWith('director-'))

                // Get characteristics with lowercase keys
                const visualChars = wine.characteristics?.visual || wine.characteristics?.VISUAL || []
                const smellChars = wine.characteristics?.smell || wine.characteristics?.SMELL || []
                const tasteChars = wine.characteristics?.taste || wine.characteristics?.TASTE || []

                // Translate and format characteristics - handle both arrays and comma-separated strings
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

                // Get all player answers for this wine
                const directorVisualAnswer = directorPlayer?.answers.find((a: any) => a.wineId === wine.id && a.characteristicType === 'VISUAL')
                const directorSmellAnswer = directorPlayer?.answers.find((a: any) => a.wineId === wine.id && a.characteristicType === 'SMELL')
                const directorTasteAnswer = directorPlayer?.answers.find((a: any) => a.wineId === wine.id && a.characteristicType === 'TASTE')

                const hasDirectorCorrect = directorVisualAnswer?.isCorrect || directorSmellAnswer?.isCorrect || directorTasteAnswer?.isCorrect

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
                    <td className={`p-3 ${hasDirectorCorrect ? 'bg-green-100' : ''}`}>
                      <div><strong>{t('director.visual')}:</strong> {translateWineChar(directorVisualAnswer?.answer)}</div>
                      <div><strong>{t('director.smell')}:</strong> {translateWineChar(directorSmellAnswer?.answer)}</div>
                      <div><strong>{t('director.taste')}:</strong> {translateWineChar(directorTasteAnswer?.answer)}</div>
                    </td>
                    {regularPlayers.map((p: any) => {
                      const visualAnswer = p.answers.find((a: any) => a.wineId === wine.id && a.characteristicType === 'VISUAL')
                      const smellAnswer = p.answers.find((a: any) => a.wineId === wine.id && a.characteristicType === 'SMELL')
                      const tasteAnswer = p.answers.find((a: any) => a.wineId === wine.id && a.characteristicType === 'TASTE')

                      const hasCorrect = visualAnswer?.isCorrect || smellAnswer?.isCorrect || tasteAnswer?.isCorrect

                      return (
                        <td
                          key={p.nickname}
                          className={`p-3 ${hasCorrect ? 'bg-green-100 font-semibold' : ''}`}
                        >
                          <div><strong>{t('director.visual')}:</strong> {translateWineChar(visualAnswer?.answer)}</div>
                          <div><strong>{t('director.smell')}:</strong> {translateWineChar(smellAnswer?.answer)}</div>
                          <div><strong>{t('director.taste')}:</strong> {translateWineChar(tasteAnswer?.answer)}</div>
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
    </>
  )
}

function DirectorGameplayMatrix({
  gameData,
  gameState,
  answers,
  setAnswers,
  onSubmitAnswers,
  submissionState,
  playerId,
  code
}: {
  gameData: any
  gameState: GameState
  answers: Record<string, string>
  setAnswers: (answers: Record<string, string>) => void
  onSubmitAnswers?: (answers: Record<string, string>) => void
  submissionState: 'idle' | 'submitting' | 'submitted'
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

  const { categoryOptions, wineData, categoryName, characteristicLabels } = useMemo(() => {
    if (!gameData?.wines || gameData.wines.length === 0) {
      return {
        categoryOptions: {},
        wineData: [],
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

    const categoryOptions: Record<string, string[]> = {}
    Object.keys(allCategoryOptions).forEach((key, keyIndex) => {
      const allOptions = allCategoryOptions[key]
      const targetCount = Math.max(
        wineCount,
        Math.min(allOptions.length, Math.ceil(wineCount * optionsMultiplier) + 1)
      )

      // Get the correct answer for this characteristic category (if it exists)
      const correctCharacteristics: string[] = []
      const currentWineIndex = gameState.currentWine - 1
      if (gameData.wines[currentWineIndex]) {
        const wine = gameData.wines[currentWineIndex]
        const wineChars = wine.characteristics?.[currentPhase] || wine.characteristics?.[gameState.currentPhase]
        if (wineChars) {
          correctCharacteristics.push(...wineChars)
        }
      }
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
        // Replace the last option with the correct answer
        selectedOptions[selectedOptions.length - 1] = correctAnswer
      }

      categoryOptions[key] = selectedOptions
    })

    // Only show the current wine
    const currentWineIndex = gameState.currentWine - 1
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

    return { categoryOptions, wineData, categoryName, characteristicLabels }
  }, [gameData?.wines, gameData?.difficulty, gameData?.wineCount, gameData?.id, gameState.currentPhase, gameState.currentWine])

  if (!gameData?.wines || gameData.wines.length === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600">
          Loading wine characteristics...
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
    if (onSubmitAnswers) {
      const characteristicAnswers: Record<string, string> = {}

      wineData.forEach((wine) => {
        wine.characteristics.forEach((_, index) => {
          const answerKey = `wine-${wine.wineNumber}-char-${index}`
          const selectedChar = answers[answerKey]
          if (selectedChar) {
            characteristicAnswers[selectedChar] = `Wine ${wine.wineNumber}`
          }
        })
      })

      onSubmitAnswers(characteristicAnswers)
    }
  }

  const totalAnswersNeeded = wineData.reduce((total, wine) => total + wine.characteristics.length, 0)
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
    <div className="space-y-4">
      <div className="bg-wine-50 p-4 rounded-lg">
        <h3 className="font-semibold text-wine-700 mb-2">
          {t('director.directorPlaying', { categoryName: t(`game.${categoryName}`) })}
        </h3>
        <p className="text-sm text-wine-600">
          {t('director.selectCharacteristics', { wineNumber: `${t('game.wineNumber', { number: gameState.currentWine })}`, categoryName: t(`game.${categoryName}`) })}
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

      <div className="space-y-3">
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600 text-center">
            {t('director.progress', { answered: answeredCount, total: totalAnswersNeeded })}
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
            t('director.answersSubmitted')
          ) : submissionState === 'submitting' ? (
            t('director.submitting')
          ) : (
            t('director.submitDirectorAnswers', { answered: answeredCount, total: totalAnswersNeeded })
          )}
        </Button>

        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>{t('director.directorMode')}</strong>
          </p>
        </div>
      </div>
    </div>
  )
}

// Wrapper component that only renders on client side
function ClientOnlyDirectorPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="text-center">
          <Wine className="h-12 w-12 text-wine-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Loading Director Panel...</h2>
          <p className="text-gray-600">Please wait while we load the director interface.</p>
        </Card>
      </div>
    )
  }

  return <DirectorGamePageComponent />
}

// Dynamic import with SSR disabled to prevent hydration errors
const DirectorGamePage = dynamic(() => Promise.resolve(ClientOnlyDirectorPage), {
  ssr: false,
})

export default DirectorGamePage