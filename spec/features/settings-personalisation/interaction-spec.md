# Interaction Spec — Settings: Personalisation (Background + Font)

**Author:** UX Designer
**Date:** 2026-03-28
**Status:** Ready for Phase B (PO) review before Phase C begins

---

## 1. Feature Summary

This feature adds a "Personalisation" section to the existing Settings screen. Harry can choose:

1. A **background image** for the Home screen — one of 24 habitat images rendered as a subtle dark overlay. The NFT Dark theme stays dominant; the image is atmosphere, not wallpaper.
2. An **app font** — one of four curated options that all read clearly at child reading level and maintain WCAG AA contrast on the dark theme.

Neither choice affects game state, coins, or progression. Both choices persist across sessions via a `usePersonalisation` hook backed by `localStorage` (no Dexie table required — these are UI preferences, not game data).

---

## 2. Where It Lives

The Personalisation section is inserted into `SettingsScreen.tsx` as a new `<Section>` block.

**Position in the settings list:**

```
1. Accessibility        (existing — sound, motion, speech)
2. Personalisation      (NEW — background, font)
3. Your progress        (existing — coins, animals, XP stats)
4. About                (existing)
5. Data                 (existing — reset)
```

Rationale: Personalisation follows Accessibility because both are presentation-layer preferences. It sits above progress stats and data management, which are informational/destructive and lower priority in a normal session.

**No new route is needed.** Personalisation lives inline within the existing Settings screen scroll. It does not get its own page or bottom sheet.

---

## 3. Background Selection

### 3.1 Available options

25 options total:

| Slot | Display name | File path |
|------|-------------|-----------|
| 0 | None (Dark) | — no image — |
| 1 | Arctic | `/Animals/Habitats/arctic.jpg` |
| 2 | Cave | `/Animals/Habitats/cave.jpg` |
| 3 | Coastal | `/Animals/Habitats/coastal.jpg` |
| 4 | Domestic | `/Animals/Habitats/domestic.jpg` |
| 5 | Farm | `/Animals/Habitats/farm.jpg` |
| 6 | Fresh Water | `/Animals/Habitats/fresh_water.jpg` |
| 7 | Grassland | `/Animals/Habitats/grassland.jpg` |
| 8 | Ocean | `/Animals/Habitats/ocean.jpg` |
| 9 | Prehistoric | `/Animals/Habitats/prehistoric.jpg` |
| 10 | Reef | `/Animals/Habitats/reef.jpg` |
| 11 | Sahara | `/Animals/Habitats/sahara.jpg` |
| 12 | Savanna | `/Animals/Habitats/savanna.jpg` |
| 13 | Snow Mountains | `/Animals/Habitats/snow_mountains.jpg` |
| 14 | Stable | `/Animals/Habitats/stable.jpg` |
| 15 | Temperate Forest | `/Animals/Habitats/temperate_forest.jpg` |
| 16 | Tropical Rainforest | `/Animals/Habitats/tropical_rainforest.jpg` |
| 17 | Tundra | `/Animals/Habitats/tundra.jpg` |
| 18 | Urban | `/Animals/Habitats/urban.jpg` |
| 19 | Wetland | `/Animals/Habitats/wetland.jpg` |

Note: The `/public/Animals/Habitats/` directory contains both space-named and underscore-named variants of some files (e.g. `fresh water.jpg` and `fresh_water.jpg`). The spec uses the underscore variants as canonical paths. FE must verify these files exist at build time and use the underscore paths only. Do not reference the space-named variants — they exist as legacy duplicates.

The "None (Dark)" option is always first in the grid and represents the default state: no image applied, pure `--bg` background.

### 3.2 Background picker UI

The picker is rendered **inline within the Personalisation section** of Settings — not in a bottom sheet or modal.

The section expands to show the full grid when the section is open. The Settings screen is already scrollable, so the grid does not need to be independently scrollable.

**Grid layout:**
- Phone (< 768px): `grid-cols-2`, gap `12px`
- iPad (>= 768px): `grid-cols-3`, gap `12px`

Each grid item is a **background swatch card**:

```
Width:        100% of grid column
Aspect ratio: 16/9
Radius:       var(--r-md) = 12px
Overflow:     hidden
Border:       1px solid var(--border-s) at rest
              1px solid var(--blue) when selected
```

The image fills the card at `object-fit: cover`. The "None (Dark)" card shows the `--bg` colour (`#0D0D11`) as a solid dark rectangle with a small text label "None" centred in `var(--t3)`, 12px, 500 weight.

