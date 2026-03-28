# Interaction Spec — lemieux-equipment-system

**Feature:** LeMieux Equipment System — real product catalogue, horse equipment slots, item collection
**Phase:** A (UX)
**Date:** 2026-03-28
**Status:** Ready for Phase B (PO) and Owner approval

---

## Overview and user need

Harry wants to equip his virtual horses with real LeMieux gear — the same brand whose real-world products he knows and loves. The feature has three interconnected surfaces:

1. **Store — Items section:** Replace made-up items with the 411 real LeMieux horsewear products, browsable by category with coin prices.
2. **Horse Equipment screen:** A dedicated screen where Harry picks a horse and outfits it using Minecraft-style equipment slots arranged around the horse image.
3. **My Animals — Item Collection tab:** A collection view within My Animals that shows every item Harry has purchased, with equipped/unequipped status.

The core loop is: earn coins through care and games → spend coins in the Shop → equip purchased items to a horse → see the horse visually updated.

This feature is designed for a child user (Harry, ADHD and autism). Every interaction must have:
- Immediate visual feedback (within 200ms of any tap)
- No ambiguous states — a slot is clearly empty or clearly filled
- Drag-to-slot is the primary equip interaction — confirmed by [OWNER] 2026-03-28. Tap-to-equip is a fallback only.
- Predictable, reversible actions — equipping and unequipping is always undoable

---

## Product data — category inventory and equippability

Based on review of `/Users/phillm/Dev/Animalkingdom/lemieux/horsewear/products.json` (411 items across 9 URL categories) and `/Users/phillm/Dev/Animalkingdom/lemieux/hobby-horses/products.json` (63 items).

### Horsewear category analysis

| URL slug | Item count | Equippable? | Equipment slot |
|---|---|---|---|
| `fly-hoods` | 54 | Yes | Head |
| `headcollars-leadropes` | 51 | Yes — headcollars only; leadropes are accessories | Head (headcollars), Accessory (leadropes) |
| `horse-rugs` | 57 | Yes | Body |
| `boots-bandages` | 54 | Yes — boots only; bandages are also leg items | Legs (all 4) |
| `saddlery-tack` | 47 | Yes — saddles and saddle pads to Saddle slot; bridles, reins, bits to Bridle slot; seat savers and accessories to Accessory | Saddle / Bridle / Accessory |
| `fly-protection` | 36 | Partial — fly masks to Head; fly boots to Legs; fly sprays, nose filters, itch relief are consumables | Head (masks), Legs (boots), Consumable (sprays) |
| `grooming-care` | 59 | No — brushes, grooming bags, first aid, hoof care are non-equippable care items | Care |
| `stable-yard` | 30 | No — stable toys, accessories, haynets, treats are non-equippable | Stable |
| `supplements` | 23 | No — calmers, joint supplements, electrolytes are consumables | Consumable |

### Slot-to-category mapping (finalised)

| Slot ID | Display name | Accepted product categories |
|---|---|---|
| `head` | Head | fly-hoods, headcollars, fly-masks |
| `body` | Rug | horse-rugs |
| `front-left` | Front Left | boots-bandages, fly-boots |
| `front-right` | Front Right | boots-bandages, fly-boots |
| `back-left` | Back Left | boots-bandages, fly-boots |
| `back-right` | Back Right | boots-bandages, fly-boots |

**One-drag rule for leg slots — NON-NEGOTIABLE:** All four leg slots (`front-left`, `front-right`, `back-left`, `back-right`) are a single logical group. The following rules apply without exception:

- **One drag fills all four:** When Harry drags or double-taps a boots/bandages item (primary or fallback path), all four leg slots fill simultaneously. Only one inventory item is consumed — Harry does NOT need to drag four times or own four copies.
- **Stagger animation:** Slots animate in sequence — front-left → front-right → back-left → back-right — with 80ms between each. Each slot animates `scale: 0 → 1` with `{ type: "spring", stiffness: 400, damping: 20 }`.
- **One double-tap unequips all four:** Double-tapping any single filled leg slot immediately unequips all four slots and returns exactly one item to inventory. There is no way to unequip a single leg slot independently.
- **Selected state is shared:** When any one leg slot enters selected state (tap fallback path), all four leg slots visually enter selected state (blue border + glow on all four) simultaneously. This communicates to Harry that they act as a set.

See "Leg slot one-drag behaviour" section below for the full interaction sequence.
| `saddle` | Saddle | saddlery-tack (saddles, saddle pads, seat savers) |
| `bridle` | Bridle | saddlery-tack (bridles, reins, bits, bridle parts) |

**Total equippable slots: 8**

### Non-equippable items — handling

These items are **purchasable but not equippable**. They appear in the shop and in the Item Collection, but the Equipment screen does not show a slot for them. They do not provide a stat boost (that concept is retired with the old item system). Instead, they form a collectible display:

- **Grooming & Care** (`grooming-care`): shown in collection with "Care" label
- **Stable & Yard** (`stable-yard`): shown in collection with "Stable" label
- **Supplements** (`supplements`): shown in collection with "Supplement" label
- **Consumables** (fly sprays, nose filters, itch relief): shown with "Fly Protection" label

No "use" mechanic is in scope for this feature. These items are collectible items only. A care bonus system (if wanted in future) is a separate feature.

---

## Hobby horses — decision

Hobby horses (63 items) are **toy stick horses for children** — a real LeMieux product line. They are not virtual horses and cannot be equipped on the virtual horse slots.

**Decision: in scope as collectibles, displayed on a dedicated shelf in the Item Collection.**

Rationale: Harry is the target user for this exact product. The hobby horses have named characters with backstories (Poppy, Dazzle, Earl, Dakota, Dream, Toby, Sundance, etc.). These are highly collectible for a child. Excluding them would be a missed opportunity. They are shop-purchasable, appear in the Item Collection under their own "Hobby Horses" section, and display on a shelf-style layout that visually differentiates them from horse equipment.

They do NOT appear in the horse equipment slots. They do NOT affect virtual horse stats. They are purely collectible.

---

## Store — Items section redesign

### PageHeader slot assignment

- `centre` slot: not used (no section switcher at the Shop level — the existing Marketplace/Cards/Items distinction is handled by the existing banners above the grid, not by a centre control).
- `below` slot: the category filter pills row. This is a content filter, not a section switcher.
- Explicit statement per CLAUDE.md: the content grid receives `activeCategory` as state managed inside `ShopScreen`. No child component renders its own category control.

### Display category mapping

The raw URL slugs are human-unfriendly. The following display labels are the canonical mapping. FE must use exactly these strings — do not derive them from the URL slug at render time.

