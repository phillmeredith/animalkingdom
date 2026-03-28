# Interaction Spec — Shop Item Card Redesign

Feature: `shop-item-card`
Author: UX Designer
Date: 2026-03-27
Status: Ready for Phase C

---

## Problem statement

The current `ItemCard` in `ShopScreen.tsx` uses a 20px icon in a flat grey square. The card
communicates almost nothing about what the player is buying. Every card looks identical. The
item name is 11px and there is no description, no effect summary, and no useful owned state.
The category colour system exists in the DS but is not used.

This spec defines a new card layout that makes the icon the hero of the card, applies per-category
colour from the DS, and gives the player enough information to make a purchase decision without
opening the bottom sheet.

---

## Scope

This spec covers the `ItemCard` component only. The `PurchaseSheet` (bottom sheet) and the
`ShopScreen` grid layout are out of scope — they do not change.

The grid that wraps `ItemCard` remains: `grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2`.

---

## Category colour pair assignments

Each category maps to one DS colour pair. The pair is: `--{colour}-sub` as the icon well
background, `--{colour}-t` as the icon colour.

| Category | Colour name | Icon well bg token | Icon colour token | Hex (bg) | Hex (icon) |
|----------|-------------|-------------------|------------------|----------|-----------|
| `saddle` | Amber | `--amber-sub` | `--amber-t` | `rgba(245,166,35,.12)` | `#FCC76E` |
| `brush` | Green | `--green-sub` | `--green-t` | `rgba(69,178,107,.12)` | `#7DD69B` |
| `feed` | Pink | `--pink-sub` | `--pink-t` | `rgba(232,36,124,.12)` | `#F06EAB` |
| `toy` | Blue | `--blue-sub` | `--blue-t` | `rgba(55,114,255,.12)` | `#6E9BFF` |
| `blanket` | Purple | `--purple-sub` | `--purple-t` | `rgba(151,87,215,.12)` | `#BA8DE9` |

Rationale:
- Saddle → Amber: speed/race energy, matches the amber "warm" gradient used for racing themes in the DS.
- Brush → Green: care and hygiene, matches DS "care/nature themes" for green.
- Feed → Pink: pink is the CTA/reward colour. Feed is a frequent, core purchase action.
- Toy → Blue: play and interaction, matches DS "Explore, connect, utility" for blue.
- Blanket → Purple: comfort and premium, matches DS "feature/special" for purple.

These assignments must not be changed without a design review. Do not default every category to blue.

---

## Card layout — detailed written spec

### Card container

- Element: `<button>` (interactive, triggers the purchase bottom sheet on tap)
- Background: `var(--card)` — `#18181D`
- Border: `1px solid var(--border-s)` — `#2C2F3A` at rest
- Border radius: `var(--r-lg)` — `16px`
- Padding: `12px` on all sides (DS scale value, provides visible breathing room)
- Display: `flex`, direction `column`, gap `8px` between all child sections
- Width: 100% of grid cell
- Min height: none — let content drive height
- Hover state: border becomes `1px solid var(--border)` (`#353945`), `translateY(-2px)`,
  shadow `var(--sh-card)` (`0 4px 24px rgba(0,0,0,.25)`), transition `all 300ms`
- Active/press state: `scale(0.97)`, transition `150ms`
- Focus state: `outline: 2px solid var(--blue); outline-offset: 2px`
- No shadow at rest (DS rule: no shadows on static elements)

### Section 1 — Icon well

