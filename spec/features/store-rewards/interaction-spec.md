# Interaction Spec — Store: Market Filters + Rescue Mission Flow

**Feature:** store-rewards
**Author:** UX Designer
**Date:** 2026-03-30
**Status:** Draft — awaiting Phase B (PO) and [OWNER] approval before Phase C

---

## Part 1: Market Section Filter Tabs

### 1.1 Context and scope

The Marketplace section of StoreHubScreen currently renders NPC buy offers and player
listings mixed together under a two-tab segmented control (`browse` / `listings`). The
owner wants a three-tab structure within the Market section of the Store:

| Tab key | Label | Content |
|---------|-------|---------|
| `market` | Market | NPC buy offers — animals other players/NPCs want to buy from Harry |
| `for_sale` | For Sale | Player listings — animals Harry or others are selling |
| `rewards` | Rewards | Rescue mission cards — not for sale; earned via missions |

The existing `browse` tab maps approximately to the new `market` tab. The existing
`listings` tab maps to `for_sale`. `rewards` is entirely new.

**This spec covers the filter row and the Rewards tab UI only.** The Market and For Sale
tabs retain their existing content structure; this spec does not redesign them. Any
changes to those tabs are out of scope here.

---

### 1.2 PageHeader slot assignment

The Market section is one section within StoreHubScreen, which already has a `centre`
slot used for the main Store tab switcher (Marketplace / Items / Cards / Auctions).

The three-tab row (`Market` / `For Sale` / `Rewards`) is a **content filter** — it
filters content within the Marketplace section. It must live in the **`below` slot** of
the PageHeader.

- `centre` slot: main Store section switcher (existing, unchanged)
- `below` slot: Market sub-filter row (new — only visible when the active main tab is Marketplace)

The `below` slot already accepts a `flex flex-col gap-3` container; the filter row sits
as the single child of that container when Marketplace is active. When any other main
tab is active, the `below` slot renders nothing.

**Navigation ownership:** The `MarketplaceContent` component receives `marketTab` and
`setMarketTab` as props from `StoreHubScreen`. `MarketplaceContent` does **not** render
its own tab control. The tab row lives in the `below` slot of the PageHeader only. A
duplicate tab row inside the content component is a build defect.

---

### 1.3 Filter row: visual design

The filter row uses the **CategoryPills pattern** from
`src/components/explore/CategoryPills.tsx`. This is the canonical filter pill component
for the project. Do not re-implement inline.

**Container:**
```
display: flex
gap: 8px
overflow-x: auto
padding-bottom: 4px (scrollbar hide on overflow)
scrollbar-hide class applied
```

**Individual pill:**
```
height: 36px (h-9)
padding: 0 16px (px-4)
border-radius: var(--r-pill) — 100px
font: 13px / 600 (text-[13px] font-semibold)
flex-shrink: 0
transition: color, background, border-color 150ms
```

**Active pill:**
```
background:   var(--blue-sub)   [rgba(55,114,255,.12)]
border:       1px solid var(--blue)   [#3772FF]
color:        var(--blue-t)   [#6E9BFF]
```

**Inactive pill:**
```
background:   var(--card)   [#18181D]
border:       1px solid var(--border-s)   [#2C2F3A]
color:        var(--t2)   [#B1B5C4]
```

The solid-fill pattern (`background: var(--blue); color: #fff`) is a primary action
button treatment. It must not be used on filter pills.

**Interaction states — pill:**
| State | Treatment |
|-------|-----------|
| Default (inactive) | `var(--card)` bg, `var(--border-s)` border, `var(--t2)` text |
| Default (active) | `var(--blue-sub)` bg, `var(--blue)` border, `var(--blue-t)` text |
| Hover (inactive) | `var(--elev)` bg, `var(--border)` border, `var(--t1)` text, 150ms |
| Hover (active) | No change — active state is already visually distinguished |
| Pressed | `transform: scale(.97)`, 100ms |
| Focus-visible | `outline: 2px solid var(--blue); outline-offset: 2px` |
| Disabled | Not applicable — all three tabs are always available |

**Minimum touch target:** Each pill must be at least 44px tall on touch devices. The
`h-9` (36px) visual height sits inside a container with sufficient vertical padding to
meet this. If any pill is tappable via a touch event, ensure the invisible tap area
extends to 44px using padding or a pseudo-element. FE to verify.