**Selected state indicator:**
A blue checkmark badge overlays the bottom-right corner of the selected card:
```
Badge:        20px circle
Background:   var(--blue)
Icon:         Check (Lucide), size 12, colour #fff, stroke-width 2
Position:     absolute, bottom 6px, right 6px
```
No other cards show this badge. The selected card also has `border: 1px solid var(--blue)`.

**Label:**
Each card has a text label centred below it (not overlaid on the image):
```
Font:   12px / 500
Colour: var(--t3) at rest, var(--t1) when selected
Margin-top: 4px
```

### 3.3 Preview behaviour

Selection is **immediate and live**: tapping a background card applies it to the Home screen instantly. Harry does not need to press a Save button.

Because the Home screen is not visible while Settings is open (Settings is a full-screen route), Harry sees the change the moment he navigates back to Home. This is the correct UX for a child — no deferred confirmation step, no modal preview.

The selected card's visual state (blue border + check badge) confirms the choice within Settings.

### 3.4 How the background renders on Home screen

The background image is applied **only to HomeScreen**, not to any other screen.

**Implementation approach for FE:**

In `HomeScreen.tsx`, read the current `backgroundImage` value from `usePersonalisation`. If a background is set, render a fixed full-bleed layer behind all Home content:

```
Element:          div, position absolute, inset 0, z-index 0
Image:            background-image: url('/Animals/Habitats/{filename}')
                  background-size: cover
                  background-position: center
Opacity:          0.14
Mix-blend-mode:   luminosity
Pointer-events:   none
```

The `HomeScreen` root element must be `position: relative` to contain this layer.

All Home content sits above the image layer (`z-index: 1` or natural stacking above the absolutely-positioned layer).

**Why these values:**
- `opacity: 0.14` — visible enough to feel personalised; dark enough that all card text and surface colours remain fully legible without any adjustment
- `mix-blend-mode: luminosity` — strips the image's colour information, leaving only texture and light/dark variation. The result reads as a desaturated atmosphere rather than a coloured wallpaper. The NFT Dark palette is preserved.
- No blur — blur is reserved for glass surfaces; blurring the background creates a fake depth-of-field effect that competes with the glass treatment on cards and nav

If Harry selects "None (Dark)", the background layer is not rendered at all. No empty div, no image request.

**The dark theme is non-negotiable.** Any implementation that makes the Home screen look lighter or affects card readability is wrong. If visual QA shows any card text is less than 4.5:1 contrast ratio against the background layer, reduce opacity further. `0.14` is the maximum; it may need to be lower depending on image brightness.

### 3.5 Persistence

Stored in `localStorage` via the `usePersonalisation` hook (see section 7). The key is `ak_personalisation`. No Dexie table. No migration. On first load with no key set, `backgroundImage: null` is the default (None / Dark).

---

## 4. Font Selection

### 4.1 Available options

Four options only. No custom fonts. No uploads.

| Option label | Font family | Google Fonts import name | Notes |
|-------------|-------------|--------------------------|-------|
| Default | DM Sans | Already imported | Current app font |
| Friendly | Nunito | `Nunito:wght@400;500;600;700` | Rounded, warm, legible |
| Playful | Fredoka | `Fredoka:wght@400;500;600` | Friendly headline feel; test at small sizes |
| Easy Read | Lexend | `Lexend:wght@400;500;600;700` | Designed for reading ease; recommended for dyslexia |

All four fonts must be preloaded via `<link rel="preload">` and a Google Fonts `<link>` in `index.html` before Phase C begins. FE must not lazy-load fonts on selection — the switch must feel instant, not cause a flash of unstyled text.

### 4.2 Font picker UI

The font picker is a **horizontal pill row** rendered inline within the Personalisation section, below the background grid.

**Section label above the row:**
```
Text:   "App font"
Style:  11px / 700 / uppercase / tracking-widest / var(--t3)
Margin-bottom: 8px
```

**Pill row layout:**
```
Display:        flex
Gap:            8px
Flex-wrap:      wrap  (on phone, pills may wrap to two rows)
```

On iPad (>= 768px), all four pills fit on one row comfortably. On phone (375px), they wrap to two rows of two.