| URL slug | Display label | Lucide icon name |
|---|---|---|
| `fly-hoods` | Fly Hoods | `Wind` |
| `headcollars-leadropes` | Headcollars | `Link` |
| `horse-rugs` | Rugs | `Layers` |
| `boots-bandages` | Boots | `Footprints` |
| `saddlery-tack` | Saddlery | `Dumbbell` |
| `fly-protection` | Fly Protection | `Shield` |
| `grooming-care` | Grooming | `Sparkles` |
| `stable-yard` | Stable | `Home` |
| `supplements` | Supplements | `FlaskConical` |
| `hobby-horse` (hobby horses data) | Hobby Horses | `Star` |

Category filter pill order: All · Fly Hoods · Headcollars · Rugs · Boots · Saddlery · Fly Protection · Grooming · Stable · Supplements · Hobby Horses

The "All" pill is always first. The category pills are horizontally scrollable (overflow-x-auto). There is no sort control in the Items section — sort is not needed at this stage.

### Coin pricing model

Prices reflect item complexity and perceived desirability, not real-world price. All prices are in coins only — no secondary currency.

| Category | Price range | Rationale |
|---|---|---|
| Grooming (brushes, bags) | 30–80 coins | Low complexity, functional items |
| Stable & Yard (toys, accessories, haynets, treats) | 20–60 coins | Low complexity, consumable-feeling |
| Supplements | 40–100 coins | Multiple sub-types, feels premium |
| Fly Protection (sprays, masks) | 50–120 coins | Practical items, wide range |
| Boots & Bandages | 80–160 coins | Leg protection, four slots needed, high desirability |
| Fly Hoods | 100–180 coins | Visible head item, high desirability |
| Headcollars | 80–150 coins | Visible head item |
| Rugs | 120–220 coins | Large, visible, seasonal variety |
| Saddlery & Tack | 150–300 coins | High complexity: bridles, saddles, bits |
| Hobby Horses | 200–400 coins | Named character collectibles, premium tier |

Pricing within each range is assigned by sub-category. Sub-categories with richer descriptions or more desirable product types sit at the top of the range. The exact price per item is a data layer decision (FE/Developer sets values in the data file). These ranges are the hard constraints.

**No price is below 20 coins or above 400 coins for this feature.**

### Item card anatomy

Each item in the grid uses the existing `ItemCard` pattern from `ShopScreen.tsx` but replaces the icon-well with a real product image. Where the product `image_url` is available, use it. Where it is missing or broken, fall back to the category icon well (same pattern as existing cards).

```
┌─────────────────────┐
│  Product image      │  aspect-square, rounded-[12px], object-cover
│  (or icon well)     │  background: category tint (see below)
│  [OWNED badge]      │  top-right, if purchased
└─────────────────────┘
│  Item name          │  13px / 600 / --t1 / line-clamp-2
│  Display category   │  11px / 500 / --t3 / uppercase / tracking-[0.5px]
│  [coins icon] price │  13px / 700 / --amber-t (affordable) or --t4 (unaffordable)
└─────────────────────┘
```

Category tint colours for icon wells (used when image is unavailable):

| Category | Well background | Icon colour |
|---|---|---|
| Fly Hoods | `var(--blue-sub)` | `var(--blue-t)` |
| Headcollars | `var(--amber-sub)` | `var(--amber-t)` |
| Rugs | `var(--purple-sub)` | `var(--purple-t)` |
| Boots | `var(--green-sub)` | `var(--green-t)` |
| Saddlery | `var(--amber-sub)` | `var(--amber-t)` |
| Fly Protection | `var(--blue-sub)` | `var(--blue-t)` |
| Grooming | `var(--green-sub)` | `var(--green-t)` |
| Stable | `var(--pink-sub)` | `var(--pink-t)` |
| Supplements | `var(--purple-sub)` | `var(--purple-t)` |
| Hobby Horses | `var(--pink-sub)` | `var(--pink-t)` |

**Owned state:** A `OWNED` badge in the top-right corner of the image well. Uses tint-pair: `bg-[var(--green-sub)] text-[var(--green-t)]`, 11px/700, uppercase, tracking-[0.5px], pill shape, padding `2px 8px`. If the player owns multiple of the same item (future feature), show the count as `3×` instead.

**Unaffordable state:** Price row uses `var(--t4)` for both the Coins icon and price text. No other visual change to the card — the card remains tappable so Harry can still read the description and know what he's saving toward.

**Equipped state badge:** If the item is currently equipped to a horse slot, show a secondary badge: `EQUIPPED`, tint-pair `bg-[var(--blue-sub)] text-[var(--blue-t)]`, same size/style as OWNED badge. Position: bottom-left of the image well. OWNED and EQUIPPED badges can coexist.

### Purchase bottom sheet

The `PurchaseSheet` bottom sheet follows the existing pattern from `ShopScreen.tsx`. Changes for LeMieux items:

- Replace the icon well in the sheet header with the product image (80px × 80px, `rounded-[12px]`, `object-cover`). Fall back to icon well if image is unavailable.
- Replace the "Stat boost" row in the stats block with a "Category" row showing the display label.
- Remove the "Uses" row — LeMieux items do not have a use count.
- Keep the "Owned" count row.
- Keep the price + Buy button row unchanged.
- Add a "What this equips to" row below the stats block, showing the slot name (e.g. "Head slot", "Body slot", "All four leg slots") for equippable items. For non-equippable items (grooming, stable, supplements), show "Adds to your collection" instead.
- The sheet title is the item name.
- Glass rule applies: `rgba(13,13,17,.88)` + `backdrop-filter: blur(24px)` + `border: 1px solid rgba(255,255,255,.06)`.
- Backdrop: `bg-black/10`.
- Must use `createPortal(…, document.body)` — existing `BottomSheet` component already does this.

### Filter row layout

```
[ below slot — single scrollable row ]
┌─────────────────────────────────────────────────────┐
│  [All] [Fly Hoods] [Headcollars] [Rugs] … →scroll→ │
└─────────────────────────────────────────────────────┘
```

No sort control in the Items section. Single row. Left-aligned. Horizontally scrollable with `overflow-x-auto scrollbar-hide`. This matches the existing `ShopScreen.tsx` filter pattern.

The existing filter pill style in `ShopScreen.tsx` uses `bg-[var(--blue)] text-white` for active pills. This is a design defect that this feature corrects. The redesigned Items section must use the canonical tint-pair active style:

- Active: `bg-[var(--blue-sub)] border border-[var(--blue)] text-[var(--blue-t)]`
- Inactive: `bg-[var(--card)] border border-[var(--border-s)] text-[var(--t2)]`

Reference: `CategoryPills.tsx` and `MyAnimalsScreen.tsx` — both use this pattern.

### Content container class string

```
px-6 pt-4 pb-24 max-w-3xl mx-auto w-full
```

The `pt-4` (16px) clearance below the PageHeader glass border is mandatory.

### Grid layout

