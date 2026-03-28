# Interaction Spec — Icon Pack and Colour Customisation

**Author:** UX Designer
**Date:** 2026-03-28
**Status:** Ready for Phase B (PO) review before Phase C begins

---

## 1. Feature Summary

Harry can choose between four icon packs, each with different visual styles, and (for
single-colour styles) pick a colour to tint those icons from a curated palette. For
Phosphor duotone specifically, a dedicated "Multicolour" mode replaces the colour
picker — the duotone treatment is the style, not a colour.

These are pure presentation preferences. They have no effect on game state, coins, or
progression. Selections persist via the existing `usePersonalisation` hook and
`localStorage` key (`ak_personalisation`), exactly like font and background choices.

### The four packs

| Pack | Library | Available styles |
|------|---------|-----------------|
| Lucide | `lucide-react` | Default (one style only) |
| Phosphor | `@phosphor-icons/react` | Thin / Light / Regular / Bold / Fill / Duotone |
| Tabler | `@tabler/icons-react` | Outline / Filled |
| Remix | `@remixicon/react` | Line / Fill |

### The duotone special case

Phosphor Duotone icons use two tones — a solid fill and a 25%-opacity secondary overlay.
A single colour picker cannot meaningfully apply to them: picking one hex would collapse
the two-tone effect. Duotone is therefore its own complete style-plus-colour choice. When
duotone is active, the colour section is hidden and replaced by a "Multicolour" badge
label. This is the same mental model as selecting a background image versus selecting
"None (Dark)" — one option locks out a subordinate control because it already encodes
what that control would set.

---

## 2. Where It Lives

The icon customisation controls are added to the existing **Personalisation section** of
the Settings screen, inside the existing `PersonalisationSection` component
(`src/components/settings/PersonalisationSection.tsx`).

**Position within the Personalisation section card:**

```
PERSONALISATION section card
├── Background (existing)
├── App Font (existing)
├── Typography (existing)
├── Surface Style (existing)
├── ── divider ──
├── Icons (NEW)
│   ├── Pack picker (pill row)
│   ├── Style picker (conditional pill row — hidden for Lucide)
│   ├── Colour (conditional — hidden for duotone)
│   │   └── Colour preset swatches OR "Multicolour" notice
│   └── Live preview strip
└── Reset to defaults (existing)
```

No new route, no new bottom sheet, no new modal. Everything is inline in the existing
scroll. The Settings screen is already scrollable and the Personalisation section card
already accepts vertical growth.

**No PageHeader slot is needed.** This lives entirely within the settings scroll; there
is no new navigation control introduced.

---

## 3. Icons Sub-section Anatomy

### 3.1 Section header

```
Text:     "Icons"
Style:    11px / 700 / uppercase / tracking-widest / var(--t3)
Pattern:  HairlineLabel — matches existing Background, App Font, Typography labels exactly
Margin-bottom: 8px
```

A hairline divider (`border-top: 1px solid var(--border-s)`) sits above the "Icons"
label to visually separate the new sub-section from Surface Style above it. This matches
the existing `divide-y divide-[var(--border-s)]` pattern used inside Typography rows.
Vertical gap above the divider: 12px (the existing `gap-5` on the parent flex column
provides this automatically).

---

## 4. Pack Picker

### 4.1 Control type

A **horizontal pill row** — the same component pattern as the App Font pill row. Four
pills, one per pack. At most one is active at a time.

### 4.2 Pill anatomy

Active pill: `bg-[var(--blue-sub)] border border-[var(--blue)] text-[var(--blue-t)]`
Inactive pill: `bg-[var(--card)] border border-[var(--border-s)] text-[var(--t2)]`

This is the CategoryPills tint-pair pattern from ExploreScreen. No solid fill on
active pills.

```
Height:         40px (meets 44px touch target when accounting for tap area)
Min-width:      none — content-sized
Padding:        0 16px
Radius:         var(--r-pill) = 100px
Font:           14px / 600
Flex-wrap:      wrap
Gap:            8px
```

