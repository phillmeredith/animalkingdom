// ListForSaleSheet — two-step price input + confirm flow for listing a pet for sale
//
// Step 1 (price): pet summary, numeric price input, single suggested-price pill for
//   the pet's rarity band, "Review listing" CTA.
// Step 2 (confirm): back button, pet summary, asking price row, amber warning banner,
//   "List [Name]" accent CTA.
//
// Portal: rendered inside BottomSheet which already portals to document.body.
// Glass treatment: BottomSheet provides rgba(13,13,17,.80) + blur(24px).
//
// DS compliance:
//   - No emojis; Lucide icons only
//   - No ghost variant; primary + accent + outline only
//   - All colours via var(--...) tokens
//   - Amber tint pair for suggested price pill active state
//   - Green tint pair for no-fee badge
//   - Amber tint pair for warning banner

import { useState, useEffect, useId } from 'react'
import {
  ChevronLeft,
  Coins,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import { BottomSheet } from '@/components/ui/Modal'
import { RarityBadge, Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { AnimalImage } from '@/components/ui/AnimalImage'
import { SUGGESTED_PRICES } from '@/hooks/usePlayerListings'
import type { SavedName } from '@/lib/db'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ListForSaleSheetProps {
  pet: SavedName | null
  open: boolean
  onClose: () => void
  onConfirm: (petId: number, price: number) => Promise<void>
}

type SheetStep = 'price' | 'confirm'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns true if the string is a valid positive integer string. */
function isValidPrice(value: string): boolean {
  if (!value.trim()) return false
  const n = Number(value)
  return Number.isInteger(n) && n > 0
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ListForSaleSheet({ pet, open, onClose, onConfirm }: ListForSaleSheetProps) {
  const [step, setStep] = useState<SheetStep>('price')
  const [priceInput, setPriceInput] = useState('')
  const [inputError, setInputError] = useState(false)
  const [pillActive, setPillActive] = useState(false)
  const [loading, setLoading] = useState(false)

  const errorId = useId()

  // Reset state every time the sheet opens (or the pet changes)
  useEffect(() => {
    if (open) {
      setStep('price')
      setPriceInput('')
      setInputError(false)
      setPillActive(false)
      setLoading(false)
    }
  }, [open, pet?.id])

  if (!pet) return null

  const suggestedPrice = SUGGESTED_PRICES[pet.rarity]
  const priceNumber = Number(priceInput)
  const reviewEnabled = isValidPrice(priceInput)

  function handlePriceChange(value: string) {
    // Accept only digits (and empty string)
    const digitsOnly = value.replace(/[^\d]/g, '')
    setPriceInput(digitsOnly)
    setInputError(false)
    // Deactivate pill if input no longer matches suggested price
    if (digitsOnly !== String(suggestedPrice)) {
      setPillActive(false)
    } else {
      setPillActive(true)
    }
  }

  function handlePillTap() {
    setPriceInput(String(suggestedPrice))
    setPillActive(true)
    setInputError(false)
  }

  function handlePriceBlur(e: React.FocusEvent<HTMLInputElement>) {
    if (priceInput && !isValidPrice(priceInput)) {
      setInputError(true)
    }
    // Restore non-focus border style
    if (!inputError) {
      e.currentTarget.style.border = '1.5px solid var(--border-s)'
      e.currentTarget.style.boxShadow = 'none'
    } else {
      e.currentTarget.style.border = '1.5px solid var(--red)'
      e.currentTarget.style.boxShadow = '0 0 0 3px var(--red-sub)'
    }
  }

  function handleReviewListing() {
    if (!reviewEnabled) return
    setStep('confirm')
  }

  async function handleConfirmListing() {
    if (!pet?.id || !reviewEnabled || loading) return
    setLoading(true)
    try {
      await onConfirm(pet.id, priceNumber)
      // onConfirm closes both sheets on success via parent
    } catch {
      // Error toast is fired by the hook. Sheet stays open on confirm step.
    } finally {
      setLoading(false)
    }
  }

  return (
    <BottomSheet isOpen={open} onClose={onClose}>
      <div className="px-6 pb-10">
        {/* Drag handle */}
        <div
          style={{
            width: 40,
            height: 4,
            background: 'rgba(255,255,255,.2)',
            borderRadius: 9999,
            margin: '8px auto 0',
          }}
        />

        {step === 'price' ? (
          <>
            {/* Heading */}
            <h2
              style={{ fontSize: 22, fontWeight: 600, color: 'var(--t1)', marginTop: 16, marginBottom: 20 }}
            >
              List for sale
            </h2>

            {/* Pet mini-summary row */}
            <div
              style={{
                background: 'var(--elev)',
                borderRadius: 12,
                padding: 16,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                marginBottom: 20,
              }}
            >
              <AnimalImage
                src={pet.imageUrl}
                alt={pet.name}
                className="w-16 h-16 rounded-xl object-cover shrink-0"
              />
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <span
                  style={{ fontSize: 16, fontWeight: 600, color: 'var(--t1)' }}
                  className="truncate"
                >
                  {pet.name}
                </span>
                <RarityBadge rarity={pet.rarity} />
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'var(--border-s)', marginBottom: 20 }} />

            {/* Price input label */}
            <label
              htmlFor="listing-price-input"
              style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                color: 'var(--t3)',
                marginBottom: 6,
              }}
            >
              ASKING PRICE
            </label>

            {/* Price input */}
            <input
              id="listing-price-input"
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              value={priceInput}
              onChange={e => handlePriceChange(e.target.value)}
              onBlur={handlePriceBlur}
              placeholder="e.g. 200"
              aria-describedby={inputError ? errorId : undefined}
              aria-invalid={inputError}
              style={{
                display: 'block',
                width: '100%',
                height: 44,
                borderRadius: 12,
                background: 'var(--card)',
                border: inputError
                  ? '1.5px solid var(--red)'
                  : '1.5px solid var(--border-s)',
                boxShadow: inputError
                  ? '0 0 0 3px var(--red-sub)'
                  : undefined,
                color: 'var(--t1)',
                fontSize: 15,
                padding: '0 14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => {
                e.currentTarget.style.border = '1.5px solid var(--blue)'
                e.currentTarget.style.boxShadow = '0 0 0 3px var(--blue-sub)'
              }}
            />

            {/* Inline error */}
            {inputError && (
              <p
                id={errorId}
                role="alert"
                style={{ fontSize: 12, fontWeight: 400, color: 'var(--red-t)', marginTop: 6 }}
              >
                Please enter a whole number
              </p>
            )}

            {/* Suggested price pill */}
            <div style={{ marginTop: 8 }}>
              <button
                onClick={handlePillTap}
                style={{
                  height: 36,
                  padding: '0 16px',
                  borderRadius: 100,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: pillActive
                    ? '1px solid var(--amber)'
                    : '1px solid var(--border-s)',
                  background: pillActive ? 'var(--amber-sub)' : 'var(--card)',
                  color: pillActive ? 'var(--amber-t)' : 'var(--t2)',
                  transition: 'all .15s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Coins size={12} strokeWidth={2} />
                {suggestedPrice}
              </button>
            </div>

            {/* Price helper */}
            <p style={{ marginTop: 12, fontSize: 13, fontWeight: 400, color: 'var(--t3)' }}>
              Set a fair price — buyers will make offers near your asking price
            </p>

            {/* No-fee badge */}
            <div
              style={{
                marginTop: 16,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--green-sub)',
                border: '1px solid var(--green)',
                borderRadius: 12,
                padding: '8px 12px',
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--green-t)',
              }}
            >
              <CheckCircle size={14} strokeWidth={2} color="var(--green)" />
              No fees — you keep all coins
            </div>

            {/* CTA area */}
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                disabled={!reviewEnabled}
                onClick={handleReviewListing}
              >
                Review listing
              </Button>
              <Button
                variant="outline"
                size="md"
                className="w-full"
                onClick={onClose}
              >
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Back row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 16 }}>
              <Button
                variant="outline"
                size="sm"
                icon={<ChevronLeft size={16} />}
                onClick={() => setStep('price')}
              >
                Back
              </Button>
              <h2 style={{ fontSize: 22, fontWeight: 600, color: 'var(--t1)', margin: 0 }}>
                List for sale?
              </h2>
            </div>

            {/* Pet summary card */}
            <div
              style={{
                background: 'var(--elev)',
                borderRadius: 12,
                padding: 16,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                marginBottom: 16,
              }}
            >
              <AnimalImage
                src={pet.imageUrl}
                alt={pet.name}
                className="w-16 h-16 rounded-xl object-cover shrink-0"
              />
              <div className="flex flex-col gap-1">
                <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--t1)' }}>{pet.name}</span>
                <div className="flex items-center gap-1.5">
                  <RarityBadge rarity={pet.rarity} />
                  <Badge variant="grey">{pet.category}</Badge>
                </div>
              </div>
            </div>

            {/* Asking price row */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--t2)' }}>Asking price</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Coins size={14} strokeWidth={2} color="var(--amber)" />
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--amber-t)' }}>
                  {priceNumber}
                </span>
              </div>
            </div>

            {/* Warning banner */}
            <div
              style={{
                background: 'var(--amber-sub)',
                border: '1px solid rgba(245,166,35,.2)',
                borderRadius: 12,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                marginBottom: 20,
              }}
            >
              <AlertTriangle
                size={16}
                strokeWidth={2}
                color="var(--amber)"
                style={{ shrink: 0, marginTop: 1 }}
              />
              <p style={{ fontSize: 14, fontWeight: 400, color: 'var(--t1)', margin: 0 }}>
                While listed, {pet.name} cannot be raced or cared for.
              </p>
            </div>

            {/* CTA area */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Button
                variant="accent"
                size="lg"
                className="w-full"
                loading={loading}
                onClick={handleConfirmListing}
              >
                {loading ? 'Listing...' : `List ${pet.name}`}
              </Button>
              <Button
                variant="outline"
                size="md"
                className="w-full"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  )
}
