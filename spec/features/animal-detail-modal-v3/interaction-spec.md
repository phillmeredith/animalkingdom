# Interaction Spec — Animal Detail Modal v3
**Role:** UX Designer
**Feature:** animal-detail-modal-v3
**Date:** 2026-03-28
**Input:** ur-findings.md, data-model-additions.md, DESIGN_SYSTEM.md
**Output path:** spec/features/animal-detail-modal-v3/interaction-spec.md

---

## 0. Context and scope

This spec redesigns the **scrollable content inside the existing full-screen portal modal** (AnimalDetailContent.tsx). The modal shell (portal, backdrop, header with close button, scroll container) is already built and is NOT changing. We are only replacing the inner content layout.

Primary target: iPad (1024px portrait). Phone (375px) secondary.
Content column constraint: `px-6 pt-4 pb-24 max-w-3xl mx-auto w-full` — no change from current.

The page must feel like an encyclopaedia entry, not a card. It must create awe in the first 10 seconds, sustain reading for 60+ seconds, and end with a clear action.

---

## 1. Emotional arc (UR-defined, UX-implemented)

| Phase | Goal | Sections responsible |
|---|---|---|
| Impress | Visual impact and immediate "wow" — size, speed, scale | Hero image, Infobox |
| Fascinate | Sustained reading — biology, classification, babies | Taxonomy, Adaptations, Reproduction |
| Care | Emotional investment — survival, conservation | Habitat, Conservation, Predators |
| Connect | Personal relevance — where it lives, gallery, culture | Gallery, Geographic Range, Cultural Significance |
| Act | Clear next step | CTA block |

---

## 2. Full page layout — section order

Section order is fixed. Sections with no data collapse entirely (no gap left behind). The only always-rendered sections are: Hero Image, Infobox, Fun Facts, CTA.

```
────────────────────────────────────────────────
[Existing modal header — sticky glass, close btn]
────────────────────────────────────────────────
SCROLLABLE CONTENT (px-6 pt-4 pb-24 max-w-3xl mx-auto w-full):

1.  Hero Image                    [always]
2.  Identity Row                  [always] — name badges, region, rarity
3.  Superpower Callout            [conditional — if superpower != null]
4.  Infobox                       [always] — physical stats grid + taxonomy table
5.  Photo Gallery                 [conditional — if gallery has entries]
6.  Amazing Adaptations           [conditional — if adaptations != null]
7.  Habitat                       [conditional — if habitatDetail != null]
8.  Daily Life                    [always — placeholder if null]
9.  Reproduction                  [conditional — if reproduction != null]
10. Predators                     [conditional — if predators != null]
11. Where It Lives                [conditional — if geographicRange != null]
12. Social Life                   [conditional — if socialBehaviour != null]
13. Conservation Status           [always — "Not Assessed" if null]
14. Care Needs OR Habitat Threats [conditional]
15. Cultural Significance         [conditional — if culturalSignificance != null]
16. Fun Facts                     [always]
17. CTA Block                     [always]
```

Section spacing: `mt-6` between sections (24px). Before the CTA block: `mt-8` (32px).

---

## 3. Section anatomy — per section specification

### 3.0 Section heading pattern (used by all named sections)

```
Element:  <p> acting as visual label — NOT a semantic heading (h2/h3)
          This keeps the accessibility tree clean; the modal h1 is the animal name in the modal header.
Font:     11px / 700 / uppercase / letter-spacing 1.5px
Colour:   var(--t3)
Margin:   margin-bottom: 12px
```

No decorative lines, borders, or dividers between sections. Breathing room comes from `mt-6` gaps.

---

### 3.1 Hero Image

```
Element:        div wrapping AnimalImage component
Aspect ratio:   16 / 9
Border radius:  var(--r-lg) (16px)
Width:          100% of content column
Object-fit:     cover
```

No caption. No overlay text on the image. No overlay gradient on the hero image.

