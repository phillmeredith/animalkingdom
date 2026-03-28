// ExploreScreen — searchable animal directory
// Phase C build per spec/features/explore-directory/
// Phase C update per spec/features/explore-rarity-filter/
// Phase C update per spec/features/explore-animal-detail/ (EAD-3: timer integration)
//
// Virtualisation strategy:
//   The scroll container is the flex-1 overflow-y-auto div (scrollContainerRef).
//   AnimalVirtualGrid groups filteredAnimals into rows of colCount and uses
//   useVirtualizer relative to that scroll element — matching the SchleichScreen
//   VirtualGrid pattern exactly.
//
// Column counts: 4 @ <768px | 5 @ 768–1023px | 6 @ ≥1024px (matching original grid)
//
// AZ rail scroll:
//   handleLetterPress computes the target row index for each letter and scrolls
//   the virtualiser scroll element to the correct offset using virtualizer API.

import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Search, Settings, Volume2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { SearchBar } from '@/components/ui/SearchBar'
import { CategoryPills } from '@/components/explore/CategoryPills'
import { RarityPills } from '@/components/explore/RarityPills'
import { AnimalCard } from '@/components/explore/AnimalCard'
import { AZRail } from '@/components/explore/AZRail'
import { AnimalProfileSheet } from '@/components/explore/AnimalProfileSheet'
import { AnimalDetailModal } from '@/components/explore/AnimalDetailModal'
import { CoinDisplay } from '@/components/ui/CoinDisplay'
import { Button } from '@/components/ui/Button'
import { useWallet } from '@/hooks/useWallet'
import { useExploreFilter } from '@/hooks/useExploreFilter'
import { useSavedNames } from '@/hooks/useSavedNames'
import type { AnimalEntry } from '@/data/animals'

// ─── Virtual grid ─────────────────────────────────────────────────────────────
// Mirrors the SchleichScreen VirtualGrid pattern.
// scrollRef must point to the overflow-y-auto scroll element (page scroll).
// Column counts match the original ExploreScreen grid:
//   4 @ container <768px | 5 @ 768–1023px | 6 @ ≥1024px

interface AnimalVirtualGridProps {
  items: AnimalEntry[]
  letterFirstIndex: Map<string, number>
  onCardTap: (animal: AnimalEntry) => void
  scrollRef: React.RefObject<HTMLDivElement>
  /** Imperative handle so ExploreScreen can scroll to a letter */
  virtualizerRef: React.MutableRefObject<{
    scrollToIndex: (index: number, opts?: { align?: 'start' }) => void
  } | null>
}

