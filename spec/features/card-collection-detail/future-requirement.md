# Card Collection Detail Sheet — Future Requirement

**Status:** Blocked — awaiting stats schema extension to `collectedCards`
**Approved by owner:** yes — build when schema is ready

---

## What the user needs

When tapping a card in the collection grid, a bottom sheet opens showing full card detail. This should feel like a Pokémon card flip — the card is a rich object with identity, not just an image.

## Required data (does not exist yet)

The `collectedCards` table needs these fields added before this can be built:

```ts
// Required additions to CollectedCard schema
stats: {
  speed: number        // 0–100
  strength: number     // 0–100
  stamina: number      // 0–100
  agility: number      // 0–100
  intelligence: number // 0–100
}
description: string    // flavour text for the animal/breed
ability?: string       // optional special ability name
abilityDescription?: string
```

## Sheet content (once schema ready)

- **Header:** Animal image (full width, aspect 16:9), rarity badge, animal name
- **Stats block:** 5 stats shown as labelled progress bars (DS pink/blue tint, same bars as arcade games)
- **Info row:** Species, breed, rarity, date collected
- **Ability block** (if present): ability name + description in amber tint well
- **Flavour text:** italic, `text-t2`, bottom of sheet
- **Footer action:** "Release" button (destructive, outline) — confirm before acting

## Schema migration note

When stats are added to `collectedCards`, bump the Dexie version, write a migration that sets placeholder stats (all 50) for existing cards, and update `useCardPacks` to generate stats at pack-open time (seeded from the animal's rarity — higher rarity = higher base stats with more variance).

---

**Do not build the sheet until the schema migration is written and approved.**
