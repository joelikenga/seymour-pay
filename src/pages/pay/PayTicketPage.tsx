import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import QRCode from 'react-qr-code'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PayMobileLogo from './PayMobileLogo'
import {
  DEFAULT_TICKET_QR_URL,
  payTicketUrl,
  PAY_TICKET_ID_PARAM,
} from './payFlowShared'

type TicketQrPreviewProps = {
  qrValue: string
  isCustomTicketQr: boolean
  size: number
}

function TicketQrPreview({
  qrValue,
  isCustomTicketQr,
  size,
}: TicketQrPreviewProps) {
  return (
    <div className="w-full rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-[0_12px_40px_-20px_rgba(15,23,42,0.15)] ring-1 ring-zinc-950/5 lg:p-7">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          QR preview
        </p>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
            isCustomTicketQr
              ? 'bg-orange-100 text-orange-800'
              : 'bg-zinc-100 text-zinc-600'
          }`}
        >
          {isCustomTicketQr ? 'Ticket' : 'Default'}
        </span>
      </div>
      <div className="mt-5 flex flex-col items-center">
        <div className="rounded-2xl bg-white p-3 ring-1 ring-zinc-100">
          <QRCode
            value={qrValue}
            size={size}
            style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
            viewBox="0 0 256 256"
          />
        </div>
        <p
          className="mt-3 max-w-full break-all text-center font-mono text-sm font-medium text-zinc-800 lg:text-base"
        >
          {qrValue}
        </p>
        {isCustomTicketQr ? (
          <p className="mt-2 text-center text-xs leading-relaxed text-zinc-500">
            Scan or show this code for your ticket ID.
          </p>
        ) : (
          <p className="mt-2 text-center text-xs leading-relaxed text-zinc-500">
            Type your ticket ID above to update this code.
          </p>
        )}
      </div>
    </div>
  )
}

export default function PayTicketPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [ticketInput, setTicketInput] = useState('')

  const ticketIdParam = searchParams.get(PAY_TICKET_ID_PARAM)?.trim() ?? ''

  useEffect(() => {
    if (ticketIdParam) {
      navigate(payTicketUrl(ticketIdParam), { replace: true })
    }
  }, [ticketIdParam, navigate])

  const trimmedInput = ticketInput.trim()
  const isCustomTicketQr = trimmedInput.length > 0
  const qrValue = trimmedInput || DEFAULT_TICKET_QR_URL
  const desktopQrSize = 240

  const onSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault()
      const id = trimmedInput
      if (!id) return
      navigate(payTicketUrl(id))
    },
    [navigate, trimmedInput],
  )

  if (ticketIdParam) return null

  return (
    <div className="absolute inset-0 overflow-y-auto overscroll-contain bg-zinc-100 lg:bg-linear-to-b lg:from-zinc-50 lg:to-zinc-100/80 lg:px-12 lg:pb-12 lg:pt-10">
      <div className="mx-auto w-full max-w-md px-4 pb-8 lg:grid lg:max-w-5xl lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:items-center lg:gap-14 lg:px-0 lg:pb-0">
        <PayMobileLogo />
        <form className="lg:text-left" onSubmit={onSubmit}>
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-600/90 lg:text-left">
            Manual entry
          </p>
          <h1 className="mt-1 text-center text-xl font-bold tracking-tight text-zinc-950 lg:text-left lg:text-3xl">
            Enter ticket
          </h1>
          <p className="mt-2 text-center text-sm leading-relaxed text-zinc-600 lg:text-left lg:text-base lg:leading-relaxed">
            Type your ticket ID, then continue to view parking details and pay.
          </p>
          <label className="mt-6 block lg:mt-8">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Ticket ID
            </span>
            <input
              value={ticketInput}
              onChange={(e) => setTicketInput(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-zinc-200/90 bg-white px-4 py-3.5 text-base font-medium text-zinc-900 shadow-[0_2px_8px_rgba(0,0,0,0.04)] outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-500/20 lg:py-4 lg:text-lg"
              placeholder="e.g. SEY-10492"
              autoComplete="off"
            />
          </label>

          <button
            type="submit"
            disabled={!trimmedInput}
            className="mt-6 w-full rounded-xl bg-linear-to-b from-orange-500 to-orange-600 px-4 py-3.5 text-sm font-bold text-white shadow-[0_4px_18px_-4px_rgba(234,88,12,0.55)] transition hover:from-orange-400 hover:to-orange-500 active:scale-[0.99] disabled:opacity-45 disabled:active:scale-100 lg:mt-8 lg:max-w-sm lg:py-4"
          >
            Continue
          </button>
        </form>

        <div className="mt-8 hidden flex-col items-center lg:mt-0 lg:flex">
          <TicketQrPreview
            qrValue={qrValue}
            isCustomTicketQr={isCustomTicketQr}
            size={desktopQrSize}
          />
        </div>
      </div>
    </div>
  )
}
