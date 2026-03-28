# Refined Stories — Settings: Personalisation (Background + Font)

**Feature:** `settings-personalisation`
**Author:** Product Owner
**Date:** 2026-03-28
**Status:** Awaiting [OWNER] approval before Phase C begins

---

## Feature Summary

This feature adds a Personalisation section to the existing Settings screen, giving Harry two curated choices: a background image for the Home screen and an app-wide font. Neither choice affects game state. Both persist across sessions via `localStorage`. The feature is motivated by Harry's ownership relationship with the app — the value is identity and control, not utility.

---

## Open Questions — Resolved

The interaction spec raised five open questions. All are resolved here before Phase C begins. FE and Developer must treat these as binding scope decisions, not suggestions.

**1. Fredoka minimum size (spec Q1 and Q2 combined)**

Decision: Fredoka is included as an option. It applies app-wide (body text and UI chrome — one CSS variable, not two). A minimum rendered size of 14px applies whenever Fredoka is the active font. This is consistent with the DS button size minimum and avoids conditional per-screen DS logic. FE must add a `data-font="fredoka"` attribute on `<html>` when Fredoka is active, and a global CSS rule `[data-font="fredoka"] * { font-size: max(14px, 1em); }` — or equivalent — to enforce the floor. The DS minimum sizes for Caption (11px) and Body Sm (13px) are overridden for Fredoka users only; all other fonts use the standard DS scale unchanged.

**2. Font scope (spec Q2)**

Decision: font applies app-wide via a single `--font-body` CSS custom property on `<html>`. Body text and UI chrome (buttons, nav labels, badges) all inherit from `--font-body`. This is simpler to implement and more satisfying for Harry — the whole app feels different, not just one screen. Two-variable approach (`--font-body` + `--font-ui`) is out of scope.

**3. localStorage vs Dexie (spec section 7)**

Decision: `localStorage` is correct. Background image filename and font family are UI preferences, not game data. They require no migration, no foreign keys, and no sync with game state. `localStorage` key `ak_personalisation`, serialised JSON. No Dexie table.

**4. The 19 habitat images — canonical list confirmed**

The `/public/Animals/Habitats/` directory was inspected. The following files exist and are confirmed as the available background options. The spec uses underscore-named paths only; space-named variants are legacy duplicates and must not be referenced in code.

Note on `savana.jpg`: the directory contains both `savana.jpg` (misspelled) and `savanna.jpg` (correct). The canonical filename is `savanna.jpg`. FE must use `savanna.jpg` only and the `savana.jpg` duplicate should be flagged for removal.

| Slot | Display name | Canonical filename |
|------|-------------|-------------------|
| 0 | None (Dark) | — no file — |
| 1 | Arctic | `arctic.jpg` |
| 2 | Cave | `cave.jpg` |
| 3 | Coastal | `coastal.jpg` |
| 4 | Domestic | `domestic.jpg` |
| 5 | Farm | `farm.jpg` |
| 6 | Fresh Water | `fresh_water.jpg` |
| 7 | Grassland | `grassland.jpg` |
| 8 | Ocean | `ocean.jpg` |
| 9 | Prehistoric | `prehistoric.jpg` |
| 10 | Reef | `reef.jpg` |
| 11 | Sahara | `sahara.jpg` |
| 12 | Savanna | `savanna.jpg` |
| 13 | Snow Mountains | `snow_mountains.jpg` |
| 14 | Stable | `stable.jpg` |
| 15 | Temperate Forest | `temperate_forest.jpg` |
| 16 | Tropical Rainforest | `tropical_rainforest.jpg` |
| 17 | Tundra | `tundra.jpg` |
| 18 | Urban | `urban.jpg` |
| 19 | Wetland | `wetland.jpg` |

Total: 19 habitat images plus the "None (Dark)" default = 20 selectable options.

**5. Background scope (spec Q4)**

Decision: background image applies to the Home screen only. This matches the feature brief. If Harry notices the background disappears on other screens post-launch, this can be reconsidered in a follow-up feature with its own brief. Extending scope mid-feature without a new brief is not permitted.

**6. Image loading on slow connections (spec Q3)**

Decision: a grey placeholder is acceptable for MVP. Skeleton shimmer is a polish enhancement that can be addressed in a follow-up if Harry notices it. Not a blocker for Phase C. Grey placeholder (`--card` background on the swatch card while image loads) is the required fallback — no blank white flash.

**7. Duplicate image files (spec Q5)**