On iPad (820px), all four pills fit on one row.
On phone (375px), "Phosphor" is the longest label; all four should still fit on one row
at 375px but may wrap to two rows of two if the font is changed to Fredoka. Wrap is
acceptable — this is the same behaviour as the existing font pill row.

**Pill labels:** "Lucide", "Phosphor", "Tabler", "Remix" — plain text, no icons in the
pill label itself. (The live preview below the controls shows what the icons look like.)

**Selected state indicator:** Blue check badge (18px circle, `var(--blue)` background,
`Check` Lucide icon 10px white) positioned `absolute right-2 top-1/2 -translate-y-1/2`.
Pill right padding expands to 36px when selected to make room for the badge. This matches
the existing FontPill implementation exactly.

**Default selection:** Lucide (the current production icon pack).

### 4.3 Interaction states

| State | Visual |
|-------|--------|
| Rest (inactive) | `bg: var(--card)`, `border: 1px solid var(--border-s)`, `color: var(--t2)` |
| Hover (inactive) | `border: 1px solid var(--border)`, `bg: rgba(255,255,255,.03)` |
| Active (tap/press) | `transform: scale(.97)` |
| Selected | `bg: var(--blue-sub)`, `border: 1px solid var(--blue)`, `color: var(--blue-t)` |
| Focus (keyboard) | `outline: 2px solid var(--blue); outline-offset: 2px` |
| Disabled | Not applicable — all four packs are always available |

### 4.4 Accessibility

Each pill is a `<button>` with:
- `aria-pressed="true/false"` matching selection state
- `aria-label="{PackName} icon pack"` (e.g. `aria-label="Phosphor icon pack"`)
- Tab order left to right through the row

---

## 5. Style Picker

### 5.1 Conditional display

The style picker is **only shown when the active pack has more than one style**.

| Active pack | Show style picker? | Available styles |
|-------------|-------------------|-----------------|
| Lucide | No — hide entirely | (only one style) |
| Phosphor | Yes | Thin / Light / Regular / Bold / Fill / Duotone |
| Tabler | Yes | Outline / Filled |
| Remix | Yes | Line / Fill |

When Lucide is selected, the style picker row is not rendered. No placeholder, no greyed
row, no "one style only" label — the absence of the control is self-explanatory and
removing it avoids visual clutter for the default state (which most users will never
change).

### 5.2 Control type

Same horizontal pill row pattern as the pack picker. One pill per available style, one
active at a time.

Pill anatomy, states, and accessibility are identical to section 4.2–4.4 above, with
these differences:

- `aria-label`: `"{StyleName} style for {PackName}"` (e.g. `aria-label="Bold style for Phosphor"`)
- Default style selection when a pack is first chosen:
  - Phosphor → Regular
  - Tabler → Outline
  - Remix → Line

When Harry changes the active pack, the style resets to that pack's default. The
previously selected style is not remembered across pack changes — this avoids invalid
state (e.g. "Bold" as the persisted style when switching to Tabler, which has no Bold).

### 5.3 Duotone pill

"Duotone" is one of the six Phosphor style pills. Selecting it triggers a downstream
effect: the colour section (section 6) is hidden and replaced by the "Multicolour" notice
(section 6.3). The Duotone pill itself has no special visual treatment beyond the standard
active tint-pair — the difference manifests in the colour section below.

```
Pill label:  "Duotone"
Style:       same as all other style pills
Position:    last in the Phosphor style row
```

---

## 6. Colour Section

### 6.1 Conditional display

The colour section is shown when the active pack and style combination produces
**single-colour icons**. It is hidden (not disabled, not greyed — hidden) when Phosphor
Duotone is active.

| Condition | Show colour section? |
|-----------|---------------------|
| Lucide (any) | Yes |
| Phosphor Thin / Light / Regular / Bold / Fill | Yes |
| Phosphor Duotone | No — show Multicolour notice instead |
| Tabler Outline or Filled | Yes |
| Remix Line or Fill | Yes |

