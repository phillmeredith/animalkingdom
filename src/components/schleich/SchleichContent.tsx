// SchleichContent — headless content block for the Schleich figurine collection.
//
// Usage:
//   Embed inside ExploreScreen (mode="all") or MyAnimalsScreen (mode="collection").
//   This component owns its own filter/search/sheet state but renders NO PageHeader,
//   tab switcher, or navigation chrome. The host screen is responsible for those.
//
// Props:
//   mode       — 'all'        → full catalogue, showOwnedBadge=true
//                'collection' → owned items only, showOwnedBadge=false
//   scrollRef  — the host screen's scroll container, passed to VirtualGrid so
//                virtualisation is relative to the page scroll, not a nested element
//   onBrowseAll — called when the user taps "Browse All" in the empty collection
//                 state. If omitted the Browse All button is not rendered.
//
// Portal rule: BottomSheet already calls createPortal(content, document.body)
// internally, so SchleichDetailSheet needs no additional portal here.

import {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from 'react'
import { Search, Package } from 'lucide-react'

import { SearchBar } from '@/components/ui/SearchBar'
import { Button } from '@/components/ui/Button'

import { SchleichCategoryPills } from '@/components/schleich/SchleichCategoryPills'
import { SchleichCard } from '@/components/schleich/SchleichCard'
import { SchleichDetailSheet } from '@/components/schleich/SchleichDetailSheet'

import { useSchleichCollection } from '@/hooks/useSchleichCollection'

import {
  SCHLEICH_DEFAULT_CATEGORY,
  type SchleichAnimal,
  type SchleichCategoryFilter,
} from '@/data/schleich'

import { useVirtualizer } from '@tanstack/react-virtual'

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface SchleichContentProps {
  mode: 'all' | 'collection'
  scrollRef: React.RefObject<HTMLDivElement>
  /** Called when the user taps "Browse All" from the empty collection state.
   * If not provided, the Browse All button is omitted. */
  onBrowseAll?: () => void
  /** When provided, the component uses these values instead of its own internal
   * search state. The host screen renders the search bar in its PageHeader. */
  externalQuery?: string
  externalCategory?: SchleichCategoryFilter
  onExternalQueryChange?: (q: string) => void
  onExternalCategoryChange?: (cat: SchleichCategoryFilter) => void
  onExternalClearFilters?: () => void
}

// ─── No-results empty state ───────────────────────────────────────────────────

function NoResults({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center text-center pt-16 pb-24 px-6">
      <Search size={48} className="text-[var(--t4)] mb-4" />
      <p className="text-[17px] font-semibold text-[var(--t1)] mb-2">
        No figurines found
      </p>
      <p className="text-[14px] text-[var(--t2)] mb-5">
        Try a different search or change the filter.
      </p>
      {/* variant="outline" per Story 4 AC — never ghost */}
      <Button variant="outline" size="md" onClick={onClear}>
        Clear filters
      </Button>
    </div>
  )
}

// ─── Empty collection state ───────────────────────────────────────────────────

interface EmptyCollectionProps {
  onBrowseAll?: () => void
}

function EmptyCollection({ onBrowseAll }: EmptyCollectionProps) {
  return (
    <div className="flex flex-col items-center text-center pt-16 pb-24 px-6">
      <Package size={48} className="text-[var(--t4)] mb-4" />
      <p className="text-[22px] font-semibold text-[var(--t1)] mb-2">
        Your collection is empty
      </p>
      <p
        className="text-[15px] text-[var(--t3)]"
        style={{ maxWidth: 280, margin: '0 auto 20px' }}
      >
        Tap a figurine in All to mark it as owned.
      </p>
      {/* Browse All button is only shown when the host provides the callback */}
      {onBrowseAll !== undefined && (
        /* variant="primary" per Story 9 AC — never ghost */
        <Button variant="primary" size="md" onClick={onBrowseAll}>
          Browse All
        </Button>
      )}
    </div>
  )
}

// ─── Virtual grid ─────────────────────────────────────────────────────────────
// Virtualises rows using @tanstack/react-virtual useVirtualizer.
// The scroll element is the outer scrollRef (passed from the host screen) so
// virtualisation is relative to the page scroll, not a nested container.
// This avoids double-scroll and sizing issues with flex-1 layouts.

interface VirtualGridProps {
  items: SchleichAnimal[]
  ownedIds: Set<string>
  showOwnedBadge: boolean
  onCardClick: (item: SchleichAnimal) => void
  scrollRef: React.RefObject<HTMLDivElement>
}

function VirtualGrid({
  items,
  ownedIds,
  showOwnedBadge,
  onCardClick,
  scrollRef,
}: VirtualGridProps) {
  const measureRef = useRef<HTMLDivElement>(null)
  const [gridWidth, setGridWidth] = useState(0)

  // Measure the grid container width for column calculation
  useEffect(() => {
    const el = measureRef.current
    if (!el) return
    const observer = new ResizeObserver(entries => {
      setGridWidth(entries[0]?.contentRect.width ?? 0)
    })
    observer.observe(el)
    setGridWidth(el.offsetWidth)
    return () => observer.disconnect()
  }, [])

  // Column count per breakpoints — matches AnimalVirtualGrid:
  //   ≥1024: 6 cols  |  ≥768: 5 cols  |  <768: 4 cols
  const colCount = useMemo(() => {
    if (gridWidth >= 1024) return 6
    if (gridWidth >= 768) return 5
    return 4
  }, [gridWidth])

  const gap = 8

  // Card width = (containerWidth - gaps between columns) / colCount
  const cardWidth = gridWidth > 0
    ? (gridWidth - gap * (colCount - 1)) / colCount
    : 0

  // Card height = image (1:1 square = cardWidth) + name strip (~28px)
  const cardHeight = cardWidth > 0 ? cardWidth + 28 : 0

  // Row height includes the gap below each row
  const rowHeight = cardHeight + gap

  // Group items into rows of colCount
  const rows = useMemo<SchleichAnimal[][]>(() => {
    if (colCount === 0) return []
    const result: SchleichAnimal[][] = []
    for (let i = 0; i < items.length; i += colCount) {
      result.push(items.slice(i, i + colCount))
    }
    return result
  }, [items, colCount])

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight > 0 ? rowHeight : 200,
    overscan: 3,
  })

  // Placeholder while measuring
  if (cardWidth === 0) {
    return (
      <div
        ref={measureRef}
        className="w-full pt-1"
        style={{ minHeight: 4 }}
        aria-hidden="true"
      />
    )
  }

  return (
    // pt-1: prevents hover lift from clipping against scroll container top
    // (CLAUDE.md card grid self-review rule)
    <div ref={measureRef} className="w-full pt-1">
      {/* Virtualiser height container */}
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map(virtualRow => {
          const row = rows[virtualRow.index]
          if (!row) return null
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
                display: 'grid',
                gridTemplateColumns: `repeat(${colCount}, 1fr)`,
                gap: `${gap}px`,
                paddingBottom: `${gap}px`,
              }}
            >
              {row.map(item => (
                <SchleichCard
                  key={item.id}
                  item={item}
                  isOwned={ownedIds.has(item.id)}
                  showOwnedBadge={showOwnedBadge}
                  onClick={() => onCardClick(item)}
                />
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── SchleichContent ──────────────────────────────────────────────────────────

export function SchleichContent({
  mode,
  scrollRef,
  onBrowseAll,
  externalQuery,
  externalCategory,
  onExternalQueryChange,
  onExternalCategoryChange,
  onExternalClearFilters,
}: SchleichContentProps) {
  const { items, ownedIds, toggleOwned } = useSchleichCollection()

  // ── Filter/search state ───────────────────────────────────────────────────
  // When externalQuery is defined the host screen controls search/filter state
  // and renders its own SearchBar + SchleichCategoryPills in its PageHeader.
  const isExternallyControlled = externalQuery !== undefined

  const [internalCategory, setInternalCategory] = useState<SchleichCategoryFilter>(
    SCHLEICH_DEFAULT_CATEGORY,
  )
  const [internalQuery, setInternalQuery] = useState('')

  const query = isExternallyControlled ? (externalQuery ?? '') : internalQuery
  const activeCategory = isExternallyControlled
    ? (externalCategory ?? SCHLEICH_DEFAULT_CATEGORY)
    : internalCategory

  // Clear filters resets to default (horses) not All — per Story 4 AC
  const internalClearFilters = useCallback(() => {
    setInternalQuery('')
    setInternalCategory(SCHLEICH_DEFAULT_CATEGORY)
  }, [])

  const clearFilters = isExternallyControlled
    ? (onExternalClearFilters ?? (() => {}))
    : internalClearFilters

  // ── Detail sheet state ────────────────────────────────────────────────────
  const [selectedItem, setSelectedItem] = useState<SchleichAnimal | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  function openSheet(item: SchleichAnimal) {
    setSelectedItem(item)
    setSheetOpen(true)
  }

  function closeSheet() {
    setSheetOpen(false)
    // Retain selectedItem — sheet uses it during close animation
  }

  // ── Filter logic ──────────────────────────────────────────────────────────
  // category filter AND search AND (owned filter for collection mode)
  // 'retired' filter maps to discontinued: true across all/active category

  const filteredItems = useMemo<SchleichAnimal[]>(() => {
    let result = items

    // Category or Retired filter
    if (activeCategory === 'retired') {
      result = result.filter(i => i.discontinued)
    } else if (activeCategory !== 'all') {
      result = result.filter(i => i.category === activeCategory)
    }

    // Search — case-insensitive, partial match on name only
    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(i => i.name.toLowerCase().includes(q))
    }

    // collection mode: show only owned items
    if (mode === 'collection') {
      result = result.filter(i => ownedIds.has(i.id))
    }

    return result
  }, [items, activeCategory, query, mode, ownedIds])

  // ── Derived state ─────────────────────────────────────────────────────────
  const totalOwnedCount = ownedIds.size
  const isCollectionEmpty = mode === 'collection' && totalOwnedCount === 0

  // "No results" = filtered list empty but the base for this mode is not empty
  const baseCount = mode === 'collection' ? totalOwnedCount : items.length
  const hasNoResults = !isCollectionEmpty && filteredItems.length === 0 && baseCount > 0

  // Count label text — shown in collection mode above the grid
  const countLabel = filteredItems.length === 1
    ? '1 figurine'
    : `${filteredItems.length} figurines`

  return (
    <div className="px-6 pt-4 pb-24 max-w-3xl mx-auto w-full">
      {/* Search bar + category pills — only rendered when not externally controlled.
          When externalQuery is defined the host screen renders these in PageHeader. */}
      {!isExternallyControlled && (
        <>
          <SearchBar
            value={internalQuery}
            onChange={setInternalQuery}
            placeholder="Search figurines…"
          />
          <SchleichCategoryPills
            active={internalCategory}
            onSelect={setInternalCategory}
          />
        </>
      )}

      {/* Content area */}
      {isCollectionEmpty ? (
        <EmptyCollection onBrowseAll={onBrowseAll} />
      ) : hasNoResults ? (
        <NoResults onClear={clearFilters} />
      ) : (
        <>
          {/* Count label — collection mode only, above grid, reflects filtered count */}
          {mode === 'collection' && (
            <p className="text-[13px] text-[var(--t3)] mb-4">
              {countLabel}
            </p>
          )}
          <VirtualGrid
            items={filteredItems}
            ownedIds={ownedIds}
            showOwnedBadge={mode === 'all'}
            onCardClick={openSheet}
            scrollRef={scrollRef}
          />
        </>
      )}

      {/* Detail sheet — BottomSheet already calls createPortal(content, document.body)
          internally, so this renders correctly above any animated ancestor. */}
      <SchleichDetailSheet
        item={selectedItem}
        isOpen={sheetOpen}
        isOwned={selectedItem !== null && ownedIds.has(selectedItem.id)}
        onClose={closeSheet}
        onToggleOwned={toggleOwned}
      />
    </div>
  )
}