**Aria:** Each pill is a `<button>` with `aria-pressed={isActive}`. The group is wrapped
in a `<nav aria-label="Market filter">` or a `<div role="group" aria-label="Market view">`.

---

### 1.4 Content top padding

The `MarketplaceContent` component renders directly below the `below` slot. The full
container class string for the scrollable content area:

```
px-6 pt-4 pb-24 max-w-3xl mx-auto w-full
```

`pt-4` (16px) is mandatory — content must not sit flush against the glass header border.

---

### 1.5 Filter row and sort row layout

The Market and For Sale tabs do not introduce a new sort control. If a sort control is
added in a future sprint, it must be specified here before Phase C begins.

The filter row occupies one row in the `below` slot. There is no secondary sort row at
this time.

---

### 1.6 Rewards tab: mission card grid

When the `rewards` tab is active, the card grid replaces the offer grid entirely. The
Market and For Sale content is not visible.

#### Layout

```
Mobile (< 768px):   grid-cols-1
Tablet (≥ 768px):   grid-cols-2
iPad landscape:     grid-cols-2  (max-w-3xl constraint limits to two comfortable columns)
```

Grid gap: `12px` (gap-3).

Content container: `px-6 pt-4 pb-24 max-w-3xl mx-auto w-full` (same as other tabs).

#### Mission card anatomy

Each mission card is a full-width card component with `border-radius: 16px` (`--r-lg`),
surface `var(--card)`, border `1px solid var(--border-s)`. No shadow at rest.

**Card layout — two-column header row, then details below:**

```
┌──────────────────────────────────────────┐
│  [Image 64×64]  Animal Name       [Rarity badge]  │
│                 Habitat · Region              │
├──────────────────────────────────────────┤
│  MISSIONS REQUIRED                       │
│  [Progress bar: X / Y complete]          │
│  Mission 1 description          [tick/blank] │
│  Mission 2 description          [tick/blank] │
│  ...                                     │
├──────────────────────────────────────────┤
│            [Start Mission button]        │
└──────────────────────────────────────────┘
```

**Image thumbnail:**
```
width:         64px (w-16)
height:        64px (h-16)
border-radius: 12px (--r-md)
object-fit:    cover
flex-shrink:   0
```

This follows the BottomSheet header row pattern from `PetDetailSheet.tsx`. Do not use
`aspect-video` or full-width image inside a card that is also a list item. Full-width
image treatment is for grid cards only (e.g. AuctionCard).

**Animal name:**
```
font:   16px / 600 (text-[16px] font-semibold)
color:  var(--t1)
```

**Rarity badge:** Tint-pair pill, right-aligned in header row. Use existing `RarityBadge`
component. Do not re-implement.

**Habitat and region:**
```
font:   13px / 400 (text-[13px])
color:  var(--t2)
icon:   MapPin (Lucide, size 12, strokeWidth 2), inline before text
gap:    4px between icon and text
```

**Divider between header and missions block:**
```
border-top: 1px solid var(--border-s)
margin: 12px 0
```

**Missions section heading:**
```
text: "MISSIONS REQUIRED"
font: 11px / 700, uppercase, letter-spacing 1.5px (Hairline style)
color: var(--t3)
margin-bottom: 8px
```

**Progress bar:**
```
height:           4px
border-radius:    9999px
track:            var(--elev)
fill:             var(--blue)    (blue, not pink — this is a progress/utility signal, not a purchase CTA)
margin-bottom:    8px
transition:       width 300ms ease
```

Progress label: `"X of Y missions complete"` — `12px / 500, var(--t3)`, rendered below
the bar.

**Mission row:**
```
display:      flex
align-items:  center
gap:          8px
padding:      6px 0
border-bottom: 1px solid var(--border-s)  (last row: no border)
```

Mission description: `13px / 400, var(--t2)`, left-aligned, flex-1.
Completion indicator: Lucide `CheckCircle` (size 16, strokeWidth 2, `var(--green-t)`)
when complete; Lucide `Circle` (size 16, strokeWidth 2, `var(--t4)`) when incomplete.

**Card footer — Start Mission button:**
```
margin-top:   12px
width:        100%
variant:      accent (pink)
size:         md (44px height)
label:        "Start Mission"
```

If a mission is already in progress for this animal, the button label changes to
`"Continue Mission"` and variant remains `accent`.

