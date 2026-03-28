# Feature Foundation: My Animals / Collection

> Allows the player to browse, view, and manage every pet they have adopted.
> Every pet created via Generate, bought from the Marketplace, won at Auction,
> or rescued appears here first.

---

## Entities involved

```
Entity: savedNames (READ + targeted WRITE — rename, release only)
Reactive: yes — useLiveQuery via useSavedNames hook
Fields consumed:
  id, name, animalType, breed, category, gender, age, personality,
  colour, rarity, imageUrl, discoveryNarrative, status, createdAt

Entity: playerWallet (READ only — coin balance for header display)
```

---

## Hook interfaces consumed

```typescript
const {
  pets,           // SavedName[] — full reactive list, newest-first
  petsByCategory, // Record<string, SavedName[]>
  releasePet,     // (id: number) => Promise<void>
  renamePet,      // (id: number, name: string) => Promise<void>
} = useSavedNames()

const { coins } = useWallet()
```

No new hooks required.

---

## Data flow

```
useSavedNames (useLiveQuery → Dexie savedNames table)
  │
  ▼
MyAnimalsScreen local state
  ├── activeCategory: AnimalCategory | 'All'
  ├── sortBy: 'name' | 'rarity' | 'newest'
  └── selectedPet: SavedName | null
  │
  ▼
filteredPets = pets.filter(category).sort(sortBy)
  │
  ├──▶ PetCard grid
  └──▶ PetDetailSheet (selectedPet !== null)
         ├──▶ RenameInput
         └──▶ ReleaseConfirm
```

Any write via `renamePet()` or `releasePet()` triggers Dexie live query re-emit — grid updates automatically.

---

## Rarity sort order

Legendary (5) → Epic (4) → Rare (3) → Uncommon (2) → Common (1)

---

## Design system tokens

| Token | Used for |
|-------|---------|
| `--bg` | Page background |
| `--card` | Pet cards, sheet background |
| `--elev` | Filter inactive, stat grid cells |
| `--border-s` | Card borders at rest |
| `--blue` / `--blue-sub` / `--blue-t` | Active filter pill |
| `--red` / `--red-sub` / `--red-t` | Release button |
| `--amber-sub` / `--amber-t` | Coin display |
| `--r-lg` (16px) | Cards |
| `--r-xl` (20px) | Bottom sheet corners |
| `--r-pill` (100px) | Buttons, filter pills |
| `24px` | Page horizontal margin |
| `12px` | Grid gap |

---

## Build prerequisites

- [x] Tier 0 complete
- [x] Generate Wizard complete (savedNames records exist to display)
