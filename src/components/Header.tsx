'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from './LanguageSwitcher'

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth()
  const { t } = useTranslation()
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleLogout = async () => {
    await logout()
    setShowUserMenu(false)
    router.push('/')
  }

  return (
    <header className="bg-purple-900 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <span className="text-2xl">🍷</span>
            <div>
              <h1 className="text-xl font-bold">{t('homepage.title')}</h1>
              <p className="text-xs text-purple-200">{t('navigation.tagline')}</p>
            </div>
          </Link>

          {/* Navigation and User Menu */}
          <div className="flex items-center space-x-4">
            {/* Language Switcher */}
            <LanguageSwitcher />

            {isAuthenticated && user ? (
              /* Authenticated User Menu */
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 bg-purple-800 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
                >
                  <span className="text-sm font-medium">{user.username}</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-50">
                    <Link
                      href="/tastings"
                      className="block px-4 py-2 text-gray-800 hover:bg-purple-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <div className="flex items-center space-x-2">
                        <span>📝</span>
                        <span>{t('navigation.myTastingHistory')}</span>
                      </div>
                    </Link>
                    <Link
                      href="/director"
                      className="block px-4 py-2 text-gray-800 hover:bg-purple-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <div className="flex items-center space-x-2">
                        <span>🎮</span>
                        <span>{t('navigation.createGame')}</span>
                      </div>
                    </Link>
                    <hr className="my-2 border-gray-200" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <span>🚪</span>
                        <span>{t('navigation.logout')}</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Login/Register Buttons */
              <div className="flex items-center space-x-2">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-white hover:bg-purple-800 rounded-lg transition-colors"
                >
                  {t('navigation.login')}
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 text-sm font-medium bg-white text-purple-900 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  {t('navigation.register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  )
}
