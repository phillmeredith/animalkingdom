// DonationSheet — Pawtect charity donation BottomSheet
// PORTAL REQUIRED: ReactDOM.createPortal to document.body — the Home screen has
// Framer Motion animated parents that would trap fixed children in their stacking context.
// Spec: spec/features/pawtect-charity/interaction-spec.md sections 3–5

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Coins, AlertTriangle, Loader2, Heart, Award } from 'lucide-react'
import { usePawtect } from '@/hooks/usePawtect'
import { useWallet } from '@/hooks/useWallet'
import { useToast } from '@/components/ui/Toast'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useScrollLock } from '@/hooks/useScrollLock'

// ─── Types ──────────────────────────────────────────────────────────────────────

type SheetState = 'idle' | 'loading' | 'success'

const PRESET_AMOUNTS = [5, 10, 25, 50] as const

// ─── CSS keyframe for heart pulse ──────────────────────────────────────────────
// Injected once at module level. CSS animations are safe from stacking context issues.
const HEARTBEAT_STYLE = `
@keyframes pawtect-heartbeat {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.1); }
  100% { transform: scale(1); }
}
`

function injectHeartbeatStyle() {
  if (typeof document === 'undefined') return
  if (document.getElementById('pawtect-heartbeat-style')) return
  const el = document.createElement('style')
  el.id = 'pawtect-heartbeat-style'
  el.textContent = HEARTBEAT_STYLE
  document.head.appendChild(el)
}

// ─── Component ─────────────────────────────────────────────────────────────────

interface DonationSheetProps {
  open: boolean
  onClose: () => void
  /** ref to the trigger button — focus returns here on close */
  triggerRef?: React.RefObject<HTMLButtonElement | null>
}

