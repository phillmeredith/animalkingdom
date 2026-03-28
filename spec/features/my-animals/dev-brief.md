# Dev Brief: My Animals / Collection

---

## File map

```
src/
  screens/
    MyAnimalsScreen.tsx         NEW
  components/
    my-animals/
      PetCard.tsx               NEW
      PetDetailSheet.tsx        NEW
      RenameInput.tsx           NEW
      ReleaseConfirm.tsx        NEW
      EmptyCollection.tsx       NEW
```

Existing shared components consumed (no modifications):
`BottomSheet`, `Button`, `RarityBadge`, `Badge`, `AnimalImage`, `PageHeader`, `CoinDisplay`

---

## Component interfaces

```typescript
// PetCard
interface PetCardProps {
  pet: SavedName
  onClick: () => void
}

// PetDetailSheet
interface PetDetailSheetProps {
  pet: SavedName | null
  open: boolean
  onClose: () => void
  onRenamed: () => void
  onReleased: () => void
}

// RenameInput
interface RenameInputProps {
  currentName: string
  onConfirm: (name: string) => Promise<void>
  onCancel: () => void
}

// ReleaseConfirm
interface ReleaseConfirmProps {
  petName: string
  open: boolean
  onConfirm: () => Promise<void>
  onCancel: () => void
}

// EmptyCollection
interface EmptyCollectionProps {
  hasAnyPets: boolean
  activeCategory: AnimalCategory | 'All'
  onGenerate: () => void
  onClearFilter: () => void
}
```

---

## MyAnimalsScreen state

```typescript
type SortOption = 'newest' | 'name' | 'rarity'
type ActiveCategory = AnimalCategory | 'All'

const [selectedPet, setSelectedPet] = useState<SavedName | null>(null)
const [activeCategory, setActiveCategory] = useState<ActiveCategory>('All')
const [sortBy, setSortBy] = useState<SortOption>('newest')

const { pets } = useSavedNames()
const { coins } = useWallet()

const RARITY_RANK: Record<Rarity, number> = {
  legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1,
}

const filteredPets = useMemo(() => {
  let result = activeCategory === 'All'
    ? pets
    : pets.filter(p => p.category === activeCategory)

  switch (sortBy) {
    case 'name':    return [...result].sort((a, b) => a.name.localeCompare(b.name))
    case 'rarity':  return [...result].sort((a, b) => RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity])
    case 'newest':
    default:        return result // already desc from useLiveQuery
  }
}, [pets, activeCategory, sortBy])
```

---

## PetDetailSheet notes

Local state:
```typescript
const [isRenaming, setIsRenaming] = useState(false)
const [releaseOpen, setReleaseOpen] = useState(false)
```

Reset both when `pet` prop changes or when `open` becomes false.

Category badge colour map:
```typescript
const CATEGORY_BADGE: Record<string, BadgeVariant> = {
  'At Home':    'blue',
  'Stables':    'amber',
  'Farm':       'green',
  'Lost World': 'purple',
  'Wild':       'green',
  'Sea':        'blue',
}
```

Colour chip hex: resolve from `COLOURS_BY_TYPE` in `generateOptions.ts`. Match `pet.colour` against `ColourOption.value` across all animal types. Fall back to `var(--elev)` background if not found.

---

## RenameInput notes

- `autoFocus` on render
- Validate: `value.trim().length > 0`
- Error state: `border-color: --red`, `box-shadow: 0 0 0 3px var(--red-sub)`
- On `onConfirm` throw: error is caught by caller (PetDetailSheet shows toast), input stays open, field reverts to `currentName`

---

## ReleaseConfirm notes

- Release button uses solid `bg-[var(--red)] text-white` (not tinted — destructive action)
- Loading spinner on button while async runs
- On error: toast from caller, sheet stays open (do not auto-close)

---

## Error handling

| Scenario | Behaviour |
|----------|-----------|
| `renamePet()` throws | Toast error (persistent), input stays open, field reverts |
| Empty name | Red border + shadow, no submit |
| `releasePet()` throws | Toast error (persistent), confirm sheet stays open |
| `useLiveQuery` undefined (loading) | Render grid skeleton or null until ready |

---

## Filter bar

```typescript
const FILTER_TABS: (AnimalCategory | 'All')[] = [
  'All', 'At Home', 'Stables', 'Farm', 'Lost World', 'Wild', 'Sea',
]
```

Rendered as `overflow-x-auto flex gap-2 px-6 py-3 scrollbar-hide`.

---

## Sort control

Styled `<select>` with `appearance-none`, custom SVG chevron, `bg-[var(--card)] border border-[var(--border-s)] rounded-md text-t1 text-[13px] px-3 py-2 pr-8`.

---

## Build order

1. `EmptyCollection.tsx`
2. `PetCard.tsx`
3. `MyAnimalsScreen.tsx` (layout + filter + sort + grid — no sheets)
4. `RenameInput.tsx`
5. `ReleaseConfirm.tsx`
6. `PetDetailSheet.tsx`
7. Wire sheet into MyAnimalsScreen

Self-review after each: re-read DS tokens, confirm pill buttons, confirm 44px touch targets, confirm `useReducedMotion` on all animations.
