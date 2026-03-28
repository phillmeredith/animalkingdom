// ResultsScreen — name selection + narrative + adopt CTA
// Shows after GeneratingOverlay; inline replacement of the wizard steps

import { useState } from 'react'
import { ChevronLeft, RefreshCw } from 'lucide-react'
import { AnimalImage } from '@/components/ui/AnimalImage'
import { Button } from '@/components/ui/Button'
import { RarityBadge, Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import type { CompleteSelections } from '@/data/generateOptions'
import type { Rarity } from '@/lib/db'

interface ResultsScreenProps {
  names: string[]
  narrative: string
  imageUrl: string
  rarity: Rarity
  selections: CompleteSelections
  onAdopt: (name: string) => void
  onGenerateAgain: () => void
  onStartOver: () => void
  adopting?: boolean
}

export function ResultsScreen({
  names,
  narrative,
  imageUrl,
  rarity,
  selections,
  onAdopt,
  onGenerateAgain,
  onStartOver,
  adopting = false,
}: ResultsScreenProps) {
  const [selectedName, setSelectedName] = useState<string | null>(null)

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[var(--bg)]">
      {/* Top bar */}
      <div className="flex items-center px-6 pt-4 pb-2 shrink-0 max-w-3xl mx-auto w-full">
        <button
          onClick={onStartOver}
          className="flex items-center gap-1.5 text-[13px] text-t3 hover:text-t1 transition-colors"
        >
          <ChevronLeft size={16} />
          Start over
        </button>
      </div>

      {/* Hero row — thumbnail + rarity/category */}
      <div className="px-6 shrink-0 max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-4 mb-5">
          <AnimalImage
            src={imageUrl}
            alt={`${selections.breed} ${selections.animalType}`}
            className="w-20 h-20 rounded-xl object-cover shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="text-[18px] font-700 text-t1 mb-1.5">
              {selections.breed} {selections.animalType}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <RarityBadge rarity={rarity} />
              <Badge variant="grey">{selections.category}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Name selection */}
      <div className="px-6 shrink-0 max-w-3xl mx-auto w-full">
        <h2 className="text-[22px] font-600 text-t1 mb-3">Choose a name</h2>
        <div className="border border-[var(--border-s)] rounded-lg overflow-hidden">
          {names.map((name, i) => (
            <button
              key={name}
              onClick={() => setSelectedName(name)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors',
                i < names.length - 1 && 'border-b border-[var(--border-s)]',
                selectedName === name
                  ? 'bg-[var(--blue-sub)]'
                  : 'bg-[var(--card)] hover:bg-[var(--elev)]',
              )}
            >
              <span
                className={cn(
                  'w-4 h-4 rounded-full border-2 shrink-0 transition-colors',
                  selectedName === name
                    ? 'border-[var(--blue)] bg-[var(--blue)]'
                    : 'border-t3',
                )}
              />
              <span
                className={cn(
                  'text-[15px] font-500',
                  selectedName === name ? 'text-t1' : 'text-t2',
                )}
              >
                {name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Narrative */}
      <p className="px-6 mt-4 text-[13px] text-t2 italic leading-relaxed shrink-0 max-w-3xl mx-auto w-full">
        {narrative}
      </p>

      {/* CTAs */}
      <div className="px-6 mt-6 pb-24 flex flex-col gap-3 shrink-0 max-w-3xl mx-auto w-full">
        <Button
          variant="accent"
          size="lg"
          className="w-full"
          disabled={!selectedName}
          loading={adopting}
          onClick={() => selectedName && onAdopt(selectedName)}
        >
          {selectedName ? `Adopt ${selectedName}` : 'Choose a name'}
        </Button>
        <Button
          variant="outline"
          size="md"
          className="w-full"
          icon={<RefreshCw size={16} />}
          onClick={onGenerateAgain}
        >
          Generate again
        </Button>
      </div>
    </div>
  )
}
