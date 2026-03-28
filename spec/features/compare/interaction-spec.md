# Interaction Spec: Compare

> Feature: Compare
> Author: UX Designer
> Status: Phase A — ready for Phase B (PO)
> Last updated: 2026-03-27

---

## Overview

Compare lets the player place two of their animals side-by-side and see their stats in a
structured table. There are no actions to take on this screen — it is purely informational.
The player picks the two animals to compare, scans the stat rows, and can swap sides or
navigate back to a pet's detail.

Entry point is the PetDetailSheet in My Animals (new "Compare" button). The flow is:
pet detail → pick second pet → comparison screen.

This feature does not affect any game mechanics, coins, or pet state. It is safe to
explore freely. Design accordingly — make it feel like a fun tool, not a stressful decision.

---

## 1. Screen Inventory

| Screen / State | Route / Trigger | Type |
|---|---|---|
| Compare screen | `/compare` (with query params or state) | Full page |
| Pet selector — first pet | Enter via PetDetailSheet "Compare" button | BottomSheet |
| Pet selector — second pet | After first pet selected | BottomSheet (same sheet, second step) |
| Comparison view | Both pets selected | Full page content replaces selector |
| Empty state — fewer than 2 pets | `/compare` with < 2 active pets | Full page empty state |
| Tap pet portrait to view detail | Tap pet name/image in compare header | Navigates to `/animals`, opens PetDetailSheet |

---

## 2. User Flows

### Flow 1 — Enter from PetDetailSheet and compare

1. Player is on My Animals (`/animals`). They tap a pet. PetDetailSheet opens.
2. Player taps "Compare" button (new, in the footer action row alongside Rename, Release,
   List for Sale).
3. The Compare screen is initiated. The tapped pet is pre-selected as the left-side animal.
4. A Pet Selector sheet opens immediately, prompting the player to pick the right-side animal.
   Heading: "Pick a second animal to compare."
5. The already-selected pet is excluded from the list. All other active pets (status: active
   or listed) are shown in a scrollable single-column list.
6. Player taps a second pet. Selector sheet closes.
7. Compare screen renders with both pets. Player sees a two-column table of stats.
8. Player scrolls down to see all stat rows.
9. Player taps "Done" in the page header to go back to My Animals.

### Flow 2 — Swap sides

1. Player is on the Compare screen.
2. Player taps the "Swap" button (between the two pet column headers, or in the page header).
3. Left and right pets exchange positions instantly (no animation unless motion is allowed —
   in that case a 200ms horizontal translate swap is acceptable).
4. Stat win indicators update immediately to reflect the new left/right arrangement.

### Flow 3 — Navigate to a pet's detail from Compare

1. Player is on the Compare screen.
2. Player taps the left or right pet portrait / name in the header.
3. App navigates to `/animals` with that pet's detail sheet open.
4. Player is back in My Animals viewing the full pet detail.
5. No back-navigation is needed from the pet detail to Compare — this is a dead-end
   navigation. The player uses the bottom nav to return.

---

## 3. Component Inventory

### CompareScreen (new screen)

- Route: `/compare`
- Purpose: Hosts the two-column stat comparison. Entry data passed via React Router state
  or query params (`leftPetId`, `rightPetId`).
- Props: none (reads from router state and `useSavedNames`)
- On mount: if fewer than 2 active pets exist, renders CompareEmptyState.
- If `leftPetId` provided but `rightPetId` missing (direct URL entry): opens PetSelectorSheet
  immediately to pick second pet.
- Layout: `max-w-3xl mx-auto w-full`, `px-0`, `pb-24`. The comparison table extends to
  full content-column width.

### CompareHeader (new component)

- Purpose: Fixed sub-header within the Compare screen (not the global PageHeader).
  Shows both pets side-by-side with their names and a Swap button between them.
- Props: `leftPet: SavedName`, `rightPet: SavedName`, `onSwap: () => void`,
  `onTapLeft: () => void`, `onTapRight: () => void`
- Layout: full-width sticky row, `--card` bg, `border-bottom: 1px solid --border-s`,
  `padding: 16px 24px`.

