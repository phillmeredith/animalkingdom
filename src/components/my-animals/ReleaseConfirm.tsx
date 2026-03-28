// ReleaseConfirm — destructive release confirmation bottom sheet

import { useState } from 'react'
import { BottomSheet } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

interface ReleaseConfirmProps {
  petName: string
  open: boolean
  onConfirm: () => Promise<void>
  onCancel: () => void
}

export function ReleaseConfirm({ petName, open, onConfirm, onCancel }: ReleaseConfirmProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleConfirm() {
    setIsSubmitting(true)
    try {
      await onConfirm()
    } catch {
      // Caller shows toast; stay open
      setIsSubmitting(false)
    }
  }

  return (
    <BottomSheet isOpen={open} onClose={onCancel}>
      <div className="px-6 pb-8">
        <h3 className="text-[22px] font-600 text-t1 mb-2">Release {petName}?</h3>
        <p className="text-[15px] text-t3 mb-8 leading-relaxed">
          Are you sure you want to say goodbye to {petName}? This can't be changed.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="w-full h-12 rounded-pill font-600 text-[15px] text-white transition-all active:scale-[.97] disabled:opacity-40"
            style={{ backgroundColor: 'var(--red)' }}
          >
            {isSubmitting ? (
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin inline-block" />
            ) : (
              `Say goodbye`
            )}
          </button>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Keep {petName}
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}