Decision: out of scope for this feature to remove them, but FE must flag the duplicates (space-named variants and `savana.jpg`) to [OWNER] as a separate housekeeping task. They must not be referenced in any new code.

---

## User Stories

---

### Story 1 — Personalisation section visible in Settings

```
As Harry,
I need to see a "Personalisation" section when I open Settings,
So that I know where to go to change how the app looks.
```

**Acceptance criteria:**
- [ ] The Settings screen contains a section labelled "PERSONALISATION" (uppercase, matching the existing section label style)
- [ ] The section appears in position 2: below "ACCESSIBILITY" and above "YOUR PROGRESS"
- [ ] The section is always expanded — it does not collapse or require a tap to open
- [ ] The section contains a background grid and a font pill row without any further taps required
- [ ] The section label and layout match the visual treatment of existing Settings sections (same typeface, same section card style: `bg: var(--card)`, `rounded-2xl`, `border: 1px solid var(--border-s)`)
- [ ] No emoji is used anywhere in the section — Lucide icons only where icons appear

**Out of scope:**
- Collapsible/expandable behaviour — always open
- Any icon or illustration in the section header

---

### Story 2 — Selecting a background image for the Home screen

```
As Harry,
I need to tap a background image from a grid of options in Settings,
So that I can choose which habitat image appears behind my Home screen.
```

**Acceptance criteria:**
- [ ] The background grid displays 20 options: the "None (Dark)" card first, followed by the 19 habitat images in the order specified in the Open Questions table above
- [ ] Each option is displayed as a swatch card with a 16:9 aspect ratio, `object-fit: cover` image, `var(--r-md)` (12px) radius, and a text label below the card
- [ ] The "None (Dark)" card renders as a solid `#0D0D11` rectangle with the word "None" centred in `var(--t3)`, 12px, weight 500 — no image
- [ ] Grid layout is 2 columns on screens below 768px and 3 columns on screens 768px and above
- [ ] Gap between cards is 12px
- [ ] Tapping a card applies the background immediately — no Save button required
- [ ] The selected card shows: `border: 1px solid var(--blue)` and a 20px blue circle badge (background `var(--blue)`) in the bottom-right corner containing a white Lucide `Check` icon, size 12, stroke-width 2, positioned at `bottom: 6px, right: 6px`
- [ ] Unselected cards show: `border: 1px solid var(--border-s)`
- [ ] The selected card's label text changes from `var(--t3)` to `var(--t1)`; unselected labels remain `var(--t3)`
- [ ] Hover state (pointer devices): `border: 1px solid var(--border)`, `translateY(-1px)` — reduced lift for compact tiles
- [ ] Active/press state: `scale(0.97)`
- [ ] Focus state (keyboard): `outline: 2px solid var(--blue); outline-offset: 2px`
- [ ] Each swatch card is a `<button>` element with `aria-pressed` set correctly and `aria-label="{name} background"` (e.g. "Arctic background"); the "None" card has `aria-label="No background (dark theme only)"`
- [ ] While a swatch image is loading, the card shows a `var(--card)` grey placeholder — no white flash, no blank rectangle

**Out of scope:**
- Uploading a custom photo from camera roll
- A preview modal or full-screen preview before applying
- Any confirmation dialog before applying

---

### Story 3 — Background image renders correctly on the Home screen

```
As Harry,
I need the background image I chose to appear behind my Home screen content,
So that the app feels personalised without making it hard to read.
```

**Acceptance criteria:**
- [ ] When a background is selected (not "None"), the Home screen renders a full-bleed image layer: `position: absolute; inset: 0; z-index: 0; background-size: cover; background-position: center; opacity: 0.14; mix-blend-mode: luminosity; pointer-events: none`
- [ ] The `HomeScreen` root element is `position: relative` to contain the image layer
- [ ] All Home screen content sits above the image layer (natural stacking order or `z-index: 1`)
- [ ] When "None (Dark)" is selected, no image element is rendered on the Home screen — no empty div, no network request
- [ ] The background image is served from `/Animals/Habitats/{canonical_filename}` using only the underscore-named files
- [ ] Text legibility: `--t1` and `--t2` text on all Home screen cards maintains at least 4.5:1 contrast ratio against the background layer — verified with the brightest habitat images (Savanna, Snow Mountains, Farm) at opacity 0.14. If any image fails this check, opacity must be reduced below 0.14 until all pass
- [ ] The dark theme is visually intact: card surfaces, the gradient fade above BottomNav, and the BottomNav glass treatment all read correctly with the background image active
- [ ] Navigating away from Home and returning preserves the background — the image does not flash on or fade in
- [ ] The background image does not appear on any other screen (Explore, My Animals, Settings, etc.)