**Interaction states:**
- No tap interaction on hero image.
- If `gallery` is non-null, a small pill badge appears bottom-right of the hero image: "X more photos" (see §3.5). This is a visual teaser only, not a tap target on the hero itself — tapping opens the gallery section below by scrolling.

Actually: the badge on the hero is informational only. Do not add a tap-to-scroll behaviour. Children will scroll naturally.

---

### 3.2 Identity Row

Appears immediately below hero image. `mt-4` (16px) gap from hero.

```
Layout:   flex, flex-wrap, gap: 8px, align-items: center
```

Elements in order (left to right, wrapping):

1. **Category badge** — tinted pill, neutral treatment:
   ```
   Background:  var(--elev)
   Border:      1px solid var(--border-s)
   Colour:      var(--t3)
   Font:        11px / 700 / uppercase / letter-spacing 1.5px
   Padding:     4px 10px
   Radius:      100px
   ```

2. **Rarity badge** — tinted pill, rarity colour pair:
   ```
   Common:     bg: rgba(119,126,145,.12), text: #B1B5C4, border: 1px solid rgba(119,126,145,.3)
   Uncommon:   bg: var(--green-sub), text: var(--green-t), border: 1px solid var(--green) at 30% opacity
   Rare:       bg: var(--blue-sub), text: var(--blue-t), border: 1px solid var(--blue) at 30% opacity
   Epic:       bg: var(--purple-sub), text: var(--purple-t), border: 1px solid var(--purple) at 30% opacity
   Legendary:  bg: var(--amber-sub), text: var(--amber-t), border: 1px solid var(--amber) at 30% opacity
   Font:       11px / 700 / uppercase / letter-spacing 1.5px
   Padding:    4px 10px
   Radius:     100px
   ```

3. **Region indicator** — icon + text, not interactive:
   ```
   Icon:       MapPin from lucide-react, 12px, strokeWidth 2, colour var(--t3)
   Text:       13px / 400, colour var(--t3)
   Gap:        4px between icon and text
   ```

4. **Scientific name** (if `scientificName` is non-null) — inline italic text, not a pill:
   ```
   Font:       13px / 400 / italic
   Colour:     var(--t3)
   No badge.   Plain text preceded by a bullet separator "•" in var(--t4).
   ```

None of these elements are interactive. No tap targets on the identity row.

---

### 3.3 Superpower Callout

Uses the existing `SuperpowerCallout` component unchanged. `mt-4` from identity row.
Conditional: absent when `superpower` is null or undefined.

---

### 3.4 Infobox

The core "at a glance" panel. Appears after the superpower callout (or after identity row if no superpower). This is the Wikipedia infobox equivalent.

The infobox is a single `var(--card)` surface card with `border: 1px solid var(--border-s)`, `border-radius: var(--r-lg)`, `padding: 20px`.

**iPad layout (≥768px):** Two-column grid. Left column: physical stats. Right column: taxonomy.
**Phone layout (<768px):** Single column. Physical stats first, taxonomy second.

#### 3.4.1 Physical stats grid (left column on iPad, or top section on phone)

Display as a grid: `grid-cols-2` on both phone and iPad (within the left column on iPad). `gap: 12px`.

Each stat cell:
```
Background:   var(--elev)
Border:       1px solid var(--border-s)
Radius:       var(--r-md) (12px)
Padding:      12px
```

Stat cell anatomy:
```
Row 1 (label):  Lucide icon (14px) + label text (11px / 700 / uppercase / letter-spacing 1.5px / var(--t3))
                icon and text in flex row, gap 4px
Row 2 (value):  22px / 600 / var(--t1), margin-top: 6px
Row 3 (detail): 11px / 400 / var(--t3), margin-top: 2px — shown when detail/comparison text exists
```

**Stat cells to render (in order, skip entirely if field is null/undefined):**