```
┌─────────────────────────────────────────────────────┐
│  [Pet A image]   Pet A name     [swap]  Pet B name  [Pet B image]  │
│  [Rarity badge]               ArrowLeftRight  [Rarity badge]       │
└─────────────────────────────────────────────────────┘
```

- Pet portrait: 56×56px, `r-md`, tappable (calls `onTapLeft`/`onTapRight`). Tap navigates
  to pet detail.
- Pet name: `15px/600, --t1`, truncated at 12 characters with ellipsis.
- Rarity badge: existing `RarityBadge` component.
- Swap button: centred between the two columns. `variant="outline"`, `size="sm"`,
  icon only (`ArrowLeftRight`, 20px). Touch target: 44×44px explicit `min-h/min-w`.
  `aria-label="Swap animals"`.
- Left column: flex-start. Right column: flex-end. Centre: swap button, fixed width 48px.
- Sticky: `position: sticky; top: 0; z-index: 10` within the scrollable page.

### StatTable (new component)

- Purpose: The main comparison content — a list of stat rows.
- Props: `leftPet: SavedName`, `rightPet: SavedName`
- Layout: full-width within content column. No outer card wrapper — stat rows are
  individually delineated by `1px solid --border-s` dividers.
- First row has no top border. Last row has no bottom border.

**Stat rows to include (in this order):**
1. Speed
2. Strength
3. Agility
4. Care score
5. Rarity (display only — no winner)
6. Age
7. Personality (display only — no winner, traits are not comparable)
8. Category (display only — no winner)

**StatRow component (within StatTable):**

- Props: `label: string`, `leftValue: string | number`, `rightValue: string | number`,
  `comparable: boolean` (false for rarity, personality, category)
- Layout:
  ```
  [Left value]    [Label]    [Right value]
  ```
  Three columns: left (flex-end), centre (flex-center), right (flex-start).
  Label column: fixed ~100px, centred.

- Winner indicator: when `comparable === true` and values are numeric:
  - Higher value = winner. That cell gets: value colour `--green-t`, background
    `--green-sub` (subtle tint on the cell), no other treatment.
  - Lower value = loser. Value colour `--t3`.
  - Equal value = tied. Both use `--t2`. A small "TIED" badge (green tint pair) appears
    between both values in the label column, replacing the label momentarily.
  - Note: "tied" badge replaces the label text only when tied. Otherwise, label is always
    visible.
- When `comparable === false`: both values use `--t2`. No winner treatment.
- Row height: minimum 52px (comfortable touch area even though rows are not tappable).
- Label: `11px/700, uppercase, letter-spacing 1.5px, --t3` (hairline style).
- Value: `15px/600` — winner `--green-t`, loser `--t3`, equal `--t2`, display-only `--t2`.
- Cell padding: `14px 16px`.
- Alternating rows: even rows have `rgba(255,255,255,.015)` bg tint (very subtle banding).
  This is within the anti-pattern rules — it is not a hardcoded hex, it is an inline
  opacity value matching the DS row-hover pattern.

### PetSelectorSheet (new component)

- Purpose: Picker for selecting one pet from the player's collection.
- Props: `isOpen: boolean`, `onClose: () => void`, `onSelect: (pet: SavedName) => void`,
  `excludeId: number | null` (pre-selected pet, excluded from list),
  `heading: string` (e.g. "Pick a second animal to compare")
- Uses existing `BottomSheet` component.
- Layout within sheet: heading (`H4`), then a scrollable single-column list of
  `PetSelectorRow` items.

### PetSelectorRow (new sub-component)

- Purpose: A single selectable pet row within PetSelectorSheet.
- Props: `pet: SavedName`, `onSelect: () => void`
- Layout: `--elev` bg, `r-md`, `border-s`, padding `12px`, flex row.
  - Animal image: 48×48px, `r-md`
  - Pet name: `14px/600, --t1`
  - Animal type + breed: `12px/400, --t3`
  - RarityBadge: right-aligned
- Tap: `scale(0.97)`, calls `onSelect`. No selected state needed (selection immediately
  advances the flow).
- Min height: 72px (image + padding), which exceeds 44px — fine.

### CompareEmptyState (new component)

