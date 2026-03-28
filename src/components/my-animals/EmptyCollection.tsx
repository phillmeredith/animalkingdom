// EmptyCollection — empty state for My Animals screen

import { PawPrint } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { AnimalCategory } from '@/data/animals'

interface EmptyCollectionProps {
  hasAnyPets: boolean
  activeCategory: AnimalCategory | 'All'
  onGenerate: () => void
  onClearFilter: () => void
}

export function EmptyCollection({
  hasAnyPets,
  activeCategory,
  onGenerate,
  onClearFilter,
}: EmptyCollectionProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
      <PawPrint size={48} className="text-t4 mb-5" strokeWidth={1.5} />

      {hasAnyPets ? (
        <>
          <h2 className="text-[22px] font-600 text-t1 mb-2">
            No animals in {activeCategory}
          </h2>
          <p className="text-[15px] text-t3 max-w-[280px] mb-5">
            Try a different filter
          </p>
          <Button variant="outline" size="md" onClick={onClearFilter}>
            Clear filter
          </Button>
        </>
      ) : (
        <>
          <h2 className="text-[22px] font-600 text-t1 mb-2">
            No animals yet
          </h2>
          <p className="text-[15px] text-t3 max-w-[280px] mb-5">
            Start by generating your first animal
          </p>
          <Button variant="primary" size="md" onClick={onGenerate}>
            Generate
          </Button>
        </>
      )}
    </div>
  )
}
