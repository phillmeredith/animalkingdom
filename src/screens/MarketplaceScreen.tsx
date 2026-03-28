// MarketplaceScreen — NPC offers + player listings
// Tabs: Browse (NPC offers) | My Listings
//
// player-listings integration:
//   - "My Listings" tab replaces the old stub with proper PlayerListingCard components
//   - Tab is in the PageHeader centre slot (segmented control, inline-flex, compact)
//   - Tab switcher is NOT re-rendered inside the content component — it lives only here
//   - usePlayerListings provides activeListings, getOffersForListing, completeSale,
//     cancelListing, declineNpcOffer
//   - AcceptOfferModal and SoldCelebrationOverlay are rendered via PlayerListingCard
//     (which owns AcceptOfferModal, which owns SoldCelebrationOverlay)

import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { PageHeader } from '@/components/layout/PageHeader'
import { CoinDisplay } from '@/components/ui/CoinDisplay'
import { RarityBadge, Badge } from '@/components/ui/Badge'
import { AnimalImage } from '@/components/ui/AnimalImage'
import { BottomSheet } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useWallet } from '@/hooks/useWallet'
import { useSavedNames } from '@/hooks/useSavedNames'
import { useMarketplace } from '@/hooks/useMarketplace'
import { usePlayerListings } from '@/hooks/usePlayerListings'
import { useToast } from '@/components/ui/Toast'
import { PlayerListingCard } from '@/components/player-listings/PlayerListingCard'
import { Coins, Loader2, Store, ShoppingBag, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MarketOffer, SavedName } from '@/lib/db'

type Tab = 'browse' | 'listings'

// ─── Offer card ───────────────────────────────────────────────────────────────

function OfferCard({ offer, onTap }: { offer: MarketOffer; onTap: () => void }) {
  const isBuy = offer.type === 'buy' // NPC wants to buy
  return (
    <button
      onClick={onTap}
      className="w-full text-left rounded-2xl border border-[var(--border-s)] bg-[var(--card)] overflow-hidden hover:border-[var(--border)] motion-safe:hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(0,0,0,.25)] transition-all duration-300 motion-safe:active:scale-[.97]"
    >
      <AnimalImage src={offer.imageUrl} alt={offer.breed} className="w-full aspect-[16/9] object-cover" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="text-[15px] font-700 text-t1">{offer.breed} {offer.animalType}</div>
            <div className="text-[12px] text-t3 mt-0.5">{offer.npcName}</div>
          </div>
          <RarityBadge rarity={offer.rarity} />
        </div>
        <div className="flex items-center justify-between">
          <Badge variant={isBuy ? 'green' : 'blue'}>
            {isBuy ? 'Wants to buy' : 'For sale'}
          </Badge>
          <span className="flex items-center gap-1 text-[15px] font-700 text-[var(--amber-t)]"><Coins size={13} /> {offer.price}</span>
        </div>
      </div>
    </button>
  )
}

// ─── Buy offer detail sheet ───────────────────────────────────────────────────

