// GameCardPicker — BottomSheet card selector shown before any game session
// Story 2: Card selection picker (shared across all 4 games)
//
// Layout:
//   BottomSheet (glass, portal-rendered by BottomSheet itself)
//   └── Header: game icon + title + close button
//   └── Filter row: category pills (left) + sort control (right) — single row
//   └── Card grid: 2/3/4 columns, each tile shows image, name, rarity, level pill
//   └── Panel B: challenge level selector (first play only, slides in after card select)
//   └── Footer: "Play" button, enabled when card selected
//
// Portal: BottomSheet already createPortal()s to body — do not double-wrap.
// Tint-pair rule: level pill and all badges use tint-pair. No solid fill + white text.
// Ghost rule: no ghost variant anywhere in this component.

import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, PawPrint } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BottomSheet } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { RarityBadge } from '@/components/ui/Badge'
import { AnimalImage } from '@/components/ui/AnimalImage'
import { db } from '@/lib/db'
import type { CollectedCard, SavedName } from '@/lib/db'

// ─── Props ────────────────────────────────────────────────────────────────────

export interface GameCardPickerProps {
  isOpen: boolean
  gameTitle: string
  gameRoute: string   // e.g. '/play/coin-rush' — navigated to on Play tap
  gameKey: 'coinRush' | 'wordSafari' | 'habitatBuilder' | 'worldQuest'
  gameIcon: React.ReactNode
  gameAccent: string      // CSS var token, e.g. 'var(--amber)'
  gameAccentSub: string   // e.g. 'var(--amber-sub)'
  gameAccentText: string  // e.g. 'var(--amber-t)'
  onClose: () => void
}

// ─── Challenge level types ────────────────────────────────────────────────────

type ChallengeLevel = 1 | 2 | 3

interface LevelDef {
  level: ChallengeLevel
  label: string
  caption: string
}

const LEVEL_DEFS: LevelDef[] = [
  { level: 1, label: 'Getting started',  caption: 'Simpler challenges, build power fast' },
  { level: 2, label: 'Going further',    caption: 'Trickier challenges, bigger rewards'  },
  { level: 3, label: 'Expert mode',      caption: 'The hardest challenges, highest rewards' },
]

// ─── Filter types ──────────────────────────────────────────────────────────────

type CategoryFilter = 'All' | 'At Home' | 'Stables' | 'Farm' | 'Wild' | 'Sea'
type SortMode = 'name' | 'recent' | 'rarity'

const CATEGORY_FILTERS: CategoryFilter[] = ['All', 'At Home', 'Stables', 'Farm', 'Wild', 'Sea']

const SORT_OPTIONS: { id: SortMode; label: string }[] = [
  { id: 'name',   label: 'Name A–Z'    },
  { id: 'recent', label: 'Recently added' },
  { id: 'rarity', label: 'Highest rarity' },
]

const RARITY_ORDER: Record<string, number> = {
  legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1,
}

// ─── Pet picker tile ──────────────────────────────────────────────────────────

function PetPickerTile({
  pet,
  isSelected,
  onSelect,
}: {
  pet: SavedName
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <div className="flex flex-col gap-0.5 w-24 shrink-0">
      <div
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
        aria-label={`Select ${pet.name}`}
        className={[
          'rounded-xl border overflow-hidden cursor-pointer transition-all duration-200',
          'motion-safe:hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(0,0,0,.25)]',
          'motion-safe:active:scale-[.97]',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--blue)] focus-visible:outline-offset-2',
        ].join(' ')}
        style={{
          borderColor: isSelected ? 'var(--blue)' : 'var(--border-s)',
          background:  isSelected ? 'var(--blue-sub)' : 'var(--card)',
        }}
        onClick={onSelect}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect() } }}
      >
        {/* Image — square */}
        <div className="relative w-full aspect-square">
          <AnimalImage
            src={pet.imageUrl}
            alt={pet.name}
            className="w-full h-full object-cover"
            fallbackClassName="w-full h-full"
          />
          {isSelected && (
            <div
              className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
              style={{ background: 'var(--blue)' }}
              aria-hidden="true"
            >
              <Check size={10} className="text-white" strokeWidth={3} />
            </div>
          )}
        </div>

        {/* Pet info */}
        <div className="px-1.5 py-1.5 flex flex-col gap-0.5">
          <p className="text-[11px] font-600 text-[var(--t1)] truncate leading-tight">
            {pet.name}
          </p>
          <RarityBadge rarity={pet.rarity} />
        </div>
      </div>
    </div>
  )
}

// ─── Challenge level selector (Panel B) ───────────────────────────────────────