- Purpose: Shown when the player has fewer than 2 active pets.
- Uses DS empty state pattern.
- Icon: Lucide `GitCompare`, 48px, `--t4`
- Title: "You need two animals to compare"
- Description: "Adopt more animals from the Marketplace to start comparing!"
- CTA button: "Go to Marketplace" — `variant="primary"` (blue), `size="md"` — navigates to
  `/marketplace`

### PetDetailSheet updates (existing component — additive change only)

- Add "Compare" button to the footer action row.
- Condition: only show if there is at least one other active pet in the collection
  (`pets.length > 1`). If player has only one pet, hide the Compare button — do not
  show it disabled (confusing for a child). Instead, hide it silently.
- Button variant: `variant="primary"` (blue — this is a utility/navigation action)
- Position: added to footer row. With four possible buttons (Rename, Release, List for
  Sale, Compare) the row needs to handle wrapping on narrow screens.
  - Recommended layout: wrap into two rows of two on 375px. Rename + Compare on row 1,
    List for Sale + Release on row 2. Release stays grouped with List for Sale since both
    relate to "removing" the pet from active collection.
  - On 768px+: flex-row with flex-1 on each, max 4 buttons side by side at the sizes
    involved (sm buttons, not lg).
  - Note to FE: this layout decision must be explicitly tested at 375px in Phase C
    self-review. Do not assume flex-wrap handles it attractively without checking.

---

## 4. State Inventory

| State | Trigger | UI treatment |
|---|---|---|
| Entry — first pet preselected | Navigate from PetDetailSheet | PetSelectorSheet opens immediately, left pet shown in sheet header |
| Entry — direct URL, no pets selected | Navigate to `/compare` directly | PetSelectorSheet opens, no pre-selection |
| Fewer than 2 active pets | Collection has 0 or 1 active pet | CompareEmptyState fullscreen |
| Exactly 2 pets in collection | All pets are active but only 2 | PetSelectorSheet shows only 1 row (the other is excluded); or if pet B is already known, auto-select and skip sheet |
| Selector open — first pick | No second pet chosen | Sheet shows full list, excluded pet not visible |
| Selector loading | `useSavedNames` hook loading | Sheet shows 3 skeleton rows |
| Selector empty (all excluded) | Impossible if < 2 guard is working | Should never render; defensive: show "No animals available" text row |
| Comparison view — loaded | Both pets selected | StatTable renders with winner indicators |
| Comparison view — swap | Tap swap button | Left and right columns exchange; winner indicators update |
| Tied stat | Both values equal | "TIED" badge replaces label in centre column |
| Tap pet portrait in header | Tap left or right pet image/name | Navigate to `/animals`, open that pet's detail sheet |
| Care score — data missing | Pet has no care log entries | Display "-" in the value cell, no winner treatment for that row |
| Racing stats — data missing | Pet has never raced | Display "-" in speed, strength, agility; no winner for those rows |

---

## 5. Copy Direction

| Element | Copy |
|---|---|
| Compare button in PetDetailSheet | "Compare" |
| Page title (in PageHeader, back button) | "Compare" |
| Page back button | "Back" (or system back — use `useNavigate(-1)`) |
| PetSelectorSheet heading — second pet | "Pick a second animal to compare" |
| PetSelectorSheet heading — first pet (direct URL) | "Pick an animal to compare" |
| Swap button aria-label | "Swap animals" |
| Stat label — Speed | "SPEED" |
| Stat label — Strength | "STRENGTH" |
| Stat label — Agility | "AGILITY" |
| Stat label — Care score | "CARE" |
| Stat label — Rarity | "RARITY" |
| Stat label — Age | "AGE" |
| Stat label — Personality | "PERSONALITY" |
| Stat label — Category | "HOME" |
| Tied badge text | "TIED" |
| Missing stat value | "–" (en-dash, not hyphen) |
| Tap pet portrait hint (no tooltip) | None — tappable portrait is implied by the image; accessibility label on the button suffices |
| CompareEmptyState title | "You need two animals to compare" |
| CompareEmptyState description | "Adopt more animals from the Marketplace to start comparing!" |
| CompareEmptyState CTA | "Go to Marketplace" |
| Done / back button | "Done" |