If the mission is complete and awaiting claim, the button label is `"Claim Rescue"` and
variant is `accent`.

**Card interaction states:**
| State | Treatment |
|-------|-----------|
| Default | `var(--card)` bg, `1px solid var(--border-s)`, no shadow |
| Hover | `border-color: var(--border)`, `translateY(-2px)`, `shadow: var(--sh-card)`, 300ms |
| Pressed | `scale(.97)`, 100ms |
| Focus-visible | `outline: 2px solid var(--blue); outline-offset: 2px` |

**Hover lift:** `motion-safe:hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(0,0,0,.25)] hover:border-[var(--border)] motion-safe:active:scale-[.97] transition-all duration-300`

Parent grid must have `pt-1` to prevent hover lift clipping at scroll container edges.

---

### 1.7 Rewards tab: empty state

Shown when no missions are available (no active, no claimable, no in-progress missions).

**Layout:** Centred column, `min-h-[240px]`, vertically centred content.

```
┌────────────────────────────────┐
│                                │
│   [MapPin icon — 40px circle]  │
│   Rescue your first wild animal │
│   Find missions on the World Map│
│                                │
│   [Go to World Map — button]   │
│                                │
└────────────────────────────────┘
```

**Icon circle:**
```
size:          40px (w-10 h-10)
background:    var(--green-sub)
border-radius: 50%
icon:          MapPin (Lucide, size 20, strokeWidth 2, color: var(--green-t))
margin-bottom: 12px
```

**Heading:** `"Rescue your first wild animal"` — `16px / 600, var(--t1)`, centred.
**Body:** `"Complete missions on the World Map to earn wild animals for your collection."` —
`13px / 400, var(--t2)`, centred, `max-w-[260px]`.

**Button:**
```
label:    "Go to World Map"
variant:  primary (blue)
size:     md
action:   navigate to Map tab
```

**Interaction states — button:**
| State | Treatment |
|-------|-----------|
| Default | `var(--blue)` bg, white text |
| Hover | `var(--blue-h)` bg, `box-shadow: var(--glow-blue)`, 300ms |
| Pressed | `scale(.97)` |
| Focus-visible | `outline: 2px solid var(--blue); outline-offset: 2px` |
| Disabled | Not applicable — always enabled |

---

### 1.8 Consistency check

Before finalising: the Explore screen uses `CategoryPills` with the same tint-pair
active style. The Store Item filter row uses inline `LEMIEUX_FILTERS` pills — this is a
known inconsistency that predates this feature. The new Market filter row must use the
tint-pair pattern, consistent with Explore, not the LeMieux inline style.

The existing Market segmented control (`browse` / `listings`) uses the `segBtn` / `SEG_CONTAINER`
inline style pattern (active: `var(--elev)` background, no coloured border). That pattern
is a segmented control for major section switches. The new three-tab row is a content
filter and must use the CategoryPills pattern. The two patterns coexist in StoreHub and
are visually distinct by intent: segmented controls select sections; CategoryPills filter
content within a section.

---

## Part 2: Rescue Mission Flow and "Temporarily Homing" Card State

### 2.1 Flow overview

```
Rewards tab → mission card → "Start Mission" button
  → Mission Brief Sheet (BottomSheet)
  → [OWNER approves: "Begin Mission" button]
  → Harry plays normal sessions
  → Toast after each qualifying session
  → All missions complete → Mission Complete overlay (celebration)
  → Card added to collection with status: rescued
  → My Animals: card shows "In your care" / homing state
  → Care progress: X days until release ready
  → When release ready: "Release to wild" button appears
  → Harry chooses: Release (remove card + award XP + badge) or Keep
```

---

### 2.2 Mission Brief Sheet

**Trigger:** Tapping "Start Mission" or "Continue Mission" on a mission card in the
Rewards tab.

**Component type:** BottomSheet — rendered via `ReactDOM.createPortal(content, document.body)`.
Glass treatment applies: `rgba(13,13,17,.88)` background + `backdrop-filter: blur(24px)` +
`1px solid rgba(255,255,255,.06)` border. Backdrop: `rgba(0,0,0,.30)`.

**Sheet layout (from top to bottom, inside the BottomSheet container):**

