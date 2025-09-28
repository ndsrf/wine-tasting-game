'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Wine, Users } from 'lucide-react'
import { useSocket } from '@/hooks/useSocket'
import { GameState, Player } from '@/types'

export default function GamePage() {
  const params = useParams()
  const code = params.code as string
  const [nickname, setNickname] = useState('')
  const [player, setPlayer] = useState<Player | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [error, setError] = useState('')
  const [joining, setJoining] = useState(false)

  const { isConnected, joinGame } = useSocket({
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
          currentPhase: phase as any
        })
      }
    },
    onWineChanged: (state) => setGameState(state),
  })

  const handleJoinGame = async () => {
    if (!nickname.trim()) {
      setError('Please enter a nickname')
      return
    }

    setJoining(true)
    setError('')

    try {
      const response = await fetch(`/api/games/${code}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Game not found')
        return
      }

      joinGame({ code, nickname: nickname.trim() })
    } catch (err) {
      setError('Failed to join game')
    } finally {
      setJoining(false)
    }
  }

  useEffect(() => {
    if (isConnected && !player && !gameState) {
      fetch(`/api/games/${code}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setGameState(data.game)
          }
        })
        .catch(() => {})
    }
  }, [isConnected, code, player, gameState])

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="text-center">
          <Wine className="h-12 w-12 text-wine-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Connecting...</h2>
          <p className="text-gray-600">Please wait while we connect you to the game.</p>
        </Card>
      </div>
    )
  }

  if (!player) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Wine className="h-12 w-12 text-wine-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900">Join Game</h1>
            <p className="text-gray-600 mt-2">Game Code: <span className="font-bold tracking-wider">{code}</span></p>
          </div>

          <Card>
            <div className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {gameState && (
                <div className="bg-wine-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-wine-700 mb-2">Game Info</h3>
                  <p className="text-sm text-wine-600">Difficulty: {gameState.game.difficulty}</p>
                  <p className="text-sm text-wine-600">Wines: {gameState.game.wineCount}</p>
                  <p className="text-sm text-wine-600">Status: {gameState.game.status}</p>
                  {gameState.players.length > 0 && (
                    <p className="text-sm text-wine-600">Players joined: {gameState.players.length}</p>
                  )}
                </div>
              )}

              <Input
                label="Your Nickname"
                placeholder="Enter your nickname"
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
                Join Game
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return <PlayerGameInterface player={player} gameState={gameState} />
}

function PlayerGameInterface({ player, gameState }: { player: Player; gameState: GameState | null }) {
  const [answers, setAnswers] = useState<Record<string, string>>({})

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

  if (!gameState.isGameStarted) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Wine className="h-12 w-12 text-wine-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900">Waiting for Game to Start</h1>
            <p className="text-gray-600 mt-2">Welcome, {player.nickname}!</p>
          </div>

          <Card>
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center text-gray-600">
                <Users className="h-5 w-5 mr-2" />
                <span>{gameState.players.length} players joined</span>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Players:</h3>
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
                The director will start the game soon. Get your wine glasses ready!
              </p>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  if (gameState.isGameFinished) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Wine className="h-12 w-12 text-wine-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900">Game Finished!</h1>
            <p className="text-gray-600 mt-2">Final Results</p>
          </div>

          <Card>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-center">Final Scores</h3>
              <div className="space-y-2">
                {gameState.players
                  .sort((a, b) => b.score - a.score)
                  .map((p, index) => (
                    <div
                      key={p.id}
                      className={`flex justify-between items-center p-3 rounded-lg ${
                        p.id === player.id
                          ? 'bg-wine-100'
                          : 'bg-gray-50'
                      }`}
                    >
                      <span className="font-medium">
                        #{index + 1} {p.nickname}
                      </span>
                      <span className="font-bold">{p.score} points</span>
                    </div>
                  ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <Wine className="h-8 w-8 text-wine-600 mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-gray-900">
            Wine {gameState.currentWine}
          </h1>
          <p className="text-gray-600">
            {gameState.currentPhase.charAt(0) + gameState.currentPhase.slice(1).toLowerCase()} Phase
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Your score: {player.score} points
          </p>
        </div>

        <Card>
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">
                Guess the {gameState.currentPhase.toLowerCase()} characteristics
              </h2>
              <p className="text-gray-600 text-sm">
                Match each characteristic with the wine it belongs to
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                <strong>Note:</strong> This is a placeholder interface. In the full implementation,
                you would see the actual wine characteristics generated by OpenAI and be able to
                match them to the wines in this game.
              </p>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  Waiting for the director to provide the next phase or wine...
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}