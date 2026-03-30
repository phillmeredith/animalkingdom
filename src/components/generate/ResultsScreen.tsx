// ResultsScreen — name selection + narrative + adopt CTA
// Shows after GeneratingOverlay; inline replacement of the wizard steps

import { useState } from 'react'
import { ChevronLeft, RefreshCw, Loader2, ArrowLeftRight, Award } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { AnimalImage } from '@/components/ui/AnimalImage'
import { Button } from '@/components/ui/Button'
import { RarityBadge, Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { generateNames } from '@/data/generateOptions'
import { isTradeable } from '@/lib/animalTiers'
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
  names: initialNames,
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
  const [names, setNames] = useState<string[]>(initialNames)
  // Key changes on each refresh to trigger the AnimatePresence fade
  const [nameListKey, setNameListKey] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  async function handleGetMoreNames() {
    if (refreshing) return
    setRefreshing(true)
    // Yield to the microtask queue so React commits the refreshing=true frame
    // before the synchronous generateNames() call runs. Without this yield,
    // React batches the two setState calls into one render and the loading
    // state is never painted.
    await Promise.resolve()
    const fresh = generateNames(
      selections.animalType,
      selections.gender,
      selections.personality,
    )
    setNames(fresh)
    setSelectedName(null)
    setNameListKey(k => k + 1)
    setRefreshing(false)
  }

  const fadeDuration = prefersReducedMotion ? 0 : 0.15

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

      {/* Tier disclosure strip — always shown, between badges and name list.
          Determined solely by isTradeable(selections.category). No hardcoded category strings.
          At 375px wraps to two lines (max ~60px tall). At 1024px renders on one line. */}
      <div className="px-6 mb-4 shrink-0 max-w-3xl mx-auto w-full">
        {isTradeable(selections.category) ? (
          <div
            className="flex items-start gap-2 rounded-[var(--r-md)] bg-[var(--green-sub)]"
            style={{ padding: '10px 14px' }}
          >
            <ArrowLeftRight size={14} className="text-[var(--green-t)] shrink-0 mt-[1px]" aria-hidden="true" />
            <p className="text-[13px] text-t2 leading-snug">
              This animal can be listed for sale or put up for auction.
            </p>
          </div>
        ) : (
          <div
            className="flex items-start gap-2 rounded-[var(--r-md)] bg-[var(--amber-sub)]"
            style={{ padding: '10px 14px' }}
          >
            <Award size={14} className="text-[var(--amber-t)] shrink-0 mt-[1px]" aria-hidden="true" />
            <p className="text-[13px] text-t2 leading-snug">
              This is a reward animal. You earned it — it can't be sold.
            </p>
          </div>
        )}
      </div>

      {/* Name selection */}
      <div className="px-6 shrink-0 max-w-3xl mx-auto w-full">
        <h2 className="text-[22px] font-600 text-t1 mb-3">Choose a name</h2>

        {/* aria-live so screen readers announce the updated list after a refresh */}
        <div aria-live="polite">
          <AnimatePresence mode="sync" initial={false}>
            <motion.div
              key={nameListKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: fadeDuration }}
            >
              <div>
                {names.map((name, i) => (
                  <button
                    key={name}
                    onClick={() => !refreshing && setSelectedName(name)}
                    className={cn(
                      'w-full flex items-center gap-3 text-left transition-colors',
                      refreshing && 'pointer-events-none',
                    )}
                    style={{
                      // Each item is its own card — individual border and radius per spec
                      minHeight: '52px',
                      padding: '14px 16px',
                      marginTop: i === 0 ? 0 : '8px',
                      borderRadius: 'var(--r-md)',
                      border: selectedName === name
                        ? '1px solid var(--blue)'
                        : '1px solid var(--border-s)',
                      background: selectedName === name
                        ? 'var(--blue-sub)'
                        : 'var(--card)',
                    }}
                  >
                    {/* Radio dot: 10px circle per spec. Unselected: border var(--border). Selected: filled var(--blue). */}
                    <span
                      className="shrink-0 transition-colors"
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        border: selectedName === name
                          ? 'none'
                          : '2px solid var(--border)',
                        background: selectedName === name
                          ? 'var(--blue)'
                          : 'transparent',
                        flexShrink: 0,
                      }}
                    />
                    {/* Name text: always var(--t1), 15px/500 per spec */}
                    <span className="text-[15px] font-500 text-[var(--t1)]">
                      {name}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* "Get more names" button — centred, not full-width */}
      {/* mt-4 (16px) from name list, mb-4 (16px) before narrative */}
      <div className="flex justify-center mt-4 mb-4 px-6 shrink-0 max-w-3xl mx-auto w-full">
        <button
          onClick={handleGetMoreNames}
          disabled={refreshing}
          aria-busy={refreshing}
          style={{ border: '1.5px solid var(--border)' }}
          className={cn(
            'inline-flex items-center justify-center gap-1.5',
            // min-h-[44px] meets the 44px minimum touch target; visual size stays compact
            'min-h-[44px] px-4 text-[13px] font-semibold',
            'rounded-pill',
            // Outline variant — border is 1.5px per spec (raw button, not Button component)
            'bg-transparent text-t1',
            'hover:border-t3 hover:bg-white/[.03]',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--blue)] focus-visible:outline-offset-2',
            'active:scale-[.97] transition-all duration-150',
            refreshing && 'opacity-60 pointer-events-none cursor-not-allowed',
          )}
        >
          {refreshing
            ? <Loader2 size={14} strokeWidth={2} className="animate-spin" />
            : <RefreshCw size={14} strokeWidth={2} />
          }
          {refreshing ? 'Getting names\u2026' : 'Get more names'}
        </button>
      </div>

      {/* Narrative */}
      <p className="px-6 text-[13px] text-t2 italic leading-relaxed shrink-0 max-w-3xl mx-auto w-full">
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
