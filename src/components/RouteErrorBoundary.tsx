import { Component, type ErrorInfo, type ReactNode } from 'react'

const accent = '#f27a2e'

interface Props {
  children: ReactNode
  /** Clears the error UI when this value changes (e.g. `location.pathname`). */
  resetKey: string
}

interface State {
  hasError: boolean
}

/**
 * Catches render errors (including after bad HMR updates) so the tree doesn’t go fully blank.
 */
export default class RouteErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[RouteErrorBoundary]', error.message, info.componentStack)
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false })
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-5 bg-[#f4f4f5] px-6 py-12 text-center">
          <p className="max-w-md text-sm leading-relaxed text-zinc-700">
            Something broke while rendering this screen - common right after a code save during
            development. Try again, go home, or do a full reload.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
              style={{ backgroundColor: accent }}
              onClick={() => this.setState({ hasError: false })}
            >
              Try again
            </button>
            <button
              type="button"
              className="rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
              onClick={() => {
                window.location.assign('/')
              }}
            >
              Go home
            </button>
            <button
              type="button"
              className="text-sm font-semibold text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline"
              onClick={() => window.location.reload()}
            >
              Reload page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
