# Refined Stories — LeMieux Equipment System

**Feature:** `lemieux-equipment-system`
**Phase:** B (Product Owner)
**Author:** Product Owner
**Date:** 2026-03-28
**Status:** Ready for Owner approval before Phase C

---

## Source documents

- `research/lemieux-equipment-system/ur-findings.md` — UR findings, 2026-03-28
- `spec/features/lemieux-equipment-system/interaction-spec.md` — UX interaction spec, 2026-03-28
- `spec/features/lemieux-equipment-system/owner-decisions.md` — confirmed owner decisions, 2026-03-28
- `spec/features/lemieux-equipment-system/owner-pricing-requirements.md` — confirmed pricing, 2026-03-28
- `lemieux/horsewear/products.json` — 411 horsewear products across 9 URL categories
- `lemieux/hobby-horses/products.json` — 63 hobby horse products
- `src/lib/db.ts` — schema v11, `ownedItems` table with `equippedToPetId` column

---

## Constraints applied from owner decisions

- All LeMieux items are Epic (300–600 coins) or Legendary (700–1,200 coins) rarity only
- Grooming items are a lower tier: 100–250 coins
- Equipment is per-horse — the same item instance cannot be equipped on two horses simultaneously
- Only `category === 'Stables'` animals get an equip screen
- Leg slots: one "Legs" slot per horse; one item covers all four legs visually
- Equip gesture: drag-to-slot primary; tap-to-equip as fallback (owner confirmed drag-to-slot)
- One age-restricted hobby horse product (labelled "Not suitable for persons under 14 years of age") must be excluded at the data layer
- Supplements, stable-yard, fly-protection: out of scope for Phase C
- Image fallback required: CDN images may be unavailable for approximately half the horsewear catalogue
- Grooming items are purchasable now; their care-action mechanic is a future feature
- Hobby horses are collectibles only — not equippable on virtual horses
- Drag-to-slot confirmed by owner; tap-to-equip must also work as a fallback

---

## Story map

| # | Story title | Value | Depends on |
|---|---|---|---|
| LES-01 | Store items section — LeMieux horsewear catalogue | Core shop experience | — |
| LES-02 | Store — hobby horses section | Collectible shop experience | LES-01 (shared card pattern) |
| LES-03 | Store — grooming section | Purchasable grooming items | LES-01 (shared card pattern) |
| LES-04 | Purchase flow — item detail sheet and coin spend | Revenue loop | LES-01, LES-02, LES-03 |
| LES-05 | Equipment screen — access from My Animals | Entry point for equipping | LES-04 |
| LES-06 | Equipment screen — slot layout and horse display | Core equip surface | LES-05 |
| LES-07 | Equipment screen — drag-to-slot equip gesture | Primary equip interaction | LES-06 |
| LES-08 | Equipment screen — tap fallback equip | Accessibility fallback | LES-06 |
| LES-09 | Equipment screen — unequip action | Item recovery | LES-07, LES-08 |
| LES-10 | My Animals — Items Collection tab | Collection browsing | LES-04 |
| LES-11 | Data layer — schema and static data import | Foundation | — |
| LES-12 | Image fallback handling | Resilience | LES-11 |

---

## LES-01 — Store items section: LeMieux horsewear catalogue

As Harry,
I need the Items section of the Shop to show real LeMieux horsewear products with images, names, rarity badges, and coin prices, filterable by category,
So that I can browse and save up for the specific gear I want for my horses.

### Acceptance criteria