**Individual pill anatomy:**
```
Height:         40px
Padding:        0 16px
Radius:         var(--r-pill) = 100px
Font:           14px / 600 — rendered in the font it represents
Border:         1px solid var(--border-s) at rest
                1px solid var(--blue) when selected
Background:     var(--card) at rest
                var(--blue-sub) when selected
Text colour:    var(--t2) at rest
                var(--blue-t) when selected
```

Each pill shows the option label text ("Default", "Friendly", "Playful", "Easy Read") set in the font family it represents. This is the preview — Harry sees the font before choosing.

**Active state:** Selected pill uses blue tint-pair: `background: var(--blue-sub); border: 1px solid var(--blue); color: var(--blue-t)`. This matches the CategoryPills pattern from ExploreScreen exactly. No solid fill.

### 4.3 How the font is applied app-wide

The `usePersonalisation` hook writes the chosen font family string to the CSS custom property `--font-body` on the `<html>` element:

```js
document.documentElement.style.setProperty('--font-body', fontFamily)
```

The Design System must be updated in Phase C to reference `--font-body` as the primary font variable alongside `--font`. All DS typography tokens that currently use `--font` are updated to use `--font-body` as their first value.

```css
:root {
  --font:      'DM Sans', 'Inter', system-ui, sans-serif;  /* legacy — keep for reference */
  --font-body: 'DM Sans', 'Inter', system-ui, sans-serif;  /* personalisation-controlled */
}
```

On app startup, `usePersonalisation` reads the stored font from `localStorage` and calls `setProperty` before first render to avoid a flash of wrong font.

**Scope:** `--font-body` applies to all screens, not just Home. Font is a global preference.

### 4.4 Persistence

Same hook and `localStorage` key as background. The `usePersonalisation` hook stores both values together as a single JSON object:

```json
{
  "backgroundImage": "arctic.jpg",
  "font": "Nunito"
}
```

Default (no key set or corrupted key): `{ backgroundImage: null, font: "DM Sans" }`.

---

## 5. Interaction States

### Background swatch card

| State | Visual |
|-------|--------|
| Rest | `border: 1px solid var(--border-s)` |
| Hover (pointer device) | `border: 1px solid var(--border)`, lift pattern: `translateY(-1px)` — reduced from standard card lift because these are small tiles |
| Active (tap/press) | `scale(0.97)` — standard DS active press |
| Selected | `border: 1px solid var(--blue)`, check badge visible in bottom-right corner |
| Focus (keyboard) | `outline: 2px solid var(--blue); outline-offset: 2px` |

The hover lift on background cards is reduced (`translateY(-1px)` not `-2px`) because the cards are compact grid tiles. The full `-2px` lift creates visible row-height jitter in a tight grid.

### Font pill

| State | Visual |
|-------|--------|
| Rest | `bg: var(--card)`, `border: 1px solid var(--border-s)`, `color: var(--t2)` |
| Hover | `border: 1px solid var(--border)`, `bg: rgba(255,255,255,.03)` |
| Active (tap/press) | `scale(0.97)` |
| Selected | `bg: var(--blue-sub)`, `border: 1px solid var(--blue)`, `color: var(--blue-t)` |
| Focus (keyboard) | `outline: 2px solid var(--blue); outline-offset: 2px` |
| Disabled | Not applicable — all four options are always available |

### Section header "Personalisation" (SettingsScreen Section component)

No interaction state — the section is always expanded. It does not collapse.

Rationale: a collapsible section adds interaction cost with no benefit here. Harry wants to change his background or font; making him expand a section first creates unnecessary friction. The section height is manageable within the existing scroll.

---

## 6. Component Anatomy

### 6.1 Background swatch card

```
┌────────────────────────────────┐
│  [image, object-fit: cover]    │  ← aspect-ratio: 16/9
│                          [✓]   │  ← check badge, only when selected
└────────────────────────────────┘
         Label text (12px)
```

For the "None (Dark)" card:
```
┌────────────────────────────────┐
│  [solid #0D0D11]               │
│         None                   │  ← "None" in var(--t3), centred
└────────────────────────────────┘
         None (12px)
```

**Check badge anatomy:**
```
Shape:      20px × 20px circle
Position:   absolute, bottom 6px, right 6px
Z-index:    above image
Background: var(--blue)
Icon:       Check, Lucide, size 12, stroke-width 2, colour #fff
```

No shadow on the check badge. No border on the check badge. The blue circle on the dark image is sufficient contrast.

### 6.2 Personalisation section within SettingsScreen

The section uses the existing `<Section>` component pattern with title "Personalisation":

