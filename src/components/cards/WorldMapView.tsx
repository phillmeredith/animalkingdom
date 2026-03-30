// WorldMapView — Story 9: World Map tab in CardsScreen
// Phase 1: SVG-based world representation, no external map library.
//
// Layout:
//   - Background: var(--card) rounded-2xl, full content area
//   - SVG world map outline with collected card dots at lat/lng positions
//   - Tap dot: shows tooltip (phone) or right panel (iPad ≥820px)
//   - Stats strip below map: X / total cards collected, progress bar
//   - Empty state: Globe icon, copy, "Open a pack" button
//
// Map bounds: lat -60 to 80, lng -180 to 180 → converted to x/y percentage
//
// Portal rule: the card detail tooltip on phone opens a BottomSheet (already portalled).
// No additional portal needed here.
//
// Tint-pair rule: all badges use tint-pair. No solid fill + white text.

import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Globe, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BottomSheet } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { RarityBadge } from '@/components/ui/Badge'
import { AnimalImage } from '@/components/ui/AnimalImage'
import { db } from '@/lib/db'
import type { CollectedCard } from '@/lib/db'

// ─── Coordinate helpers ───────────────────────────────────────────────────────

// Map bounds
const LAT_MIN = -60
const LAT_MAX = 80
const LNG_MIN = -180
const LNG_MAX = 180

function latToY(lat: number): number {
  // Inverted: top of map = LAT_MAX, bottom = LAT_MIN
  return ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * 100
}

function lngToX(lng: number): number {
  return ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * 100
}

// ─── World Map SVG ────────────────────────────────────────────────────────────
//
// Simplified SVG world map outline — continent shapes as rough approximations.
// Uses viewBox "0 0 100 100" so percentage-based dot placement aligns directly.
// Paths are stylised continent silhouettes, not projection-accurate.

function WorldMapSvg() {
  return (
    <svg
      viewBox="0 0 100 60"
      className="w-full h-full"
      style={{ display: 'block' }}
      aria-hidden="true"
    >
      {/* North America */}
      <path
        d="M 5 8 L 22 8 L 26 12 L 26 18 L 22 24 L 18 26 L 14 28 L 12 34 L 10 36 L 8 34 L 6 28 L 4 20 Z"
        fill="var(--elev)"
        stroke="var(--border-s)"
        strokeWidth="0.4"
      />
      {/* South America */}
      <path
        d="M 14 36 L 20 36 L 22 40 L 22 50 L 18 56 L 14 56 L 12 50 L 12 42 Z"
        fill="var(--elev)"
        stroke="var(--border-s)"
        strokeWidth="0.4"
      />
      {/* Europe */}
      <path
        d="M 38 6 L 48 6 L 50 10 L 48 14 L 42 16 L 38 14 L 36 10 Z"
        fill="var(--elev)"
        stroke="var(--border-s)"
        strokeWidth="0.4"
      />
      {/* Africa */}
      <path
        d="M 38 16 L 46 16 L 48 22 L 48 34 L 44 42 L 40 44 L 36 42 L 34 34 L 34 22 Z"
        fill="var(--elev)"
        stroke="var(--border-s)"
        strokeWidth="0.4"
      />
      {/* Asia */}
      <path
        d="M 50 4 L 78 4 L 82 8 L 82 22 L 78 26 L 68 28 L 60 26 L 52 24 L 48 18 L 48 10 Z"
        fill="var(--elev)"
        stroke="var(--border-s)"
        strokeWidth="0.4"
      />
      {/* Australia */}
      <path
        d="M 70 36 L 82 36 L 84 42 L 82 48 L 74 48 L 70 44 Z"
        fill="var(--elev)"
        stroke="var(--border-s)"
        strokeWidth="0.4"
      />
      {/* Greenland */}
      <path
        d="M 26 2 L 34 2 L 34 8 L 28 8 Z"
        fill="var(--elev)"
        stroke="var(--border-s)"
        strokeWidth="0.4"
      />
    </svg>
  )
}