- [ ] The Items section of ShopScreen replaces all fictional item definitions with LeMieux horsewear products loaded from `lemieux/horsewear/products.json` via the static data file
- [ ] Only the following categories are shown in this section: Fly Hoods, Headcollars, Rugs, Boots, Saddlery, Fly Protection. Grooming, Stable, and Supplements appear in their own dedicated sections (see LES-03). Hobby Horses appear in their own section (see LES-02)
- [ ] Category filter pills appear in the `below` slot of PageHeader in this order: All · Fly Hoods · Headcollars · Rugs · Boots · Saddlery · Fly Protection
- [ ] Active filter pill style is tint-pair: `bg-[var(--blue-sub)] border border-[var(--blue)] text-[var(--blue-t)]`. Inactive: `bg-[var(--card)] border border-[var(--border-s)] text-[var(--t2)]`. No solid fill on active pill
- [ ] The filter pill row is horizontally scrollable (`overflow-x-auto scrollbar-hide`). No sort control exists in this section
- [ ] Each item card shows: product image (or category icon well fallback), item name (13px/600/`--t1`/`line-clamp-2`), display category label (11px/500/`--t3`/uppercase), rarity badge (Epic: `--purple` tint pair; Legendary: `--amber` tint pair), coin price (13px/700/`--amber-t` if affordable, `--t4` if not)
- [ ] All LeMieux horsewear items are rarity Epic (300–600 coins) or Legendary (700–1,200 coins). No item has a price below 300 coins or above 1,200 coins in the horsewear categories
- [ ] Grooming items are 100–250 coins (Epic rarity). Hobby horse items are 300–600 coins (Epic rarity)
- [ ] When Harry cannot afford an item, the price text and coin icon render in `--t4`. The card remains tappable (Harry can still view the detail sheet)
- [ ] An OWNED badge appears in the top-right of the image well when Harry owns at least one of that item: `bg-[var(--green-sub)] text-[var(--green-t)]`, 11px/700/uppercase/`2px 8px` padding, pill shape
- [ ] An EQUIPPED badge appears in the bottom-left of the image well when the item is currently equipped to any horse slot: `bg-[var(--blue-sub)] text-[var(--blue-t)]`, same size and style as OWNED badge. Both badges can coexist
- [ ] Grid layout: `grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-1`
- [ ] Content container class: `px-6 pt-4 pb-24 max-w-3xl mx-auto w-full`
- [ ] No emoji used anywhere in item names, badge labels, or toast messages; Lucide icons only
- [ ] Layout verified at 375px, 768px, and 1024px — no wasted space, no truncated content

### Out of scope

- Grooming, Stable, Supplements, and Hobby Horses items in this story (covered in LES-02 and LES-03)
- A wishlist or "save for this" mechanic
- Item sorting controls
- Fly-protection, supplements, and stable-yard categories visible in Items section (those categories are out of scope for Phase C per owner decision)

---

## LES-02 — Store: hobby horses section

As Harry,
I need a dedicated Hobby Horses section in the Shop where I can browse and buy named LeMieux hobby horse characters and their accessories,
So that I can collect my favourite characters and feel proud of my toy horse collection.

### Acceptance criteria

- [ ] A "Hobby Horses" section appears as a distinct browsable area within the Items tab of ShopScreen (not mixed with horsewear items)
- [ ] 62 hobby horse products are available (the one product labelled "Not suitable for persons under 14 years of age" is excluded at the data layer — the exclusion must happen in the static data import, not at render time)
- [ ] The 14+ product exclusion is verifiable: a developer can confirm the item does not appear in the data file or the rendered UI by name
- [ ] Hobby horse cards use the same anatomy as horsewear cards: product image (or pink icon well fallback), item name, display category "Hobby Horses", rarity badge (Epic, `--purple` tint pair), coin price (300–600 coins)
- [ ] OWNED badge appears in top-right of image well for purchased hobby horses (same treatment as horsewear)
- [ ] Hobby horse items are clearly separated from horsewear items — a section header `HOBBY HORSES` (11px/700/uppercase/`--t3`) divides them in the grid, or a dedicated category pill in the filter row navigates to them exclusively
- [ ] Tapping a hobby horse card opens the purchase detail sheet (LES-04) — the same sheet pattern used for horsewear
- [ ] After purchase, the hobby horse appears in the Item Collection tab under its own "Hobby Horses" section (LES-10)
- [ ] No "Equip" option exists for hobby horses anywhere in the UI — they are collectibles only

### Out of scope

- Equipping accessories onto hobby horse collectibles (future feature)
- Hobby horse characters appearing in the Stables or My Animals animal grid

---

## LES-03 — Store: grooming section

As Harry,
I need a Grooming section in the Shop where I can buy LeMieux brushes, grooming bags, and care products,
So that I can build my grooming collection ready for when I can use them to look after my horses.

### Acceptance criteria

- [ ] A "Grooming" section appears as a distinct browsable area within the Items tab of ShopScreen
- [ ] All 59 grooming-care items from `lemieux/horsewear/products.json` (URL slug `grooming-care`) are available
- [ ] Grooming item prices are in the range 100–250 coins. No grooming item costs more than 250 coins or fewer than 100 coins
- [ ] Grooming item cards use the same anatomy as horsewear cards: product image (or green icon well fallback: `var(--green-sub)` / `var(--green-t)`), item name, display category "Grooming", rarity badge (Epic), coin price
- [ ] OWNED badge appears for purchased grooming items
- [ ] The purchase detail sheet for grooming items shows "Adds to your collection" in the "What this equips to" row (not a slot name)
- [ ] A "Coming soon" label or equivalent is visible on the detail sheet to communicate that the care action for grooming items is not yet available. Exact wording: "Use in care — coming soon". This label is not a button and is not tappable
- [ ] After purchase, grooming items are stored in the `lemieuxOwned` table (LES-11) and appear in My Animals Item Collection under "Other Items" (LES-10)
- [ ] No "Equip" or "Use" button exists for grooming items in the UI at this stage