| Field | Icon | Label |
|---|---|---|
| `habitat` | `TreePine` | HABITAT |
| `diet` | `Utensils` | DIET |
| `lifespan` | `Clock` | LIFESPAN |
| `physicalSize` | `Ruler` | SIZE (use `physicalSize.label` as the label text, uppercased) |
| `physicalWeight` | `Scale` | WEIGHT |
| `topSpeed` | `Zap` | TOP SPEED |
| `region` | `MapPin` | ORIGIN |

For `physicalSize`, `physicalWeight`, and `topSpeed`: row 2 shows `.value`, row 3 shows `.comparison` (if present).
For `habitat`: row 2 shows `animal.habitat`, row 3 shows `animal.habitatDetail` (if present, truncated to 1 line).
For `diet`: row 2 shows `animal.diet`, row 3 shows `animal.dietDetail` (if present, truncated to 1 line).
For `lifespan`: row 2 shows `animal.lifespan`, row 3 shows `animal.lifespanDetail` (if present, truncated to 1 line).
For `region`: row 2 shows `animal.region`. No row 3.

Row 3 truncation: `-webkit-line-clamp: 1; overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical`. This keeps the grid aligned.

**Minimum stat cells:** `habitat`, `diet`, `lifespan` are always rendered if their data is present (which it always is — they are required fields). The grid always has at least 3 cells.

**Grid layout adjustment:**
- If total cells is odd (e.g. 3 or 5), the last cell spans 2 columns: `grid-column: span 2`.
- If total cells is even (e.g. 4 or 6), standard 2-col grid.

#### 3.4.2 Taxonomy table (right column on iPad, or below stats on phone)

If `taxonomy` is null/undefined AND `scientificName` is null/undefined: the taxonomy column/section is absent entirely. The physical stats grid spans full width in this case.

Section label: "CLASSIFICATION" (hairline style).

Displayed as a definition list rendered as a table. Rows only for present fields. Show a maximum of 6 rows.

```
Row layout:   flex, justify-between, padding: 8px 0, border-bottom: 1px solid var(--border-s)
              Last row: no border-bottom
Label cell:   11px / 500 / var(--t3)
Value cell:   13px / 500 / var(--t1), text-align: right
```

Row order (skip row if field absent):
1. Kingdom
2. Class
3. Order
4. Family
5. Genus
6. Species (rendered in italics)

If `scientificName` is present, append below the table as a standalone line:
```
Label:  "SCIENTIFIC NAME" (hairline style, var(--t3), margin-top: 12px)
Value:  scientificName in italic, 15px / 500 / var(--t1)
```

---

### 3.5 Photo Gallery

Conditional: absent when `gallery` is null or empty.

Section label: "PHOTO GALLERY"

Layout: horizontal scroll row on phone. On iPad (≥768px): `grid-cols-3`, `gap: 8px`.

Each gallery image:
```
Aspect ratio:   4/3
Border-radius:  var(--r-md) (12px)
Object-fit:     cover
Background:     var(--elev) (while loading)
```

**Phone horizontal scroll:**
```
Display:        flex, flex-row
Overflow-x:     auto
Gap:            8px
Scrollbar:      hidden (scrollbar-width: none)
Snap:           scroll-snap-type: x mandatory; each item scroll-snap-align: start
Item width:     calc(80vw) — shows partial next image as affordance
```

**Interaction states:**
- No tap-to-fullscreen in this version. Images are view-only.
- Each image has a loading state: `var(--elev)` background visible while loading.
- No captions rendered (alt text is for screen readers only, not displayed).

**Accessibility:** Each image element has the `alt` text from `gallery[n].alt`. Gallery container has `role="list"` and each image wrapper has `role="listitem"`.

---

### 3.6 Amazing Adaptations

Conditional: absent when `adaptations` is null or empty.

Section label: "AMAZING ADAPTATIONS"

Layout: vertical list of adaptation items. Each item is a row:

```
Row:          flex, align-items: flex-start, gap: 12px, padding: 12px 0
              border-bottom: 1px solid var(--border-s) on all rows except last
Icon circle:  24px × 24px, background: var(--purple-sub), border-radius: 50%
              Lucide `Sparkles` icon, 12px, colour var(--purple-t)
Text:         14px / 400 / var(--t2), line-height 1.6
```

No "Read more" toggle. All adaptation items are shown (max 4 items from data).

---

### 3.7 Habitat

Conditional: absent when `habitatDetail` is null. This section is unchanged from current build — same image banner (3:1 aspect ratio) + description card below.

Current implementation is correct. No change needed.

---

### 3.8 Daily Life

Unchanged from current `AnimalDailyLife` component. No change needed.

---

### 3.9 Reproduction

Conditional: absent when `reproduction` is null.

Section label: "BABIES AND REPRODUCTION"

Layout: card surface (`var(--elev)`, `border: 1px solid var(--border-s)`, `border-radius: var(--r-lg)`, `padding: 16px`).

Inside the card, render a definition list grid: `grid-cols-2` on iPad and phone.
Each cell is a stat tile (same pattern as infobox stat cells, but smaller):

```
Background:   var(--card)
Border:       1px solid var(--border-s)
Radius:       var(--r-md)
Padding:      12px
```

Stat tile anatomy:
```
Label:  11px / 700 / uppercase / letter-spacing 1.5px / var(--t3)
Value:  15px / 600 / var(--t1), margin-top: 4px
```

Tiles to render (only those with values, in this order):

| Field | Icon | Label |
|---|---|---|
| `gestationPeriod` | `Calendar` | GESTATION |
| `litterSize` | `Baby` | LITTER SIZE |
| `offspringName` | `Heart` | BABIES CALLED |
| `ageAtIndependence` | `Star` | INDEPENDENCE |

For `offspringName`: value is capitalised (e.g. "Kitten", "Foal").

If `parentalCare` is present: render below the grid as a full-width text block.
```
Background:   var(--card)
Border:       1px solid var(--border-s)
Radius:       var(--r-md)
Padding:      12px
Font:         14px / 400 / var(--t2)
Line-height:  1.6
Margin-top:   8px
```

**Odd tile handling:** If 1 or 3 tiles render, the last tile spans 2 columns.

---

### 3.10 Predators

Conditional: absent when `predators` is null.

Section label: "PREDATORS"

**Empty array state (`predators === []`):** Show a single full-width "no predators" tile:
```
Background:   var(--amber-sub)
Border:       1px solid rgba(245,166,35,.3)
Radius:       var(--r-lg)
Padding:      16px
Icon:         Shield from lucide-react, 20px, var(--amber-t), inline-flex with text
Text:         "Apex predator — nothing hunts this animal in the wild."
Font:         14px / 500 / var(--amber-t)
```

**Non-empty array:** Display as a horizontal wrap of tinted pills:
```
Layout:       flex, flex-wrap, gap: 8px
Each pill:    Background: var(--red-sub), border: 1px solid rgba(239,70,111,.3), colour: var(--red-t)
              Font: 13px / 500, padding: 4px 12px, radius: 100px
              Icon: none — text only
```

No interaction on predator pills. Static only.

---

### 3.11 Where It Lives (Geographic Range)

Conditional: absent when `geographicRange` is null.

Section label: "WHERE IT LIVES"

Layout: single card (`var(--elev)`, `border: 1px solid var(--border-s)`, `border-radius: var(--r-lg)`, `padding: 16px`). No map image in this version — text only.

```
Icon row:     Globe from lucide-react, 16px, var(--blue-t), inline-flex with a "Region:" label (13px / 600 / var(--t3))
              region value: 13px / 500 / var(--t1) inline after colon
Separator:    margin-top: 10px, border-top: 1px solid var(--border-s)
Range text:   margin-top: 10px, 14px / 400 / var(--t2), line-height 1.6
```

---

### 3.12 Social Life

Unchanged from current `AnimalSocialLife` component. No change needed.

---

### 3.13 Conservation Status