```
┌──────────────────────────────────────────────────┐
│  ────  (drag handle)                             │
│                                                  │
│  [Animal 80×80]  Animal Name           [X close] │
│                  [Rarity badge] [Conservation]   │
│                  Native region                   │
│                                                  │
│  ── NATIVE REGION ──                             │
│  [Mini-map SVG thumbnail — 100% width, 120px h]  │
│                                                  │
│  ── ABOUT THIS ANIMAL ──                         │
│  Short 2–3 sentence conservation context (t2)   │
│                                                  │
│  ── RESCUE MISSIONS ──                           │
│  Overall progress bar (X / Y)                   │
│  [Mission 1 row — CheckCircle/Circle + label]    │
│  [Mission 2 row]                                 │
│  [Mission 3 row]                                 │
│                                                  │
│  ─────────────────────────────────────────────  │
│  [Begin Mission — full-width accent button]      │
│  If in progress: [Continue — full-width accent]  │
│  If claimable: [Claim Rescue — full-width accent]│
└──────────────────────────────────────────────────┘
```

**Animal thumbnail:**
```
width:         80px (w-20)
height:        80px (h-20)
border-radius: 12px (--r-md)
object-fit:    cover
flex-shrink:   0
```

This follows `PetDetailSheet.tsx` header row pattern exactly. Full-width image is not
used in a BottomSheet.

**Animal name:** `20px / 700, var(--t1)`.
**Rarity badge:** Existing `RarityBadge` component, tint-pair.
**Conservation status badge:** Tint-pair pill.
- Critically Endangered: `var(--red-sub)` bg, `var(--red)` border, `var(--red-t)` text
- Endangered: `var(--amber-sub)` bg, `var(--amber)` border, `var(--amber-t)` text
- Vulnerable: `var(--amber-sub)` bg, `var(--amber)` border, `var(--amber-t)` text
- Near Threatened: `var(--blue-sub)` bg, `var(--blue)` border, `var(--blue-t)` text
- Least Concern: `var(--green-sub)` bg, `var(--green)` border, `var(--green-t)` text

**Mini-map:**
```
width:         100%
height:        120px
border-radius: 12px (--r-md)
overflow:      hidden
background:    var(--elev)   (placeholder while SVG loads)
object-fit:    cover
margin-bottom: 16px
```

The mini-map is a static SVG region thumbnail — a simplified world or regional map with
the animal's native region highlighted. This is a static image asset, not an interactive
map. The asset path pattern is `/assets/maps/{region-slug}.svg`. If no asset exists,
the placeholder container shows a `Globe` Lucide icon (size 32, `var(--t4)`) centred on
`var(--elev)`.

**Section headings inside the sheet:** Hairline style — `11px / 700, uppercase, letter-spacing
1.5px, var(--t3)`, `margin-bottom: 8px`.

**Divider rule between sections:**
```
border-top: 1px solid var(--border-s)
margin: 16px 0
```

**Mission row anatomy:**
```
display:      flex
align-items:  flex-start
gap:          10px
padding:      8px 0
border-bottom: 1px solid var(--border-s)  (last row: no border)
```

Completion icon: `CheckCircle` (size 18, `var(--green-t)`) when complete; `Circle` (size 18,
`var(--t4)`) when incomplete. `shrink-0`, aligned to first line of text.
Mission label: `14px / 400, var(--t2)`, flex-1.
Example label: `"Complete 3 Word Safari sessions with any card (2/3)"`.

**Progress bar:** Same specification as §1.6.

**Begin Mission / Continue / Claim button:**
```
variant:   accent (pink)
size:      lg (48px)
width:     100% (w-full)
margin-top: 20px
```

**Interaction states — Begin Mission button:**
| State | Treatment |
|-------|-----------|
| Default | `var(--pink)` bg, white text |
| Hover | `var(--pink-h)` bg, `box-shadow: var(--glow-pink)`, 300ms |
| Pressed | `scale(.97)`, 100ms |
| Focus-visible | `outline: 2px solid var(--blue); outline-offset: 2px` |
| Disabled | `opacity: .4`, `pointer-events: none`, shown only when all missions already in progress and cannot be started again |
| Loading / busy | Button shows `Loader2` spinner (size 16), text hidden, `pointer-events: none` |

**Interaction states — close button (X):**
```
size:        32px (w-8 h-8)
background:  var(--elev)
color:       var(--t3)
border-radius: 50%
```
| State | Treatment |
|-------|-----------|
| Default | `var(--elev)` bg, `var(--t3)` icon |
| Hover | `var(--border)` bg, `var(--t1)` icon, 150ms |
| Pressed | `scale(.95)` |
| Focus-visible | `outline: 2px solid var(--blue); outline-offset: 2px` |

