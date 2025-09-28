import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Wine Tasting Game - Multiplayer Wine Guessing Experience',
  description: 'A fun multiplayer wine tasting game where players guess wine characteristics. Perfect for wine enthusiasts and beginners alike.',
  keywords: 'wine, tasting, game, multiplayer, characteristics, sommelier, novice, intermediate',
  authors: [{ name: 'Wine Tasting Game' }],
  creator: 'Wine Tasting Game',
  publisher: 'Wine Tasting Game',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://wine-tasting-game.com'),
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/en',
      'es-ES': '/es',
      'fr-FR': '/fr',
      'de-DE': '/de',
    },
  },
  openGraph: {
    title: 'Wine Tasting Game - Multiplayer Wine Guessing Experience',
    description: 'A fun multiplayer wine tasting game where players guess wine characteristics.',
    url: 'https://wine-tasting-game.com',
    siteName: 'Wine Tasting Game',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Wine Tasting Game',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wine Tasting Game - Multiplayer Wine Guessing Experience',
    description: 'A fun multiplayer wine tasting game where players guess wine characteristics.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#be185d" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}