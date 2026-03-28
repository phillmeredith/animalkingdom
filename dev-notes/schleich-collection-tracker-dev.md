# Dev Handoff — schleich-collection-tracker (Phase C, Developer)

**Feature:** schleich-collection-tracker
**Date:** 2026-03-28
**Status:** Phase C complete (Developer scope only)

---

## Important blocker note

`/schleich/schleich_animals_enriched.json` does not exist at Phase C start. As
instructed by Story 10 AC, the data layer proceeds against the base file with
TypeScript stubs for enriched fields. The detail sheet sections that depend on
enriched data (breed subtitle, animal facts, release year, retired badge, retired
year label) will render empty/absent when using base data. When the enriched file
ships, the FE engineer swaps the import path in `src/data/schleich.ts` — no other
code changes required. Raise this blocker with [OWNER] before building the detail
sheet enriched sections.

---

## Schema — Dexie version 11

**File:** `src/lib/db.ts`
**Table name:** `schleichOwned`
**Primary key:** `id` (string, not auto-increment)
**Fields:**
```typescript
interface SchleichOwned {
  id: string       // derived stable key: image filename without extension
  ownedAt: number  // Date.now() timestamp at time of marking owned
}
```
**Dexie store definition:** `schleichOwned: 'id'`
**No upgrade callback** — new table, no backfill needed.
**Existing data in all prior tables is unaffected.**

The `SchleichOwned` interface is exported from `src/lib/db.ts`. The
`AnimalKingdomDB` class declares `schleichOwned!: Table<SchleichOwned>`.

---

## Static data module

**File:** `src/data/schleich.ts`

### SchleichAnimal interface

All fields:

| Field | Type | Source |
|---|---|---|
| `name` | `string` | Base file |
| `description` | `string` | Base file |
| `image` | `string` | Base file — relative path |
| `image_url` | `string` | Base file — Shopify CDN URL (use this for img src) |
| `category` | `SchleichCategorySlug` | Base file |
| `url` | `string` | Base file — Schleich product URL (not rendered in UI) |
| `articleNumber` | `number \| null` | Enriched — null on base data (not displayed in UI) |
| `releaseYear` | `number \| null` | Enriched — null on base data |
| `discontinued` | `boolean` | Enriched — false on base data |
| `discontinuedYear` | `number \| null` | Enriched — null on base data |
| `animalFacts` | `string` | Enriched — empty string on base data |
| `breed` | `string \| null` | Enriched — null on base data |
| `id` | `string` | Derived (computed at module load time) |

### ID derivation

Rule: strip directory prefix and file extension from the `image` field.

```
"images/haflinger-foal-13951.jpg"  →  "haflinger-foal-13951"
"images/pura-raza-espa-ola-mare-13922.jpg"  →  "pura-raza-espa-ola-mare-13922"
```

Fallback (if image field is empty): slugified lowercase name.

### SCHLEICH_ITEMS

`export const SCHLEICH_ITEMS: SchleichAnimal[]` — all 566 items, computed
synchronously at module load from the raw JSON. FE imports this directly; no
async fetch, no loading state for the catalogue.

Category breakdown (verified against data file):
- `horses`: 198 items
- `wild-animals-adventure`: 116 items
- `farm-animals-farm-toys`: 111 items
- `monsters-and-dragons`: 74 items
- `dinosaurs-and-volcano`: 67 items
- Total: 566 items

### Category filter exports

```typescript
// All valid filter values (string literal union):
export const SCHLEICH_CATEGORIES = [
  'all',
  'horses',
  'wild-animals-adventure',
  'farm-animals-farm-toys',
  'monsters-and-dragons',
  'dinosaurs-and-volcano',
  'retired',
] as const

export type SchleichCategoryFilter = (typeof SCHLEICH_CATEGORIES)[number]

// Pill display labels (raw slug → user-facing label):
export const SCHLEICH_CATEGORY_LABELS: Record<SchleichCategoryFilter, string> = {
  'all':                       'All',
  'horses':                    'Horses',
  'wild-animals-adventure':    'Wild Animals',   // Story 3 requires "Wild Animals" not "Wild"
  'farm-animals-farm-toys':    'Farm',
  'monsters-and-dragons':      'Dragons',
  'dinosaurs-and-volcano':     'Dinosaurs',
  'retired':                   'Retired',
}

// Default category on mount (per spec section 3.2 — Horses is Harry's primary interest):
export const SCHLEICH_DEFAULT_CATEGORY: SchleichCategoryFilter = 'horses'
```

---

## Hook API

**File:** `src/hooks/useSchleichCollection.ts`
**Exported from:** `src/hooks/index.ts`

### useSchleichCollection()

Returns `UseSchleichCollectionReturn`:

```typescript
interface UseSchleichCollectionReturn {
  items: SchleichAnimal[]          // Full 566-item catalogue — synchronous, never changes
  ownedIds: Set<string>            // Reactive Set from useLiveQuery — updates grid in real time
  toggleOwned: (id: string) => Promise<void>  // Add or remove from schleichOwned table
  isOwned: (id: string) => boolean            // Derived helper — O(1) lookup into ownedIds
  loading: boolean                 // True while initial Dexie read is in progress
}
```

#### items

The full static catalogue. Always synchronously available — the catalogue is a
static JSON import, not a DB query. `loading` does not gate the catalogue.

#### ownedIds

A `Set<string>` rebuilt from `useLiveQuery(() => db.schleichOwned.toArray())`.
Any write to `schleichOwned` (add or delete) triggers a re-render with the
updated set automatically — no manual state sync needed.

#### toggleOwned(id)

- If `id` is in `ownedIds`: calls `db.schleichOwned.delete(id)`.
- If `id` is not in `ownedIds`: calls `db.schleichOwned.add({ id, ownedAt: Date.now() })`.
- Wrapped in `try/catch`. On error: **rethrows** — does not call toast directly.
- **FE MUST wrap every call to `toggleOwned` in its own `try/catch` and call `useToast()` in the catch block** to show a user-facing error message. This pattern satisfies the CLAUDE.md "no silent swallow" rule while keeping the hook free of component imports (hook template rule: hooks must not import from components).

  Required FE pattern:
  ```typescript
  const { toast } = useToast()
  try {
    await toggleOwned(item.id)
  } catch {
    toast({ type: 'error', title: 'Could not update collection', description: 'Please try again.' })
    // revert any optimistic UI state here
  }
  ```

- No confirmation dialog, no toast on success (per UR finding section 10b).
- No economy connection (no `spend()`, no `earn()`, no `transactions` writes).
- No badge eligibility check (no badge-eligible events in this feature).

#### isOwned(id)

`return ownedIds.has(id)` — convenience helper so components avoid holding a
reference to `ownedIds` directly.

#### loading

`true` while `useLiveQuery` result is `undefined` (initial Dexie read). FE should
render the grid with all items immediately (catalogue is always available) but
suppress owned-state indicators until `loading` is false to avoid a flash of
incorrect ownership state.

---

## FE notes for the virtual grid

The hook does not manage filter state. Filter logic belongs in the screen component
(`SchleichScreen`) or a dedicated filter hook. The FE applies filtering client-side
against `SCHLEICH_ITEMS`:

```typescript
// Filtering pattern (pseudocode for FE reference):
const filtered = useMemo(() => {
  return SCHLEICH_ITEMS.filter(item => {
    const categoryMatch =
      activeCategory === 'all' ? true :
      activeCategory === 'retired' ? item.discontinued :
      item.category === activeCategory

    const retiredMatch = showRetiredOnly ? item.discontinued : true

    const searchMatch = query === ''
      ? true
      : item.name.toLowerCase().includes(query.toLowerCase())

    return categoryMatch && retiredMatch && searchMatch
  })
}, [activeCategory, showRetiredOnly, query])
```

Note: `retired` is a combined filter (no separate `showRetiredOnly` state needed
if the pill is implemented as a seventh category slug). When `activeCategory ===
'retired'`, filter to `item.discontinued === true` across all categories. The
category pills and retired pill share the same `activeCategory` state variable.

---

## Enriched data — when schleich_animals_enriched.json ships

1. Verify the enriched file is at `/schleich/schleich_animals_enriched.json`
2. In `src/data/schleich.ts`, change the import:
   ```typescript
   // Before:
   import rawData from '../../schleich/schleich_animals.json'
   // After:
   import rawData from '../../schleich/schleich_animals_enriched.json'
   ```
3. Remove the stub comment block at the top of the file
4. The `RawSchleichRecord` interface already types the enriched fields as optional —
   no interface changes needed if the enriched file uses the same field names

---

## Files touched in this phase

| File | Change |
|---|---|
| `src/lib/db.ts` | Added `SchleichOwned` interface; added `schleichOwned!: Table<SchleichOwned>` to class; added `.version(11).stores(...)` migration |
| `src/data/schleich.ts` | New file — static data module |
| `src/hooks/useSchleichCollection.ts` | New file — ownership hook |
| `src/hooks/index.ts` | Added exports for `useSchleichCollection` and `UseSchleichCollectionReturn` |
| `.claude/current-feature` | Declared `schleich-collection-tracker` |

## Files not touched (FE scope)

- `src/components/schleich/` — FE creates this directory
- `src/screens/SchleichScreen.tsx` — FE creates
- Any BottomNav modification — FE locates and modifies (see Story 1, refined-stories Q7)
- Any routing changes — FE
