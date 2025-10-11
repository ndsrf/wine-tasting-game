'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { Wine, Users, Trophy, Smartphone, Sparkles, Eye, Wind, TrendingUp, Star } from 'lucide-react'
import '@/lib/i18n'

export default function HomePage() {
  const [gameCode, setGameCode] = useState('')
  const { t, ready } = useTranslation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !ready) {
    return null
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-wine-900 to-red-900">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-wine-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-gold-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <header className="flex items-center justify-between mb-12 flex-wrap gap-4">
            <div className="flex items-center space-x-3">
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20">
                <Wine className="h-8 w-8 text-gold-300" />
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">{t('homepage.title')}</h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Action Buttons */}
              <div className="hidden md:flex items-center gap-3">
                <a href="#join-game">
                  <Button
                    variant="outline"
                    className="border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm transition-all duration-200"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    {t('homepage.joinGame')}
                  </Button>
                </a>
                <Link href="/auth/login">
                  <Button className="bg-gold-500 hover:bg-gold-600 text-wine-900 font-semibold shadow-lg hover:shadow-gold-500/50 transition-all duration-200">
                    <Wine className="h-4 w-4 mr-2" />
                    {t('homepage.createGame')}
                  </Button>
                </Link>
              </div>

              <LanguageSwitcher />
            </div>
          </header>

          {/* Hero Content */}
          <div className="grid lg:grid-cols-2 gap-12 items-center py-12 md:py-20">
            <div className="text-white space-y-6">
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                <Sparkles className="h-4 w-4 text-gold-300" />
                <span className="text-sm font-medium">{t('homepage.subtitle')}</span>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                {t('homepage.description')}
              </h2>

              <p className="text-lg text-wine-100 max-w-xl">
                {t('homepage.tagline')}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/auth/login" className="flex-1 sm:flex-initial">
                  <Button className="w-full bg-gold-500 hover:bg-gold-600 text-wine-900 font-semibold px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-gold-500/50 transition-all duration-300 transform hover:scale-105">
                    {t('homepage.createGame')}
                  </Button>
                </Link>
                <a href="#join-game" className="flex-1 sm:flex-initial">
                  <Button variant="outline" className="w-full border-2 border-white/30 text-white hover:bg-white/10 font-semibold px-8 py-4 text-lg rounded-xl backdrop-blur-sm transition-all duration-300">
                    {t('homepage.joinGame')}
                  </Button>
                </a>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gold-300">3</div>
                  <div className="text-sm text-wine-200">Difficulty Levels</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gold-300">15+</div>
                  <div className="text-sm text-wine-200">Characteristics</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gold-300">∞</div>
                  <div className="text-sm text-wine-200">Players</div>
                </div>
              </div>
            </div>

            {/* Hero Image - Wine Glasses Illustration */}
            <div className="relative hidden lg:block">
              <div className="relative w-full h-[500px] flex items-center justify-center">
                {/* Wine glass SVG illustration */}
                <div className="absolute inset-0 flex items-end justify-center space-x-8">
                  {/* Glass 1 - Red Wine */}
                  <div className="wine-glass-container animate-float">
                    <svg viewBox="0 0 100 200" className="w-32 h-64 drop-shadow-2xl">
                      <defs>
                        <linearGradient id="redWine" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" style={{stopColor: '#7C1D3F', stopOpacity: 0.9}} />
                          <stop offset="100%" style={{stopColor: '#4A0E24', stopOpacity: 1}} />
                        </linearGradient>
                        <linearGradient id="glass" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" style={{stopColor: '#ffffff', stopOpacity: 0.3}} />
                          <stop offset="50%" style={{stopColor: '#ffffff', stopOpacity: 0.1}} />
                          <stop offset="100%" style={{stopColor: '#ffffff', stopOpacity: 0.3}} />
                        </linearGradient>
                      </defs>
                      {/* Glass */}
                      <path d="M 30 40 Q 25 80 25 100 L 25 140 L 45 140 L 45 170 L 55 170 L 55 140 L 75 140 L 75 100 Q 75 80 70 40 Z"
                            fill="url(#glass)" stroke="white" strokeWidth="1" opacity="0.6"/>
                      {/* Wine */}
                      <path d="M 32 100 Q 27 110 27 120 L 27 140 L 45 140 L 45 170 L 55 170 L 55 140 L 73 140 L 73 120 Q 73 110 68 100 Z"
                            fill="url(#redWine)" opacity="0.8"/>
                      {/* Stem */}
                      <rect x="45" y="140" width="10" height="30" fill="url(#glass)" opacity="0.6"/>
                      {/* Base */}
                      <ellipse cx="50" cy="175" rx="20" ry="5" fill="url(#glass)" opacity="0.6"/>
                    </svg>
                  </div>

                  {/* Glass 2 - White Wine */}
                  <div className="wine-glass-container animate-float animation-delay-1000">
                    <svg viewBox="0 0 100 200" className="w-32 h-64 drop-shadow-2xl">
                      <defs>
                        <linearGradient id="whiteWine" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" style={{stopColor: '#F4D03F', stopOpacity: 0.8}} />
                          <stop offset="100%" style={{stopColor: '#D4AF37', stopOpacity: 0.9}} />
                        </linearGradient>
                      </defs>
                      {/* Glass */}
                      <path d="M 30 40 Q 25 80 25 100 L 25 140 L 45 140 L 45 170 L 55 170 L 55 140 L 75 140 L 75 100 Q 75 80 70 40 Z"
                            fill="url(#glass)" stroke="white" strokeWidth="1" opacity="0.6"/>
                      {/* Wine */}
                      <path d="M 32 110 Q 27 115 27 120 L 27 140 L 45 140 L 45 170 L 55 170 L 55 140 L 73 140 L 73 120 Q 73 115 68 110 Z"
                            fill="url(#whiteWine)" opacity="0.8"/>
                      {/* Stem */}
                      <rect x="45" y="140" width="10" height="30" fill="url(#glass)" opacity="0.6"/>
                      {/* Base */}
                      <ellipse cx="50" cy="175" rx="20" ry="5" fill="url(#glass)" opacity="0.6"/>
                    </svg>
                  </div>

                  {/* Glass 3 - Rosé */}
                  <div className="wine-glass-container animate-float animation-delay-2000">
                    <svg viewBox="0 0 100 200" className="w-32 h-64 drop-shadow-2xl">
                      <defs>
                        <linearGradient id="roseWine" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" style={{stopColor: '#E88BA8', stopOpacity: 0.8}} />
                          <stop offset="100%" style={{stopColor: '#C76B87', stopOpacity: 0.9}} />
                        </linearGradient>
                      </defs>
                      {/* Glass */}
                      <path d="M 30 40 Q 25 80 25 100 L 25 140 L 45 140 L 45 170 L 55 170 L 55 140 L 75 140 L 75 100 Q 75 80 70 40 Z"
                            fill="url(#glass)" stroke="white" strokeWidth="1" opacity="0.6"/>
                      {/* Wine */}
                      <path d="M 32 105 Q 27 112 27 120 L 27 140 L 45 140 L 45 170 L 55 170 L 55 140 L 73 140 L 73 120 Q 73 112 68 105 Z"
                            fill="url(#roseWine)" opacity="0.8"/>
                      {/* Stem */}
                      <rect x="45" y="140" width="10" height="30" fill="url(#glass)" opacity="0.6"/>
                      {/* Base */}
                      <ellipse cx="50" cy="175" rx="20" ry="5" fill="url(#glass)" opacity="0.6"/>
                    </svg>
                  </div>
                </div>

                {/* Decorative sparkles */}
                <Star className="absolute top-10 right-20 w-6 h-6 text-gold-300 animate-pulse" />
                <Star className="absolute top-32 right-10 w-4 h-4 text-gold-400 animate-pulse animation-delay-1000" />
                <Star className="absolute bottom-20 left-10 w-5 h-5 text-gold-300 animate-pulse animation-delay-2000" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-16">
        {/* Join Game Section */}
        <section id="join-game" className="mb-20">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="text-center p-8 hover:shadow-2xl transition-shadow duration-300 border-2 border-wine-100">
                <div className="bg-gradient-to-br from-wine-500 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">{t('homepage.joinGame')}</h3>
                <p className="text-gray-600 mb-6">Enter your 5-character game code</p>
                <div className="space-y-4">
                  <Input
                    placeholder={t('homepage.enterCode')}
                    value={gameCode}
                    onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                    maxLength={5}
                    className="text-center text-2xl tracking-widest font-bold border-2 focus:border-wine-500"
                  />
                  <Link href={gameCode.length === 5 ? `/game/${gameCode}` : '#'}>
                    <Button
                      className="w-full py-4 text-lg"
                      disabled={gameCode.length !== 5}
                    >
                      {t('common.join')} →
                    </Button>
                  </Link>
                </div>
              </Card>

              <Card className="text-center p-8 hover:shadow-2xl transition-shadow duration-300 border-2 border-gold-100 bg-gradient-to-br from-gold-50 to-yellow-50">
                <div className="bg-gradient-to-br from-gold-500 to-yellow-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Wine className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">{t('homepage.createGame')}</h3>
                <p className="text-gray-600 mb-6">
                  {t('homepage.setupDescription')}
                </p>
                <Link href="/auth/login">
                  <Button className="w-full py-4 text-lg bg-gold-500 hover:bg-gold-600">
                    {t('homepage.loginRegister')} →
                  </Button>
                </Link>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('homepage.howItWorks')}</h2>
            <p className="text-xl text-gray-600">Get started in 3 simple steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="bg-gradient-to-br from-wine-500 to-red-600 rounded-3xl w-24 h-24 flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <Wine className="h-12 w-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 bg-wine-900 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">
                  1
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3">{t('homepage.directorSetsUp')}</h3>
              <p className="text-gray-600 text-lg">
                {t('homepage.directorDescription')}
              </p>
            </div>

            <div className="text-center group">
              <div className="relative mb-6">
                <div className="bg-gradient-to-br from-gold-500 to-yellow-600 rounded-3xl w-24 h-24 flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-12 w-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 bg-gold-700 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">
                  2
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3">{t('homepage.playersJoin')}</h3>
              <p className="text-gray-600 text-lg">
                {t('homepage.playersDescription')}
              </p>
            </div>

            <div className="text-center group">
              <div className="relative mb-6">
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl w-24 h-24 flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <Trophy className="h-12 w-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 bg-purple-900 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">
                  3
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3">{t('homepage.guessWin')}</h3>
              <p className="text-gray-600 text-lg">
                {t('homepage.guessDescription')}
              </p>
            </div>
          </div>
        </section>

        {/* Tasting Phases */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">The Tasting Experience</h2>
            <p className="text-xl text-gray-600">Master three professional phases</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-8 text-center hover:shadow-2xl transition-all duration-300 border-t-4 border-yellow-500">
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Eye className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-yellow-700">Visual</h3>
              <p className="text-gray-600">
                Examine color, clarity, and appearance. Each hue tells a story.
              </p>
            </Card>

            <Card className="p-8 text-center hover:shadow-2xl transition-all duration-300 border-t-4 border-purple-500">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Wind className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-purple-700">Aroma</h3>
              <p className="text-gray-600">
                Identify fruity, floral, or earthy notes in the bouquet.
              </p>
            </Card>

            <Card className="p-8 text-center hover:shadow-2xl transition-all duration-300 border-t-4 border-red-500">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-red-700">Taste</h3>
              <p className="text-gray-600">
                Evaluate sweetness, acidity, tannins, and body on your palate.
              </p>
            </Card>
          </div>
        </section>

        {/* Difficulty Levels */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('homepage.difficultyLevels')}</h2>
            <p className="text-xl text-gray-600">Pick your challenge level</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-8 text-center hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
              <div className="text-5xl mb-4">🍷</div>
              <h3 className="text-2xl font-bold text-green-700 mb-3">{t('homepage.novice')}</h3>
              <p className="text-gray-700 mb-4 text-lg">{t('homepage.noviceDescription')}</p>
              <div className="bg-green-100 rounded-lg p-4">
                <p className="text-sm font-semibold text-green-800">{t('homepage.characteristicsPerCategory', { count: 3 })}</p>
              </div>
            </Card>

            <Card className="p-8 text-center hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-300 transform md:scale-105">
              <div className="text-5xl mb-4">🍾</div>
              <h3 className="text-2xl font-bold text-yellow-700 mb-3">{t('homepage.intermediate')}</h3>
              <p className="text-gray-700 mb-4 text-lg">{t('homepage.intermediateDescription')}</p>
              <div className="bg-yellow-100 rounded-lg p-4">
                <p className="text-sm font-semibold text-yellow-800">{t('homepage.characteristicsPerCategory', { count: 5 })}</p>
              </div>
            </Card>

            <Card className="p-8 text-center hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-300">
              <div className="text-5xl mb-4">🏆</div>
              <h3 className="text-2xl font-bold text-red-700 mb-3">{t('homepage.sommelier')}</h3>
              <p className="text-gray-700 mb-4 text-lg">{t('homepage.sommelierDescription')}</p>
              <div className="bg-red-100 rounded-lg p-4">
                <p className="text-sm font-semibold text-red-800">{t('homepage.characteristicsPerCategory', { count: 10 })}</p>
              </div>
            </Card>
          </div>
        </section>

        {/* Mobile Optimized */}
        <section className="text-center">
          <div className="bg-gradient-to-br from-wine-100 via-purple-50 to-gold-100 rounded-3xl p-12 border-2 border-wine-200">
            <div className="bg-gradient-to-br from-wine-600 to-purple-700 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <Smartphone className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('homepage.mobileOptimized')}</h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-6">
              Play anywhere on any device with real-time sync.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm font-semibold">
              <span className="bg-white/60 px-4 py-2 rounded-full">📱 iOS</span>
              <span className="bg-white/60 px-4 py-2 rounded-full">🤖 Android</span>
              <span className="bg-white/60 px-4 py-2 rounded-full">💻 Desktop</span>
              <span className="bg-white/60 px-4 py-2 rounded-full">⚡ Real-time</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-wine-900 via-purple-900 to-wine-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Wine className="h-8 w-8 text-gold-300" />
                <span className="text-xl font-bold">{t('homepage.title')}</span>
              </div>
              <p className="text-wine-200">
                Wine tasting made fun with AI-powered games.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-wine-200">
                <li><Link href="/auth/login" className="hover:text-gold-300 transition-colors">Create Game</Link></li>
                <li><a href="#join-game" className="hover:text-gold-300 transition-colors">Join Game</a></li>
                <li><Link href="/director" className="hover:text-gold-300 transition-colors">Director Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Features</h4>
              <ul className="space-y-2 text-wine-200">
                <li>✨ AI-Powered Hints</li>
                <li>🌍 Multi-language Support</li>
                <li>📊 Real-time Scoring</li>
                <li>🎯 Three Difficulty Levels</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 pt-8 text-center">
            <p className="text-wine-200">{t('homepage.footer')}</p>
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4">
                <Link
                  href="/test"
                  className="text-gold-300 hover:text-gold-200 text-sm underline"
                >
                  🧪 Create Test Room (Dev Only)
                </Link>
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}
