# Refined Stories: Animal Economy Tiers

> Output from the Product Owner agent.
> Produced during Phase B after UR findings and interaction spec are complete.
> Phase B decisions confirmed by [OWNER] 2026-03-29.
> This is the acceptance criteria the Tester validates against.

---

## Feature goal

Prevent Harry from accidentally trying to sell a wild or endangered animal by making the
tradeable/reward-only split visible at every point in the product where a trade action
could be expected — and by communicating that distinction positively, not as a restriction.

---

## Owner's Phase B decisions (binding)

- Tradeable categories are exactly: `At Home`, `Stables`, `Farm`
- Reward-only categories are exactly: `Wild`, `Sea`, `Lost World`
- No fee, migration UI, or deletion of existing wild animals
- Tier is a derived property computed at render time from `pet.category`, never stored
- All other details follow the interaction spec

---

## Scope (confirmed)

**In scope:**
- `isTradeable(category)` pure function in `src/lib/animalTiers.ts`
- `TierBadge` component shown on every PetCard and PetDetailSheet header
- Reward-only informational banner inside PetDetailSheet (amber tint-pair, explanatory copy)
- "List for Sale" button removed from DOM (not disabled) for reward-only pets
- Tier indicator sub-labels on Generate Wizard Step 1 category cards
- Tier disclosure strip on Generate Wizard ResultsScreen (before Adopt button)
- Data layer: marketplace and auction queries exclude reward-only animals
- One-time migration: cancel any existing `for_sale` listings on reward-only animals on
  app init (migration version-flagged to prevent re-run)

**Out of scope (this iteration):**
- Conservation reward loop — what Harry earns for engaging with wild animals (separate
  feature: poacher-catching)
- Any in-app notification to Harry about the policy change on existing animals (silent,
  no messaging)
- "Release for coins" middle-ground mechanic (flagged in UR findings; deferred to
  poacher-catching feature scope decision)
- Category disambiguation for Lost World (Dinosaurs, Mammoths) — treated as reward-only
  per Owner decision; conceptual coherence risk noted in UR, deferred
- UI filter for reward-only/tradeable in My Animals

---

## Dependencies

Before Phase C starts, the following must be in place:
- `Marketplace`, `Player Listings`, and `Auctions` features complete (they are)
- `PetDetailSheet`, `PetCard`, `GenerateScreen`, and `ResultsScreen` components
  exist in the codebase (they do)
- `DOMESTIC_CATEGORIES` and `WILD_CATEGORIES` constants confirmed in `animals.ts`
  (confirmed via UR codebase review)
- Developer confirms whether any active `for_sale` listings on reward-only animals
  exist in the current DB before writing the migration script

---

## Refined user stories

### Story 1: Tier badge on every animal card and detail sheet

As Harry,
I want to see whether each animal in my collection is tradeable or reward-only at a
glance on its card and in its detail view,
So that I always know before I open the detail sheet whether I can list an animal for sale.

**Acceptance criteria:**
- [ ] Every `PetCard` in My Animals shows a `TierBadge` on the same row as `RarityBadge`,
  separated by a 6px gap, positioned after the rarity badge.
- [ ] The `TierBadge` for tradeable animals (At Home, Stables, Farm) renders: background
  `var(--green-sub)`, border `1px solid var(--green)`, text `var(--green-t)`, `ArrowLeftRight`
  Lucide icon at 12px, label "Tradeable", font 12px/600, padding 4px 10px, pill radius.
- [ ] The `TierBadge` for reward-only animals (Wild, Sea, Lost World) renders: background
  `var(--amber-sub)`, border `1px solid var(--amber)`, text `var(--amber-t)`, `Award`
  Lucide icon at 12px, label "Reward-only", same sizing as above.
- [ ] The `TierBadge` is non-interactive: it has no hover, focus, or tap behaviour.
- [ ] At 375px, when both `RarityBadge` and `TierBadge` do not fit on one line, the tier
  badge wraps to a second line cleanly. It does NOT truncate and does NOT overlap the
  rarity badge.
- [ ] At 1024px, both badges fit on one line within the card's badge row without overflow.
- [ ] The `PetDetailSheet` header row shows the `TierBadge` after the `RarityBadge` in the
  same row, 6px gap.