function ChallengeLevelSelector({
  selected,
  onSelect,
}: {
  selected: ChallengeLevel
  onSelect: (level: ChallengeLevel) => void
}) {
  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="flex flex-col gap-3 px-4 pb-2"
    >
      <p className="text-[13px] font-700 uppercase tracking-widest text-[var(--t3)]">
        Challenge level
      </p>
      {LEVEL_DEFS.map(def => {
        const isActive = selected === def.level
        return (
          <div
            key={def.level}
            role="radio"
            aria-checked={isActive}
            tabIndex={0}
            onClick={() => onSelect(def.level)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(def.level) } }}
            className="flex items-start gap-3 p-4 rounded-[var(--r-lg)] border cursor-pointer transition-all duration-150 min-h-[44px]"
            style={{
              borderColor: isActive ? 'var(--blue)' : 'var(--border-s)',
              background:  isActive ? 'var(--blue-sub)' : 'var(--card)',
            }}
          >
            {/* Radio circle */}
            <div
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5"
              style={{
                borderColor: isActive ? 'var(--blue)' : 'var(--border-s)',
                background: isActive ? 'var(--blue)' : 'transparent',
              }}
            >
              {isActive && <Check size={10} className="text-white" strokeWidth={3} />}
            </div>
            {/* Labels */}
            <div>
              <p className="text-[15px] font-600 text-[var(--t1)] leading-tight">{def.label}</p>
              <p className="text-[13px] font-400 text-[var(--t2)] mt-0.5">{def.caption}</p>
            </div>
          </div>
        )
      })}
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

/** Builds a CollectedCard-like object from a SavedName for question generation.
 *  If the player has a real collected card for this breed, it is used directly
 *  (full facts + XP tracking). Otherwise a minimal card is returned — games
 *  still run, but XP is not tracked (card.id is undefined). */
async function resolveCardForPet(pet: SavedName): Promise<CollectedCard> {
  const existing = await db.collectedCards
    .where('[animalType+breed]')
    .equals([pet.animalType, pet.breed])
    .first()
  if (existing) return existing

  // Minimal fallback — default stats, no catalogue facts
  const now = new Date()
  return {
    animalType: pet.animalType,
    breed:      pet.breed,
    name:       pet.name,
    rarity:     pet.rarity,
    imageUrl:   pet.imageUrl,
    duplicateCount:    0,
    firstCollectedAt:  now,
    updatedAt:         now,
    stats: { speed: 50, strength: 50, stamina: 50, agility: 50, intelligence: 50 },
    description: '',
    level:    1,
    xp:       0,
    yearLevel: 1,
    gameHistory: { wordSafari: 0, coinRush: 0, habitatBuilder: 0, worldQuest: 0 },
    habitatBuilderState: null,
  }
}