**BottomSheet max height:** `85vh`. Content is scrollable if taller than the sheet.
`overflow-y: auto` on the inner scroll container.

**Sheet padding:** `px-6 pt-4 pb-8` on the inner content container. Drag handle sits
above `pt-4` via its own margin.

**Accessibility:**
- Sheet is focusable: first focus on "Begin Mission" (or equivalent CTA) when sheet opens
- Close button has `aria-label="Close mission brief"`
- Conservation badge has `aria-label="Conservation status: [value]"`
- Progress bar: `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax`

---

### 2.3 Mission progress toast

**Trigger:** Harry completes a qualifying game session (e.g. Word Safari, geography
questions). The hook that records session completion fires this toast.

**Toast type:** Info (blue)
**Auto-dismiss:** 5 seconds
**Message format:** `"Mission progress: 2 of 3 sessions complete for [Animal Name] rescue!"`

No emojis. Lucide `Leaf` icon (size 16) in the toast icon circle.

---

### 2.4 Mission complete — celebration overlay

**Trigger:** All missions for a given rescue are marked complete. Overlay fires
immediately after the final session completes.

**Pattern:** Same as card adoption celebration. `createPortal(content, document.body)`.
Full-viewport fixed overlay, z-index 9999.

**Surface:**
```
background:   linear-gradient(135deg, #E8247C, #3772FF)  (--grad-hero)
opacity:      0 → 1, 400ms
```

**Content (centred, vertically and horizontally):**
```
[Animal image — 120×120, rounded-xl]
[Animal name — 28px / 700, var(--t1)]
["Rescued!" — 14px / 600, uppercase, letter-spacing 2px, var(--t1) at 80% opacity]
["[Animal Name] is now in your care" — 16px / 400, var(--t1) at 80% opacity]
[Confetti burst — particle animation, 1.5s]
["View in My Animals" — outline button, 44px]
["Continue" — ghost button, 44px, dismisses overlay]
```

**Particle / confetti:**
Initial state: `scale: 1, opacity: 1, x: 0, y: 0`. Animate `x`, `y`, `rotate`, `opacity`
outward from centre. Never `initial={{ scale: 0 }}` on burst particles (see CLAUDE.md
Framer Motion rule §3).

**Animation entrance:** Overlay scales from `scale: 0.95, opacity: 0` to `scale: 1, opacity: 1`.
Spring: `{ type: "spring", stiffness: 300, damping: 30 }`.

**Interaction states — "View in My Animals":**
| State | Treatment |
|-------|-----------|
| Default | Outline: `1.5px solid rgba(255,255,255,.4)`, white text |
| Hover | Border opacity → 100%, `rgba(255,255,255,.06)` bg |
| Pressed | `scale(.97)` |
| Focus-visible | `outline: 2px solid var(--blue); outline-offset: 2px` |

---

### 2.5 Rescued card status in My Animals

When a card has `status: 'rescued'`, its appearance in `MyAnimalsScreen` and
`PetDetailSheet` changes. Three card statuses are in scope:

| Status | Description |
|--------|-------------|
| `active` | Owned normally |
| `rescued` | Temporarily homed — came from a rescue mission |
| `for_sale` | Listed in the marketplace (tradeable cards only) |

#### PetCard (in the My Animals grid)

PetCard gains a secondary badge below the existing rarity badge.

**"In your care" badge (status: rescued):**
```
background:   var(--green-sub)
border:       1px solid var(--green)
color:        var(--green-t)
font:         11px / 600, uppercase, letter-spacing 0.5px
padding:      2px 8px
border-radius: var(--r-pill)
```

This is a tint-pair badge. Never solid `var(--green)` background with white text.

The badge appears below the rarity badge in the top-right corner of the card. If the
card already shows a tier badge, the "In your care" badge stacks below it. The stacking
order (top to bottom): rarity → tier → status. Max two badges shown in the corner stack;
if three would appear, suppress the tier badge to avoid overflow.

#### PetDetailSheet (when status is rescued)

The sheet header row (matching the `PetDetailSheet.tsx` pattern exactly):
```
[Animal image 80×80]  [Name]           [Rarity badge]
                      [Green "In your care" badge]
                      [Habitat / category]
```