---

## 6. DS Compliance Notes

### Surfaces
- Page: `--bg`
- CompareHeader: `--card` sticky strip, `border-bottom: 1px solid --border-s`
- StatTable: no outer card — rows sit directly on `--bg`
- StatRow winner cell: `--green-sub` bg tint on winner cell only (not entire row)
- Alternating row tint: `rgba(255,255,255,.015)` — referenced from DS table row hover
  pattern; acceptable as a static background
- PetSelectorSheet: `--card` via BottomSheet component
- PetSelectorRow: `--elev` bg

### Colour roles
- Winner stat value: `--green-t` text + `--green-sub` cell bg
- Loser stat value: `--t3` text
- Equal / tied stat: both `--t2`, "TIED" badge uses `--green-sub` bg + `--green-t` text
- Display-only stat: `--t2` (same as tied — no comparison implied)
- Stat row label: `--t3` (hairline)
- Pet name in header: `--t1`
- Rarity badge: existing `RarityBadge` (colour from DS rarity rules)

### Buttons
- "Compare" in PetDetailSheet: `variant="primary"` (blue), size to match existing footer
  buttons (currently `size="md"`)
- Swap button: `variant="outline"`, `size="sm"`, icon-only, explicit 44×44px touch target
- "Done" in page header: `variant="outline"`, `size="sm"` — utility action
- "Go to Marketplace" in empty state: `variant="primary"`, `size="md"`
- PetSelectorRow: not a button variant — styled as a list item with tap feedback
  (`active:scale-[.97] transition-transform`), not pill-shaped

### Icons (all Lucide, stroke-width 2)
- Swap button: `ArrowLeftRight` (20px)
- Empty state: `GitCompare` (48px, `--t4`)
- "Tied" badge: no icon — text only (space-constrained)
- "Done" back: `ChevronLeft` (20px) if using a back-style button, or plain text button

### Typography
- CompareHeader pet names: `15px/600, --t1`, max 12 chars with ellipsis
- StatRow label: `11px/700, uppercase, letter-spacing 1.5px, --t3`
- StatRow value: `15px/600`
- "TIED" badge: `11px/600` (badge pattern)
- PetSelectorRow name: `14px/600, --t1`
- PetSelectorRow meta: `12px/400, --t3`
- Empty state title: H4 (`22px/600, --t1`)
- Empty state description: Body (`15px/400, --t3`)

### No new gradients used
- Compare is an informational screen. No celebration colours. No gradient backgrounds.
  The green winner treatment (subtle tint) is the only accent colour in the stat table.

---

## 7. Responsive Notes

### 375px (phone portrait)

- CompareHeader: columns compress. Pet names truncate to 10 characters. Rarity badges
  hide (pets are already identified by name). Portrait images reduce to 44×44px.
- StatTable: label column reduces to 80px. Value columns get equal remaining space.
  Values truncate if long (rarity names — "Legendary" at 9 chars should still fit at
  `15px/600`; check at implementation).
- PetDetailSheet footer: 4 buttons wrap to 2×2 grid. (See PetDetailSheet updates section.)
- Swap button: stays centred in CompareHeader at 44×44px minimum.

### 768px (iPad portrait — primary target)

- CompareHeader: full layout — 56×56px portrait, full pet name, rarity badge, swap button.
- StatTable: label column 120px. Generous value cells.
- Content column: `max-w-3xl mx-auto w-full`, `px-6`.
- PetDetailSheet footer: single row with all 4 buttons (flex-1 each, `size="sm"` or `"md"`
  — confirm min touch height 44px is met).

### 1024px (iPad landscape)

- Same as 768px layout — content column constraint (`max-w-3xl`) keeps comparison readable.
  Do not span the compare table full-width — a two-column comparison at full iPad landscape
  width (1366px) would have grotesquely wide stat cells.
- CompareHeader sticky: sticky top works correctly; confirm `top` value accounts for any
  other fixed elements above it (PageHeader is not fixed — it scrolls with content, so
  CompareHeader sticky should use `top: 0` relative to the scroll container).

---

## 8. Accessibility Notes