- Element: `<div>`, a square container
- Aspect ratio: `1 / 1` (always square, fills card width)
- Background: the category's `-sub` token (see colour pair table above)
- Border radius: `var(--r-md)` — `12px`
- Contents: one Lucide icon, centred horizontally and vertically
- Icon size: `40px` (stroke-width 2, colour = category's `-t` token)
- No border on the icon well
- Position: `relative` (to allow the owned badge to be positioned absolutely inside it)

Icon size rationale: The DS default icon is 24px. Button icons are 16–20px. At 40px the icon
becomes the primary visual identity of the card rather than a decorative detail. 48px was
considered but makes the well feel cramped on small grid cells at 375px.

### Section 2 — Item name and effect line

- Element: `<div>`, flex column, gap `2px`
- Item name: `13px`, weight `600`, colour `var(--t1)` (`#FCFCFD`), line-height `1.3`,
  max 2 lines, `overflow: hidden`, `display: -webkit-box`, `-webkit-line-clamp: 2`,
  `-webkit-box-orient: vertical`
- Effect line: the stat boost expressed as a short string, e.g. "+2 speed" or "+3 hygiene"
  - Font: `11px`, weight `500`, letter-spacing `0.5px`, colour `var(--t3)` (`#777E91`)
  - Constructed in the component from `item.statBoost.stat` and `item.statBoost.value`
  - Format: `+{value} {stat}` — no capitalisation, no units

Do not show `item.description` on the card. Description is shown in the bottom sheet only.
The effect line is sufficient to communicate value at card-scan speed.

### Section 3 — Price row

- Element: `<div>`, flex row, `align-items: center`, gap `4px`
- Price icon: Lucide `Coins`, `14px`, colour `var(--amber)` (`#F5A623`) when affordable,
  `var(--t4)` (`#52566A`) when the player cannot afford the item
- Price number: `13px`, weight `700`, colour `var(--amber-t)` (`#FCC76E`) when affordable,
  `var(--t4)` when cannot afford
- No border, no background — the price row is plain text

Affordable state is passed in as the `canAfford: boolean` prop (already exists in the
current implementation). Do not change the prop interface.

### Owned state overlay

When `ownedCount > 0`, an "Owned" indicator appears. This replaces the current 16px dot
badge which is too small to read.

- Element: a pill badge absolutely positioned in the top-right corner of the icon well
- Position: `absolute`, `top: 6px`, `right: 6px`
- Background: `var(--green-sub)` — `rgba(69,178,107,.12)`
- Text colour: `var(--green-t)` — `#7DD69B`
- Font: `11px`, weight `700`, uppercase, letter-spacing `0.5px`
- Padding: `2px 8px`
- Border radius: `var(--r-pill)` — `100px`
- Content: the word "OWNED" if `ownedCount === 1`, or the number + "×" if `ownedCount > 1`
  (e.g. "2×", "3×")
- Do not use a green dot. Text is required — colour alone cannot be the sole indicator (DS
  accessibility baseline: "colour is never the only indicator").

---

## Touch target

The entire card is the touch target. The card button must be at minimum `44px` tall in all
grid configurations. On a 375px viewport with `grid-cols-2 gap-2 px-6`, each cell is
approximately `(375 - 48 - 4) / 2 = 161px` wide. The icon well alone at `aspect-ratio: 1/1`
is 161px tall, so the minimum 44px requirement is met with significant headroom.

No separate touch target wrapper is needed.

---

## Accessibility requirements

- The `<button>` element must have an `aria-label` of `"{item.name}, {price} coins"`.
  Example: `aria-label="Leather Saddle, 50 coins"`.
- When `ownedCount > 0`, append `", owned"` to the aria-label.
  Example: `aria-label="Leather Saddle, 50 coins, owned"`.
- The Lucide icon inside the icon well is decorative — it must have `aria-hidden="true"`.
- The owned pill badge is presentational only (the aria-label carries the information).
  Add `aria-hidden="true"` to the owned pill.
- Focus ring: `outline: 2px solid var(--blue); outline-offset: 2px`. Do not suppress this
  with `outline: none` or `focus:outline-none`.

---

## Animation

- Press: `active:scale-[.97]` Tailwind utility, `transition-transform duration-150`
- Hover lift: `hover:-translate-y-0.5 hover:shadow-[var(--sh-card)]` with `transition-all duration-300`
- Respect `prefers-reduced-motion`: wrap transform and shadow transitions in a media query
  check or use the `useReducedMotion` hook. If reduced motion is preferred, apply state
  changes (border colour, background) only — no translate, no scale.

---

## What the FE must NOT do

- Do not use `size={20}` on the category icon. The icon must be `40px`.
- Do not use `text-[var(--blue-t)]` as a universal icon colour. Each category has its own colour.
- Do not use `p-2` (8px) as card padding. Use `p-3` (12px).
- Do not use a 16px coloured dot for the owned state. Use the text pill described above.
- Do not hardcode any hex values. All colours must reference DS CSS variables.
- Do not add drop shadow to the card at rest.
- Do not use `ghost` button variant anywhere on this card.

---

## DS token reference — complete list for this component

| Property | Token | Value |
|----------|-------|-------|
| Card background | `--card` | `#18181D` |
| Card border (rest) | `--border-s` | `#2C2F3A` |
| Card border (hover) | `--border` | `#353945` |
| Card hover shadow | `--sh-card` | `0 4px 24px rgba(0,0,0,.25)` |
| Focus ring | `--blue` | `#3772FF` |
| Item name | `--t1` | `#FCFCFD` |
| Effect line | `--t3` | `#777E91` |
| Price (affordable) — icon | `--amber` | `#F5A623` |
| Price (affordable) — text | `--amber-t` | `#FCC76E` |
| Price (cannot afford) | `--t4` | `#52566A` |
| Owned badge bg | `--green-sub` | `rgba(69,178,107,.12)` |
| Owned badge text | `--green-t` | `#7DD69B` |
| Saddle icon well bg | `--amber-sub` | `rgba(245,166,35,.12)` |
| Saddle icon colour | `--amber-t` | `#FCC76E` |
| Brush icon well bg | `--green-sub` | `rgba(69,178,107,.12)` |
| Brush icon colour | `--green-t` | `#7DD69B` |
| Feed icon well bg | `--pink-sub` | `rgba(232,36,124,.12)` |
| Feed icon colour | `--pink-t` | `#F06EAB` |
| Toy icon well bg | `--blue-sub` | `rgba(55,114,255,.12)` |
| Toy icon colour | `--blue-t` | `#6E9BFF` |
| Blanket icon well bg | `--purple-sub` | `rgba(151,87,215,.12)` |
| Blanket icon colour | `--purple-t` | `#BA8DE9` |

---

## Frontend Engineer implementation brief

This section is a direct handoff to the FE agent. Implement exactly what follows.

### File to edit

`src/screens/ShopScreen.tsx` — replace the `ItemCard` function and the `CATEGORY_ICON` map.
Do not touch `PurchaseSheet`, `ShopScreen`, or any other function in the file.

### New CATEGORY_ICON map

Replace the existing `CATEGORY_ICON` map (which used `size={20}` and a single colour) with
two separate maps:

```
CATEGORY_ICON_EL — a map from ItemCategory to the Lucide React element at size 40,
stroke-width 2, aria-hidden, with no colour class (colour is applied by the parent).

CATEGORY_WELL_CLASS — a map from ItemCategory to a Tailwind string for the icon well
background colour, using inline CSS variables since Tailwind does not know these tokens.
Use style prop, not className, for the background.
```

Concretely, the icon well `<div>` should receive:
- `style={{ background: CATEGORY_WELL_BG[item.category] }}`
- The icon inside should receive `style={{ color: CATEGORY_ICON_COLOR[item.category] }}`

Define these two record objects at the top of the file, replacing the current `CATEGORY_ICON`:

```
CATEGORY_WELL_BG: Record<ItemCategory, string> — CSS variable strings for well background
CATEGORY_ICON_COLOR: Record<ItemCategory, string> — CSS variable strings for icon colour
```

Values for each:

| Category | CATEGORY_WELL_BG value | CATEGORY_ICON_COLOR value |
|----------|----------------------|--------------------------|
| saddle | `var(--amber-sub)` | `var(--amber-t)` |
| brush | `var(--green-sub)` | `var(--green-t)` |
| feed | `var(--pink-sub)` | `var(--pink-t)` |
| toy | `var(--blue-sub)` | `var(--blue-t)` |
| blanket | `var(--purple-sub)` | `var(--purple-t)` |

### New ItemCard JSX structure

The component signature does not change:
```
function ItemCard({ item, ownedCount, canAfford, onTap }: {
  item: ItemDef
  ownedCount: number
  canAfford: boolean
  onTap: () => void
})
```

The JSX must match this structure exactly:

```
<button
  onClick={onTap}
  aria-label={`${item.name}, ${item.price} coins${ownedCount > 0 ? ', owned' : ''}`}
  className="w-full text-left rounded-[16px] border border-[var(--border-s)]
             bg-[var(--card)] p-3 flex flex-col gap-2
             transition-all duration-300
             hover:border-[var(--border)] hover:-translate-y-0.5
             hover:shadow-[0_4px_24px_rgba(0,0,0,.25)]
             active:scale-[.97] active:transition-none
             focus-visible:outline-2 focus-visible:outline-[var(--blue)] focus-visible:outline-offset-2"
>

  {/* ── Icon well ─────────────────────────────────────── */}
  <div
    className="relative w-full aspect-square rounded-[12px] flex items-center justify-center"
    style={{ background: CATEGORY_WELL_BG[item.category] }}
  >
    <span
      aria-hidden="true"
      style={{ color: CATEGORY_ICON_COLOR[item.category] }}
    >
      {CATEGORY_ICON_EL[item.category]}
    </span>

    {ownedCount > 0 && (
      <span
        aria-hidden="true"
        className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full
                   text-[11px] font-700 uppercase tracking-[0.5px]
                   bg-[var(--green-sub)] text-[var(--green-t)]"
      >
        {ownedCount === 1 ? 'OWNED' : `${ownedCount}×`}
      </span>
    )}
  </div>

  {/* ── Name + effect ─────────────────────────────────── */}
  <div className="flex flex-col gap-0.5">
    <span
      className="text-[13px] font-600 text-[var(--t1)] leading-snug
                 line-clamp-2"
    >
      {item.name}
    </span>
    <span className="text-[11px] font-500 tracking-[0.5px] text-[var(--t3)]">
      +{item.statBoost.value} {item.statBoost.stat}
    </span>
  </div>

  {/* ── Price ─────────────────────────────────────────── */}
  <div className={cn(
    'flex items-center gap-1 text-[13px] font-700',
    canAfford ? 'text-[var(--amber-t)]' : 'text-[var(--t4)]',
  )}>
    <Coins
      size={14}
      strokeWidth={2}
      aria-hidden="true"
      style={{ color: canAfford ? 'var(--amber)' : 'var(--t4)' }}
    />
    {item.price}
  </div>

</button>
```

### Lucide icon elements for CATEGORY_ICON_EL

Use the icons already imported at the top of the file. Change the `size` from 20 to 40 and
add `strokeWidth={2}` and `aria-hidden="true"` to each.

```
const CATEGORY_ICON_EL: Record<ItemCategory, React.ReactNode> = {
  saddle:  <Disc       size={40} strokeWidth={2} aria-hidden="true" />,
  brush:   <Paintbrush size={40} strokeWidth={2} aria-hidden="true" />,
  feed:    <Wheat      size={40} strokeWidth={2} aria-hidden="true" />,
  toy:     <Star       size={40} strokeWidth={2} aria-hidden="true" />,
  blanket: <BedDouble  size={40} strokeWidth={2} aria-hidden="true" />,
}
```

### Reduced motion

Wrap the hover translate and scale transforms with a `prefers-reduced-motion` guard using
the existing `useReducedMotion` hook if it is available in the codebase, or add the Tailwind
`motion-safe:` prefix to the translate and scale utilities:

- `motion-safe:hover:-translate-y-0.5`
- `motion-safe:active:scale-[.97]`

The border colour change and shadow may still apply — only movement must be suppressed.

### Self-review checklist before marking Phase C complete

1. At 375px: icon well is visually prominent (not tiny). Icon is clearly visible.
2. At 768px: grid shifts to 3 columns. Cards are not stretched or cut.
3. At 1024px: grid at 4 columns. Cards remain square-well proportioned.
4. Each category shows a distinct colour in the icon well — saddle is amber, brush is green,
   feed is pink, toy is blue, blanket is purple.
5. A card with `ownedCount > 0` shows "OWNED" or the count in the top-right of the well.
6. A card where `canAfford` is false shows the price in `--t4` (muted), not amber.
7. Focus ring is visible when tabbing through the grid.
8. No drop shadow on cards at rest. Shadow appears on hover only.
9. No emoji anywhere in the component.
10. No hardcoded hex values — all colours use CSS variable strings.

---

## Out of scope

- The `PurchaseSheet` bottom sheet does not change in this spec. It already uses `w-16 h-16`
  for the icon in the sheet header — that is acceptable and separate from the card.
- The `CATEGORY_ICON_NAME` export in `itemDefs.ts` does not need to change.
- Category filter pills do not change.
- The grid column classes in `ShopScreen` do not change.
