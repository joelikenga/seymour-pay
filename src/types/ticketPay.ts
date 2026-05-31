/** Public ticket lookup for the client `/pay` flow (no auth). */
export type PayChargeType = 'standard' | 'extra'

export interface PayTicketDetails {
  ticketId: string
  vehicleClass: string
  entryTime: string
  durationParked: string
  amountDue: number
  currency: string
  chargeType?: PayChargeType
  extraHours?: number
  extraHourRate?: number
  alreadyPaid?: number
  previewAt?: string
}

export type PayMethod = 'card' | 'transfer'