### Touch targets
- Pet portrait tap target in CompareHeader: `min-h-[44px] min-w-[44px]` — the 56×56px
  image meets this requirement at 768px+; at 375px where image is 44×44px, ensure the
  button wrapper adds padding if needed.
- Swap button: explicit `style={{ minHeight: 44, minWidth: 44 }}` — icon-only buttons
  are frequently under-sized in implementation.
- PetSelectorRow: 72px natural height — sufficient.

### Focus management
- On navigate to `/compare`: focus moves to PetSelectorSheet if it opens immediately,
  or to the page heading if comparison is already populated.
- PetSelectorSheet close (pet selected): focus moves to the swap button in CompareHeader.
- Tap pet portrait → navigate: standard navigation focus management (focus to page top
  or first heading of My Animals).

### Screen reader considerations
- StatTable: use a proper `<table>` element (not div-based grid) so that screen readers
  can navigate by row and column.
  - `<thead>` contains two `<th>` columns: left pet name (aria-label: "[Pet A name]") and
    right pet name (aria-label: "[Pet B name]").
  - `<tbody>` rows: each `<tr>` has a row header `<th scope="row">` for the stat label.
  - Winner cell: `aria-label="[Pet A name] wins this stat: [value]"` on the `<td>`.
  - Tied row: both cells use `aria-label="Tied: both [value]"`.
  - Missing value cell: `aria-label="No data"`.
- This is the only screen in the app that warrants a proper `<table>` — do not use a CSS
  grid with manual layout for a genuine tabular dataset.

### Colour independence
- Winner is not shown by green alone. The CompareHeader could show a win count in the
  future (deferred), but for now the winner is indicated by colour AND the implicit
  "higher number wins" understanding. Label column text remains readable at `--t3`.
- "TIED" badge provides text confirmation in addition to the colour being same for both
  values.

### Reduced-motion
- Swap animation: if `prefers-reduced-motion`, swap is instant (no translate transition).
- PetSelectorSheet: spring animation disabled, instant open.
- PetSelectorRow tap: `scale(0.97)` tap feedback disabled (use opacity change instead:
  `active:opacity-70`).

### No timer, no pressure
- This screen has no countdown, no deadline, no expiry. It is a pure information display.
  No accessibility accommodations are needed beyond the standard baseline.

### Child comprehension
- Stat labels are ALL uppercase hairline text. For children who may struggle with abstract
  labels ("AGILITY"), consider adding a small icon alongside the label in a future
  iteration. In Phase C, the FE should reserve space for an icon-prefix in the label
  column so this can be added without layout rework.
- Recommended icon pairings (for future):
  - SPEED: `Zap`
  - STRENGTH: `Dumbbell`
  - AGILITY: `Wind`
  - CARE: `Heart`

---

## Annotator notes for Developer / Frontend Engineer

- Route entry: the Compare screen should accept a `leftPetId` parameter via React Router
  state (not query string — avoids exposing internal IDs in the URL). Pattern:
  `navigate('/compare', { state: { leftPetId: pet.id } })`.
- `SavedName` type: confirm it has `speed`, `strength`, `agility` fields populated from
  racing results, and a `careScore` field from the care log. If these do not exist yet,
  the FE must handle missing values gracefully with the "–" display described in state
  inventory.
- StatTable must be a `<table>` element (accessibility requirement — see above). This is
  not optional.
- The PetDetailSheet "Compare" button must be hidden (not disabled) when fewer than 2 pets
  exist. Use conditional rendering (`{pets.length > 1 && <Button...>}`), not
  `disabled` prop.
- PetSelectorSheet is a generic component and should be reusable. Other features
  (trading, future gift feature) may need a pet picker. Extract it to
  `src/components/ui/PetSelectorSheet.tsx` rather than a feature-specific location.
- CompareHeader sticky positioning: the screen does not use the global PageHeader pattern
  (grid: 1fr auto 1fr). It uses a custom two-column header with the swap control. The
  global PageHeader (if rendered) should be suppressed or replaced on this screen.
  Alternatively, render the "Back / Done" action in the global PageHeader left slot and
  the swap button in the CompareHeader only.
