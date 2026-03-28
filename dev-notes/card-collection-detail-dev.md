# Developer Handoff — card-collection-detail

**Phase C — Developer**
**Date:** 2026-03-28
**Feature:** CollectedCardDetailSheet

---

## Status

Schema migration: **complete (written in a prior session)**
Stat seeding: **complete (written in a prior session)**
Hook: **complete (written this session)**

The migration and seeding layer were already present in `src/lib/db.ts` before this
Phase C session began. The only missing piece was the `useCardDetail` hook, which has
now been written.

---

## Schema changes

**Table:** `collectedCards`
**Migration version:** 10 (incremented from 9)
**Location:** `/Users/phillm/Dev/Animalkingdom/src/lib/db.ts`, lines 329–353

### New fields on `CollectedCard`

| Field              | Type                | Required | Default (existing rows) |
|--------------------|---------------------|----------|-------------------------|
| `stats`            | `CardStats`         | yes      | all five values set to `50` by v10 upgrade callback |
| `description`      | `string`            | yes      | `''` (empty string) by v10 upgrade callback |
| `ability`          | `string \| undefined` | no     | `undefined` — no backfill |
| `abilityDescription` | `string \| undefined` | no  | `undefined` — no backfill |

### `CardStats` shape

```ts
interface CardStats {
  speed:        number  // 0–100
  strength:     number  // 0–100
  stamina:      number  // 0–100
  agility:      number  // 0–100
  intelligence: number  // 0–100
}
```

### Migration strategy

- Version 10 uses `.upgrade()` with a `modify()` callback that inspects each row
  before writing. The guard `if (!card.stats)` prevents double-backfill if the
  migration ever runs twice (defensive, not strictly needed with Dexie versioning).
- The Dexie `.stores()` definition is **not repeated** in v10 because no new indexed
  columns are added. Dexie inherits the v9 index set automatically.
- No columns were dropped or renamed — the migration is fully additive.

---

## Stat seeding algorithm

**Location:** `/Users/phillm/Dev/Animalkingdom/src/hooks/useCardPacks.ts`, lines 78–106

### Rarity → stat range mapping

| Rarity    | Min | Max |
|-----------|-----|-----|
| common    |  20 |  45 |
| uncommon  |  35 |  60 |
| rare      |  50 |  75 |
| epic      |  65 |  85 |
| legendary |  80 | 100 |

Each of the five stats is rolled independently using
`Math.floor(Math.random() * (max - min + 1)) + min`.
Stats are not correlated — a legendary card may have one low-end stat at 80 and one
at 100. This produces realistic variance within a rarity tier.

### Existing cards (pre-migration)

All five stats are set to `50` by the v10 upgrade callback. This is intentionally
undifferentiated — it signals "data from before stats existed" rather than a
misleading rarity-accurate value. The FE spec treats `50` as a valid display value.

### Flavour text generation

`generateDescription(rarity, breed, animalType)` returns:
`"A {rarity} {breed} {animalType} with remarkable natural abilities."`

This is a placeholder. It is stored at pack-open time and never regenerated. Richer
copy can be substituted by changing the function — no schema change is needed.

---

## Hook API

**File:** `/Users/phillm/Dev/Animalkingdom/src/hooks/useCardDetail.ts`
**Export:** also re-exported from `/Users/phillm/Dev/Animalkingdom/src/hooks/index.ts`

### Signature

```ts
function useCardDetail(cardId: number | null | undefined): UseCardDetailReturn
```

### Return shape

```ts
interface UseCardDetailReturn {
  card: CollectedCard | undefined | null
  loading: boolean
}
```

### `card` value semantics

| Value       | Meaning                                                          |
|-------------|------------------------------------------------------------------|
| `undefined` | Dexie query is in flight (first render only, briefly)            |
| `null`      | No record found for `cardId`, OR `cardId` was `null`/`undefined` |
| `CollectedCard` | Record resolved — full stats, description, ability, etc.     |

### FE usage pattern

```tsx
// In CardsContent (manages selected card state):
const [selectedCardId, setSelectedCardId] = useState<number | null>(null)

// In CollectedCardDetailSheet (or its parent):
const { card, loading } = useCardDetail(selectedCardId)

// Guard — spec requires: if (!card) return null
if (!card) return null
```

The hook is reactive via `useLiveQuery`. If a duplicate is opened while the sheet
is visible (incrementing `duplicateCount`), the sheet updates automatically without
any manual refresh.

### When to pass `null`

