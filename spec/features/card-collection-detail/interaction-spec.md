# Interaction Spec — card-collection-detail

**Feature:** CollectedCardDetailSheet
**Phase:** A (UX)
**Date:** 2026-03-28
**Status:** Ready for Phase B (PO)

---

## Overview

Tapping a card in the `CollectionGrid` currently has no behaviour. This feature adds a
`CollectedCardDetailSheet` — a bottom sheet that displays full details for a single
`CollectedCard`. The sheet is view-only. There are no action buttons. No card can be
sold, traded, or released from this screen; those are Tier 3 features.

---

## PageHeader slot assignment

No new PageHeader controls are introduced by this feature. The sheet renders as an
overlay on top of the existing CardsContent. The existing centre-slot tab switcher
(Packs / Collection) is unchanged.

---

## Trigger

- **Tap target:** the entire card tile in `CollectionGrid` becomes tappable
- **Touch area:** the full card surface — image + info strip. The card currently has no
  `onClick` handler. FE adds one.
- **Hover state (iPad cursor / desktop):** existing DS card hover pattern applies to the
  collection grid tile after this change — `motion-safe:hover:-translate-y-0.5
  hover:shadow-[0_4px_24px_rgba(0,0,0,.25)] hover:border-[var(--border)]
  motion-safe:active:scale-[.97] transition-all duration-300`. The border colour at rest
  stays rarity-coded (existing behaviour); at hover it steps up one level to
  `var(--border)`.
- **Focus state (keyboard):** `outline: 2px solid var(--blue); outline-offset: 2px` on
  the card tile. Required for WCAG 2.1 AA.
- **Disabled state:** none. All cards in the collection are tappable.

---

## Sheet anatomy

### Container

```
Component:        CollectedCardDetailSheet
Wraps:            BottomSheet (existing UI component)
Surface:          rgba(13,13,17,.80) + backdrop-filter: blur(24px)
Border:           1px solid rgba(255,255,255,.06) — top + sides, no bottom border
Radius:           16px 16px 0 0 (top corners only, --r-xl)
Backdrop:         bg-black/10 (light scrim — never higher)
Max height:       85vh (existing BottomSheet default)
Scroll:           Internal content is scrollable when it overflows max height.
                  Outer scroll container: overflow-y: auto with -webkit-overflow-scrolling: touch
Inner container:  max-w-xl mx-auto w-full px-6 pt-2 pb-10
```

The `max-w-xl mx-auto` constraint is mandatory. On iPad at 1024px, an unconstrained
sheet spans the full screen width and the content reads as uncomfortably wide. `max-w-xl`
(576px) centres the content within the sheet and mirrors the proportions of other detail
sheets in the app.

### Drag handle

At the top of the sheet, above all content:

```
Width:      40px
Height:     4px
Background: rgba(255,255,255,.20)
Radius:     9999px (pill)
Margin:     8px auto 0
```

The drag handle is rendered by the existing `BottomSheet` component. No new
implementation is needed.

### Dismiss behaviour

- Tap on the backdrop closes the sheet (existing `BottomSheet` behaviour)
- Drag the drag handle downward to close (existing `BottomSheet` behaviour)
- No explicit close button is required inside the sheet body. The drag handle and
  backdrop tap are sufficient affordances.

---

## Section 1 — Hero area

```
Layout:         Stacked vertically (image above name row)
Image:          Full-width hero image, aspect-ratio: 4/3, object-fit: cover,
                border-radius: var(--r-lg) (16px), width: 100%
                Do not clip image inside a circle or square thumbnail.
Name row:       flex, align-items: center, justify-content: space-between, gap: 8px
                margin-top: 16px
  Card name:    22px / 600 / var(--t1) / line-height: 1.35
                Truncate with ellipsis if name exceeds one line
  RarityBadge:  Use the existing RarityBadge component exactly as-is.
                shrink-0 to prevent it from being squeezed by a long name.
Subtitle row:   margin-top: 4px
                "{breed} · {animalType}" (middot separator)
                13px / 400 / var(--t3)
```

**RarityBadge consistency check:** `RarityBadge` from `src/components/ui/Badge.tsx`
automatically maps rarity to the correct tint pair. Do not reimplement. Import and use
the component directly. The badge text is capitalised by the component (`rarity.charAt(0).toUpperCase() + rarity.slice(1)`).

---

