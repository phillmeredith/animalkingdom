# Interaction Spec — schleich-collection-tracker

**Feature:** Schleich Collection Tracker
**Phase:** A (UX)
**Date:** 2026-03-28
**Status:** Ready for Phase B (PO)

---

## 1. Overview

### Feature purpose

Harry collects Schleich animal figurines in real life. This feature gives him a place inside the app to browse all 566 Schleich figurines and mark which ones he actually owns. It has no connection to the digital animal collection or coins — it is a real-world inventory tracker.

### Primary user

Harry — child, ADHD and autism accommodations apply (instant feedback, no timers, predictable structure, high colour contrast, generous touch targets).

### Success criteria

- Harry can browse all 566 figurines, filtered by category and searched by name
- Harry can mark a figurine as owned with a single deliberate tap (via the detail sheet)
- Harry can see his full owned collection in a dedicated tab
- Harry can tell at a glance which cards in the All tab he already owns
- The screen loads and filters instantly — no spinner visible for the initial catalogue render

---

## 2. Nav integration

### Nav slot

The Schleich screen is added as a sixth tab in `BottomNav`. The current nav has 5 tabs (Home, Explore, My Animals, Play, Store). Adding a sixth tab is a structural change — see the layout note below.

**Route:** `/schleich`

**Icon:** Lucide `Package` — represents a physical product collection. Stroke-width 2, size 22px (matching all other tab icons).

**Label:** `Collection` — short enough to sit on one line at the existing `text-[10px] font-600` nav label style.

### Six-tab layout note

The current nav uses `flex-1` on each tab inside a fixed-height `h-[68px]` container. A sixth tab reduces each tab's minimum width from ~68px to ~57px on a 375px screen, and to ~171px on a 1024px screen. The icon and label still fit — the `flex flex-col items-center gap-0.5` layout does not break. FE must verify at 375px that no label truncates. If any label truncates, shorten it (this spec authorises shortening `My Animals` to `Animals` if needed — matching the route `/animals` which already implies this).

**No badge dot** on the Schleich tab. There is no notification-worthy event to surface here.

---

## 3. Key design decisions (rationale)

### 3.1 Scroll strategy — virtual scroll

566 items rendered as DOM nodes in a single pass is acceptable on modern devices but causes measurable jank on older iPads when the filter changes and the entire list re-renders. Decision: **no pagination, no load-more — use a windowed virtual list** (react-window or equivalent). The full catalogue is available instantly in memory; only the visible rows are in the DOM.

Rationale: Harry will filter to "Horses" (198 items) or "All" (566 items) repeatedly. Re-rendering 566 cards on each filter change without virtualisation produces visible layout jank. Pagination breaks the mental model of a catalogue — Harry wants to scroll, not click "Load more". Virtual scroll gives him the full catalogue feel without the DOM penalty.

FE note: use `react-window FixedSizeGrid` or `FixedSizeList` depending on whether the grid or list layout is chosen (see section 5 for grid spec). The grid uses `FixedSizeGrid` with a calculated column count and row height.

### 3.2 Default category filter

Default: **Horses** — not All.

Rationale: horses have 198 of 566 items (35%) and are Harry's primary interest. Opening to All produces a 566-item grid that requires more scrolling before he finds what he cares about most. Opening to Horses puts his primary interest one tap away from any other category, with zero extra steps. The "All" pill is always visible in the filter row so switching is trivial.

### 3.3 Ownership toggle — detail sheet only, not card tap

Ownership is toggled **only from the detail sheet**, not by tapping the card directly.

Rationale: a direct card tap-to-toggle would cause accidental ownership changes as Harry scrolls and browses. 566 cards is a large grid; misfire probability is high. The detail sheet is a deliberate, two-step interaction: (1) tap card to open sheet, (2) tap the toggle button to change ownership. This matches the deliberate interaction model used throughout the app for state-changing actions (adopting a pet, buying a card pack). No confirmation modal is needed — the toggle is immediately reversible and undoing it requires only tapping the same button again.

Card tap opens the detail sheet. It does not toggle ownership.

### 3.4 Description display

Show the full description text in the detail sheet, **truncated to 3 lines with an expand control**.

Rationale: Schleich descriptions are marketing copy ranging from ~400 to ~1000 characters. Showing all of it by default pushes the ownership toggle (the primary action) far off screen and buries it. Harry is a child — long marketing text is low value. Three lines gives enough flavour; the expand control is available for curious moments. The ownership toggle is always visible above the description fold.

### 3.5 Image source

The JSON contains two image references:

- `image` — relative path e.g. `images/groom-with-icelandic-pony-mare-41431-2.jpg`
- `image_url` — Shopify CDN URL e.g. `https://cdn.shopify.com/...`

Use `image_url` (the Shopify CDN URL) as the primary image source. These are production URLs, already optimised, and do not require the app to bundle or serve image assets locally. The `/schleich/images/` directory exists on disk but FE should not import from it — the CDN URLs load faster and do not bloat the bundle.

