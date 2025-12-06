'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from 'react-i18next'
import Header from '@/components/Header'
import { Button } from '@/components/ui/Button'

interface Tasting {
  id: string
  rating: number | null
  comments: string | null
  location: string | null
  occasion: string | null
  createdAt: string
  wine: {
    id: string
    name: string
    year: number
    producer: string | null
    region: string | null
  }
  game: {
    code: string
    difficulty: string
  } | null
  gameWine: {
    name: string
    year: number
  } | null
}

export default function TastingsPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const { t } = useTranslation()
  const router = useRouter()

  const [tastings, setTastings] = useState<Tasting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [minRating, setMinRating] = useState<number | ''>('')
  const [maxRating, setMaxRating] = useState<number | ''>('')
  const [sortBy, setSortBy] = useState<'createdAt' | 'rating'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const fetchTastings = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()

      if (searchQuery) params.append('search', searchQuery)
      if (minRating !== '') params.append('minRating', minRating.toString())
      if (maxRating !== '') params.append('maxRating', maxRating.toString())
      params.append('sortBy', sortBy)
      params.append('sortOrder', sortOrder)

      const response = await fetch(`/api/tastings?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch tastings')

      const data = await response.json()
      setTastings(data.tastings)
      setError(null)
    } catch (err) {
      console.error('Error fetching tastings:', err)
      setError('Failed to load tasting history')
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, minRating, maxRating, sortBy, sortOrder])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/tastings')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (isAuthenticated) {
      fetchTastings()
    }
  }, [isAuthenticated, fetchTastings])

  const renderStars = (rating: number) => {
    const stars = []
    for (let i = 1; i <= 10; i++) {
      stars.push(
        <svg
          key={i}
          className={`w-4 h-4 ${i <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      )
    }
    return <div className="flex items-center space-x-0.5">{stars}</div>
  }

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-purple-900 mb-2">{t('tastings.title')}</h1>
          <p className="text-gray-600">{t('tastings.subtitle')}</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('tastings.filters')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                {t('tastings.searchWine')}
              </label>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('tastings.searchPlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Min Rating */}
            <div>
              <label htmlFor="minRating" className="block text-sm font-medium text-gray-700 mb-1">
                {t('tastings.minRating')}
              </label>
              <select
                id="minRating"
                value={minRating}
                onChange={(e) => setMinRating(e.target.value ? parseInt(e.target.value) : '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">{t('tastings.any')}</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((r) => (
                  <option key={r} value={r}>{r} {t('tastings.stars')}</option>
                ))}
              </select>
            </div>

            {/* Max Rating */}
            <div>
              <label htmlFor="maxRating" className="block text-sm font-medium text-gray-700 mb-1">
                {t('tastings.maxRating')}
              </label>
              <select
                id="maxRating"
                value={maxRating}
                onChange={(e) => setMaxRating(e.target.value ? parseInt(e.target.value) : '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">{t('tastings.any')}</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((r) => (
                  <option key={r} value={r}>{r} {t('tastings.stars')}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
                {t('tastings.sortBy')}
              </label>
              <div className="flex space-x-2">
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'createdAt' | 'rating')}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="createdAt">{t('tastings.date')}</option>
                  <option value="rating">{t('tastings.rating')}</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-900 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('tastings.loading')}</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-800">{t('tastings.failed')}</p>
          </div>
        ) : tastings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🍷</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('tastings.noTastings')}</h3>
            <p className="text-gray-600 mb-6">{t('tastings.noTastingsDescription')}</p>
            <Button onClick={() => router.push('/')}>{t('tastings.findGame')}</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {tastings.map((tasting) => (
              <div key={tasting.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-purple-900 mb-1">
                      {tasting.wine.name} ({tasting.wine.year})
                    </h3>
                    {tasting.wine.producer && (
                      <p className="text-sm text-gray-600 mb-1">{t('tastings.producer')}: {tasting.wine.producer}</p>
                    )}
                    {tasting.wine.region && (
                      <p className="text-sm text-gray-600 mb-3">{t('tastings.region')}: {tasting.wine.region}</p>
                    )}

                    <div className="flex items-center space-x-4 mb-3">
                      {tasting.rating !== null ? (
                        <div className="flex items-center space-x-2">
                          {renderStars(tasting.rating)}
                          <span className="text-sm font-semibold text-gray-700">{tasting.rating}/10</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 italic">{t('tastings.notRated')}</span>
                      )}
                      <span className="text-sm text-gray-500">
                        {new Date(tasting.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {tasting.location && (
                      <p className="text-sm text-gray-700 mb-1">
                        <span className="font-medium">📍 {t('tastings.location')}:</span> {tasting.location}
                      </p>
                    )}
                    {tasting.occasion && (
                      <p className="text-sm text-gray-700 mb-1">
                        <span className="font-medium">🎉 {t('tastings.occasion')}:</span> {tasting.occasion}
                      </p>
                    )}
                    {tasting.comments && (
                      <p className="text-sm text-gray-700 mt-2 italic">&ldquo;{tasting.comments}&rdquo;</p>
                    )}
                    {tasting.game && (
                      <p className="text-xs text-purple-600 mt-2">
                        {t('tastings.fromGame')}: {tasting.game.code} ({tasting.game.difficulty})
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Statistics */}
        {tastings.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('tastings.statistics')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-900">{tastings.length}</p>
                <p className="text-sm text-gray-600">{t('tastings.totalTastings')}</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-900">
                  {(() => {
                    const ratedTastings = tastings.filter((t): t is Tasting & { rating: number } => t.rating !== null)
                    if (ratedTastings.length === 0) return '-'
                    return (ratedTastings.reduce((sum, t) => sum + t.rating, 0) / ratedTastings.length).toFixed(1)
                  })()}
                </p>
                <p className="text-sm text-gray-600">{t('tastings.averageRating')}</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-900">
                  {(() => {
                    const ratedTastings = tastings.filter((t): t is Tasting & { rating: number } => t.rating !== null)
                    if (ratedTastings.length === 0) return '-'
                    return Math.max(...ratedTastings.map(t => t.rating))
                  })()}
                </p>
                <p className="text-sm text-gray-600">{t('tastings.highestRating')}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