```
grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-1
```

This is unchanged from the existing `ShopScreen.tsx` grid. No adjustment needed.

---

## Equipment screen — full spec

### Route

`/equip/:petId` — navigated to from a horse's `PetDetailSheet`. A "Dress up" button (or equivalent) in the detail sheet opens this screen.

### PageHeader slot assignment

- `title`: the horse's name (e.g. "Thunder")
- `trailing`: `CoinDisplay` (existing component)
- `centre` slot: not used
- `below` slot: not used on this screen
- Since there is no `below` slot, the content container uses `pt-6` (24px) top padding.

Content container class string: `px-6 pt-6 pb-24 max-w-3xl mx-auto w-full`

### Screen layout (portrait, iPad 1024×1366)

```
┌─ PageHeader ──────────────────────────────────────────────────────────────┐
│  [Horse name]                                    [CoinDisplay]             │
└───────────────────────────────────────────────────────────────────────────┘
                                     ↕ pt-6
┌─ Equipment area (max-w-3xl mx-auto) ──────────────────────────────────────┐
│                                                                             │
│              [HEAD slot]                                                    │
│                  ↑                                                          │
│  [BRIDLE]  ←  [horse image]  →  [RUG]                                     │
│                  ↓                                                          │
│           [SADDLE slot]                                                     │
│                  ↓                                                          │
│  [FL LEG] [FR LEG]   [BL LEG] [BR LEG]                                    │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────│
│                                                                             │
│  [ Compatible items strip — horizontal scroll ]                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────-─┘
```

### Horse image

- Centered in the equipment area.
- Size: 200px × 200px at all breakpoints. Do not scale the horse image to the screen width — the slot positions are calculated relative to the fixed image size.
- Background: `var(--elev)`, `border-radius: var(--r-lg)` (16px), `border: 1px solid var(--border-s)`.
- Uses the existing `AnimalImage` component from `src/components/ui/AnimalImage.tsx`.
- The horse image container is positioned relatively. All slot indicators are absolutely positioned relative to this container.

### Equipment slot anatomy (each slot)

A slot is a square button. Empty and filled states are visually distinct.

```
Size:        52px × 52px (minimum touch target: 44px — this exceeds it)
Radius:      var(--r-md) (12px)
Border:      1.5px dashed var(--border) — empty state
Background:  var(--elev) — empty state
```

**Empty state:**
- Background: `var(--elev)`
- Border: `1.5px dashed var(--border)` (`#353945`)
- Centre icon: slot-type Lucide icon at 20px, colour `var(--t4)`
- Label: slot name (e.g. "Head"), 10px/500, `var(--t4)`, below the icon, `text-center`

**Filled state (item equipped):**
- Background: category tint colour (from the category tint table above)
- Border: `1.5px solid` matching the tint border (e.g. `var(--blue)` for a fly hood slot)
- Content: item thumbnail image at 36px × 36px, `object-cover`, `border-radius: var(--r-xs)` (6px). If image unavailable, use the category icon at 20px.
- No slot label text in filled state — the image communicates what is equipped.

**Hover state (pointer devices):**
- Empty: border steps up to `var(--border)` solid, background `rgba(255,255,255,.03)`
- Filled: border brightens to `var(--border)` (one step brighter), `transform: scale(1.04)`, `transition: all 200ms`

**Active/tap state:** `scale(.97)`, `transition: all 150ms`

**Focus state:** `outline: 2px solid var(--blue); outline-offset: 2px`

**Selected state** (tap fallback path — slot is the currently active target for the item picker): border becomes `1.5px solid var(--blue)`, background `var(--blue-sub)`. The slot pulses with a subtle glow: `box-shadow: 0 0 12px rgba(55,114,255,.35)`. This state is entered when Harry taps an empty slot to open the item picker.

**Drag-hover state** (drag path — a compatible item is being dragged over this slot): border `1.5px solid var(--blue)` (solid), background `var(--blue-sub)`, glow `box-shadow: 0 0 16px rgba(55,114,255,.45)`, scale `1.08`. This is visually similar to selected state but at a slightly higher glow intensity and with scale. Entered when the dragged item thumbnail enters the slot's 48×48pt hit area.

**Drag-hover incompatible state** (drag path — an incompatible item is over this slot): border `1.5px solid var(--border)`, background `rgba(255,255,255,.02)`, no glow. The drop is rejected silently — item returns to strip on release.

### Slot position layout

All positions are relative to the horse image container (200px × 200px). Positions are expressed as `top/left/right/bottom` offsets from the container edges. All slots are `position: absolute`.

```
Head slot:        top: -28px; left: 50%; transform: translateX(-50%)   [centred above horse]
Rug (body) slot:  top: 50%; right: -28px; transform: translateY(-50%)  [centred right of horse]
Bridle slot:      top: 28px; left: -28px                                [upper left]
Saddle slot:      bottom: 20px; left: 50%; transform: translateX(-50%) [centred below horse]
Front Left leg:   bottom: -28px; left: 4px                              [bottom left pair]
Front Right leg:  bottom: -28px; left: 64px                             [bottom left pair, offset]
Back Left leg:    bottom: -28px; right: 64px                            [bottom right pair]
Back Right leg:   bottom: -28px; right: 4px                             [bottom right pair]
```

Note: exact pixel offsets will need FE verification at all three breakpoints. The above values are design intent for a 200px horse image at tablet size. FE must verify slot positions do not clip or overlap at 375px, 768px, and 1024px. The horse image size remains 200px at all breakpoints; layout adjusts by centering the whole equipment area block within the content column.

The equipment area container must have `position: relative; padding: 40px` to provide bleed room for the absolutely positioned slots that extend beyond the horse image edges. The 40px padding gives 12px of breathing room beyond the furthest slot edge.

### Compatible items strip

Below the equipment area, a horizontal strip shows items compatible with the currently selected slot. The strip serves two purposes: (1) it is the source of items to drag onto slots, and (2) it is the fallback tap-to-equip target when drag is not used.

**Trigger:** strip activates when Harry taps a slot (fallback path), or is always visible and scrollable when no drag is in progress (drag path — Harry picks up items from here). Implementation choice: the strip is always rendered but uses `AnimatePresence` with a `height` animation so it collapses to `height: 0` when no slot has been tapped. During an active drag (pointer is down on an item), the strip remains static — it does not scroll.

**Strip header:**
```
12px / 700 / uppercase / letter-spacing 1.5px / var(--t3)
Text: "{SLOT NAME} — drag onto slot or tap to equip"
```

If no slot is selected (before any slot has been tapped), the strip header reads: `"Long-press an item to drag it onto a slot"` — this is the onboarding prompt that teaches the drag mechanic on first use.

