# Interaction Spec — Generate Rarity Gate

Feature: `generate-rarity-gate`
Status: Phase B approved
Last updated: 2026-03-27

---

## Summary

Generation is limited to Common and Uncommon animals only. Rare, Epic, and Legendary breeds are visible in the breed selection step but non-interactive, so the player understands they exist and where to find them. The Explore screen's `AnimalProfileSheet` also reflects this gate for animals at gated rarities.

---

## 1. Affected Screens and Components

| Location | Change |
|---|---|
| `GenerateScreen` — Step 6 (Breed selection) | Gated breeds rendered as locked cards |
| `AnimalProfileSheet` (Explore screen) | CTA swapped for Rare/Epic/Legendary animals |

---

## 2. Generate Wizard — Step 6 (Breed Selection)

### Current behaviour
All breeds for the selected animal type are shown as tappable option cards. Player taps a breed to advance to Step 7 (Colour).

### New behaviour
Breeds whose `rarity` in `BREEDS_BY_TYPE` is `'rare'`, `'epic'`, or `'legendary'` are rendered as locked cards in the same grid position. They do not advance the wizard on tap.

**Decision: show locked, not hidden.** Hiding gated breeds would remove discovery. Showing them locked teaches the economy and creates desire for the Marketplace.

---

## 3. Breed Grid Layout

The breed grid is already rendered by `OptionGrid` (or equivalent). Locked cards replace the selectable card at the same grid position. The grid itself does not change structure.

**Responsive columns (mandatory):**
- 375px: 2 columns
- 768px: 3 columns
- 1024px: 4 columns

Class: `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3`

---

## 4. Locked Breed Card — Visual Spec

A locked breed card occupies the same dimensions as a selectable breed card. It is non-tappable and non-hoverable.

**Structure (top to bottom):**

```
┌─────────────────────────────────┐
│  [Animal image — greyed/dimmed] │  aspect-square, opacity-40
│                                 │
│  [Lock icon, centered overlay]  │  Lucide `Lock`, size 24,
│                                 │  colour var(--t3), absolute center
├─────────────────────────────────┤
│  [Breed name]                   │  text-[14px] font-600 text-t3
│  Rare+ · Find in Marketplace    │  text-[11px] text-t3, mt-0.5
└─────────────────────────────────┘
```

**Tokens:**
- Background: `var(--card)` (same as unlocked card)
- Border: `var(--border-s)` (no rarity-colour highlight — locked cards do not earn colour treatment)
- Image: `opacity-40` via Tailwind `opacity-40` class on the `<img>` element
- Lock icon overlay: `position: absolute`, centered within the image area, `Lock` from `lucide-react`, `size={24}`, `className="text-[var(--t3)]"`
- Breed name: `text-[14px] font-600 text-t3` (dimmed, not `text-t1`)
- Sub-label: `text-[11px] text-t3 mt-0.5` — literal text: `"Rare+ · Find in Marketplace"`
- No cursor pointer (`cursor-default`)
- No hover state (`pointer-events-none` on the card itself)
- No `tabIndex` or keyboard interaction

**Unlocked breed card (existing pattern — no change):**
- Background `var(--card)`, border `var(--border-s)` at rest → `var(--border)` on hover
- Image full opacity
- Breed name `text-t1`
- Tappable, advances wizard to Step 7

---

## 5. Interaction States Summary

| State | Card appearance | Tap behaviour |
|---|---|---|
| Unlocked (Common / Uncommon) | Full colour, text-t1 | Advances to Step 7 |
| Locked (Rare / Epic / Legendary) | Dimmed image, Lock icon, text-t3 | No action |

---

## 6. Explore Screen — AnimalProfileSheet CTA

`AnimalProfileSheet` currently shows a "Generate this animal" button that navigates to `/generate?type=...&breed=...` for all animals.

### New behaviour

When `animal.rarity` is `'rare'`, `'epic'`, or `'legendary'`:

- **Replace** the "Generate this animal" button with a "Find in Marketplace" button (variant `accent`, full width)
- Button navigates to `/shop` (the Shop/Marketplace screen)
- **Add** secondary text beneath the button: `"Common & Uncommon only · Rare and above from marketplace"`
  - Style: `text-[12px] text-t3 text-center mt-2`

When `animal.rarity` is `'common'` or `'uncommon'`:
- Existing "Generate this animal" button and behaviour unchanged

**CTA button spec (gated state):**

```
variant="accent"   (pink, full width)
size="md"
icon: ShoppingBag (lucide-react, size 16, left of label)
label: "Find in Marketplace"
onClick: navigate('/shop')
```

---

## 7. Edge Cases

| Scenario | Behaviour |
|---|---|
| Player arrives at breed step via Explore deep-link (`/generate?type=...&breed=...`) for a gated breed | The gated breed card is shown locked; wizard does not auto-advance. Player must select an unlocked breed or exit. |
| All breeds for an animal type are gated | The entire breed grid shows locked cards. The WizardHeader back button is the only exit. No empty-state message needed — cards are visible. |
| Player taps a locked card | No action, no toast. The lock icon is sufficient affordance. |

---

## 8. Animation and Motion

No new animations required. Locked cards are static. Existing card selection animation (scale/highlight) applies only to unlocked cards.

---

## 9. Design System Compliance Checklist

To be verified by FE agent after build:

1. No emojis — Lucide `Lock` and `ShoppingBag` icons only
2. No `ghost` variant — locked card is not a button; CTA uses `accent`
3. All colours use `var(--...)` tokens — no hardcoded hex
4. Surface: locked card uses `var(--card)` (same level as unlocked); no surface step-up on a non-interactive element
5. Layout verified at 375px, 768px, 1024px — grid columns correct at each breakpoint
6. All scrollable content has `pb-24`
