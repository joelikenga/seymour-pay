import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import AuthShell from './AuthShell'
import { PublicApi } from '../../utils'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await PublicApi.PasswordResetApi.forgotPassword(email.trim())
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send reset link.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Forgot password"
      subtitle="Enter your email and we'll send you a reset link."
      onSubmit={(e) => void onSubmit(e)}
      footerText="Remembered your password?"
      footerLinkText="Back to login"
      footerLinkTo="/login"
    >
      {done ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          If an account exists for that email, you will receive reset instructions shortly.
        </p>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">
          {error}
        </p>
      ) : null}

      <label className="block space-y-1">
        <span className="text-sm font-medium text-zinc-700">Email</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          disabled={done}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 disabled:bg-zinc-50"
        />
      </label>

      <button
        type="submit"
        disabled={submitting || done}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-60"
      >
        {done ? 'Request sent' : submitting ? 'Sending…' : 'Send reset link'}
      </button>

      <Link to="/login" className="inline-block text-sm text-zinc-700 underline underline-offset-2">
        Back to login
      </Link>
    </AuthShell>
  )
}
