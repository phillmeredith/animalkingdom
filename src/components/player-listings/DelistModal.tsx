// DelistModal — confirms that Harry wants to remove a listing
//
// Spec (interaction-spec.md section 5, DelistModal anatomy):
//   - "Keep listed" (outline) — focus on open (safer default)
//   - "Remove listing" (outline, NOT red) — delisting is not destructive
//   - Portal: provided by Modal component
//   - Glass treatment: provided by Modal component
//
// DS compliance:
//   - No ghost variant
//   - No emojis
//   - Both buttons: variant="outline" per spec (neither is red)

import { useRef, useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

interface DelistModalProps {
  petName: string
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function DelistModal({ petName, open, onClose, onConfirm }: DelistModalProps) {
  const keepRef = useRef<HTMLButtonElement>(null)
  const [loading, setLoading] = useState(false)

  // Move focus to "Keep listed" on open (safer default per spec)
  useEffect(() => {
    if (open) {
      setTimeout(() => keepRef.current?.focus(), 50)
    }
  }, [open])

  async function handleConfirm() {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={open} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Heading */}
        <h2
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: 'var(--t1)',
            marginBottom: 8,
            marginTop: 0,
          }}
        >
          Remove listing?
        </h2>

        {/* Body */}
        <p
          style={{
            fontSize: 14,
            fontWeight: 400,
            color: 'var(--t2)',
            marginTop: 0,
            marginBottom: 20,
          }}
        >
          {petName} will return to your collection and be available again.
        </p>

        {/* Button row */}
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            ref={keepRef}
            variant="outline"
            size="md"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            Keep listed
          </Button>
          <Button
            variant="outline"
            size="md"
            className="flex-1"
            loading={loading}
            onClick={handleConfirm}
          >
            Remove listing
          </Button>
        </div>
      </div>
    </Modal>
  )
}
