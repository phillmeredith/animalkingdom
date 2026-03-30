# Interaction Spec: Animal Economy Tiers

> Feature: animal-economy-tiers
> Author: UX Designer
> Status: Phase A complete — ready for Phase B (PO)
> Last updated: 2026-03-29

---

## Overview

Animal Kingdom operates a two-tier economy. Tradeable animals (domestics: horses, dogs,
cats, and household pets) can be listed, auctioned, and bought. Reward-only animals (all
wildlife, exotic, and endangered species) are earned through gameplay and conservation
rewards — they cannot be sold, listed, or auctioned under any circumstances.

This spec defines the visual and interaction treatment for communicating animal tier
membership across every surface where trade actions appear: the collection (My Animals),
the Generate Wizard, and any marketplace or auction CTA. It also defines the migration
state for existing wild animals already in a player's collection.

The primary user is Harry, aged 8–10, on iPad Pro 11" (portrait ~820px CSS width). The
tier distinction must be immediately legible without reading body copy — colour, iconography,
and placement all carry meaning.

---

## Mandatory spec requirements checklist

The following mandatory items from CLAUDE.md are explicitly addressed in this spec:

1. Interaction states — covered in section 7
2. Card anatomy — covered in section 3 (tier badge anatomy on PetCard)
3. Overlay surface treatment — glass rule stated in section 6
4. Consistency check — reviewed PetDetailSheet, AuctionCard, StoreHubScreen — covered
   in section 5
5. PageHeader slot assignment — no new header controls introduced; see section 8
6. Navigation ownership — no new navigation introduced; see section 8
7. Filter pill style — no new filter pills introduced; existing pattern unchanged
8. Filter and sort row layout — no change to existing filter/sort rows
9. Content top padding — explicit class strings in section 4

---

## 1. Animal tier definitions

Two tiers. Tier membership is determined by animal category at the data layer.

| Tier | Label | Categories | Trade actions available |
|------|-------|-----------|------------------------|
| Tradeable | "Tradeable" | At Home, Stables, Farm | List for Sale, Auction, Buy from marketplace |
| Reward-only | "Reward-only" | Wild, Lost World, Sea | None — all trade CTAs replaced or hidden |

Tier is a derived property — it is NOT a stored field. It is computed from `pet.category`
at render time. The Developer must implement a pure function `isTradeable(category)` that
returns a boolean. It must be called wherever trade CTAs are conditionally rendered.

Evidence note: no UR findings file is available for this feature. Tier rules above are
derived from the product brief. If UR research surfaces a conflict with Harry's mental
model of which animals "should" be tradeable, this spec must be revised before Phase C.

---

## 2. Tier badge anatomy

A small pill badge appears on every animal surface that currently shows a RarityBadge,
directly adjacent to it. The tier badge communicates membership with minimal visual noise.

### Tradeable badge

```
Background:  var(--green-sub)   [rgba(69,178,107,.12)]
Border:      1px solid var(--green)
Text:        var(--green-t)     [#7DD69B]
Icon:        ArrowLeftRight (Lucide), 12px, strokeWidth 2, inline-start
Label:       "Tradeable"
Font:        12px / 600
Padding:     4px 10px
Radius:      100px (pill)
```

### Reward-only badge

```
Background:  var(--amber-sub)   [rgba(245,166,35,.12)]
Border:      1px solid var(--amber)
Text:        var(--amber-t)     [#FCC76E]
Icon:        Award (Lucide), 12px, strokeWidth 2, inline-start
Label:       "Reward-only"
Font:        12px / 600
Padding:     4px 10px
Radius:      100px (pill)
```

Amber is chosen for Reward-only because it reads as "special / earned" rather than
"error / blocked". Red would be alarming for a child; amber signals distinction and
value, consistent with how Legendary rarity uses amber in the design system.

Badge placement rules:
- On PetCard (grid): below the animal name, same line as the RarityBadge, separated
  by a 6px gap. At 375px, if both badges don't fit on one line, tier badge wraps to
  a second line — it does NOT truncate.
- On PetDetailSheet header row: after the RarityBadge, same row, 6px gap.
- On AuctionCard: only Tradeable animals appear in auctions, so the badge is not
  needed there — omit it to reduce noise.
- On ListForSaleSheet pet summary row: show tier badge so Harry can confirm he is
  about to list a Tradeable animal. This is a reassurance signal, not a blocker.

---

## 3. PetCard anatomy update

The existing PetCard layout is extended, not redesigned. The tier badge slots into the
existing badge row. No other dimensions change.

```
┌─────────────────────────────────┐
│  [animal image — aspect-video]  │  full width, r-lg top corners, object-cover
├─────────────────────────────────┤
│  [Care state dot]  [name]       │  13px/600, --t1, truncate
│  [RarityBadge] [TierBadge]      │  12px, tint-pair pills, gap-1.5, flex-wrap
│  [category label]               │  11px, --t3, uppercase, tracking-wide
└─────────────────────────────────┘
```