**Out of scope:**
- Background image on any screen other than Home
- Animated or video backgrounds
- Custom image brightness or saturation controls

---

### Story 4 — Selecting an app font

```
As Harry,
I need to tap a font option from a row of labelled pills in Settings,
So that I can change how text looks across the whole app.
```

**Acceptance criteria:**
- [ ] The font picker renders as a horizontal pill row below the background grid, within the same Personalisation section card
- [ ] A hairline label "APP FONT" (11px, 700, uppercase, `tracking-widest`, `var(--t3)`) appears above the pill row with 8px margin-bottom
- [ ] Four pills are present: "Default", "Friendly", "Playful", "Easy Read" — in that order
- [ ] Each pill renders its label text in the font it represents: Default in DM Sans, Friendly in Nunito, Playful in Fredoka, Easy Read in Lexend
- [ ] Pill anatomy: height 40px, padding 0 16px, radius `var(--r-pill)` (100px), font 14px/600
- [ ] Rest state: `bg: var(--card)`, `border: 1px solid var(--border-s)`, `color: var(--t2)`
- [ ] Selected state: `bg: var(--blue-sub)`, `border: 1px solid var(--blue)`, `color: var(--blue-t)` — tint-pair pattern, no solid fill
- [ ] Hover state (pointer): `border: 1px solid var(--border)`, `bg: rgba(255,255,255,.03)`
- [ ] Active/press state: `scale(0.97)`
- [ ] Focus state: `outline: 2px solid var(--blue); outline-offset: 2px`
- [ ] On iPad (>= 768px), all four pills fit on a single row
- [ ] On phone (375px), pills wrap to two rows of two — `flex-wrap: wrap` with 8px gap
- [ ] Each pill is a `<button>` with `aria-pressed` matching selection state and `aria-label="{label} font"` (e.g. "Friendly font, Nunito")
- [ ] All four fonts (Nunito, Fredoka, Lexend) are preloaded via `<link rel="preload">` and Google Fonts `<link>` in `index.html` — font switch is instant, no flash of unstyled text

**Out of scope:**
- Custom font upload
- Font size adjustment (belongs in Accessibility, separate brief)
- More than four font options

---

### Story 5 — Font applies app-wide immediately

```
As Harry,
I need the font I chose to appear everywhere in the app as soon as I tap a pill,
So that the change feels real and the app feels mine.
```

**Acceptance criteria:**
- [ ] Tapping a font pill immediately applies the font across all screens — no Save button, no reload required
- [ ] The font change is achieved by writing to `--font-body` on `document.documentElement` via `document.documentElement.style.setProperty('--font-body', fontFamily)` — all DS typography that uses `--font-body` updates automatically
- [ ] Every screen in the app (Home, Explore, My Animals, Settings, and all sheets and overlays) reflects the new font within the same session
- [ ] When Fredoka is the active font, a `data-font="fredoka"` attribute is set on `<html>` and a global CSS rule enforces a 14px minimum rendered size (`max(14px, 1em)` or equivalent) — no text in the app renders below 14px while Fredoka is active
- [ ] When any other font is active, the standard DS size scale is used unchanged (minimum 11px for Caption)
- [ ] The font pill for the active font remains in the selected (tint-pair) state after navigating away from Settings and returning
- [ ] DM Sans is the default font on first use; the "Default" pill is pre-selected on first visit to Settings

**Out of scope:**
- Separate font variables for body vs UI chrome — one `--font-body` variable controls both
- Font preview in a modal before applying

---

### Story 6 — Preferences persist after closing and reopening the app

```
As Harry,
I need my chosen background and font to still be active the next time I open the app,
So that my personalisation doesn't reset every time.
```

**Acceptance criteria:**
- [ ] Both preferences (background image and font) are stored together as a single JSON object in `localStorage` under the key `ak_personalisation`: `{ "backgroundImage": "arctic.jpg", "font": "Nunito" }` (example)
- [ ] `backgroundImage` is the canonical filename only (e.g. `"arctic.jpg"`) or `null` for None
- [ ] `font` is the font family name string (e.g. `"DM Sans"`, `"Nunito"`, `"Fredoka"`, `"Lexend"`)
- [ ] On app startup, `usePersonalisation` reads from `localStorage` and restores both preferences before first paint — no visible flash of default background or wrong font
- [ ] The font is applied via `setProperty('--font-body', ...)` on mount, before the first render, so there is no flash of DM Sans when a different font is stored
- [ ] If `localStorage` returns no key (first launch, cleared storage), defaults are: `backgroundImage: null`, `font: "DM Sans"` — no error, no warning
- [ ] If the stored JSON is malformed or corrupted, the hook silently falls back to defaults — no uncaught exception
- [ ] Closing the browser tab and reopening the app shows the correct background and font without any interaction from Harry