```
Section: "PERSONALISATION"
├── Background label (hairline text)
├── Background grid (2 or 3 cols)
├── 16px vertical gap
├── Font label (hairline text)
└── Font pill row
```

The background grid and font pill row sit inside the Section's card container (`bg: var(--card)`, `rounded-2xl`, `border: 1px solid var(--border-s)`). Internal padding matches the Section pattern: `px-4`, with `py-4` top and bottom within the card.

---

## 7. Persistence and Reset

### usePersonalisation hook

New hook at `src/hooks/usePersonalisation.ts`.

**Shape:**
```ts
interface PersonalisationState {
  backgroundImage: string | null   // filename only, e.g. "arctic.jpg", or null for None
  font: string                     // font family name, e.g. "DM Sans", "Nunito"
}

interface UsePersonalisationReturn {
  backgroundImage: string | null
  font: string
  setBackground: (filename: string | null) => void
  setFont: (fontFamily: string) => void
  reset: () => void
}
```

**Storage:** `localStorage` key `ak_personalisation`. Serialised as JSON.

**Font side-effect:** `setFont` must call `document.documentElement.style.setProperty('--font-body', fontFamily)` immediately, as well as persisting to `localStorage`. `usePersonalisation` must also call this on mount to restore the saved font before first paint.

**Background side-effect:** `setBackground` persists to `localStorage` only. The background image is rendered by `HomeScreen` reading `backgroundImage` from the hook.

### Reset to defaults

A "Reset to defaults" text button appears at the bottom of the Personalisation section card, right-aligned:

```
Text:     "Reset to defaults"
Style:    12px / 500 / var(--t3)
Hover:    var(--t2)
Position: right-aligned within the card bottom, py-3
```

This is a plain text button, not a pill button. It is low visual prominence by design — resetting should be possible but not prominent.

On tap: calls `reset()` from the hook, which sets `backgroundImage: null` and `font: "DM Sans"`, applies the font change to the CSS variable, and persists the defaults to `localStorage`.

No confirmation dialog. Personalisation reset is trivially reversible (the options are still right there). Do not add friction to a harmless action.

**Reset does not affect game data.** It only resets background and font. The "Reset all data" button in the Data section handles game data separately.

---

## 8. Overlay and Surface Treatment

The Settings screen is a full-screen route (`/settings`), not a modal or overlay. The glass rule does not apply to the Settings screen itself — it uses the standard `--bg` page background.

The existing Settings screen structure is:
- Full-screen div, `bg: var(--bg)`, scroll container
- Header bar with back button (not glass — part of the document flow)
- Section cards: `bg: var(--card)`, `border: 1px solid var(--border-s)`, `rounded-2xl`

The Personalisation section uses the same `<Section>` component and card treatment as all other settings sections. No special surface treatment is needed.

If a future version adds a background preview modal or a sheet, the glass rule (`rgba(13,13,17,.80)` + `backdrop-filter: blur(24px)`) must apply to that overlay. This spec does not introduce any such overlay.

---

## 9. PageHeader Slot Assignment

This feature does not introduce a new PageHeader. Settings uses a custom inline header (back button + title), not the shared `PageHeader` component.

The Personalisation section does not need a slot assignment — it is a scroll section within an existing screen, not a tab or filter control.

**No new navigation controls are introduced by this feature.**

---

## 10. Accessibility

### Keyboard navigation

The background swatch grid must be keyboard-navigable:
- Each swatch card is a `<button>` element
- Tab order follows DOM order (left to right, row by row)
- Arrow key navigation within the grid is a progressive enhancement, not required for MVP
- Selected card has `aria-pressed="true"`; unselected cards have `aria-pressed="false"`
- Each card has `aria-label="{name} background"` (e.g. `aria-label="Arctic background"`)
- The "None" card: `aria-label="No background (dark theme only)"`

Font pills:
- Each pill is a `<button>` with `aria-pressed` matching selection state
- `aria-label="{option label} font"` (e.g. `aria-label="Friendly font, Nunito"`)
- Tab order is left to right through the pill row

### Focus management

No focus trap or focus shift is needed — the personalisation controls are inline in the settings scroll. Focus moves naturally through the page.

### Font changes and contrast

When Harry switches fonts, WCAG AA contrast ratios must be maintained across all text in the app. DM Sans, Nunito, Fredoka, and Lexend are all variable or multi-weight fonts; the DS uses weights 400–700. All four families support these weights.

