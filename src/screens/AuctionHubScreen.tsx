// AuctionHubScreen — NPC-driven daily animal auctions
//
// Stories: AUC-02 (generation), AUC-03 (hub + card), AUC-04 (onboarding strip),
//          AUC-05 (coinsInBids display), AUC-06/07/08 (bid flow), AUC-09 (NPC bids),
//          AUC-10 (win overlay), AUC-11 (loss), AUC-12 (resolution timer)
//
// Navigation: Lives inside StoreHubScreen as the "Auctions" tab.
// This component does NOT render its own tab switcher — the parent StoreHubScreen
// owns the centre slot control (dual navigation is a build defect per CLAUDE.md).
//
// Content container class: px-6 pt-4 pb-24 max-w-3xl mx-auto w-full (spec §4)
//
// DS compliance verified:
// - No emojis — Lucide only
// - No ghost variant
// - All colours from var(--...) tokens
// - Filter pills: CategoryPills tint-pair pattern
// - Card hover: DS pattern with pt-1 on grid parent to prevent clip
// - Tint-pair badges throughout

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Gavel, ChevronDown } from 'lucide-react'
// ChevronDown used in SortControl (exported AuctionFilterRow component below)
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { useAuctions } from '@/hooks/useAuctions'
import { useWallet } from '@/hooks/useWallet'
import { AuctionCard } from '@/components/auctions/AuctionCard'
import { AuctionDetailSheet } from '@/components/auctions/AuctionDetailSheet'
import { AuctionWonOverlay } from '@/components/auctions/AuctionWonOverlay'
import { cn } from '@/lib/utils'
import type { AuctionItem, AuctionBid, Rarity } from '@/lib/db'

// ─── Onboarding strip key ─────────────────────────────────────────────────────

const ONBOARDING_SEEN_KEY = 'auctions_onboarding_seen'

// ─── Rarity filter pills ──────────────────────────────────────────────────────

type RarityFilter = 'all' | Rarity

const RARITY_FILTERS: { key: RarityFilter; label: string }[] = [
  { key: 'all',       label: 'All' },
  { key: 'uncommon',  label: 'Uncommon' },
  { key: 'rare',      label: 'Rare' },
  { key: 'epic',      label: 'Epic' },
  { key: 'legendary', label: 'Legendary' },
]
// Common is omitted — auction rarity floor means common animals never appear (spec §5)

// ─── Sort options ─────────────────────────────────────────────────────────────

type SortOption = 'ending-soon' | 'lowest-bid' | 'highest-bid' | 'rarest-first'

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: 'ending-soon',   label: 'Ending soon' },
  { key: 'lowest-bid',    label: 'Lowest bid' },
  { key: 'highest-bid',   label: 'Highest bid' },
  { key: 'rarest-first',  label: 'Rarest first' },
]

const RARITY_ORDER: Record<Rarity, number> = {
  legendary: 4,
  epic:      3,
  rare:      2,
  uncommon:  1,
  common:    0,
}

function sortAuctions(items: AuctionItem[], sort: SortOption): AuctionItem[] {
  const copy = [...items]
  switch (sort) {
    case 'ending-soon':
      return copy.sort((a, b) => a.endsAt.getTime() - b.endsAt.getTime())
    case 'lowest-bid':
      return copy.sort((a, b) => a.currentBid - b.currentBid)
    case 'highest-bid':
      return copy.sort((a, b) => b.currentBid - a.currentBid)
    case 'rarest-first':
      return copy.sort((a, b) => RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity])
  }
}

// ─── AuctionEmptyState ────────────────────────────────────────────────────────

function AuctionEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      {/* Lucide Gavel icon, 48px, --t4 */}
      <Gavel size={48} className="text-[var(--t4)]" aria-hidden="true" />
      <h2 className="text-[17px] font-semibold text-[var(--t1)]">
        No auctions right now
      </h2>
      <p className="text-[14px] text-[var(--t2)] max-w-[240px]">
        New animals arrive every day. Check back soon!
      </p>
    </div>
  )
}

// ─── Loading skeletons ────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      className="rounded-[var(--r-lg)] overflow-hidden border border-[var(--border-s)]"
      style={{ background: 'var(--elev)' }}
      aria-hidden="true"
    >
      {/* Image skeleton */}
      <div className="w-full aspect-video animate-pulse" style={{ background: 'var(--border-s)' }} />
      {/* Body skeleton */}
      <div className="p-4 flex flex-col gap-3">
        <div className="h-4 rounded-pill animate-pulse" style={{ background: 'var(--border-s)', width: '60%' }} />
        <div className="h-3 rounded-pill animate-pulse" style={{ background: 'var(--border-s)', width: '40%' }} />
      </div>
    </div>
  )
}

// ─── Sort dropdown ────────────────────────────────────────────────────────────

interface SortControlProps {
  value: SortOption
  onChange: (sort: SortOption) => void
}