### Out of scope

- The care action that consumes grooming items (future feature)
- Supplements and stable-yard categories (out of scope for this feature entirely)

---

## LES-04 — Purchase flow: item detail sheet and coin spend

As Harry,
I need to tap a LeMieux item to see its full details and buy it with coins in a single confirm step,
So that I know exactly what I'm buying and my coins are correctly deducted when I confirm.

### Acceptance criteria

- [ ] Tapping any item card in the Items section opens a `BottomSheet` (the existing `BottomSheet` component from `src/components/ui/Modal.tsx`)
- [ ] The sheet header shows: product image (80px × 80px, `rounded-[12px]`, `object-cover`) or category icon well fallback; item name as the sheet title; rarity badge
- [ ] The sheet body shows: Category row (display category label), Owned row (count of how many Harry already owns), "What this equips to" row (slot name for equippable items, or "Adds to your collection" for non-equippable items)
- [ ] The sheet does NOT show a "Stat boost" row or "Uses" row — these are fictional item concepts that do not apply to LeMieux products
- [ ] A coin price row and "Buy" button appear at the bottom. The "Buy" button is disabled (not hidden) when Harry cannot afford the item. Button label: "Buy for [price] coins"
- [ ] When Harry taps "Buy" and can afford the item: (a) coins are deducted via `spend()`, (b) a new record is added to the `lemieuxOwned` table, (c) both operations are wrapped in a single `db.transaction('rw', ...)` — the spend and the item write are atomic, (d) a success toast fires: "[Item name] added to your collection", info variant, 3s auto-dismiss
- [ ] After a successful purchase, the sheet closes. The item card in the shop grid immediately shows the OWNED badge without requiring a refresh
- [ ] The `TransactionCategory` for a LeMieux item purchase is `'items'`
- [ ] When Harry has no horses yet and purchases a horsewear equippable item, a secondary informational toast fires after the purchase success toast: "Go to My Animals to create a horse and equip your gear". This toast does not block the purchase and does not appear for grooming or hobby horse purchases
- [ ] The BottomSheet uses glass treatment: `rgba(13,13,17,.88)` + `backdrop-filter: blur(24px)` + `border: 1px solid rgba(255,255,255,.06)`. Backdrop: `bg-black/10`. The sheet must use `createPortal` — the existing `BottomSheet` component already does this; FE must not re-implement
- [ ] If Harry owns the same item and taps its card, the "Buy" button remains available (Harry can purchase a second copy)
- [ ] Error state: if the purchase transaction fails, a toast fires with a user-facing error message. The error `catch` block must not be silent

### Out of scope

- A wishlist or "save for this" pinning mechanic
- Gift or transfer of purchased items
- Refund of purchased items

---

## LES-05 — Equipment screen: access from My Animals

As Harry,
I need a "Dress up" button on each of my horses in My Animals that takes me to the equipment screen for that horse,
So that I can reach the equip screen without searching for it.

### Acceptance criteria

- [ ] In `MyAnimalsScreen`, every animal card whose `category === 'Stables'` shows a "Dress up" button (or icon button) that navigates to `/equip/:petId`
- [ ] Animals whose category is not 'Stables' do not show any "Dress up" control — the button is absent, not disabled
- [ ] The `PetDetailSheet` (the bottom sheet that opens when Harry taps an animal card) also contains a "Dress up" action that navigates to `/equip/:petId` for horses. This is not present for non-horse animals
- [ ] The `/equip/:petId` route renders the Equipment screen for the horse identified by `petId`. If `petId` does not resolve to a Stables animal, the screen redirects to `/animals`
- [ ] A horse with `status === 'for_sale'` does not show the "Dress up" button — a for-sale horse cannot receive equipment actions
- [ ] The Equipment screen PageHeader shows the horse's name as the title and `CoinDisplay` as the trailing element
- [ ] A back button (`ChevronLeft` icon, 32px, `bg: var(--elev)`) appears left of the title and navigates back on tap. No "Save" button exists — all changes are persisted immediately on equip/unequip action

### Out of scope

- An "Equip" button on hobby horse collectibles
- Equipment access from anywhere other than My Animals and PetDetailSheet

