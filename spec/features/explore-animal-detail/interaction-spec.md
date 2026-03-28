# Interaction Spec — explore-animal-detail

**Feature:** Full-screen animal profile modal expansion
**Phase:** A (UX)
**Date:** 2026-03-28
**Author:** UX Designer
**Status:** Draft — UR findings incorporated; owner-resolved decisions OQ-1 through OQ-4 applied. Awaiting Phase B (PO) and owner approval before Phase C.
**Last updated:** 2026-03-28 (owner-resolved decisions applied by UX Designer)

---

## Overview

Harry taps an animal card on the Explore screen. A BottomSheet opens with a summary
(the existing `AnimalProfileSheet`). A "Learn More" button on the sheet expands to a
full-screen modal showing rich educational content: diet detail, daily life, care needs,
lifespan detail, habitat, and fun facts.

This spec covers the transition, the full-screen layout, content anatomy, interaction
states, data model extension, and accessibility requirements.

Four owner-resolved decisions have been incorporated since the initial draft:
- OQ-1: Quiz timer pauses (does not reset) when the full-screen modal is open.
- OQ-2: The modal heading conditionalises on owned status — "Your [Name]" vs "[Name]".
- OQ-3: Transition confirmed as bottom-sheet-to-fullscreen push (slide up); shared-element
  `layoutId` rejected due to `createPortal` constraints documented in CLAUDE.md.
- OQ-4: Null/empty state policy is now per-section — hidden section for purely optional
  content, tasteful placeholder only for sections that have structural importance.

The data model now also accommodates the careNeeds/habitatThreats split: domestic
categories (At Home, Stables, Farm) use `careNeeds`; wild/sea/lost world categories
use `habitatThreats`. Both are represented as separate typed fields — no polymorphic
field with category-conditional casting.

---

## 1. Transition Design

### Decision: sheet slides away, full-screen modal pushes up as a new layer

**Options considered:**

Option A — shared-element morph (sheet scales/stretches to fill the screen)
Option B — sheet dismisses, full-screen modal pushes up from bottom (chosen)
Option C — full-screen slides over as a lateral layer

**Rationale for Option B:**

Option A (shared-element morph) requires coordinating layout measurements between two
separate components that do not share a DOM tree. Framer Motion's `layoutId` can
approximate this, but layout animations are sensitive to ancestor scroll containers and
the BottomSheet's `overflow: hidden` would clip the morphing hero image during the
expansion. The animation would require careful reparenting to avoid stacking context
issues. The risk of visual glitches is high relative to the payoff.

Option C (lateral slide) breaks the spatial metaphor. The sheet is already below the
content; the full-screen detail should feel like an expansion upward, not a lateral
navigation event.

Option B is the most robust choice given the DS motion system. The BottomSheet exits
downward (its natural exit direction), and the full-screen modal enters from below — a
continuous upward motion that reads as "going deeper" into the animal's profile. The two
animations overlap slightly in time, giving the impression of the sheet expanding rather
than two independent transitions.

**Animation parameters:**

Sheet exit (plays when "Learn More" is tapped):
```
y: "100%"
opacity: 0
duration: 200ms
easing: cubic-bezier(0.7, 0, 0.84, 0)   (ease-in — elements leaving)
```

Full-screen modal entry (begins 100ms after sheet exit starts — slight overlap):
```
initial: { y: "100%", opacity: 0 }
animate: { y: 0, opacity: 1 }
transition: { type: "spring", stiffness: 300, damping: 30 }
```

Full-screen modal exit (when user closes):
```
animate: { y: "100%", opacity: 0 }
transition: { duration: 300ms, easing: cubic-bezier(0.7, 0, 0.84, 0) }
```

**Reduced motion fallback:**
All transforms (`y`) are set to `0`. Opacity transitions only: fade in at 150ms, fade
out at 150ms. The `useReducedMotion` hook gates this, matching the existing pattern in
`AnimalProfileSheet`.

**Portal requirement:**
The full-screen modal must use `ReactDOM.createPortal(content, document.body)`. The
`AnimalProfileSheet` uses Framer Motion animated transforms on its parent. Any
`position: fixed` child of a `motion.*` element is at risk of stacking context
containment (DS portal pattern, non-negotiable).

**Implementation note for developer:**
The "Learn More" button calls a handler that:
1. Calls `onClose()` on the existing `AnimalProfileSheet` (triggers its exit animation)
2. After a 100ms delay, sets state that mounts the `AnimalDetailModal`

The 100ms delay creates the visual overlap. The `AnimalEntry` data is passed through
to the detail modal before the sheet exits so there is no data gap.

### OQ-3 decision record

The owner has confirmed: use the bottom-sheet-to-fullscreen push (slide up animation).
The shared-element `layoutId` approach is rejected. Rationale: `createPortal` moves the
full-screen modal to `document.body`, placing it outside the BottomSheet's React subtree.
A `layoutId` morph requires both elements to share a Framer Motion layout context at the
same tree level — this is not achievable once one element is portalled. Any attempt to
bridge the layout context across a portal boundary produces a jump-cut rather than a
smooth morph. The push animation achieves equivalent spatial continuity (upward motion =
going deeper) without the implementation risk.

### OQ-1: Quiz timer — pause on open, resume on close

The stealth quiz timer (8-second delay, 50% probability) that fires inside
`AnimalProfileSheet` must be paused when the full-screen modal opens and resumed when
the modal closes.

**Behaviour:**
- User taps "Learn More" → timer pauses at whatever value it has reached.
- `AnimalDetailModal` mounts. Timer is frozen.
- User taps Close on the detail modal → modal exits, `AnimalProfileSheet` is
  not re-opened (the sheet has already exited). Timer is discarded.

