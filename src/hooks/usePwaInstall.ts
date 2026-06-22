import { useCallback, useEffect, useState } from 'react'
import {
  isIosBrowser,
  isPwaInstalled,
  markPwaInstalled,
  type BeforeInstallPromptEvent,
} from '../lib/pwaInstall'

export function usePwaInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(() => isPwaInstalled())
  const isIos = isIosBrowser()

  useEffect(() => {
    const onBip = (e: Event) => {
      e.preventDefault()
      if (isPwaInstalled()) return
      setDeferred(e as BeforeInstallPromptEvent)
    }

    const onInstalled = () => {
      markPwaInstalled()
      setInstalled(true)
      setDeferred(null)
    }

    window.addEventListener('beforeinstallprompt', onBip)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBip)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const canInstall = !installed && (Boolean(deferred) || isIos)
  const canNativeInstall = Boolean(deferred)

  const install = useCallback(async () => {
    if (!deferred) return false
    try {
      await deferred.prompt()
      const { outcome } = await deferred.userChoice
      if (outcome === 'accepted') {
        markPwaInstalled()
        setInstalled(true)
      }
      setDeferred(null)
      return outcome === 'accepted'
    } catch {
      return false
    }
  }, [deferred])

  return {
    canInstall,
    canNativeInstall,
    install,
    installed,
    isIos,
  }
}
