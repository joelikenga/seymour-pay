import { useEffect, useState } from 'react'
import { fetchPayTicketById } from '../../utils/api/services/ticketPayApi'
import type { PayTicketDetails } from '../../types/ticketPay'

export function usePayTicketLookup(ticketId: string) {
  const [ticket, setTicket] = useState<PayTicketDetails | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const id = ticketId.trim()
    if (!id) {
      setTicket(null)
      setError(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    void fetchPayTicketById(id)
      .then((details) => {
        if (!cancelled) {
          setTicket(details)
          setError(null)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setTicket(null)
          setError(e)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [ticketId])

  return { ticket, error, loading }
}