// ─── Card dot ─────────────────────────────────────────────────────────────────

function CardDot({
  card,
  isSelected,
  onClick,
}: {
  card: CollectedCard
  isSelected: boolean
  onClick: () => void
}) {
  const lat = card.coordinates?.lat ?? 0
  const lng = card.coordinates?.lng ?? 0
  // Map to 0–100% within the SVG viewBox "0 0 100 60"
  const x = lngToX(lng)
  const y = latToY(lat) * 0.6 // scale to 60-unit viewBox height

  return (
    <button
      onClick={onClick}
      aria-label={`View ${card.name} on map`}
      className="absolute transition-transform duration-150 hover:scale-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--blue)]"
      style={{
        left:      `${x}%`,
        top:       `${y}%`,
        transform: 'translate(-50%, -50%)',
        width:     10,
        height:    10,
        zIndex:    isSelected ? 10 : 1,
      }}
    >
      <div
        className="w-full h-full rounded-full"
        style={{
          background: isSelected ? 'var(--blue)' : 'var(--green)',
          border:     `1px solid ${isSelected ? 'var(--blue-sub)' : 'var(--green-sub)'}`,
          boxShadow:  isSelected ? '0 0 6px rgba(55,114,255,.5)' : 'none',
        }}
      />
    </button>
  )
}

// ─── Card panel (iPad side panel / phone tooltip) ─────────────────────────────

