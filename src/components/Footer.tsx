'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Wine } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { VersionModal } from './VersionModal'

const APP_VERSION = '1.0.0'

export function Footer() {
  const { t } = useTranslation()
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false)

  return (
    <>
      <footer className="bg-gradient-to-r from-wine-900 via-purple-900 to-wine-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Wine className="h-8 w-8 text-gold-300" />
                <span className="text-xl font-bold">{t('homepage.title')}</span>
              </div>
              <p className="text-wine-200">
                {t('homepage.footerTagline')}
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">{t('homepage.quickLinks')}</h4>
              <ul className="space-y-2 text-wine-200">
                <li><Link href="/auth/login" className="hover:text-gold-300 transition-colors">{t('homepage.createGameLink')}</Link></li>
                <li><a href="#join-game" className="hover:text-gold-300 transition-colors">{t('homepage.joinGameLink')}</a></li>
                <li><Link href="/director" className="hover:text-gold-300 transition-colors">{t('homepage.directorDashboardLink')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">{t('homepage.features')}</h4>
              <ul className="space-y-2 text-wine-200">
                <li>✨ {t('homepage.featureAIPowered')}</li>
                <li>🌍 {t('homepage.featureMultilanguage')}</li>
                <li>📊 {t('homepage.featureRealtime')}</li>
                <li>🎯 {t('homepage.featureDifficulty')}</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 pt-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-wine-200 text-center sm:text-left">{t('homepage.footer')}</p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsVersionModalOpen(true)}
                  className="text-gold-300 hover:text-gold-200 transition-colors text-sm font-medium underline"
                >
                  v{APP_VERSION}
                </button>
                {process.env.NODE_ENV === 'development' && (
                  <Link
                    href="/test"
                    className="text-gold-300 hover:text-gold-200 text-sm underline"
                  >
                    🧪 {t('homepage.testRoomDev')}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </footer>

      <VersionModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
      />
    </>
  )
}