## Section 2 — Stats block

Five stats displayed as labelled progress bars. Order:
`SPEED`, `STRENGTH`, `STAMINA`, `AGILITY`, `INTELLIGENCE`

Each stat row:

```
Layout:     flex, align-items: center, gap: 12px
            margin-bottom: 10px (between rows); no margin on the last row

Label:      11px / 700 / uppercase / letter-spacing: 1.5px / var(--t3)
            Width: fixed at 100px (shrink-0) so all bars are left-aligned
            (Hairline style from DS typography table)

Bar track:  flex-1, height: 6px, border-radius: 100px
            background: var(--border-s)

Bar fill:   height: 6px, border-radius: 100px
            width: {value}% (value is 1–100, maps directly to percentage)
            background: rarity-coded fill colour (see table below)

Value:      15px / 600 / var(--t1)
            Width: fixed at 28px (shrink-0), text-align: right
            Placed after the bar (right-aligned in the row)
```

**Rarity fill colours for stat bars:**

| Rarity    | Fill token     | Hex       |
|-----------|----------------|-----------|
| common    | `var(--t4)`    | `#52566A` |
| uncommon  | `var(--green)` | `#45B26B` |
| rare      | `var(--blue)`  | `#3772FF` |
| epic      | `var(--purple)`| `#9757D7` |
| legendary | `var(--amber)` | `#F5A623` |

These are solid fills on the bar track, not tint pairs. The bar is a narrow data
visualisation element, not a badge — solid fill reads clearly at 6px height. Tint-pair
pattern applies to badges and pills only.

**Stats block margin:** `margin-top: 20px` from the subtitle row above.

---

## Section 3 — Duplicates row

Rendered only when `duplicateCount > 0`. When `duplicateCount === 0`, this section is
entirely absent — no empty space, no placeholder.

```
Layout:         flex, align-items: center, margin-top: 16px

Pill:           inline-flex, align-items: center, gap: 6px
                padding: 4px 10px
                border-radius: 100px (pill)
                background: var(--elev)
                border: 1px solid var(--border-s)

Pill text:      "×{duplicateCount + 1} copies"
                13px / 500 / var(--t3)
```

The display value is `duplicateCount + 1` because `duplicateCount` counts extra copies
beyond the first. A `duplicateCount` of 2 means the player holds 3 total copies, so the
pill reads "×3 copies".

---

## Section 4 — Description

```
Margin-top:     16px
Text:           13px / 400 / var(--t2) / italic / line-height: 1.5
                Full text — no truncation. Wrap onto as many lines as needed.
```

This is the `description` string from `CollectedCard` — flavour text such as "A rare
Siberian Husky with remarkable natural abilities."

---

## Section 5 — Ability section (conditional)

Rendered only when `ability` is a non-empty string. When `ability` is `undefined`,
`null`, or an empty string, this section is entirely absent. No placeholder, no "no
ability" label.

```
Margin-top:     20px
Separator:      1px solid var(--border-s) above the ability section, full width,
                margin-bottom: 16px

Header row:     flex, align-items: center, gap: 8px
  Zap icon:     Lucide Zap, size: 16, stroke-width: 2
                Color: rarity-coded (use the same solid token as the stat bar fill
                for the card's rarity — see rarity fill colours table above)
  Ability name: 15px / 600 / var(--t1)

Description:    margin-top: 4px
                13px / 400 / var(--t2)
                Full text, no truncation
```

**Icon rule:** Lucide `Zap` icon only. No emoji. Do not use any other icon for the
ability indicator.

**Currently empty:** `ability` and `abilityDescription` are always undefined in the
current dataset. This section will therefore never render in the initial build. The
conditional logic must still be implemented correctly so future data populates it without
a code change.

---

## Section 6 — No action buttons

This sheet is view-only. Do not add:
- A "Sell" button
- A "Trade" button
- A "Release" button
- Any placeholder or disabled button
- Any footer row

The sheet ends after the description (or ability section if present), followed by
`pb-10` bottom padding to ensure content clears the safe area and provides visual
breathing room.

---

## Interaction states — all interactive elements

The sheet is view-only. The only interactive elements are the dismiss mechanisms.