**Strip content:** Horizontally scrollable row of item cards. Only items that (a) match the slot type and (b) Harry owns are shown. If Harry owns no compatible items for the selected slot, the strip shows an empty state card:

```
Empty state card (in the strip):
  width: 120px, height: 120px
  background: var(--elev)
  border: 1px dashed var(--border-s)
  border-radius: var(--r-lg)
  content: ShoppingBag icon (24px, var(--t4)) centred
  sub-text: "Visit the Shop", 11px/500/var(--t4), text-center
  This card is a tappable button that navigates to /shop
```

**Strip item card anatomy:**

```
Width:         100px (fixed, shrink-0)
Height:        100px
Radius:        var(--r-md) (12px)
Border:        1px solid var(--border-s)
Background:    var(--card)
Overflow:      hidden
```

Content layout (stacked, centred):
- Top 60px: product image (`object-cover`, full width) or category icon well
- Bottom 40px: item name, 10px/500/var(--t1)/line-clamp-2, `px-2 py-1.5`

**Currently equipped item in strip:** The card for the item that is currently in the active slot shows a blue ring: `outline: 2px solid var(--blue); outline-offset: 2px`. A small "Equipped" tint badge overlays the bottom of the image area: `bg-[var(--blue-sub)] text-[var(--blue-t)]`, 9px/600, absolutely positioned bottom-0.

**Double-tapping an unequipped item in the strip (fallback equip path):** Immediately equips it to the active slot. The slot visual updates instantly. The strip remains open (Harry may want to compare items). A success toast fires: `"[Item name] equipped to [slot name]"`, info variant, 3s auto-dismiss. A single tap on a strip item does NOT equip — it is a no-op (or can show a brief "double-tap to equip" hint tooltip, implementation choice).

**Double-tapping a filled slot on the horse silhouette (primary unequip path):** Immediately unequips the item. No strip is opened. The item returns to inventory and the slot returns to empty state. The unequip animation fires. No confirmation dialog — double-tap is deliberate enough. For leg slots, double-tapping any one filled leg slot unequips all four simultaneously and returns one item to inventory.

**Single-tapping a filled slot on the horse silhouette (change/swap path):** Opens the compatible items strip with the equipped item highlighted. This is the starting point for changing or swapping what is equipped. It does NOT unequip immediately — a single tap is an intent to browse and swap, not an intent to remove.

**Closing the strip:** Tap anywhere outside the strip (tap the horse image area or use the back/close gesture). Strip animates out. No slot remains in selected state.

**Strip gap:** `gap-3` (12px) between item cards. Strip horizontal padding: `px-6`.

### Drag-to-slot interaction (primary equip path)

**Overview:** Harry long-presses an item card in the compatible items strip. After a 150ms hold (the long-press threshold), the item enters drag state. Harry drags the item thumbnail over the horse silhouette to a slot and releases to equip.

**Step-by-step:**

1. **Long-press initiation:** Harry holds down on an item card in the strip for 150ms. A subtle haptic tick fires at the threshold (if device supports it — optional, do not block on this). The item card in the strip dims to `opacity: 0.4` and scales to `scale(0.9)` over `100ms` to signal it has been "picked up".

2. **Drag in progress:** A floating thumbnail of the item follows Harry's finger/cursor. The thumbnail:
   - Size: 64px × 64px
   - Radius: `var(--r-md)` (12px)
   - Border: `1.5px solid var(--blue)` with a `box-shadow: 0 0 16px rgba(55,114,255,.45)` glow
   - Background: product image (`object-cover`) or category icon well as fallback
   - `position: fixed` — rendered via `ReactDOM.createPortal(…, document.body)` to avoid stacking context issues
   - Pointer events: `pointer-events: none` on the thumbnail so the drag hit-testing passes through to the slot targets beneath it

3. **Slot drag-hover state:** As the thumbnail enters a slot's hit area (48×48pt minimum), the slot transitions to drag-hover state:
   - Border: `1.5px solid var(--blue)` (solid, not dashed)
   - Background: `var(--blue-sub)`
   - Glow: `box-shadow: 0 0 16px rgba(55,114,255,.45)`
   - Scale: `scale(1.08)` with `transition: transform 150ms ease-out`
   - If the dragged item is **not** compatible with the slot being hovered over, the slot shows an incompatible state: border `1.5px solid var(--border)`, background `rgba(255,255,255,.02)`, no glow. The drop is not accepted.

4. **Successful drop:** Harry releases the pointer over a compatible slot. The floating thumbnail animates into the slot: `scale` from 1.0 to 0.85, `opacity` from 1 to 0, over `150ms ease-in`. Simultaneously the slot runs the equip animation (see "Equip animation" below). The item card in the strip updates to the equipped state.

5. **Failed drag (dropped outside a slot or over an incompatible slot):** The floating thumbnail animates back to its origin position in the strip with a spring: `{ type: "spring", stiffness: 350, damping: 25 }`, `opacity: 1`, `scale: 1`. The item card in the strip returns from its dimmed/scaled state to normal. No error message, no toast — the animation communicates "did not land" without a failure state.

**Slot hit areas:** All slot hit areas are minimum 48×48pt regardless of the visual slot size (52px). The hit area is a transparent overlay element positioned over the visual slot.

**Gesture co-existence:** While Harry is not actively dragging (no long-press in progress), the items strip is normally scrollable. Horizontal swipe gestures on the strip are not intercepted. The long-press threshold (150ms) prevents accidental drag initiation during scroll.

**Drag state and the compatible items strip:** The strip does not update its content during a drag. All slot-compatibility highlighting happens on the horse silhouette, not in the strip. The strip scrolls to the dragged item's position to confirm which item is in flight (this is handled automatically since the card in the strip dims in place).

**Double-tap fallback (secondary equip path):** If Harry double-taps an item in the strip while a slot is selected, the item equips immediately to the active slot. The slot enters selected state (blue border + glow) after a single tap on the slot. The strip header reads `"{SLOT NAME} — drag onto slot or tap to equip"`. This fallback is fully functional — it is not deprecated, only secondary.

---

### Leg slot one-drag behaviour

When Harry drags a boots/bandages item onto **any one** of the four leg slots:

1. All four leg slots are filled simultaneously with the same item visual.
2. Only one copy of the item is consumed from inventory.
3. The four slots animate in a staggered sequence: front-left → front-right → back-left → back-right.
   - Stagger: 80ms between each slot
   - Each slot animates: `scale: 0 → 1` with `{ type: "spring", stiffness: 400, damping: 20 }`
   - The spring fires from rest at each slot's own stagger offset
4. The floating drag thumbnail animates to the slot the drag was released on first, then the other three slots animate in sequence.
5. The strip item card updates to show the equipped state after all four slots have filled (after the last stagger step, ~240ms after release).