### 6.2 Colour preset swatches

When visible, the colour section presents **nine colour presets** plus a "System" option.
"System" means icons use the existing `var(--t2)` colour token — the current production
behaviour. Presets are a fixed palette; there is no free-form colour input (Harry is 8;
a hex input or hue wheel adds complexity that serves no need here).

**Section label above swatches:**

```
Text:     "Icon colour"
Style:    11px / 700 / uppercase / tracking-widest / var(--t3)
Pattern:  HairlineLabel — same as all sub-labels in this section
Margin-bottom: 8px
```

**Swatch row layout:**

```
Display:        flex
Flex-wrap:      wrap
Gap:            8px
```

**Individual swatch anatomy:**

Each swatch is a circular colour button. The selection state uses the blue tint-pair pill
pattern — the swatch is not replaced by a blue pill when selected; instead the swatch
gains a blue ring.

```
Shape:          circle
Size:           36px × 36px (touch target: 44px — achieved via 4px invisible padding)
Inner circle:   28px × 28px (the visible colour fill)
Radius:         50%
Border (rest):  1.5px solid rgba(255,255,255,.10)
Border (selected):  2px solid var(--blue) (ring around the swatch)
Box-shadow (selected): 0 0 0 3px rgba(55,114,255,.20) (outer glow)
```

The "System" swatch is not a colour circle. It is a pill-shaped button using the same
pattern as the card tint "None" option already in `PersonalisationSection`:

```
Text:       "System"
Style:      12px / 600
Active:     bg-[var(--blue-sub)] border border-[var(--blue)] text-[var(--blue-t)]
Inactive:   bg-[var(--card)] border border-[var(--border-s)] text-[var(--t2)]
Height:     36px
Padding:    0 14px
Radius:     var(--r-pill)
```

**The nine colour presets** (rendered in this order, left to right, wrapping):

| Slot | Name | Hex |
|------|------|-----|
| 0 | System | (pill, no hex) |
| 1 | White | `#FCFCFD` |
| 2 | Blue | `#6E9BFF` (`var(--blue-t)`) |
| 3 | Pink | `#F06EAB` (`var(--pink-t)`) |
| 4 | Green | `#7DD69B` (`var(--green-t)`) |
| 5 | Amber | `#FCC76E` (`var(--amber-t)`) |
| 6 | Purple | `#BA8DE9` (`var(--purple-t)`) |
| 7 | Red | `#F5899E` (`var(--red-t)`) |
| 8 | Teal | `#5ECFD8` |
| 9 | Coral | `#F4845F` |

All colours are DS `*-t` text tokens where they exist. Teal and Coral are additions not
in the DS token set — their hex values are specified here and must be documented in the
DS under "Icon Pack Colour Presets" before Phase C begins. FE must not introduce
hardcoded hex values in component code; the preset list must live in a data constant
(e.g. `ICON_COLOUR_PRESETS` exported from `usePersonalisation.ts` or a sibling data
file) so the component renders from the data, not inline hex strings.

**Default selection:** "System" — no colour override, icons use `var(--t2)` as currently.

### 6.3 Multicolour notice (Phosphor Duotone only)

When Phosphor Duotone is active, the colour swatch row is replaced by a single inline
notice row:

```
Layout:     flex, items-center, gap-2
Icon:       Palette (Lucide), size 16, colour var(--purple-t)
Text:       "Multicolour — uses two tones automatically"
Text style: 13px / 500 / var(--t3)
Background: none
```

This notice is not interactive. It is a status indicator only. It tells Harry why the
colour picker is not visible without requiring him to understand how duotone works.

No border, no card background on the notice row. Plain inline text next to the icon.

### 6.4 Interaction states for colour swatches

| State | Visual |
|-------|--------|
| Rest | `border: 1.5px solid rgba(255,255,255,.10)` |
| Hover | `border: 1.5px solid rgba(255,255,255,.25)`, `transform: scale(1.08)` |
| Active (tap/press) | `transform: scale(.94)` |
| Selected | `border: 2px solid var(--blue)`, `box-shadow: 0 0 0 3px rgba(55,114,255,.20)` |
| Focus (keyboard) | `outline: 2px solid var(--blue); outline-offset: 3px` |