| Element | Hover | Active | Focus | Disabled |
|---|---|---|---|---|
| Backdrop | — | — | — | n/a |
| Drag handle | — | — | — | n/a |
| Card grid tile (trigger) | DS card hover pattern: `translateY(-2px)`, `shadow: var(--sh-card)`, `border: var(--border)` | `scale(0.97)` | `outline: 2px solid var(--blue); outline-offset: 2px` | n/a |

There are no buttons, links, or inputs within the sheet body. No hover or focus states
are required inside the sheet.

---

## Overlay surface treatment

This component uses the existing `BottomSheet` wrapper from `src/components/ui/Modal`.
The glass rule applies as defined in the DS:

```
Background:     rgba(13,13,17,.80)
Backdrop-filter: blur(24px)
Border:         1px solid rgba(255,255,255,.06)
Backdrop div:   bg-black/10 — never higher
```

The `BottomSheet` component must be rendered via `ReactDOM.createPortal(content,
document.body)` to prevent fixed-position containment inside any Framer Motion animated
ancestor. This is an existing requirement in the DS portal pattern and applies here.
FE must verify the existing `BottomSheet` already uses `createPortal` before building
this feature. If it does not, that is a pre-existing defect that must be fixed as part
of this feature's Phase C.

**Consistency check:** This sheet must read as the same material as `PackConfirmSheet`
and `PetDetailSheet`. Both use the same `BottomSheet` wrapper. No new glass treatment
tokens are introduced.

---

## Animation

| Event | Behaviour |
|---|---|
| Sheet open | Framer Motion spring `{ type: "spring", stiffness: 300, damping: 30 }`, `y: "100%" → 0`, `opacity: 1 → 1` (no fade — the sheet slides up, it does not fade in) |
| Sheet close | Reverse: `y: 0 → "100%"` |
| Reduced motion | `prefers-reduced-motion: reduce` — skip spring animation entirely, show/hide instantly with no transition |

The existing `BottomSheet` component handles open/close animation. FE must confirm the
existing animation parameters match the spring spec above before Phase C closes. If they
differ, align to `stiffness: 300, damping: 30`.

**No internal animations:** No stat bar fill animation, no entrance animation on
individual sections. The sheet content renders immediately at full state when the sheet
opens.

---

## iPad layout (primary target — 1024px)

The sheet renders as a bottom sheet on all screen sizes. On iPad at 1024px, the sheet
panel spans the full screen width. The inner content container is constrained:

```
max-w-xl mx-auto w-full px-6 pt-2 pb-10
```

This produces a 576px content column centred within the full-width sheet panel. This
matches the content constraint used in `PackConfirmSheet` (`max-w-3xl`) but tightened
to `max-w-xl` because card detail is a single-column reading layout — there is no
benefit to a wider column.

FE must verify at 1024px that:
1. The hero image is not full-screen width — it is constrained to `max-w-xl`
2. The stat bars are not excessively long
3. The sheet panel still extends to the full viewport width (the constraint is on the
   inner container, not the sheet panel)

---

## Empty and error states

| Scenario | Handling |
|---|---|
| `card` prop is null or undefined | Sheet does not render (`if (!card) return null`) |
| `imageUrl` is missing or broken | AnimalImage component handles fallback (existing behaviour) |
| `description` is empty string | The section still renders — an empty `<p>` tag is acceptable. Evidence of a data gap, not a UI error. |
| `duplicateCount === 0` | Duplicates row is hidden entirely |
| `ability` is undefined / empty | Ability section is hidden entirely |

---

## Consistency check — existing components

| Element | Existing pattern | Action |
|---|---|---|
| `RarityBadge` | `src/components/ui/Badge.tsx` | Import and use as-is. Do not reimplement. |
| `BottomSheet` wrapper | `src/components/ui/Modal` | Use existing component. |
| `AnimalImage` | Used in `CollectionGrid` and `PetDetailSheet` | Use same component for hero image. |
| Progress bar fill colour | Rarity colour tokens from DS | Use DS solid tokens — no custom hex values. |
| Sheet glass treatment | Matches `PackConfirmSheet` and `PetDetailSheet` | No new tokens. |

The `CollectionGrid` currently renders card tiles with rarity-coded border colours.
These border colours (`var(--amber)` for legendary, `var(--purple)` for epic, etc.) are
correct and should remain unchanged. This feature does not alter the grid tiles — it
only adds a tap handler.

---

## Page structure diagram

