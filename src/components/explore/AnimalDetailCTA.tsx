// AnimalDetailCTA — EAD-8
// CTA block at the bottom of the scroll (mt-8, in document flow — not fixed).
// All animals are free to adopt — no marketplace gate.

import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { AnimalEntry } from '@/data/animals'

// isGated is kept as a no-op export so callers that imported it don't break.
export function isGated(_animal: AnimalEntry): boolean {
  return false
}

interface AnimalDetailCTAProps {
  animal: AnimalEntry
  onGenerate: () => void
  onMarketplace: () => void
  className?: string
}

export function AnimalDetailCTA({
  animal,
  onGenerate,
  className,
}: AnimalDetailCTAProps) {
  return (
    <div className={cn(className)}>
      <Button
        variant="accent"
        size="lg"
        className="w-full"
        onClick={onGenerate}
      >
        Adopt {animal.name}
      </Button>
    </div>
  )
}
