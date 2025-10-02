'use client'

import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import i18n from '@/lib/i18n'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [currentLang, setCurrentLang] = useState('en')

  useEffect(() => {
    // Update lang attribute when language changes
    const updateLang = () => {
      const lang = i18n.language || 'en'
      setCurrentLang(lang)
      document.documentElement.lang = lang

      // Update meta tags for SEO
      const metaDescription = document.querySelector('meta[name="description"]')
      const ogLocale = document.querySelector('meta[property="og:locale"]')
      const manifestLink = document.querySelector('link[rel="manifest"]')

      const descriptions: Record<string, string> = {
        en: 'A fun multiplayer wine tasting game where players guess wine characteristics. Perfect for wine enthusiasts and beginners alike.',
        es: 'Un divertido juego multijugador de cata de vinos donde los jugadores adivinan las características del vino. Perfecto para entusiastas del vino y principiantes.',
        fr: 'Un jeu amusant de dégustation de vin multijoueur où les joueurs devinent les caractéristiques du vin. Parfait pour les passionnés de vin et les débutants.',
      }

      if (metaDescription) {
        metaDescription.setAttribute('content', descriptions[lang] || descriptions.en)
      }

      if (ogLocale) {
        const locales: Record<string, string> = {
          en: 'en_US',
          es: 'es_ES',
          fr: 'fr_FR',
        }
        ogLocale.setAttribute('content', locales[lang] || 'en_US')
      }

      // Update manifest for PWA
      if (manifestLink) {
        const manifestFiles: Record<string, string> = {
          en: '/manifest.json',
          es: '/manifest-es.json',
          fr: '/manifest-fr.json',
        }
        manifestLink.setAttribute('href', manifestFiles[lang] || '/manifest.json')
      }
    }

    updateLang()
    i18n.on('languageChanged', updateLang)

    return () => {
      i18n.off('languageChanged', updateLang)
    }
  }, [])

  return (
    <html lang={currentLang}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#be185d" />

        {/* Basic SEO */}
        <title>Wine Tasting Game - Multiplayer Wine Guessing Experience</title>
        <meta name="description" content="A fun multiplayer wine tasting game where players guess wine characteristics. Perfect for wine enthusiasts and beginners alike." />
        <meta name="keywords" content="wine, tasting, game, multiplayer, characteristics, sommelier, novice, intermediate, cata de vinos, dégustation de vin" />
        <meta name="author" content="Wine Tasting Game" />

        {/* Hreflang tags for multilanguage SEO */}
        <link rel="alternate" hrefLang="en" href="https://wine-tasting-game.com/" />
        <link rel="alternate" hrefLang="es" href="https://wine-tasting-game.com/?lang=es" />
        <link rel="alternate" hrefLang="fr" href="https://wine-tasting-game.com/?lang=fr" />
        <link rel="alternate" hrefLang="x-default" href="https://wine-tasting-game.com/" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://wine-tasting-game.com/" />
        <meta property="og:title" content="Wine Tasting Game - Multiplayer Wine Guessing Experience" />
        <meta property="og:description" content="A fun multiplayer wine tasting game where players guess wine characteristics." />
        <meta property="og:image" content="https://wine-tasting-game.com/og-image.jpg" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:locale:alternate" content="es_ES" />
        <meta property="og:locale:alternate" content="fr_FR" />
        <meta property="og:site_name" content="Wine Tasting Game" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://wine-tasting-game.com/" />
        <meta name="twitter:title" content="Wine Tasting Game - Multiplayer Wine Guessing Experience" />
        <meta name="twitter:description" content="A fun multiplayer wine tasting game where players guess wine characteristics." />
        <meta name="twitter:image" content="https://wine-tasting-game.com/og-image.jpg" />

        {/* Icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* Robots */}
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}