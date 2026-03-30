// MyAnimalsScreen — player's adopted pet collection + LeMieux items collection
// Tab switcher: Animals | Items
// Animals tab: filter by category, sort by name/rarity/newest, tap for detail sheet
// Items tab: owned LeMieux items grouped by Equipped / Inventory / Hobby Horses

import { useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingBag, Settings, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

import { PageHeader } from '@/components/layout/PageHeader'
import { PetCard } from '@/components/my-animals/PetCard'
import { PetDetailSheet } from '@/components/my-animals/PetDetailSheet'
import { EmptyCollection } from '@/components/my-animals/EmptyCollection'

import { useSavedNames } from '@/hooks/useSavedNames'
import { useWallet } from '@/hooks/useWallet'
import { useItemShop } from '@/hooks/useItemShop'
import { RarityBadge } from '@/components/ui/Badge'
import { CoinDisplay } from '@/components/ui/CoinDisplay'
import { HorsePickerSheet } from '@/screens/EquipScreen'
import { CardDetailSheet } from '@/components/my-animals/CardDetailSheet'
import { CardsTab } from '@/components/my-animals/CardsTab'
import { SchleichContent } from '@/components/schleich/SchleichContent'
import { SchleichCategoryPills } from '@/components/schleich/SchleichCategoryPills'
import { SearchBar } from '@/components/ui/SearchBar'
import { todayString } from '@/lib/db'
import type { SavedName, Rarity, OwnedItem, CollectedCard } from '@/lib/db'
import type { AnimalCategory } from '@/data/animals'
import { LEMIEUX_ITEMS } from '@/data/lemieux'
import type { LeMieuxItem } from '@/data/lemieux'
import { SCHLEICH_DEFAULT_CATEGORY, type SchleichCategoryFilter } from '@/data/schleich'

// ─── Constants ────────────────────────────────────────────────────────────────

type ScreenTab = 'animals' | 'dinosaurs' | 'items' | 'figures' | 'cards'
type SortOption = 'newest' | 'name' | 'rarity'
type ActiveCategory = AnimalCategory | 'All'

// Lost World animals go in the Dinosaurs tab — exclude from Animals filter pills
const ANIMAL_FILTER_TABS: ActiveCategory[] = [
  'All', 'At Home', 'Stables', 'Farm', 'Wild', 'Sea',
]

const RARITY_RANK: Record<Rarity, number> = {
  legendary: 5,
  epic:      4,
  rare:      3,
  uncommon:  2,
  common:    1,
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'name',   label: 'A–Z' },
  { value: 'rarity', label: 'Rarity' },
]

// ─── ItemsCollectionCard ──────────────────────────────────────────────────────
// Reuses the same visual pattern as the store's LeMieuxItemCard — same anatomy,
// slightly different context (shows horse name for equipped items instead of price).

const CATEGORY_WELL_BG: Record<string, string> = {
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

const CATEGORY_ICON_COLOR: Record<string, string> = {
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

function ItemsCollectionCard({
  ownedItem,
  lemieuxDef,
  equippedToName,
  onTap,
}: {
  ownedItem: OwnedItem
  lemieuxDef: LeMieuxItem
  equippedToName: string | null
  onTap: () => void
}) {
  const [imgError, setImgError] = useState(false)
  const showIcon = !lemieuxDef.imageUrl || imgError
  const wellBg = CATEGORY_WELL_BG[lemieuxDef.urlSlug] ?? 'var(--elev)'

  return (
    <button
      onClick={onTap}
      aria-label={`${lemieuxDef.name}${equippedToName ? `, equipped to ${equippedToName}` : ''}`}
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
          <div className="w-full h-full flex items-center justify-center" style={{ background: wellBg }}>
            <ShoppingBag
              size={32}
              strokeWidth={2}
              aria-hidden="true"
              style={{ color: CATEGORY_ICON_COLOR[lemieuxDef.urlSlug] ?? 'var(--t4)' }}
            />
          </div>
        ) : (
          <img
            src={lemieuxDef.imageUrl!}
            alt={lemieuxDef.name}
            className="w-full h-full object-cover object-center"
            onError={() => setImgError(true)}
          />
        )}
        {equippedToName && (
          <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.5px] bg-[var(--blue-sub)] text-[var(--blue-t)]">
            ON
          </span>
        )}
      </div>

      {/* Text */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[13px] font-semibold text-[var(--t1)] leading-snug line-clamp-2">
          {lemieuxDef.name}
        </span>
        <span className="text-[11px] font-medium tracking-[0.5px] text-[var(--t3)] uppercase">
          {equippedToName
            ? `On ${equippedToName}`
            : lemieuxDef.displayCategory}
        </span>
      </div>
    </button>
  )
}

// ─── ItemsCollectionSection ────────────────────────────────────────────────────