Each swatch `<button>` carries:
- `aria-pressed="true/false"`
- `aria-label="{colour name} icon colour"` (e.g. `aria-label="Blue icon colour"`)
- `title="{colour name}"` for pointer devices

---

## 7. Live Preview Strip

### 7.1 Purpose

The preview strip gives Harry immediate visual feedback — he can see what the combination
of pack + style + colour looks like on real icons before leaving Settings. Without it, the
choices are abstract labels; with it, he can see "oh, Phosphor Duotone looks like this".

### 7.2 Position

The preview strip sits **below the colour section** (or below the Multicolour notice),
within the Icons sub-section, before the Reset to defaults button.

```
ICONS sub-section
├── Pack picker
├── Style picker (conditional)
├── Colour presets / Multicolour notice (conditional)
└── Preview strip   ← here
```

### 7.3 Layout and sizing

```
Container:      flex row
Align:          items-center
Gap:            16px
Padding:        12px 0
Border-top:     1px solid var(--border-s)  — light separator above preview
Margin-top:     4px
Overflow:       visible (icons are small enough that clip risk is low)
```

**Icon count:** Eight icons are shown. Eight at 24px with 16px gaps fits within 375px
without overflow. On iPad they spread slightly but remain left-aligned within the strip.

**Icon sizing:** 24px, strokeWidth 2 — matching the current production icon spec exactly.

**Icon colour in the preview:** The preview renders icons using the current colour
selection. For "System", render at `var(--t2)`. For colour presets, apply the selected
hex. For duotone (Phosphor), render using the Phosphor duotone component defaults (the
library handles the two-tone rendering automatically).

### 7.4 Which icons to show

The preview uses this fixed set of eight concepts, mapped to each pack's equivalent:

| Slot | Concept | Why |
|------|---------|-----|
| 1 | Paw print | Animal Kingdom brand concept |
| 2 | Star | Rating / reward (used throughout the app) |
| 3 | Heart | Care / favourites (used in My Animals) |
| 4 | Home | Navigation — Home tab |
| 5 | Search | Navigation — Explore tab |
| 6 | Trophy | Achievements |
| 7 | Coins / Circle Dollar | Currency |
| 8 | Settings / Sliders | Settings (self-referential, immediately visible) |

**Icon name mapping per pack:**

| Concept | Lucide | Phosphor | Tabler | Remix |
|---------|--------|----------|--------|-------|
| Paw | `PawPrint` | `Paw` | `IconPaw` | `RiPawPrintLine/Fill` |
| Star | `Star` | `Star` | `IconStar` | `RiStarLine/Fill` |
| Heart | `Heart` | `Heart` | `IconHeart` | `RiHeartLine/Fill` |
| Home | `Home` | `House` | `IconHome` | `RiHomeLine/Fill` |
| Search | `Search` | `MagnifyingGlass` | `IconSearch` | `RiSearchLine/Fill` |
| Trophy | `Trophy` | `Trophy` | `IconTrophy` | `RiTrophyLine/Fill` |
| Coins | `CircleDollarSign` | `CurrencyCircleDollar` | `IconCoin` | `RiMoneyDollarCircleLine/Fill` |
| Settings | `Settings` | `Sliders` | `IconAdjustments` | `RiSettings3Line/Fill` |

The icon name mapping is a data constant (`PREVIEW_ICONS`) defined in a data file, not
inline in the component. The component receives the active pack and style and resolves
the correct icon component at render time. FE must not hardcode icon component names
inside JSX.

### 7.5 Preview strip label

```
Text:     "Preview"
Style:    11px / 700 / uppercase / tracking-widest / var(--t3)
Position: above the icon row, margin-bottom 8px
Pattern:  HairlineLabel
```

