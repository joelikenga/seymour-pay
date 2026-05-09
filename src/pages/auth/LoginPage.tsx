import { Link, useNavigate } from 'react-router-dom'
import AuthShell from './AuthShell'

export default function LoginPage() {
  const navigate = useNavigate()

  return (
    <AuthShell
      title="Log in"
      subtitle="Access your dashboard with your account details."
      onSubmit={(event) => {
        event.preventDefault()
        navigate('/admin')
      }}
      footerText="Need help with your password?"
      footerLinkText="Reset it"
      footerLinkTo="/forgot-password"
    >
      <label className="block space-y-1">
        <span className="text-sm font-medium text-zinc-700">Email</span>
        <input
          type="email"
          required
          placeholder="name@example.com"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-zinc-300 placeholder:text-zinc-400 focus:ring-2"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-zinc-700">Password</span>
        <input
          type="password"
          required
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
        className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
      >
        Log in
      </button>
    </AuthShell>
  )
}