Pass `null` when no card is selected. The hook skips the DB query entirely and
returns `{ card: null, loading: false }` immediately — no unnecessary Dexie
subscription is opened.

---

## Integration events

`INTEGRATION_MAP.md` does not exist in this project. No integration events were
identified for this feature. `useCardDetail` is a read-only hook — it fires no
state mutations, no badge eligibility checks, no wallet transactions. There are no
downstream side effects to wire.

---

## Files touched this phase

| File | Change |
|------|--------|
| `/Users/phillm/Dev/Animalkingdom/src/lib/db.ts` | v10 migration + `CardStats` type + `CollectedCard` extended fields — **pre-existing, not written this session** |
| `/Users/phillm/Dev/Animalkingdom/src/hooks/useCardPacks.ts` | `RARITY_STAT_RANGES`, `rollStat`, `rollStats`, `generateDescription` — **pre-existing, not written this session** |
| `/Users/phillm/Dev/Animalkingdom/src/hooks/useCardDetail.ts` | **New file — written this session** |
| `/Users/phillm/Dev/Animalkingdom/src/hooks/index.ts` | Added `useCardDetail` and `UseCardDetailReturn` exports |
| `/Users/phillm/Dev/Animalkingdom/dev-notes/card-collection-detail-dev.md` | This file |

---

## FE handoff checklist

The following is ready for the FE agent to pick up:

- [x] `CollectedCard` type includes `stats`, `description`, `ability`, `abilityDescription`
- [x] `CardStats` type is exported from `@/lib/db`
- [x] `useCardDetail(cardId)` hook is importable from `@/hooks`
- [x] `useCardPacks` already seeds stats and description on every new card
- [x] Existing cards have placeholder stats (all 50) and empty description via migration
- [ ] FE must implement `CollectedCardDetailSheet` in `src/components/cards/CollectedCardDetailSheet.tsx`
- [ ] FE must add `onCardTap` prop to `CollectionGrid` and wire it in `CardsContent`
- [ ] FE must verify `BottomSheet` uses `ReactDOM.createPortal` (spec requirement)
- [ ] FE must confirm BottomSheet spring params: `stiffness: 300, damping: 30`

### Stat display order (spec-defined)

The spec defines this render order: SPEED, STRENGTH, STAMINA, AGILITY, INTELLIGENCE.
This matches the `CardStats` field order. FE should iterate in this explicit order,
not over `Object.entries(card.stats)`, to guarantee correct sequence.

Suggested constant for FE (define in the component, not in this hook):

```ts
const STAT_ORDER: Array<{ key: keyof CardStats; label: string }> = [
  { key: 'speed',        label: 'SPEED' },
  { key: 'strength',     label: 'STRENGTH' },
  { key: 'stamina',      label: 'STAMINA' },
  { key: 'agility',      label: 'AGILITY' },
  { key: 'intelligence', label: 'INTEL' },
]
```

Note: the spec diagram abbreviates "INTELLIGENCE" as "INTEL" in the label. The label
width is fixed at 100px (shrink-0) so both fit, but "INTEL" is cleaner at 11px hairline.
FE should confirm against the spec — if the spec says "INTELLIGENCE" in full, use that.
The spec body (Section 2) spells it as `INTELLIGENCE` in the stat order list. FE to verify.

### Rarity fill colour tokens (from spec)

| Rarity    | Token for stat bar fill and Zap icon |
|-----------|--------------------------------------|
| common    | `var(--t4)`                          |
| uncommon  | `var(--green)`                       |
| rare      | `var(--blue)`                        |
| epic      | `var(--purple)`                      |
| legendary | `var(--amber)`                       |

---

## Known constraints and risks

**Risk 1 — Description is placeholder copy**
`generateDescription()` produces a generic string. If [OWNER] wants richer flavour text,
the function needs updating — the schema and hook will not change.

**Risk 2 — Ability data is always empty**
`ability` and `abilityDescription` are always `undefined` in the current dataset.
The ability section in the sheet will never render in the initial build. The conditional
logic must still be correct for future data.

**Risk 3 — Duplicate pack updates do not refresh stats**
When a duplicate is collected via `openPack`, the existing card record is updated with
`duplicateCount + 1` only — stats and description from the first open are preserved.
This is correct per the spec (stats are fixed at first collection), but worth noting
for future features that might re-roll stats.

**No technical debt created this phase.** The schema, seeding, and hook follow the
established patterns in the codebase with no shortcuts taken.