Below the stat grid, a new **Homing Status block** appears. This sits between the stat
grid and the action buttons.

**Homing Status block:**

```
Surface:     var(--elev) background, border-radius: 12px (--r-md), padding: 16px
```

Layout inside the block:

```
┌──────────────────────────────────────────────┐
│  [Leaf icon — 20px, var(--green-t)]          │
│  Homing until ready for release              │  ← 14px / 600, var(--t1)
│                                              │
│  Care progress                               │  ← 11px / 700 hairline, var(--t3)
│  [Progress bar — green fill]                 │
│  "12 days until release ready"               │  ← 13px / 400, var(--t2)
└──────────────────────────────────────────────┘
```

**Progress bar (homing):**
```
height:        4px
border-radius: 9999px
track:         var(--card)
fill:          var(--green)
transition:    width 300ms ease
```

**"X days until release ready":** `13px / 400, var(--t2)`. When the count reaches 0,
this line reads `"Ready for release"` in `var(--green-t)`.

**Action buttons — state: still homing (not ready):**

The existing `active` action buttons (List for Sale, Release) are replaced:
```
[Keep caring for [Name] — outline button, full-width, disabled state (not yet relevant)]
```
No release button until ready. "List for Sale" is not available for rescued cards — this
must be enforced: rescued cards are not tradeable via the marketplace.

**Action buttons — state: release ready:**
```
[Release to wild — accent (pink) button, full-width, 48px]
[Keep caring for [Name] — outline button, full-width, 44px]
```

**Interaction states — "Release to wild":**
| State | Treatment |
|-------|-----------|
| Default | `var(--pink)` bg, white text |
| Hover | `var(--pink-h)` bg, `box-shadow: var(--glow-pink)`, 300ms |
| Pressed | `scale(.97)` |
| Focus-visible | `outline: 2px solid var(--blue); outline-offset: 2px` |
| Loading | `Loader2` spinner, `pointer-events: none` |

**Interaction states — "Keep caring for [Name]":**
| State | Treatment |
|-------|-----------|
| Default | Outline: `1.5px solid var(--border)`, `var(--t1)` text |
| Hover | `rgba(255,255,255,.03)` bg, border → `var(--t3)`, 300ms |
| Pressed | `scale(.97)` |
| Focus-visible | `outline: 2px solid var(--blue); outline-offset: 2px` |

---

### 2.6 Release to wild: confirmation and reward

**Trigger:** Tapping "Release to wild" in PetDetailSheet.

**Confirmation:** A modal (not a BottomSheet — this is a destructive action requiring a
focused confirmation, not a detail view). Rendered via `createPortal(content, document.body)`.

**Modal anatomy:**
```
max-width:    420px
padding:      28px
surface:      rgba(13,13,17,.88) + backdrop-filter: blur(24px) + 1px solid rgba(255,255,255,.06)
border-radius: 16px (--r-lg)
```

Content:
```
[Animal image — 64×64, rounded-xl, centred or left-aligned in header row]
"Release [Name] to the wild?"           ← 18px / 700, var(--t1)
"[Name] will leave your care. You'll earn bonus XP and a Conservation Hero badge moment
as a thank you for your care."          ← 14px / 400, var(--t2), mt-2

[Release — accent (pink) button, full-width, 44px, mt-6]
[Cancel — outline button, full-width, 44px, mt-2]
```

**On confirm:** Card is removed from Harry's collection. Celebration moment fires:
- Info toast: `"[Name] has been released! You earned 50 XP."` (green, 5s)
- Badge moment: `"Conservation Hero"` badge unlocked. Badge uses purple tint-pair: `var(--purple-sub)` bg,
  `1px solid var(--purple)` border, `var(--purple-t)` text. The badge moment follows the
  existing badge notification pattern in the app.

**On "Keep caring for [Name]":** Modal dismisses. The release timer resets. A toast fires:
- `"Great choice! [Name]'s care timer has been reset."` — info (blue), 3s

**Interaction states — "Release" (confirm) button:**
| State | Treatment |
|-------|-----------|
| Default | `var(--pink)` bg, white text |
| Hover | `var(--pink-h)` bg, `box-shadow: var(--glow-pink)`, 300ms |
| Pressed | `scale(.97)` |
| Focus-visible | `outline: 2px solid var(--blue); outline-offset: 2px` |
| Loading | `Loader2` spinner, label hidden, `pointer-events: none` |