export function GameCardPicker({
  isOpen,
  gameTitle,
  gameRoute,
  gameKey,
  gameIcon,
  gameAccent,
  gameAccentSub,
  gameAccentText,
  onClose,
}: GameCardPickerProps) {
  const navigate = useNavigate()

  // Load player's pets (their actual collection) — exclude pets listed for sale
  const allPets = useLiveQuery(
    () => db.savedNames.filter(p => p.status !== 'for_sale').toArray(),
    [],
    [] as SavedName[],
  )

  // Local filter/sort state
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('All')
  const [sortMode, setSortMode] = useState<SortMode>('recent')
  const [selectedPet, setSelectedPet] = useState<SavedName | null>(null)

  // Panel B state: show challenge selector on first play of this game
  const [showLevelPanel, setShowLevelPanel] = useState(false)
  const [challengeLevel, setChallengeLevel] = useState<ChallengeLevel>(1)
  const [levelConfirmed, setLevelConfirmed] = useState(false)
  const [showSortMenu, setShowSortMenu] = useState(false)

  const isEmpty = (allPets ?? []).length === 0

  // Determine whether this is a first-play (never navigated to this game)
  const hasPlayedGame = useMemo(() => false, [])

  // Filter + sort derived pet list
  const filteredPets = useMemo(() => {
    let pets = [...(allPets ?? [])]

    if (categoryFilter !== 'All') {
      pets = pets.filter(p => p.category === categoryFilter)
    }

    if (sortMode === 'name') {
      pets.sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortMode === 'rarity') {
      pets.sort((a, b) => (RARITY_ORDER[b.rarity] ?? 0) - (RARITY_ORDER[a.rarity] ?? 0))
    } else {
      // 'recent' — newest first
      pets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    }

    return pets
  }, [allPets, categoryFilter, sortMode])

  function handlePetSelect(pet: SavedName) {
    setSelectedPet(pet)
    if (!hasPlayedGame && !levelConfirmed) {
      setShowLevelPanel(true)
    }
  }

  async function handlePlay() {
    if (!selectedPet) return
    const card = await resolveCardForPet(selectedPet)
    onClose()
    navigate(gameRoute, {
      state: {
        collectedCardId: card.id,
        challengeLevel,
        selectedCard: card,
      },
    })
  }

  void levelConfirmed
  const playButtonEnabled = selectedPet !== null

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="90vh">
      <div className="flex flex-col">

        {/* ── Sheet header ───────────────────────────────────────────────── */}
        <div className="relative flex items-center gap-3 px-4 pb-3 shrink-0">
          {/* Game icon in accent circle */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: gameAccentSub }}
          >
            <span style={{ color: gameAccentText }}>{gameIcon}</span>
          </div>
          {/* Title block */}
          <div>
            <p className="text-[17px] font-700 text-[var(--t1)]">{gameTitle}</p>
            <p className="text-[13px] text-[var(--t2)]">Choose an animal from your collection</p>
          </div>
          {/* Close button — absolute top-right per DS close button spec */}
          <button
            onClick={onClose}
            className="absolute top-0 right-4 w-8 h-8 rounded-full bg-[var(--elev)] flex items-center justify-center text-[var(--t3)] hover:text-[var(--t1)] hover:bg-[var(--border)] transition-colors"
            aria-label="Close card picker"
          >
            <X size={14} />
          </button>
        </div>

        {/* ── Empty state ─────────────────────────────────────────────────── */}
        {isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 pb-8">
            <PawPrint size={48} className="text-[var(--t3)]" />
            <p className="text-[17px] font-600 text-[var(--t1)] text-center">No animals in your collection</p>
            <p className="text-[14px] text-[var(--t2)] text-center">
              Generate or rescue an animal first, then come back to play.
            </p>
            <Button
              variant="accent"
              size="md"
              onClick={() => {
                onClose()
                navigate('/generate')
              }}
            >
              Generate an animal
            </Button>
          </div>
        ) : (
          <>
            {/* ── Filter row: category pills left, sort right ───────────────── */}
            <div className="flex items-center gap-2 px-4 pb-3 shrink-0 overflow-x-auto scrollbar-hide">
              {/* Category pills — left aligned */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1">
                {CATEGORY_FILTERS.map(f => {
                  const isActive = categoryFilter === f
                  return (
                    <button
                      key={f}
                      onClick={() => setCategoryFilter(f)}
                      aria-pressed={isActive}
                      className="flex-shrink-0 px-4 h-9 rounded-pill text-[13px] font-600 transition-colors duration-150"
                      style={{
                        background:   isActive ? 'var(--blue-sub)' : 'var(--card)',
                        border:       isActive ? '1px solid var(--blue)' : '1px solid var(--border-s)',
                        color:        isActive ? 'var(--blue-t)' : 'var(--t2)',
                      }}
                    >
                      {f}
                    </button>
                  )
                })}
              </div>

              {/* Sort control — right aligned, shrink-0 so pills don't push it off */}
              <div className="relative ml-auto shrink-0">
                <button
                  onClick={() => setShowSortMenu(v => !v)}
                  className="flex items-center gap-1.5 h-9 px-3 rounded-pill text-[13px] font-600 transition-colors border"
                  style={{
                    background: 'var(--card)',
                    borderColor: 'var(--border-s)',
                    color: 'var(--t2)',
                  }}
                >
                  {SORT_OPTIONS.find(s => s.id === sortMode)?.label}
                </button>
                {showSortMenu && (
                  <div
                    className="absolute right-0 top-full mt-1 rounded-[var(--r-lg)] border z-10 overflow-hidden"
                    style={{
                      background: 'rgba(13,13,17,.92)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,.08)',
                      minWidth: 160,
                    }}
                  >
                    {SORT_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => { setSortMode(opt.id); setShowSortMenu(false) }}
                        className="w-full text-left px-4 py-2.5 text-[13px] font-600 transition-colors hover:bg-white/[.06]"
                        style={{ color: sortMode === opt.id ? 'var(--blue-t)' : 'var(--t2)' }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Pet row — horizontal scroll ───────────────────────────────── */}
            <div className="overflow-y-auto">
              {/* Single horizontal scrolling row — pt-1 prevents lift clipping */}
              <div className="flex gap-2 overflow-x-auto px-4 pb-4 pt-1 scrollbar-hide">
                {filteredPets.map(pet => (
                  <PetPickerTile
                    key={pet.id}
                    pet={pet}
                    isSelected={selectedPet?.id === pet.id}
                    onSelect={() => handlePetSelect(pet)}
                  />
                ))}
              </div>

              {/* Panel B — challenge level selector (first play only) */}
              <AnimatePresence>
                {showLevelPanel && (
                  <div className="border-t border-[var(--border-s)] pt-4 mt-2">
                    <ChallengeLevelSelector
                      selected={challengeLevel}
                      onSelect={level => {
                        setChallengeLevel(level)
                        setLevelConfirmed(true)
                      }}
                    />
                  </div>
                )}
              </AnimatePresence>

            </div>

            {/* ── Footer: Play button ──────────────────────────────────────── */}
            <div
              className="shrink-0 px-4 py-4"
              style={{
                borderTop: '1px solid var(--border-s)',
              }}
            >
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                disabled={!playButtonEnabled}
                onClick={() => { handlePlay().catch(() => {}) }}
              >
                {selectedPet
                  ? `Play with ${selectedPet.name}`
                  : 'Choose an animal to play'
                }
              </Button>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  )
}