function BuyOfferSheet({ offer, pets, onAccept, onDecline, onClose, canAfford }: {
  offer: MarketOffer
  pets: SavedName[]
  onAccept: (pet: SavedName) => Promise<void>
  onDecline: () => Promise<void>
  onClose: () => void
  canAfford: boolean
}) {
  const [selectedPet, setSelectedPet] = useState<SavedName | null>(null)
  const [busy, setBusy] = useState(false)

  // Matching pets: same animalType or breed
  const matching = pets.filter(p =>
    p.animalType === offer.animalType || p.breed === offer.breed
  )

  return (
    <div className="px-6 pt-4 pb-8 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <AnimalImage src={offer.imageUrl} alt={offer.breed} className="w-16 h-16 rounded-xl object-cover shrink-0" />
        <div>
          <div className="text-[16px] font-700 text-t1">{offer.breed} {offer.animalType}</div>
          <div className="flex items-center gap-1 text-[13px] text-t2">{offer.npcName} wants to buy · <Coins size={12} /> {offer.price}</div>
        </div>
      </div>

      {matching.length === 0 ? (
        <p className="text-[14px] text-t3">You need a {offer.animalType} to accept this offer.</p>
      ) : (
        <>
          <p className="text-[13px] text-t2">Select which animal to sell:</p>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
            {matching.map(pet => (
              <button
                key={pet.id}
                onClick={() => setSelectedPet(pet)}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border transition-colors text-left',
                  selectedPet?.id === pet.id
                    ? 'border-[var(--blue)] bg-[var(--blue-sub)]'
                    : 'border-[var(--border-s)] bg-[var(--elev)]',
                )}
              >
                <AnimalImage src={pet.imageUrl} alt={pet.name} className="w-10 h-10 rounded-lg object-cover" />
                <div>
                  <div className="text-[14px] font-600 text-t1">{pet.name}</div>
                  <RarityBadge rarity={pet.rarity} />
                </div>
              </button>
            ))}
          </div>
          <Button
            variant="accent"
            size="lg"
            className="w-full"
            disabled={!selectedPet || busy}
            onClick={async () => {
              if (!selectedPet) return
              setBusy(true)
              await onAccept(selectedPet)
              setBusy(false)
            }}
          >
            {busy ? 'Selling…' : <span className="flex items-center gap-1.5">Sell for <Coins size={13} /> {offer.price}</span>}
          </Button>
        </>
      )}

      <Button variant="outline" size="md" className="w-full" onClick={async () => {
        setBusy(true); await onDecline(); setBusy(false)
      }} disabled={busy}>
        Decline offer
      </Button>
    </div>
  )
}

// ─── Sell offer detail sheet ──────────────────────────────────────────────────

function SellOfferSheet({ offer, onBuy, onDecline, canAfford }: {
  offer: MarketOffer
  onBuy: () => Promise<void>
  onDecline: () => Promise<void>
  canAfford: boolean
}) {
  const [busy, setBusy] = useState(false)
  return (
    <div className="px-6 pt-4 pb-8 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <AnimalImage src={offer.imageUrl} alt={offer.breed} className="w-16 h-16 rounded-xl object-cover shrink-0" />
        <div>
          <div className="text-[16px] font-700 text-t1">{offer.breed} {offer.animalType}</div>
          <div className="text-[13px] text-t2">{offer.npcName} is selling</div>
          <RarityBadge rarity={offer.rarity} className="mt-1" />
        </div>
      </div>

      <div className="rounded-xl bg-[var(--elev)] p-4 flex items-center justify-between">
        <span className="text-[14px] text-t2">Price</span>
        <span className="flex items-center gap-1 text-[20px] font-700 text-[var(--amber-t)]"><Coins size={18} /> {offer.price}</span>
      </div>

      <Button
        variant="accent"
        size="lg"
        className="w-full"
        disabled={!canAfford || busy}
        onClick={async () => { setBusy(true); await onBuy(); setBusy(false) }}
      >
        {busy ? 'Buying…' : canAfford ? <span className="flex items-center gap-1.5">Buy for <Coins size={13} /> {offer.price}</span> : 'Not enough coins'}
      </Button>
      <Button variant="outline" size="md" className="w-full" onClick={onDecline} disabled={busy}>
        Pass
      </Button>
    </div>
  )
}

// ─── MyListingsTab ────────────────────────────────────────────────────────────
// Proper implementation replacing the old stub. Uses usePlayerListings hook.
// Does NOT render its own tab switcher — active tab is owned by MarketplaceScreen.