FE must verify that at the font sizes used in the DS (minimum 11px), all four fonts render legibly at WCAG AA (4.5:1 minimum for normal text, 3:1 for large text 18px+). At 11px–13px, Fredoka may require testing — it is designed as a display/headline face and its counters are less open at very small sizes. If 11px Fredoka fails contrast testing, the DS minimum size rule must be applied strictly for Fredoka users.

**Open question for PO:** Should Fredoka be restricted to sizes 14px and above when it is the active font? This would require conditional DS logic. Flagged in section 11.

### Background images and contrast

The background image layer (`opacity: 0.14`, `mix-blend-mode: luminosity`) must not reduce text contrast below WCAG AA. FE must check contrast ratios with the brightest available habitat image (candidates: Savanna, Snow Mountains, Farm) at the specified opacity. If any combination fails, opacity must be reduced until all pass.

The `mix-blend-mode: luminosity` treatment mitigates most contrast risk by removing colour information. The remaining risk is image brightness in the highlight areas — light-coloured areas of the image can slightly reduce perceived contrast of white text.

---

## 11. Page Structure Diagram

Settings screen scroll order after this feature lands:

```
┌──────────────────────────────────────────────────────────┐
│  ← Settings                                              │  header
├──────────────────────────────────────────────────────────┤
│  ACCESSIBILITY                                           │  section label
│  ┌────────────────────────────────────────────────────┐  │
│  │  Reduce motion                          [ toggle ] │  │
│  │  Read questions aloud                   [ toggle ] │  │
│  └────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────┤
│  PERSONALISATION                                         │  section label (NEW)
│  ┌────────────────────────────────────────────────────┐  │
│  │  BACKGROUND                                        │  │  hairline label
│  │  ┌──────┐ ┌──────┐ ┌──────┐                       │  │
│  │  │ None │ │ Arc- │ │ Cave │                        │  │  3-col grid (iPad)
│  │  │      │ │ tic  │ │      │                        │  │
│  │  └──────┘ └──────┘ └──────┘                       │  │
│  │  ┌──────┐ ┌──────┐ ┌──────┐                       │  │
│  │  │      │ │      │ │      │                        │  │
│  │  └──────┘ └──────┘ └──────┘                       │  │
│  │  … (rows continue)                                 │  │
│  │                                                    │  │
│  │  APP FONT                                          │  │  hairline label
│  │  [Default] [Friendly] [Playful] [Easy Read]        │  │  pill row
│  │                              Reset to defaults →   │  │
│  └────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────┤
│  YOUR PROGRESS                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Coins / Animals / XP (stat grid)                  │  │
│  └────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────┤
│  ABOUT  /  DATA  (existing sections)                     │
└──────────────────────────────────────────────────────────┘
```

Content container below the header: `px-0 pt-4 pb-24` — the existing Settings screen already handles padding via the Section component's `mx-6` and the parent's `pb-24`. The new section is added with the same `<Section>` wrapper and requires no change to the outer container.

---

## 12. Open Questions for PO / Owner

1. **Fredoka at small sizes:** Fredoka One is primarily a display face. At 11px–13px (Caption, Body Sm) it may fail WCAG AA or simply look poor. Should Fredoka be excluded as an option, or should the app enforce a minimum font-size override when Fredoka is active? This needs a decision before Phase C.

2. **Font applies to button labels inside animal cards:** When Harry changes to Fredoka, every button, badge, and label in the app changes. Is this the intended scope? Or should the font preference apply to body text only (headings and descriptions), leaving UI chrome (buttons, nav labels, badges) locked to DM Sans? This affects the implementation significantly — two CSS variables (`--font-body` for reading text, `--font-ui` for chrome) vs one.

3. **Image loading on slow connections:** The background grid shows 19 images plus the None card. On a slow Wi-Fi or first load, images may appear as grey boxes. Should swatch cards show a skeleton shimmer while images load, or is a grey placeholder acceptable? This is a UX polish question, not a blocker.

4. **Background scoping beyond Home:** Should the background image apply to the Explore and My Animals screens as well, or strictly to Home only? The brief says Home only, but Harry may find it odd that his Arctic background vanishes when he navigates. This is a scope question for the PO.

5. **Duplicate image files:** The `/public/Animals/Habitats/` directory contains both space-named (`fresh water.jpg`) and underscore-named (`fresh_water.jpg`) variants of several images. The spec uses underscore paths. FE should confirm which variants are intentional and remove duplicates — serving both wastes storage.