- [ ] The badge is implemented via a single shared `TierBadge` component — not inline
  styles repeated across PetCard and PetDetailSheet.
- [ ] `isTradeable(category)` is the only source of truth for tier determination. No
  inline `category === 'Wild'`-style checks exist in any component.
- [ ] The `AuctionCard` component does NOT show a `TierBadge` (only tradeable animals
  appear in auctions — badge is noise).

**Notes from UX / UR:**
- UR Risk 4 drove the decision to badge every card unconditionally rather than only showing
  the badge when Harry tries to trade. Discover the constraint before you hit it, not at the wall.

---

### Story 2: Reward-only informational banner in PetDetailSheet

As Harry,
I want to see a clear, positive explanation inside a reward-only animal's detail view
explaining why there is no "List for Sale" option,
So that the absence of the button does not feel like a game error or something being
taken away.

**Acceptance criteria:**
- [ ] When `isTradeable(pet.category) === false`, the `PetDetailSheet` renders an amber
  informational banner between the pet's narrative text and the footer action row.
- [ ] The banner renders: background `var(--amber-sub)`, border `1px solid var(--amber)`,
  radius `var(--r-md)` (12px), padding 12px 16px.
- [ ] The banner contains: an `Award` Lucide icon (16px, `var(--amber-t)`, `shrink-0`) and
  a text block with heading "This animal was earned as a reward." (14px/600, `var(--amber-t)`)
  and sub-text "Reward-only animals cannot be sold." (13px/400, `var(--t2)`, mt-2).
- [ ] The banner has `role="note"` so screen readers announce it as supplementary information.
- [ ] The banner is NOT interactive: no tap, hover, or focus behaviour.
- [ ] When `isTradeable(pet.category) === true`, the banner is absent from the DOM entirely.
- [ ] When `isTradeable(pet.category) === false`, the "List for Sale" button is absent from
  the DOM entirely (not disabled, not hidden with `display:none` — not rendered).
- [ ] The footer for a reward-only pet in active status contains exactly: Rename (col 1) and
  Release (col 2) on iPad (768px+), and Rename then Release stacked on 375px.
- [ ] The banner copy does not contain the words "blocked", "forbidden", or "cannot trade".
- [ ] The banner is not taller than 80px at 375px.

**Notes from UX / UR:**
- UR flagged that removing a capability without explanation causes a trust/fairness perception
  risk. Banner is the mitigation. Tone must be "special, earned" not "penalised".
- Owner Phase B decision: "List for Sale" removed from DOM, not disabled. This is intentional
  — disabled buttons invite questioning.

---

### Story 3: Trade actions excluded for reward-only animals in marketplace and auctions

As Harry,
I want the marketplace and auction hub to only ever show animals that can actually be bought
or sold,
So that I never encounter a reward-only animal in a trade context and become confused about
the rules.

**Acceptance criteria:**
- [ ] The NPC Marketplace browse tab never surfaces an animal whose category is in
  `['Wild', 'Sea', 'Lost World']`. This is verified by checking the data source (query or
  filter), not just by visual inspection of the rendered list.
- [ ] The Auctions tab grid never surfaces an auction for a reward-only animal. Same
  verification method.
- [ ] The `ListForSaleSheet` (player listing flow) never opens for a reward-only pet. The
  "List for Sale" button is absent from the DOM for reward-only pets (Story 2 covers this),
  so there is no UI path to the sheet. Tester verifies by attempting to navigate to the
  sheet via URL or devtools and confirming the guard exists.
- [ ] TRANS-2: if the exclusion filter were to fail and a reward-only animal appeared in a
  marketplace data source, the animal's tier badge would make it visually identifiable —
  but this scenario must not arise. Tester confirms the filter logic by inspecting the query
  used in `useMarketplace` and `useAuctions` against the tradeable category list.

**Notes from UX / UR:**
- The interaction spec requires this to be a data-layer constraint, not a UI gate. If the
  data is correct, reward-only animals simply never appear. No UI filter is needed or
  acceptable as a substitute.

---

### Story 4: Tier disclosure in the Generate Wizard