**Unequipping leg slots:** Double-tapping any one filled leg slot on the horse silhouette unequips all four leg slots simultaneously (no stagger on unequip — instant visual update, then all four run the unequip animation simultaneously). One item is returned to inventory. Alternatively, tapping a filled leg slot opens the strip, and double-tapping the equipped item in the strip also unequips all four.

**Double-tap fallback for legs:** Tapping any leg slot when empty opens the strip with the heading `"Legs — drag onto slot or tap to equip"`. Double-tapping an item in the strip equips all four leg slots simultaneously using the stagger animation above.

**Leg slot selected state:** When any one leg slot enters selected state (tap path), all four leg slots visually enter selected state together (blue border + glow on all four). This communicates to Harry that they are a set.

---

### Equip animation

When an item is equipped (via successful drag drop, or by double-tapping an item card in the strip while a slot is selected):

1. The item card in the strip scales down slightly: `scale(0.9)`, `opacity: 0.6` over `150ms`.
2. The target slot scales up briefly: `scale(1.1)` over `100ms`, then returns to `scale(1.0)` over `150ms` with a spring: `{ type: "spring", stiffness: 400, damping: 20 }`.
3. The slot's visual content updates simultaneously with step 2 (image appears while slot springs back).
4. The slot's border transitions from selected-state blue to filled-state tint colour over `200ms`.

This sequence communicates "the item went into the slot" without requiring drag interaction. Total animation duration: ~350ms.

Reduced motion: steps 1 and 2 are suppressed. The visual state updates instantly (150ms colour transition only). `useReducedMotion` hook must gate all transform animations.

### Unequip animation

When an item is unequipped (Harry double-taps a filled slot on the horse silhouette, or double-taps the equipped item in the strip):

1. The slot scales down briefly: `scale(0.9)`, `opacity: 0.8` over `100ms`, then returns to empty-state appearance over `200ms`.
2. The item card in the strip loses the blue ring over `150ms` (transition-colors).

Reduced motion: instant visual state change only.

### Back navigation

The Equipment screen has a back button in the PageHeader `title` area: a `ChevronLeft` icon button (32px, `bg: var(--elev)`, left of the title). Tapping navigates back to the previous screen (the PetDetailSheet or My Animals). All equipment changes are persisted automatically — there is no "Save" button. Changes are saved on equip/unequip action.

---

## My Animals — Item Collection tab

### Where it lives

A new tab within My Animals, added as a second tab in the `centre` slot of the PageHeader. The `centre` slot currently has no control. This feature adds a segmented control:

```
centre slot: [ Animals | Items ]
```

Both tabs are always available regardless of whether Harry has any items. "Animals" is the default active tab (existing behaviour is preserved under the "Animals" label). "Items" is the new tab.

**Navigation ownership:** The `centre` slot control is the only place this switcher lives. The content below it receives `activeTab` as a prop (or as state in `MyAnimalsScreen`). Neither the Animals grid nor the Items grid renders its own tab control. This is explicitly stated to prevent the dual-navigation defect.

The `below` slot in My Animals already contains the category filter pills and sort control. This remains unchanged and continues to apply only when the "Animals" tab is active. When the "Items" tab is active, the `below` slot is hidden (the items collection does not have category pills or sort controls at this stage).

### PageHeader slot assignment — My Animals (revised)

- `title`: "My Animals" (unchanged)
- `trailing`: `CoinDisplay` (unchanged)
- `centre` slot: `Animals | Items` segmented control (NEW)
- `below` slot: category pills + sort control, **visible only when "Animals" tab is active**

### Item Collection layout

The Item Collection has three sub-sections, displayed in a single scrollable column. Sub-sections are separated by section headers (`text-[13px] font-semibold uppercase tracking-wide text-[var(--t2)]`):

**Section 1: Horse Equipment**

Shows all equippable items Harry owns (all slot types: head, body, legs, bridle, saddle).

Section header: `HORSE EQUIPMENT` — Typography: `text-[13px] font-semibold uppercase tracking-wide text-[var(--t2)]`. Left-aligned, `mb-3`.

Grid: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3`

Each card:
```
┌─────────────────────┐
│  Product image      │  aspect-square, rounded-[12px], object-cover
│  (or icon well)     │  category tint if no image
│  [EQUIPPED badge]   │  bottom-left, if currently on a horse (blue tint-pair)
└─────────────────────┘
│  Item name          │  13px / 600 / --t1 / line-clamp-2
│  Slot label         │  11px / 500 / --t3 (e.g. "Head", "Body", "Legs")
│  [Horse name] or    │  11px / 500 / --t4 if not equipped: "Not equipped"
│  "Not equipped"     │
└─────────────────────┘
```

Tapping an equipment item card navigates to `/equip/:petId` for the horse it is currently equipped on (if equipped). If not equipped, a bottom sheet appears listing Harry's horses and asking "Equip on which horse?" — see below.

**Section 2: Hobby Horses**

Shows all hobby horse collectibles Harry owns.

Section header: `HOBBY HORSES` — Typography: `text-[13px] font-semibold uppercase tracking-wide text-[var(--t2)]`. Left-aligned, `mb-3`.

Layout: horizontal scrolling shelf (not a grid). A shelf communicates "display case" rather than "inventory". Single row, scrollable.

```
Shelf row: flex gap-4 overflow-x-auto scrollbar-hide px-6 -mx-6
```

Each hobby horse card:
```
Width:     140px, shrink-0
Radius:    var(--r-lg) (16px)
Border:    1px solid var(--border-s)
Background: var(--card)
```

Content:
- Product image: 140px × 140px, `object-cover`, `rounded-t-[16px]`
- Name: `px-3 pt-2 pb-3` — 13px/600/var(--t1)/line-clamp-2
- Character tagline from description (first sentence): 11px/400/var(--t3)/line-clamp-2, `px-3 pb-3`

Tapping a hobby horse card opens the `PurchaseSheet` bottom sheet (info-only, with the description, no buy button — the item is already owned). This is the "look at your collection" moment.

**Section 3: Grooming**

Shows owned grooming items (`grooming-care` category, 59 items). These are not equippable — they are purchasable now and will be usable in a future care feature. Stable, Supplements, and Fly Protection consumables are out of scope for this section (those categories are not confirmed in scope for Phase C — see owner-decisions.md).

Section header: `GROOMING` — same Hairline style. Typography: `text-[13px] font-semibold uppercase tracking-wide text-[var(--t2)]`. Left-aligned, `mb-3`.

Grid: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3`

Card anatomy: identical to the Horse Equipment card structure above, but without the "Slot label" or "Horse name / Not equipped" rows. In place of the equipped-status row, shows: `"Available for care (coming soon)"`. Label style: `text-[11px] font-[400] text-[var(--t3)] italic`. No equip action. Tapping a Grooming card opens the `PurchaseSheet` in info-only mode (same pattern as owned hobby horse cards — description shown, no buy button, no equip button).

