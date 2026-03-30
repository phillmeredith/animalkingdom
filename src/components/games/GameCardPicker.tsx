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
import { X, Check, CreditCard, PackageOpen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BottomSheet } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { RarityBadge } from '@/components/ui/Badge'
import { AnimalImage } from '@/components/ui/AnimalImage'
import { db } from '@/lib/db'
import type { CollectedCard } from '@/lib/db'

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

type AnimalTypeFilter = 'All' | 'Mammal' | 'Bird' | 'Reptile' | 'Fish' | 'Amphibian'
type SortMode = 'name' | 'recent' | 'level'

const TYPE_FILTERS: AnimalTypeFilter[] = ['All', 'Mammal', 'Bird', 'Reptile', 'Fish', 'Amphibian']

const SORT_OPTIONS: { id: SortMode; label: string }[] = [
  { id: 'name',   label: 'Name A–Z'     },
  { id: 'recent', label: 'Recently used' },
  { id: 'level',  label: 'Highest level' },
]

// ─── XP threshold helper ──────────────────────────────────────────────────────
//
// XP per level = 50 × level number (Owner decision)

function xpThreshold(level: number): number {
  return 50 * level
}

// ─── Level pill helper ────────────────────────────────────────────────────────
//
// Lv 1–3: neutral  (var(--card) bg, var(--border-s) border, var(--t3) text)
// Lv 4–6: green tint-pair
// Lv 7–10: amber tint-pair
// 0 / never played: "New" in neutral

function LevelPill({
  level,
  gameAccent,
  gameAccentSub,
  gameAccentText,
}: {
  level: number
  gameAccent: string
  gameAccentSub: string
  gameAccentText: string
}) {
  // level === 0 means never played this game with this card
  if (level === 0) {
    return (
      <span
        className="inline-flex items-center px-2 py-0.5 rounded-pill text-[11px] font-700 tracking-wide"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border-s)',
          color: 'var(--t3)',
        }}
      >
        New
      </span>
    )
  }

  const bg   = level <= 3 ? 'var(--card)'      : level <= 6 ? 'var(--green-sub)' : 'var(--amber-sub)'
  const border = level <= 3 ? 'var(--border-s)' : level <= 6 ? 'var(--green)'    : 'var(--amber)'
  const color  = level <= 3 ? 'var(--t3)'       : level <= 6 ? 'var(--green-t)'  : 'var(--amber-t)'

  // Use game accent for the pill if level > 0 so it reflects the game's identity
  // but fall back to the tier-based colour (spec: "tint-pair by level range")
  void gameAccent; void gameAccentSub; void gameAccentText

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-pill text-[11px] font-700 tracking-wide"
      style={{ background: bg, border: `1px solid ${border}`, color }}
    >
      Lv {level}
    </span>
  )
}

// ─── Card picker tile ─────────────────────────────────────────────────────────

