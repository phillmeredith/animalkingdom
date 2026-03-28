// SchleichDetailSheet — detail bottom sheet for a Schleich figurine
//
// Spec reference: interaction-spec.md section 10, refined-stories.md Story 7 + 8
//
// Structure:
//   Section 1 — Hero image (4:3 aspect, contain, bg --elev, r-lg)
//   Section 2 — Name + category badge (flex row, align-items flex-start)
//              + breed subtitle if present
//              + Retired pill if discontinued
//   Section 3 — Ownership toggle (primary → owned state outline)
//   Section 4 — Description (line-clamp-3, Read more expand)
//   Section 5 — Animal facts (heading + body, only when animalFacts non-empty)
//   Section 6 — Release year (only when releaseYear present)
//
// Ownership toggle:
//   Unowned: variant="primary", Plus icon, "I own this"
//   Owned:   variant="outline" with green text override, Check icon, "In my collection"
//   aria-pressed + aria-label per spec section 10
//   Optimistic: DB call in background; revert + toast on error (from hook)
//
// Portal: BottomSheet already uses createPortal(content, document.body) — confirmed
// in Modal.tsx line 201. No additional portal required here.

import { useState, useEffect } from 'react'
import { Package, Plus, Check } from 'lucide-react'
import { BottomSheet } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import {
  CATEGORY_COLOURS,
  CATEGORY_PILL_LABEL,
  type SchleichAnimal,
} from '@/data/schleich'

interface SchleichDetailSheetProps {
  item: SchleichAnimal | null
  isOpen: boolean
  isOwned: boolean
  onClose: () => void
  onToggleOwned: (id: string) => Promise<void>
}

