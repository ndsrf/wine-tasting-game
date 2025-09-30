'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Wine, Users, Trophy, Smartphone } from 'lucide-react'

export default function HomePage() {
  const [gameCode, setGameCode] = useState('')

  return (
    <div className="min-h-screen">
      <header className="py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center mb-8">
            <Wine className="h-8 w-8 text-wine-600 mr-3" />
            <h1 className="text-4xl font-bold text-gradient">Wine Tasting Game</h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-12">
        <section className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            The Ultimate Multiplayer Wine Tasting Experience
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Test your wine knowledge with friends! A director creates the game while players
            guess wine characteristics across visual, smell, and taste categories. Perfect for
            wine enthusiasts and beginners alike.
          </p>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-12">
            <Card className="text-center">
              <h3 className="text-xl font-semibold mb-4">Join a Game</h3>
              <div className="space-y-4">
                <Input
                  placeholder="Enter 5-character game code"
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                  maxLength={5}
                  className="text-center text-lg tracking-widest"
                />
                <Link href={gameCode.length === 5 ? `/game/${gameCode}` : '#'}>
                  <Button
                    className="w-full"
                    disabled={gameCode.length !== 5}
                  >
                    Join Game
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="text-center">
              <h3 className="text-xl font-semibold mb-4">Create a Game</h3>
              <p className="text-gray-600 mb-4">
                Set up wine tastings for your friends and family
              </p>
              <Link href="/auth/login">
                <Button variant="secondary" className="w-full">
                  Login / Register
                </Button>
              </Link>
            </Card>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-wine-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Wine className="h-8 w-8 text-wine-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Director Sets Up</h3>
              <p className="text-gray-600">
                The director creates a game, selects difficulty level, and adds wines with their names and years.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gold-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-gold-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Players Join</h3>
              <p className="text-gray-600">
                Players join using a 5-character code and provide a nickname. No registration required for players!
              </p>
            </div>

            <div className="text-center">
              <div className="bg-wine-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-8 w-8 text-wine-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Guess & Win</h3>
              <p className="text-gray-600">
                Match wine characteristics across visual, smell, and taste categories. Most points wins!
              </p>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Difficulty Levels</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="text-center">
              <h3 className="text-xl font-semibold text-green-600 mb-2">Novice</h3>
              <p className="text-gray-600 mb-4">Perfect for beginners</p>
              <p className="text-sm text-gray-500">3 characteristics per category</p>
            </Card>

            <Card className="text-center">
              <h3 className="text-xl font-semibold text-yellow-600 mb-2">Intermediate</h3>
              <p className="text-gray-600 mb-4">For wine enthusiasts</p>
              <p className="text-sm text-gray-500">5 characteristics per category</p>
            </Card>

            <Card className="text-center">
              <h3 className="text-xl font-semibold text-red-600 mb-2">Sommelier</h3>
              <p className="text-gray-600 mb-4">Expert level challenge</p>
              <p className="text-sm text-gray-500">10 characteristics per category</p>
            </Card>
          </div>
        </section>

        <section className="text-center">
          <div className="bg-wine-50 rounded-2xl p-8">
            <Smartphone className="h-12 w-12 text-wine-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Mobile Optimized</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Designed for mobile devices with touch-optimized controls and offline capabilities.
              Play anywhere, anytime with your wine tasting group.
            </p>
          </div>
        </section>
      </main>

      <footer className="bg-wine-900 text-white py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p>&copy; 2024 Wine Tasting Game. Made with ❤️ for wine lovers everywhere.</p>
          <div className="mt-4">
            <Link
              href="/test"
              className="text-wine-200 hover:text-white text-sm underline"
            >
              🧪 Create Test Room (Dev Only)
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}