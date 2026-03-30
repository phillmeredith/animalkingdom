// PawtectCard — permanent Pawtect charity entry card on the Home screen
// Anatomy per spec/features/pawtect-charity/interaction-spec.md section 2
// Card is a non-interactive container — only the "Donate coins" Button is interactive.

import { Heart, Coins } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { usePawtect } from '@/hooks/usePawtect'

interface PawtectCardProps {
  onDonate: () => void
  /** Forwarded to the donate button so DonationSheet can return focus on close */
  triggerRef?: React.RefObject<HTMLButtonElement | null>
}

export function PawtectCard({ onDonate, triggerRef }: PawtectCardProps) {
  const { totalDonated } = usePawtect()

  return (
    <div
      className="mb-4"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border-s)',
        borderRadius: 'var(--r-lg)',
        overflow: 'hidden',
      }}
    >
      {/* Mint gradient band — full width, edge-to-edge (no card padding), h-48 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #45B26B, #3772FF)',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-hidden="true"
      >
        <Heart size={24} color="#ffffff" strokeWidth={2} />
      </div>

      {/* Card body — padded content below the band */}
      <div style={{ padding: '20px' }}>
        {/* PAWTECT label — hairline */}
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
          Pawtect
        </p>

        {/* Heading */}
        <p
          style={{
            fontSize: '17px',
            fontWeight: 600,
            color: 'var(--t1)',
            marginBottom: '8px',
          }}
        >
          Help animals in need
        </p>

        {/* Sub-text */}
        <p
          style={{
            fontSize: '14px',
            fontWeight: 400,
            color: 'var(--t2)',
            marginBottom: '16px',
            lineHeight: 1.5,
          }}
        >
          Donate coins to support wildlife conservation.
        </p>

        {/* Total donated row */}
        {totalDonated > 0 ? (
          <div
            style={{
              background: 'var(--elev)',
              borderRadius: 'var(--r-md)',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
            }}
          >
            <Coins size={16} style={{ color: 'var(--amber-t)', flexShrink: 0 }} strokeWidth={2} />
            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--t2)',
              }}
            >
              {totalDonated} coins donated
            </span>
          </div>
        ) : (
          <p
            style={{
              fontSize: '13px',
              fontWeight: 400,
              color: 'var(--t3)',
              fontStyle: 'italic',
              marginBottom: '16px',
            }}
          >
            Nothing donated yet — you could be first!
          </p>
        )}

        {/* Donate CTA — only interactive element in the card */}
        <Button
          ref={triggerRef}
          variant="accent"
          size="md"
          onClick={onDonate}
          className="w-full"
          aria-label="Donate coins to Pawtect"
        >
          Donate coins
        </Button>
      </div>
    </div>
  )
}
