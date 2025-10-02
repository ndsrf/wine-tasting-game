'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { Wine, Users, Trophy, Smartphone } from 'lucide-react'
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
      <header className="py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <Wine className="h-8 w-8 text-wine-600 mr-3" />
              <h1 className="text-4xl font-bold text-gradient">{t('homepage.title')}</h1>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-12">
        <section className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t('homepage.subtitle')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            {t('homepage.description')}
          </p>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-12">
            <Card className="text-center">
              <h3 className="text-xl font-semibold mb-4">{t('homepage.joinGame')}</h3>
              <div className="space-y-4">
                <Input
                  placeholder={t('homepage.enterCode')}
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
                    {t('common.join')}
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="text-center">
              <h3 className="text-xl font-semibold mb-4">{t('homepage.createGame')}</h3>
              <p className="text-gray-600 mb-4">
                {t('homepage.setupDescription')}
              </p>
              <Link href="/auth/login">
                <Button variant="secondary" className="w-full">
                  {t('homepage.loginRegister')}
                </Button>
              </Link>
            </Card>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">{t('homepage.howItWorks')}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-wine-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Wine className="h-8 w-8 text-wine-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. {t('homepage.directorSetsUp')}</h3>
              <p className="text-gray-600">
                {t('homepage.directorDescription')}
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gold-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-gold-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">2. {t('homepage.playersJoin')}</h3>
              <p className="text-gray-600">
                {t('homepage.playersDescription')}
              </p>
            </div>

            <div className="text-center">
              <div className="bg-wine-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-8 w-8 text-wine-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. {t('homepage.guessWin')}</h3>
              <p className="text-gray-600">
                {t('homepage.guessDescription')}
              </p>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">{t('homepage.difficultyLevels')}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="text-center">
              <h3 className="text-xl font-semibold text-green-600 mb-2">{t('homepage.novice')}</h3>
              <p className="text-gray-600 mb-4">{t('homepage.noviceDescription')}</p>
              <p className="text-sm text-gray-500">{t('homepage.characteristicsPerCategory', { count: 3 })}</p>
            </Card>

            <Card className="text-center">
              <h3 className="text-xl font-semibold text-yellow-600 mb-2">{t('homepage.intermediate')}</h3>
              <p className="text-gray-600 mb-4">{t('homepage.intermediateDescription')}</p>
              <p className="text-sm text-gray-500">{t('homepage.characteristicsPerCategory', { count: 5 })}</p>
            </Card>

            <Card className="text-center">
              <h3 className="text-xl font-semibold text-red-600 mb-2">{t('homepage.sommelier')}</h3>
              <p className="text-gray-600 mb-4">{t('homepage.sommelierDescription')}</p>
              <p className="text-sm text-gray-500">{t('homepage.characteristicsPerCategory', { count: 10 })}</p>
            </Card>
          </div>
        </section>

        <section className="text-center">
          <div className="bg-wine-50 rounded-2xl p-8">
            <Smartphone className="h-12 w-12 text-wine-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('homepage.mobileOptimized')}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('homepage.mobileDescription')}
            </p>
          </div>
        </section>
      </main>

      <footer className="bg-wine-900 text-white py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p>{t('homepage.footer')}</p>
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