**Why discard rather than resume to sheet:**
The sheet exit animation runs before the detail modal mounts. By the time the user
closes the detail modal, the sheet is no longer in the DOM. There is no sheet to return
to — the user is back on the Explore grid. The quiz opportunity is therefore lost, not
resumed.

**Impact is acceptable:** The quiz fires on the BottomSheet, not on the full-screen
modal. A user who taps "Learn More" has already shown sufficient engagement with the
animal. If the quiz did not fire before they tapped "Learn More," it will not fire at
all for this session. This is preferable to resetting the timer on the detail modal
(which would penalise the user for engaging deeply) or firing the quiz on the detail
modal (which would interrupt reading).

**Developer action:** The parent `ExploreScreen` manages the quiz timer state. When
`onViewMore()` is called, the parent must call a timer pause/cancel function on the
sheet controller. No changes are required inside `AnimalDetailModal` itself — this is
purely a state management concern on the screen that owns both components.

---

## 2. Full-screen Layout

### No PageHeader component

The full-screen animal detail does not use the standard `PageHeader` component. A
`PageHeader` is for screen-level navigation inside the main app shell. This component is
a modal overlay — it has its own self-contained header strip.

**Top surface treatment:**
A sticky glass header strip occupies the top of the modal. It sits on the glass surface
level:
```
Background:   rgba(13,13,17,.80)
Border-bottom: 1px solid rgba(255,255,255,.06)
Backdrop-filter: blur(24px)
Position:     sticky top-0
Z-index:      10 (within the modal stacking context)
```
This uses `rgba(13,13,17,.80)` (modal variant), not `.88` (no-backdrop variant), because
the modal backdrop is present.

The glass header strip does not use `PageHeader` slots. It has two zones:
- Left zone: Back/close button
- Right zone: Rarity badge

**Content below header strip:**
First content element has `pt-4` (16px) clearance below the glass header border.

### Layout at 820px portrait (Harry's primary use case — iPad Pro 11-inch)

The modal fills the full viewport. Content is constrained to `max-w-3xl mx-auto w-full`
(max 768px wide, centred), which on an 820px-wide screen leaves 26px of breathing room
on each side.

```
┌─────────────────────────────────────────────────────────────────┐  position: fixed inset-0
│  GLASS HEADER STRIP  (sticky, top-0)                            │  rgba(13,13,17,.80) blur(24px)
│  [X Close]   ["Your [Name]" / "[Name]"]   [Rarity Badge]        │  height: 64px
├─────────────────────────────────────────────────────────────────┤  border-bottom 1px rgba(255,255,255,.06)
│                                                                 │  ↕ pt-4 gap (mandatory)
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  max-w-3xl mx-auto w-full  (px-6 pt-4 pb-24)            │   │
│  │                                                         │   │
│  │  HERO IMAGE                                             │   │
│  │  aspect-ratio 16:9, rounded-lg, full column width       │   │
│  │  (up to ~716px wide at 820px viewport)                  │   │
│  │                                                         │   │
│  │  CATEGORY BADGE + REGION ROW                            │   │
│  │  (mt-4, flex gap-2 flex-wrap)                           │   │
│  │                                                         │   │
│  │  SUPERPOWER CALLOUT (full-width, mt-4)                  │   │
│  │  Renders if superpower non-null; hidden otherwise        │   │
│  │                                                         │   │
│  │  QUICK STATS ROW                                        │   │
│  │  3-column grid: Habitat | Diet | Lifespan               │   │
│  │  (mt-4 grid grid-cols-3 gap-3)                          │   │
│  │                                                         │   │
│  │  CONTENT SECTIONS (stacked vertically, mt-6 gap-6)      │   │
│  │  Each section: icon + hairline heading + content        │   │
│  │                                                         │   │
│  │  1. Daily Life                                          │   │
│  │  2. Conservation Status                                 │   │
│  │  3. Social Behaviour                                    │   │
│  │  4. Care Needs  (domestic animals only)                 │   │
│  │     OR Habitat Threats  (wild/sea/lost world only)      │   │
│  │  5. Fun Facts                                           │   │
│  │                                                         │   │
│  │  (Habitat, Diet, Lifespan remain in Quick Stats Row)    │   │
│  │                                                         │   │
│  │  CTA (Generate / Marketplace)                           │   │
│  │  (mt-8 pb-24)                                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  (scrollable, content fills modal — no bottom nav visible)      │
└─────────────────────────────────────────────────────────────────┘
```

At 820px portrait the hero image is approximately 716px wide at 16:9 aspect ratio,
giving a height of approximately 403px. This is the richest view of the animal and
is the primary use case.

### Layout at 375px (phone — secondary target)

Hero image spans full column width. At 375px with `px-6` padding, the content column is
327px wide. At 16:9 the hero height is approximately 184px. The quick stats row
collapses to a single column (`grid-cols-1`) because 3 stat cards would be too narrow
to read comfortably. Content sections remain full-width stacked.

```
Breakpoint    Hero width    Hero height    Quick stats grid    Content sections
375px         327px         184px          grid-cols-1         single column
820px         716px         403px          grid-cols-3         single column
1194px        716px         403px          grid-cols-3         single column
```

Content column is capped at `max-w-3xl` (768px) on all breakpoints. On 1194px landscape
it centres with visible margin on both sides.

### Scroll behaviour

The full-screen modal scrolls vertically as a single continuous document. There are no
tabs or section switchers inside this modal — the user scrolls from top to bottom
through all content sections. This is intentional: section switching would add cognitive
load and require internal navigation state. A single scrollable layout is predictable.

