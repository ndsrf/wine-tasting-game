'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Wine } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { GoogleLogin, CredentialResponse } from '@react-oauth/google'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, handleGoogleSuccess, isAuthenticated, isLoading: authLoading } = useAuth()
  const { t, ready: i18nReady } = useTranslation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  const redirectPath = searchParams.get('redirect') || '/director'

  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirect if already authenticated
  useEffect(() => {
    if (mounted && !authLoading && isAuthenticated) {
      router.push(redirectPath)
    }
  }, [mounted, authLoading, isAuthenticated, router, redirectPath])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await login(email, password)

      if (result.success) {
        router.push(redirectPath)
      } else {
        setError(result.error || t('auth.loginFailed'))
      }
    } catch (err) {
      setError(t('errors.tryAgain'))
    } finally {
      setLoading(false)
    }
  }

  const onGoogleLoginSuccess = async (credentialResponse: CredentialResponse) => {
    console.log('Google login initiated', credentialResponse)
    setLoading(true)
    setError('')
    try {
      const result = await handleGoogleSuccess(credentialResponse)
      console.log('Google login result:', result)
      if (result.success) {
        console.log('Redirecting to:', redirectPath)
        router.push(redirectPath)
      } else {
        console.error('Google login failed:', result.error)
        setError(result.error || t('auth.loginFailed'))
      }
    } catch (err) {
      console.error('Google login exception:', err)
      setError(t('errors.tryAgain'))
    } finally {
      setLoading(false)
    }
  }

  // Show loading state until mounted (prevents hydration mismatch)
  if (!mounted || authLoading || !i18nReady) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Wine className="h-12 w-12 text-wine-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('common.loading')}</h2>
        </div>
      </div>
    )
  }

  // Don't render login form if already authenticated
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Wine className="h-12 w-12 text-wine-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('common.loading')}</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>

        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center mb-6">
            <Wine className="h-8 w-8 text-wine-600 mr-3" />
            <h1 className="text-3xl font-bold text-gradient">{t('homepage.title')}</h1>
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">{t('auth.directorLogin')}</h2>
          <p className="text-gray-600 mt-2">{t('auth.loginDescription')}</p>
          {redirectPath !== '/director' && (
            <p className="text-sm text-wine-600 mt-1">
              You&apos;ll be redirected to your requested page after login
            </p>
          )}
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <Input
              type="email"
              label={t('auth.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <Input
              type="password"
              label={t('auth.password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            <Button type="submit" loading={loading} className="w-full">
              {t('auth.signIn')}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">{t('auth.continueWith')}</span>
              </div>
            </div>

            <div className="mt-4 flex justify-center">
              <GoogleLogin
                onSuccess={onGoogleLoginSuccess}
                onError={() => {
                  setError(t('auth.loginFailed'))
                }}
              />
            </div>
          </div>

          <p className="text-center text-sm text-gray-600 mt-6">
            {t('auth.dontHaveAccount')}{' '}
            <Link href="/auth/register" className="text-wine-600 hover:text-wine-700 font-medium">
              {t('auth.signUp')}
            </Link>
          </p>
        </Card>

        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            {t('auth.backToHome')}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const { t } = useTranslation()

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Wine className="h-12 w-12 text-wine-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('common.loading')}</h2>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}