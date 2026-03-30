// StoreHubScreen — unified Store hub with Marketplace, Items, Cards, and Auctions tabs
// Replaces ShopScreen at /shop route

import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, type Transition, type TargetAndTransition } from 'framer-motion'
import {
  Coins, Loader2, Store, CreditCard, Package, Backpack, Crown,
  PackageCheck, ShoppingBag, Sparkles, Zap,
  Wind, Link, Layers, Footprints, Dumbbell, Shield, FlaskConical,
  Home, Star, Settings, X,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { CoinDisplay } from '@/components/ui/CoinDisplay'
import { Badge, RarityBadge } from '@/components/ui/Badge'
import { AnimalImage } from '@/components/ui/AnimalImage'
import { BottomSheet } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useWallet } from '@/hooks/useWallet'
import { useItemShop } from '@/hooks/useItemShop'
import { LEMIEUX_ITEMS, LEMIEUX_DISPLAY_CATEGORIES } from '@/data/lemieux'
import type { LeMieuxItem } from '@/data/lemieux'
import { useMarketplace } from '@/hooks/useMarketplace'
import { useCardPacks, PACK_DEFS, type OpenedCard } from '@/hooks/useCardPacks'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useSavedNames } from '@/hooks/useSavedNames'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'
import type { MarketOffer, SavedName, PlayerListing, NpcBuyerOffer, RescueMission, Rarity } from '@/lib/db'
import { db } from '@/lib/db'
import { useLiveQuery } from 'dexie-react-hooks'
import { AuctionHubScreen, AuctionFilterRow } from '@/screens/AuctionHubScreen'
import { RescueTab } from '@/components/store/RescueTab'
import { MissionBriefSheet } from '@/components/store/MissionBriefSheet'
import { WorldMapView } from '@/components/cards/WorldMapView'
import { useAuctions } from '@/hooks/useAuctions'
import { useRescueMissions } from '@/hooks/useRescueMissions'
import { ListingRetractModal } from '@/components/my-animals/ListingRetractModal'

// ─── Tab types ────────────────────────────────────────────────────────────────

type MainTab = 'marketplace' | 'items' | 'cards'
type MarketTab = 'market' | 'for_sale' | 'rescue' | 'auctions'
type CardsTab = 'packs' | 'collection' | 'map'

// Segmented control button style — shared by all sub-tab controls
function segBtn(active: boolean): React.CSSProperties {
  return {
    borderRadius: 100,
    padding: '8px 0',
    fontWeight: 600,
    fontSize: 13,
    border: 'none',
    cursor: 'pointer',
    ...(active
      ? { background: 'var(--elev)', color: 'var(--t1)' }
      : { background: 'transparent', color: 'var(--t3)' }
    ),
  }
}

const SEG_CONTAINER: React.CSSProperties = {
  display: 'grid',
  background: 'var(--card)',
  border: '1px solid var(--border-s)',
  borderRadius: 100,
  padding: 4,
}

// ─── Items: LeMieux category definitions ──────────────────────────────────────

type LeMieuxFilter = 'all' | string

const LEMIEUX_FILTERS: { key: LeMieuxFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  ...LEMIEUX_DISPLAY_CATEGORIES.map(c => ({ key: c.slug, label: c.label })),
]

// ─── Items: category icon/tint maps ───────────────────────────────────────────

const LEMIEUX_CATEGORY_ICON: Record<string, React.ReactNode> = {
  'fly-hoods':             <Wind         size={32} strokeWidth={2} aria-hidden="true" />,
  'headcollars-leadropes': <Link         size={32} strokeWidth={2} aria-hidden="true" />,
  'horse-rugs':            <Layers       size={32} strokeWidth={2} aria-hidden="true" />,
  'boots-bandages':        <Footprints   size={32} strokeWidth={2} aria-hidden="true" />,
  'saddlery-tack':         <Dumbbell     size={32} strokeWidth={2} aria-hidden="true" />,
  'fly-protection':        <Shield       size={32} strokeWidth={2} aria-hidden="true" />,
  'grooming-care':         <Star         size={32} strokeWidth={2} aria-hidden="true" />,
  'stable-yard':           <Home         size={32} strokeWidth={2} aria-hidden="true" />,
  'supplements':           <FlaskConical size={32} strokeWidth={2} aria-hidden="true" />,
  'hobby-horse':           <Star         size={32} strokeWidth={2} aria-hidden="true" />,
}

const LEMIEUX_WELL_BG: Record<string, string> = {
  'fly-hoods':             'var(--blue-sub)',
  'headcollars-leadropes': 'var(--amber-sub)',
  'horse-rugs':            'var(--purple-sub)',
  'boots-bandages':        'var(--green-sub)',
  'saddlery-tack':         'var(--amber-sub)',
  'fly-protection':        'var(--blue-sub)',
  'grooming-care':         'var(--green-sub)',
  'stable-yard':           'var(--pink-sub)',
  'supplements':           'var(--purple-sub)',
  'hobby-horse':           'var(--pink-sub)',
}

const LEMIEUX_ICON_COLOR: Record<string, string> = {
  'fly-hoods':             'var(--blue-t)',
  'headcollars-leadropes': 'var(--amber-t)',
  'horse-rugs':            'var(--purple-t)',
  'boots-bandages':        'var(--green-t)',
  'saddlery-tack':         'var(--amber-t)',
  'fly-protection':        'var(--blue-t)',
  'grooming-care':         'var(--green-t)',
  'stable-yard':           'var(--pink-t)',
  'supplements':           'var(--purple-t)',
  'hobby-horse':           'var(--pink-t)',
}

// ─── Items: LeMieuxItemCard ────────────────────────────────────────────────────

function LeMieuxItemCard({ item, ownedCount, isEquipped, canAfford, onTap }: {
  item: LeMieuxItem
  ownedCount: number
  isEquipped: boolean
  canAfford: boolean
  onTap: () => void
}) {
  const [imgError, setImgError] = useState(false)
  const showIcon = !item.imageUrl || imgError
  const wellBg = LEMIEUX_WELL_BG[item.urlSlug] ?? 'var(--elev)'
  const iconColor = LEMIEUX_ICON_COLOR[item.urlSlug] ?? 'var(--t4)'

  return (
    <button
      onClick={onTap}
      aria-label={`${item.name}, ${item.displayCategory}, ${item.price} coins${ownedCount > 0 ? ', owned' : ''}`}
      className={cn(
        'w-full text-left rounded-[16px] border border-[var(--border-s)] bg-[var(--card)] p-3',
        'flex flex-col gap-2 transition-all duration-300',
        'hover:border-[var(--border)] motion-safe:hover:-translate-y-0.5',
        'hover:shadow-[0_4px_24px_rgba(0,0,0,.25)]',
        'motion-safe:active:scale-[.97] focus-visible:outline-2',
        'focus-visible:outline-[var(--blue)] focus-visible:outline-offset-2',
      )}
    >
      {/* Image well */}
      <div className="relative w-full aspect-square rounded-[12px] overflow-hidden">
        {showIcon ? (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: wellBg }}
          >
            <span aria-hidden="true" style={{ color: iconColor }}>
              {LEMIEUX_CATEGORY_ICON[item.urlSlug] ?? <ShoppingBag size={32} strokeWidth={2} />}
            </span>
          </div>
        ) : (
          <img
            src={item.imageUrl!}
            alt={item.name}
            className="w-full h-full object-cover object-center"
            onError={() => setImgError(true)}
          />
        )}
        {ownedCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.5px] bg-[var(--green-sub)] text-[var(--green-t)]"
          >
            {ownedCount === 1 ? 'OWNED' : `${ownedCount}×`}
          </span>
        )}
        {isEquipped && (
          <span
            aria-hidden="true"
            className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.5px] bg-[var(--blue-sub)] text-[var(--blue-t)]"
          >
            EQUIPPED
          </span>
        )}
      </div>

      {/* Text info */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[13px] font-semibold text-[var(--t1)] leading-snug line-clamp-2">
          {item.name}
        </span>
        <span className="text-[11px] font-medium tracking-[0.5px] text-[var(--t3)] uppercase">
          {item.displayCategory}
        </span>
      </div>

      {/* Price */}
      <div className={cn(
        'flex items-center gap-1 text-[13px] font-bold',
        canAfford ? 'text-[var(--amber-t)]' : 'text-[var(--t4)]',
      )}>
        <Coins
          size={14}
          strokeWidth={2}
          aria-hidden="true"
          style={{ color: canAfford ? 'var(--amber)' : 'var(--t4)' }}
        />
        {item.price}
      </div>
    </button>
  )
}

