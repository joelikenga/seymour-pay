/** Public ticket lookup for the client `/pay` flow (no auth). */
export interface PayTicketDetails {
  ticketId: string
  vehicleClass: string
  entryZone: string
  entryTime: string
  durationParked: string
  amountDue: number
  currency: 'NGN'
}

export type PayMethod = 'card' | 'transfer'