function CardInfoPanel({
  card,
  onClose,
}: {
  card: CollectedCard
  onClose: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
          <AnimalImage
            src={card.imageUrl}
            alt={card.name}
            className="w-full h-full object-cover"
            fallbackClassName="w-full h-full"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[17px] font-700 text-[var(--t1)] truncate">{card.name}</p>
          <p className="text-[13px] text-[var(--t3)]">{card.breed} · {card.animalType}</p>
          <div className="mt-1">
            <RarityBadge rarity={card.rarity} />
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-[var(--elev)] flex items-center justify-center text-[var(--t3)] hover:text-[var(--t1)] transition-colors shrink-0"
          aria-label="Close"
        >
          <X size={14} />
        </button>
      </div>

      {/* Location info */}
      {(card.region || card.biome || card.conservationStatus) && (
        <div className="flex flex-col gap-2">
          {card.region && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-700 uppercase tracking-widest text-[var(--t3)] w-24 shrink-0">Region</span>
              <span className="text-[13px] font-600 text-[var(--t2)]">{card.region}</span>
            </div>
          )}
          {card.biome && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-700 uppercase tracking-widest text-[var(--t3)] w-24 shrink-0">Biome</span>
              <span className="text-[13px] font-600 text-[var(--t2)]">{card.biome}</span>
            </div>
          )}
          {card.conservationStatus && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-700 uppercase tracking-widest text-[var(--t3)] w-24 shrink-0">Status</span>
              <span
                className="text-[13px] font-600 px-2 py-0.5 rounded-pill"
                style={{ background: 'var(--amber-sub)', color: 'var(--amber-t)' }}
              >
                {card.conservationStatus}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Card level */}
      <div className="flex items-center justify-between py-3 px-4 rounded-[var(--r-lg)] border border-[var(--border-s)] bg-[var(--elev)]">
        <span className="text-[13px] font-600 text-[var(--t2)]">Card level</span>
        <span className="text-[13px] font-700 text-[var(--t1)]">Level {card.level ?? 1}</span>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WorldMapView() {
  const navigate = useNavigate()
  const allCards = useLiveQuery(() => db.collectedCards.toArray(), [], [])

  const [selectedCard, setSelectedCard] = useState<CollectedCard | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // Only show cards that have coordinates
  const mappedCards = useMemo(
    () => (allCards ?? []).filter(c => c.coordinates?.lat != null && c.coordinates?.lng != null),
    [allCards],
  )

  const totalCards = (allCards ?? []).length
  const mappedCount = mappedCards.length
  const TOTAL_POSSIBLE = 200 // spec: "X / 200 cards collected"
  const progressPct = (totalCards / TOTAL_POSSIBLE) * 100

  function handleDotTap(card: CollectedCard) {
    setSelectedCard(card)
    // On tablet (≥768px) the side panel handles the detail view.
    // On phone the BottomSheet handles it.
    const isTablet = window.matchMedia('(min-width: 768px)').matches
    if (!isTablet) {
      setSheetOpen(true)
    }
  }

  function handlePanelClose() {
    setSheetOpen(false)
    setSelectedCard(null)
  }

  // Empty state: no cards collected at all
  if (totalCards === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 px-6">
        <Globe size={64} className="text-[var(--t3)]" />
        <p className="text-[17px] font-600 text-[var(--t1)] text-center">
          Start collecting cards to fill your world map
        </p>
        <p className="text-[14px] text-[var(--t2)] text-center">
          Each card comes from a real location. Open a pack to begin.
        </p>
        <Button
          variant="accent"
          size="md"
          onClick={() => navigate('/shop')}
        >
          Open a pack
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="px-6 pt-4 pb-24 max-w-3xl mx-auto w-full">

        {/* Map container + optional side panel on iPad */}
        <div className="flex gap-6">

          {/* Map panel */}
          <div
            className="rounded-2xl overflow-hidden relative"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border-s)',
              flex: selectedCard ? '0 0 65%' : '1 1 auto',
            }}
          >
            {/* SVG world map */}
            <div className="relative w-full" style={{ aspectRatio: '5/3' }}>
              <WorldMapSvg />

              {/* Card dots */}
              {mappedCards.map(card => (
                <CardDot
                  key={card.id}
                  card={card}
                  isSelected={selectedCard?.id === card.id}
                  onClick={() => handleDotTap(card)}
                />
              ))}
            </div>
          </div>

          {/* Side panel — iPad only (hidden on small screens via CSS) */}
          {selectedCard && (
            <div
              className="hidden md:block rounded-2xl p-5 shrink-0 overflow-y-auto"
              style={{
                flex: '0 0 35%',
                background: 'var(--card)',
                border: '1px solid var(--border-s)',
                maxHeight: 360,
              }}
            >
              <CardInfoPanel card={selectedCard} onClose={() => setSelectedCard(null)} />
            </div>
          )}
        </div>

        {/* Stats strip */}
        <div className="mt-4 rounded-2xl border border-[var(--border-s)] bg-[var(--card)] px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[13px] font-700 text-[var(--t2)]">
              Cards on map
            </p>
            <p className="text-[13px] font-700 text-[var(--t1)]">
              {mappedCount} <span className="font-400 text-[var(--t3)]">placed</span>
            </p>
          </div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[13px] font-700 text-[var(--t2)]">
              Collection
            </p>
            <p className="text-[13px] font-700 text-[var(--t1)]">
              {totalCards} / {TOTAL_POSSIBLE}
            </p>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-s)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progressPct, 100)}%`, background: 'var(--blue)' }}
            />
          </div>
        </div>

        {/* Note about unmapped cards */}
        {mappedCount < totalCards && (
          <p className="mt-3 text-center text-[12px] text-[var(--t3)]">
            {totalCards - mappedCount} card{totalCards - mappedCount !== 1 ? 's' : ''} not yet placed on the map
          </p>
        )}
      </div>

      {/* Phone: card info in BottomSheet (only shown on screens < 768px via handleDotTap logic) */}
      <BottomSheet
        isOpen={sheetOpen}
        onClose={handlePanelClose}
      >
        {selectedCard && (
          <div className="px-6 pb-8 pt-2 max-w-xl mx-auto w-full">
            <CardInfoPanel card={selectedCard} onClose={handlePanelClose} />
          </div>
        )}
      </BottomSheet>
    </>
  )
}