function CardPickerTile({
  card,
  gameKey,
  gameAccent,
  gameAccentSub,
  gameAccentText,
  isSelected,
  isLastUsed,
  onSelect,
}: {
  card: CollectedCard
  gameKey: GameCardPickerProps['gameKey']
  gameAccent: string
  gameAccentSub: string
  gameAccentText: string
  isSelected: boolean
  isLastUsed: boolean
  onSelect: () => void
}) {
  // Per-game level: derive from card.level (overall) as proxy until per-game levels
  // are stored. The DB has a single `level` field — per-game level tracking is a
  // future Story 7 concern. For Phase 1, use overall level.
  const cardLevel = card.level ?? 1
  // "Never played this game" if gameHistory for this game is 0
  const sessionsPlayed = card.gameHistory?.[gameKey] ?? 0
  const displayLevel = sessionsPlayed === 0 ? 0 : cardLevel

  return (
    <div className="flex flex-col gap-0.5">
      {/* Last-used label sits above the tile — only for the first card in the sorted list */}
      {isLastUsed && (
        <p
          className="text-[11px] font-700 uppercase tracking-widest text-[var(--t3)] mb-1"
          style={{ letterSpacing: '0.1em' }}
        >
          Last used
        </p>
      )}

      {/* Tile */}
      <div
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
        aria-label={`Select ${card.name}`}
        className={[
          'rounded-2xl border overflow-hidden cursor-pointer transition-all duration-200',
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
        {/* Image — aspect-square with selection check overlay */}
        <div className="relative w-full aspect-square">
          <AnimalImage
            src={card.imageUrl}
            alt={card.name}
            className="w-full h-full object-cover"
            fallbackClassName="w-full h-full"
          />
          {/* Selection indicator: Check in blue circle, top-right of image */}
          {isSelected && (
            <div
              className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: 'var(--blue)' }}
              aria-hidden="true"
            >
              <Check size={12} className="text-white" strokeWidth={3} />
            </div>
          )}
        </div>

        {/* Card info */}
        <div className="p-2.5 flex flex-col gap-1">
          <p className="text-[13px] font-600 text-[var(--t1)] truncate leading-tight">
            {card.name}
          </p>
          <div className="flex items-center justify-between gap-1 flex-wrap">
            <RarityBadge rarity={card.rarity} />
            <LevelPill
              level={displayLevel}
              gameAccent={gameAccent}
              gameAccentSub={gameAccentSub}
              gameAccentText={gameAccentText}
            />
          </div>
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

  // Load all collected cards from DB (live)
  const allCards = useLiveQuery(() => db.collectedCards.toArray(), [], [])

  // Local filter/sort state
  const [typeFilter, setTypeFilter] = useState<AnimalTypeFilter>('All')
  const [sortMode, setSortMode] = useState<SortMode>('recent')
  const [selectedCard, setSelectedCard] = useState<CollectedCard | null>(null)

  // Panel B state: show challenge selector on first play of this game
  const [showLevelPanel, setShowLevelPanel] = useState(false)
  const [challengeLevel, setChallengeLevel] = useState<ChallengeLevel>(1)
  const [levelConfirmed, setLevelConfirmed] = useState(false)
  const [showSortMenu, setShowSortMenu] = useState(false)

  const isEmpty = (allCards ?? []).length === 0

  // Determine whether this is a first-play (no sessions played for this game)
  const hasPlayedGame = useMemo(() => {
    return (allCards ?? []).some(c => (c.gameHistory?.[gameKey] ?? 0) > 0)
  }, [allCards, gameKey])

  // Find most recently played card for this game (sort by sessions played as proxy)
  const lastUsedCard = useMemo(() => {
    const played = (allCards ?? []).filter(c => (c.gameHistory?.[gameKey] ?? 0) > 0)
    if (played.length === 0) return null
    return played.reduce((best, c) =>
      (c.gameHistory?.[gameKey] ?? 0) > (best.gameHistory?.[gameKey] ?? 0) ? c : best
    )
  }, [allCards, gameKey])

  // Filter + sort derived card list
  const filteredCards = useMemo(() => {
    let cards = [...(allCards ?? [])]

    // Type filter
    if (typeFilter !== 'All') {
      cards = cards.filter(c => c.animalType === typeFilter)
    }

    // Sort
    if (sortMode === 'name') {
      cards.sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortMode === 'level') {
      cards.sort((a, b) => (b.level ?? 1) - (a.level ?? 1))
    } else {
      // 'recent' — last-used card first
      cards.sort((a, b) => {
        const aPlayed = a.gameHistory?.[gameKey] ?? 0
        const bPlayed = b.gameHistory?.[gameKey] ?? 0
        if (bPlayed !== aPlayed) return bPlayed - aPlayed
        return a.name.localeCompare(b.name)
      })
    }

    return cards
  }, [allCards, typeFilter, sortMode, gameKey])

  function handleCardSelect(card: CollectedCard) {
    setSelectedCard(card)
    // Show Panel B if this game has never been played before
    if (!hasPlayedGame && !levelConfirmed) {
      setShowLevelPanel(true)
    }
  }

  function handlePlay() {
    if (!selectedCard) return
    onClose()
    navigate(gameRoute, {
      state: {
        collectedCardId: selectedCard.id,
        challengeLevel,
        selectedCard,
      },
    })
  }

  const playButtonEnabled = selectedCard !== null && (!showLevelPanel || levelConfirmed || hasPlayedGame)

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="90vh">
      <div className="flex flex-col h-full">

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
            <p className="text-[13px] text-[var(--t2)]">Choose a card</p>
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
            <CreditCard size={48} className="text-[var(--t3)]" />
            <p className="text-[17px] font-600 text-[var(--t1)] text-center">You need a card to play</p>
            <p className="text-[14px] text-[var(--t2)] text-center">
              Open a pack in the Collection tab to get your first card.
            </p>
            <Button
              variant="accent"
              size="md"
              onClick={() => {
                onClose()
                navigate('/shop')
              }}
              icon={<PackageOpen size={15} />}
            >
              Go to Collection
            </Button>
          </div>
        ) : (
          <>
            {/* ── Filter row: pills left, sort right ───────────────────────── */}
            <div className="flex items-center gap-2 px-4 pb-3 shrink-0 overflow-x-auto scrollbar-hide">
              {/* Category pills — left aligned */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1">
                {TYPE_FILTERS.map(f => {
                  const isActive = typeFilter === f
                  return (
                    <button
                      key={f}
                      onClick={() => setTypeFilter(f)}
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

            {/* ── Card grid + Panel B — scrollable area ────────────────────── */}
            <div className="flex-1 overflow-y-auto">
              {/* pt-1 prevents hover lift clipping at scroll edge */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 px-4 pb-4 pt-1">
                {filteredCards.map(card => (
                  <CardPickerTile
                    key={card.id}
                    card={card}
                    gameKey={gameKey}
                    gameAccent={gameAccent}
                    gameAccentSub={gameAccentSub}
                    gameAccentText={gameAccentText}
                    isSelected={selectedCard?.id === card.id}
                    isLastUsed={card.id === lastUsedCard?.id}
                    onSelect={() => handleCardSelect(card)}
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

              {/* pb-24 ensures content clears the sticky footer */}
              <div className="h-24" />
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
                onClick={handlePlay}
              >
                {selectedCard
                  ? `Play with ${selectedCard.name}`
                  : 'Select a card to play'
                }
              </Button>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  )
}