Unchanged from current `AnimalConservationStatus` component. No change needed.

---

### 3.14 Care Needs OR Habitat Threats

Unchanged from current `AnimalCareOrThreats` component. No change needed.

---

### 3.15 Cultural Significance

Conditional: absent when `culturalSignificance` is null.

Section label: "DID YOU KNOW?"

Layout: card with a subtle aurora gradient left border accent:
```
Background:          var(--card)
Border:              1px solid var(--border-s)
Border-left:         3px solid var(--purple)
Border-radius:       var(--r-lg)
Padding:             16px 16px 16px 20px (extra left padding to account for the left border)
```

Inside: a single text block.
```
Font:       15px / 400 / var(--t2)
Line-height: 1.7
```

The purple left border is purely decorative and visual. No icon.

---

### 3.16 Fun Facts

Section label: "FUN FACTS"

Uses the existing `AnimalFunFacts` component unchanged if only `facts` (the array of 3 strings) is used.

**Enhancement:** if `facts` is present (the existing 3-item array from the base model), render those. If absent, this section renders a placeholder ("Facts coming soon.").

No change to component logic needed.

---

### 3.17 CTA Block

Unchanged from current `AnimalDetailCTA` component. `mt-8` before it.

---

## 4. iPad layout decisions (explicit per CLAUDE.md requirement)

### 4.1 Content column
`px-6 pt-4 pb-24 max-w-3xl mx-auto w-full`
At 1024px, `max-w-3xl` (768px) centres the column with ~128px on each side. This is correct — do not override.

### 4.2 Infobox — iPad two-column layout
At ≥768px: CSS Grid `grid-cols-2`, `gap: 24px`. Left column = stats grid. Right column = taxonomy.
This is a hard layout requirement. Do not collapse to single column on iPad.

The left column (stats grid) is itself a `grid-cols-2` inner grid. So on iPad the overall infobox reads as a 4-column stat grid on the left + classification table on the right.

### 4.3 Gallery — iPad grid
At ≥768px: `grid-cols-3`, `gap: 8px`. Phone: horizontal scroll row.

### 4.4 Reproduction tiles — iPad
`grid-cols-4` at ≥768px (shows all 4 tiles in one row). `grid-cols-2` below 768px.

### 4.5 Hero image
Same aspect ratio (16/9) on all breakpoints. At 1024px the hero image is approximately 732px wide × 412px tall — large enough to be impressive without being overwhelming.

---

## 5. Interaction states

### 5.1 All interactive elements have 44px minimum touch target
No interactive elements are introduced in this spec except the existing CTA buttons. All new content sections are read-only.

### 5.2 Gallery images
- Hover (desktop): slight border opacity increase (`border: 1px solid var(--border)`). No lift animation — images are not tappable, so lift would be misleading.
- Loading state: `var(--elev)` background visible while `<img>` loads.
- Error state: show paw-print fallback (matches existing AnimalImage component pattern).

### 5.3 Adaptation list items
- No interaction. Static read-only content.

### 5.4 Predator pills
- No interaction. Static read-only content.

### 5.5 Infobox stat cells
- No interaction. Static read-only content.
- No hover state (these are not interactive).

---

## 6. Sections with no data — absence rules

| Section | Null/undefined behaviour |
|---|---|
| Superpower Callout | Absent entirely — no placeholder |
| Infobox | Always renders (minimum 3 stat cells from required fields) |
| Taxonomy | Column/section absent if both `taxonomy` and `scientificName` are null |
| Gallery | Absent entirely — no placeholder |
| Adaptations | Absent entirely — no placeholder |
| Habitat | Absent if `habitatDetail` null — unchanged from current |
| Daily Life | Renders placeholder paragraph ("We're still learning about this animal's daily routine.") |
| Reproduction | Absent entirely — no placeholder |
| Predators | Absent if `predators` null; "apex predator" state if `predators` is `[]` |
| Geographic Range | Absent entirely — no placeholder |
| Social Life | Absent entirely — no placeholder |
| Conservation | Renders "Not Assessed" state — unchanged from current |
| Care/Threats | Absent entirely if null — unchanged from current |
| Cultural | Absent entirely — no placeholder |
| Fun Facts | Always renders — placeholder text if `facts` absent |
| CTA | Always renders |