As Harry,
I want to know whether an animal I am about to adopt is tradeable or reward-only before I
commit to adopting it,
So that I am never surprised to find a missing "List for Sale" button after adoption.

**Acceptance criteria:**
- [ ] On Generate Wizard Step 1 (category selection), each category card shows a small
  sub-label indicator: tradeable categories show a "Tradeable" label in green tint-pair
  (10px/600, `var(--green-sub)` bg, `var(--green-t)` text, padding 2px 6px, pill); reward-only
  categories show "Reward-only" in amber tint-pair (same sizing).
- [ ] The tier indicator on category cards is purely informational — it does not block
  selection. Harry can still choose Wild, Sea, or Lost World.
- [ ] The existing category card hover and selected states are unchanged.
- [ ] On the Generate Wizard ResultsScreen, a tier disclosure strip renders between the
  rarity/category badges and the narrative text, unconditionally (always shown).
- [ ] For a tradeable result, the strip renders: background `var(--green-sub)`, `ArrowLeftRight`
  icon 14px `var(--green-t)`, text "This animal can be listed for sale or put up for auction."
  (13px/400, `var(--t2)`), padding 10px 14px, `var(--r-md)` radius.
- [ ] For a reward-only result, the strip renders: background `var(--amber-sub)`, `Award`
  icon 14px `var(--amber-t)`, text "This is a reward animal. You earned it — it can't be
  sold." (13px/400, `var(--t2)`), same layout as above.
- [ ] At 375px, the disclosure strip wraps to two lines cleanly and is no taller than 60px.
  The Adopt button is visible on screen without scrolling past the strip.
- [ ] At 1024px, the strip renders on one line within the `max-w-3xl` content column.
- [ ] The strip's content is determined solely by `isTradeable(result.category)` — no
  hardcoded category checks.

---

### Story 5: Migration — existing reward-only animals with active listings

As Harry,
I want any wild animals I had previously listed for sale to be quietly returned to my
collection when the tier rules take effect,
So that I do not end up with stranded pets stuck in a for_sale state with no way to
complete or cancel the listing.

**Acceptance criteria:**
- [ ] On app initialisation, a one-time migration function runs and identifies any `pet`
  records where `category` is in `['Wild', 'Sea', 'Lost World']` and `status === 'for_sale'`.
- [ ] For each such record, the migration sets `status` to `'active'` and cancels any
  associated listing record.
- [ ] The migration is version-flagged (e.g., a `migrations` table or a versioned flag in
  `playerProfile`) such that it runs exactly once and does not re-run on subsequent app loads.
- [ ] After migration, the affected pets appear in My Animals with `status === 'active'` and
  display the reward-only badge and banner correctly.
- [ ] No in-app notification is shown to Harry about this migration. The change is silent.
- [ ] If no affected records exist, the migration completes silently with no error.
- [ ] TRANS-2: the migration script is wrapped in a `db.transaction('rw', ...)` covering
  both the pet status update and the listing record cancellation. Partial migration (status
  updated but listing not cancelled, or vice versa) is a build defect.

**Notes from UX / UR:**
- UR Risk 1 flagged stranded animals as the highest severity risk. This story exists
  solely to resolve that risk.
- Owner decision: silent migration, no messaging to Harry. This avoids confusion or alarm.

---

## Definition of Done (confirmed)

This feature is complete when:
- [ ] All five stories above pass all acceptance criteria
- [ ] TRANS-2 is verified for the migration transaction (Story 5)
- [ ] Every tier badge rendering (tradeable and reward-only) verified at 375px and 1024px
- [ ] `isTradeable()` function is a pure export with 100% branch coverage (tradeable
  categories return true, all others return false, including unknown/future categories)
- [ ] Marketplace and auction data sources confirmed to exclude reward-only animals at
  query level (not UI level)
- [ ] `TierBadge` component verified against the 10-point DS checklist in test-results.md
- [ ] Tester has confirmed the ListForSaleSheet is unreachable for reward-only pets
- [ ] Tester has confirmed the informational banner copy is exactly as specified (no
  prohibited words)
- [ ] Tester sign-off received
- [ ] No disconnected functionality

---

## Sign-off

Refined stories complete. Phase C may begin after [OWNER] approval.
