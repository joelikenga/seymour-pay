import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthShell from './AuthShell'
import { AuthApi } from '../../utils'
import {
  extractAdminLoginToken,
  extractTokenExpirySeconds,
} from '../../utils/adminAuth'
import { hasAdminToken, setAdminToken } from '../../utils/cookies'
import { adminProfileQueryKey } from '../../query/adminProfile'
import { queryClient } from '../../query/queryClient'
import { useAdminData } from '../../context/AdminDataContext'

export default function LoginPage() {
  const { appendLog } = useAdminData()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (hasAdminToken()) navigate('/admin', { replace: true })
  }, [navigate])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const data = await AuthApi.adminLogin(email.trim(), password)
      const token = extractAdminLoginToken(data)
      if (!token) {
        setError('Sign-in succeeded but no access token was returned.')
        return
      }
      const expiresIn = extractTokenExpirySeconds(data)
      setAdminToken(token, expiresIn)
      void queryClient.invalidateQueries({ queryKey: adminProfileQueryKey })
      const emailTrim = email.trim()
      appendLog({
        action: 'login',
        summary: 'Signed in',
        detail: `Admin signed in (${emailTrim})`,
      })
      navigate('/admin', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sign in.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Log in"
      subtitle="Access your dashboard with your account details."
      onSubmit={(e) => void onSubmit(e)}
      footerText="Need help with your password?"
      footerLinkText="Reset it"
      footerLinkTo="/forgot-password"
    >
      {error ? (
        <p
          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"
          role="alert"
        >
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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-zinc-300 placeholder:text-zinc-400 focus:ring-2"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-zinc-700">Password</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-zinc-300 placeholder:text-zinc-400 focus:ring-2"
        />
      </label>

      <div className="flex items-center justify-between pt-1">
        <Link to="/forgot-password" className="text-sm text-zinc-700 underline underline-offset-2">
          Forgot password?
        </Link>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-60"
      >
        {submitting ? 'Signing in…' : 'Log in'}
      </button>
    </AuthShell>
  )
}
