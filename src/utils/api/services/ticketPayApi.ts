import type { PayTicketDetails } from '../../../types/ticketPay'
import { computePayExtraCharges } from '../../../lib/payExtraCharges'

export class PayTicketNotFoundError extends Error {
  readonly ticketId: string

  constructor(ticketId: string) {
    super(`Ticket "${ticketId}" was not found.`)
    this.name = 'PayTicketNotFoundError'
    this.ticketId = ticketId
  }
}

export function isPayTicketNotFoundError(
  error: unknown,
): error is PayTicketNotFoundError {
  return error instanceof PayTicketNotFoundError
}

/**
 * Replace with `GET /public/tickets/:id` (or equivalent) when the backend is ready.
 * Expects query param `ticketID` on the pay URL.
 */
export async function fetchPayTicketById(
  ticketId: string,
  options?: { extra?: boolean },
): Promise<PayTicketDetails> {
  const id = ticketId.trim()
  if (!id) {
    throw new Error('Please enter a ticket ID.')
  }

  await new Promise((r) => setTimeout(r, 550 + Math.random() * 400))

  // Demo: use ticket ID "NOTFOUND" to preview the not-found modal until the API is wired.
  if (/^NOTFOUND$/i.test(id)) {
    throw new PayTicketNotFoundError(id)
  }

  const entry = new Date(Date.now() - 3 * 60 * 60 * 1000 - 24 * 15 * 60 * 1000)
  const base: PayTicketDetails = {
    ticketId: id.toUpperCase(),
    vehicleClass: 'Small SUV',
    entryZone: 'Terminal A, long-stay',
    entryTime: entry.toISOString(),
    durationParked: '3h 24m',
    amountDue: 8500,
    currency: 'NGN',
    chargeType: 'standard',
  }

  if (options?.extra) {
    const extra = computePayExtraCharges(base.vehicleClass)
    return {
      ...base,
      chargeType: 'extra',
      amountDue: extra.amountDue,
      durationParked: extra.durationLabel,
      extraHours: extra.extraHours,
      extraHourRate: extra.extraHourRate,
    }
  }

  return base
}