// ─── Items: LeMieuxPurchaseSheet ──────────────────────────────────────────────

function LeMieuxPurchaseSheet({ item, ownedCount, canAfford, coins, onBuy, onClose }: {
  item: LeMieuxItem
  ownedCount: number
  canAfford: boolean
  coins: number
  onBuy: () => Promise<void>
  onClose: () => void
}) {
  const [buying, setBuying] = useState(false)
  const [imgError, setImgError] = useState(false)
  const showIcon = !item.imageUrl || imgError
  const wellBg = LEMIEUX_WELL_BG[item.urlSlug] ?? 'var(--elev)'
  const iconColor = LEMIEUX_ICON_COLOR[item.urlSlug] ?? 'var(--t4)'

  const slotLabel = item.slot
    ? { head: 'Head slot', bridle: 'Bridle slot', body: 'Body / Rug slot', saddle: 'Saddle slot', legs: 'Leg boots (×4)' }[item.slot]
    : 'Collection only'

  async function handleBuy() {
    setBuying(true)
    await onBuy()
    setBuying(false)
  }

  return (
    <div className="px-6 pt-4 pb-8 flex flex-col gap-5">
      {/* Header row */}
      <div className="flex items-center gap-4">
        <div
          className="w-[60px] h-[60px] rounded-[10px] overflow-hidden shrink-0"
          style={{ background: showIcon ? wellBg : undefined }}
        >
          {showIcon ? (
            <div className="w-full h-full flex items-center justify-center">
              <span aria-hidden="true" style={{ color: iconColor }}>
                {LEMIEUX_CATEGORY_ICON[item.urlSlug] ?? <ShoppingBag size={28} strokeWidth={2} />}
              </span>
            </div>
          ) : (
            <img
              src={item.imageUrl!}
              alt={item.name}
              className="w-full h-full object-cover object-center"
              onError={() => setImgError(true)}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[18px] font-bold text-[var(--t1)] leading-snug">{item.name}</div>
          <div className="text-[12px] font-medium text-[var(--t3)] uppercase tracking-[0.5px] mt-0.5">
            {item.displayCategory}
          </div>
        </div>
      </div>

      {item.description && (
        <p className="text-[14px] text-[var(--t2)] leading-relaxed">{item.description}</p>
      )}

      {/* Info rows */}
      <div className="rounded-[12px] bg-[var(--elev)] p-4 flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-[var(--t3)] mb-1">Category</div>
          <div className="text-[14px] font-semibold text-[var(--t1)]">{item.displayCategory}</div>
        </div>
        <div className="text-right">
          <div className="text-[11px] font-bold uppercase tracking-widest text-[var(--t3)] mb-1">Equips to</div>
          <div className="text-[14px] font-semibold text-[var(--t1)]">{slotLabel}</div>
        </div>
        <div className="text-right">
          <div className="text-[11px] font-bold uppercase tracking-widest text-[var(--t3)] mb-1">Owned</div>
          <div className="text-[14px] font-semibold text-[var(--t1)]">{ownedCount}</div>
        </div>
      </div>

      {/* Buy row */}
      <div className="flex items-center gap-3">
        <div className="flex-1 rounded-[12px] bg-[var(--amber-sub)] px-4 py-3 text-center">
          <span className="flex items-center justify-center gap-1 text-[20px] font-bold text-[var(--amber-t)]">
            <Coins size={18} aria-hidden="true" /> {item.price}
          </span>
        </div>
        <Button
          variant="accent"
          size="lg"
          className="flex-1"
          onClick={handleBuy}
          disabled={!canAfford || buying}
        >
          {buying ? 'Buying…' : canAfford ? 'Buy' : 'Not enough coins'}
        </Button>
      </div>
      {!canAfford && (
        <p className="text-[12px] text-[var(--t3)] text-center">
          You have {coins} coins but this costs {item.price}. You're short {item.price - coins}!
        </p>
      )}
    </div>
  )
}

// ─── Marketplace: OfferCard ────────────────────────────────────────────────────

function OfferCard({ offer, onTap }: { offer: MarketOffer; onTap: () => void }) {
  const isBuy = offer.type === 'buy'
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
          <span className="flex items-center gap-1 text-[15px] font-700 text-[var(--amber-t)]">
            <Coins size={13} /> {offer.price}
          </span>
        </div>
      </div>
    </button>
  )
}

// ─── Marketplace: BuyOfferSheet ────────────────────────────────────────────────

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

  const matching = pets.filter(p =>
    p.animalType === offer.animalType || p.breed === offer.breed
  )

  return (
    <div className="px-6 pt-4 pb-8 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <AnimalImage src={offer.imageUrl} alt={offer.breed} className="w-16 h-16 rounded-xl object-cover shrink-0" />
        <div>
          <div className="text-[16px] font-700 text-t1">{offer.breed} {offer.animalType}</div>
          <div className="flex items-center gap-1 text-[13px] text-t2">
            {offer.npcName} wants to buy · <Coins size={12} /> {offer.price}
          </div>
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

      <Button
        variant="outline"
        size="md"
        className="w-full"
        onClick={async () => { setBusy(true); await onDecline(); setBusy(false) }}
        disabled={busy}
      >
        Decline offer
      </Button>
    </div>
  )
}

// ─── Marketplace: SellOfferSheet ──────────────────────────────────────────────

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
        <span className="flex items-center gap-1 text-[20px] font-700 text-[var(--amber-t)]">
          <Coins size={18} /> {offer.price}
        </span>
      </div>

      <Button
        variant="accent"
        size="lg"
        className="w-full"
        disabled={!canAfford || busy}
        onClick={async () => { setBusy(true); await onBuy(); setBusy(false) }}
      >
        {busy ? 'Buying…' : canAfford
          ? <span className="flex items-center gap-1.5">Buy for <Coins size={13} /> {offer.price}</span>
          : 'Not enough coins'
        }
      </Button>
      <Button variant="outline" size="md" className="w-full" onClick={onDecline} disabled={busy}>
        Pass
      </Button>
    </div>
  )
}

// ─── Marketplace: MyListings ───────────────────────────────────────────────────