Fallback: if `image_url` fails to load, fall back to the DS `AnimalImage` fallback pattern — `var(--elev)` background with a centred Lucide `Package` icon at 48px, colour `var(--t4)`.

---

## 4. Data model

The Schleich data lives in `/schleich/schleich_animals.json`. FE imports this at build time as a static JSON module. No API call, no loading state for the catalogue itself.

Each record has these fields:

```
name:        string — display name (e.g. "Pura Raza Española Mare")
description: string — marketing copy, 400–1000 chars
image:       string — relative path (e.g. "images/haflinger-foal-13951.jpg") — DO NOT USE
image_url:   string — Shopify CDN URL — use this
category:    string — one of five values (see section 6)
url:         string — product page URL (not displayed in UI, not needed)
```

There is no `id` field in the raw JSON. FE must derive a stable `id` for each record. Use the `image` filename without extension as the id (e.g. `"haflinger-foal-13951"`). This is stable, unique, and matches the URL slug pattern.

### Ownership persistence

Owned state is stored in Dexie (IndexedDB), not in memory. A new Dexie table `schleichOwned` stores owned figurine IDs:

```
Table: schleichOwned
Schema: id (string, primary key)
```

A figurine is owned if its derived `id` exists as a row in this table. Toggling adds or removes the row.

FE note: ownership reads via `useLiveQuery(() => db.schleichOwned.toArray())` so the grid updates reactively when ownership changes.

---

## 5. Screen layout — All tab (primary browse view)

### PageHeader

```
title slot (left):   "Schleich"
centre slot:         Tab switcher — "All" | "My Collection"
                     (segmented control per DS Tabs section)
trailing slot:       CoinDisplay — shows Harry's coin balance
                     (consistent with all other screens; provides location context)
below slot:          Row 1 — SearchBar (full width)
                     Row 2 — Category filter pills (full width, scrollable)
```

The `below` slot uses the existing `flex flex-col gap-3 pb-4` layout from `PageHeader`. No changes to `PageHeader` are required.

### Tab switcher (centre slot)

Segmented control with two tabs: `All` and `My Collection`.

```
Component:   DS Tabs / Segmented Control pattern
Display:     inline-flex (compact, sized to content — must NOT be full-width)
Container:   background var(--card); border 1px solid var(--border-s); radius 100px; padding 4px; gap 2px
Tab item:    padding 8px 16px; radius 100px; font 13px/500; colour var(--t3)
Active tab:  background var(--elev); colour var(--t1)
Hover tab:   colour var(--t2)
Transition:  all 200ms
```

Tab state lives in `SchleichScreen`. Neither the All content nor the Collection content renders its own copy of this control. Navigation ownership is singular — the `centre` slot is the only place this control exists.

### Category filter pills (below slot, row 2)

