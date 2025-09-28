export type Difficulty = 'NOVICE' | 'INTERMEDIATE' | 'SOMMELIER'
export type GameStatus = 'CREATED' | 'IN_PROGRESS' | 'FINISHED'
export type CharacteristicType = 'VISUAL' | 'SMELL' | 'TASTE'

export interface User {
  id: string
  email: string
  username: string
  googleId?: string
  createdAt: Date
  updatedAt: Date
}

export interface Game {
  id: string
  code: string
  directorId: string
  difficulty: Difficulty
  wineCount: number
  status: GameStatus
  createdAt: Date
  updatedAt: Date
  director?: User
  wines?: Wine[]
  players?: Player[]
}

export interface Wine {
  id: string
  gameId: string
  number: number
  name: string
  year: number
  characteristics: WineCharacteristics
}

export interface WineCharacteristics {
  visual: string[]
  smell: string[]
  taste: string[]
}

export interface Player {
  id: string
  gameId: string
  nickname: string
  sessionId: string
  score: number
  joinedAt: Date
  answers?: Answer[]
}

export interface Answer {
  id: string
  playerId: string
  wineId: string
  characteristicType: CharacteristicType
  answer: string
  isCorrect: boolean
  createdAt: Date
}

export interface GameState {
  game: Game
  currentWine: number
  currentPhase: CharacteristicType
  players: Player[]
  isGameStarted: boolean
  isGameFinished: boolean
}

export interface CreateGameData {
  difficulty: Difficulty
  wineCount: number
  wines: {
    name: string
    year: number
  }[]
}

export interface JoinGameData {
  code: string
  nickname: string
}

export interface SubmitAnswerData {
  wineNumber: number
  characteristicType: CharacteristicType
  answers: Record<string, string>
}

export interface GameResults {
  players: Array<{
    nickname: string
    score: number
    answers: Answer[]
  }>
  wines: Wine[]
  correctAnswers: Record<string, WineCharacteristics>
}