**Rule:** Absent sections leave no visible gap. `mt-6` margin is set on the section itself, so when the section does not render, neither does its margin. FE must use the CSS pattern `{condition && <Section className="mt-6" />}` so both the content and the margin collapse together.

---

## 7. Accessibility notes

- All section headings are `<p>` elements styled as labels (hairline). The animal name in the modal header is the only `<h2>` on the page. This avoids heading hierarchy issues.
- All images have non-empty `alt` text.
- Gallery has `role="list"` + `role="listitem"`.
- Predator pills are inside a `role="list"` container with appropriate `aria-label="Predators"`.
- Infobox stat cells are inside a `role="list"` container, each `role="listitem"`, each with an `aria-label` composed from the label + value (e.g. `aria-label="Top speed: 112 km/h, about as fast as a car on a motorway"`).
- Taxonomy table uses `<dl>` `<dt>` `<dd>` semantics styled to appear as a table.
- Colour is never the sole indicator of meaning — all status pills (conservation, predators, rarity) have text labels.
- Touch targets for interactive elements (CTA buttons) remain ≥44px.
- `prefers-reduced-motion`: no animations are introduced in this spec. Gallery horizontal scroll is native browser behaviour.

---

## 8. PageHeader slot assignments

The animal detail modal uses its own glass header (already built — close button + animal name + rarity badge). This is not a PageHeader component. No slot assignments are needed — this spec does not introduce any header controls.

The scrollable content begins at `pt-4` below the modal header's bottom border.

---

## 9. Navigation ownership

No navigation controls are introduced in this spec. This page is a single-depth detail view. No tabs, no section switchers. The existing "back" behaviour (close button on modal header) is unchanged.

---

## 10. Filter pill style

No filter pills are introduced in this spec.

---

## 11. DS compliance checklist (pre-Phase C gate)

| Check | Status |
|---|---|
| All colours use `var(--...)` tokens or documented DS alpha composites | Verified |
| No emoji anywhere in spec — Lucide icons only | Verified |
| No ghost button variant | N/A — no buttons introduced |
| All touch targets ≥44px | N/A — no interactive elements in new sections |
| Content column `px-6 pt-4 pb-24 max-w-3xl mx-auto w-full` | Confirmed |
| Infobox uses `--card` surface on `--bg` | Correct — one level up |
| Reproduction tiles use `--card` inside an `--elev` card | Correct — two-level nesting |
| Gallery images: no captions, no overlays | Confirmed |
| Taxonomy uses `<dl>/<dt>/<dd>` semantics | Confirmed |
| Section labels are hairline style (11px/700/uppercase/1.5px) | Confirmed |
| No section headings use `<h2>` or `<h3>` | Confirmed — all are `<p>` elements |
| Absent sections leave no gap | Confirmed — margins on section element itself |

---

## 12. Open questions for Product Owner / Owner before Phase C

1. **Scientific name verification process:** Who is responsible for cross-checking `scientificName` values against ITIS before data authoring? The UX spec requires non-null values to always be correct — an incorrect scientific name is an educational error.
2. **Gallery images:** Where are additional images sourced? The `/public/Animals/` path structure exists, but there is no indication of whether additional images per animal are available for the enriched entries.
3. **Reproduction badge icon:** `Baby` from Lucide is available but may feel too generic. Confirm icon choice or substitute with `Users` (for offspring name/litter) — this is a data authoring question, not a design question.
4. **Animation parameters for gallery scroll:** The gallery horizontal scroll is native browser momentum scroll. No Framer Motion animation is introduced here. Confirm this is acceptable or flag if a snapping animation is required.