### 7.6 "Different in some screens" note

A brief note below the icon row, visible only when Phosphor is selected:

```
Text:     "Some screens use icons not available in every pack — those stay as Lucide."
Style:    11px / 400 / var(--t3) / leading-snug
Margin-top: 6px
```

This manages Harry's expectations if he notices a small number of icons look different
to the selected style. It only appears for Phosphor because Phosphor has the widest
coverage gap risk (the app uses Lucide-specific icon names that may have no direct
Phosphor equivalent). FE must maintain a fallback map; any icon not found in the selected
pack falls back to the Lucide equivalent silently.

This note does NOT appear for Tabler or Remix. If coverage is confirmed sufficient before
Phase C, it may be omitted entirely — flag as an open question in section 12.

---

## 8. Component Anatomy — Full Icons Sub-section

```
─────────────────────────────────────────────────────────────────────────
  [divider line, 1px solid var(--border-s)]

  ICONS                                           ← HairlineLabel

  PACK                                            ← HairlineLabel (nested)
  [ Lucide ] [ Phosphor ] [ Tabler ] [ Remix ]    ← pill row

  STYLE                                           ← HairlineLabel (nested)
  (hidden when Lucide active)
  [ Thin ] [ Light ] [ Regular ] [ Bold ] [ Fill ] [ Duotone ]
  — or —
  [ Outline ] [ Filled ]
  — or —
  [ Line ] [ Fill ]

  ICON COLOUR                                     ← HairlineLabel (nested)
  (hidden when Phosphor Duotone active)
  ● ● ● ● ● ● ● ● ●  [System]                    ← swatch circles + System pill
  — or, when duotone —
  ⟨Palette icon⟩ Multicolour — uses two tones automatically

  PREVIEW                                         ← HairlineLabel (nested)
  ─────────────────────────────────────────────
  ☆ ♡ ⌂ ⌕ 🏆 ⊙ ⚙  ✦  (8 icons, 24px, selected style)
  [note: "Some screens use icons not available in every pack…"]
  (note only shown for Phosphor)

─────────────────────────────────────────────────────────────────────────
```

Note: the icons in the diagram above are placeholder glyphs for readability only. The
actual implementation uses Lucide/Phosphor/Tabler/Remix components, not Unicode
characters. No emojis in the implementation.

---

## 9. Nested HairlineLabel Hierarchy

The Icons sub-section uses two levels of hairline label:

- Top-level: "Icons" — same visual treatment as "Background", "App Font", "Typography",
  "Surface Style" (the existing sub-section headers in PersonalisationSection)
- Second-level: "Pack", "Style", "Icon Colour", "Preview" — same visual token values
  (11px / 700 / uppercase / var(--t3) / tracking-widest) but distinguished purely by
  context and position, not by visual variation. Both levels use the same `HairlineLabel`
  component with no modification.

The second-level labels sit directly above their controls with `margin-bottom: 8px`.
Vertical gap between sub-groups within the Icons section: `gap-4` (16px) on the flex
column container that wraps Pack, Style, Colour, and Preview groups.

---

## 10. Persistence

### 10.1 What is stored

The existing `ak_personalisation` localStorage key is extended with three new fields:

```json
{
  "backgroundImage": "arctic.jpg",
  "font": "Nunito",
  "iconPack": "phosphor",
  "iconStyle": "regular",
  "iconColour": "#6E9BFF"
}
```

| Field | Type | Values | Default |
|-------|------|---------|---------|
| `iconPack` | string | `"lucide"` / `"phosphor"` / `"tabler"` / `"remix"` | `"lucide"` |
| `iconStyle` | string | `"default"` / `"thin"` / `"light"` / `"regular"` / `"bold"` / `"fill"` / `"duotone"` / `"outline"` / `"filled"` / `"line"` | `"default"` |
| `iconColour` | string | hex value, or `""` (empty string = System / no override) | `""` |

### 10.2 Hook changes

`usePersonalisation` gains three new state values and setters:

```ts
iconPack: IconPack           // 'lucide' | 'phosphor' | 'tabler' | 'remix'
iconStyle: IconStyle         // see field values above
iconColour: string           // hex or '' for system default

setIconPack: (pack: IconPack) => void     // also resets iconStyle to pack default
setIconStyle: (style: IconStyle) => void
setIconColour: (hex: string) => void
```

`setIconPack` must reset `iconStyle` to the pack's default style and reset `iconColour`
to `""` (System). Rationale: a colour chosen for Lucide may look wrong on Phosphor Duotone;
clearing to System on pack change is safer and avoids invalid state.

### 10.3 Reset behaviour

The existing `reset()` function in `usePersonalisation` must also reset `iconPack`,
`iconStyle`, and `iconColour` to their defaults (`"lucide"`, `"default"`, `""`). The
"Reset to defaults" button at the bottom of the Personalisation section covers this
— no additional reset control is needed.

---

## 11. Responsive Behaviour

### 11.1 iPad (820px portrait — primary target)

Pack picker: all four pills on one row with space to spare.
Style picker (Phosphor, six styles): all six pills fit on one row at 820px.
Colour swatches: all ten (System pill + nine circles) fit on one row.
Preview strip: eight icons at 24px with 16px gaps = 296px total. Fits comfortably.

No wrapping expected at 820px for any control in this section.

### 11.2 Phone (375px — secondary target)

Pack picker: four pills — "Lucide", "Phosphor", "Tabler", "Remix" — should fit one row
at 375px with `px-4` section padding. Combined width estimate: ~320px. Tight but
achievable. FE must verify. If they do not fit, wrap to two rows of two is acceptable.

Style picker (Phosphor, six styles): will wrap at 375px. Expected layout: three pills
per row. This is acceptable — wrapping is preferable to text truncation.

Style picker (Tabler, two styles) and (Remix, two styles): fit one row easily.

Colour swatches: System pill (~80px) + nine circles (36px each + 8px gaps = ~404px).
Will wrap at 375px. Expected: System pill on its own, then circles in a second row of
five and third row of four, or similar. This is acceptable.

Preview strip: eight icons at 24px with 16px gaps = 296px. Fits on 375px.

**Content container class string for the Icons sub-section content** (within the existing
PersonalisationSection flex column): `flex flex-col gap-4`. The outer Section card
provides `px-4`; the sub-section does not add its own horizontal padding.

### 11.3 Content top padding

No new content top padding is required. This feature extends the existing
Personalisation section card; the card's existing `py-4` top padding is already in place.
The outer Settings screen content container (`px-0 pt-4 pb-24`) is unchanged.

---

## 12. Overlay and Surface Treatment

No new overlays, modals, or bottom sheets are introduced by this feature. All controls
are inline within the existing Personalisation section card.

The glass rule does not apply here. The section card uses `var(--card)` background
(standard surface, not a fixed/absolute overlay).

---

## 13. Accessibility

### 13.1 All interactive controls

Every interactive element (pack pill, style pill, colour swatch, System pill) is a
`<button>` with:
- `aria-pressed` reflecting current selection state
- Descriptive `aria-label` (specified per control in sections 4–6 above)
- Keyboard focusable in DOM order
- Focus indicator: `outline: 2px solid var(--blue); outline-offset: 2px` (or `3px` for
  circular swatches)
- Minimum touch target: 44px. The 36px swatch circles reach 44px via 4px transparent
  padding on all sides.

### 13.2 Conditional sections

When the style picker or colour section is hidden (conditionally not rendered), focus
order skips them naturally. No `aria-hidden` or `display:none` trickery is needed —
remove from the DOM entirely. Screen readers benefit from the element simply not being
present.

### 13.3 Multicolour notice

The Multicolour notice (section 6.3) is a static paragraph with a decorative Lucide
`Palette` icon. The icon carries `aria-hidden="true"`. The text is sufficient.

### 13.4 Live preview

