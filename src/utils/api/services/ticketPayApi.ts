import {
  formatParkingDuration,
  formatVehicleClassDisplay,
} from '../../../lib/formatParkingDuration'
import type { PayTicketDetails } from '../../../types/ticketPay'
import {
  getTicketFeePreview,
  type TicketFeePreviewResponse,
} from './publicApi'

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

function isTicketNotFoundMessage(message: string): boolean {
  return /not found|404|unknown ticket|invalid ticket/i.test(message)
}

export function mapFeePreviewToPayTicketDetails(
  preview: TicketFeePreviewResponse,
  options?: { extra?: boolean },
): PayTicketDetails {
  const isExtra = options?.extra === true

  return {
    ticketId: preview.ticket_id,
    vehicleClass: formatVehicleClassDisplay(preview.vehicle_type),
    entryTime: preview.entry_time,
    durationParked: formatParkingDuration(preview.entry_time, preview.preview_at),
    amountDue: preview.amount_due,
    currency: preview.currency || 'NGN',
    chargeType: isExtra ? 'extra' : 'standard',
    alreadyPaid: preview.already_paid,
    previewAt: preview.preview_at,
  }
}

export async function fetchPayTicketById(
  ticketId: string,
  options?: { extra?: boolean; signal?: AbortSignal },
): Promise<PayTicketDetails> {
  const id = ticketId.trim()
  if (!id) {
    throw new Error('Please enter a ticket ID.')
  }

  try {
    const preview = await getTicketFeePreview(id, options?.signal)
    return mapFeePreviewToPayTicketDetails(preview, { extra: options?.extra })
  } catch (error) {
    if (error instanceof Error && isTicketNotFoundMessage(error.message)) {
      throw new PayTicketNotFoundError(id)
    }
    throw error
  }
}
