// ExploreScreen — searchable animal directory
// Phase C build per spec/features/explore-directory/
// Phase C update per spec/features/explore-rarity-filter/
// Phase C update per spec/features/explore-animal-detail/ (EAD-3: timer integration)

import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Track the index of the first animal for each letter (for AZ rail scrolling)
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

  function handleLetterPress(letter: string) {
    const container = scrollContainerRef.current
    const el = container?.querySelector<HTMLElement>(`[data-first-letter="${letter}"]`)
    if (!el || !container) return
    const elTop = el.getBoundingClientRect().top
    const containerTop = container.getBoundingClientRect().top
    container.scrollTo({ top: container.scrollTop + elTop - containerTop - 8, behavior: 'smooth' })
  }

  return (
    <div className="flex h-full bg-[var(--bg)]">
      {/* Scrollable content column — scroll anywhere in this area */}
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
          <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 px-6 pt-4 pb-24">
            {filteredAnimals.map((animal, i) => {
              const letter = animal.name[0].toUpperCase()
              const isFirst = letterFirstIndex.get(letter) === i
              return (
                <div
                  key={animal.id}
                  {...(isFirst ? { 'data-first-letter': letter } : {})}
                >
                  <AnimalCard
                    animal={animal}
                    onTap={() => setSelectedAnimal(animal)}
                  />
                </div>
              )
            })}
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