The preview strip is **not interactive**. Icons within it are decorative. The containing
element carries `aria-label="Icon style preview"` and `role="img"`. Individual icons
have `aria-hidden="true"`. Screen readers get one single label for the whole strip, not
eight separate unlabelled icon announcements.

### 13.5 WCAG AA

All text in this section uses `var(--t3)` for labels (hairline labels) and `var(--t2)`
for body text. These tokens are the same as throughout the existing Personalisation
section and meet WCAG AA on `var(--card)` background.

Colour swatch borders at rest (`rgba(255,255,255,.10)`) are decorative lines, not
informational text, so they are exempt from contrast requirements. The selection state
is communicated by `aria-pressed` and the blue ring, not colour alone.

---

## 14. Interaction States — Summary Table

### Pack and style pills

| State | Background | Border | Text |
|-------|-----------|--------|------|
| Inactive rest | `var(--card)` | `1px solid var(--border-s)` | `var(--t2)` |
| Inactive hover | `rgba(255,255,255,.03)` | `1px solid var(--border)` | `var(--t2)` |
| Active (press) | — | — | — | `transform: scale(.97)` |
| Selected | `var(--blue-sub)` | `1px solid var(--blue)` | `var(--blue-t)` |
| Focus | `outline: 2px solid var(--blue); outline-offset: 2px` | | |
| Disabled | Not used | | |

### Colour swatches (circles)

| State | Ring | Shadow |
|-------|------|--------|
| Rest | `1.5px solid rgba(255,255,255,.10)` | none |
| Hover | `1.5px solid rgba(255,255,255,.25)` | none, `scale(1.08)` |
| Active | — | — | `scale(.94)` |
| Selected | `2px solid var(--blue)` | `0 0 0 3px rgba(55,114,255,.20)` |
| Focus | `outline: 2px solid var(--blue); outline-offset: 3px` | |

### System pill (colour section)

Identical to pack and style pills (inactive/selected states as above).

---

## 15. Page Structure Diagram

