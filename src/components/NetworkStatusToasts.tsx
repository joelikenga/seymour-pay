import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

const NETWORK_TOAST_ID = 'network-connection-status'

/**
 * Global browser online/offline toasts (same id replaces so we don’t stack duplicates).
 */
export function NetworkStatusToasts() {
  const wasOfflineRef = useRef(typeof navigator !== 'undefined' && !navigator.onLine)

  useEffect(() => {
    const showOffline = () => {
      wasOfflineRef.current = true
      toast.error('No connection', {
        id: NETWORK_TOAST_ID,
        description:
          'You appear to be offline. Data may not load or save until your network returns.',
      })
    }

    const showOnline = () => {
      if (wasOfflineRef.current) {
        wasOfflineRef.current = false
        toast.success('Connection restored', {
          id: NETWORK_TOAST_ID,
          description: "You're back online.",
        })
      } else {
        toast.dismiss(NETWORK_TOAST_ID)
      }
    }

    if (!navigator.onLine) {
      showOffline()
    }

    window.addEventListener('offline', showOffline)
    window.addEventListener('online', showOnline)

    return () => {
      window.removeEventListener('offline', showOffline)
      window.removeEventListener('online', showOnline)
    }
  }, [])

  return null
}