---

## LES-06 — Equipment screen: slot layout and horse display

As Harry,
I need to see my horse surrounded by labelled equipment slots arranged around its image, showing what gear is currently equipped in each slot,
So that I can see at a glance what my horse is wearing and which slots are empty.

### Acceptance criteria

- [ ] The Equipment screen renders a 200px × 200px horse image (using the existing `AnimalImage` component) centred in the equipment area
- [ ] The horse image container has `position: relative; padding: 40px`. All slot indicators are `position: absolute` relative to this container. The container has `overflow: visible`
- [ ] Eight equipment slots are positioned around the horse image using the pixel offsets from the interaction spec:
  - Head: `top: -28px; left: 50%; transform: translateX(-50%)`
  - Rug (Body): `top: 50%; right: -28px; transform: translateY(-50%)`
  - Bridle: `top: 28px; left: -28px`
  - Saddle: `bottom: 20px; left: 50%; transform: translateX(-50%)`
  - Front Left Leg: `bottom: -28px; left: 4px`
  - Front Right Leg: `bottom: -28px; left: 64px`
  - Back Left Leg: `bottom: -28px; right: 64px`
  - Back Right Leg: `bottom: -28px; right: 4px`
- [ ] Each slot is 52px × 52px (`min-touch-target: 44px` — this exceeds the minimum), `border-radius: var(--r-md)` (12px)
- [ ] Empty slot state: `border: 1.5px dashed var(--border)`, `background: var(--elev)`, centre Lucide icon at 20px in `var(--t4)`, slot label text (10px/500/`var(--t4)`) below the icon
- [ ] Filled slot state: category tint background and matching solid border, item thumbnail image at 36px × 36px (`object-cover`, `border-radius: var(--r-xs)`), no label text
- [ ] The four leg slots (Front Left, Front Right, Back Left, Back Right) always fill and empty together as a group. When one leg item is equipped, all four leg slot thumbnails update simultaneously. When any leg slot is tapped to unequip, all four clear simultaneously
- [ ] Equipment area container class: `px-6 pt-6 pb-24 max-w-3xl mx-auto w-full` (no `below` slot, so `pt-6`)
- [ ] The entire equipment area (horse + slots) is centred within the content column at all three breakpoints. FE must verify slot positions do not clip or overlap at 375px, 768px, and 1024px
- [ ] Hover states (pointer devices): empty slot steps border to `var(--border)` solid + `rgba(255,255,255,.03)` bg; filled slot brightens border + `scale(1.04)` over 200ms
- [ ] Active/tap state on any slot: `scale(.97)` over 150ms
- [ ] Focus visible state: `outline: 2px solid var(--blue); outline-offset: 2px`
- [ ] No emoji. No hardcoded hex values. All slot icon names from the Lucide library

### Out of scope

- A slot for accessories (leadropes) — there are 8 slots only as specified
- Slot positions that scale with the horse image (image is fixed at 200px)

---

## LES-07 — Equipment screen: drag-to-slot equip gesture

As Harry,
I need to drag an item from the compatible items strip onto a slot on my horse, and have it snap into place with clear visual feedback,
So that equipping gear feels satisfying and direct — like dressing up my horse by hand.

### Acceptance criteria

- [ ] When Harry taps an empty or filled slot, the compatible items strip animates into view below the equipment area. The strip header reads "{SLOT NAME} — tap an item to equip" at 12px/700/uppercase/1.5px letter-spacing/`var(--t3)`
- [ ] The strip shows only items Harry owns that are compatible with the tapped slot type. Items are shown as 100px × 100px cards, horizontally scrollable (`gap-3`, `px-6`)
- [ ] Harry can long-press (or press-and-hold) any item in the compatible strip to begin a drag gesture. While dragging: the item card follows the finger/pointer; the target slot (and any compatible slot) highlights with `border: 1.5px solid var(--blue)` + `box-shadow: 0 0 12px rgba(55,114,255,.35)` (the selected/glow state)
- [ ] When Harry releases over a compatible slot: the item equips. The equip animation fires (see below). The slot visual updates to filled state. A success toast fires: "[Item name] equipped to [Slot name]", info variant, 3s
- [ ] When Harry releases outside any slot (failed drag): the item card animates back to its original position in the strip. No item is consumed. No error toast fires — the action is simply cancelled
- [ ] Equip animation sequence (total ~350ms):
  1. Strip item card scales to `scale(0.9)`, `opacity: 0.6` over 150ms (`ease-in`)
  2. Target slot scales to `scale(1.1)` over 100ms, then springs back to `scale(1.0)` with `{ type: "spring", stiffness: 400, damping: 20 }`
  3. Slot visual content updates (image appears); border transitions from selected-blue to filled-tint over 200ms