The tier badge is always present on every PetCard. It is not conditional on the current
screen context — Harry should develop a consistent expectation of where the badge lives.

Empty state: not applicable — badges only appear when a pet record exists.

---

## 4. Surfaces where trade CTAs appear

### 4a. PetDetailSheet — footer action row

Current state: the footer contains Rename, Release, and (since player-listings spec)
"List for Sale" as a primary button.

New behaviour based on tier:

**When `isTradeable(pet.category) === true`:**
- "List for Sale" button appears as `variant="primary"` (blue), enabled.
- No change from player-listings spec.

**When `isTradeable(pet.category) === false` (Reward-only):**
- "List for Sale" button is NOT shown. It is removed from the DOM entirely, not
  just disabled. Disabled buttons invite questioning; absent buttons do not.
- An informational banner replaces it (see section 4b).
- The footer contains: Rename + Release only (same 2-column grid as before).

### 4b. Reward-only informational banner

This banner sits between the pet narrative text and the footer action row inside
PetDetailSheet, only when the pet is Reward-only.

```
Background:  var(--amber-sub)
Border:      1px solid var(--amber)
Radius:      var(--r-md)  [12px]
Padding:     12px 16px
```

Layout inside banner (flex row, gap-12, align-center):

```
[Award icon — 16px, var(--amber-t), shrink-0]
[Text block]
  "This animal was earned as a reward."   14px/600, var(--amber-t)
  "Reward-only animals cannot be sold."   13px/400, var(--t2), mt-2
```

This banner is the only mention of the restriction. It does not use the word "blocked",
"forbidden", or "cannot trade". The tone is explanatory, not prohibitive. Harry should
feel that Reward-only animals are SPECIAL, not that something is being taken away.

Content top padding for PetDetailSheet scroll container: this is an existing component
and its padding is not changed by this feature. The banner slots into the existing
content flow between narrative and footer.

### 4c. StoreHubScreen — Marketplace and Auctions tabs

Reward-only animals must never appear in:
- The NPC Marketplace browse tab
- The Auctions tab grid
- Any NPC buyer offer panel

This is a data-layer constraint, not a UI filter. The Developer must ensure that
animal records with `isTradeable === false` are excluded from marketplace and auction
data sources at the query level. No UI gate is needed on the store side — if the data
is correct, Reward-only animals simply never appear there.

### 4d. Content container class strings (FE reference)

PetDetailSheet content scroll area (existing, unchanged):
```
px-6 pt-4 pb-24 max-w-3xl mx-auto w-full
```

The Reward-only banner is a flex child within this container, requiring no additional
wrapper padding.

---

## 5. Generate Wizard — tier communication

### 5a. Category step (Step 1)

Each category card (Home, Stables, Farm, Wild, Lost World, Sea) receives a small
inline tier indicator in its bottom-left corner, over the card image or below the label.

```
Tradeable categories (At Home, Stables, Farm):
  Small badge: "Tradeable" — green tint-pair (var(--green-sub) bg, var(--green-t) text)
  Size: 10px/600, padding 2px 6px, pill
  Position: below label, or as a sub-label line

Reward-only categories (Wild, Lost World, Sea):
  Small badge: "Reward-only" — amber tint-pair
  Same size and treatment as above
```

These are purely informational — they do not block selection. Harry can still choose
Wild if he wants a conservation animal.

### 5b. Results screen — tier disclosure strip

After the wizard generates an animal, the ResultsScreen shows the animal and name list.
A small disclosure strip sits between the breed/rarity badges and the narrative text.

**Tradeable disclosure:**
```
Background:  var(--green-sub)
Icon:        ArrowLeftRight (Lucide), 14px, var(--green-t)
Text:        "This animal can be listed for sale or put up for auction."
Font:        13px/400, var(--t2)
Padding:     10px 14px, r-md
```

**Reward-only disclosure:**
```
Background:  var(--amber-sub)
Icon:        Award (Lucide), 14px, var(--amber-t)
Text:        "This is a reward animal. You earned it — it can't be sold."
Font:        13px/400, var(--t2)
Padding:     10px 14px, r-md
```

This strip ensures Harry understands the trade status of the animal BEFORE he taps
Adopt, so there is no post-adoption surprise when the "List for Sale" button is absent.

The strip is one line on iPad, and wraps to two lines at 375px. It must not be taller
than 60px at 375px to avoid pushing the Adopt button off-screen on small devices.

### 5c. What the wizard does NOT change

- Step 2 (Type) and Step 6 (Breed) are unchanged — no tier filtering of options. Harry
  is free to generate any animal type. The tier badge on the category card in Step 1
  provides sufficient upfront communication.
