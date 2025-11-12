'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/Button'

interface RateWineModalProps {
  wineName: string
  wineYear: number
  wineId: string
  gameId?: string
  onClose: () => void
  onSubmit: (data: {
    rating: number
    location?: string
    occasion?: string
    comments?: string
  }) => Promise<void>
}

export default function RateWineModal({
  wineName,
  wineYear,
  wineId,
  gameId,
  onClose,
  onSubmit,
}: RateWineModalProps) {
  const { t } = useTranslation()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [location, setLocation] = useState('')
  const [occasion, setOccasion] = useState('')
  const [comments, setComments] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      alert(t('rateWine.pleaseSelectRating'))
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        rating,
        location: location.trim() || undefined,
        occasion: occasion.trim() || undefined,
        comments: comments.trim() || undefined,
      })
      onClose()
    } catch (error) {
      console.error('Failed to submit rating:', error)
      alert(t('rateWine.failedToSave'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStars = () => {
    const stars = []
    for (let i = 1; i <= 10; i++) {
      const filled = i <= (hoverRating || rating)
      stars.push(
        <button
          key={i}
          type="button"
          onClick={() => setRating(i)}
          onMouseEnter={() => setHoverRating(i)}
          onMouseLeave={() => setHoverRating(0)}
          className="focus:outline-none transition-transform hover:scale-110"
        >
          <svg
            className={`w-8 h-8 ${filled ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      )
    }
    return stars
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-purple-900">{t('rateWine.title')}</h2>
              <p className="text-gray-600 mt-1">
                {wineName} ({wineYear})
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Rating */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('rateWine.rating')} <span className="text-red-500">{t('rateWine.required')}</span>
              </label>
              <div className="flex items-center space-x-1">
                {renderStars()}
              </div>
              {rating > 0 && (
                <p className="text-sm text-gray-600 mt-2">{rating} {t('rateWine.outOf')}</p>
              )}
            </div>

            {/* Location */}
            <div className="mb-4">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                {t('rateWine.whereAreYou')} <span className="text-gray-400 text-xs">{t('rateWine.optional')}</span>
              </label>
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t('rateWine.wherePlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Occasion */}
            <div className="mb-4">
              <label htmlFor="occasion" className="block text-sm font-medium text-gray-700 mb-2">
                {t('rateWine.occasion')} <span className="text-gray-400 text-xs">{t('rateWine.optional')}</span>
              </label>
              <input
                type="text"
                id="occasion"
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                placeholder={t('rateWine.occasionPlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Comments */}
            <div className="mb-6">
              <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-2">
                {t('rateWine.comments')} <span className="text-gray-400 text-xs">{t('rateWine.optional')}</span>
              </label>
              <textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder={t('rateWine.commentsPlaceholder')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex space-x-3">
              <Button
                type="button"
                onClick={onClose}
                variant="secondary"
                className="flex-1"
              >
                {t('rateWine.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={rating === 0 || isSubmitting}
                loading={isSubmitting}
                className="flex-1"
              >
                {t('rateWine.saveRating')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