export function DonationSheet({ open, onClose, triggerRef }: DonationSheetProps) {
  const { totalDonated, donate } = usePawtect()
  const { coins } = useWallet()
  const { toast } = useToast()
  const reducedMotion = useReducedMotion()
  const { lock, unlock } = useScrollLock()

  const [sheetState, setSheetState] = useState<SheetState>('idle')
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [lastDonatedAmount, setLastDonatedAmount] = useState(0)

  const sheetRef = useRef<HTMLDivElement>(null)
  const firstFocusableRef = useRef<HTMLButtonElement>(null)

  // Inject heartbeat keyframe once
  useEffect(() => { injectHeartbeatStyle() }, [])

  // Scroll lock — reference-counted via useScrollLock
  useEffect(() => {
    if (open) {
      lock()
      return unlock
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset to idle state when sheet opens
  useEffect(() => {
    if (open) {
      setSheetState('idle')
      setSelectedPreset(null)
      setCustomAmount('')
    }
  }, [open])

  // Focus the first focusable element when sheet opens
  useEffect(() => {
    if (open && firstFocusableRef.current) {
      firstFocusableRef.current.focus()
    }
  }, [open])

  // Return focus to trigger on close
  const handleClose = useCallback(() => {
    onClose()
    // Defer so React has flushed the close state before refocusing
    requestAnimationFrame(() => {
      triggerRef?.current?.focus()
    })
  }, [onClose, triggerRef])

  // Trap focus inside sheet
  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        handleClose()
        return
      }
      if (e.key !== 'Tab') return
      const focusable = sheetRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable || focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, handleClose])

  // ─── Derived state ────────────────────────────────────────────────────────────

  const currentAmount = selectedPreset !== null
    ? selectedPreset
    : customAmount !== '' ? Number(customAmount) : 0

  const isInsufficientFunds = currentAmount > 0 && currentAmount > coins
  const isAmountValid = currentAmount > 0 && !isInsufficientFunds
  const ctaLabel = currentAmount > 0 ? `Donate ${currentAmount} coins` : 'Donate coins'

  // ─── Handlers ─────────────────────────────────────────────────────────────────

  function handlePresetSelect(amount: number) {
    if (amount > coins) return // disabled, shouldn't be reachable
    setSelectedPreset(amount)
    setCustomAmount(String(amount))
  }

  function handleCustomInput(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    // Clear preset selection when user types
    setSelectedPreset(null)
    setCustomAmount(raw)
  }

  async function handleDonate() {
    if (!isAmountValid || sheetState === 'loading') return
    const amount = currentAmount
    setSheetState('loading')
    try {
      await donate(amount)
      setLastDonatedAmount(amount)
      setSheetState('success')
      toast({
        type: 'success',
        title: `Donated ${amount} coins to Pawtect`,
        duration: 4000,
      })
    } catch {
      // TRANS-3: sheet stays open in idle state, CTA re-enabled
      setSheetState('idle')
      toast({
        type: 'error',
        title: 'Could not donate — please try again.',
        duration: 4000,
      })
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  if (!open) return null

  const content = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-end',
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,.30)',
        }}
        onClick={sheetState !== 'loading' ? handleClose : undefined}
        aria-hidden="true"
      />

      {/* Sheet panel */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Donate to Pawtect"
        style={{
          position: 'relative',
          width: '100%',
          maxHeight: '85vh',
          background: 'rgba(13,13,17,.88)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255,255,255,.06)',
          borderLeft: '1px solid rgba(255,255,255,.06)',
          borderRight: '1px solid rgba(255,255,255,.06)',
          borderRadius: '16px 16px 0 0',
          overflowY: 'auto',
        }}
      >
        {/* Drag handle */}
        <div
          aria-hidden="true"
          style={{
            width: '40px',
            height: '4px',
            background: 'rgba(255,255,255,.2)',
            borderRadius: '9999px',
            margin: '8px auto 0',
          }}
        />

        {sheetState === 'success' ? (
          <SuccessState
            amount={lastDonatedAmount}
            totalDonated={totalDonated}
            onClose={handleClose}
            reducedMotion={reducedMotion}
            closeRef={firstFocusableRef}
          />
        ) : (
          <DefaultState
            coins={coins}
            selectedPreset={selectedPreset}
            customAmount={customAmount}
            isInsufficientFunds={isInsufficientFunds}
            isAmountValid={isAmountValid}
            ctaLabel={ctaLabel}
            isLoading={sheetState === 'loading'}
            onPresetSelect={handlePresetSelect}
            onCustomInput={handleCustomInput}
            onDonate={handleDonate}
            firstFocusRef={firstFocusableRef}
          />
        )}
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

// ─── Default state (amount selection) ─────────────────────────────────────────

interface DefaultStateProps {
  coins: number
  selectedPreset: number | null
  customAmount: string
  isInsufficientFunds: boolean
  isAmountValid: boolean
  ctaLabel: string
  isLoading: boolean
  onPresetSelect: (amount: number) => void
  onCustomInput: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDonate: () => void
  firstFocusRef: React.RefObject<HTMLButtonElement | null>
}

function DefaultState({
  coins,
  selectedPreset,
  customAmount,
  isInsufficientFunds,
  isAmountValid,
  ctaLabel,
  isLoading,
  onPresetSelect,
  onCustomInput,
  onDonate,
  firstFocusRef,
}: DefaultStateProps) {
  const inputHasError = isInsufficientFunds && customAmount !== ''
  const currentAmount = selectedPreset !== null
    ? selectedPreset
    : customAmount !== '' ? Number(customAmount) : 0

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', width: '100%' }}>
      {/* Sheet heading */}
      <div style={{ padding: '16px 24px 0' }}>
        <p
          style={{
            fontSize: '22px',
            fontWeight: 600,
            color: 'var(--t1)',
            marginBottom: '4px',
          }}
        >
          Help Pawtect
        </p>
        <p
          style={{
            fontSize: '14px',
            fontWeight: 400,
            color: 'var(--t2)',
          }}
        >
          Donate coins to support wildlife conservation.
        </p>
      </div>

      {/* Pawtect icon strip */}
      <div style={{ padding: '16px 24px 0' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #45B26B, #3772FF)',
            height: '56px',
            borderRadius: 'var(--r-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
          aria-hidden="true"
        >
          <Heart size={36} color="#ffffff" strokeWidth={2} />
        </div>
      </div>

      {/* Balance */}
      <div style={{ padding: '20px 24px 0' }}>
        <p
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--t3)',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            marginBottom: '6px',
          }}
        >
          Your balance
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Coins size={16} style={{ color: 'var(--amber-t)', flexShrink: 0 }} strokeWidth={2} />
          <span
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--t1)',
            }}
          >
            {coins} coins available
          </span>
        </div>
      </div>

      {/* Donation amount label */}
      <div style={{ padding: '20px 24px 0' }}>
        <p
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--t3)',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            marginBottom: '8px',
          }}
        >
          Donation amount
        </p>

        {/* Preset pills row */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            marginLeft: '-24px',
            marginRight: '-24px',
            paddingLeft: '24px',
            paddingRight: '24px',
            scrollbarWidth: 'none',
          }}
        >
          {PRESET_AMOUNTS.map(amount => {
            const isActive = selectedPreset === amount
            const isDisabled = amount > coins
            return (
              <button
                key={amount}
                ref={amount === PRESET_AMOUNTS[0] ? firstFocusRef : undefined}
                aria-pressed={isActive}
                onClick={() => onPresetSelect(amount)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  height: '36px',
                  padding: '0 16px',
                  borderRadius: '100px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: isDisabled ? 'default' : 'pointer',
                  flexShrink: 0,
                  transition: 'all 150ms',
                  opacity: isDisabled ? 0.4 : 1,
                  pointerEvents: isDisabled ? 'none' : undefined,
                  background: isActive ? 'var(--blue-sub)' : 'var(--card)',
                  border: isActive ? '1px solid var(--blue)' : '1px solid var(--border-s)',
                  color: isActive ? 'var(--blue-t)' : 'var(--t2)',
                }}
              >
                <Coins
                  size={14}
                  strokeWidth={2}
                  style={{ color: isActive ? 'var(--blue-t)' : 'var(--t3)' }}
                />
                {amount}
              </button>
            )
          })}
        </div>

        {/* Custom input */}
        <p
          style={{
            fontSize: '13px',
            fontWeight: 400,
            color: 'var(--t3)',
            marginTop: '12px',
            marginBottom: '6px',
          }}
        >
          Or enter an amount
        </p>
        <input
          type="number"
          inputMode="numeric"
          min="1"
          aria-label="Enter donation amount in coins"
          placeholder="Enter coins"
          value={customAmount}
          onChange={onCustomInput}
          style={{
            width: '100%',
            height: '44px',
            background: 'var(--card)',
            border: inputHasError
              ? '1.5px solid var(--red)'
              : '1.5px solid var(--border-s)',
            borderRadius: 'var(--r-md)',
            padding: '0 14px',
            fontSize: '15px',
            color: 'var(--t1)',
            outline: 'none',
            boxShadow: inputHasError
              ? '0 0 0 3px var(--red-sub)'
              : undefined,
            boxSizing: 'border-box',
          }}
          onFocus={e => {
            if (!inputHasError) {
              e.currentTarget.style.border = '1.5px solid var(--blue)'
              e.currentTarget.style.boxShadow = '0 0 0 3px var(--blue-sub)'
            }
          }}
          onBlur={e => {
            if (!inputHasError) {
              e.currentTarget.style.border = '1.5px solid var(--border-s)'
              e.currentTarget.style.boxShadow = ''
            }
          }}
        />

        {/* Insufficient funds warning */}
        {isInsufficientFunds && currentAmount > 0 && (
          <div
            role="alert"
            style={{
              background: 'var(--red-sub)',
              borderRadius: 'var(--r-md)',
              padding: '10px',
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertTriangle
              size={14}
              strokeWidth={2}
              style={{ color: 'var(--red-t)', flexShrink: 0 }}
            />
            <span
              style={{
                fontSize: '13px',
                fontWeight: 400,
                color: 'var(--red-t)',
              }}
            >
              Not enough coins
            </span>
          </div>
        )}
      </div>

      {/* CTA */}
      <div style={{ padding: '20px 24px 24px' }}>
        <button
          onClick={onDonate}
          disabled={!isAmountValid || isLoading}
          aria-busy={isLoading}
          style={{
            width: '100%',
            height: '44px',
            background: 'var(--pink)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '100px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: !isAmountValid || isLoading ? 'default' : 'pointer',
            opacity: !isAmountValid || isLoading ? 0.4 : 1,
            pointerEvents: !isAmountValid || isLoading ? 'none' : undefined,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 150ms',
          }}
        >
          {isLoading ? (
            <Loader2
              size={16}
              strokeWidth={2}
              style={{
                animation: 'spin 1s linear infinite',
              }}
            />
          ) : ctaLabel}
        </button>
      </div>
    </div>
  )
}