No EQUIPPED badge appears on Grooming cards. The Grooming section does not interact with the "Equip on which horse?" flow.

The Grooming section exists to prevent a "where did my purchase go?" confusion state — Harry's purchased grooming items are visible in his collection immediately, even though the care mechanic is not yet built.

**Empty state — each section individually:**

Each section that has zero owned items is hidden entirely — no header, no empty card. This prevents a "ghost shelf" effect where Harry sees a heading with no content. Sections are simply absent when empty.

The three sections and their hide conditions:
- Equipment: hidden when Harry owns no equippable items (head, body, legs, bridle, saddle slot types)
- Hobby Horses: hidden when Harry owns no hobby horse collectibles
- Grooming: hidden when Harry owns no grooming-care items

**Full tab empty state (when all three sections are empty):**

Shown in place of all section content when Harry owns nothing across equipment + hobby horses + grooming combined.

**Section ordering rule:** Equipment first, Hobby Horses second (shelf), Grooming third. Sections with zero owned items are hidden entirely. If Harry owns nothing across all three sections, the full tab empty state is shown (see below).

### Empty state for Item Collection tab

```
Icon:        ShoppingBag (Lucide), 48px, var(--t4)
Title:       "No items yet"           22px/600/var(--t1)
Description: "Buy gear in the Shop to outfit your horses"  15px/400/var(--t3), max-w: 280px, centred
CTA button:  "Go to Shop" — btn-md btn-primary → navigates to /shop
```

### "Equip on which horse?" sheet

Triggered when Harry taps an unequipped item card in the collection. A BottomSheet lists all horses Harry owns that accept the item's slot type. Each horse appears as a row:

```
Row: flex items-center gap-3, h-[60px], px-4
  - AnimalImage (36px × 36px, rounded-[8px])
  - Horse name (15px/600/var(--t1))
  - Slot status: "Slot empty" (var(--t3)) or existing item name (var(--t2)) + "Replace" label (var(--amber-t))
  - ChevronRight (16px, var(--t3)) — right side
```

Tapping a row equips the item to that horse and navigates to `/equip/:petId` so Harry can see the result. The "Replace" label appears when the horse already has something in that slot — it signals that equipping will replace the current item, not stack.

If Harry has no horses that accept this slot type (e.g. he bought a rug but has no horses), the sheet shows an empty state: "None of your animals use this slot."

---

## Interaction states — all interactive elements

| Element | State | Behaviour |
|---|---|---|
| Item card (shop grid) | Hover | `border-[var(--border)]`, `translateY(-2px)`, `shadow: var(--sh-card)`, `transition: all 300ms` |
| Item card (shop grid) | Active tap | `scale(.97)`, `transition: all 150ms` |
| Item card (shop grid) | Focus visible | `outline: 2px solid var(--blue); outline-offset: 2px` |
| Item card (shop grid) | Unaffordable | Price text/icon at `var(--t4)`. Card remains tappable. |
| Category filter pill | Hover (inactive) | `border-[var(--border)]` — steps up one border level |
| Category filter pill | Active tap | `scale(.97)` |
| Category filter pill | Focus visible | Browser default focus ring (do not suppress) |
| Category filter pill (active) | Tap | Deselects, returns to All |
| Equipment slot (empty) | Hover | Border solid `var(--border)`, bg `rgba(255,255,255,.03)` |
| Equipment slot (empty) | Single tap | Enters selected state (blue border + glow), opens compatible items strip — fallback path |
| Equipment slot (empty) | Active tap | `scale(.97)` |
| Equipment slot (empty) | Focus visible | `outline: 2px solid var(--blue); outline-offset: 2px` |
| Equipment slot (empty) | Drag-hover (compatible item) | Border `1.5px solid var(--blue)`, bg `var(--blue-sub)`, glow `0 0 16px rgba(55,114,255,.45)`, `scale(1.08)` |
| Equipment slot (empty) | Drag-hover (incompatible item) | Border `1.5px solid var(--border)`, bg `rgba(255,255,255,.02)`, no glow — drop rejected |
| Equipment slot (filled) | Hover | Border `var(--border)`, `scale(1.04)`, `transition: all 200ms` |
| Equipment slot (filled) | Single tap | Opens compatible items strip with equipped item highlighted — intent to swap, NOT unequip |
| Equipment slot (filled) | Double-tap | Unequips item immediately. Item returns to inventory. Unequip animation fires. No strip opened. |
| Equipment slot (filled) | Drag-hover (compatible item) | Same drag-hover state as empty slot — item will replace the current item on drop |
| Equipment slot (selected) | Tap (same slot again) | Deselects, closes strip |
| Strip item card (unequipped) | Long-press (150ms) | Enters drag state: card dims to `opacity: 0.4`, `scale(0.9)`. Floating thumbnail appears at finger position. |
| Strip item card (unequipped) | Double-tap (with slot selected) | Equips to active slot, equip animation fires — fallback path |
| Strip item card (equipped) | Double-tap (with slot selected) | Unequips, unequip animation fires — fallback path |
| Strip item card | Hover | `border-[var(--border)]`, `translateY(-2px)`, `shadow: var(--sh-card)` |
| Strip item card | Focus visible | `outline: 2px solid var(--blue); outline-offset: 2px` |
| Drag thumbnail | In flight | `position: fixed`, via `createPortal`. 64×64px, `border: 1.5px solid var(--blue)`, glow. `pointer-events: none`. |
| Drag (released outside slot) | End | Thumbnail springs back to strip origin. `{ type: "spring", stiffness: 350, damping: 25 }`. No toast. |
| Hobby horse card (collection shelf) | Tap | Opens description bottom sheet |
| Hobby horse card | Hover | `border-[var(--border)]`, `translateY(-2px)`, `shadow: var(--sh-card)` |
| Equipment collection card | Tap (equipped) | Navigate to /equip/:petId |
| Equipment collection card | Tap (unequipped) | Open "Equip on which horse?" sheet |
| "Equip on which horse?" row | Tap | Equip + navigate to /equip/:petId |
| Back button (Equipment screen) | Tap | Navigate back |

---

## Animation spec

### Drag initiation
- **Long-press threshold:** 150ms hold to enter drag state
- **Card dim:** `opacity: 1 → 0.4`, `scale: 1 → 0.9`, `duration: 100ms`, `easing: ease-out`
- **Thumbnail appear:** `opacity: 0 → 1`, `scale: 0.8 → 1.0`, `duration: 120ms`, `easing: ease-out`

### Drag thumbnail in flight
- Thumbnail follows pointer position with no animation lag — directly tracks pointer coordinates each frame
- No Framer Motion spring on the in-flight position — direct CSS transform update to avoid perceived latency