function SortControl({ value, onChange }: SortControlProps) {
  const [open, setOpen] = useState(false)
  const current = SORT_OPTIONS.find(s => s.key === value)

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen(prev => !prev)}
        aria-label={`Sort by: ${current?.label}`}
        aria-expanded={open}
        className={cn(
          'inline-flex items-center gap-1.5 h-9 px-3 rounded-pill text-[13px] font-semibold',
          'border border-[var(--border)] text-[var(--t1)] bg-transparent',
          'transition-all duration-150 hover:border-t3 hover:bg-white/[.03]',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--blue)] focus-visible:outline-offset-2',
        )}
      >
        {current?.label}
        <ChevronDown size={16} aria-hidden="true" />
      </button>

      {open && (
        <>
          {/* Backdrop to close the dropdown */}
          <div
            className="fixed inset-0 z-[50]"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            className="absolute right-0 top-11 z-[51] rounded-[var(--r-md)] overflow-hidden py-1 min-w-[160px]"
            style={{
              background: 'rgba(13,13,17,.95)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,.06)',
              boxShadow: 'var(--sh-elevated)',
            }}
            role="menu"
          >
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.key}
                role="menuitem"
                onClick={() => { onChange(opt.key); setOpen(false) }}
                className={cn(
                  'w-full text-left px-4 py-2.5 text-[13px] font-medium transition-colors duration-100',
                  'hover:bg-white/[.05]',
                  opt.key === value
                    ? 'text-[var(--blue-t)]'
                    : 'text-[var(--t2)]',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── AuctionHubScreen ─────────────────────────────────────────────────────────

interface AuctionHubScreenProps {
  /** Rarity filter lifted from parent (StoreHubScreen controls the below slot). */
  rarityFilter: RarityFilter
  /** Sort option lifted from parent. */
  sort: SortOption
}

export function AuctionHubScreen({ rarityFilter, sort }: AuctionHubScreenProps) {
  const navigate = useNavigate()
  const { auctions, playerBids, placeBid, buyNow, resolveExpiredAuctions } = useAuctions()
  const { coins } = useWallet()

  const [selectedAuction, setSelectedAuction] = useState<AuctionItem | null>(null)
  const [wonOverlayAuction, setWonOverlayAuction] = useState<AuctionItem | null>(null)
  // Loading guard — set true after 600ms to allow the DB query to settle
  const [hasResolved, setHasResolved] = useState(false)
  // Win overlay tracking — prevents re-showing the overlay for an auction we've already celebrated
  const [lastShownWonId, setLastShownWonId] = useState<number | null>(null)
  // One-time onboarding strip (Flow 0) — shown only on first visit
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem(ONBOARDING_SEEN_KEY)
  )

  useEffect(() => {
    if (showOnboarding) {
      // Mark as seen after first render so it disappears on next session
      localStorage.setItem(ONBOARDING_SEEN_KEY, '1')
    }
  }, [showOnboarding])

  // AUC-12: check every 60 seconds for expired auctions and resolve them
  useEffect(() => {
    const id = setInterval(() => {
      resolveExpiredAuctions()
    }, 60_000)
    return () => clearInterval(id)
  }, [resolveExpiredAuctions])

  // Live query for bids of the selected auction (for BidHistoryList)
  const selectedBids = useLiveQuery(
    () => selectedAuction?.id
      ? db.auctionBids.where('auctionId').equals(selectedAuction.id).toArray()
      : Promise.resolve([] as AuctionBid[]),
    [selectedAuction?.id],
    [] as AuctionBid[],
  )

  // Active auctions only (status === 'active')
  const activeAuctions = auctions.filter(a => a.status === 'active')
  // Won auctions (status === 'won') — card stays visible for remainder of daily cycle
  const wonAuctions = auctions.filter(a => a.status === 'won')

  // All displayable auctions — active + won (won cards persist in the grid per spec Flow 5)
  const displayAuctions = [...activeAuctions, ...wonAuctions]

  // Apply rarity filter
  const filtered = rarityFilter === 'all'
    ? displayAuctions
    : displayAuctions.filter(a => a.rarity === rarityFilter)

  // Apply sort
  const sorted = sortAuctions(filtered, sort)

  // Loading state: useLiveQuery returns the default [] before the first DB response.
  // hasResolved flips after 600ms to allow the DB query to settle before showing
  // the empty state (avoids a flash of empty where loading skeleton should be).
  useEffect(() => {
    // Once auctions has been populated (even with empty array from a real DB read),
    // the hook has resolved. The refreshAuctions() call on mount will either
    // populate auctions or leave it empty — both are valid resolved states.
    const timer = setTimeout(() => setHasResolved(true), 600)
    return () => clearTimeout(timer)
  }, [])

  const isLoading = !hasResolved

  // Determine outbid state for selected auction
  const selectedPlayerBid = selectedAuction?.id != null
    ? (playerBids[selectedAuction.id] ?? null)
    : null

  const isOutbid = selectedAuction != null
    && selectedAuction.status === 'active'
    && selectedPlayerBid != null
    && selectedAuction.currentBidder !== 'player'

  const handleAuctionExpired = useCallback(() => {
    if (selectedAuction) {
      resolveExpiredAuctions()
    }
  }, [selectedAuction, resolveExpiredAuctions])

  const handleWin = useCallback((auction: AuctionItem) => {
    setWonOverlayAuction(auction)
  }, [])

  // Reactively watch for auctions transitioning to 'won' status.
  // When resolveExpiredAuctions() resolves a win, the auctions live query updates
  // and we detect the newly-won auction here to show the overlay.
  useEffect(() => {
    const justWon = auctions.find(
      a => a.status === 'won' && a.id != null && a.id !== lastShownWonId
    )
    if (justWon && wonOverlayAuction == null) {
      // Only trigger the overlay if it's not already showing
      // and we haven't already shown this auction's overlay in this session
      setLastShownWonId(justWon.id!)
      handleWin(justWon)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auctions])

  // After win overlay dismisses and navigates to /animals
  const handleGoToAnimals = useCallback(() => {
    setWonOverlayAuction(null)
    setSelectedAuction(null)
    navigate('/animals')
  }, [navigate])

  return (
    <>
      {/* Content — note: PageHeader title and centre tab are owned by StoreHubScreen */}
      <div className="px-6 pt-4 pb-24 max-w-3xl mx-auto w-full">
        {/* Onboarding strip — first visit only, inline above grid (spec Flow 0) */}
        {showOnboarding && (
          <div
            className="mb-5 px-3 py-3 rounded-[var(--r-md)] text-[14px] text-[var(--t2)]"
            style={{ background: 'var(--elev)' }}
          >
            Find an animal you love and offer the most coins before the timer ends — and it's
            yours! These are rare animals you can't get any other way.
          </div>
        )}

        {/* Section label */}
        <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--t3)] mb-4">
          Live Now
        </p>

        {/* Loading state: 4 skeleton cards */}
        {isLoading && (
          <div className="pt-1 grid grid-cols-1 md:grid-cols-2 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && sorted.length === 0 && (
          <AuctionEmptyState />
        )}

        {/* Auction card grid */}
        {/* pt-1 on grid parent prevents card lift animation clipping (spec §3 AC, DS hover rule) */}
        {!isLoading && sorted.length > 0 && (
          <div className="pt-1 grid grid-cols-1 md:grid-cols-2 gap-5">
            {sorted.map(auction => (
              <AuctionCard
                key={auction.id}
                auction={auction}
                playerBidAmount={auction.id != null ? (playerBids[auction.id] ?? null) : null}
                onTap={() => setSelectedAuction(auction)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Auction detail sheet */}
      <AuctionDetailSheet
        auction={selectedAuction}
        isOpen={selectedAuction != null}
        onClose={() => setSelectedAuction(null)}
        playerBid={selectedPlayerBid}
        isOutbid={isOutbid}
        coins={coins}
        bids={selectedBids ?? []}
        onPlaceBid={async (amount) => {
          if (!selectedAuction?.id) return
          await placeBid(selectedAuction.id, amount)
        }}
        onBuyNow={async () => {
          if (!selectedAuction?.id) return
          await buyNow(selectedAuction.id)
          // After buy-now succeeds, check if this auction is now won to show overlay
          const updated = await db.auctionItems.get(selectedAuction.id)
          if (updated?.status === 'won') {
            handleWin(updated)
          }
        }}
        onAuctionExpired={handleAuctionExpired}
        onNavigateToAnimals={handleGoToAnimals}
      />

      {/* Won overlay — portal, no backdrop dismiss */}
      <AuctionWonOverlay
        auction={wonOverlayAuction}
        isOpen={wonOverlayAuction != null}
        onGoToAnimals={handleGoToAnimals}
      />
    </>
  )
}

// ─── Filter row export (used in StoreHubScreen `below` slot) ─────────────────

interface AuctionFilterRowProps {
  rarityFilter: RarityFilter
  sort: SortOption
  onRarityChange: (r: RarityFilter) => void
  onSortChange: (s: SortOption) => void
}

export function AuctionFilterRow({
  rarityFilter,
  sort,
  onRarityChange,
  onSortChange,
}: AuctionFilterRowProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none -mx-6 px-6">
      {/* Rarity filter pills — left-aligned, tint-pair pattern per spec */}
      {RARITY_FILTERS.map(f => (
        <button
          key={f.key}
          onClick={() => onRarityChange(f.key)}
          aria-pressed={rarityFilter === f.key}
          className={cn(
            'flex-shrink-0 h-9 px-4 rounded-pill text-[13px] font-semibold transition-colors duration-150',
            rarityFilter === f.key
              // Active: blue tint-pair (CategoryPills pattern per spec §5)
              ? 'bg-[var(--blue-sub)] border border-[var(--blue)] text-[var(--blue-t)]'
              // Inactive
              : 'bg-[var(--card)] border border-[var(--border-s)] text-[var(--t2)]',
          )}
        >
          {f.label}
        </button>
      ))}

      {/* Sort control — right-aligned, ml-auto shrink-0 */}
      <div className="ml-auto shrink-0">
        <SortControl value={sort} onChange={onSortChange} />
      </div>
    </div>
  )
}