- [ ] Reduced motion: all scale transforms are suppressed when `prefers-reduced-motion: reduce` is active. Only colour transitions at 150ms run. `useReducedMotion` hook must gate all transform animations
- [ ] Dragging a leg-slot-compatible item onto any one of the four leg slots equips it to all four simultaneously. The drag target accepts drop on any of the four leg slot positions
- [ ] If Harry already has an item equipped in the target slot and drags a different item onto it: the previous item returns to the compatible items strip (inventory); the new item equips. One toast fires: "[New item] equipped to [Slot name]". The previous item is not lost — it reappears in the strip
- [ ] All four leg slots accept drag events simultaneously; dropping on any one of the four fills all four

### Out of scope

- Multi-item drag (dragging more than one item at once)
- Dragging items between horses directly (Harry must unequip from one horse and equip on another)

---

## LES-08 — Equipment screen: tap fallback equip

As Harry,
I need to be able to equip items by tapping a slot and then tapping an item in the strip that appears, without needing to drag,
So that I can equip gear even if I find the drag gesture difficult.

### Acceptance criteria

- [ ] Tapping an empty slot (without dragging) enters the selected state: `border: 1.5px solid var(--blue)`, `background: var(--blue-sub)`, `box-shadow: 0 0 12px rgba(55,114,255,.35)` on the slot. The compatible items strip animates in
- [ ] Tapping an item in the strip while a slot is in selected state equips the item to that slot. The same equip animation from LES-07 fires
- [ ] Tapping the horse image area or anywhere outside the strip while a slot is selected deselects the slot. The strip animates out. No item is equipped or removed
- [ ] Tapping the currently selected slot again deselects it. Strip closes
- [ ] Tapping a filled slot opens the strip with the currently equipped item highlighted. The equipped item card shows a blue ring: `outline: 2px solid var(--blue); outline-offset: 2px` and an "Equipped" tint badge: `bg-[var(--blue-sub)] text-[var(--blue-t)]`, 9px/600, bottom-0 of image area
- [ ] Only one slot can be in selected state at a time. Tapping a second slot while one is already selected: the first deselects, the second selects, the strip updates to show compatible items for the new slot
- [ ] The strip entrance and exit use Framer Motion `AnimatePresence`: enter `height: 0 → auto` over 300ms `ease-out` + `opacity: 0 → 1` over 200ms; exit `height → 0` over 250ms `ease-in` + `opacity → 0` over 150ms. Reduced motion: `opacity` only, no height animation
- [ ] If Harry owns no compatible items for the selected slot, the strip shows a single empty-state card (120px × 120px, `bg: var(--elev)`, `border: 1px dashed var(--border-s)`, `ShoppingBag` icon 24px/`var(--t4)` centred, sub-text "Visit the Shop" 11px/500/`var(--t4)`) that navigates to `/shop` when tapped
- [ ] The strip is fully accessible via keyboard and focus — slots and strip items can be tabbed through and activated with Enter or Space

### Out of scope

- Drag gesture (covered in LES-07)
- A confirmation dialog before equipping — equipping is reversible and does not require confirmation

---

## LES-09 — Equipment screen: unequip action

As Harry,
I need to be able to remove an item from a slot on my horse and have it return to my inventory so I can re-equip it on the same or a different horse,
So that equipping is never permanent and I can change my mind freely.

### Acceptance criteria

- [ ] When a filled slot is tapped and the compatible items strip is open, tapping the currently equipped item card in the strip unequips it
- [ ] On unequip: (a) the item's `equippedToPetId` is set to `null` in the `lemieuxOwned` table, (b) the slot visual returns to empty state, (c) a success toast fires: "[Item name] removed", info variant, 3s. Both the DB write and the state update are atomic (the write must not fail silently)
- [ ] The unequipped item immediately reappears in Harry's inventory (Item Collection tab) as "Not equipped"
- [ ] The item can then be equipped to the same or a different horse via the strip on any horse's equipment screen
- [ ] Unequip animation: slot scales to `scale(0.9)`, `opacity: 0.8` over 100ms, then transitions to empty-state appearance over 200ms. Strip item card loses blue ring over 150ms. Reduced motion: instant visual state change, 150ms colour transition only
- [ ] Unequipping one leg slot unequips all four leg slots simultaneously. One item record is removed (not four). One toast fires: "[Item name] removed from legs"
- [ ] The same item instance cannot be equipped on two horses simultaneously. After unequipping from Horse A, the item shows "Not equipped" everywhere; it can then be equipped on Horse B
- [ ] If Harry owns two copies of the same item (purchased twice), each copy has an independent `equippedToPetId` — one copy can be equipped while the other is unequipped