A single horizontally scrollable row of pills. No secondary group on the right (unlike ExploreScreen's rarity pills). The row contains only category pills.

```
Row wrapper:    flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-6 px-6
                (bleed to screen edges, matching ExploreScreen CategoryPills pattern)
```

Pills use the `CategoryPills` anatomy exactly:

```
height:        h-9 (36px)
padding:       px-4
border-radius: rounded-[var(--r-pill)]
font:          13px / 600
whitespace:    whitespace-nowrap
shrink:        shrink-0
transition:    transition-colors duration-150
```

Active state (tint-pair — see CategoryPills.tsx reference):
```
bg-[var(--blue-sub)] border border-[var(--blue)] text-[var(--blue-t)]
```

Inactive state:
```
bg-[var(--card)] border border-[var(--border-s)] text-[var(--t2)]
```

Solid fill (`bg-[var(--blue)]`) is prohibited on these pills. Cross-reference: `src/components/explore/CategoryPills.tsx`.

### Content container (below PageHeader)

Full class string:

```
px-6 pt-4 pb-24 max-w-3xl mx-auto w-full
```

`pt-4` (16px) is mandatory — provides visible breathing room between the sticky glass border-bottom of PageHeader and the first content element. FE must not omit or increase this value independently.

### Content grid

```
375px (phone):    grid-cols-2, gap-3 (12px)
768px (iPad portrait):  grid-cols-3, gap-4 (16px)
1024px (iPad landscape): grid-cols-4, gap-4 (16px)
```

Tailwind class string: `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4`

The grid is virtualised (see section 3.1). FE uses `react-window FixedSizeGrid`. Column count and item height are derived from viewport width at runtime.

**Calculated item height:** The card has an image (square aspect ratio, full width) plus a name strip (approximately 48px at the smallest breakpoint). FE calculates exact item height based on the column width derived from `(containerWidth - (columnCount - 1) * gap) / columnCount`. Image height = column width (1:1 aspect ratio). Total item height = image height + name strip height + card padding.

---

## 6. Card anatomy (All tab)

Each grid cell is a `SchleichCard` component.

```
Surface:      var(--card) (#18181D)
Border:       1px solid var(--border-s) at rest
              1px solid var(--border) on hover
Radius:       var(--r-lg) (16px)
Padding:      0 (image flush to card edges top/left/right)
              Name strip: 10px horizontal, 8px vertical
Shadow:       none at rest
Overflow:     hidden (so image fills to rounded corners)
```

### Image area

```
Aspect ratio: 1:1 (square)
Width:        100% of card
Object-fit:   contain (NOT cover — Schleich product images have transparent/white
              backgrounds; cover would crop the figurine)
Background:   var(--elev) — fills the letterbox space around the figurine
Radius:       inherited from card (top corners rounded, bottom corners 0 inside the card)
```

Why `contain` not `cover`: Schleich images are product photography on white/transparent backgrounds. `cover` would zoom into the background rather than showing the figurine. `contain` keeps the figurine fully visible with the `var(--elev)` background filling the surrounding space.

### Name strip (below image)

```
Padding:      8px 10px
Font:         12px / 600 / var(--t1)
Line clamp:   1 line (single-line truncation with ellipsis)
              Full name is visible in the detail sheet
```

### Owned indicator (All tab)

When a figurine is owned, display a checkmark badge overlaid on the top-right corner of the image.

```
Position:     absolute top-8px right-8px
              (8px from top-right corner, inside the image area)
Size:         24px × 24px
Shape:        circle (border-radius 100%)
Background:   var(--green) (#45B26B)
Icon:         Lucide Check, size 14px, stroke-width 2.5, colour #fff
Border:       2px solid var(--card) (creates separation from the image background)
```

This badge is rendered only when the figurine's id is in the owned set. It does not render for unowned figurines.

### Category badge

A small tinted pill on the bottom-left of the image area, overlaid over the image.

```
Position:     absolute bottom-8px left-8px
Padding:      3px 8px
Radius:       100px (pill)
Font:         10px / 600
Background:   category colour sub (see category colour map below)
Text:         category colour text
```

**Category colour map:**

| Raw category key | Display label | Sub bg | Text colour |
|---|---|---|---|
| `horses` | Horses | `var(--amber-sub)` | `var(--amber-t)` |
| `wild-animals-adventure` | Wild | `var(--green-sub)` | `var(--green-t)` |
| `farm-animals-farm-toys` | Farm | `var(--green-sub)` | `var(--green-t)` |
| `monsters-and-dragons` | Dragons | `var(--purple-sub)` | `var(--purple-t)` |
| `dinosaurs-and-volcano` | Dinos | `var(--red-sub)` | `var(--red-t)` |

Why amber for horses: horses are Harry's primary interest; amber matches the "warm/special" semantic in the DS gradient system (`--grad-warm: warm accents`). Wild and Farm share green because both are nature/outdoor categories; the label text distinguishes them. Dragons and Dinos get purple and red respectively — their thematic tone matches those DS colour semantics.

The category badge on the card uses the short display label (Horses, Wild, Farm, Dragons, Dinos). The full display label is used in the filter pills (see section 9).

### Hover and interaction states (card)

```
Hover:   translateY(-2px); shadow: var(--sh-card); border: 1px solid var(--border)
         Tailwind: motion-safe:hover:-translate-y-0.5
                   hover:shadow-[0_4px_24px_rgba(0,0,0,.25)]
                   hover:border-[var(--border)]
Active:  scale(0.97)
         Tailwind: motion-safe:active:scale-[.97]
Transition: transition-all duration-300
Focus:   outline: 2px solid var(--blue); outline-offset: 2px
Disabled: n/a — all cards are tappable
```

FE must verify the lift does not clip. Add `pt-1` to the grid container if lift clips.

**Accessibility on card tile:**

- Implement as `<button>` or with `role="button"` and `tabIndex={0}` if `<div>`
- `aria-label`: `"View {figurine name}"` — or `"View {figurine name}, owned"` when owned

---

## 7. Screen layout — My Collection tab

### When empty (no owned figurines)

Empty state component per DS pattern:

```
Layout:       flex flex-col items-center text-center
Padding:      pt-16 pb-24 px-6
Icon:         Lucide Package, 48px, colour var(--t4), margin-bottom 16px
Title:        "Your collection is empty"
              22px / 600 / var(--t1) / margin-bottom 8px
Description:  "Tap a figurine in All to mark it as owned."
              15px / 400 / var(--t3) / max-width 280px / margin 0 auto
CTA:          Button variant="primary" size="md" label="Browse All"
              margin-top 20px
              onClick: switches the active tab to "All"
```

The CTA switches the tab, not the filter. No navigation change. It simply sets the active tab state to `All`.

### When figurines are owned

Same grid layout as the All tab. Same card anatomy. Same column counts.

**Difference from All tab:** The owned indicator (green checkmark badge) is not shown in the Collection tab. Every card here is already owned — the badge would be redundant. The category badge on the image is retained.

**Filter row:** Category filter pills are present in the Collection tab, operating on the owned subset. The search bar is also present. This allows Harry to filter his owned collection (e.g. "show only my owned Horses").

**Count label:** Below the PageHeader `below` slot, above the grid, show a count:

```
Layout:     px-6 pt-4 (inside the content container, as the first child above the grid)
Text:       "{n} figurines" or "1 figurine"
Font:       13px / 400 / var(--t3)
```

This count reflects the filtered result (after search and category filter), not the total owned count.

The All tab does NOT show a count label — the total (566) is fixed and adding it clutters the header area.

---

## 8. Category filter — pill display labels and behaviour

### Display labels (raw key → pill label)

| Raw category key | Filter pill label |
|---|---|
| `horses` | Horses |
| `wild-animals-adventure` | Wild Animals |
| `farm-animals-farm-toys` | Farm |
| `monsters-and-dragons` | Dragons |
| `dinosaurs-and-volcano` | Dinosaurs |

All five category pills plus an "All" pill are always shown. Order:

`All · Horses · Wild Animals · Farm · Dragons · Dinosaurs`

Horses is listed first (after All) because it is Harry's primary interest and has the most items.

### Default state

On mount: `activeCategory = 'horses'` (not 'All' — see section 3.2 design decision).

When the All tab is first mounted, the Horses filter is pre-selected. The My Collection tab shares the same `activeCategory` state — if Harry switches to My Collection while on Horses, his owned horses are shown. This is intentional: it preserves context between tab switches.

### Toggle behaviour

Tapping the active category pill (other than All) deactivates it and returns to All. Matches the exact toggle pattern in `CategoryPills.tsx`:
```
onClick={() => onSelect(isActive && cat !== ALL ? ALL : cat)}
```

Tapping All when already active: no-op.

### Cross-tab filter sharing

`activeCategory` and `query` (search) are managed in `SchleichScreen` and passed down to both tab views. Switching tabs does not reset the filters. This preserves Harry's browsing context when he switches between All and My Collection.

---

## 9. Search

### Scope

Search matches against **name only**. Description text is not searched.

Rationale: descriptions are long marketing copy, not useful search targets. Harry will search for "horse" or "dragon", not for words in the marketing text. Name-only search is faster to implement and produces cleaner results.

### Behaviour

- Search is case-insensitive
- Partial match (contains, not starts-with): typing "pony" matches "Haflinger Pony", "Icelandic Pony Mare", etc.
- Search combines with the active category filter using AND logic:
  ```
  items
    .filter(i => activeCategory === 'All' || i.category === activeCategory)
    .filter(i => i.name.toLowerCase().includes(query.toLowerCase()))
  ```
- In the My Collection tab, the above logic is additionally filtered to owned items only (applied first, before category and search)

### SearchBar component

Use the existing `SearchBar` component from `src/components/ui/SearchBar.tsx`. Do not implement a new search input.

```
placeholder:  "Search figurines…"
value:        query
onChange:     setQuery
```

### Empty state (no results)

When both filters and search produce zero results:

```
Icon:         Lucide Search, 48px, colour var(--t4)
Title:        "No figurines found"
              17px / 600 / var(--t1)
Description:  "Try a different search or change the filter."
              14px / var(--t2)
Button:       variant="outline" size="md" label="Clear filters"
              onClick: resets query to '' and activeCategory to 'horses'
              (resets to the default state, not to 'All')
```

---

## 10. Detail sheet

Tapping any card (in either tab) opens a `SchleichDetailSheet`. This is a `BottomSheet` overlay.

### Container

```
Component:        SchleichDetailSheet
Wraps:            BottomSheet (src/components/ui/Modal.tsx)
Surface:          rgba(13,13,17,.80) + backdrop-filter: blur(24px)
Border:           1px solid rgba(255,255,255,.06) — top + sides, no bottom
Radius:           16px 16px 0 0 (--r-xl top corners)
Backdrop:         bg-black/10 (never higher per DS glass rule)
Max height:       85vh (BottomSheet default)
Portal:           createPortal(content, document.body) — existing BottomSheet behaviour
                  FE must confirm this is already in place (it is, per Modal.tsx line 201)
```

Inner content container:

```
max-w-2xl mx-auto w-full px-6 pt-2 pb-10
```

`max-w-2xl` (672px) is used rather than `max-w-xl` from the card-collection-detail spec. Schleich images are wider than the card pack images — the slightly wider column better suits product photography. This must be verified at 1024px: the image should not feel uncomfortably wide.

### Drag handle

Rendered by `BottomSheet` — no new implementation. Spec values for reference:
```
width: 40px; height: 4px; background: rgba(255,255,255,.20); radius: 9999px; margin: 8px auto 0
```

### Dismiss behaviour

- Tap backdrop: closes sheet
- Drag handle downward: closes sheet
- No explicit close button required inside the sheet body (existing `BottomSheet` provides one in the optional title header — do NOT pass a `title` prop to BottomSheet here; the drag handle alone is sufficient)

### Section 1 — Hero image

```
Aspect ratio:   4:3 (landscape) — NOT 1:1
                Product photography reads better in landscape; more of the figurine is visible
Object-fit:     contain
Background:     var(--elev) — fills letterbox
Border-radius:  var(--r-lg) (16px)
Width:          100%
Margin-bottom:  16px
```

Use `image_url` (Shopify CDN). Fallback: `var(--elev)` background + centred Lucide `Package` icon, 48px, `var(--t4)`.

`alt` text: `"{figurine name}"` — the name alone is sufficient and accurate.

### Section 2 — Name and category

```
Name:           22px / 600 / var(--t1) / line-height 1.35
                Wrap onto two lines if needed — do NOT truncate in the sheet
Category badge: Tinted pill using category colour map (section 6)
                Padding: 4px 10px; radius 100px; font 12px/600
                Rendered to the right of the name (flex row, gap 8px, align-items flex-start)
                shrink-0 to prevent compression by long name
Margin-top:     0 (directly below the image's 16px margin-bottom)
```

Name and category badge are on the same flex row with `align-items: flex-start` (so badge aligns to the top of a multi-line name).

### Section 3 — Ownership toggle

This is the primary action of the sheet and must appear **above the description**, not below it.

```
Margin-top:     16px
Layout:         Full-width row
```

**Unowned state:**

```
Button:         variant="primary" (--blue background, #fff text)
                size="lg" (48px height, 0 28px padding)
                full-width (w-full)
Icon:           Lucide Plus, size 20px, stroke-width 2, colour #fff
Label:          "I own this"
```

**Owned state:**

```
Button:         variant="outline" (transparent, 1.5px solid --border)
                size="lg"
                full-width
Icon:           Lucide Check, size 20px, stroke-width 2, colour var(--green-t)
Label:          "In my collection"
Text colour:    var(--green-t) (#7DD69B)
```

The ownership toggle is a single button that changes its visual state immediately on tap. No confirmation dialog. No undo toast. The action is immediately reversible — tapping again removes it from the collection.

**Accessibility on toggle:**

- `aria-pressed="true"` when owned, `aria-pressed="false"` when not owned
- `aria-label`: `"Mark as owned"` (unowned) / `"Remove from collection"` (owned)

### Section 4 — Description (truncated)

```
Margin-top:     20px
Separator:      1px solid var(--border-s) above this section, full width, margin-bottom 12px
Text:           13px / 400 / var(--t2) / line-height 1.5
Truncation:     3 lines (CSS line-clamp-3) by default
Expand control: "Read more" link below the truncated text
                12px / 500 / var(--blue-t)
                Tap removes line-clamp and reveals full text
                Control changes to "Show less"
                No animation on expand — instant reveal
```

The separator between the ownership section and the description section provides visual grouping: the toggle is the primary action, the description is supporting context.

### Sheet structure diagram

```
┌─────────────────────────────────────────────────────────────┐
│  BACKDROP  bg-black/10                                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           drag handle (40×4px)                        │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  max-w-2xl mx-auto w-full px-6 pt-2 pb-10       │  │  │
│  │  │                                                  │  │  │
│  │  │  ┌──────────────────────────────────────────┐   │  │  │
│  │  │  │  HERO IMAGE  4:3  contain  r-lg          │   │  │  │
│  │  │  │  (image_url, bg var(--elev))             │   │  │  │
│  │  │  └──────────────────────────────────────────┘   │  │  │
│  │  │                                                  │  │  │
│  │  │  Figurine Name (22px/600/t1)  [Category pill]   │  │  │
│  │  │                                                  │  │  │
│  │  │  ┌──────────────────────────────────────────┐   │  │  │
│  │  │  │  [+ I own this]  OR  [✓ In my collection]│   │  │  │
│  │  │  │  (primary btn)       (outline btn)        │   │  │  │
│  │  │  └──────────────────────────────────────────┘   │  │  │
│  │  │                                                  │  │  │
│  │  │  ───────────────────────────────────────────    │  │  │
│  │  │  "Marketing description text, truncated to      │  │  │
│  │  │   three lines by default..."                    │  │  │
│  │  │  Read more ↓                                    │  │  │
│  │  │                                                  │  │  │
│  │  │  [pb-10 bottom padding]                          │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │                                                         │  │
│  │  BOTTOM SHEET GLASS                                     │  │
│  │  rgba(13,13,17,.80) + blur(24px)                       │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11. Interaction states — all interactive elements

| Element | Hover | Active | Focus | Disabled |
|---|---|---|---|---|
| Category filter pill (inactive) | `border-[var(--border)]` — border steps up one level | `scale(0.97)` via `motion-safe:active:scale-[.97]` | Browser default focus ring | n/a |
| Category filter pill (active) | No visible change | `scale(0.97)` | Browser default focus ring | n/a |
| Schleich card tile | `translateY(-2px)`, `shadow: var(--sh-card)`, `border: var(--border)` — `transition-all duration-300` | `scale(0.97)` | `outline: 2px solid var(--blue); outline-offset: 2px` | n/a |
| SearchBar input | `border: var(--border)` | — | `border: var(--blue); box-shadow: 0 0 0 3px var(--blue-sub)` | n/a |
| Tab switcher pill (inactive) | `colour: var(--t2)` | — | Browser default focus ring | n/a |
| Tab switcher pill (active) | No visible change | — | Browser default focus ring | n/a |
| Ownership toggle (unowned) | `background: var(--blue-h)`, `box-shadow: var(--glow-blue)` | `scale(0.97)` | `outline: 2px solid var(--blue); outline-offset: 2px` | n/a |
| Ownership toggle (owned) | `border-color: var(--t3)`, `background: rgba(255,255,255,.03)` | `scale(0.97)` | `outline: 2px solid var(--blue); outline-offset: 2px` | n/a |
| "Read more" / "Show less" | `colour: var(--blue)` | — | Browser default focus ring | n/a |
| Backdrop (sheet dismiss) | — | — | — | n/a |
| "Browse All" empty state CTA | `background: var(--blue-h)`, `glow-blue` | `scale(0.97)` | `outline: 2px solid var(--blue); outline-offset: 2px` | n/a |

Touch target minimum: 44×44px for all interactive elements. The filter pills are `h-9` (36px) — this is below the 44px WCAG minimum. This is accepted to maintain visual consistency with `CategoryPills` in the same row. The tab switcher pills, card tiles, and ownership toggle all meet the 44px minimum.

---

## 12. Animation spec

All animations must respect `prefers-reduced-motion` via the existing `useReducedMotion` hook. Reduced motion fallback is always instant state change, no movement, no scale.

### Grid entrance (screen mount)

No staggered card entrance animation. Cards appear immediately at full opacity. Rationale: with 566 potential items (or 198 in the Horses default), a staggered entrance would be impractical and distracting. The virtual list renders items as the user scrolls — individual card entrance animations would fire repeatedly during scroll and create visual noise.

### Tab switch (All ↔ My Collection)

```
Behaviour:    Content cross-fades
Duration:     150ms
Easing:       linear (content state change, not an element entering view)
Framer Motion: AnimatePresence mode="wait" wrapping the content area only
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
```

`AnimatePresence mode="wait"` is used here with a single child (the content area) — not wrapping unrelated siblings. The tab switcher control itself is not inside this `AnimatePresence` block.

Reduced motion: skip the fade — content switches instantly.

### Category filter pill state change

```
Behaviour:    Colour transition only (background, border, text colour)
Duration:     150ms
Property:     transition-colors
```

No movement, no scale. Matches `CategoryPills` exactly.

### Detail sheet open/close

```
Open:         Framer Motion spring { type: "spring", stiffness: 300, damping: 30 }
              y: "100%" → 0 (slide up from bottom)
              opacity: does not animate — sheet is opaque throughout the slide
Close:        y: 0 → "100%"
Reduced motion: skip spring — show/hide instantly
```

Handled by the existing `BottomSheet` component. FE must confirm these spring parameters match `{ stiffness: 300, damping: 30 }` — they do (Modal.tsx line 162).

### Ownership toggle state change

```
Behaviour:    Button colour/content cross-fades
Duration:     150ms
Easing:       linear (state change, not entrance)
```

No scale bounce on the button. The action is confirmed; a bounce animation would read as "celebration" which is not appropriate for a simple toggle.

Owned indicator badge on the card (green checkmark):

```
Open:         scale: 0 → 1, opacity: 0 → 1
Duration:     200ms (DS "normal" range)
Easing:       cubic-bezier(0.16, 1, 0.3, 1) (DS ease-out — element entering view)
```

This is the only card-level animation — the checkmark badge "pops" into existence when ownership is set. When ownership is removed, the badge disappears instantly (no exit animation — instant removal feels more natural for "un-checking" something).

Reduced motion: checkmark appears/disappears instantly.

---

## 13. Slot assignments (explicit)

| Control | Slot | Rationale |
|---|---|---|
| Tab switcher "All / My Collection" | `centre` slot of PageHeader | Section switcher — selects which major content area is visible. Must be compact (`display: inline-flex`). Must NOT be full-width. |
| SearchBar | `below` slot of PageHeader, row 1 | Content filter operating on items within the current section |
| Category filter pills | `below` slot of PageHeader, row 2 | Content filter operating on items within the current section |
| Count label ("n figurines") | Inside content container, Collection tab only | Part of the content area, not a header control |

**Navigation ownership statement:** The tab switcher lives exclusively in the `centre` slot of `PageHeader`. The content area (both All and Collection views) receives the active tab value as a prop (or reads shared state). Neither content view renders its own tab switcher. Dual navigation is a build defect.

**No AZRail:** The Explore screen uses a fixed AZRail for alphabetical scrolling. The Schleich screen does not use an AZRail. Schleich figurines are browsed by category and name search, not alphabetically. Adding the AZRail would increase visual complexity and the figurines are not typically known by their first letter.

---

## 14. Filter pill style (canonical reference)

All filter pills in this screen use the CategoryPills tint-pair pattern. Cross-reference: `src/components/explore/CategoryPills.tsx`.

| State | Background | Border | Text |
|---|---|---|---|
| Active | `var(--blue-sub)` | `1px solid var(--blue)` | `var(--blue-t)` |
| Inactive | `var(--card)` | `1px solid var(--border-s)` | `var(--t2)` |

Solid fill (`background: var(--blue); color: white`) is prohibited on filter pills. It is reserved for primary action buttons only.

---

## 15. Content top padding

Content container immediately below the PageHeader:

```
px-6 pt-4 pb-24 max-w-3xl mx-auto w-full
```

`pt-4` (16px) is mandatory. It prevents content sitting flush against the glass border-bottom of PageHeader. FE must not choose a different value. The `pb-24` clears the fixed BottomNav (68px) plus the GradientFade (48px).

---

## 16. iPad layout decisions (explicit)

Primary target: iPad Air 1024×1366 portrait and 1366×1024 landscape.

### Grid columns

| Breakpoint | Columns | Gap |
|---|---|---|
| 375px (phone, `default`) | 2 | 12px (`gap-3`) |
| 768px (iPad portrait, `md:`) | 3 | 16px (`gap-4`) |
| 1024px (iPad landscape, `lg:`) | 4 | 16px (`gap-4`) |

Tailwind: `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4`

At 1024px with 4 columns and a `max-w-3xl` (768px) content container, each card is approximately `(768 - 3×16) / 4 = 180px` wide. This is a comfortable card size for product photography.

### Detail sheet on iPad

The sheet panel spans full viewport width (existing BottomSheet behaviour). The inner content container `max-w-2xl mx-auto` (672px) centres the content. At 1024px, 672px leaves ~176px of sheet glass visible on each side — this is intentional and matches the material treatment across other detail sheets in the app.

### PageHeader on iPad

`max-w-3xl mx-auto` is NOT applied to PageHeader — it spans full width, which is the correct pattern (all PageHeaders in the app span full width). The filter pills row bleeds to screen edges via `-mx-6 px-6` for the same reason.

FE must verify at 1024px:
1. The grid shows 4 columns and cards are not excessively large
2. The detail sheet content is constrained to `max-w-2xl` and centred
3. The tab switcher in the centre slot is compact — it must not appear full-width on any breakpoint
4. Category pills are visible and do not require horizontal scrolling at 1024px (they should all fit without scrolling at this width)
5. No content is cut off at the bottom — `pb-24` provides clearance above the nav

---

## 17. DS compliance notes

Every visual decision in this spec traces to a token in `design-system/DESIGN_SYSTEM.md`.

| Decision | DS token / rule |
|---|---|
| Card surface | `var(--card)` (#18181D) |
| Card border at rest | `1px solid var(--border-s)` (#2C2F3A) |
| Card border on hover | `1px solid var(--border)` (#353945) |
| Card radius | `var(--r-lg)` (16px) |
| Image background (letterbox) | `var(--elev)` (#23262F) |
| Name text | `var(--t1)` (#FCFCFD), 12px/600 |
| Owned badge background | `var(--green)` (#45B26B) — solid, not tint pair, because it is a small icon badge not a text label |
| Owned badge icon | Lucide `Check`, size 14px, stroke-width 2.5 |
| Category badge (Horses) | `var(--amber-sub)` bg + `var(--amber-t)` text |
| Category badge (Wild / Farm) | `var(--green-sub)` bg + `var(--green-t)` text |
| Category badge (Dragons) | `var(--purple-sub)` bg + `var(--purple-t)` text |
| Category badge (Dinos) | `var(--red-sub)` bg + `var(--red-t)` text |
| Filter pills active | `var(--blue-sub)` bg + `1px solid var(--blue)` + `var(--blue-t)` text |
| Filter pills inactive | `var(--card)` bg + `var(--border-s)` border + `var(--t2)` text |
| Tab switcher container | `var(--card)` bg, `var(--border-s)` border, `r-pill` |
| Tab switcher active | `var(--elev)` bg, `var(--t1)` text |
| Tab switcher inactive | transparent, `var(--t3)` text |
| Ownership toggle (unowned) | `variant="primary"` → `var(--blue)` bg, `#fff` text, hover `var(--blue-h)` + `var(--glow-blue)` |
| Ownership toggle (owned) | `variant="outline"` → transparent bg, `var(--border)` border |
| "In my collection" text | `var(--green-t)` (#7DD69B) |
| Description text | `var(--t2)` (#B1B5C4) |
| "Read more" link | `var(--blue-t)` (#6E9BFF) |
| Sheet glass surface | `rgba(13,13,17,.80)` + `backdrop-filter: blur(24px)` + `1px solid rgba(255,255,255,.06)` |
| Sheet backdrop | `bg-black/10` (never higher per DS glass rule) |
| Empty state icon | `var(--t4)` (#52566A) |
| Empty state title | `var(--t1)`, 22px/600 |
| Empty state description | `var(--t3)`, 15px/400 |
| Button minimum height | 44px (DS accessibility baseline) |
| No hardcoded hex values | All colours reference CSS variable tokens |
| No emojis | Lucide icons only throughout |
| No ghost variant | Ownership toggle uses `primary` (unowned) and `outline` (owned); CTA uses `primary` |
| No drop shadows on static elements | Shadows appear only on hover |
| Font | DM Sans (`var(--font)`) throughout |

---

## 18. Consistency check — existing components

| Element | Existing component | Action |
|---|---|---|
| BottomSheet overlay | `src/components/ui/Modal.tsx` → `BottomSheet` | Use as-is. Do not reimplement. createPortal already in place (line 201). |
| SearchBar | `src/components/ui/SearchBar.tsx` | Import and use directly. Do not reimplement. |
| CoinDisplay | `src/components/ui/CoinDisplay.tsx` | Import and use in PageHeader trailing slot. |
| PageHeader | `src/components/layout/PageHeader.tsx` | Use as-is. title + centre + trailing + below props. No changes needed. |
| Empty state layout | DS Empty State pattern (section in DESIGN_SYSTEM.md) | Implement per DS spec. No standalone EmptyState component observed — implement inline. |
| Category pills | Pattern from `src/components/explore/CategoryPills.tsx` | Implement a new `SchleichCategoryPills` component following the exact anatomy. Do not import `CategoryPills` directly (it depends on `AnimalCategory` type and `ALL_CATEGORIES` from the animal data module). |
| Image fallback | `src/components/ui/AnimalImage.tsx` pattern | Use `var(--elev)` background + Lucide `Package` fallback icon. Do not import `AnimalImage` directly — it is built for the digital animal data model. |

---

## 19. New components introduced

| Component | Path | Description |
|---|---|---|
| `SchleichScreen` | `src/screens/SchleichScreen.tsx` | Main screen. Manages tab state, filter state, search state, selected item state. |
| `SchleichCard` | `src/components/schleich/SchleichCard.tsx` | Grid card. Props: `item`, `isOwned`, `onTap`. |
| `SchleichCategoryPills` | `src/components/schleich/SchleichCategoryPills.tsx` | Category filter pills, Schleich category type. |
| `SchleichDetailSheet` | `src/components/schleich/SchleichDetailSheet.tsx` | BottomSheet wrapper. Props: `item`, `isOwned`, `open`, `onClose`, `onToggleOwned`. |
| `useSchleichOwned` | `src/hooks/useSchleichOwned.ts` | Dexie hook. Returns owned id set, `toggleOwned(id)` function. |

---

## 20. Developer handoff notes

1. **Route:** Add `<Route path="/schleich" element={<SchleichScreen />} />` in `AppRouter.tsx`.

2. **BottomNav:** Add a sixth tab entry to the `TABS` array in `BottomNav.tsx`:
   ```
   { to: '/schleich', label: 'Collection', Icon: Package }
   ```
   Import `Package` from `lucide-react`. Verify all six labels fit at 375px.

3. **Dexie schema:** Add `schleichOwned: 'id'` to the Dexie database schema in `src/lib/db.ts`. Increment the schema version number.

4. **Stable IDs:** Derive the figurine `id` from the `image` field:
   ```typescript
   const id = item.image.replace(/^images\//, '').replace(/\.[^.]+$/, '')
   // "images/haflinger-foal-13951.jpg" → "haflinger-foal-13951"
   ```

5. **Virtual grid:** FE must use `react-window` `FixedSizeGrid`. The `columnCount` is determined by breakpoint (2 / 3 / 4). `rowCount = Math.ceil(filteredItems.length / columnCount)`. `columnWidth` and `rowHeight` are calculated from the container width.

6. **image_url vs image:** Use `item.image_url` for the `<img src>`. Do NOT use `item.image`. The relative path does not resolve in the built app without additional configuration.

7. **Filter logic order (My Collection tab):**
   ```
   ownedItems = allItems.filter(i => ownedIds.has(deriveId(i)))
   filtered   = ownedItems
     .filter(i => activeCategory === 'All' || i.category === activeCategory)
     .filter(i => i.name.toLowerCase().includes(query.toLowerCase()))
   ```

8. **No AZRail.** Do not add the AZRail component from ExploreScreen.

9. **Verify at three breakpoints before marking Phase C complete:** 375px, 768px, 1024px. Check: grid column counts match spec, detail sheet content is constrained, tab switcher is compact, no content clipped behind nav.

10. **Ownership toggle accessibility:** `aria-pressed` and `aria-label` are required on the toggle button. See section 10 for values.
