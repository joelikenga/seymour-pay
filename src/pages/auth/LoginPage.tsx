import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { toastRequestFailed } from '../../lib/apiErrors'
import { normalizeAdminProfile } from '../../lib/normalizeAdminProfile'
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
  const { appendLog, refreshAdminUsers } = useAdminData()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (hasAdminToken()) navigate('/admin', { replace: true })
  }, [navigate])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      const data = await AuthApi.adminLogin(email.trim(), password)
      const token = extractAdminLoginToken(data) ?? data.token
      if (!token) {
        toastRequestFailed('Sign-in incomplete', undefined, {
          description:
            'No access token was returned. Try again or contact support.',
        })
        return
      }
      const expiresIn = extractTokenExpirySeconds(data, token)
      setAdminToken(token, expiresIn)
      const profile = data.user ? normalizeAdminProfile(data.user) : null
      if (profile) {
        queryClient.setQueryData(adminProfileQueryKey, profile)
      }
      void queryClient.invalidateQueries({ queryKey: adminProfileQueryKey })
      void refreshAdminUsers()
      const emailTrim = email.trim()
      appendLog({
        action: 'login',
        summary: 'Signed in',
        detail: `Admin signed in (${emailTrim})`,
      })
      toast.success('Signed in', {
        description: 'Welcome back to the operations console.',
      })
      navigate('/admin', { replace: true })
    } catch (e) {
      toastRequestFailed('Could not sign in', e)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Log in"
      subtitle="Access your dashboard with your account details."
      onSubmit={(e) => void onSubmit(e)}
    >
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