### Out of scope

- A confirmation dialog before unequipping — unequipping is reversible
- Selling or discarding equipped items
- Bulk unequip all

---

## LES-10 — My Animals: Items Collection tab

As Harry,
I need an Items tab in My Animals that shows everything I've bought from the LeMieux shop, organised into Horse Equipment, Hobby Horses, and Grooming sections,
So that I can see my collection, know what's equipped where, and equip items without going back to the shop.

### Acceptance criteria

- [ ] My Animals PageHeader `centre` slot gains a segmented control: `[ Animals | Items ]`. "Animals" is default. This control is the only place this switcher exists — neither the Animals grid nor the Items grid renders its own tab control
- [ ] The `below` slot (category pills + sort control) is visible only when the "Animals" tab is active. When the "Items" tab is active, the `below` slot is hidden entirely
- [ ] When the Items tab is active and Harry owns at least one item, the following sections appear in order:
  1. **HORSE EQUIPMENT** — all equippable items Harry owns (head, body, legs, bridle, saddle slots)
  2. **HOBBY HORSES** — hobby horse collectibles Harry owns (horizontal shelf layout, not a grid)
  3. **OTHER ITEMS** — grooming items Harry owns
  Sections with zero owned items are hidden entirely
- [ ] When the Items tab is active and Harry owns nothing, a full empty state is shown: `ShoppingBag` icon (48px/`var(--t4)`), title "No items yet" (22px/600/`--t1`), description "Buy gear in the Shop to outfit your horses" (15px/400/`--t3`/max-w 280px/centred), "Go to Shop" button (`btn-md btn-primary`) navigating to `/shop`
- [ ] Horse Equipment section: grid `grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3`. Each card shows: product image (or icon well fallback), item name (13px/600/`--t1`/`line-clamp-2`), slot label (11px/500/`--t3`), equipped status — either the horse name (11px/500/`--t4`) or "Not equipped" (11px/500/`--t4`). An EQUIPPED badge (`bg-[var(--blue-sub)] text-[var(--blue-t)]`) appears bottom-left of the image well when equipped
- [ ] Tapping an equipped item card in Horse Equipment navigates to `/equip/:petId` for the horse it is equipped on
- [ ] Tapping an unequipped item card in Horse Equipment opens an "Equip on which horse?" BottomSheet listing all horses Harry owns that accept the item's slot type
  - Each horse row: `AnimalImage` (36px × 36px), horse name (15px/600/`--t1`), slot status ("Slot empty" in `--t3`, or existing item name + "Replace" in `--amber-t`), `ChevronRight` icon
  - Tapping a row equips the item to that horse and navigates to `/equip/:petId`
  - If no horses exist that accept this slot type, the sheet shows: "None of your animals use this slot"
- [ ] Hobby Horses section: horizontal scrolling shelf, `flex gap-4 overflow-x-auto scrollbar-hide px-6 -mx-6`. Each card: 140px wide × shrink-0, `var(--r-lg)` radius, `1px solid var(--border-s)` border, `var(--card)` background, product image (140px × 140px / `object-cover` / `rounded-t-[16px]`), name (13px/600/`--t1`/`line-clamp-2` / `px-3 pt-2 pb-3`), first sentence of description (11px/400/`--t3`/`line-clamp-2` / `px-3 pb-3`)
- [ ] Tapping a hobby horse card opens a detail BottomSheet (info-only: image, name, full description). No "Buy" button (already owned). No "Equip" option
- [ ] Other Items section (grooming): grid `grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3`. Same card anatomy as Horse Equipment but without the slot label row. Shows display category label instead (e.g. "Grooming")
- [ ] Content container class: `px-6 pt-4 pb-24 max-w-3xl mx-auto w-full` (the Items tab uses `pt-4` because the `centre` slot control acts as a sub-header)
- [ ] Section headers use Hairline style: 11px/700/uppercase/1.5px tracking/`var(--t3)`, left-aligned, `mb-3`

### Out of scope

- A full catalogue showing unowned items with locked state (future feature)
- Sorting or filtering within the Item Collection sections
- A count of how many of each item Harry owns displayed on collection cards

---

## LES-11 — Data layer: schema and static data import

