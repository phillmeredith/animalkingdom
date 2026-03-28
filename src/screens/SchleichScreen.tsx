// SchleichScreen — Schleich figurine collection tracker
//
// Spec reference: interaction-spec.md, refined-stories.md
// Phase C — FE build
//
// Layout strategy:
//   The screen is a flex column (h-full). The PageHeader is sticky and sits
//   outside the scroll container. The content area is a flex-1 overflow-y-auto
//   div — this is the scroll element passed to useVirtualizer.
//
//   Inside the scroll area:
//     - padding container: px-6 pt-4 pb-24 max-w-3xl mx-auto w-full
//     - AnimatePresence mode="wait" wrapping a keyed content block per tab
//     - VirtualGrid receives the outer scrollRef so rows are virtualised
//       relative to the page scroll, not a nested scroll element
//
// Column counts:  2 @ <768px  |  3 @ 768–1023px  |  4 @ ≥1024px
// Gap:            12px @ 2-col  |  16px @ 3–4-col
//
// AnimatePresence rule (CLAUDE.md):
//   mode="wait" wraps a SINGLE direct child per tab key.
//   Tab switcher is outside AnimatePresence — not an exit target.
//
// Portal rule (CLAUDE.md):
//   BottomSheet uses createPortal(content, document.body) — confirmed Modal.tsx line 201.
//   SchleichDetailSheet passes content directly to BottomSheet; no additional portal needed.

import {
  useState,
  useRef,
  useMemo,
  useCallback,
  useEffect,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Package, Settings } from 'lucide-react'
import { useVirtualizer } from '@tanstack/react-virtual'

import { PageHeader } from '@/components/layout/PageHeader'
import { SearchBar } from '@/components/ui/SearchBar'
import { CoinDisplay } from '@/components/ui/CoinDisplay'
import { Button } from '@/components/ui/Button'

import { SchleichCategoryPills } from '@/components/schleich/SchleichCategoryPills'
import { SchleichCard } from '@/components/schleich/SchleichCard'
import { SchleichDetailSheet } from '@/components/schleich/SchleichDetailSheet'

import { useWallet } from '@/hooks/useWallet'
import { useSchleichCollection } from '@/hooks/useSchleichCollection'
import { useReducedMotion } from '@/hooks/useReducedMotion'

import {
  SCHLEICH_DEFAULT_CATEGORY,
  type SchleichAnimal,
  type SchleichCategoryFilter,
} from '@/data/schleich'

// ─── Tab ──────────────────────────────────────────────────────────────────────

type SchleichTab = 'all' | 'collection'

// ─── Segmented tab switcher ───────────────────────────────────────────────────
// inline-flex, compact, NOT full-width — sits in centre slot of PageHeader
// DS Tabs / Segmented Control pattern (interaction-spec.md section 5)

interface TabSwitcherProps {
  active: SchleichTab
  onChange: (tab: SchleichTab) => void
}

function TabSwitcher({ active, onChange }: TabSwitcherProps) {
  return (
    <div
      className="inline-flex rounded-[var(--r-pill)] p-1 gap-0.5"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border-s)',
      }}
    >
      {(['all', 'collection'] as SchleichTab[]).map(tab => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={[
            'px-4 py-2 rounded-[var(--r-pill)]',
            'text-[13px] font-medium transition-all duration-200',
            'whitespace-nowrap',
            active === tab
              ? 'bg-[var(--elev)] text-[var(--t1)]'
              : 'text-[var(--t3)] hover:text-[var(--t2)]',
          ].join(' ')}
        >
          {tab === 'all' ? 'All' : 'My Collection'}
        </button>
      ))}
    </div>
  )
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

function EmptyCollection({ onBrowseAll }: { onBrowseAll: () => void }) {
  return (
    <div className="flex flex-col items-center text-center pt-16 pb-24 px-6">
      <Package size={48} className="text-[var(--t4)] mb-4" />
      <p className="text-[22px] font-semibold text-[var(--t1)] mb-2">
        Your collection is empty
      </p>
      <p
        className="text-[15px] text-[var(--t3)] mb-5"
        style={{ maxWidth: 280, margin: '0 auto 20px' }}
      >
        Tap a figurine in All to mark it as owned.
      </p>
      {/* variant="primary" per Story 9 AC — never ghost */}
      <Button variant="primary" size="md" onClick={onBrowseAll}>
        Browse All
      </Button>
    </div>
  )
}

// ─── Virtual grid ─────────────────────────────────────────────────────────────
// Virtualises rows using @tanstack/react-virtual useVirtualizer.
// The scroll element is the outer scrollRef (from SchleichScreen) so that
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

  // Column count per breakpoints (based on grid container width):
  //   ≥1024: 4 cols  |  ≥768: 3 cols  |  <768: 2 cols
  const colCount = useMemo(() => {
    if (gridWidth >= 1024) return 4
    if (gridWidth >= 768) return 3
    return 2
  }, [gridWidth])

  // Gap: 12px at 375px (2-col), 16px at 768px+ (3–4-col)
  const gap = colCount === 2 ? 12 : 16

  // Card width = (containerWidth - gaps between columns) / colCount
  const cardWidth = gridWidth > 0
    ? (gridWidth - gap * (colCount - 1)) / colCount
    : 0

  // Card height = image (1:1 square = cardWidth) + name strip
  // Name strip: py-2 (8px top + 8px bottom) + 12px text line ≈ 36px
  const cardHeight = cardWidth > 0 ? cardWidth + 36 : 0

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

// ─── Main screen ──────────────────────────────────────────────────────────────