```
┌──────────────────────────────────────────────┐
│  BACKDROP  bg-black/10                       │
│  ┌────────────────────────────────────────┐  │
│  │         drag handle (40×4px)           │  │
│  │  ┌──────────────────────────────────┐  │  │
│  │  │  max-w-xl mx-auto w-full px-6    │  │  │
│  │  │                                  │  │  │
│  │  │  ┌────────────────────────────┐  │  │  │
│  │  │  │  HERO IMAGE  4:3  r-lg     │  │  │  │
│  │  │  └────────────────────────────┘  │  │  │
│  │  │                                  │  │  │
│  │  │  Card Name        [RarityBadge]  │  │  │
│  │  │  Breed · AnimalType              │  │  │
│  │  │                                  │  │  │
│  │  │  ──── STATS ──────────────────   │  │  │
│  │  │  SPEED     ████████░░░░░░░  78   │  │  │
│  │  │  STRENGTH  ██████░░░░░░░░░  62   │  │  │
│  │  │  STAMINA   █████████░░░░░░  85   │  │  │
│  │  │  AGILITY   ███████░░░░░░░░  71   │  │  │
│  │  │  INTEL     ████░░░░░░░░░░░  44   │  │  │
│  │  │                                  │  │  │
│  │  │  [×3 copies]  ← if dupes > 0    │  │  │
│  │  │                                  │  │  │
│  │  │  "A rare Siberian Husky with…"  │  │  │
│  │  │                                  │  │  │
│  │  │  ─────────────────────────────  │  │  │
│  │  │  ⚡ Ability Name                 │  │  │  ← only if ability exists
│  │  │  Ability description text        │  │  │
│  │  │                                  │  │  │
│  │  │  [pb-10 bottom padding]          │  │  │
│  │  └──────────────────────────────────┘  │  │
│  │                                        │  │
│  │  BOTTOM SHEET GLASS SURFACE            │  │
│  │  rgba(13,13,17,.80) + blur(24px)       │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

---

## Content top padding

The full class string for the inner content container below the drag handle:

```
px-6 pt-2 pb-10 max-w-xl mx-auto w-full
```

`pt-2` (8px) provides minimal clearance below the drag handle, which itself has `mt-2`
built in. The drag handle is rendered by `BottomSheet` — the content container sits
immediately below it.

---

## Accessibility

- All tappable card tiles in `CollectionGrid` must receive `role="button"` and
  `tabIndex={0}` if they are implemented as `<div>` elements, to ensure keyboard
  navigability.
- The sheet must trap focus while open: the first focusable element inside the sheet
  should receive focus on open; focus must return to the triggering card tile on close.
  This is an existing behaviour of the `BottomSheet` component — FE must confirm it is
  implemented.
- `aria-label` on the card tile trigger: `"View details for {card.name}"`.
- `aria-modal="true"` on the sheet panel.
- Colour is not the only way rarity is communicated — the `RarityBadge` text label
  ("Common", "Rare", etc.) provides a text alternative.
- Minimum touch target for card tiles: the existing card tile height is sufficient.
  No change required.

---

## Developer handoff notes

1. The `CollectionGrid` function in `StoreHubScreen.tsx` renders card tiles as plain
   `<div>` elements with no `onClick`. Add an `onClick` prop to `CollectionGrid` and
   wire each tile to `() => onCardTap(card)`.

2. `CardsContent` manages the `BottomSheet` open state, selected card state, and renders
   `CollectedCardDetailSheet`. Pattern matches how `confirmPack` / `PackConfirmSheet` is
   already handled in the same component.

3. The `CollectedCardDetailSheet` is a new component in
   `src/components/cards/CollectedCardDetailSheet.tsx`. It accepts:
   ```
   interface CollectedCardDetailSheetProps {
     card: CollectedCard | null
     open: boolean
     onClose: () => void
   }
   ```

4. Stat bar fill width is `style={{ width: \`${stat.value}%\` }}`. The value range is
   1–100 so it maps directly to percentage width.

5. The rarity fill colour for stat bars is a solid token, not a tint pair. Acceptable
   because the bar is a narrow data visualisation element, not a badge.

6. Reduced motion check: `const reducedMotion = useReducedMotion()`. Pass to
   `BottomSheet` if it accepts a `reducedMotion` prop, or the `BottomSheet` component
   reads the hook internally — verify before Phase C.

7. Do not add any action buttons or footer rows. This spec intentionally omits them.
   If a future feature brief requires actions, a new spec will be written.