**Out of scope:**
- Syncing preferences across devices
- Cloud backup of personalisation
- A Dexie table for personalisation data

---

### Story 7 — Reset to defaults

```
As Harry,
I need a way to restore the original background and font in one tap,
So that I can start over if I want to change everything back.
```

**Acceptance criteria:**
- [ ] A "Reset to defaults" text link appears right-aligned at the bottom of the Personalisation section card: 12px, weight 500, `var(--t3)` at rest, `var(--t2)` on hover, `py-3` padding
- [ ] The element is a plain text button (not a pill, not an `outline` button, not a `primary` button) — low visual prominence is intentional
- [ ] Tapping it calls `reset()` from `usePersonalisation`, which: sets `backgroundImage` to `null`, sets `font` to `"DM Sans"`, writes the CSS variable `--font-body` back to `'DM Sans, Inter, system-ui, sans-serif'`, removes the `data-font="fredoka"` attribute from `<html>` if present, and persists the defaults to `localStorage`
- [ ] No confirmation dialog is shown before resetting — the action is trivially reversible (options are still visible)
- [ ] After reset, the background grid shows "None (Dark)" as selected and all habitat cards are deselected
- [ ] After reset, the "Default" font pill is selected and all other font pills are deselected
- [ ] The Home screen immediately shows no background image after reset — the image layer is removed without requiring navigation
- [ ] The font changes back to DM Sans immediately — no reload required
- [ ] Reset does not affect any game data: coins, animals, XP, achievements, and all other Settings options are unchanged

**Out of scope:**
- Resetting game data (handled by the existing "Reset all data" button in the Data section)
- An undo action after reset

---

### Story 8 — iPad layout: background picker is 3 columns

```
As Harry using his iPad,
I need the background grid to show three columns of habitat images side by side,
So that I can see more options at once and the layout suits the screen I'm on.
```

**Acceptance criteria:**
- [ ] At viewport width >= 768px (iPad portrait and landscape), the background picker renders as a 3-column grid with a 12px gap
- [ ] At viewport width < 768px (phone), the background picker renders as a 2-column grid with a 12px gap
- [ ] Swatch cards maintain their 16:9 aspect ratio at both breakpoints — they do not distort
- [ ] At Harry's device (iPad Pro 11-inch portrait, approximately 820px CSS width), the 3-column grid is the active layout
- [ ] At 1024px (iPad landscape), the 3-column grid is the active layout and cards are not excessively large — visual QA required at this breakpoint
- [ ] The font pill row renders all four pills on a single row at >= 768px
- [ ] The Personalisation section card does not overflow the Settings screen's content column on any supported breakpoint
- [ ] No content is cut off or hidden behind the fixed BottomNav — the Settings screen maintains `pb-24` on its scroll container

**Out of scope:**
- A 4-column grid at any breakpoint
- Horizontal scroll within the background grid

---

## Out of Scope

The following are explicitly excluded from this feature. Any request to add them during Phase C must be escalated to [OWNER] as a scope change — not implemented unilaterally.

- **Custom photo upload from camera roll** — requires camera/photos permission handling, image fitting logic, and content risk management. Separate brief required.
- **Colour theme or accent colour picker** — requires DS token architecture changes. Not a personalisation feature; it is a design system architecture project.
- **Light mode / dark mode toggle** — the entire DS is calibrated for dark only. Out of scope indefinitely.
- **Per-screen backgrounds** — background applies to Home only. Extending to other screens is a separate feature.
- **Background image on Explore, My Animals, or any screen other than Home** — confirmed out of scope in Open Questions resolution above.
- **Font size controls** — belongs in Accessibility with a separate brief.
- **A separate `--font-ui` variable for button/badge chrome** — font applies globally via `--font-body`. One variable only.
- **More than four font options** — the four defined options (Default, Friendly, Playful, Easy Read) are the complete set.
- **Font preview modal** — pills render in their own font as the preview. No separate preview overlay.
- **Animation speed personalisation** — the existing reduce-motion toggle in Accessibility covers this.
- **Skeleton shimmer on background swatch cards** — grey placeholder (`var(--card)`) is sufficient for MVP.
- **Removal of duplicate image files** — flagged for housekeeping but out of scope for this feature's Phase C.
- **Arrow-key navigation within the background grid** — standard tab order is sufficient for MVP; arrow keys are a progressive enhancement deferred.