function MyListingsTab() {
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()
  const {
    activeListings,
    getOffersForListing,
    cancelListing,
    completeSale,
    declineNpcOffer,
  } = usePlayerListings()

  if (activeListings.length === 0) {
    return (
      <div className="px-6 pt-4 pb-24 max-w-3xl mx-auto w-full">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Tag size={48} strokeWidth={2} className="text-[var(--t4)]" aria-hidden="true" />
          <div className="text-center">
            <p className="text-[17px] font-semibold text-[var(--t1)] mb-1">Nothing listed yet</p>
            <p className="text-[14px]" style={{ color: 'var(--t3)' }}>
              List a pet from My Animals to start earning coins.
            </p>
          </div>
          <Button variant="primary" size="md" onClick={() => navigate('/animals')}>
            Go to My Animals
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 pt-4 pb-24 max-w-3xl mx-auto w-full">
      <div className="flex flex-col gap-4">
        <AnimatePresence>
          {activeListings.map(listing => (
            <motion.div
              key={listing.id}
              exit={{ opacity: 0, transition: { duration: reducedMotion ? 0 : 0.2 } }}
            >
              <PlayerListingCard
                listing={listing}
                offers={getOffersForListing(listing.id!)}
                onCancelListing={cancelListing}
                onAcceptOffer={completeSale}
                onDeclineOffer={declineNpcOffer}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Naming sheet ─────────────────────────────────────────────────────────────

function NamingSheet({ breed, onSave }: { breed: string; onSave: (name: string) => void }) {
  const [name, setName] = useState('')
  return (
    <div className="px-6 pt-4 pb-8 flex flex-col gap-4">
      <p className="text-[16px] font-700 text-t1">What will you name your new {breed}?</p>
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Enter a name…"
        maxLength={40}
        className="rounded-xl border border-[var(--border-s)] bg-[var(--elev)] h-[44px] px-4 text-t1 text-[15px] focus:outline-none focus:border-[var(--blue)]"
        autoFocus
      />
      <Button
        variant="accent"
        size="lg"
        className="w-full"
        disabled={!name.trim()}
        onClick={() => onSave(name.trim())}
      >
        Save name
      </Button>
    </div>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function MarketplaceScreen() {
  const { coins, canAfford } = useWallet()
  const { pets, renamePet } = useSavedNames()
  const {
    offers,
    refreshOffers,
    acceptBuyOffer,
    acceptSellOffer,
    declineOffer,
  } = useMarketplace()
  const { toast } = useToast()

  const location = useLocation()
  // Support navigation with state: { tab: 'listings' } from ForSaleReleaseBlockModal
  const initialTab: Tab =
    (location.state as { tab?: Tab } | null)?.tab === 'listings' ? 'listings' : 'browse'

  const [tab, setTab] = useState<Tab>(initialTab)
  const [selected, setSelected] = useState<MarketOffer | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Naming sheet state — stores new pet id + breed after purchase
  const [namingPet, setNamingPet] = useState<{ id: number; breed: string } | null>(null)

  useEffect(() => {
    setIsRefreshing(true)
    refreshOffers().finally(() => setIsRefreshing(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const buyOffers = offers.filter(o => o.type === 'buy')
  const sellOffers = offers.filter(o => o.type === 'sell')

  // Tab switcher — inline-flex, compact, in PageHeader centre slot per spec PL-5
  const tabSwitcher = (
    <div
      style={{
        display: 'inline-flex',
        background: 'var(--card)',
        border: '1px solid var(--border-s)',
        borderRadius: 100,
        padding: 4,
        gap: 2,
      }}
    >
      <button
        key="browse"
        onClick={() => setTab('browse')}
        style={{
          borderRadius: 100,
          padding: '8px 16px',
          fontWeight: 600,
          fontSize: 13,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          transition: 'all .2s',
          ...(tab === 'browse'
            ? { background: 'var(--elev)', color: 'var(--t1)' }
            : { background: 'transparent', color: 'var(--t3)' }),
        }}
      >
        Browse
      </button>
      <button
        key="listings"
        onClick={() => setTab('listings')}
        style={{
          borderRadius: 100,
          padding: '8px 16px',
          fontWeight: 600,
          fontSize: 13,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          transition: 'all .2s',
          ...(tab === 'listings'
            ? { background: 'var(--elev)', color: 'var(--t1)' }
            : { background: 'transparent', color: 'var(--t3)' }),
        }}
      >
        <Tag size={16} />
        My Listings
      </button>
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-[var(--bg)]">
      <PageHeader
        title="Marketplace"
        trailing={<CoinDisplay amount={coins} />}
        centre={tabSwitcher}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'browse' ? (
          <div className="px-6 pt-4 pb-24">
            <div className="max-w-3xl mx-auto w-full flex flex-col gap-6">
            {buyOffers.length > 0 && (
              <div>
                <p className="text-[11px] font-700 uppercase tracking-widest text-t3 mb-3">NPCs looking to buy</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {buyOffers.map(o => <OfferCard key={o.id} offer={o} onTap={() => setSelected(o)} />)}
                </div>
              </div>
            )}
            {sellOffers.length > 0 && (
              <div>
                <p className="text-[11px] font-700 uppercase tracking-widest text-t3 mb-3">Animals for sale</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {sellOffers.map(o => <OfferCard key={o.id} offer={o} onTap={() => setSelected(o)} />)}
                </div>
              </div>
            )}
            {offers.length === 0 && !isRefreshing && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Store size={48} className="text-t3" />
                <p className="text-[17px] font-600 text-t1">Market is quiet</p>
                <p className="text-[14px] text-t2">New offers arrive daily</p>
              </div>
            )}
            {isRefreshing && offers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 size={32} className="text-t3 animate-spin" />
                <p className="text-[14px] text-t2">Loading offers…</p>
              </div>
            )}
            </div>
          </div>
        ) : (
          <MyListingsTab />
        )}
      </div>

      {/* Naming sheet — opened after a successful purchase */}
      <BottomSheet
        isOpen={!!namingPet}
        onClose={() => {}}
        title={namingPet ? `Name your ${namingPet.breed}` : undefined}
      >
        {namingPet && (
          <NamingSheet
            breed={namingPet.breed}
            onSave={async (name) => {
              await renamePet(namingPet.id, name)
              setNamingPet(null)
              toast({ type: 'success', title: `Welcome, ${name}!` })
            }}
          />
        )}
      </BottomSheet>

      {/* Offer detail sheet */}
      <BottomSheet isOpen={!!selected} onClose={() => setSelected(null)} title={selected ? `${selected.breed} ${selected.animalType}` : undefined}>
        {selected?.type === 'buy' ? (
          <BuyOfferSheet
            offer={selected}
            pets={pets}
            canAfford={canAfford(selected.price)}
            onAccept={async (pet) => {
              const ok = await acceptBuyOffer(selected.id!, pet)
              if (ok) {
                toast({ type: 'success', title: `Sold ${pet.name} for ${selected.price} coins` })
                setSelected(null)
              } else {
                toast({ type: 'error', title: 'Sale failed' })
              }
            }}
            onDecline={async () => {
              await declineOffer(selected.id!)
              toast({ type: 'info', title: 'Offer declined' })
              setSelected(null)
            }}
            onClose={() => setSelected(null)}
          />
        ) : selected?.type === 'sell' ? (
          <SellOfferSheet
            offer={selected}
            canAfford={canAfford(selected.price)}
            onBuy={async () => {
              const breedForNaming = selected.breed
              const ok = await acceptSellOffer(selected.id!)
              if (ok) {
                setSelected(null)
                // Find the pet just added (name is '' — naming pending)
                const newPet = pets.find(p => p.name === '')
                if (newPet?.id) {
                  setNamingPet({ id: newPet.id, breed: breedForNaming })
                } else {
                  toast({ type: 'success', title: `You bought a ${breedForNaming}!` })
                }
              } else {
                toast({ type: 'error', title: 'Not enough coins' })
              }
            }}
            onDecline={async () => {
              await declineOffer(selected.id!)
              toast({ type: 'info', title: 'Offer declined' })
              setSelected(null)
            }}
          />
        ) : null}
      </BottomSheet>
    </div>
  )
}
