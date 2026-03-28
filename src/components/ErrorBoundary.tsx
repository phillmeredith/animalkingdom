// ErrorBoundary — catches any unhandled React render error and shows a recovery screen.
// Wraps the entire app root in main.tsx so no error produces a blank screen.

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message: string | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message ?? null }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Log to console for debugging — intentional, not a silent swallow.
    console.error('[ErrorBoundary] Unhandled render error:', error, info.componentStack)
  }

  override render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div
        className="fixed inset-0 flex items-center justify-center px-6"
        style={{ background: 'var(--bg)' }}
      >
        <div
          className="w-full max-w-sm flex flex-col items-center gap-6 p-8 rounded-3xl"
          style={{
            background: 'rgba(13,13,17,.80)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,.06)',
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--red-sub)' }}
          >
            <RefreshCw size={28} style={{ color: 'var(--red-t)' }} />
          </div>

          <div className="text-center flex flex-col gap-2">
            <p className="text-[18px] font-700" style={{ color: 'var(--t1)' }}>
              Something went wrong
            </p>
            <p className="text-[14px] leading-snug" style={{ color: 'var(--t3)' }}>
              Tap the button below to reload the app. Your progress is saved.
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full h-12 rounded-pill text-[15px] font-700 text-white flex items-center justify-center gap-2 transition-opacity active:opacity-70"
            style={{ background: 'var(--blue)' }}
          >
            <RefreshCw size={16} />
            Reload app
          </button>
        </div>
      </div>
    )
  }
}