### Slot drag-hover enter/exit
- **Enter drag-hover:** border, background, and glow transition over `150ms ease-out`; scale `1.0 → 1.08` over `150ms ease-out`
- **Exit drag-hover (pointer leaves hit area):** All properties return to previous state over `200ms ease-in`

### Successful drop
- **Thumbnail exit:** `scale: 1.0 → 0.85`, `opacity: 1 → 0`, `duration: 150ms`, `easing: ease-in`
- **Slot entrance:** Runs equip animation (see below) simultaneously with thumbnail exit

### Failed drag (dropped outside slot)
- **Thumbnail return:** Spring animation back to strip origin — `{ type: "spring", stiffness: 350, damping: 25 }`
- **Card restore:** `opacity: 0.4 → 1`, `scale: 0.9 → 1`, over `200ms ease-out`

### Leg slot stagger (on equip — drag or tap path)
- All four slots fill in sequence: front-left → front-right → back-left → back-right
- **Stagger offset:** 80ms between each slot
- **Each slot:** `scale: 0 → 1`, `{ type: "spring", stiffness: 400, damping: 20 }`
- **Total duration:** ~560ms from first slot to last slot completing its spring
- **Reduced motion fallback:** All four slots update simultaneously, `duration: 150ms` opacity only

### Equip animation (item into slot)
- **Duration:** ~350ms total
- **Step 1:** Strip item card `scale(0.9)`, `opacity(0.6)`, `duration: 150ms`, `easing: ease-in`
- **Step 2:** Slot scales `scale(1.1)`, `duration: 100ms`, then springs back to `scale(1.0)` with `{ type: "spring", stiffness: 400, damping: 20 }`
- **Step 3:** Slot visual content updates; border colour transitions from selected-blue to filled-tint, `duration: 200ms`
- **Note on drag path:** Step 1 is replaced by the "successful drop" thumbnail exit animation. Step 2 fires after the thumbnail exits.
- **Reduced motion fallback:** No scale transforms. Visual state change only, `duration: 150ms` colour transition

### Unequip animation
- **Duration:** ~300ms total
- **Step 1:** Slot `scale(0.9)`, `opacity(0.8)`, `duration: 100ms`, returns to empty state over `200ms`
- **Step 2:** Strip item card loses blue ring over `150ms`
- **Reduced motion fallback:** Instant visual state change, `duration: 150ms` colour transition only

### Compatible items strip entrance
- **Animation:** Framer Motion `AnimatePresence` on the strip container. Enter: `height` from `0` to auto over `300ms` with `ease-out`. Also `opacity: 0 → 1` over `200ms`.
- **Exit:** `height` to `0` over `250ms` with `ease-in`, `opacity: 1 → 0` over `150ms`.
- **Reduced motion fallback:** `opacity` only, no height animation

### Filter pill state change
- `transition-colors duration-150` — matches existing CategoryPills pattern exactly. No scale or transform.

### BottomSheet (purchase, "equip on horse", hobby horse detail)
- Existing BottomSheet component from `src/components/ui/Modal.tsx`. No changes to animation parameters.
- Spring: `{ type: "spring", stiffness: 300, damping: 30 }`. Slides up from `y: "100%"`.

### Purchase success toast
- Existing toast system. Info variant (item purchase). Success variant (equip action).
- `duration: 3s auto-dismiss`.

---

## iPad layout decisions

### 375px (phone — secondary target)

- Shop grid: `grid-cols-2 gap-3` — two columns, comfortable on 375px with `px-6` gutters.
- Equipment area: horse image 200px centred. Slot positions relative to image are unchanged. The horse image does not scale. At 375px the equipment area is 280px wide (200px image + 2×40px padding). This fits within 375px − 2×24px gutters = 327px. Slots that extend beyond the image edge are clipped if the container does not have `overflow: visible`. FE must set `overflow: visible` on the equipment area container.
- Compatible items strip: horizontal scroll, cards 100px wide. At 375px two cards are partially visible — this communicates "more items" without instruction.
- Item Collection grid: `grid-cols-2` — two columns at 375px.
- Hobby horse shelf: horizontal scroll, single row. Cards 140px wide. At 375px approximately two cards are visible — communicates "more" via partial clip.

### 768px (iPad portrait — primary target)

- Shop grid: `md:grid-cols-3` — three columns. Card images are comfortably sized.
- Equipment area: horse image 200px centred within `max-w-3xl` (672px at 768px with 48px gutters). Equipment area is centred, with adequate whitespace on either side.
- Compatible items strip: 4–5 cards visible without scroll. Communicates "scroll for more" via partial clip on the rightmost card.
- Item Collection grid: `md:grid-cols-3` — three columns.
- Hobby horse shelf: 4–5 cards visible.

### 1024px (iPad landscape — primary target)

- Shop grid: `lg:grid-cols-4` — four columns.
- Equipment area: horse image 200px, equipment area centred within `max-w-3xl`. The column constraint prevents the equipment from appearing tiny in the centre of a 1024px screen.
- Compatible items strip: 6+ cards potentially visible. Horizontal scroll still applies.
- Item Collection grid: `lg:grid-cols-4` — four columns.

---

## DS compliance — full token trace

Every visual value below traces to a DS token. No hardcoded hex values are permitted.

### Surfaces
- Page background: `var(--bg)` (`#0D0D11`)
- Cards: `var(--card)` (`#18181D`)
- Elevated elements (icon wells, stat blocks, slot backgrounds): `var(--elev)` (`#23262F`)
- Borders at rest: `var(--border-s)` (`#2C2F3A`)
- Borders on hover: `var(--border)` (`#353945`)
- Active/focus border: `var(--blue)` (`#3772FF`)

### Glass — PageHeader
- Background: `rgba(13,13,17,.72)` + `backdrop-filter: blur(24px)`
- Border-bottom: `1px solid rgba(255,255,255,.06)`

### Glass — BottomSheet
- Background: `rgba(13,13,17,.88)` + `backdrop-filter: blur(24px)`
- Border: `1px solid rgba(255,255,255,.06)`
- Backdrop: `bg-black/10`

### Typography
- Item name (card): `text-[13px] font-[600] text-[var(--t1)]`
- Category label (card): `text-[11px] font-[500] text-[var(--t3)] uppercase tracking-[0.5px]`
- Price (card): `text-[13px] font-[700] text-[var(--amber-t)]` (affordable) / `text-[var(--t4)]` (unaffordable)
- Section header: `text-[11px] font-[700] uppercase tracking-[1.5px] text-[var(--t3)]`
- Slot label: `text-[10px] font-[500] text-[var(--t4)]`
- Strip header: `text-[12px] font-[700] uppercase tracking-[1.5px] text-[var(--t3)]`