function MyListings({ listings, npcOffers, pets, onList, onCancel, onAcceptOffer, onDeclineOffer, canAfford }: {
  listings: PlayerListing[]
  npcOffers: NpcBuyerOffer[]
  pets: SavedName[]
  onList: (pet: SavedName, price: number) => Promise<void>
  onCancel: (listingId: number) => Promise<void>
  onAcceptOffer: (id: number) => Promise<void>
  onDeclineOffer: (id: number) => Promise<void>
  canAfford: (n: number) => boolean
}) {
  const [listingPet, setListingPet] = useState<SavedName | null>(null)
  const [price, setPrice] = useState('')
  const [busy, setBusy] = useState(false)
  // auction-retract: state for the ListingRetractModal triggered from listing cards
  const [retractTarget, setRetractTarget] = useState<{ listing: PlayerListing; pet: SavedName & { id: number } } | null>(null)
  const cancelBtnRefs = useRef<Record<number, HTMLButtonElement | null>>({})

  const available = pets.filter(p => p.status === 'active')

  return (
    <div className="flex flex-col gap-4">
      {/* NPC offers on my listings */}
      {npcOffers.length > 0 && (
        <div>
          <p className="text-[11px] font-700 uppercase tracking-widest text-t3 mb-3">Offers received</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {npcOffers.map(offer => (
              <div key={offer.id} className="rounded-xl border border-[var(--amber)] bg-[var(--amber-sub)] p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-[14px] font-700 text-t1">{offer.npcName}</div>
                    <div className="text-[12px] text-t2">{offer.message}</div>
                  </div>
                  <span className="flex items-center gap-1 text-[15px] font-700 text-[var(--amber-t)]">
                    <Coins size={13} /> {offer.offerPrice}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="accent" size="md" className="flex-1" onClick={() => onAcceptOffer(offer.id!)}>
                    Accept
                  </Button>
                  <Button variant="outline" size="md" className="flex-1" onClick={() => onDeclineOffer(offer.id!)}>
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active listings */}
      {listings.length > 0 && (
        <div>
          <p className="text-[11px] font-700 uppercase tracking-widest text-t3 mb-3">Active listings</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {listings.map(listing => {
              const listingPetData = pets.find(p => p.id === listing.petId)
              return (
                <div key={listing.id} className="relative rounded-xl border border-[var(--border-s)] bg-[var(--card)] p-4 flex items-center gap-3">
                  <AnimalImage src={listing.imageUrl} alt={listing.petName} className="w-12 h-12 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-600 text-t1 truncate">{listing.petName}</div>
                    <div className="flex items-center gap-1 text-[12px] text-[var(--amber-t)]">
                      <Coins size={11} /> {listing.askingPrice}
                    </div>
                  </div>
                  {/* Cancel icon button — 32px circle, 44×44px touch target via padding
                      Only on My Listings tab (not Browse) per spec Story 2 AC */}
                  <button
                    ref={el => { cancelBtnRefs.current[listing.id!] = el }}
                    onClick={() => {
                      if (listingPetData?.id != null) {
                        setRetractTarget({
                          listing,
                          pet: listingPetData as SavedName & { id: number },
                        })
                      }
                    }}
                    aria-label={`Cancel listing for ${listing.petName}`}
                    className={cn(
                      // 32px visible circle, 44×44px hit area via padding
                      'flex items-center justify-center w-8 h-8 rounded-full shrink-0',
                      'transition-colors duration-150 active:scale-[.97]',
                      'focus-visible:outline-2 focus-visible:outline-[var(--blue)] focus-visible:outline-offset-2',
                      'hover:bg-[var(--elev)] hover:border-[var(--border)] [&:hover_svg]:text-[var(--t1)]',
                    )}
                    style={{
                      background: 'var(--card)',
                      border: '1px solid var(--border-s)',
                      // Extend hit area to 44×44px with negative margin compensation
                      padding: '6px',
                      margin: '-6px',
                    }}
                  >
                    <X size={14} strokeWidth={2} className="text-[var(--t3)]" aria-hidden="true" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* auction-retract: ListingRetractModal triggered from listing card cancel button */}
      {retractTarget != null && (
        <ListingRetractModal
          listingId={retractTarget.listing.id!}
          pet={retractTarget.pet}
          isOpen={retractTarget != null}
          onClose={() => {
            const id = retractTarget.listing.id!
            setRetractTarget(null)
            // Return focus to the cancel button for this listing
            setTimeout(() => cancelBtnRefs.current[id]?.focus(), 50)
          }}
          onSuccess={() => setRetractTarget(null)}
        />
      )}

      {/* List a pet */}
      <div>
        <p className="text-[11px] font-700 uppercase tracking-widest text-t3 mb-3">List a pet for sale</p>
        {available.length === 0 ? (
          <p className="text-[13px] text-t3">No pets available to list.</p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {available.map(pet => (
                <button
                  key={pet.id}
                  onClick={() => setListingPet(pet)}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border transition-colors text-left',
                    listingPet?.id === pet.id
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

            {listingPet && (
              <div className="flex gap-2">
                <input
                  type="number"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="Asking price (coins)"
                  className="flex-1 rounded-xl border border-[var(--border-s)] bg-[var(--elev)] text-t1 px-4 py-3 text-[14px] focus:outline-none focus:border-[var(--blue)]"
                />
                <Button
                  variant="primary"
                  size="md"
                  disabled={!price || Number(price) <= 0 || busy}
                  onClick={async () => {
                    setBusy(true)
                    await onList(listingPet, Number(price))
                    setListingPet(null)
                    setPrice('')
                    setBusy(false)
                  }}
                >
                  {busy ? '…' : 'List'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Marketplace: NamingSheet ──────────────────────────────────────────────────

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

// ─── Marketplace content ──────────────────────────────────────────────────────

// MarketplaceContent receives marketTab as a prop — it does NOT render its own tab
// control. The tab row lives exclusively in the PageHeader below slot (spec §1.2,
// dual navigation prevention). Any tab UI inside this component is a build defect.
function MarketplaceContent({ marketTab, searchQuery = '', onClearSearch, missions, onStartMission = () => {}, onClaimMission = () => {} }: {
  marketTab: MarketTab
  searchQuery?: string
  onClearSearch?: () => void
  missions: RescueMission[]
  onStartMission?: (id: number) => Promise<void>
  onClaimMission?: (id: number) => Promise<void>
}) {
  const { coins, canAfford } = useWallet()
  const { pets, renamePet } = useSavedNames()
  const {
    offers, listings, npcOffers,
    refreshOffers,
    acceptBuyOffer, acceptSellOffer, declineOffer,
    createListing, cancelListing,
    acceptNpcBuyerOffer, declineNpcBuyerOffer,
  } = useMarketplace()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [selected, setSelected] = useState<MarketOffer | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [namingPet, setNamingPet] = useState<{ id: number; breed: string } | null>(null)
  // activeMission — drives MissionBriefSheet open state for the rescue tab
  const [activeMission, setActiveMission] = useState<RescueMission | null>(null)

  useEffect(() => {
    setIsRefreshing(true)
    refreshOffers().finally(() => setIsRefreshing(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const buyOffers = offers.filter(o => o.type === 'buy')
  const allSellOffers = offers.filter(o => o.type === 'sell')

  // When arriving via "Find in Marketplace" from the animal detail modal, searchQuery
  // contains the animal's name. We filter sell offers by breed or animalType match.
  // Buy offers (NPCs looking to buy from Harry) are not filtered — they are always shown.
  const q = searchQuery.trim().toLowerCase()
  const sellOffers = q
    ? allSellOffers.filter(o =>
        o.breed.toLowerCase().includes(q) || o.animalType.toLowerCase().includes(q)
      )
    : allSellOffers

  return (
    <>
      {/* market tab — NPC offers (replaces old 'browse') */}
      {marketTab === 'market' && (
        <div className="flex flex-col gap-6 mt-2">
          {/* Search context banner — shown when arriving from "Find in Marketplace" */}
          {q && (
            <div
              className="flex items-center justify-between rounded-[var(--r-md)] px-4 py-3"
              style={{ background: 'var(--blue-sub)', border: '1px solid var(--blue)' }}
            >
              <span className="text-[13px] font-semibold" style={{ color: 'var(--blue-t)' }}>
                Showing results for "{searchQuery}"
              </span>
              <button
                onClick={onClearSearch}
                className="text-[12px] font-semibold underline"
                style={{ color: 'var(--blue-t)' }}
              >
                Clear
              </button>
            </div>
          )}
          {!q && buyOffers.length > 0 && (
            <div>
              <p className="text-[11px] font-700 uppercase tracking-widest text-t3 mb-3">NPCs looking to buy</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {buyOffers.map(o => <OfferCard key={o.id} offer={o} onTap={() => setSelected(o)} />)}
              </div>
            </div>
          )}
          {/* No results for search query */}
          {q && sellOffers.length === 0 && !isRefreshing && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Store size={48} style={{ color: 'var(--t4)' }} />
              <p className="text-[17px] font-semibold" style={{ color: 'var(--t1)' }}>
                No {searchQuery} for sale today
              </p>
              <p className="text-[14px]" style={{ color: 'var(--t2)' }}>
                New offers arrive daily — check back tomorrow
              </p>
              <button
                onClick={onClearSearch}
                className="text-[13px] font-semibold underline mt-1"
                style={{ color: 'var(--blue-t)' }}
              >
                Browse all animals
              </button>
            </div>
          )}
          {/* General empty state */}
          {!q && offers.length === 0 && !isRefreshing && (
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
      )}

      {/* for_sale tab — NPC sell offers + player listings */}
      {marketTab === 'for_sale' && (
        <div className="mt-2 flex flex-col gap-6">
          {/* NPC animals for sale */}
          {sellOffers.length > 0 && (
            <div>
              <p className="text-[11px] font-700 uppercase tracking-widest text-t3 mb-3">Animals for sale</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {sellOffers.map(o => <OfferCard key={o.id} offer={o} onTap={() => setSelected(o)} />)}
              </div>
            </div>
          )}
          <MyListings
            listings={listings}
            npcOffers={npcOffers}
            pets={pets}
            onList={async (pet, price) => {
              await createListing(pet, price)
              toast({ type: 'success', title: `${pet.name} listed for ${price} coins` })
            }}
            onCancel={async (id) => {
              await cancelListing(id)
              toast({ type: 'info', title: 'Listing removed' })
            }}
            onAcceptOffer={async (id) => {
              const ok = await acceptNpcBuyerOffer(id)
              if (ok) toast({ type: 'success', title: 'Sale complete!' })
              else toast({ type: 'error', title: 'Offer could not be accepted' })
            }}
            onDeclineOffer={async (id) => {
              await declineNpcBuyerOffer(id)
              toast({ type: 'info', title: 'Offer declined' })
            }}
            canAfford={canAfford}
          />
        </div>
      )}

      {/* rescue tab — rescue mission card grid */}
      {marketTab === 'rescue' && (
        <>
          <RescueTab
            missions={missions}
            onStartMission={(id) => {
              const m = missions.find(m => m.id === id) ?? null
              setActiveMission(m)
            }}
            onGoToWorldMap={() => navigate('/world-quest')}
          />
          <MissionBriefSheet
            mission={activeMission}
            onClose={() => setActiveMission(null)}
            onBegin={async (id) => {
              await onStartMission(id)
              setActiveMission(null)
            }}
            onClaim={async (id) => {
              await onClaimMission(id)
              setActiveMission(null)
            }}
          />
        </>
      )}

      {/* Naming sheet */}
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
      <BottomSheet
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.breed} ${selected.animalType}` : undefined}
      >
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
    </>
  )
}

// ─── Items content — LeMieux catalogue ───────────────────────────────────────

function ItemsContent({ filter }: { filter: LeMieuxFilter }) {
  const { coins, canAfford } = useWallet()
  const { countOwned, ownedLeMieuxIds, buyLeMieuxItem, ownedItems } = useItemShop()
  const { toast } = useToast()

  const [selected, setSelected] = useState<LeMieuxItem | null>(null)

  const filtered = filter === 'all'
    ? LEMIEUX_ITEMS
    : LEMIEUX_ITEMS.filter(d => d.urlSlug === filter)

  // Determine which items are currently equipped to any pet
  const equippedIds = new Set(
    ownedItems
      .filter(i => i.lemieuxItemId != null && i.equippedToPetId != null)
      .map(i => i.lemieuxItemId as string),
  )

  async function handleBuy() {
    if (!selected) return
    try {
      await buyLeMieuxItem(selected)
      toast({ type: 'success', title: 'Added to your collection' })
      setSelected(null)
    } catch {
      toast({ type: 'error', title: 'Could not complete purchase. Please try again.' })
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
        {filtered.map(item => (
          <LeMieuxItemCard
            key={item.id}
            item={item}
            ownedCount={countOwned(item.id)}
            isEquipped={equippedIds.has(item.id)}
            canAfford={canAfford(item.price)}
            onTap={() => setSelected(item)}
          />
        ))}
      </div>

      <BottomSheet
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name}
      >
        {selected && (
          <LeMieuxPurchaseSheet
            item={selected}
            ownedCount={countOwned(selected.id)}
            canAfford={canAfford(selected.price)}
            coins={coins}
            onBuy={handleBuy}
            onClose={() => setSelected(null)}
          />
        )}
      </BottomSheet>
    </>
  )
}

// ─── Cards: pack icon constants ────────────────────────────────────────────────

const PACK_ICON: Record<string, React.ReactNode> = {
  starter:   <Package  size={28} className="text-[var(--blue-t)]"  />,
  adventure: <Backpack size={28} className="text-[var(--green-t)]" />,
  legendary: <Crown    size={28} className="text-[var(--amber-t)]" />,
}

const PACK_ICON_LARGE: Record<string, React.ReactNode> = {
  starter:   <Package  size={48} className="text-[var(--blue-t)]"  />,
  adventure: <Backpack size={48} className="text-[var(--green-t)]" />,
  legendary: <Crown    size={48} className="text-[var(--amber-t)]" />,
}

// ─── Cards: PackCard ───────────────────────────────────────────────────────────

function PackCard({ pack, canAfford, onBuy }: {
  pack: typeof PACK_DEFS[number]
  canAfford: boolean
  onBuy: () => void
}) {
  return (
    <div className="rounded-2xl border border-[var(--border-s)] bg-[var(--card)] p-5 flex flex-col gap-3">
      <div className="w-12 h-12 rounded-xl bg-[var(--elev)] flex items-center justify-center">
        {PACK_ICON[pack.id]}
      </div>
      <div>
        <div className="text-[17px] font-700 text-t1 mb-0.5">{pack.name}</div>
        <div className="text-[13px] text-t2">{pack.description}</div>
      </div>
      <Button variant="accent" size="md" className="w-full" onClick={onBuy} disabled={!canAfford}>
        <span className="flex items-center gap-1.5"><Coins size={13} /> {pack.price} — Open</span>
      </Button>
    </div>
  )
}

// ─── Cards: PackConfirmSheet ───────────────────────────────────────────────────

function PackConfirmSheet({ packId, coins, canAfford, onConfirm, onClose }: {
  packId: string | null
  coins: number
  canAfford: (amount: number) => boolean
  onConfirm: () => void
  onClose: () => void
}) {
  const pack = PACK_DEFS.find(p => p.id === packId)
  if (!pack) return null

  const affordable = canAfford(pack.price)

  return (
    <div className="max-w-3xl mx-auto w-full px-6 pb-8 pt-2">
      <div className="w-16 h-16 rounded-2xl bg-[var(--elev)] flex items-center justify-center mx-auto mb-4">
        {PACK_ICON_LARGE[pack.id] ?? <Package size={48} className="text-[var(--t3)]" />}
      </div>
      <p className="text-[22px] font-700 text-[var(--t1)] text-center mb-1">{pack.name}</p>
      <p className="text-[14px] text-[var(--t2)] text-center mb-5">{pack.description}</p>

      <div className="bg-[var(--elev)] rounded-xl p-3 flex items-start gap-2 mb-5">
        <PackageCheck size={16} className="text-[var(--t3)] shrink-0 mt-0.5" />
        <span className="text-[13px] text-[var(--t2)]">{pack.description}</span>
      </div>

      <div className="flex flex-col items-center mb-6">
        <div className="flex items-center gap-1.5">
          <Coins size={16} className={affordable ? 'text-[var(--amber-t)]' : 'text-[var(--red-t)]'} />
          <span
            className="text-[20px] font-700"
            style={{ color: affordable ? 'var(--amber-t)' : 'var(--red-t)' }}
          >
            {pack.price}
          </span>
        </div>
        <p
          className="text-[13px] mt-0.5"
          style={{ color: affordable ? 'var(--t3)' : 'var(--red-t)' }}
        >
          {affordable
            ? `You have ${coins} coins`
            : `You have ${coins} coins but this costs ${pack.price}. You're short ${pack.price - coins}!`}
        </p>
      </div>

      <Button
        variant="accent"
        size="lg"
        className="w-full"
        disabled={!affordable}
        icon={affordable ? <Coins size={16} /> : undefined}
        onClick={onConfirm}
      >
        {affordable ? 'Open Pack' : 'Not enough coins'}
      </Button>
    </div>
  )
}

// ─── Cards: rarity helpers ────────────────────────────────────────────────────

function rarityBorderColor(rarity: OpenedCard['rarity']): string {
  switch (rarity) {
    case 'legendary': return 'var(--amber)'
    case 'epic':      return 'var(--purple)'
    case 'rare':      return 'var(--blue)'
    case 'uncommon':  return 'var(--green)'
    default:          return 'var(--border)'
  }
}

type RarityTier = OpenedCard['rarity']
const RARITY_ORDER: RarityTier[] = ['common', 'uncommon', 'rare', 'epic', 'legendary']

function highestRarity(cards: OpenedCard[]): RarityTier {
  return cards.reduce<RarityTier>((best, card) => {
    return RARITY_ORDER.indexOf(card.rarity) > RARITY_ORDER.indexOf(best) ? card.rarity : best
  }, 'common')
}

// ─── Cards: rarity glow ───────────────────────────────────────────────────────

function RarityGlow({ rarity, reducedMotion }: { rarity: RarityTier; reducedMotion: boolean }) {
  if (rarity === 'common') return null

  const configs = {
    uncommon: {
      size: 280,
      gradient: 'radial-gradient(circle, rgba(69,178,107,0.18) 0%, transparent 70%)',
      initial: reducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 },
      animate: { opacity: 1, scale: 1 },
      transition: reducedMotion ? { duration: 0 } : { type: 'spring' as const, stiffness: 200, damping: 28, delay: 0.05 },
    },
    rare: {
      size: 320,
      gradient: 'radial-gradient(circle, rgba(55,114,255,0.22) 0%, transparent 65%)',
      initial: reducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 },
      animate: { opacity: 1, scale: 1 },
      transition: reducedMotion ? { duration: 0 } : { type: 'spring' as const, stiffness: 200, damping: 26, delay: 0.14 },
    },
    epic: {
      size: 340,
      gradient: 'radial-gradient(circle, rgba(151,87,215,0.25) 0%, transparent 60%)',
      initial: reducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.4 },
      animate: { opacity: 1, scale: 1 },
      transition: reducedMotion ? { duration: 0 } : { type: 'spring' as const, stiffness: 180, damping: 24, delay: 0.22 },
    },
    legendary: {
      size: 380,
      gradient: 'radial-gradient(circle, rgba(245,166,35,0.35) 0%, transparent 60%)',
      initial: reducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.3 },
      animate: { opacity: 1, scale: 1 },
      transition: reducedMotion ? { duration: 0 } : { type: 'spring' as const, stiffness: 160, damping: 22, delay: 0.3 },
    },
  }

  const cfg = configs[rarity as keyof typeof configs]
  if (!cfg) return null

  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: cfg.size,
        height: cfg.size,
        background: cfg.gradient,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 0,
      }}
      initial={cfg.initial}
      animate={cfg.animate}
      transition={cfg.transition}
    />
  )
}

function RareFlash({ reducedMotion }: { reducedMotion: boolean }) {
  if (reducedMotion) return null
  return createPortal(
    <motion.div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1101, background: 'rgba(55,114,255,0.12)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.12, 0] }}
      transition={{ duration: 0.35, ease: 'easeOut', times: [0, 0.3, 1] }}
    />,
    document.body,
  )
}

const RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315]

function LegendarySpectacle({ reducedMotion }: { reducedMotion: boolean }) {
  if (reducedMotion) return null
  return createPortal(
    <>
      <motion.div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 1099,
          background: 'radial-gradient(ellipse at center, rgba(245,166,35,0.22) 0%, transparent 65%)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.6] }}
        transition={{ duration: 0.8, ease: 'easeOut', times: [0, 0.4, 1] }}
      />
      <motion.div
        className="pointer-events-none"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1100,
          width: 0,
          height: 0,
        }}
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: [0, 0.8, 0], scaleY: [0, 1, 0.4] }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
      >
        {RAY_ANGLES.map(angle => (
          <div
            key={angle}
            style={{
              position: 'absolute',
              width: 2,
              height: 80,
              background: 'linear-gradient(to bottom, rgba(245,166,35,0.7), transparent)',
              borderRadius: 1,
              transformOrigin: 'bottom center',
              transform: `rotate(${angle}deg) translateY(-100%)`,
              bottom: 0,
              left: -1,
            }}
          />
        ))}
      </motion.div>
    </>,
    document.body,
  )
}

function EpicPulseRings({ reducedMotion }: { reducedMotion: boolean }) {
  if (reducedMotion) return null
  return (
    <>
      {[0, 0.15].map((delay, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 200,
            height: 200,
            background: 'rgba(151,87,215,0.15)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 0,
          }}
          initial={{ opacity: 0.6, scale: 0.3 }}
          animate={{ opacity: 0, scale: 1.8 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay }}
        />
      ))}
    </>
  )
}

// ─── Cards: RevealSummary ──────────────────────────────────────────────────────

function RevealSummary({ cards, canAffordAnother, reducedMotion, onOpenAnother, onDone }: {
  cards: OpenedCard[]
  canAffordAnother: boolean
  reducedMotion: boolean
  onOpenAnother: () => void
  onDone: () => void
}) {
  const best = highestRarity(cards)
  const showPill = best === 'legendary' || best === 'epic'

  return (
    <motion.div
      className="w-full h-full overflow-y-auto"
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <div className="max-w-3xl mx-auto w-full px-6 pt-12 flex flex-col items-center">
        <motion.h3
          className="text-[28px] font-semibold text-[var(--t1)] text-center mb-6"
          initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          Your cards!
        </motion.h3>

        {showPill && (
          <motion.div
            className="flex items-center gap-[5px] px-3 py-1 rounded-[100px] mb-8"
            style={{
              background: best === 'legendary' ? 'var(--amber-sub)' : 'var(--purple-sub)',
              color: best === 'legendary' ? 'var(--amber-t)' : 'var(--purple-t)',
              fontSize: 13,
              fontWeight: 600,
            }}
            initial={reducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 24, delay: 0.15 }}
          >
            {best === 'legendary'
              ? <Sparkles size={14} aria-hidden="true" />
              : <Zap size={14} aria-hidden="true" />
            }
            {best === 'legendary' ? 'Legendary find!' : 'Epic pull!'}
          </motion.div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full mb-6">
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              className="rounded-xl border-2 overflow-hidden bg-[var(--card)]"
              style={{ borderColor: rarityBorderColor(card.rarity) }}
              initial={reducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : { type: 'spring', stiffness: 300, damping: 26, delay: 0.1 + index * 0.08 }
              }
            >
              <div className="relative">
                <AnimalImage src={card.imageUrl} alt={card.name} className="w-full aspect-square object-cover" />
                {card.isNew && (
                  <div
                    className="absolute top-2 right-2 w-[6px] h-[6px] rounded-full"
                    style={{ background: 'var(--pink)' }}
                  />
                )}
              </div>
              <div className="p-2">
                <div className="text-[11px] font-semibold text-[var(--t1)] truncate mb-1">{card.name}</div>
                <RarityBadge rarity={card.rarity} />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col gap-3 w-full max-w-[300px] mx-auto pb-8">
          {canAffordAnother ? (
            <>
              <Button variant="accent" size="lg" className="w-full" icon={<ShoppingBag size={16} />} onClick={onOpenAnother}>
                Open Another Pack
              </Button>
              <Button variant="outline" size="lg" className="w-full" onClick={onDone}>
                Done
              </Button>
            </>
          ) : (
            <Button variant="primary" size="lg" className="w-full" onClick={onDone}>
              Done
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Cards: ConfettiBurst ─────────────────────────────────────────────────────

const CONFETTI_COLORS = [
  '#3772FF', '#E8247C', '#F5A623', '#45B26B', '#9757D7',
  '#6E9BFF', '#F06EAB', '#FCC76E', '#7DD69B', '#FCFCFD',
]

function ConfettiBurst({ reducedMotion }: { reducedMotion: boolean }) {
  const [particles] = useState(() =>
    Array.from({ length: 80 }, (_, i) => {
      const angle = Math.random() * 360
      const rad = (angle * Math.PI) / 180
      const dist = 250 + Math.random() * 350
      const isStreak = i % 3 === 0
      const w = isStreak ? 4 + Math.random() * 3 : 9 + Math.random() * 9
      const h = isStreak ? 18 + Math.random() * 22 : 9 + Math.random() * 9
      const gravity = 120 + Math.random() * 180
      return {
        id: i,
        tx: Math.cos(rad) * dist,
        ty: Math.sin(rad) * dist + gravity,
        w, h,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        duration: 1.6 + Math.random() * 1.0,
        delay: Math.random() * 0.18,
        rotate: Math.random() * 720 - 360,
        borderRadius: isStreak ? 2 : i % 2 === 0 ? '50%' : 3,
      }
    })
  )

  if (reducedMotion) return null

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none', overflow: 'hidden' }}>
      {particles.map(p => (
        <motion.div
          key={p.id}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: p.w,
            height: p.h,
            borderRadius: p.borderRadius,
            background: p.color,
            marginLeft: -p.w / 2,
            marginTop: -p.h / 2,
          }}
          initial={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
          animate={{
            opacity: [1, 1, 0],
            x: p.tx,
            y: p.ty,
            scale: [1, 1, 0.6],
            rotate: p.rotate,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'easeOut',
            opacity: { times: [0, 0.65, 1] },
            scale: { times: [0, 0.6, 1] },
          }}
        />
      ))}
    </div>,
    document.body,
  )
}

// ─── Cards: CardRevealStep ────────────────────────────────────────────────────

function CardRevealStep({ cards, revealed, reducedMotion, playedSweeps, onNext, onSeeAll }: {
  cards: OpenedCard[]
  revealed: number
  reducedMotion: boolean
  playedSweeps: React.MutableRefObject<Set<RarityTier>>
  onNext: () => void
  onSeeAll: () => void
}) {
  const card = cards[revealed]
  const isLast = revealed === cards.length - 1

  // Face-down state — starts false for each new card
  const [flipped, setFlipped] = useState(false)
  useEffect(() => { setFlipped(false) }, [revealed])

  const isFirstOfRarity = !playedSweeps.current.has(card.rarity)
  const effectiveRarity: RarityTier = isFirstOfRarity ? card.rarity : 'common'

  function handleFlip() {
    if (flipped) return
    // Register rarity sweep on flip, not on render
    if (isFirstOfRarity && (card.rarity === 'rare' || card.rarity === 'legendary')) {
      playedSweeps.current.add(card.rarity)
    }
    setFlipped(true)
  }

  const cardAnimConfig: Record<RarityTier, {
    initial: TargetAndTransition
    animate: TargetAndTransition
    exit: TargetAndTransition
    transition: Transition
  }> = {
    common: {
      initial: reducedMotion ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.88, y: 16 },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.92, y: -12 },
      transition: reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 26 },
    },
    uncommon: {
      initial: reducedMotion ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.85, y: 20 },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.92, y: -12 },
      transition: reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 24 },
    },
    rare: {
      initial: reducedMotion ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.82, y: 24 },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.92, y: -12 },
      transition: reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 280, damping: 22, delay: 0.12 },
    },
    epic: {
      initial: reducedMotion ? { opacity: 1, scale: 1, y: 0, rotateY: 0 } : { opacity: 0, scale: 0.78, y: 20, rotateY: 8 },
      animate: { opacity: 1, scale: 1, y: 0, rotateY: 0 },
      exit: reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.92, y: -12 },
      transition: reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 20, delay: 0.2 },
    },
    legendary: {
      initial: reducedMotion ? { opacity: 1, scale: 1, y: 0, rotateY: 0 } : { opacity: 0, scale: 0.70, y: 28, rotateY: 12 },
      animate: { opacity: 1, scale: 1, y: 0, rotateY: 0 },
      exit: reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.92, y: -12 },
      transition: reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 240, damping: 18, delay: 0.35 },
    },
  }

  const cfg = cardAnimConfig[effectiveRarity]
  const needs3d = (effectiveRarity === 'epic' || effectiveRarity === 'legendary') && !reducedMotion

  return (
    <motion.div
      className="w-full h-full flex flex-col items-center justify-center px-8 gap-6"
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <div className="flex gap-2" aria-hidden="true">
        {cards.map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{
              background: i <= revealed ? 'var(--blue)' : 'var(--border)',
              transition: 'background-color 200ms ease-out',
            }}
          />
        ))}
      </div>

      <div className="relative flex items-center justify-center w-full max-w-[320px]">
        {/* Rarity effects — only fire after flip */}
        {flipped && (
          <AnimatePresence>
            {effectiveRarity === 'rare' && isFirstOfRarity && (
              <RareFlash key={`rare-flash-${revealed}`} reducedMotion={reducedMotion} />
            )}
            {effectiveRarity === 'legendary' && isFirstOfRarity && (
              <LegendarySpectacle key={`legendary-spectacle-${revealed}`} reducedMotion={reducedMotion} />
            )}
          </AnimatePresence>
        )}
        {flipped && (
          <AnimatePresence>
            {effectiveRarity === 'epic' && isFirstOfRarity && (
              <EpicPulseRings key={`epic-pulse-${revealed}`} reducedMotion={reducedMotion} />
            )}
          </AnimatePresence>
        )}
        {flipped && (
          <AnimatePresence mode="wait">
            <RarityGlow key={`glow-${revealed}`} rarity={effectiveRarity} reducedMotion={reducedMotion} />
          </AnimatePresence>
        )}

        {/* Confetti burst — outside AnimatePresence to avoid interfering with card flip */}
        {flipped && <ConfettiBurst key={`confetti-${revealed}`} reducedMotion={reducedMotion} />}

        <AnimatePresence mode="wait">
          {!flipped ? (
            /* ── Card back — face down ── */
            <motion.button
              key={`back-${revealed}`}
              onClick={handleFlip}
              aria-label="Tap to reveal card"
              className="relative z-10 w-full rounded-2xl border-2 border-[var(--border-s)] bg-[var(--elev)] flex flex-col items-center justify-center gap-3 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--blue)]"
              style={{ aspectRatio: '3/4' }}
              initial={reducedMotion ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              exit={reducedMotion ? { opacity: 1 } : { opacity: 0, scaleX: 0 }}
              transition={{ duration: 0.15, ease: 'easeInOut' }}
            >
              <motion.div
                className="w-16 h-16 rounded-full flex items-center justify-center bg-[var(--blue-sub)]"
                animate={reducedMotion ? {} : { scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles size={28} className="text-[var(--blue-t)]" />
              </motion.div>
              <span className="text-[13px] font-600 text-t3">Tap to reveal</span>
            </motion.button>
          ) : (
            /* ── Card face — revealed ── */
            <div
              key={`perspective-${revealed}`}
              className="relative z-10 w-full"
              style={needs3d ? { perspective: '800px' } : undefined}
            >
              {effectiveRarity === 'legendary' && !reducedMotion ? (
                <motion.div
                  className="shimmer rounded-2xl p-[2px] w-full"
                  {...cfg}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <div className="rounded-2xl overflow-hidden bg-[var(--card)] w-full">
                    <AnimalImage src={card.imageUrl} alt={card.name} className="w-full aspect-square object-cover" />
                    <div className="p-4 flex items-center justify-between">
                      <div>
                        <div className="text-[15px] font-semibold text-[var(--t1)]">{card.name}</div>
                        {card.isNew && (
                          <div className="text-[11px] font-bold uppercase mt-0.5" style={{ letterSpacing: '1px', color: 'var(--pink-t)' }}>
                            New!
                          </div>
                        )}
                      </div>
                      <RarityBadge rarity={card.rarity} />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  className="w-full rounded-2xl border-2 overflow-hidden bg-[var(--card)]"
                  style={{
                    borderColor: rarityBorderColor(card.rarity),
                    ...(needs3d ? { transformStyle: 'preserve-3d' } : {}),
                  }}
                  {...cfg}
                >
                  <AnimalImage src={card.imageUrl} alt={card.name} className="w-full aspect-square object-cover" />
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <div className="text-[15px] font-semibold text-[var(--t1)]">{card.name}</div>
                      {card.isNew && (
                        <div className="text-[11px] font-bold uppercase mt-0.5" style={{ letterSpacing: '1px', color: 'var(--pink-t)' }}>
                          New!
                        </div>
                      )}
                    </div>
                    <RarityBadge rarity={card.rarity} />
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Button only appears after flip */}
      {flipped && (
        <Button variant="primary" size="lg" className="w-full max-w-[320px]" autoFocus onClick={isLast ? onSeeAll : onNext}>
          {isLast ? 'See All' : 'Next card'}
        </Button>
      )}
      <span className="text-[13px]" style={{ color: 'var(--t3)' }}>
        {revealed + 1} of {cards.length}
      </span>
    </motion.div>
  )
}

// ─── Cards: CardReveal overlay ─────────────────────────────────────────────────

type RevealPhase = 'reveal' | 'summary'

function CardReveal({ cards, canAfford, openedPackPrice, reducedMotion, onDone, onOpenAnother }: {
  cards: OpenedCard[]
  canAfford: (amount: number) => boolean
  openedPackPrice: number
  reducedMotion: boolean
  onDone: () => void
  onOpenAnother: () => void
}) {
  const [phase, setPhase] = useState<RevealPhase>('reveal')
  const [revealed, setRevealed] = useState(0)
  const playedSweeps = useRef<Set<RarityTier>>(new Set())

  const canAffordAnother = canAfford(openedPackPrice)

  return createPortal(
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Card reveal"
      className="fixed inset-0 z-[1100] flex flex-col overflow-hidden"
      style={{ background: 'rgba(13,13,17,0.96)' }}
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <AnimatePresence mode="wait">
        {phase === 'reveal' ? (
          <CardRevealStep
            key="reveal"
            cards={cards}
            revealed={revealed}
            reducedMotion={reducedMotion}
            playedSweeps={playedSweeps}
            onNext={() => setRevealed(r => r + 1)}
            onSeeAll={() => setPhase('summary')}
          />
        ) : (
          <RevealSummary
            key="summary"
            cards={cards}
            canAffordAnother={canAffordAnother}
            reducedMotion={reducedMotion}
            onOpenAnother={onOpenAnother}
            onDone={onDone}
          />
        )}
      </AnimatePresence>
    </motion.div>,
    document.body,
  )
}

// ─── Cards: CollectionGrid ────────────────────────────────────────────────────

function CollectionGrid({ cards }: { cards: ReturnType<typeof useCardPacks>['cards'] }) {
  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <CreditCard size={48} className="text-t3" />
        <p className="text-[17px] font-600 text-t1">No cards yet</p>
        <p className="text-[14px] text-t2">Open a pack to start your collection</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
      {cards.map(card => (
        <div
          key={card.id}
          className="rounded-2xl border overflow-hidden bg-[var(--card)]"
          style={{
            borderColor: card.rarity === 'legendary' ? 'var(--amber)' :
              card.rarity === 'epic' ? 'var(--purple)' :
              card.rarity === 'rare' ? 'var(--blue)' :
              card.rarity === 'uncommon' ? 'var(--green)' : 'var(--border-s)',
          }}
        >
          <AnimalImage src={card.imageUrl} alt={card.name} className="w-full aspect-square object-cover" />
          <div className="p-3">
            <div className="text-[13px] font-600 text-t1 mb-1 truncate">{card.name}</div>
            <div className="flex items-center justify-between">
              <RarityBadge rarity={card.rarity} />
              {card.duplicateCount > 0 && (
                <span className="text-[11px] text-t3">×{card.duplicateCount + 1}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Cards content ────────────────────────────────────────────────────────────

function CardsContent({ cardsTab, setCardsTab }: { cardsTab: CardsTab; setCardsTab: (t: CardsTab) => void }) {
  const { coins, canAfford } = useWallet()
  const { cards, totalCards, openPack } = useCardPacks()
  const reducedMotion = useReducedMotion()
  const { toast } = useToast()

  const [revealCards, setRevealCards] = useState<OpenedCard[] | null>(null)
  const [buying, setBuying] = useState<string | null>(null)
  const [confirmPack, setConfirmPack] = useState<string | null>(null)
  const lastOpenedPackId = useRef<string | null>(null)

  function handleOpenPack(packId: string) {
    if (buying) return
    setConfirmPack(packId)
  }

  async function handleConfirmOpen() {
    if (!confirmPack || buying) return
    const packId = confirmPack
    setConfirmPack(null)
    setBuying(packId)
    try {
      const result = await openPack(packId)
      if (!result.success) {
        toast({ type: 'error', title: result.reason ?? 'Failed to open pack' })
        return
      }
      lastOpenedPackId.current = packId
      setRevealCards(result.cards)
    } catch {
      toast({ type: 'error', title: 'Something went wrong opening the pack. Please try again.' })
    } finally {
      setBuying(null)
    }
  }

  function handleOpenAnother() {
    const packId = lastOpenedPackId.current
    setRevealCards(null)
    if (packId) {
      setConfirmPack(packId)
    }
  }

  const openedPackPrice = lastOpenedPackId.current
    ? (PACK_DEFS.find(p => p.id === lastOpenedPackId.current)?.price ?? 0)
    : 0

  return (
    <>
      {cardsTab === 'map' ? (
        <WorldMapView />
      ) : cardsTab === 'packs' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {PACK_DEFS.map(pack => (
            <PackCard
              key={pack.id}
              pack={pack}
              canAfford={canAfford(pack.price) && buying === null}
              onBuy={() => handleOpenPack(pack.id)}
            />
          ))}
        </div>
      ) : (
        <CollectionGrid cards={cards} />
      )}

      <BottomSheet isOpen={!!confirmPack} onClose={() => setConfirmPack(null)}>
        {confirmPack && (
          <PackConfirmSheet
            packId={confirmPack}
            coins={coins}
            canAfford={canAfford}
            onConfirm={handleConfirmOpen}
            onClose={() => setConfirmPack(null)}
          />
        )}
      </BottomSheet>

      <AnimatePresence>
        {revealCards && (
          <CardReveal
            cards={revealCards}
            canAfford={canAfford}
            openedPackPrice={openedPackPrice}
            reducedMotion={reducedMotion}
            onDone={() => setRevealCards(null)}
            onOpenAnother={handleOpenAnother}
          />
        )}
      </AnimatePresence>
    </>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function StoreHubScreen() {
  const navigate = useNavigate()
  const { coins } = useWallet()
  const location = useLocation()

  // Read URL params written by AnimalDetailCTA's "Find in Marketplace" button.
  // ?tab=marketplace&search=African+Elephant → opens market tab, pre-filters sell offers.
  const urlParams = new URLSearchParams(location.search)
  const urlTab = urlParams.get('tab') as MainTab | null
  const urlSearch = urlParams.get('search') ?? ''

  const [tab, setTab] = useState<MainTab>(
    urlTab === 'marketplace' || urlTab === 'items' || urlTab === 'cards'
      ? urlTab
      : 'marketplace'
  )
  const [filter, setFilter] = useState<LeMieuxFilter>('all')
  const [cardsTab, setCardsTab] = useState<CardsTab>('packs')
  const [marketTab, setMarketTab] = useState<MarketTab>('market')
  const [marketSearch, setMarketSearch] = useState<string>(urlSearch)

  // Rescue missions — hook handles seeding on first mount
  const { missions: rescueMissions, startMission, claimRescue, releaseToWild, keepCaring } = useRescueMissions()

  // Auction filter state — lifted here so the below slot can render the filter row
  // while AuctionHubScreen manages the grid (dual navigation prevention: tab control
  // lives only in this parent, not inside AuctionHubScreen)
  const [auctionRarityFilter, setAuctionRarityFilter] = useState<'all' | Rarity>('all')
  const [auctionSort, setAuctionSort] = useState<'ending-soon' | 'lowest-bid' | 'highest-bid' | 'rarest-first'>('ending-soon')

  // coinsInBids from useAuctions — shown globally in the CoinDisplay (spec §8)
  const { coinsInBids } = useAuctions()

  return (
    <div className="flex flex-col h-full bg-[var(--bg)] overflow-y-auto">
      <PageHeader
        title="Marketplace"
        trailing={
          <div className="flex items-center gap-2">
            <CoinDisplay amount={coins} coinsInBids={coinsInBids} />
            <button
              onClick={() => navigate('/generate')}
              className="w-9 h-9 flex items-center justify-center rounded-full text-[var(--blue-t)] bg-[var(--blue-sub)] hover:bg-[var(--blue)] hover:text-white transition-all"
              aria-label="Generate new animal"
            >
              <Sparkles size={16} strokeWidth={2} />
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="w-9 h-9 flex items-center justify-center rounded-full text-t3 hover:text-t1 hover:bg-white/[.06] transition-all"
              aria-label="Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        }
        centre={
          <div
            style={{
              display: 'inline-flex',
              background: 'var(--card)',
              border: '1px solid var(--border-s)',
              borderRadius: 100,
              padding: 4,
            }}
          >
            {(['marketplace', 'items', 'cards'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ ...segBtn(tab === t), padding: '6px 12px' }}>
                {t === 'marketplace' ? 'Animals' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        }
        below={
          <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-6 px-6">
            {/* Market sub-filter — only visible when Marketplace main tab is active.
                CategoryPills pattern: tint-pair active state, never solid fill.
                Navigation ownership: this is the only place this tab row renders —
                MarketplaceContent does NOT render a duplicate (spec §1.2). */}
            {tab === 'marketplace' && (
              <div className="flex flex-col gap-2 w-full">
                <div role="group" aria-label="Market view" className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {([
                    { key: 'market',   label: 'Looking to buy'  },
                    { key: 'for_sale', label: 'Looking to sell' },
                    { key: 'rescue',   label: 'Rescue rewards'  },
                    { key: 'auctions', label: 'Auctions'        },
                  ] as const).map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setMarketTab(key)}
                      aria-pressed={marketTab === key}
                      className={cn(
                        'flex-shrink-0 h-9 px-4 rounded-[var(--r-pill)]',
                        'text-[13px] font-semibold transition-colors duration-150',
                        marketTab === key
                          ? 'bg-[var(--blue-sub)] border border-[var(--blue)] text-[var(--blue-t)]'
                          : 'bg-[var(--card)] border border-[var(--border-s)] text-[var(--t2)]',
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {/* Auction filter row — only visible when Auctions sub-filter is active */}
                {marketTab === 'auctions' && (
                  <AuctionFilterRow
                    rarityFilter={auctionRarityFilter}
                    sort={auctionSort}
                    onRarityChange={setAuctionRarityFilter}
                    onSortChange={setAuctionSort}
                  />
                )}
              </div>
            )}
            {tab === 'items' && (
              <>
                {LEMIEUX_FILTERS.map(f => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={cn(
                      'h-9 px-4 rounded-pill text-[13px] font-semibold whitespace-nowrap shrink-0 transition-colors duration-150',
                      filter === f.key
                        ? 'bg-[var(--blue-sub)] border border-[var(--blue)] text-[var(--blue-t)]'
                        : 'bg-[var(--card)] border border-[var(--border-s)] text-[var(--t2)]',
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </>
            )}
            {tab === 'cards' && (
              <>
                {(['packs', 'collection', 'map'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setCardsTab(t)}
                    className={cn(
                      'h-9 px-4 rounded-pill text-[13px] font-600 whitespace-nowrap shrink-0 transition-colors duration-150',
                      cardsTab === t
                        ? 'bg-[var(--blue-sub)] border border-[var(--blue)] text-[var(--blue-t)]'
                        : 'bg-[var(--card)] border border-[var(--border-s)] text-[var(--t2)]',
                    )}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </>
            )}
          </div>
        }
      />

      {/* Auctions sub-filter: AuctionHubScreen owns its own content column */}
      {tab === 'marketplace' && marketTab === 'auctions' && (
        <AuctionHubScreen
          rarityFilter={auctionRarityFilter}
          sort={auctionSort}
        />
      )}

      {/* All other tabs use a shared content column */}
      {!(tab === 'marketplace' && marketTab === 'auctions') && (
        <div className="px-6 pt-4 pb-24 max-w-3xl mx-auto w-full">
          {tab === 'items' && <ItemsContent filter={filter} />}
          {tab === 'cards' && <CardsContent cardsTab={cardsTab} setCardsTab={setCardsTab} />}
          {tab === 'marketplace' && (
            <MarketplaceContent
              marketTab={marketTab}
              searchQuery={marketSearch}
              onClearSearch={() => setMarketSearch('')}
              missions={rescueMissions}
              onStartMission={startMission}
              onClaimMission={claimRescue}
            />
          )}
        </div>
      )}
    </div>
  )
}