export function SchleichDetailSheet({
  item,
  isOpen,
  isOwned,
  onClose,
  onToggleOwned,
}: SchleichDetailSheetProps) {
  const { toast } = useToast()
  const [imgError, setImgError] = useState(false)
  const [descExpanded, setDescExpanded] = useState(false)
  const [toggling, setToggling] = useState(false)

  // Reset per-item state when the selected item changes.
  // Without this, imgError and descExpanded persist across card taps.
  useEffect(() => {
    setImgError(false)
    setDescExpanded(false)
  }, [item?.id])

  if (!item) return null

  const categoryColour = CATEGORY_COLOURS[item.category]
  const categoryLabel = CATEGORY_PILL_LABEL[item.category]

  // Retired label: "Retired {year}" or "Retired" — copy rule per Story 5
  const retiredLabel = item.discontinued
    ? item.discontinuedYear
      ? `Retired ${item.discontinuedYear}`
      : 'Retired'
    : null

  // Animal facts section heading: "About the {breed}" or "About this animal"
  const factsHeading = item.breed ? `About the ${item.breed}` : 'About this animal'

  async function handleToggle() {
    if (toggling) return
    setToggling(true)
    try {
      await onToggleOwned(item!.id)
    } catch {
      // toggleOwned rethrows on DB error — FE is responsible for the user-facing
      // toast per dev handoff and CLAUDE.md error handling build defect rules.
      // Silent swallow is prohibited.
      toast({
        type: 'error',
        title: 'Could not update collection',
        description: 'Please try again.',
      })
    } finally {
      setToggling(false)
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      {/* Inner content container — max-w-2xl per spec, inner padding */}
      <div className="max-w-2xl mx-auto w-full px-6 pt-2 pb-10">

        {/* Section 1 — Hero image: 4:3 aspect, contain, bg --elev */}
        <div
          className="w-full rounded-[var(--r-lg)] overflow-hidden mb-4"
          style={{
            aspectRatio: '4/3',
            background: 'var(--elev)',
          }}
        >
          {!imgError && item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package size={48} className="text-[var(--t4)]" />
            </div>
          )}
        </div>

        {/* Section 2 — Name + category badge + breed */}
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <h2
              className="text-[22px] font-semibold text-[var(--t1)]"
              style={{ lineHeight: 1.35 }}
            >
              {item.name}
            </h2>
            {item.breed && (
              <p className="text-[14px] text-[var(--t2)] mt-0.5">{item.breed}</p>
            )}
          </div>
          <span
            className="shrink-0 rounded-[var(--r-pill)] text-[12px] font-semibold leading-none"
            style={{
              background: categoryColour.sub,
              border: `1px solid ${categoryColour.border}`,
              color: categoryColour.text,
              padding: '4px 10px',
            }}
          >
            {categoryLabel}
          </span>
        </div>

        {/* Product details row — article number, release year, availability */}
        <div
          className="mt-3 flex rounded-[var(--r-md)] overflow-hidden"
          style={{ background: 'var(--elev)', border: '1px solid var(--border-s)' }}
        >
          {/* Article number */}
          <div className="flex-1 px-3 py-2.5 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.8px] text-[var(--t3)] mb-0.5">
              Article No.
            </p>
            <p className="text-[13px] font-semibold text-[var(--t1)]">
              {item.articleNumber ? `#${item.articleNumber}` : '–'}
            </p>
          </div>
          {/* Release year */}
          <div
            className="flex-1 px-3 py-2.5 text-center"
            style={{ borderLeft: '1px solid var(--border-s)', borderRight: '1px solid var(--border-s)' }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.8px] text-[var(--t3)] mb-0.5">
              Released
            </p>
            <p className="text-[13px] font-semibold text-[var(--t1)]">
              {item.releaseYear ?? '–'}
            </p>
          </div>
          {/* Availability */}
          <div className="flex-1 px-3 py-2.5 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.8px] text-[var(--t3)] mb-0.5">
              Status
            </p>
            {item.discontinued ? (
              <p className="text-[13px] font-semibold" style={{ color: 'var(--red-t)' }}>
                {item.discontinuedYear ? `Retired ${item.discontinuedYear}` : 'Retired'}
              </p>
            ) : (
              <p className="text-[13px] font-semibold" style={{ color: 'var(--green-t)' }}>
                Available
              </p>
            )}
          </div>
        </div>

        {/* Section 3 — Ownership toggle — ABOVE description per spec */}
        <div className="mt-4">
          {isOwned ? (
            /* Owned state: outline variant, green text, Check icon */
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              style={{ color: 'var(--green-t)' }}
              aria-pressed={true}
              aria-label="Remove from collection"
              disabled={toggling}
              icon={<Check size={20} strokeWidth={2} color="var(--green-t)" />}
              onClick={handleToggle}
            >
              In my collection
            </Button>
          ) : (
            /* Unowned state: primary variant, Plus icon */
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              aria-pressed={false}
              aria-label="Mark as owned"
              disabled={toggling}
              icon={<Plus size={20} strokeWidth={2} color="#fff" />}
              onClick={handleToggle}
            >
              I own this
            </Button>
          )}
        </div>

        {/* Section 4 — Description */}
        {item.description && (
          <div className="mt-5">
            {/* Separator above description section */}
            <div
              className="w-full mb-3"
              style={{ height: '1px', background: 'var(--border-s)' }}
              aria-hidden="true"
            />
            <p
              className={[
                'text-[13px] text-[var(--t2)]',
                'leading-[1.5]',
                !descExpanded ? 'line-clamp-3' : '',
              ].join(' ')}
            >
              {item.description}
            </p>
            {/* Read more / Show less — only when description is long enough to clip */}
            <button
              type="button"
              onClick={() => setDescExpanded(e => !e)}
              className="mt-1 text-[12px] font-medium text-[var(--blue-t)] hover:text-[var(--blue)] transition-colors"
            >
              {descExpanded ? 'Show less' : 'Read more'}
            </button>
          </div>
        )}

        {/* Section 5 — Animal facts — only when animalFacts is non-empty */}
        {item.animalFacts && item.animalFacts.length > 0 && (
          <div className="mt-4">
            <div
              className="w-full mb-3"
              style={{ height: '1px', background: 'var(--border-s)' }}
              aria-hidden="true"
            />
            <p className="text-[14px] font-semibold text-[var(--t1)] mb-2">
              {factsHeading}
            </p>
            <p className="text-[13px] text-[var(--t2)] leading-[1.5]">
              {item.animalFacts}
            </p>
          </div>
        )}


      </div>
    </BottomSheet>
  )
}