### Spacing
All values drawn from the DS spacing scale (4 6 8 10 12 14 16 20 24 28 32 40 48 56 64 80):
- Content padding horizontal: `px-6` = 24px
- Content top padding (with below slot): `pt-4` = 16px
- Content top padding (no below slot): `pt-6` = 24px
- Content bottom padding: `pb-24` = 96px
- Grid gap: `gap-3` = 12px
- Strip item gap: `gap-3` = 12px
- Card padding: `p-3` = 12px (inner), matching existing ShopScreen card

### Border radii
- Cards: `rounded-[16px]` = `var(--r-lg)`
- Image wells: `rounded-[12px]` = `var(--r-md)`
- Slots: `rounded-[12px]` = `var(--r-md)`
- Pills: `rounded-[100px]` = `var(--r-pill)`
- Strip item cards: `rounded-[12px]` = `var(--r-md)`

### Tint pair usage (all instances)
- Active filter pill: `bg-[var(--blue-sub)] border border-[var(--blue)] text-[var(--blue-t)]`
- Owned badge: `bg-[var(--green-sub)] text-[var(--green-t)]`
- Equipped badge (on card): `bg-[var(--blue-sub)] text-[var(--blue-t)]`
- Selected slot: `bg-[var(--blue-sub)] border-[var(--blue)]`
- Coin price (affordable): `text-[var(--amber-t)]`, icon `var(--amber)`

---

## Navigation ownership

| Control | Lives in | Props downward |
|---|---|---|
| Shop category filter pills | `ShopScreen` state — `activeCategory` | Grid receives filtered item list (not raw filter state) |
| My Animals tab switcher (Animals / Items) | `MyAnimalsScreen` state — `activeTab` | Animals grid and Items collection each receive `activeTab` as prop and render only when their tab is active |
| My Animals category filter pills | `MyAnimalsScreen` state — `activeCategory` | Unchanged — existing behaviour, visible only when `activeTab === 'animals'` |
| Equipment screen (no nav control) | N/A | Equipment slot state lives in the EquipScreen component |

No child component renders a duplicate of any of these controls.

---

## Consistency check

### Against existing ShopScreen
- The new Items section replaces the content of the existing `ShopScreen.tsx` items grid. The Marketplace banner and Animal Cards banner above the filter row are **unchanged and remain in place**.
- The existing `BottomSheet` purchase flow pattern is preserved — only the content inside the sheet changes (image replaces icon well, category replaces stat boost, equippability info added).
- The filter pill active state is being corrected from `bg-[var(--blue)] text-white` (wrong — solid blue, prohibited on filter pills) to the canonical tint-pair style. This is a spec-directed correction, not drift.

### Against existing MyAnimalsScreen
- The new `centre` slot adds the `Animals | Items` segmented control. The existing `below` slot (category pills + sort) is preserved and conditioned on `activeTab === 'animals'`.
- The Animals grid layout and behaviour is unchanged.
- The `PetDetailSheet` gains a "Dress up" button (to navigate to the equipment screen). This button is a secondary action in the sheet — not the primary action. It appears below the existing care/rename/release actions.

### Against explore-rarity-filter spec
- Filter pill anatomy: identical. `h-9 px-4 rounded-[var(--r-pill)] text-[13px] font-600 whitespace-nowrap shrink-0 transition-colors duration-150`. Active/inactive tint-pair colours are identical. No deviation.

### Against Design System glass rule
- BottomSheet uses existing `Modal.tsx` component which already implements the correct glass treatment and `createPortal`. No new overlay component is needed.
- Equipment screen is not an overlay — it is a full screen. No glass rule applies to the screen itself.

### Potential conflict: item IDs
- The existing `ITEM_DEFS` in `src/data/itemDefs.ts` uses made-up item IDs. The new LeMieux items will need their own ID scheme. The Developer must ensure the existing `useItemShop` hook's owned-items storage (Dexie table) is either migrated or versioned to handle the new item type. This is a data integrity decision for the Developer brief — this spec flags it as a required decision point.

---

## Overlay surface treatment

All bottom sheets in this feature use the glass rule:
- `rgba(13,13,17,.88)` + `backdrop-filter: blur(24px)` + `border: 1px solid rgba(255,255,255,.06)`
- Backdrop: `bg-black/10` (never higher)
- All bottom sheets must use the existing `BottomSheet` component from `src/components/ui/Modal.tsx` which already implements `createPortal(…, document.body)`.

The Equipment screen itself is not an overlay and does not use glass treatment on its main surface.

---

## Accessibility

- All slot buttons: `aria-label` describing slot name and current contents (e.g. `aria-label="Head slot — empty"`, `aria-label="Head slot — Classic Fly Hood equipped"`).
- All item cards in grid: `aria-label` with item name, category, price, and owned/unowned state.
- All filter pills: `aria-pressed="true"/"false"`.
- Touch targets: all interactive elements are minimum 44px × 44px except equipment slots (52px × 52px, exceeds minimum) and strip item cards (100px × 100px, exceeds minimum). Filter pills are `h-9` (36px) — this matches the existing pattern across the app and is the accepted exception for filter rows.
- Colour is never the sole indicator of state: empty/filled slot distinction uses border style (dashed vs solid), background, and icon content — not colour alone.
- Equip/unequip success is communicated via toast, not colour alone.
- Reduced motion: all transform animations gated by `useReducedMotion` hook.

---

## What this spec does not cover

- Real-time multiplayer or social outfit sharing (not in scope)
- Outfit presets or saving named loadouts (not in scope)
- Item rarity tiers for LeMieux items (all LeMieux items are treated as single rarity; rarity system applies to animals only)
- A "care bonus" mechanic for grooming/supplement items (explicitly deferred to a future feature)
- Drag-and-drop equip interaction (explicitly rejected — tap-to-equip is the canonical fallback interaction for this feature)
- Persisting active category filter across navigation sessions (session state only, resets on unmount)
- Item durability or uses count (LeMieux items have no use count — they are permanently owned once purchased)

---

## Open questions for Phase B (PO)

1. **Item ID migration:** The existing `useItemShop` hook stores owned items by ID. The new LeMieux items need a new ID scheme. Does the PO want to keep the existing fake items in the data layer (for any player who already owns them) or replace them entirely? This affects the database migration story.
2. **"Dress up" button label in PetDetailSheet:** Is "Dress up" the right label for a horse? Alternative: "Equip gear". Confirm which to use.
3. **Equippable items for non-horse animals:** Harry may own animals from other categories (wild, farm, sea). The equipment system is designed for horses only. The "Dress up" / "Equip" button in PetDetailSheet should only appear for animals in the `Stables` category. Confirm this scoping rule.
4. **Price data file:** The pricing model defines ranges per category. The exact price per item (411 horsewear + 63 hobby horses = 474 items) needs to be generated. Is this a one-off data task the Developer handles, or does the PO want to review/adjust individual prices?
