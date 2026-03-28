// RenameInput — inline rename flow within PetDetailSheet

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'

interface RenameInputProps {
  currentName: string
  onConfirm: (name: string) => Promise<void>
  onCancel: () => void
}

export function RenameInput({ currentName, onConfirm, onCancel }: RenameInputProps) {
  const [value, setValue] = useState(currentName)
  const [hasError, setHasError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    setValue(currentName)
    setHasError(false)
  }, [currentName])

  useEffect(() => {
    // Auto-focus and select all
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  async function handleConfirm() {
    if (!value.trim()) {
      setHasError(true)
      return
    }
    setIsSubmitting(true)
    try {
      await onConfirm(value.trim())
    } catch {
      setValue(currentName)
      toast({ type: 'error', title: 'Rename failed. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleConfirm()
    if (e.key === 'Escape') onCancel()
  }

  return (
    <div className="mb-4">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => { setValue(e.target.value); setHasError(false) }}
        onKeyDown={handleKeyDown}
        className={cn(
          'w-full h-11 px-4 rounded-md bg-[var(--card)] text-t1 text-[22px] font-600',
          'border transition-all outline-none',
          hasError
            ? 'border-[var(--red)] shadow-[0_0_0_3px_var(--red-sub)]'
            : 'border-[var(--blue)] shadow-[0_0_0_3px_var(--blue-sub)]',
        )}
        disabled={isSubmitting}
      />
      {hasError && (
        <p className="text-[12px] text-[var(--red-t)] mt-1">Name can't be empty</p>
      )}
      <div className="flex gap-2 mt-3">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={isSubmitting} className="flex-1">
          Cancel
        </Button>
        <Button variant="primary" size="sm" loading={isSubmitting} onClick={handleConfirm} className="flex-1">
          Save
        </Button>
      </div>
    </div>
  )
}
