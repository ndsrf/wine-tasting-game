'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Wine, Users, Play, ArrowRight, RotateCcw } from 'lucide-react'
import { useSocket } from '@/hooks/useSocket'
import { GameState, CharacteristicType } from '@/types'

export default function DirectorGamePage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string
  const [user, setUser] = useState<any>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [error, setError] = useState('')

  const { isConnected, startGame, changePhase, nextWine } = useSocket({
    onGameState: (state) => setGameState(state),
    onPlayerJoined: (newPlayer) => {
      if (gameState) {
        setGameState({
          ...gameState,
          players: [...gameState.players, newPlayer]
        })
      }
    },
    onError: (err) => setError(err.message),
    onGameStarted: (state) => setGameState(state),
    onPhaseChanged: (phase) => {
      if (gameState) {
        setGameState({
          ...gameState,
          currentPhase: phase as CharacteristicType
        })
      }
    },
    onWineChanged: (state) => setGameState(state),
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/auth/login')
      return
    }

    setUser(JSON.parse(userData))
  }, [router])

  useEffect(() => {
    if (isConnected && user) {
      fetch(`/api/games/${code}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            setError(data.error)
          } else {
            setGameState(data.game)
          }
        })
        .catch(() => setError('Failed to load game'))
    }
  }, [isConnected, code, user])

  const handleStartGame = () => {
    if (user && code) {
      startGame({ code, userId: user.id })
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

  const handleFinishGame = async () => {
    try {
      const token = localStorage.getItem('token')
      await fetch(`/api/games/${code}/finish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      router.push(`/director/results/${code}`)
    } catch (err) {
      setError('Failed to finish game')
    }
  }

  if (!isConnected || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="text-center">
          <Wine className="h-12 w-12 text-wine-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Loading...</h2>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.push('/director')}>
            Back to Director Dashboard
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
          <h2 className="text-xl font-bold text-gray-900 mb-2">Loading Game...</h2>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <Wine className="h-8 w-8 text-wine-600 mx-auto mb-2" />
          <h1 className="text-3xl font-bold text-gray-900">Director Control Panel</h1>
          <p className="text-gray-600">Game Code: <span className="font-bold tracking-wider">{code}</span></p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Players ({gameState.players.length})
            </h2>
            <div className="space-y-2">
              {gameState.players.length === 0 ? (
                <p className="text-gray-500 text-sm">No players joined yet</p>
              ) : (
                gameState.players.map((player) => (
                  <div key={player.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-medium">{player.nickname}</span>
                    <span className="text-sm text-gray-600">{player.score} pts</span>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold mb-4">Game Status</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Status:</span> {gameState.game.status}</p>
              <p><span className="font-medium">Difficulty:</span> {gameState.game.difficulty}</p>
              <p><span className="font-medium">Total Wines:</span> {gameState.game.wineCount}</p>
              {gameState.isGameStarted && (
                <>
                  <p><span className="font-medium">Current Wine:</span> {gameState.currentWine}</p>
                  <p><span className="font-medium">Current Phase:</span> {gameState.currentPhase}</p>
                </>
              )}
            </div>
          </Card>
        </div>

        {!gameState.isGameStarted && (
          <Card className="text-center">
            <h2 className="text-xl font-semibold mb-4">Ready to Start?</h2>
            <p className="text-gray-600 mb-6">
              Make sure all players have joined before starting the game.
            </p>
            <Button
              onClick={handleStartGame}
              className="inline-flex items-center"
              disabled={gameState.players.length === 0}
            >
              <Play className="h-4 w-4 mr-2" />
              Start Game
            </Button>
          </Card>
        )}

        {gameState.isGameStarted && !gameState.isGameFinished && (
          <Card>
            <h2 className="text-xl font-semibold mb-4">Game Controls</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Phase Controls</h3>
                <div className="flex flex-wrap gap-2">
                  {(['VISUAL', 'SMELL', 'TASTE'] as CharacteristicType[]).map((phase) => (
                    <Button
                      key={phase}
                      onClick={() => handleChangePhase(phase)}
                      variant={gameState.currentPhase === phase ? 'primary' : 'outline'}
                      size="sm"
                    >
                      {phase.charAt(0) + phase.slice(1).toLowerCase()}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleNextWine}
                  className="inline-flex items-center"
                  disabled={gameState.currentWine >= gameState.game.wineCount}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Next Wine
                </Button>

                {gameState.currentWine >= gameState.game.wineCount && (
                  <Button
                    onClick={handleFinishGame}
                    variant="secondary"
                    className="inline-flex items-center"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Finish Game
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}

        {gameState.isGameFinished && (
          <Card className="text-center">
            <h2 className="text-xl font-semibold mb-4">Game Completed!</h2>
            <p className="text-gray-600 mb-6">
              The game has ended. View the final results and player answers.
            </p>
            <Button onClick={() => router.push(`/director/results/${code}`)}>
              View Results
            </Button>
          </Card>
        )}

        <div className="text-center mt-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/director')}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}