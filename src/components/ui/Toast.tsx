// Toast notification system — NFT Dark DS banner anatomy
// 4 types: success, warning, error, info + undo variant
// Max 3 visible, stacked from top, newest on top

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'warning' | 'error' | 'info'

export interface ToastOptions {
  type: ToastType
  title: string
  description?: string
  /** If set, shows an undo button that calls this fn */
  onUndo?: () => void
  /** Override auto-dismiss duration (ms). error = never, others default */
  duration?: number
}

interface ToastItem extends ToastOptions {
  id: string
}

interface ToastContextValue {
  toast: (options: ToastOptions) => string
  dismiss: (id: string) => void
}

// ─── Context ───────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}

// ─── Provider ──────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const toast = useCallback(
    (options: ToastOptions): string => {
      const id = crypto.randomUUID()
      const item: ToastItem = { ...options, id }

      setToasts(prev => {
        // Max 3 visible — drop oldest if needed
        const next = [item, ...prev]
        return next.slice(0, 3)
      })

      // Auto-dismiss
      const defaultDurations: Record<ToastType, number | null> = {
        success: 3000,
        info: 3000,
        warning: 5000,
        error: null, // persistent
      }
      const duration = options.duration ?? (options.onUndo ? 5000 : defaultDurations[options.type])

      if (duration !== null) {
        const timer = setTimeout(() => dismiss(id), duration)
        timers.current.set(id, timer)
      }

      return id
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

// ─── Container ─────────────────────────────────────────────────────────────────

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}) {
  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      <AnimatePresence initial={false}>
        {toasts.map(t => (
          <ToastCard key={t.id} toast={t} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  )
}

// ─── Individual toast ──────────────────────────────────────────────────────────

const CONFIG = {
  success: {
    bg: 'bg-[var(--green-sub)]',
    border: 'border-[rgba(69,178,107,.2)]',
    iconBg: 'bg-[var(--green-sub)]',
    iconColor: 'text-[var(--green)]',
    titleColor: 'text-[var(--green-t)]',
    Icon: CheckCircle,
  },
  warning: {
    bg: 'bg-[var(--amber-sub)]',
    border: 'border-[rgba(245,166,35,.2)]',
    iconBg: 'bg-[var(--amber-sub)]',
    iconColor: 'text-[var(--amber)]',
    titleColor: 'text-[var(--amber-t)]',
    Icon: AlertTriangle,
  },
  error: {
    bg: 'bg-[var(--red-sub)]',
    border: 'border-[rgba(239,70,111,.2)]',
    iconBg: 'bg-[var(--red-sub)]',
    iconColor: 'text-[var(--red)]',
    titleColor: 'text-[var(--red-t)]',
    Icon: XCircle,
  },
  info: {
    bg: 'bg-[var(--blue-sub)]',
    border: 'border-[rgba(55,114,255,.2)]',
    iconBg: 'bg-[var(--blue-sub)]',
    iconColor: 'text-[var(--blue)]',
    titleColor: 'text-[var(--blue-t)]',
    Icon: Info,
  },
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem
  onDismiss: (id: string) => void
}) {
  const reducedMotion = useReducedMotion()
  const cfg = CONFIG[toast.type]
  const undoClickCount = useRef(0)

  const handleUndo = () => {
    // Double-tap guard
    undoClickCount.current++
    if (undoClickCount.current < 2) {
      setTimeout(() => { undoClickCount.current = 0 }, 400)
      return
    }
    toast.onUndo?.()
    onDismiss(toast.id)
  }

  return (
    <motion.div
      layout
      initial={reducedMotion ? {} : { opacity: 0, y: -12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reducedMotion ? {} : { opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={`
        pointer-events-auto flex items-start gap-3 px-4 py-3.5
        rounded-[14px] border ${cfg.bg} ${cfg.border}
        shadow-elevated w-full backdrop-blur-xl
      `}
      role="alert"
    >
      {/* Icon circle */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full ${cfg.iconBg} ${cfg.iconColor} flex items-center justify-center`}>
        <cfg.Icon size={16} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold leading-snug ${cfg.titleColor}`}>
          {toast.title}
        </p>
        {toast.description && (
          <p className="text-xs text-t2 mt-0.5 leading-snug">{toast.description}</p>
        )}
        {toast.onUndo && (
          <button
            onClick={handleUndo}
            className="mt-1.5 text-xs font-semibold text-[var(--blue-t)] bg-[var(--blue-sub)] px-3 py-1 rounded-pill transition-opacity hover:opacity-80"
          >
            Undo
          </button>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--elev)] flex items-center justify-center text-t3 hover:text-t1 transition-colors"
        aria-label="Dismiss"
      >
        <X size={12} />
      </button>
    </motion.div>
  )
}
