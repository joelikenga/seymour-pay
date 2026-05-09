import { Link } from 'react-router-dom'
import AuthShell from './AuthShell'

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot password"
      subtitle="Enter your email and we'll send you a reset link."
      onSubmit={(event) => {
        event.preventDefault()
      }}
      footerText="Remembered your password?"
      footerLinkText="Back to login"
      footerLinkTo="/login"
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

      <button
        type="submit"
        className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
      >
        Send reset link
      </button>

      <p className="text-xs text-zinc-500">
        This is a minimal UI flow; hook this form to your API when ready.
      </p>

      <Link to="/login" className="inline-block text-sm text-zinc-700 underline underline-offset-2">
        Back to login
      </Link>
    </AuthShell>
  )
}
