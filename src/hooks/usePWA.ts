'use client'

import { useEffect, useState } from 'react'

export function usePWA() {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isInstallable, setIsInstallable] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<any>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkIfInstalled = () => {
      return window.matchMedia('(display-mode: standalone)').matches ||
             (window.navigator as any).standalone ||
             document.referrer.includes('android-app://')
    }

    setIsInstalled(checkIfInstalled())

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setIsInstallable(true)
      setInstallPrompt(e)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const install = async () => {
    if (!installPrompt) return false

    installPrompt.prompt()
    const choiceResult = await installPrompt.userChoice

    if (choiceResult.outcome === 'accepted') {
      setInstallPrompt(null)
      setIsInstallable(false)
      return true
    }

    return false
  }

  return {
    isInstalled,
    isInstallable,
    install
  }
}