As a developer,
I need a new `lemieuxOwned` table in the database and a static data file of all in-scope LeMieux products with assigned prices, categories, and slot mappings,
So that purchase and equip actions have a reliable, typed data foundation.

### Acceptance criteria

- [ ] A new `LemieuxOwned` interface is added to `src/lib/db.ts` with at minimum these fields: `id?: number`, `productId: string` (derived stable key from product name, URL-slugified), `category: LemieuxCategory` (typed union of all display category slugs), `slotType: EquipSlot | null` (null for non-equippable items), `name: string`, `rarity: 'epic' | 'legendary'`, `price: number`, `imageUrl: string`, `equippedToPetId: number | null`, `purchasedAt: Date`
- [ ] The `lemieuxOwned` table is added to the Dexie schema at a new version (v12 or higher): `'++id, productId, category, slotType, equippedToPetId'`. The existing `ownedItems` table is unchanged (it supports the old fictional item system; old and new systems coexist until the old items are retired in a future feature)
- [ ] A static data file (`src/data/lemieuxDefs.ts`) exports all purchasable LeMieux products as a typed array. Each item has: `productId`, `name`, `description`, `imageUrl`, `category` (using the display category mapping from the interaction spec), `slotType`, `rarity`, `price`
- [ ] The data file covers all in-scope categories: Fly Hoods (54 items), Headcollars (51 items), Rugs (57 items), Boots (54 items), Saddlery (47 items), Grooming (59 items), Hobby Horses (62 items — 63 minus the 14+ excluded item). Total: 384 items
- [ ] The 14+ hobby horse product is absent from `lemieuxDefs.ts`. It must be identifiable by name in the source `products.json` so the exclusion can be audited
- [ ] Price assignments comply with the owner's pricing constraints: Epic horsewear 300–600 coins, Legendary horsewear 700–1,200 coins, Grooming 100–250 coins (Epic), Hobby Horses 300–600 coins (Epic)
- [ ] Fly Protection, Supplements, and Stable-Yard products from `products.json` are NOT included in `lemieuxDefs.ts` — those categories are out of scope for Phase C
- [ ] `EquipSlot` is a TypeScript union type: `'head' | 'body' | 'legs' | 'saddle' | 'bridle'`. Note: the UI shows four individual leg slot positions but they map to a single `slotType: 'legs'` in the data layer. All four leg slot positions in the UI read from and write to items with `slotType === 'legs'`
- [ ] A `useLemieuxShop` hook (or equivalent) handles: fetching all `lemieuxOwned` records for the current player, computing `ownedCount` per `productId`, computing `equippedToPetId` per `productId`, and exposing a `buyItem(productId)` function that wraps `spend()` and `db.lemieuxOwned.add(...)` inside a single `db.transaction('rw', db.lemieuxOwned, db.playerWallet, db.transactions, ...)`
- [ ] The `spend()` call and the `db.lemieuxOwned.add()` call are inside the same `db.transaction('rw', ...)`. They are never separated by an `await` outside a transaction. A failed add after a successful spend is not possible
- [ ] Every async operation in the hook has a `try/catch` that calls `toast({ type: 'error', ... })` with a user-facing message. No silent swallows

### Out of scope

- Migrating or replacing the existing `ownedItems` table (old item system coexists)
- Server-side persistence
- A migration to add `lemieuxOwned` data from the old `ownedItems` table

---

## LES-12 — Image fallback handling

As Harry,
I need every item card in the shop and collection to show something sensible even if the LeMieux CDN image fails to load,
So that I never see a broken image icon or blank space where a product photo should be.

### Acceptance criteria

- [ ] Every component that renders a LeMieux product image (`<img>` or equivalent) has an `onError` handler that sets the image source to `null` and renders the category icon well instead
- [ ] The fallback icon well matches the category tint specification: background `var(--{category}-sub)`, icon colour `var(--{category}-t)`, Lucide icon at appropriate size (40px in shop cards, 20px in strip cards, 36px in collection cards)
- [ ] A broken CDN image never renders as a blank space, a broken-image browser icon, or a visual error. The fallback renders within the same dimensions as the image container
- [ ] The fallback behaviour is verified for at least three representative items from different categories during Phase D (Tester must manually block image requests in browser devtools or use a network simulation and confirm fallback renders)
- [ ] The fallback is applied consistently: shop grid cards, purchase detail sheet, equipment screen slot thumbnails, compatible items strip cards, item collection cards, hobby horse shelf cards

### Out of scope

- Local caching of product images
- A loading skeleton while images are fetching (nice-to-have, not required for Phase C)

---

## Out of scope for this feature

