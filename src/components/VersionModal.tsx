'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from './ui/Button'

interface VersionModalProps {
  isOpen: boolean
  onClose: () => void
}

export function VersionModal({ isOpen, onClose }: VersionModalProps) {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      // Fetch CHANGELOG.md content
      fetch('/CHANGELOG.md')
        .then(res => res.text())
        .then(text => {
          setContent(text)
          setLoading(false)
        })
        .catch(err => {
          console.error('Failed to load changelog:', err)
          setContent('Failed to load changelog information.')
          setLoading(false)
        })
    }
  }, [isOpen])

  // Convert markdown links to HTML anchors
  const renderMarkdownContent = (markdown: string) => {
    // Convert markdown links [text](url) to HTML anchors
    const withLinks = markdown.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-wine-600 hover:text-wine-800 underline">$1</a>'
    )
    return withLinks
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Changelog</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wine-600"></div>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              <pre 
                className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: renderMarkdownContent(content) }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <Button onClick={onClose} className="w-full sm:w-auto">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