Settings screen scroll order after this feature lands (Personalisation section expanded):

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Settings                                            [header]  │
├──────────────────────────────────────────────────────────────────┤
│  ACCESSIBILITY                                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Reduce motion / Read aloud (existing)                     │  │
│  └────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│  PROFILE                                                          │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Your name (existing)                                      │  │
│  └────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│  PERSONALISATION                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  BACKGROUND (existing)                                     │  │
│  │  …upload control…                                         │  │
│  │                                                            │  │
│  │  APP FONT (existing)                                       │  │
│  │  [Default] [Friendly] [Playful] [Easy Read] …             │  │
│  │                                                            │  │
│  │  TYPOGRAPHY (existing)                                     │  │
│  │  Labels / Headings / Body / Buttons / Navigation rows      │  │
│  │                                                            │  │
│  │  SURFACE STYLE (existing)                                  │  │
│  │  Transparency slider / Colour tint swatches               │  │
│  │  ──────────────────────────────────────────────────────── │  │
│  │  ICONS                              (NEW section, below)  │  │
│  │                                                            │  │
│  │  PACK                                                      │  │
│  │  [Lucide] [Phosphor] [Tabler] [Remix]                     │  │
│  │                                                            │  │
│  │  STYLE          (hidden when Lucide selected)             │  │
│  │  [Thin][Light][Regular][Bold][Fill][Duotone]              │  │
│  │       — or —                                              │  │
│  │  [Outline][Filled]  /  [Line][Fill]                       │  │
│  │                                                            │  │
│  │  ICON COLOUR  (hidden when Phosphor Duotone selected)     │  │
│  │  ● ● ● ● ● ● ● ● ●  [System]                             │  │
│  │       — or (duotone) —                                    │  │
│  │  ⟨palette⟩ Multicolour — uses two tones automatically    │  │
│  │                                                            │  │
│  │  PREVIEW                                                   │  │
│  │  ──────────────────────────────────────────────────────── │  │
│  │  ☆ ♡ ⌂ ⌕ 🏆 ⊙ ⚙ ✦   (8 preview icons)                  │  │
│  │  [Phosphor note if applicable]                            │  │
│  │                                                            │  │
│  │                                     Reset to defaults →   │  │
│  └────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│  YOUR PROGRESS / ABOUT / DATA (existing)                         │
└──────────────────────────────────────────────────────────────────┘
```

---

## 16. Empty / Default State

On first load with no `ak_personalisation` key (or a key that pre-dates this feature):

- `iconPack`: `"lucide"` — the current production pack, so nothing visually changes
- `iconStyle`: `"default"` — Lucide has one style; this is a no-op
- `iconColour`: `""` — System colour, same as current behaviour

The app looks identical to before this feature was built. No migration required.
The hook must handle the case where `iconPack`/`iconStyle`/`iconColour` are absent
from the stored object (older saves) and fall back to the defaults above without
overwriting the existing stored values.

---

## 17. Fallback Behaviour

When the active pack does not include an icon used by a screen:
- Silently fall back to the Lucide equivalent
- Do not show a broken icon box, a missing icon placeholder, or a console warning in
  production builds
- The Phosphor note in the preview strip (section 7.6) is the only user-visible
  communication about this

FE must build a centralised icon resolver function (e.g. `resolveIcon(concept, pack, style)`)
that handles fallback logic in one place. Screens must not each implement their own
fallback. This is an implementation guidance note for the dev brief, not a UX constraint.

---

## 18. Open Questions for PO / Owner

1. **NPM bundle size impact.** Adding three icon libraries (`@phosphor-icons/react`,
   `@tabler/icons-react`, `@remixicon/react`) will increase bundle size. Phosphor alone
   ships ~9,000 icons. All three libraries support tree-shaking if icons are imported
   individually rather than as barrel imports. FE must use individual named imports only —
   no `import * from '@phosphor-icons/react'`. This is a build constraint, not a design
   constraint, but PO should be aware of the trade-off before approving Phase C.

2. **Teal and Coral colour presets.** Two preset colours (Teal `#5ECFD8`, Coral `#F4845F`)
   are not in the current DS token sheet. They need to be added to
   `design-system/DESIGN_SYSTEM.md` under a new "Icon Pack Colour Presets" sub-section
   before Phase C begins. Owner decision: accept these two additions, or replace with
   two DS tokens that already exist (e.g. `var(--green-t)` and `var(--amber-t)`, which
   are already in the palette at positions 4 and 5)?

3. **Icon pack coverage audit.** Before Phase C, the Developer must confirm which icon
   names in the app's existing icon usage map exist in each new pack. The fallback note
   in section 7.6 ("Some screens use icons not available in every pack") should only
   appear if gaps actually exist. If Phosphor has full coverage of all used icon concepts,
   the note is unnecessary and should be removed.

4. **Colour tinting mechanism.** Applying a colour override to icons requires either:
   - CSS `color` property override (works for Lucide, Phosphor, Tabler — all use
     `currentColor` as their fill/stroke). This is the simpler path.
   - A React context that injects a `color` prop to all icon instances. This is more
     complex but more reliable if any icon library does not fully honour `currentColor`.
   FE should confirm which libraries use `currentColor` reliably before Phase C.
   If all three do, the implementation is straightforward: a CSS custom property
   `--icon-color` set on `:root` by the hook, consumed by a CSS rule
   `svg { color: var(--icon-color, var(--t2)); }`.

5. **Style reset on pack change.** This spec resets `iconStyle` and `iconColour` when
   the pack changes (section 10.2). An alternative: remember the last style and colour
   used per pack, so switching back to a pack restores the previous choice. This adds
   complexity to the hook with modest user benefit. Recommendation: ship the simpler
   reset-on-change behaviour and revisit if Harry requests it.

6. **Bold text case toggle note.** The existing Typography row in PersonalisationSection
   uses `font-800` for the active bold "B" button, but the DS weight scale tops out at
   700. This is a pre-existing issue outside this spec's scope — flagged for awareness.