The following are explicitly excluded from this feature. Any story or code referencing them must be stopped and escalated.

- **Supplements** (23 items, `supplements` URL slug) — not purchasable, no UI presence
- **Stable-yard** (30 items, `stable-yard` URL slug) — not purchasable, no UI presence
- **Fly protection** consumables (fly sprays, nose filters, itch relief within `fly-protection` slug) — fly masks and fly boots that map to equipment slots are included via their parent categories (head and legs slots); consumable fly products are excluded
- **Care bonus from grooming items** — grooming items are purchasable collectibles only; the use mechanic is a future feature
- **Hobby horse accessories equipping onto hobby horse collectibles** — a future feature
- **Item trading or selling** — Harry cannot sell items he has purchased back to the shop or to other players
- **Item lending** — an item owned by Harry can only be equipped on Harry's horses
- **Age-restricted hobby horse product** — excluded at the data layer (the one product labelled "Not suitable for persons under 14 years of age")
- **The old `ownedItems` fictional item system** — it continues to operate unchanged; this feature does not retire it

---

## Definition of Done

All of the following must be true before `lemieux-equipment-system` can be marked complete in `spec/backlog/BACKLOG.md`.

### Functional completeness

- [ ] LES-01 through LES-12: all acceptance criteria are passing per `tests/lemieux-equipment-system/test-results.md`
- [ ] Tester has signed off `tests/lemieux-equipment-system/test-results.md`
- [ ] `spec/features/lemieux-equipment-system/done-check.md` has been completed by the team

### Data correctness

- [ ] 384 LeMieux products (54 fly hoods + 51 headcollars + 57 rugs + 54 boots + 47 saddlery + 59 grooming + 62 hobby horses) are present in `src/data/lemieuxDefs.ts`
- [ ] Zero products from the Supplements, Stable-Yard, or Fly-Protection consumable sub-categories are in `lemieuxDefs.ts`
- [ ] The 14+ hobby horse product is absent from the data file and absent from the rendered shop UI (Tester to verify by product name)
- [ ] All price assignments are within the owner-confirmed ranges; no item is priced below its category minimum or above its category maximum

### Schema integrity

- [ ] The Dexie schema has been incremented to at least v12 with the `lemieuxOwned` table present
- [ ] No existing table definitions have been removed or renamed
- [ ] The `spend()` call and `lemieuxOwned.add()` are inside a single `db.transaction('rw', ...)` in `useLemieuxShop` — verified by code review, not just by observation

### Transaction integrity

- [ ] Every async operation in `useLemieuxShop` and the equip/unequip hooks has a `try/catch` with a user-facing toast on error — no silent swallows
- [ ] No `.catch(() => {})`, `.catch((_) => {})`, or `catch {}` patterns in any Phase C code

### Visual and interaction quality

- [ ] Layout verified at 375px, 768px, and 1024px for: shop grid, equipment screen, item collection tab, hobby horse shelf
- [ ] Equipment screen slot positions do not clip or overlap at any of the three verified breakpoints
- [ ] Equip animation and unequip animation play as specified; `useReducedMotion` suppresses transforms correctly
- [ ] Compatible items strip `AnimatePresence` entrance/exit works without layout jump; height animation does not cause content flash
- [ ] All four leg slots fill and clear together as a group in every user flow (drag, tap, unequip)
- [ ] No broken image icons visible in any card, slot, strip, or shelf at any breakpoint — fallback icon wells render correctly
- [ ] No emoji used anywhere: no JSX, no data files, no toast messages, no button labels
- [ ] No `ghost` variant on any visible action button — confirmed by Tester across the full codebase
- [ ] All colours trace to `var(--...)` tokens; no hardcoded hex values
- [ ] BottomSheets and toasts use `createPortal` — confirmed by code review

### Accessibility and child-user considerations

- [ ] All interactive slots meet minimum 44×44pt touch target (slots are 52×52px — confirmed)
- [ ] Empty slots have a visible "tap me" affordance (dashed border + slot icon + label) — not just a blank area
- [ ] Failed drag gesture returns item to strip visibly; no silent failure state
- [ ] All equip and unequip actions are reversible with no confirmation dialog required
- [ ] No time-pressure elements anywhere in the equip flow

### Regression

- [ ] The existing Marketplace, Auction, Racing, and Card Collection features continue to function after the schema version increment
- [ ] The existing `ownedItems` table and fictional item shop still function (they are not retired by this feature)
- [ ] The Animals tab in My Animals is unaffected — animals list, filter, sort, and detail sheet behaviour unchanged
