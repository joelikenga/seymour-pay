/** Public ticket lookup for the client `/pay` flow (no auth). */
export type PayChargeType = 'standard' | 'extra'

export interface PayTicketDetails {
  ticketId: string
  vehicleClass: string
  entryZone: string
  entryTime: string
  durationParked: string
  amountDue: number
  currency: 'NGN'
  chargeType?: PayChargeType
  extraHours?: number
  extraHourRate?: number
}

export type PayMethod = 'card' | 'transfer'
