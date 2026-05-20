import { payFieldInput, payFieldLabel } from '../../pages/pay/payUi'

export type PayCardDetails = {
  number: string
  expiry: string
  cvv: string
  name: string
}

type PayCardFormProps = {
  value: PayCardDetails
  onChange: (next: PayCardDetails) => void
}

function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 16)
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
}

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

export function isPayCardDetailsComplete(details: PayCardDetails): boolean {
  const digits = details.number.replace(/\D/g, '')
  const expiry = details.expiry.replace(/\D/g, '')
  return (
    digits.length >= 13 &&
    expiry.length === 4 &&
    details.cvv.replace(/\D/g, '').length >= 3 &&
    details.name.trim().length >= 2
  )
}

export default function PayCardForm({ value, onChange }: PayCardFormProps) {
  return (
    <div className="space-y-4">
      <label className="block">
        <span className={payFieldLabel}>Card number</span>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="1234 5678 9012 3456"
          value={value.number}
          onChange={(e) =>
            onChange({ ...value, number: formatCardNumber(e.target.value) })
          }
          className={`${payFieldInput} font-mono tracking-wide`}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className={payFieldLabel}>Expiry</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/YY"
            value={value.expiry}
            onChange={(e) =>
              onChange({ ...value, expiry: formatExpiry(e.target.value) })
            }
            className={`${payFieldInput} font-mono`}
          />
        </label>
        <label className="block">
          <span className={payFieldLabel}>CVV</span>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="123"
            maxLength={4}
            value={value.cvv}
            onChange={(e) =>
              onChange({
                ...value,
                cvv: e.target.value.replace(/\D/g, '').slice(0, 4),
              })
            }
            className={`${payFieldInput} font-mono`}
          />
        </label>
      </div>

      <label className="block">
        <span className={payFieldLabel}>Name on card</span>
        <input
          type="text"
          autoComplete="cc-name"
          placeholder="As shown on card"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          className={payFieldInput}
        />
      </label>

      <p className="text-xs leading-relaxed text-zinc-500">
        Demo only. No card data is sent or stored.
      </p>
    </div>
  )
}