**Interaction states — "Cancel" button:**
| State | Treatment |
|-------|-----------|
| Default | Outline: `1.5px solid var(--border)`, `var(--t1)` text |
| Hover | `rgba(255,255,255,.03)` bg, border → `var(--t3)`, 300ms |
| Pressed | `scale(.97)` |
| Focus-visible | `outline: 2px solid var(--blue); outline-offset: 2px` |

---

### 2.7 Edge cases and failure states

| Scenario | Design treatment |
|----------|-----------------|
| Session completes but no active mission | No toast fires. Silent. |
| Harry closes the app mid-mission | Progress persists in DB. Mission Brief Sheet shows updated progress on reopen. |
| Two missions active simultaneously | Each shows independent progress in the Rewards tab. Both fire separate toasts. |
| Harry attempts to list a rescued card | "List for Sale" is not shown for rescued cards. If accessed programmatically, an error toast fires: `"Rescued animals cannot be listed for sale while in your care."` |
| Release timer reaches 0 while My Animals is open | Live query updates the PetDetailSheet in place — "Keep caring" button becomes secondary, "Release to wild" appears without requiring a screen reload. |
| Network / DB error on "Begin Mission" | Error toast: `"Could not start the mission — please try again."` (red, persistent). |
| Network / DB error on "Claim Rescue" | Error toast: `"Could not claim [Name] — please try again."` (red, persistent). |
| Network / DB error on "Release to wild" | Error toast: `"Could not release [Name] — please try again."` (red, persistent). |

---

### 2.8 Accessibility requirements

- All interactive elements meet 44px minimum touch target.
- BottomSheet traps focus when open; focus returns to the triggering element on close
  (WCAG 2.1 AA, Success Criterion 2.4.3).
- Confirmation modal traps focus. Focus opens on the "Release" button (the primary
  destructive action). Cancel is the second focusable element.
- Progress bars use `role="progressbar"` with `aria-valuenow`, `aria-valuemin="0"`,
  `aria-valuemax`.
- Celebration overlay is announced via `role="alertdialog"` with `aria-live="assertive"`.
- All Lucide icons are `aria-hidden="true"` unless they are the sole content of a
  button — in that case, the button carries `aria-label`.
- No colour alone communicates state — the mission completion indicator uses both icon
  shape (CheckCircle vs Circle) and colour.
- DM Sans font is used throughout. No system fallback fonts should be visible in the
  game context.

---

### 2.9 Responsive layout notes

**iPad portrait (1024px):** The Rewards card grid renders 2 columns within `max-w-3xl`.
The Mission Brief Sheet is constrained to `max-w-lg` on tablet (centered, not full-width)
or full-width on phone — to be confirmed by FE during Phase C.

**Phone (375px):** Grid is 1 column. BottomSheet is full-width. All buttons remain full-width.

**FE must verify at 375px, 768px, and 1024px before marking Phase C complete.**

---

## Checklist for Phase C readiness (UX sign-off items)

Before the Developer and Frontend Engineer begin Phase C, verify all of the following:

- [ ] [OWNER] has approved Phase B (refined-stories.md must exist in product/store-rewards/)
- [ ] `store-rewards` written to `.claude/current-feature`
- [ ] Mission card anatomy is fully specified (done — §1.6)
- [ ] All interactive elements have interaction states defined (done — §1.3, §1.6, §1.7, §2.2, §2.5, §2.6)
- [ ] All overlay surfaces state the glass rule applies (done — §2.2, §2.6)
- [ ] PageHeader slot assignment declared (done — §1.2)
- [ ] Navigation ownership declared — no dual tab controls (done — §1.2)
- [ ] Filter pill style references CategoryPills pattern by name (done — §1.3)
- [ ] Filter row layout declared as single row, no sort control (done — §1.5)
- [ ] Content top padding class string stated explicitly (done — §1.4)
- [ ] Consistency check against existing components completed (done — §1.8)
- [ ] BottomSheet image pattern follows PetDetailSheet header row (done — §2.2)
- [ ] Rescued card badge uses tint-pair, not solid fill (done — §2.5)
- [ ] All portal requirements stated for overlays (done — §2.2, §2.4, §2.6)
- [ ] Edge cases documented (done — §2.7)
- [ ] Accessibility requirements stated (done — §2.8)