function AnimalVirtualGrid({
  items,
  letterFirstIndex,
  onCardTap,
  scrollRef,
  virtualizerRef,
}: AnimalVirtualGridProps) {
  const measureRef = useRef<HTMLDivElement>(null)
  const [gridWidth, setGridWidth] = useState(0)

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

  // Column count matching the original grid breakpoints
  const colCount = useMemo(() => {
    if (gridWidth >= 1024) return 6
    if (gridWidth >= 768) return 5
    return 4
  }, [gridWidth])

  const gap = 8 // gap-2 = 8px

  const cardWidth = gridWidth > 0
    ? (gridWidth - gap * (colCount - 1)) / colCount
    : 0

  // AnimalCard is aspect-square image + name strip (~28px)
  const cardHeight = cardWidth > 0 ? cardWidth + 28 : 0
  const rowHeight = cardHeight + gap

  const rows = useMemo<AnimalEntry[][]>(() => {
    if (colCount === 0) return []
    const result: AnimalEntry[][] = []
    for (let i = 0; i < items.length; i += colCount) {
      result.push(items.slice(i, i + colCount))
    }
    return result
  }, [items, colCount])

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => (rowHeight > 0 ? rowHeight : 220),
    overscan: 4,
  })

  // Expose imperative scroll-to-row so handleLetterPress can drive the virtualiser
  useEffect(() => {
    virtualizerRef.current = {
      scrollToIndex: (rowIndex, opts) =>
        virtualizer.scrollToIndex(rowIndex, opts),
    }
  })

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
    // pt-1: prevents hover lift from clipping at the scroll container top
    <div ref={measureRef} className="w-full pt-1">
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
              {row.map((animal, colIdx) => {
                const globalIndex = virtualRow.index * colCount + colIdx
                const letter = animal.name[0].toUpperCase()
                const isFirst = letterFirstIndex.get(letter) === globalIndex
                return (
                  <div
                    key={animal.id}
                    {...(isFirst ? { 'data-first-letter': letter } : {})}
                  >
                    <AnimalCard
                      animal={animal}
                      onTap={() => onCardTap(animal)}
                    />
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function ExploreScreen() {
  const navigate = useNavigate()
  const { coins } = useWallet()
  const {
    query,
    activeCategory,
    activeRarity,
    hasSoundOnly,
    filteredAnimals,
    setQuery,
    setActiveCategory,
    setActiveRarity,
    setHasSoundOnly,
    clearAllFilters,
  } = useExploreFilter()

  // Adopted pets — used to determine isOwned for AnimalDetailModal (EAD-9).
  // Ownership is matched by breed name since SavedName has no direct animalId FK.
  // If the pet collection is empty or loading, isOwned defaults to false.
  const { pets } = useSavedNames()
  const ownedBreeds = useMemo(() => {
    const s = new Set<string>()
    pets.forEach(p => s.add(p.breed))
    return s
  }, [pets])

  const [selectedAnimal, setSelectedAnimal] = useState<AnimalEntry | null>(null)
  // detailAnimal is set after the 100ms sheet-exit overlap delay (EAD-3).
  const [detailAnimal, setDetailAnimal] = useState<AnimalEntry | null>(null)

  // scrollContainerRef — the overflow-y-auto flex child; passed to AnimalVirtualGrid
  // so the virtualiser drives page scroll (not a nested scroll).
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Imperative handle to the virtualiser inside AnimalVirtualGrid.
  // handleLetterPress uses this to scroll to the correct row without DOM queries.
  const virtualizerRef = useRef<{
    scrollToIndex: (index: number, opts?: { align?: 'start' }) => void
  } | null>(null)

  // Track the index of the first animal for each letter (for AZ rail scrolling).
  // The virtualiser maps animal index → row index by dividing by colCount.
  // Since colCount is only known inside AnimalVirtualGrid we use animal index here
  // and let handleLetterPress derive the row index at call time via the same formula.
  const letterFirstIndex = useMemo(() => {
    const map = new Map<string, number>()
    filteredAnimals.forEach((animal, i) => {
      const letter = animal.name[0].toUpperCase()
      if (!map.has(letter)) map.set(letter, i)
    })
    return map
  }, [filteredAnimals])

  const availableLetters = useMemo(() => {
    const letters = new Set<string>()
    filteredAnimals.forEach(a => letters.add(a.name[0].toUpperCase()))
    return letters
  }, [filteredAnimals])

  // EAD-3: Called by AnimalProfileSheet when "Learn More" is tapped.
  // The sheet clears its own timer before calling this. We capture the animal reference
  // here because selectedAnimal will be cleared by the sheet's onClose() call.
  // After 100ms (the visual overlap window), we mount AnimalDetailModal.
  // The timer is discarded — not paused and resumed.
  function handleViewMore() {
    const animal = selectedAnimal
    if (!animal) return
    // selectedAnimal is cleared by the sheet's own onClose() call.
    // We wait 100ms before mounting the detail modal to allow the sheet exit animation
    // to begin (200ms ease-in) and create the visual overlap the spec requires.
    setTimeout(() => {
      setDetailAnimal(animal)
    }, 100)
  }

  // AZ rail scroll — derive the row index for the letter's first animal and call
  // the virtualiser's scrollToIndex. colCount is computed from the container width
  // inside AnimalVirtualGrid; we use the same breakpoint logic here to stay in sync.
  function handleLetterPress(letter: string) {
    const animalIndex = letterFirstIndex.get(letter)
    if (animalIndex == null) return
    const containerWidth = scrollContainerRef.current?.offsetWidth ?? 0
    const colCount = containerWidth >= 1024 ? 6 : containerWidth >= 768 ? 5 : 4
    const rowIndex = Math.floor(animalIndex / colCount)
    virtualizerRef.current?.scrollToIndex(rowIndex, { align: 'start' })
  }

  return (
    <div className="flex h-full bg-[var(--bg)]">
      {/* Scrollable content column — single overflow-y-auto element passed to virtualiser */}
      <div className="flex-1 overflow-y-auto" ref={scrollContainerRef}>
        <PageHeader
          title="Explore"
          trailing={
            <div className="flex items-center gap-2">
              <CoinDisplay amount={coins} />
              <button
                onClick={() => navigate('/settings')}
                className="w-9 h-9 flex items-center justify-center rounded-full text-t3 hover:text-t1 hover:bg-white/[.06] transition-all"
                aria-label="Settings"
              >
                <Settings size={18} />
              </button>
            </div>
          }
          below={
            <>
              <SearchBar
                value={query}
                onChange={setQuery}
                placeholder="Search animals…"
              />
              {/*
                Filter row: CategoryPills left (flex-1 min-w-0, scrollable within its wrapper)
                + RarityPills right (ml-auto shrink-0, fixed to the right edge, does not scroll).
                The outer row is overflow-x-auto so at 375px the user can scroll horizontally
                to reach the rarity group — matching the My Animals sort-control pattern.
                Per spec: -mx-6 px-6 bleeds to the screen edges.
              */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-6 px-6">
                <div className="flex-1 min-w-0">
                  <CategoryPills active={activeCategory} onSelect={setActiveCategory} />
                </div>
                <RarityPills active={activeRarity} onSelect={setActiveRarity} />
                {/* Has-sound toggle pill */}
                <button
                  onClick={() => setHasSoundOnly(!hasSoundOnly)}
                  aria-pressed={hasSoundOnly}
                  aria-label="Show only animals with sounds"
                  className={[
                    'h-9 px-3 rounded-pill flex items-center gap-1.5 shrink-0 border text-[13px] font-semibold whitespace-nowrap transition-colors duration-150',
                    hasSoundOnly
                      ? 'bg-[var(--blue-sub)] border-[var(--blue)] text-[var(--blue-t)]'
                      : 'bg-[var(--card)] border-[var(--border-s)] text-[var(--t2)]',
                  ].join(' ')}
                >
                  <Volume2 size={14} strokeWidth={2} aria-hidden="true" />
                  Sound
                </button>
              </div>
            </>
          }
        />

        {filteredAnimals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 px-6">
            <Search size={48} className="text-t3" />
            <p className="text-[17px] font-600 text-t1">No animals found</p>
            <p className="text-[14px] text-t2">Try a different search or clear filters</p>
            <Button
              variant="outline"
              size="md"
              onClick={clearAllFilters}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="px-6 pt-4 pb-24">
            <AnimalVirtualGrid
              items={filteredAnimals}
              letterFirstIndex={letterFirstIndex}
              onCardTap={setSelectedAnimal}
              scrollRef={scrollContainerRef}
              virtualizerRef={virtualizerRef}
            />
          </div>
        )}
      </div>

      {/* A-Z Rail — fixed right column, always visible */}
      <AZRail
        availableLetters={availableLetters}
        onLetterPress={handleLetterPress}
      />

      {/* Animal profile sheet — summary view */}
      <AnimalProfileSheet
        animal={selectedAnimal}
        onClose={() => setSelectedAnimal(null)}
        onViewMore={handleViewMore}
      />

      {/* Animal detail modal — full-screen profile (EAD-2, EAD-3).
          AnimalDetailModal manages its own AnimatePresence internally and renders
          via ReactDOM.createPortal into document.body. Passing animal=null is the
          exit trigger — the modal plays its exit animation before unmounting. */}
      <AnimalDetailModal
        animal={detailAnimal}
        isOwned={detailAnimal ? ownedBreeds.has(detailAnimal.breed) : false}
        onClose={() => setDetailAnimal(null)}
      />
    </div>
  )
}