- The TraderPuzzle post-adoption flow is unaffected.
- The adoption cost/coin mechanics are unaffected.

---

## 6. Migration state — existing wild animals

When this feature ships, Harry may already have Wild, Lost World, or Sea animals in
his collection with `status === 'active'`. These animals automatically become
Reward-only under the new rules.

No migration UI is needed. The Reward-only badge and informational banner will appear
automatically on those animals the next time Harry opens them, because tier is derived
from category at render time.

There is no "your animal was reclassified" notification. The change is silent — Harry
simply sees the new badge when he next visits those animals. This avoids creating
alarm or confusion.

If Harry had previously attempted to list a wild animal (prior to this feature shipping),
any active `for_sale` listings for Reward-only animals must be cancelled by the data
migration script. The Developer must handle this edge case. From a UI perspective, those
animals will revert to `status === 'active'` and show the Reward-only banner as normal.

---

## 7. Interaction states

### Tier badge (read-only pill — non-interactive)

| State | Treatment |
|-------|-----------|
| Default | Tint-pair as specified in section 2 |
| No hover state | Badge is not interactive — no hover treatment |
| Focus | Not focusable — purely decorative/informational |

### Reward-only informational banner (read-only)

| State | Treatment |
|-------|-----------|
| Default | Amber tint-pair background, as specified in section 4b |
| No interactive states | Banner is read-only — no tap, hover, or focus |

### Tier indicator on category cards (Generate Wizard, Step 1)

The indicator is a non-interactive label. The card itself retains its existing hover
and active states unchanged (blue-sub bg + blue border when selected, scale(.97) active).

### "List for Sale" button — absent for Reward-only (section 4a)

No disabled state is defined because the button is removed from the DOM. FE must not
render a disabled version as a "placeholder" — the element must be absent entirely.

---

## 8. PageHeader slot assignment

This feature introduces no new header controls. Existing PageHeader slot assignments in
My Animals and StoreHubScreen are unchanged.

Navigation ownership: no new navigation controls. The centre-slot tab switchers in
My Animals (Animals | Items | Cards) and StoreHubScreen (Marketplace | Items | Cards |
Auctions) are unchanged.

---

## 9. Accessibility

- Tier badges include visible text labels, not icon-only indicators. Icon is supplementary.
- The informational banner uses sufficient colour contrast: `var(--amber-t)` on
  `var(--amber-sub)` meets WCAG 2.1 AA for text at 13px+.
- Reward-only informational banner has `role="note"` so screen readers announce it as
  supplementary information rather than main content.
- The absence of the "List for Sale" button for Reward-only pets must be
  explained by the banner above the footer. Screen readers moving through the footer
  will not encounter the button, but the banner text provides the reason.
- All DS spacing and touch target rules apply. The banner is not interactive, so no
  minimum touch target applies to it.
- All animations respect `prefers-reduced-motion` (badge and banner are static — no
  animation introduced by this feature).

---

## 10. Handoff notes for Frontend Engineer

1. Implement `isTradeable(category: AnimalCategory): boolean` as a pure exported
   function in `src/lib/animalTiers.ts`. Tradeable categories: `'At Home'`,
   `'Stables'`, `'Farm'`. All others return `false`. This function is the single
   source of truth — no inline category checks in components.

2. Add a `TierBadge` component to `src/components/ui/TierBadge.tsx`. It accepts a
   `tradeable: boolean` prop and renders the correct pill. Do not repeat the badge
   styling inline across multiple components.

3. PetCard: import `TierBadge` and `isTradeable`. Add tier badge to badge row after
   RarityBadge. No layout changes beyond this addition.

4. PetDetailSheet: conditionally render the Reward-only informational banner (section 4b)
   and hide the "List for Sale" button when `!isTradeable(pet.category)`. The banner
   sits in the content scroll area, above the footer, below narrative text.

5. ResultsScreen (Generate Wizard): add the tier disclosure strip (section 5b) between
   rarity badges and narrative text. The strip is rendered unconditionally — always
   shown, content determined by `isTradeable`.

6. GenerateScreen Step 1 category cards: add small sub-label tier indicator below the
   category name. This is a text/badge addition to the existing OptionGrid item — not
   a structural change.

7. Data layer: ensure marketplace and auction queries filter out Reward-only animals.
   No UI gate required — exclusion happens at query level.

8. Migration: write a one-time migration in `src/lib/db.ts` to cancel any active
   `for_sale` listings on animals whose category is now Reward-only. Run on app init,
   check a migration version flag to prevent re-running.

9. Overlay surface treatment: the informational banner is not a floating overlay — it
   is an inline block element. Glass rule does not apply. It uses the amber tint-pair
   surface as specified.

10. Self-review gate: after building TierBadge, open PetCard at 375px and 1024px and
    confirm the badge row does not overflow its container and wraps cleanly at 375px.