export function SchleichScreen() {
  const navigate = useNavigate()
  const { coins } = useWallet()
  const { items, ownedIds, toggleOwned } = useSchleichCollection()
  const reducedMotion = useReducedMotion()

  // Scroll container ref — passed to VirtualGrid so virtualiser uses page scroll
  const scrollRef = useRef<HTMLDivElement>(null)

  // ── Shared filter/search state — persists across tab switches ────────────
  const [activeTab, setActiveTab] = useState<SchleichTab>('all')
  const [activeCategory, setActiveCategory] = useState<SchleichCategoryFilter>(
    SCHLEICH_DEFAULT_CATEGORY,
  )
  const [query, setQuery] = useState('')

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
  // Per spec section 9 and Story 3/4/11 AC:
  //   category filter AND search AND (owned filter for collection tab)
  //   'retired' filter maps to discontinued: true across all/active category

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

    // My Collection tab: show only owned items
    if (activeTab === 'collection') {
      result = result.filter(i => ownedIds.has(i.id))
    }

    return result
  }, [items, activeCategory, query, activeTab, ownedIds])

  // Clear filters resets to default (horses) not All — per Story 4 AC
  const clearFilters = useCallback(() => {
    setQuery('')
    setActiveCategory(SCHLEICH_DEFAULT_CATEGORY)
  }, [])

  // Browse All CTA — switches tab but does NOT reset filters (Story 9 AC, Q5)
  function handleBrowseAll() {
    setActiveTab('all')
  }

  // ── Derived state ─────────────────────────────────────────────────────────
  const totalOwnedCount = ownedIds.size
  const isCollectionEmpty = activeTab === 'collection' && totalOwnedCount === 0

  // "No results" = filtered list empty but the base for this tab is not empty
  const baseCount = activeTab === 'collection'
    ? totalOwnedCount
    : items.length
  const hasNoResults = !isCollectionEmpty && filteredItems.length === 0 && baseCount > 0

  // Count label text for My Collection tab
  const countLabel = filteredItems.length === 1
    ? '1 figurine'
    : `${filteredItems.length} figurines`

  // ── Animation ─────────────────────────────────────────────────────────────
  // Tab cross-fade: 150ms linear opacity, content area only
  // Tab switcher is NOT inside AnimatePresence
  const tabVariants = {
    enter:   { opacity: reducedMotion ? 1 : 0 },
    visible: { opacity: 1 },
    exit:    { opacity: reducedMotion ? 1 : 0 },
  }

  return (
    <div className="flex flex-col h-full bg-[var(--bg)]">

      {/* Sticky glass PageHeader */}
      <PageHeader
        title="Collection"
        centre={
          // Tab switcher lives EXCLUSIVELY in the centre slot.
          // It is NOT rendered inside AnimatePresence or inside content areas.
          // Navigation ownership is singular — this is the only instance.
          <TabSwitcher active={activeTab} onChange={setActiveTab} />
        }
        trailing={
          <div className="flex items-center gap-2">
            <CoinDisplay amount={coins} />
            <button
              onClick={() => navigate('/settings')}
              className="w-9 h-9 flex items-center justify-center rounded-full text-t3 hover:text-t1 hover:bg-white/[.06] transition-all"
            >
              <Settings size={18} />
            </button>
          </div>
        }
        below={
          <>
            {/* Row 1: SearchBar (below slot, per slot assignment spec section 13) */}
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder="Search figurines…"
            />
            {/* Row 2: Category + Retired filter pills */}
            <SchleichCategoryPills
              active={activeCategory}
              onSelect={setActiveCategory}
            />
          </>
        }
      />

      {/* Scrollable content — flex-1, single scroll element for virtualiser */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
      >
        {/* AnimatePresence wraps ONLY the content area — single keyed child.
            mode="wait" exits the current tab before mounting the next.
            Tab switcher (above) is NOT inside this block. */}
        <AnimatePresence mode="wait">
          {activeTab === 'all' ? (
            <motion.div
              key="tab-all"
              className="px-6 pt-4 pb-24 max-w-3xl mx-auto w-full"
              initial="enter"
              animate="visible"
              exit="exit"
              variants={tabVariants}
              transition={{ duration: 0.15 }}
            >
              {hasNoResults ? (
                <NoResults onClear={clearFilters} />
              ) : (
                <VirtualGrid
                  items={filteredItems}
                  ownedIds={ownedIds}
                  showOwnedBadge={true}
                  onCardClick={openSheet}
                  scrollRef={scrollRef}
                />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="tab-collection"
              className="px-6 pt-4 pb-24 max-w-3xl mx-auto w-full"
              initial="enter"
              animate="visible"
              exit="exit"
              variants={tabVariants}
              transition={{ duration: 0.15 }}
            >
              {isCollectionEmpty ? (
                <EmptyCollection onBrowseAll={handleBrowseAll} />
              ) : hasNoResults ? (
                <NoResults onClear={clearFilters} />
              ) : (
                <>
                  {/* Count label — My Collection tab only, above grid.
                      Not shown in empty state. Reflects filtered count. */}
                  <p className="text-[13px] text-[var(--t3)] mb-4">
                    {countLabel}
                  </p>
                  <VirtualGrid
                    items={filteredItems}
                    ownedIds={ownedIds}
                    showOwnedBadge={false}
                    onCardClick={openSheet}
                    scrollRef={scrollRef}
                  />
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Detail sheet — rendered outside scroll area and AnimatePresence block.
          BottomSheet is already portalled to document.body (Modal.tsx line 201)
          so it is unaffected by the motion.div ancestor opacity animation. */}
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