function ItemsCollectionSection({
  title,
  items,
  pets,
  onTapItem,
}: {
  title: string
  items: OwnedItem[]
  pets: SavedName[]
  onTapItem: (item: OwnedItem) => void
}) {
  if (items.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <p
        className="text-[11px] font-bold uppercase tracking-[1px] text-[var(--t3)]"
      >
        {title}
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
        {items.map(ownedItem => {
          const def = LEMIEUX_ITEMS.find(d => d.id === ownedItem.lemieuxItemId)
          if (!def) return null
          const horse = ownedItem.equippedToPetId != null
            ? pets.find(p => p.id === ownedItem.equippedToPetId) ?? null
            : null
          return (
            <ItemsCollectionCard
              key={ownedItem.id}
              ownedItem={ownedItem}
              lemieuxDef={def}
              equippedToName={horse?.name ?? null}
              onTap={() => onTapItem(ownedItem)}
            />
          )
        })}
      </div>
    </div>
  )
}

// ─── ItemsTab ─────────────────────────────────────────────────────────────────

function ItemsTab() {
  const { ownedItems } = useItemShop()
  const { pets } = useSavedNames()
  const navigate = useNavigate()
  const [horsePickerOpen, setHorsePickerOpen] = useState(false)

  // Partition owned LeMieux items into sections
  const ownedLeMieux = useMemo(
    () => ownedItems.filter(i => i.lemieuxItemId != null),
    [ownedItems],
  )

  const equipped = useMemo(
    () => ownedLeMieux.filter(i => i.equippedToPetId != null && i.category !== 'hobby-horse'),
    [ownedLeMieux],
  )
  const inventory = useMemo(
    () => ownedLeMieux.filter(i => i.equippedToPetId === null && i.category !== 'hobby-horse'),
    [ownedLeMieux],
  )
  const hobbyHorses = useMemo(
    () => ownedLeMieux.filter(i => i.category === 'hobby-horse'),
    [ownedLeMieux],
  )

  function handleTapItem(item: OwnedItem) {
    if (item.equippedToPetId != null) {
      // Navigate straight to the equip screen for the horse it's on
      navigate(`/equip/${item.equippedToPetId}`)
    } else if (item.category !== 'hobby-horse') {
      // Open horse picker to choose which horse to equip to
      setHorsePickerOpen(true)
    }
    // Hobby horses: no equip action — do nothing
  }

  if (ownedLeMieux.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <ShoppingBag size={48} strokeWidth={2} className="text-[var(--t4)]" aria-hidden="true" />
        <div className="text-center">
          <p className="text-[17px] font-semibold text-[var(--t1)] mb-1">No items yet</p>
          <p className="text-[14px] text-[var(--t2)]">
            Buy items from the Store to equip your horses.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-8">
        <ItemsCollectionSection
          title="Equipped"
          items={equipped}
          pets={pets}
          onTapItem={handleTapItem}
        />
        <ItemsCollectionSection
          title="In Inventory"
          items={inventory}
          pets={pets}
          onTapItem={handleTapItem}
        />
        <ItemsCollectionSection
          title="Hobby Horses"
          items={hobbyHorses}
          pets={pets}
          onTapItem={handleTapItem}
        />
      </div>

      <HorsePickerSheet
        isOpen={horsePickerOpen}
        onClose={() => setHorsePickerOpen(false)}
      />
    </>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function MyAnimalsScreen() {
  const navigate = useNavigate()
  const { pets } = useSavedNames()
  const { coins } = useWallet()
  const scrollRef = useRef<HTMLDivElement>(null)

  const [screenTab, setScreenTab] = useState<ScreenTab>('animals')
  const [selectedPet, setSelectedPet] = useState<SavedName | null>(null)
  const [selectedCard, setSelectedCard] = useState<CollectedCard | null>(null)
  const [activeCategory, setActiveCategory] = useState<ActiveCategory>('All')
  const [sortBy, setSortBy] = useState<SortOption>('newest')

  // Figures tab — search/filter state lifted into PageHeader below slot
  const [figuresQuery, setFiguresQuery] = useState('')
  const [figuresCategory, setFiguresCategory] = useState<SchleichCategoryFilter>(
    SCHLEICH_DEFAULT_CATEGORY,
  )

  // Animals tab: exclude Lost World (those go in Dinosaurs tab)
  const animalPets = useMemo(() => pets.filter(p => p.category !== 'Lost World'), [pets])
  // Dinosaurs tab: Lost World only
  const dinosaurPets = useMemo(() => pets.filter(p => p.category === 'Lost World'), [pets])

  const filteredPets = useMemo(() => {
    const base = screenTab === 'dinosaurs' ? dinosaurPets : animalPets
    let result = activeCategory === 'All'
      ? base
      : base.filter(p => p.category === activeCategory)

    switch (sortBy) {
      case 'name':
        return [...result].sort((a, b) => a.name.localeCompare(b.name))
      case 'rarity':
        return [...result].sort((a, b) => RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity])
      case 'newest':
      default:
        return result
    }
  }, [screenTab, animalPets, dinosaurPets, activeCategory, sortBy])

  return (
    <div ref={scrollRef} className="flex flex-col h-full bg-[var(--bg)] overflow-y-auto">

      <PageHeader
        title="Collection"
        trailing={
          <div className="flex items-center gap-2">
            <CoinDisplay amount={coins} />
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
          // Main tab switcher — Animals | Items | Cards
          <div
            style={{
              display: 'inline-flex',
              background: 'var(--card)',
              border: '1px solid var(--border-s)',
              borderRadius: 100,
              padding: 4,
            }}
          >
            {(['animals', 'dinosaurs', 'items', 'figures', 'cards'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setScreenTab(t); setActiveCategory('All') }}
                style={{
                  borderRadius: 100,
                  padding: '6px 14px',
                  fontWeight: 600,
                  fontSize: 13,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 150ms, color 150ms',
                  ...(screenTab === t
                    ? { background: 'var(--elev)', color: 'var(--t1)' }
                    : { background: 'transparent', color: 'var(--t3)' }),
                }}
              >
                {t === 'animals' ? 'Animals' : t === 'dinosaurs' ? 'Dinosaurs' : t === 'items' ? 'Items' : t === 'figures' ? 'Figures' : 'Cards'}
              </button>
            ))}
          </div>
        }
        below={
          screenTab === 'figures' ? (
            // Figures tab — search bar + category pills lifted into PageHeader below slot
            <div className="flex flex-col gap-2">
              <SearchBar
                value={figuresQuery}
                onChange={setFiguresQuery}
                placeholder="Search figurines…"
              />
              <SchleichCategoryPills
                active={figuresCategory}
                onSelect={setFiguresCategory}
              />
            </div>
          ) : (screenTab === 'animals' || screenTab === 'dinosaurs') ? (
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-6 px-6">
              {/* Category filter pills — Animals tab only (Dinosaurs are all Lost World) */}
              {screenTab === 'animals' && ANIMAL_FILTER_TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveCategory(tab)}
                  className={
                    tab === activeCategory
                      ? 'h-9 px-4 rounded-pill text-[13px] font-semibold whitespace-nowrap shrink-0 bg-[var(--blue-sub)] border border-[var(--blue)] text-[var(--blue-t)] transition-colors duration-150'
                      : 'h-9 px-4 rounded-pill text-[13px] font-semibold whitespace-nowrap shrink-0 bg-[var(--card)] border border-[var(--border-s)] text-[var(--t2)] transition-colors duration-150'
                  }
                >
                  {tab}
                </button>
              ))}
              {/* Sort pills — pushed to the right */}
              <div className="flex items-center gap-2 ml-auto shrink-0">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value)}
                    className={cn(
                      'h-9 px-4 rounded-pill text-[13px] font-semibold whitespace-nowrap transition-colors duration-150',
                      sortBy === opt.value
                        ? 'bg-[var(--blue-sub)] border border-[var(--blue)] text-[var(--blue-t)]'
                        : 'bg-[var(--card)] border border-[var(--border-s)] text-[var(--t2)]',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null
        }
      />

      {/* Content — Figures tab renders SchleichContent; search/filter state is lifted
          into the PageHeader below slot above, so external control props are passed. */}
      {screenTab === 'figures' ? (
        <SchleichContent
          mode="collection"
          scrollRef={scrollRef}
          onBrowseAll={() => navigate('/explore?tab=figures')}
          externalQuery={figuresQuery}
          externalCategory={figuresCategory}
          onExternalQueryChange={setFiguresQuery}
          onExternalCategoryChange={setFiguresCategory}
          onExternalClearFilters={() => {
            setFiguresQuery('')
            setFiguresCategory(SCHLEICH_DEFAULT_CATEGORY)
          }}
        />
      ) : (
        <div className="px-6 pt-4 pb-24 max-w-3xl mx-auto w-full">
          {screenTab === 'animals' || screenTab === 'dinosaurs' ? (
            filteredPets.length === 0 ? (
              <EmptyCollection
                hasAnyPets={screenTab === 'animals' ? animalPets.length > 0 : dinosaurPets.length > 0}
                activeCategory={activeCategory}
                onGenerate={() => navigate('/generate')}
                onClearFilter={() => setActiveCategory('All')}
              />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
                {filteredPets.map(pet => (
                  <PetCard
                    key={pet.id}
                    pet={pet}
                    onClick={() => setSelectedPet(pet)}
                    careState={
                      pet.lastFullCareDate === todayString()
                        ? 'cared-today'
                        : 'needs-care'
                    }
                  />
                ))}
              </div>
            )
          ) : screenTab === 'items' ? (
            <ItemsTab />
          ) : (
            <CardsTab onTap={setSelectedCard} />
          )}
        </div>
      )}

      {/* Card detail sheet — only shown in Cards tab */}
      <CardDetailSheet
        card={selectedCard}
        onClose={() => setSelectedCard(null)}
      />

      {/* Pet detail sheet — only shown in Animals tab */}
      <PetDetailSheet
        pet={selectedPet}
        open={selectedPet !== null}
        onClose={() => setSelectedPet(null)}
        onRenamed={() => {
          // useLiveQuery updates the pet list reactively
          // Keep selectedPet open — it will reflect the renamed pet via live query
        }}
        onReleased={() => setSelectedPet(null)}
      />
    </div>
  )
}