The glass header strip is sticky within the scroll container (not fixed relative to
viewport) to avoid z-index conflicts. The header strip scrolls with the modal container's
stacking context but remains visible at the top as content scrolls beneath it.

The bottom CTA (Generate / Marketplace button) appears at the end of the scroll. It is
not fixed to the bottom of the screen — it lives in the document flow. This avoids
competing with the modal's glass surface and keeps the layout predictable.

---

## 3. Header Strip Anatomy

```
Height:         64px
Padding:        0 20px
Display:        flex
Align-items:    center
Justify:        space-between
```

**Left zone — Close button:**
- 44x44px touch target (accessibility minimum)
- Visual treatment: 32px circle, `background: var(--elev)`, icon `X` from Lucide at 18px,
  colour `var(--t3)`
- Hover: `background: var(--border)`, colour `var(--t1)`
- Active: `transform: scale(.97)`
- Focus: `outline: 2px solid var(--blue); outline-offset: 2px`
- aria-label: "Close animal profile"
- Role: button

**Centre zone — Animal name (OQ-2: conditional owned framing):**
- Typography: H4 (22px / 600), colour `var(--t1)`, truncated with ellipsis if overflow
- Centred between close button and rarity badge
- **Owned state:** When `animal.isOwned === true`, the heading reads "Your [Name]"
  (e.g., "Your Border Collie"). When unowned, it reads the plain name (e.g., "Border
  Collie"). The word "Your" is not styled differently — the full string uses H4 weight
  and colour. No possessive apostrophe-s; always "Your [Name]", never "[Name]'s Profile".
- **Truncation:** The full "Your [Name]" string is truncated with ellipsis if it
  overflows. The close button and rarity badge occupy fixed widths (44px + 8px gap each
  side); the centre zone takes the remaining width. This is adequate for all animal names
  in the current catalogue, but truncation must be tested at 375px where the centre zone
  is narrowest.

**Right zone — Rarity badge:**
- Uses existing `RarityBadge` component (already used in `AnimalProfileSheet`)
- No additional interaction state — it is decorative/informational here

---

## 4. Hero Image

```
Aspect ratio:   16:9
Border-radius:  var(--r-lg) (16px)
Object-fit:     cover
Background:     var(--elev) (placeholder while loading)
Width:          100% of content column
```

Uses the existing `AnimalImage` component. Alt text must be the animal's name plus
"photograph" (e.g., "Border Collie photograph").

**Fallback:** If image fails to load, the `AnimalImage` component renders its paw-print
SVG fallback on `var(--elev)` at 48px, centred. The fallback container maintains the
16:9 aspect ratio so layout does not shift.

**No rarity overlay on the hero image.** Rarity is communicated by the badge in the
header strip. Overlaying a rarity tint on the hero image obscures the photograph and
adds unnecessary visual noise for a child with autism.

---

## 5. Category Badge and Region Row

Appears immediately below the hero image (`mt-4`).

```
Display:        flex
Gap:            8px
Flex-wrap:      wrap
Align-items:    center
```

**Category badge:**
- Tint-pair pill: `background: var(--elev)`, `border: 1px solid var(--border-s)`,
  `color: var(--t3)`
- Typography: Hairline (11px / 700, uppercase, letter-spacing 1.5px)
- Padding: 4px 10px, radius 100px
- Not interactive

**Region indicator:**
- Lucide `MapPin` icon at 12px, colour `var(--t3)`
- Text: Body Sm (13px / 400), colour `var(--t3)`
- Gap between icon and text: 4px
- Not interactive

---

## 6. Quick Stats Row

Appears below the Superpower Callout (`mt-4`), or directly below the category/region
row if the Superpower Callout is absent (i.e., `superpower` is null).

Three stat cards in a grid. Each card shows one value with a label.

```
Grid:           grid-cols-3 gap-3       (820px and above)
Grid:           grid-cols-1 gap-3       (below 375px — phone)
```

**Each stat card:**
```
Background:     var(--card)
Border:         1px solid var(--border-s)
Border-radius:  var(--r-lg) (16px)
Padding:        16px
```

Label: Hairline (11px / 700, uppercase, letter-spacing 1.5px), colour `var(--t3)`,
margin-bottom 4px
Value: Body Lg (18px / 600), colour `var(--t1)`

The three stats are: Habitat (single word or short phrase from `animal.habitat`),
Diet (from `animal.diet`), Lifespan (from `animal.lifespan`).

These are the same three stats shown in the existing BottomSheet, promoted to a
dedicated visual treatment rather than an inline label-value row.

**Expanded detail text within each stat card (optional):**
If the corresponding detail field is non-null, a single expansion sentence appears
below the stat value inside the same card:
- Habitat card: `habitatDetail` — Body Sm (13px / 400), colour `var(--t3)`, `mt-2`
- Diet card: `dietDetail` — Body Sm (13px / 400), colour `var(--t3)`, `mt-2`
- Lifespan card: `lifespanDetail` — Body Sm (13px / 400), colour `var(--t3)`, `mt-2`

If the detail field is null, only the stat value is shown — no placeholder text, no
empty space. The card height adjusts naturally.

**Sections 7.1, 7.2, 7.3 are not separate content section cards.**
Habitat, Diet, and Lifespan content lives exclusively in the Quick Stats Row. Repeating
them as standalone section cards below would be duplication. The content section list
(Section 7) begins with Daily Life.

---

## 7. Content Section Anatomy

Each content section follows a consistent pattern:

```
Section container:
  margin-top: 24px (mt-6)
  padding: 20px
  background: var(--card)
  border: 1px solid var(--border-s)
  border-radius: var(--r-lg) (16px)

Section header (inside the card):
  display: flex
  align-items: center
  gap: 10px
  margin-bottom: 12px

  Icon circle:
    width: 32px
    height: 32px
    border-radius: 100px
    display: flex / align-items: center / justify-content: center
    Icon: Lucide, 16px, stroke-width 2

  Heading text: Hairline (11px / 700, uppercase, letter-spacing 1.5px), colour var(--t3)

Section content:
  Varies by section — see per-section detail below
```

### OQ-4: Null/empty state policy (owner-resolved)

The owner's resolution is: "tasteful placeholder or hidden section." This replaces the
previous always-render approach. The policy is now per-section:

**Sections that are structurally important (always render, show placeholder if null):**
These sections appear on every animal because their absence would feel like a broken
layout. The placeholder must feel intentional, not like missing data.

| Section | Null placeholder treatment |
|---------|---------------------------|
| Superpower Callout | Section is hidden entirely (see below — special case) |
| Daily Life | Section renders; content area shows Body Sm italic text in `var(--t3)`: "Not enough is known about this animal's daily habits yet." No icon. |
| Conservation Status | Section renders; content area shows the label "Not Assessed" in the neutral tint-pair (`var(--elev)` bg, `var(--t3)` text) + Body Sm in `var(--t3)`: "This animal hasn't been formally assessed yet." |

**Sections that are conditional (hide entirely if null):**
These sections only appear when data is present. Their absence does not leave a gap
because Harry has no expectation of seeing them.

| Section | Condition to render |
|---------|-------------------|
| Social Behaviour | Render only if `socialBehaviour` is non-null |
| Care Needs | Render only if `careNeeds` is non-null AND animal is domestic category |
| Habitat Threats | Render only if `habitatThreats` is non-null AND animal is wild/sea/lost world |

**Superpower Callout — special case:**
The superpower callout is visually prominent (see Section 7.0). If `superpower` is null,
the entire callout block is removed. The hero image is followed directly by the category
badge/region row without the callout. This is the correct choice: showing an empty
callout box under the hero image is jarring; hiding it leaves a clean layout.

**Fun Facts:**
The `facts` array (`[string, string, string]`) is a required field in the existing
`AnimalEntry` interface — it is never null. The Fun Facts section always renders.

**Impact on layout predictability:**
Autistic users benefit from consistent section order. The section order defined in
Section 7 (and in the layout diagram) is fixed — sections never reorder based on data
availability. When a section is hidden, the sections below it move up without any gap.
The order of visible sections is always a subsequence of the canonical order.

### 7.0 Superpower Callout

This is not a content section card. It is a distinct full-width callout that sits
between the hero image (with category/region row) and the Quick Stats Row.

**Render condition:** Only renders when `superpower` is non-null. If null, this block
is absent entirely and the layout flows directly from the category/region row to the
Quick Stats Row.

```
Position:       After category/region row (mt-4), before Quick Stats Row
Layout:         Full column width
Background:     var(--grad-aurora) at 12% opacity — implemented as:
                background: linear-gradient(135deg,
                  rgba(151,87,215,.12),
                  rgba(55,114,255,.12) 50%,
                  rgba(69,178,107,.12)
                )
Border:         1px solid rgba(255,255,255,.08)
Border-radius:  var(--r-lg) (16px)
Padding:        16px 20px
Display:        flex
Align-items:    flex-start
Gap:            12px
```

**Icon:**
- Lucide `Zap` at 20px, colour `var(--amber-t)`
- Wrapped in a 32x32px circle: `background: var(--amber-sub)`, radius 100px
- flex-shrink: 0 (never wraps under text)

**Label above text:**
- Hairline typography (11px / 700, uppercase, letter-spacing 1.5px), colour `var(--amber-t)`
- Text: "SUPERPOWER"

**Content text:**
- Body Md (16px / 500), colour `var(--t1)`, `leading-snug`
- Data source: `superpower` field — one sentence, maximum 25 words
- Do not wrap in quotes; do not add punctuation beyond what is in the data

**Rationale for this treatment:**
The UR findings rank `superpower` as the highest-engagement-yield content per word
for child readers (BBC Earth and NatGeo Kids pattern). Placing it above the content
section cards — immediately below the hero image — puts the most compelling fact in
the first visible viewport, maximising the chance Harry keeps reading. The aurora
gradient background distinguishes it visually from the plain `var(--card)` sections
below, signalling "this is special."

### 7.1, 7.2, 7.3 — Habitat, Diet, Lifespan

These are not standalone content section cards. See Section 6 (Quick Stats Row) for
the full specification of how Habitat, Diet, and Lifespan are displayed, including
the optional expansion text (`habitatDetail`, `dietDetail`, `lifespanDetail`).

The content section list (Section 7) begins at 7.0 (Superpower Callout) and continues
at 7.4 (Daily Life). There is no section card for Habitat, Diet, or Lifespan.

### 7.4 Daily Life

Icon: Lucide `Sun`
Icon circle tint pair: `background: var(--amber-sub)`, icon colour `var(--amber-t)`
Heading: "DAILY LIFE"

Content format: Bullet list. Maximum 3 bullets. Each bullet:
- Bullet marker: 6x6px circle, `background: var(--blue)`, `border-radius: 100px`,
  `margin-top: 6px`, `flex-shrink: 0`
- Text: Body Sm (13px / 400), colour `var(--t2)`, `leading-snug`
- Maximum 15 words per bullet

This matches the existing bullet pattern used for `facts` in `AnimalProfileSheet`, which
Harry has already been exposed to — consistent mental model.

Data source: new `dailyLife` field — array of strings, 1–3 items.

### 7.4b Conservation Status

**Render condition:** Always renders (with placeholder if null — see OQ-4 policy above).

Icon: Lucide `Globe` (represents the planet, conservation scope)
Icon circle tint pair: determined by status value (see table below)
Heading: "CONSERVATION STATUS"

**Status label and tint pair:**

| IUCN status value | Label to display | Icon circle bg | Icon colour | Pill bg | Pill text |
|-------------------|-----------------|----------------|-------------|---------|-----------|
| `LC` | Least Concern | `var(--green-sub)` | `var(--green-t)` | `var(--green-sub)` | `var(--green-t)` |
| `NT` | Near Threatened | `var(--amber-sub)` | `var(--amber-t)` | `var(--amber-sub)` | `var(--amber-t)` |
| `VU` | Vulnerable | `var(--amber-sub)` | `var(--amber-t)` | `var(--amber-sub)` | `var(--amber-t)` |
| `EN` | Endangered | `var(--red-sub)` | `var(--red-t)` | `var(--red-sub)` | `var(--red-t)` |
| `CR` | Critically Endangered | `var(--red-sub)` | `var(--red-t)` | `var(--red-sub)` | `var(--red-t)` |
| `EW` | Extinct in the Wild | `var(--purple-sub)` | `var(--purple-t)` | `var(--purple-sub)` | `var(--purple-t)` |
| `EX` | Extinct | `var(--purple-sub)` | `var(--purple-t)` | `var(--purple-sub)` | `var(--purple-t)` |
| `DD` | Data Deficient | `var(--elev)` | `var(--t3)` | `var(--elev)` | `var(--t3)` |
| `NA` or null | Not Assessed | `var(--elev)` | `var(--t3)` | `var(--elev)` | `var(--t3)` |

Status is stored as the IUCN short code (`LC`, `NT`, `VU`, etc.). The FE resolves
the display label from this lookup. Do not store the full label string in the data model.

**Content format:**
1. Status pill (tint-pair, not interactive, 12px / 600, padding 4px 10px, radius 100px)
2. Below the pill: 1 sentence of plain-language context from `conservationStatusDetail`
   field. Maximum 20 words. Written for a child ("This animal is safe and doing well in
   the wild." / "Scientists are worried there might not be many of these left.").

**Null state for `conservationStatusDetail`:**
If the detail sentence is null but the status code is present, show only the pill.
If both are null, show the "Not Assessed" pill + the placeholder sentence from OQ-4.

**Data accuracy note:**
The `conservationStatus` IUCN code must be accurate. An error here (stating LC when the
animal is CR) is an educational material error. Data authors must verify against the
IUCN Red List when populating this field. This is flagged to the Product Owner.

### 7.4c Social Behaviour

**Render condition:** Hidden if `socialBehaviour` is null (conditional section — see OQ-4).

Icon: Lucide `Users`
Icon circle tint pair: `background: var(--blue-sub)`, icon colour `var(--blue-t)`
Heading: "SOCIAL LIFE"

Note on heading label: "SOCIAL LIFE" is preferred over "SOCIAL BEHAVIOUR" because it is
more concrete and child-friendly. The UR finding (section 5b) flags that autistic readers
benefit from specific, non-abstract labels. "Behaviour" is abstract; "Life" connects to
the animal's existence rather than a category label.

Content format: Short prose. Maximum 2 sentences / approximately 40 words.
Data source: `socialBehaviour` field (string).

**Icon colour note — avoiding amber collision:**
Daily Life uses amber. Social Life uses blue. The UR finding (section 5a) identifies
that using the same icon circle colour for two adjacent sections creates a visual
processing problem for children with ADHD who rely on colour as a section handle.
Blue is unambiguous here; the blue tint pair is used nowhere else in this section list.

### 7.5 Care Needs / Habitat Threats (conditional split)

This section displays one of two variants depending on the animal's category:
- **Domestic variant** — displayed for animals in categories: "At Home", "Stables", "Farm"
- **Wild variant** — displayed for animals in categories: "Wild", "Sea", "Lost World"

Both variants share the same section card structure. They differ in icon, heading,
tint pair, and data source.

**Render condition for both variants:** Hidden if the relevant data field is null.

---

**Domestic variant — Care Needs:**

Icon: Lucide `Heart`
Icon circle tint pair: `background: var(--pink-sub)`, icon colour `var(--pink-t)`
Heading: "CARE NEEDS"

Content format: Visual difficulty indicator + bullet list.

Care difficulty indicator (above the bullets):
A row of three filled circles indicating difficulty level (1 = easy, 2 = moderate,
3 = demanding):
- Filled circle: 10x10px, `background: var(--pink)`, `border-radius: 100px`
- Empty circle: 10x10px, `background: var(--elev)`, `border: 1px solid var(--border)`,
  `border-radius: 100px`
- Gap between circles: 4px
- Accessible label: "Care difficulty: [level] out of 3", set as aria-label on the row

Level text: Body Sm (13px / 400), colour `var(--t3)`, `margin-left: 8px`, inline with
circles (e.g., "Easy", "Moderate", "Demanding").

Below the indicator: bullet list of 2–4 care requirement strings from `careNeeds` field.
Same bullet style as Daily Life. Maximum 15 words per bullet.

Data source: `careNeeds: string[] | null`, `careDifficulty: 1 | 2 | 3 | null`

---

**Wild variant — Habitat Threats:**

Icon: Lucide `AlertTriangle`
Icon circle tint pair: `background: var(--amber-sub)`, icon colour `var(--amber-t)`
Heading: "THREATS"

Content format: Bullet list only (no difficulty indicator — threat severity is not
scored in the same way as care difficulty).
- 1–3 bullet points from the `habitatThreats` field
- Same bullet style as Daily Life. Maximum 20 words per bullet (threats require slightly
  more context than care tips)

Data source: `habitatThreats: string[] | null`

**Rationale for the split:**
"Care needs" for a wild lion is a category error — it implies captive husbandry for an
animal that is not cared for by a human. "Habitat threats" is factually accurate and
educationally appropriate. For domestic animals, "habitat threats" is not meaningful —
a Border Collie's threats are not environmental. The data model maintains these as two
distinct nullable fields so the FE can render the correct variant without type-unsafe
conditional casting.

### 7.6 Fun Facts

Icon: Lucide `Sparkles`
Icon circle tint pair: `background: var(--purple-sub)`, icon colour `var(--purple-t)`
Heading: "FUN FACTS"

Content format: The existing `facts` array from `AnimalEntry` is the data source.
Rendered as the same bullet list pattern used in Daily Life and Care Needs.

The BottomSheet also shows facts. This is not duplication — the BottomSheet shows facts
as a teaser while the full-screen modal shows them in their full visual treatment within
a named section. The context (a dedicated educational screen) justifies the repetition.

---

## 8. CTA Section

Appears at the bottom of the scroll, after all content sections (`mt-8`).

Matches the existing CTA logic from `AnimalProfileSheet`:

**Ungated animals (common, uncommon):**
- Button: variant `accent`, size `lg`, full column width
- Label: "Generate this animal"
- Action: navigate to `/generate?type=...&breed=...` with modal closed

**Gated animals (rare, epic, legendary):**
- Button: variant `accent`, size `md`, full column width, icon `ShoppingBag` at 16px
- Label: "Find in Marketplace"
- Action: navigate to `/shop` with modal closed
- Supporting text below button: Body Sm (13px), colour `var(--t3)`, centred:
  "Common and Uncommon only — Rare and above from the marketplace"

---

## 9. Interaction States

### Close button
| State | Treatment |
|-------|-----------|
| Rest | 32px circle, `background: var(--elev)`, icon colour `var(--t3)` |
| Hover | `background: var(--border)`, icon colour `var(--t1)` |
| Active | `transform: scale(.97)` |
| Focus | `outline: 2px solid var(--blue); outline-offset: 2px` |

Touch target: 44x44px minimum (visual size 32px, hit area padded to 44px).

### Generate / Marketplace button
States defined by DS button spec (variant `accent`):
| State | Treatment |
|-------|-----------|
| Rest | `background: var(--pink)`, text `#fff` |
| Hover | `background: var(--pink-h)`, `box-shadow: var(--glow-pink)` |
| Active | `transform: scale(.97)` |
| Focus | `outline: 2px solid var(--blue); outline-offset: 2px` |
| Disabled | `opacity: .4; pointer-events: none` (not applicable — always enabled) |

### Scrollable content area
No custom scroll states. Native scroll behaviour. No scroll snapping (would feel
jarring in a reading context).

### Care difficulty indicator row
- Not interactive. `aria-label="Care difficulty: [level] out of 3"` on the wrapper.
- No hover/active states.

### All non-interactive badges and pills
No hover or active states. They are informational only.

### Focus order (keyboard / switch access)
1. Close button
2. Hero image (focusable only if it has a meaningful alt text — it does)
3. Generate / Marketplace button (at bottom of document)

The content sections are not interactive and do not receive focus. Logical reading order
follows document flow.

---

## 10. Data Model Extension

The following fields must be added to `AnimalEntry` in `src/data/animals.ts`.

All new fields are nullable. Data will be populated progressively — the UI must handle
null gracefully per the OQ-4 policy in Section 7. No existing field is modified.

### Full field table

| Field name | Type | Applies to | Notes |
|------------|------|------------|-------|
| `habitatDetail` | `string \| null` | All | 1–2 sentence description of where the animal lives. Max 40 words. |
| `dietDetail` | `string \| null` | All | 1–2 sentence description of what the animal eats. Max 40 words. |
| `lifespanDetail` | `string \| null` | All | 1 sentence of lifespan context. Max 20 words. |
| `superpower` | `string \| null` | All | 1 sentence superlative fact. Max 25 words. Most engaging/impressive thing about the animal. |
| `dailyLife` | `string[] \| null` | All | Array of 1–3 activity/behaviour strings. Max 15 words each. |
| `conservationStatus` | `'LC' \| 'NT' \| 'VU' \| 'EN' \| 'CR' \| 'EW' \| 'EX' \| 'DD' \| null` | All | IUCN Red List code. Store code, not display label. |
| `conservationStatusDetail` | `string \| null` | All | 1 sentence plain-language context. Max 20 words. Child-level reading. |
| `socialBehaviour` | `string \| null` | All | 1–2 sentences. Max 40 words. |
| `careNeeds` | `string[] \| null` | Domestic only (At Home, Stables, Farm) | Array of 2–4 care requirement strings. Max 15 words each. Must be null for wild/sea/lost world animals. |
| `careDifficulty` | `1 \| 2 \| 3 \| null` | Domestic only | Numeric difficulty: 1 = Easy, 2 = Moderate, 3 = Demanding. Paired with careNeeds — if careNeeds is null, this must also be null. |
| `habitatThreats` | `string[] \| null` | Wild/Sea/Lost World only | Array of 1–3 threat strings. Max 20 words each. Must be null for domestic animals. |

### Category routing rules

The FE must determine which variant of section 7.5 to render based on `animal.category`:

```ts
const DOMESTIC_CATEGORIES = ['At Home', 'Stables', 'Farm'] as const
const WILD_CATEGORIES = ['Wild', 'Sea', 'Lost World'] as const

const isDomestic = (animal: AnimalEntry) =>
  DOMESTIC_CATEGORIES.includes(animal.category as typeof DOMESTIC_CATEGORIES[number])
```

If `isDomestic(animal)` is true → render Care Needs variant (if `careNeeds` non-null).
If false → render Habitat Threats variant (if `habitatThreats` non-null).

Never render both variants for the same animal.

### TypeScript interface addition (developer to apply)

```ts
// New optional fields — add to AnimalEntry interface
// All nullable; data populated progressively

habitatDetail?: string | null
dietDetail?: string | null
lifespanDetail?: string | null
superpower?: string | null
dailyLife?: string[] | null
conservationStatus?: 'LC' | 'NT' | 'VU' | 'EN' | 'CR' | 'EW' | 'EX' | 'DD' | null
conservationStatusDetail?: string | null
socialBehaviour?: string | null

// Domestic categories only (At Home, Stables, Farm)
careNeeds?: string[] | null
careDifficulty?: 1 | 2 | 3 | null

// Wild/Sea/Lost World categories only
habitatThreats?: string[] | null

// Owned state — whether Harry has adopted this animal
isOwned?: boolean
```

Note on `isOwned`: this field is not stored in `animals.ts` — it is derived at runtime
from the player's collection state and merged onto the animal record before it is passed
as a prop to `AnimalDetailModal`. The interface addition here is for the prop type, not
for the static data file. The developer must not add `isOwned` to the data file.

The `facts` field already exists (`[string, string, string]`) and is used directly in
the Fun Facts section without modification.

---

## 11. PageHeader Slot Assignment

This feature does not use the standard `PageHeader` component.

The full-screen modal has a self-contained glass header strip (described in Section 3).

Slot assignment is not applicable. The header strip has two zones: close action (left)
and rarity badge (right). The animal name is centred between them and acts as the
screen title. There is no section switcher and no coin display.

The bottom tab bar is not visible inside the full-screen modal. The modal covers the
full viewport including the nav area. The close action is the sole exit mechanism.

---

## 12. Accessibility

Harry is autistic and has ADHD. The following requirements apply on top of WCAG 2.1 AA.

### Maximum prose length

| Section | Maximum |
|---------|---------|
| Superpower Callout | 1 sentence, 25 words |
| Habitat (Quick Stats expansion) | 2 sentences, approximately 40 words |
| Diet (Quick Stats expansion) | 2 sentences, approximately 40 words |
| Lifespan (Quick Stats expansion) | 1 sentence, approximately 20 words |
| Daily Life | 3 bullets, 15 words each |
| Conservation Status detail | 1 sentence, 20 words |
| Social Life | 2 sentences, approximately 40 words |
| Care Needs | 4 bullets, 15 words each |
| Habitat Threats | 3 bullets, 20 words each |
| Fun Facts | 3 bullets (existing `facts` array — already short) |

These limits are data-level constraints. The developer must not truncate text in the UI
with "..." or "read more" controls. If source data exceeds these limits, it must be
edited at the data layer before being committed to `animals.ts`.

### Visual chunking

Each content section is a distinct card with a coloured icon circle and a hairline
heading. The tint-pair colour of the icon circle is unique per section. This gives Harry
a visual "handle" for each section that does not rely on reading the heading text alone.

The icon circle colours are:
- Superpower Callout: amber (Zap icon — not a section card, treated as a distinct callout)
- Daily Life: amber (Sun icon — same hue as Superpower, but different icon and heading)
- Conservation Status: status-dependent (green/amber/red/purple — see Section 7.4b table)
- Social Life: blue (Users icon)
- Care Needs: pink (Heart icon — domestic animals only)
- Habitat Threats: amber (AlertTriangle icon — wild/sea/lost world only)
- Fun Facts: purple (Sparkles icon)

Note: Daily Life and the Superpower Callout both use amber, but they are separated by
the Quick Stats Row and are visually distinct (callout uses aurora gradient background,
Daily Life is a plain card). The icon shapes (Sun vs Zap) further differentiate them.
The UR concern about same-colour adjacent sections has been addressed by inserting
Conservation Status (status-coloured) and Social Life (blue) between Daily Life and
Care Needs / Habitat Threats, ensuring no two adjacent sections share a tint colour.

Colour is never the only differentiator — the icon shape and heading text also
distinguish sections. This satisfies WCAG SC 1.4.1.

### Reading level

Target: UK Year 5–6 reading level (ages 9–11). Approximately equivalent to Flesch-Kincaid
grade level 5. Short sentences, active voice, concrete nouns. No technical vocabulary
without context.

Data authors must follow this guidance when populating all new text fields:
`habitatDetail`, `dietDetail`, `lifespanDetail`, `superpower`, `dailyLife`,
`conservationStatusDetail`, `socialBehaviour`, `careNeeds`, and `habitatThreats`.

### Animation and motion

The `useReducedMotion` hook must gate all animation parameters (see Section 1). This is
already the pattern used in `AnimalProfileSheet`.

There are no looping animations in this modal. The entry animation is a single play.

### No timers

Consistent with the DS accessibility baseline: no countdown timers, no auto-dismissal
of content, no timed interactions anywhere in this modal.

### Touch targets

All interactive elements (close button, generate button) meet the 44x44px minimum. The
close button's visual size is 32px but its hit area must be padded to 44px.

### Screen reader

- Modal must trap focus when open (`aria-modal="true"`, `role="dialog"`)
- `aria-labelledby` set to the animal name element in the header strip
- The animal name element renders as its display string: "Your Border Collie" or
  "Border Collie" depending on owned state. The screen reader reads the full string.
  No additional aria-label needed — the displayed text is already meaningful.
- Close button has `aria-label="Close animal profile"`
- Care difficulty row has `aria-label="Care difficulty: [n] out of 3"` where n is the
  human-readable label ("Easy", "Moderate", or "Demanding")
- Conservation status pill has `aria-label="Conservation status: [full label]"` where
  full label is the expanded form (e.g., "Critically Endangered", not "CR")
- Hero image has `alt="[animal name] photograph"`
- Superpower callout text does not need a special aria treatment — it renders as a
  paragraph and will be read in document order
- Section cards are not interactive and do not need ARIA roles

---

## 13. Consistency Check

Before this spec is finalised, the following existing patterns have been verified:

**AnimalProfileSheet (existing):**
- Uses `RarityBadge` — this spec reuses it in the header strip. Consistent.
- Uses `AnimalImage` — this spec reuses it for the hero image. Consistent.
- Uses bullet list pattern for facts — this spec uses the same pattern for Daily Life,
  Care Needs, and Fun Facts. Consistent.
- Uses the same CTA logic (gated vs ungated). This spec mirrors it identically. Consistent.

**Card pattern:**
- Content sections use `var(--card)` with `1px solid var(--border-s)` and
  `var(--r-lg)` (16px radius). This matches the DS card pattern. Consistent.

**Stat cards (Quick Stats Row):**
- Same surface treatment as DS Stat Cards. Consistent.

**No existing full-screen animal detail component exists.** This is a net-new component.

---

## 14. Component and File Scope

This feature introduces one new component:

`src/components/explore/AnimalDetailModal.tsx`

The developer must:
1. Implement the modal as a portal to `document.body`
2. Accept `animal: (AnimalEntry & { isOwned?: boolean }) | null` and
   `onClose: () => void` as props. The `isOwned` field is derived by the parent screen
   at runtime and injected onto the animal record — it is not stored in `animals.ts`.
3. Import and reuse `AnimalImage`, `RarityBadge` from existing components
4. Reuse the existing `Button` component for CTAs
5. Respect the `useReducedMotion` hook for all animation parameters
6. Implement the DOMESTIC_CATEGORIES / WILD_CATEGORIES routing logic from Section 10
   to determine which variant of section 7.5 to render
7. Implement the IUCN status lookup from Section 7.4b to resolve status codes to
   display labels and tint pairs

The existing `AnimalProfileSheet` component receives one addition:
- A "Learn More" button (variant `outline`, size `md`) added below the existing facts
  section, above the CTA
- An `onViewMore: () => void` prop passed in from the parent screen
- The button is only shown when the modal is not already open (state managed by the
  parent Explore screen)

---

## Mandatory Spec Checklist

- [x] Every interactive element has defined hover, active, and focus states
      (close button: Section 9; CTA button: Section 9; no other interactive elements)
- [x] All colours reference DS tokens — no hardcoded hex values anywhere in this spec
      (Exception: aurora gradient in Superpower Callout uses alpha composites of DS
      token values, documented in Section 7.0 with explicit rgba values)
- [x] Glass rule stated for all fixed/absolute overlays
      (Section 1: portal requirement; Section 2 and Section 3: glass surface treatment)
- [x] iPad layout explicitly defined
      (Section 2: 820px portrait layout with measurements; layout diagram included)
- [x] All slot assignments named
      (Section 11: no PageHeader used; header strip zones named explicitly)
- [x] No emojis anywhere in the spec
- [x] pt-4 breathing room below sticky header defined
      (Section 2: "First content element has pt-4 (16px) clearance below the glass header border")
- [x] Content column max-w-3xl mx-auto w-full specified
      (Section 2: stated in layout description and layout diagram)
- [x] Interaction states for all interactive elements defined (Section 9)
- [x] Card anatomy defined for all content sections (Section 7, per-section, including
      new sections 7.0, 7.4b, 7.4c, and updated 7.5)
- [x] Overlay surface treatment stated (Sections 1 and 3)
- [x] Consistency check completed (Section 13)
- [x] Null/empty states defined per OQ-4 policy — per-section, not a single catch-all
      (Section 7: OQ-4 policy block; each section states its own render condition)
- [x] Data model extensions named, typed, and marked required vs nullable (Section 10)
      (Includes all five new rich fields, careNeeds/habitatThreats split, isOwned prop,
      IUCN status enum, and category routing rules)
- [x] Accessibility — prose limits, reading level, chunking, motion, touch targets,
      screen reader (Section 12, updated for new sections and OQ-2 owned state)
- [x] Framer Motion AnimatePresence mode="wait" not used for this feature
      (entry/exit are single components, no siblings competing for exit sequence)
- [x] Portal requirement stated (Section 1 and Section 14)
- [x] Reduced motion fallback defined (Section 1)
- [x] OQ-1 quiz timer behaviour documented (Section 1 — pause on open, discard on close,
      rationale explained, developer action identified)
- [x] OQ-2 owned state heading documented (Section 3 and Section 2 layout diagram,
      screen reader implications in Section 12)
- [x] OQ-3 transition decision record included with rationale (Section 1)
- [x] OQ-4 graceful degradation policy — per-section, not uniform catch-all
      (Section 7 OQ-4 block; hidden vs placeholder distinction documented)
- [x] careNeeds/habitatThreats split documented — separate typed fields, category
      routing rule, never both rendered simultaneously (Sections 7.5 and 10)
- [x] Conservation Status IUCN enum defined with all 8 possible values and tint pairs
      (Section 7.4b)
- [x] Social Behaviour icon colour conflict with Daily Life resolved — blue used for
      Social Life, amber for Daily Life, no two adjacent sections share a tint
      (Section 12 visual chunking note)