---

## Definition of Done

The following checklist must be completed and signed off before the feature is marked `complete` in the backlog. It is the Tester's responsibility to verify every item and record results in `tests/settings-personalisation/test-results.md`.

### Functional
- [ ] All 8 user stories pass their acceptance criteria, verified by the Tester in `test-results.md`
- [ ] `usePersonalisation` hook exists at `src/hooks/usePersonalisation.ts` with the shape defined in the interaction spec
- [ ] `localStorage` key `ak_personalisation` stores the correct JSON on every change
- [ ] App startup restores both preferences before first paint — no flash of default state
- [ ] Fredoka 14px minimum floor is enforced via `data-font="fredoka"` attribute and global CSS rule
- [ ] Reset to defaults restores background, font, CSS variable, and HTML attribute in one tap

### Design system compliance (10-point DS checklist — all must pass)
- [ ] 1. No emojis used as icons — Lucide only throughout
- [ ] 2. No `ghost` variant on visible actions — search entire codebase, not just new files
- [ ] 3. All colours trace to `var(--...)` tokens — no hardcoded hex (alpha composites of DS tokens permitted only where documented)
- [ ] 4. Surface stack correct — Personalisation section uses `var(--card)` matching all other Settings sections
- [ ] 5. Layout verified at 375px, 768px, and 1024px — no wasted space, no cut-off content
- [ ] 6. All scrollable content has `pb-24` minimum
- [ ] 7. Top-of-screen breathing room — Settings header has at least `pt-4` clearance below header bottom edge
- [ ] 8. Navigation controls compact and consistent — font pills use tint-pair active style matching CategoryPills on ExploreScreen
- [ ] 9. Animation parameters match spec — hover lift is `translateY(-1px)` (reduced), active press is `scale(0.97)`, no other animations introduced
- [ ] 10. Spec-to-build element audit — every element in the page structure diagram (section 11 of interaction spec) is present in the build; no extra elements added

### Accessibility
- [ ] All swatch cards and font pills are `<button>` elements with correct `aria-pressed` and `aria-label` values
- [ ] Background image layer at `opacity: 0.14` maintains WCAG AA (4.5:1) for `--t1` and `--t2` text on the brightest habitat images; verified with Savanna, Snow Mountains, and Farm images
- [ ] All four fonts at DS sizes maintain WCAG AA contrast — Fredoka verified specifically at 14px minimum

### iPad layout
- [ ] Background grid is 3 columns at >= 768px (confirmed at Harry's device width ~820px)
- [ ] Background grid is 2 columns at < 768px
- [ ] Four font pills fit on one row at >= 768px

### Persistence
- [ ] Preferences survive: tab close + reopen, hard browser refresh, app PWA close + reopen
- [ ] Malformed `localStorage` value falls back to defaults silently

### Integration
- [ ] Personalisation reset does not affect any game data (coins, animals, XP, achievements)
- [ ] Background image does not appear on any screen other than Home
- [ ] No new route introduced — feature lives inline in the existing Settings scroll

### File hygiene
- [ ] Only underscore-named image paths referenced in code
- [ ] `savana.jpg` (misspelled) flagged as a housekeeping task — not referenced in code
- [ ] Space-named image variants not referenced in code

---

## Assumptions on which this document relies

| Assumption | Basis | Action if wrong |
|------------|-------|-----------------|
| All 19 underscore-named habitat files exist in `/public/Animals/Habitats/` | Directory inspected 2026-03-28 | FE verifies at build time; missing files must be flagged before Phase C proceeds |
| `localStorage` is available and writable in the PWA context | Standard browser API | Developer adds a graceful fallback if storage is unavailable (fall back to in-memory state, no error thrown) |
| Google Fonts CDN is reachable in Harry's use context | Standard assumption | If unavailable, system fonts (`system-ui, sans-serif`) are the fallback — fonts are preloaded, not blocking |
| `--font-body` does not exist in the current DS | DS reviewed 2026-03-28 — only `--font` is defined | Developer adds `--font-body` to the DS CSS variable block and updates all typography references |
| The existing Settings `<Section>` component accepts arbitrary children (the background grid and pill row) | Inferred from existing section pattern | Developer confirms at Phase C kickoff — if the component is restrictive, it must be updated |

---

*This document is ready for [OWNER] review. Phase C must not begin until [OWNER] explicitly approves.*