// ─── Success state ─────────────────────────────────────────────────────────────

interface SuccessStateProps {
  amount: number
  totalDonated: number
  onClose: () => void
  reducedMotion: boolean
  closeRef: React.RefObject<HTMLButtonElement | null>
}

function SuccessState({ amount, totalDonated, onClose, reducedMotion, closeRef }: SuccessStateProps) {
  const [closeFocused, setCloseFocused] = useState(false)

  return (
    <div
      style={{
        padding: '24px 24px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        opacity: 1,
        animation: reducedMotion ? undefined : 'fadeIn 200ms ease-out',
        maxWidth: '480px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* Injected fade-in keyframe */}
      {!reducedMotion && (
        <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
      )}

      {/* Heart with mint gradient circle behind */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        {/* Gradient circle */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #45B26B, #3772FF)',
            opacity: 0.15,
          }}
        />
        {/* Animated heart */}
        <div
          aria-hidden="true"
          style={{
            position: 'relative',
            animation: reducedMotion
              ? undefined
              : 'pawtect-heartbeat 600ms ease-in-out 3',
          }}
        >
          <Heart
            size={56}
            strokeWidth={2}
            style={{ color: 'var(--pink-t)' }}
          />
        </div>
      </div>

      {/* Thank you heading */}
      <p
        style={{
          fontSize: '22px',
          fontWeight: 600,
          color: 'var(--t1)',
          marginBottom: '8px',
        }}
      >
        Thank you, Harry!
      </p>

      {/* Body copy — uses actual donated amount */}
      <p
        style={{
          fontSize: '15px',
          fontWeight: 400,
          color: 'var(--t2)',
          padding: '0 24px',
          lineHeight: 1.6,
          marginBottom: '20px',
        }}
      >
        You donated {amount} coins to Pawtect. Every coin helps wildlife.
      </p>

      {/* Certificate strip */}
      <div
        role="status"
        style={{
          width: '100%',
          background: 'var(--green-sub)',
          border: '1px solid var(--green)',
          borderRadius: 'var(--r-lg)',
          padding: '16px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          marginBottom: '20px',
          textAlign: 'left',
        }}
      >
        <Award
          size={16}
          strokeWidth={2}
          style={{ color: 'var(--green-t)', flexShrink: 0, marginTop: '1px' }}
        />
        <div>
          <p
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--green-t)',
              marginBottom: '2px',
            }}
          >
            Pawtect Supporter
          </p>
          <p
            style={{
              fontSize: '11px',
              fontWeight: 400,
              color: 'var(--t3)',
            }}
          >
            Total donated: {totalDonated} coins
          </p>
        </div>
      </div>

      {/* Close button — outline with green override */}
      <button
        ref={closeRef}
        onClick={onClose}
        onFocus={() => setCloseFocused(true)}
        onBlur={() => setCloseFocused(false)}
        style={{
          width: '100%',
          height: '44px',
          background: 'transparent',
          border: '1.5px solid var(--green)',
          color: 'var(--green-t)',
          borderRadius: '100px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 150ms',
          outline: closeFocused ? '2px solid var(--blue)' : 'none',
          outlineOffset: closeFocused ? '2px' : undefined,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'var(--green-sub)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent'
        }}
      >
        Close
      </button>
    </div>
  )
}
