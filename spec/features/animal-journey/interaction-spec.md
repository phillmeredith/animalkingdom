# Interaction Spec — animal-journey

**Feature:** Animal relationship types, CTA redesign, Generate screen entry points, My Animals differentiation
**Phase:** A (UX)
**Date:** 2026-03-28
**Author:** UX Designer
**Status:** Draft — awaiting UR findings, Phase B (PO), and owner approval before Phase C.

---

## Overview

This spec covers a targeted rethink of how Harry relates to animals across the app. It is a
cross-cutting change that touches four existing features: the Explore animal detail modal
(`AnimalDetailModal`), the Generate wizard (`GenerateScreen`), the My Animals screen
(`MyAnimalsScreen`), and the underlying data model in `animals.ts`.

The core insight from the owner's brief: not all animals can be pets. A dinosaur, a wild
lion, or a great white shark cannot be "adopted" in any meaningful sense. But Harry can
still connect with those animals — by learning about them, bookmarking them, and tracking
them as sightings. The journey for an observable animal must feel like real-world wildlife
discovery, not a failed adoption attempt.

Separately, the name generator has two completely different use cases that currently share
one undifferentiated entry point. Harry sometimes wants to name an animal he is adopting.
Sometimes he just wants cool name ideas for his Xbox characters. These are different
intentions and need different paths.

### What this spec changes

- `AnimalEntry` in `animals.ts`: adds one new field — `relationship`
- `AnimalDetailModal` (from `explore-animal-detail` spec): replaces the CTA section
  (Section 8 of that spec) for observable animals; adds a secondary "name ideas" affordance
- `AnimalProfileSheet`: replaces the bottom CTA button logic for observable animals
- `GenerateScreen`: redesigns the entry screen (the mode-selection gate before step 1 of
  the current wizard)
- `MyAnimalsScreen`: adds visual differentiation between pets and observed animals; adds
  an "observe" action path

### What this spec does NOT change

- The 7-step wizard flow inside GenerateScreen (steps 1–7, the option grids, the trader
  puzzle, the results screen, the adoption overlay) — this is unchanged
- The explore-animal-detail spec sections 1–7 (transition, layout, content sections,
  header strip anatomy) — unchanged
- Care actions on `PetDetailSheet` for adopted pets — unchanged
- The coin/spend model for adoption — unchanged
- The marketplace, auction, or rescue flows — unchanged
- The BottomSheet summary (`AnimalProfileSheet`) layout — only the CTA button changes

---

## 1. Animal Relationship Type Model

### 1.1 The two relationship types

Every animal in the catalogue has one of two relationship types:

| Type | Meaning | Categories |
|------|---------|-----------|
| `adoptable` | Harry can find, name, and own this animal as a pet | At Home, Stables, Farm, and select Sea animals (see 1.3) |
| `observable` | Harry can visit, observe, and track this animal but cannot own it as a pet | Wild, Lost World, and large/wild Sea animals |

The relationship type drives every CTA and collection treatment in the app. It is the single
source of truth for "can this be adopted?".

### 1.2 New field on AnimalEntry

Add one field to the `AnimalEntry` interface:

```ts
/**
 * Relationship type — controls CTA logic and My Animals treatment.
 * 'adoptable': can be adopted as a pet (named, cared for, owned).
 * 'observable': can be observed and tracked but not adopted.
 * If absent/null, derive from category using RELATIONSHIP_BY_CATEGORY.
 */
relationship?: 'adoptable' | 'observable'
```

The field is optional for backwards compatibility. Any animal without an explicit
`relationship` value is resolved at render time using a category lookup (see 1.3).
This means existing data files do not need to be touched before Phase C.

**Developer:** implement a resolution helper and export it from `animals.ts`:

```ts
export const RELATIONSHIP_BY_CATEGORY: Record<AnimalCategory, 'adoptable' | 'observable'> = {
  'At Home':    'adoptable',
  'Stables':    'adoptable',
  'Farm':       'adoptable',
  'Wild':       'observable',
  'Lost World': 'observable',
  'Sea':        'adoptable', // overridden per-animal where needed — see 1.3
}

export function getRelationship(animal: AnimalEntry): 'adoptable' | 'observable' {
  return animal.relationship ?? RELATIONSHIP_BY_CATEGORY[animal.category]
}
```

Every component that branches on relationship type must call `getRelationship(animal)`.
No inline category checks. No duplicated lookup tables.

### 1.3 Sea category split

Sea is the only category that contains both adoptable and observable animals. The default
for Sea is `adoptable` (fish, seahorses, clownfish — animals Harry could realistically
keep in a home aquarium). Animals that are clearly not aquarium-keepable (sharks, whales,
dolphins, octopuses, sea turtles) must have `relationship: 'observable'` set explicitly.

The data author decides which Sea animals are observable. The FE does not guess. If
`relationship` is absent on a Sea animal, it defaults to `adoptable`.

**Open question for PO (OQ-1):** Should we produce a list of Sea animals that need
`relationship: 'observable'` set during Phase C data entry? Flag to data author.

### 1.4 Lost World animals

All Lost World animals (dinosaurs and prehistoric creatures) are `observable`. They cannot
be found as pets by definition. The default derivation from `RELATIONSHIP_BY_CATEGORY`
handles this — no explicit field required for Lost World entries.

---

## 2. Journey Map — Explore to My Animals

### 2.1 Journey: Adoptable animal

```
Harry opens Explore
  → Browses grid of animal cards
  → Taps an At Home / Stables / Farm / aquarium Sea animal card
    → AnimalProfileSheet opens (BottomSheet)
      → Sees: image, name, facts, "Learn More" button
      → CTA in sheet: "Find a [AnimalType]" (primary, accent)
        → Goes to GenerateScreen with type/breed pre-filled (existing flow)
      OR
      → Taps "Learn More"
        → Sheet exits, AnimalDetailModal opens (full-screen)
          → Reads: superpower, habitat, diet, daily life, conservation, fun facts
          → CTA at bottom of scroll: "Find a [AnimalType]" (primary, accent)
          → Secondary affordance: "Name ideas for [AnimalType]" (text link)
            → Opens Generate wizard in standalone/explore mode, species pre-filled
  → Adopts via wizard → AdoptionOverlay → pet appears in My Animals under "In My Care"
```

### 2.2 Journey: Observable animal

```
Harry opens Explore
  → Browses grid of animal cards
  → Taps a Wild / Lost World / observable Sea animal card
    → AnimalProfileSheet opens (BottomSheet)
      → Sees: image, name, facts, "Learn More" button
      → CTA in sheet: "Add to My Sightings" (primary, accent)
        → Bookmarks to My Animals as observed; toast confirmation
      → Taps "Learn More"
        → Sheet exits, AnimalDetailModal opens (full-screen)
          → Reads: all content sections (including Habitat Threats)
          → CTA at bottom of scroll: "Add to My Sightings" (primary, accent)
          → Secondary affordance: "Name ideas for [AnimalType]" (text link)
            → Opens Generate wizard in standalone/explore mode, species pre-filled
  → Observed animal appears in My Animals under "My Sightings" section
```

### 2.3 Emotional arc

| Step | Adoptable | Observable |
|------|-----------|------------|
| Discovery | Curiosity + desire ("I want one!") | Wonder + awe ("Wow, look at that!") |
| Learning | Builds attachment through knowledge | Builds fascination through knowledge |
| Action | Excitement of finding/naming | Satisfaction of recording a sighting |
| Collection | Pride of ownership | Pride of discovery |

The observable journey must feel like a reward, not a consolation prize. "My Sightings"
is a genuine achievement — Harry has found and tracked a creature that cannot be tamed.
The copy and visual treatment must reinforce this, not frame it as a lesser outcome.

---

## 3. Animal Detail Modal CTA Redesign

This section replaces Section 8 of `spec/features/explore-animal-detail/interaction-spec.md`
entirely. All other sections of that spec (1–7, 9–11) are unchanged.

### 3.1 CTA logic

The CTA at the bottom of the `AnimalDetailModal` scroll is now driven by `getRelationship(animal)`,
not by rarity alone.

**Adoptable + ungated (common, uncommon):**
```
Primary button: variant 'accent', size 'lg', full column width
Label: "Find a [animal.animalType]"
Action: navigate to /generate?type=[animalType]&breed=[breed], modal closes
```

**Adoptable + gated (rare, epic, legendary):**
```
Primary button: variant 'accent', size 'md', full column width, icon ShoppingBag 16px
Label: "Find in Marketplace"
Action: navigate to /shop, modal closes
Supporting text (below button): Body Sm, var(--t3), centred:
  "Rare and above animals come from the marketplace"
```

**Observable (any rarity):**
```
Primary button: variant 'primary', size 'lg', full column width, icon Binoculars 16px
Label: "Add to My Sightings"
Action: save sighting record to DB (see Section 3.4), show toast, modal closes
No marketplace link — observable animals are not for sale
```

Secondary affordance — appears below the primary button on ALL animal types:
```
Container: mt-4, text-center
Element: inline text link (not a button component)
  Label: "Name ideas for [animal.animalType]"
  Typography: Body Sm (13px / 400), colour var(--blue-t)
  Underline: none at rest, underline on hover/focus
  Icon: none (a small icon would compete with the primary button for attention)
  Action: navigate to /generate?mode=explore&type=[animalType], modal closes
  aria-label: "Open name ideas for [animal.animalType]"
```

The secondary affordance is present on adoptable animals too. Harry might want name ideas
for a cat without adopting it right now.

### 3.2 CTA section layout

```
mt-8 (32px gap from last content section)

[Primary button — full column width]

[mt-4 — secondary affordance, text-center]
"Name ideas for [AnimalType]"    ← Body Sm, var(--blue-t)

[pb-24 — required bottom padding, clears fixed nav]
```

On the observable variant, there is no supporting text below the primary button (no
need to explain the marketplace — it's not relevant). The layout is cleaner.

### 3.3 Icon for "Add to My Sightings"

Use Lucide `Binoculars` at 16px, `stroke-width: 2`. This icon is semantically correct
for wildlife observation. Place it to the left of the label text (`gap-2`).

**Check:** Confirm `Binoculars` exists in the version of lucide-react used in this project
before Phase C. If not available, use `Eye` as a fallback. The developer must verify this
before choosing the icon — do not assume.

### 3.4 "Add to My Sightings" action

Tapping the button:
1. Writes a sighting record to the DB (see Section 6.4 for data model)
2. If the animal is already in My Sightings, the action is idempotent — it updates the
   `lastObservedAt` timestamp and increments `sightingCount`, does not create a duplicate
3. Shows a toast: type `success`, title "Added to My Sightings", message
   "[AnimalName] is now tracked under My Sightings"
4. Closes the modal (same as the adopt flow closes the modal)

If the DB write fails: shows toast type `error`, title "Something went wrong",
message "Could not save your sighting. Try again." Modal does not close on error.

### 3.5 AnimalProfileSheet CTA (BottomSheet summary)

The same CTA logic applies to the sheet's bottom button (the one that currently reads
"Generate this animal" or "Find in Marketplace" on the `AnimalProfileSheet`):

- Adoptable ungated: "Find a [AnimalType]" (accent, existing behaviour, label updated)
- Adoptable gated: "Find in Marketplace" (existing behaviour, unchanged)
- Observable: "Add to My Sightings" (primary, new behaviour — same action as 3.4)

The "Learn More" button on the sheet is unchanged for all animal types.

**Note on label consistency:** The existing CTA label "Generate this animal" is being
renamed to "Find a [AnimalType]" across both the sheet and the detail modal. This aligns
with the owner's framing: Harry is "finding" the animal in the world, not generating a
digital object. The word "Generate" should not appear in user-facing copy for the
adoption CTA. It is a system term, not a player experience term.

---

## 4. Generate Screen Redesign

The `GenerateScreen` currently begins at step 1 (category selection). This spec adds
a mode-selection gate before step 1. The gate is rendered when the screen is opened
without a `mode` query param or animal pre-fill.

### 4.1 Entry modes

| Mode | Param | Meaning |
|------|-------|---------|
| Adopt | `mode=adopt` | Harry wants to name and adopt an animal — begins the standard 7-step wizard |
| Explore | `mode=explore` | Harry just wants name ideas — same 7-step wizard but no adoption step at the end |
| (pre-filled) | `type=...&breed=...` | Deep-linked from animal detail — skips the gate, uses existing pre-fill logic |

When `mode` is absent and no `type` pre-fill is present, the gate screen is shown.
When `mode` is present, the gate is skipped and the wizard begins at the appropriate step.
When `type` is present (deep-link), the existing pre-fill logic runs unchanged — mode
defaults to `adopt` for adoptable animals, `explore` for observable animals, determined
from `getRelationship()` on the linked animal.

### 4.2 Gate screen layout

The gate appears where step 1 of the current wizard appears. It uses the same
`WizardHeader` component with the title "What do you want to do?" and step indicator
hidden (this is not a wizard step — it is a pre-wizard choice).

```
┌─────────────────────────────────────────────────────────────────┐
│  WIZARD HEADER                                                  │
│  "What do you want to do?"                                      │
│  [no step indicator]                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  px-6 pt-4 pb-24 max-w-3xl mx-auto w-full                      │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  ADOPT MODE CARD                                         │   │
│  │                                                          │   │
│  │  [PawPrint icon, 32px, var(--pink-t)]                    │   │
│  │  "Name an animal to adopt"                               │   │   Body Lg, var(--t1)
│  │  "Pick an animal, name it, and bring it home."           │   │   Body Sm, var(--t3)
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  mt-4                                                           │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  EXPLORE MODE CARD                                       │   │
│  │                                                          │   │
│  │  [Sparkles icon, 32px, var(--blue-t)]                    │   │
│  │  "Just exploring names"                                  │   │   Body Lg, var(--t1)
│  │  "Browse name ideas without adopting anything."          │   │   Body Sm, var(--t3)
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Mode card anatomy

Both cards share this structure. The card IS the interactive element — the whole card
is tappable, not a button inside a card.

```
Background:     var(--card)
Border:         1px solid var(--border-s)
Border-radius:  var(--r-lg) (16px)
Padding:        20px
Display:        flex
Align-items:    flex-start
Gap:            16px
```

**Icon well (left column):**
```
Width/height:   56px
Border-radius:  var(--r-md) (12px)
Display:        flex / align-items: center / justify-content: center
flex-shrink:    0
```

Adopt card icon well: `background: var(--pink-sub)`, icon `PawPrint` 28px `var(--pink-t)`
Explore card icon well: `background: var(--blue-sub)`, icon `Sparkles` 28px `var(--blue-t)`

**Text column (right):**
- Title: Body Lg (18px / 600), colour `var(--t1)`, margin-bottom 4px
- Description: Body Sm (13px / 400), colour `var(--t3)`, leading-snug

**Chevron:**
- Lucide `ChevronRight` at 20px, colour `var(--t3)`, `ml-auto`, `flex-shrink: 0`,
  `align-self: center`

**Interaction states:**

| State | Treatment |
|-------|-----------|
| Rest | As above |
| Hover | `border-color: var(--border)`, `background: var(--elev)` |
| Active | `transform: scale(.98)`, `transition: transform 150ms` |
| Focus | `outline: 2px solid var(--blue); outline-offset: 2px` |

Both cards animate with `motion-safe:hover:-translate-y-0.5` and the standard DS card
hover pattern. See DS card hover spec.

**Touch target:** The full card is the touch target. Minimum height enforced at 88px
to meet WCAG 2.1 AA touch target guidance for a child user.

**aria-label:** "Name an animal to adopt" / "Just explore name ideas". Role: `button`
(or `<button>` element wrapping the card — do not use `div` with `onClick` without
adding `role="button"` and `tabIndex="0"`).

### 4.4 Mode selection behaviour

**Adopt card tapped:**
- Sets `mode=adopt` in URL (`?mode=adopt`)
- Advances to step 1 of the existing wizard (category selection)
- Wizard behaviour from step 1 onwards is unchanged
- At the results screen, "Adopt [Name]" button is present (existing behaviour)

**Explore card tapped:**
- Sets `mode=explore` in URL (`?mode=explore`)
- Advances to step 1 of the existing wizard (category selection)
- Wizard steps 1–7 are identical to adopt mode
- At the results screen, "Adopt [Name]" button is ABSENT
  - In its place: "Save name idea" button (variant `primary`) — saves the name to a
    lightweight name-ideas list (see OQ-2)
  - Supporting text: "Saved to your name ideas — find them in My Animals"
- The `TraderPuzzle` does NOT appear in explore mode (it is gatekeeping adoption, not
  name ideas)

**Open question for PO (OQ-2):** Where do saved name ideas live? Options:
  a. In `nameHistory` (existing history list, already in the DB)
  b. A new lightweight table
  c. The existing `savedNames` flow but with a flag marking it as "idea only" (no pet
     record created)
  The UX preference is (c) — it means the name appears in My Animals with a visual
  treatment that says "name idea, not yet adopted" — but this has data model implications.
  PO to decide before Phase C.

### 4.5 Deep-link from animal detail pages

When the "Name ideas for [AnimalType]" link on `AnimalDetailModal` is tapped:
- Navigates to `/generate?mode=explore&type=[animalType]`
- The gate screen is skipped (mode is already set)
- The wizard pre-fills `animalType` and advances to step 2 or 3 as per existing
  pre-fill logic
- No `breed` is pre-filled from the detail page (the user is exploring names,
  not adopting a specific breed)

When the "Find a [AnimalType]" button on `AnimalDetailModal` is tapped for an adoptable
animal:
- Navigates to `/generate?mode=adopt&type=[animalType]&breed=[breed]`
- Gate screen is skipped
- Existing pre-fill logic handles the rest (unchanged)

---

## 5. My Animals Screen Redesign

### 5.1 Two sections in the Animals tab

The Animals tab in `MyAnimalsScreen` currently shows a flat list of adopted pets. It
gains two named sections:

**Section 1: "In My Care"**
- Contains all pets with `source` in `['generate', 'marketplace', 'auction', 'rescue']`
  and `status: 'active'`
- These are the animals Harry has named and owns
- Existing `PetCard` component, unchanged visual treatment
- Section header: see 5.3

**Section 2: "My Sightings"**
- Contains observed animals (new sighting records — see 6.4)
- Different card treatment: `SightingCard` (new component — see 5.4)
- Section header: see 5.3
- Empty state: hidden entirely if Harry has no sightings (section does not appear)

The two sections are separated by a section header row, not a divider line. There is no
horizontal rule or border between them — the section header provides the visual break.

### 5.2 Filter pills update

The existing filter pills (`All`, `At Home`, `Stables`, etc.) currently filter across
all pets. After this change, the filter pills operate on the active section.

When the "In My Care" section is visible, the pills filter across pets.
When the "My Sightings" section is visible, the pills filter across sightings by category.

This means the pills remain in the `below` slot of `PageHeader`, unchanged in visual
treatment. Their behaviour is scoped to whichever section has content matching the active
filter.

If Harry has no pets in the active category filter but has sightings in that category
(or vice versa), only the relevant section is shown. If no content matches at all,
the existing empty state for the Animals tab is shown.

**Alternative considered and rejected:** A tab switcher between "Pets" and "Sightings".
This was rejected because it requires Harry to navigate between tabs rather than seeing
his whole collection at a glance. The owner's brief positions observed animals as part
of My Animals — not a separate screen. A single scrollable list with sections keeps
everything visible.

### 5.3 Section header anatomy

Both section headers follow the same pattern. They are not interactive.

```
Container: mt-6 mb-3
Display: flex, align-items: center, gap: 8px

[Icon, 16px, var(--t3)]
[Section title: Body Md (16px / 600), var(--t1)]
[Count pill: tint-pair pill, var(--elev) bg, var(--border-s) border, var(--t3) text,
             Body Sm (12px / 500), padding 2px 8px, radius 100px]
```

"In My Care" section header:
- Icon: Lucide `Heart`, 16px, `var(--pink-t)`
- Title: "In My Care"
- Count pill: shows number of pets (e.g., "3")

"My Sightings" section header:
- Icon: Lucide `Binoculars`, 16px, `var(--blue-t)` (or `Eye` if Binoculars unavailable)
- Title: "My Sightings"
- Count pill: shows number of observed animals (e.g., "7")

If "In My Care" is empty (Harry has no pets), the section header still renders with
count "0" — this signals to Harry that he can adopt animals, rather than hiding the
concept entirely.

If "My Sightings" is empty, the section header and section are both hidden.

### 5.4 SightingCard component

This is a new component. It is visually differentiated from `PetCard` to signal the
different relationship type.

```
Background:     var(--card)
Border:         1px solid var(--border-s)
Border-radius:  var(--r-lg) (16px)
Padding:        12px
Display:        flex
Align-items:    flex-start
Gap:            12px
```

The card uses a horizontal list layout (image left, info right) — not the vertical
aspect-ratio card layout used by `PetCard`. This is intentional: the sighting card
represents a real-world encounter, not a named possession. The compact horizontal layout
reads as a "log entry" rather than an ownership card.

**Left column — image thumbnail:**
```
Width: 64px
Height: 64px
Border-radius: var(--r-md) (12px)
Object-fit: cover
Background: var(--elev) (loading placeholder)
flex-shrink: 0
```

**Right column — info:**

Row 1: Animal name in Body Md (16px / 600), `var(--t1)`, with a rarity badge inline
(existing `RarityBadge` component, same as used in AnimalProfileSheet)

Row 2: Category badge — tint-pair pill, same treatment as category badge in
`AnimalDetailModal` (Hairline, 11px, uppercase). Shows the category name.

Row 3: "Last spotted [relative date]" — Body Sm (13px / 400), `var(--t3)`, Lucide
`MapPin` icon at 12px inline-left. Example: "Last spotted 2 days ago"

Row 4 (conditional): If `sightingCount > 1` — "Spotted [n] times" in Body Sm (13px),
`var(--blue-t)`. If `sightingCount === 1`, this row is absent.

**No name badge on the card.** Observed animals are not named. If Harry has used the
name wizard to generate ideas for this species, those names are not displayed here —
name ideas and sightings are separate concepts.

**No care need indicators.** Sighting cards have no care streak, no care actions, no
difficulty indicator.

**Tapping a SightingCard:**
Opens a read-only `SightingDetailSheet` (new component — BottomSheet). See Section 5.5.

**Hover/Active states** (same DS card pattern as `PetCard`):
```
motion-safe:hover:-translate-y-0.5
hover:shadow-[0_4px_24px_rgba(0,0,0,.25)]
hover:border-[var(--border)]
motion-safe:active:scale-[.97]
transition-all duration-300
```

**Grid layout:**
```
375px:   grid-cols-1 (single column, full width cards)
768px+:  grid-cols-2 (two-column grid, matching PetCard grid)
```

### 5.5 SightingDetailSheet

A read-only BottomSheet. Uses the compact header row pattern from `PetDetailSheet`
(image thumbnail left, info right — as specified in the BottomSheet image pattern rule
in CLAUDE.md).

Content:
- Header row: `w-20 h-20 rounded-xl` image + name + rarity badge + category
- "Where they live" row: region from `AnimalEntry.region`, with `MapPin` icon
- "Conservation status" row: shows status pill (from `AnimalEntry.conservationStatus`)
  if available, else omitted
- "You've spotted this [n] times" — sightingCount rendered in Body Md
- "First spotted" and "Last spotted" dates — Body Sm, `var(--t3)`

CTA at the bottom of the sheet:
- Primary: "Learn more about [AnimalType]" — navigates to Explore, filtered to this
  animal's category and pre-opening its `AnimalDetailModal`
- Secondary text link: "Name ideas for [AnimalType]" — same affordance as the detail
  modal secondary action (Section 3.1)

There are no care actions, no rename options, and no sell/release options on this sheet.
The animal is not owned. The only actions are learn more and name ideas.

**Interaction states on sheet buttons:**
Same as other BottomSheet primary buttons — variant `primary`, size `lg`, full width.
Text link follows the same treatment defined in Section 3.1 for the secondary affordance.

---

## 6. Data Model Changes

### 6.1 AnimalEntry — new field

Add to `src/data/animals.ts`:

```ts
export interface AnimalEntry {
  // ... all existing fields unchanged ...

  /**
   * Relationship type — controls CTA and My Animals treatment.
   * Absent/null = derive from RELATIONSHIP_BY_CATEGORY lookup.
   * Sea animals that are not aquarium-keepable must set this explicitly to 'observable'.
   */
  relationship?: 'adoptable' | 'observable'
}
```

Add the helper and constant also defined in Section 1.2:

```ts
export const RELATIONSHIP_BY_CATEGORY: Record<AnimalCategory, 'adoptable' | 'observable'>
export function getRelationship(animal: AnimalEntry): 'adoptable' | 'observable'
```

No other changes to `AnimalEntry`. All fields from the `explore-animal-detail` spec
data model extension (Section 10 of that spec) are retained as specified there.

### 6.2 SavedName — no changes

The `SavedName` interface and `savedNames` table are unchanged. Adopted pets continue
to use this table. Observable animals are NOT stored in `savedNames`.

### 6.3 Generate wizard — mode tracking

The `GenerateScreen` wizard needs to know whether it is in adopt or explore mode.
This is handled via the `mode` URL param — no DB schema change required.

For the "Save name idea" action in explore mode (if PO approves option (c) from OQ-2),
the implementation approach is TBD pending PO decision. Do not start Phase C for the
explore mode save action until OQ-2 is resolved.

### 6.4 New: ObservedAnimal table

Add a new table to the Dexie schema for sighting records.

```ts
export interface ObservedAnimal {
  id?: number
  animalId: string           // matches AnimalEntry.id
  animalName: string         // AnimalEntry.name (denormalised for display)
  animalType: string         // AnimalEntry.animalType
  category: AnimalCategory   // AnimalEntry.category
  rarity: Rarity             // AnimalEntry.rarity
  imageUrl: string           // AnimalEntry.imageUrl
  firstObservedAt: Date
  lastObservedAt: Date
  sightingCount: number      // increments on each re-observation
}
```

Index: `++id, animalId, category`
Unique constraint on `animalId` (one record per species — re-observation updates the
existing record, does not insert a duplicate).

DB version bump required. Developer to apply the migration in `src/lib/db.ts` following
the existing upgrade pattern.

**Note on denormalisation:** `animalName`, `animalType`, `category`, `rarity`, and
`imageUrl` are stored in the record rather than being joined from `animals.ts` at render
time. This is intentional — it ensures sighting cards render correctly even if the animal
catalogue is updated or the animal entry is removed. The denormalised data reflects what
Harry saw when he added the sighting.

### 6.5 Existing DOMESTIC_CATEGORIES / WILD_CATEGORIES constants

These constants remain in `animals.ts` unchanged. They are still used by the
`explore-animal-detail` spec for the Care Needs / Habitat Threats section split. The new
`getRelationship()` helper is additive — it does not replace these constants.

---

## 7. Interaction States — New and Changed Elements

### "Add to My Sightings" button (AnimalDetailModal and AnimalProfileSheet)

| State | Treatment |
|-------|-----------|
| Rest | variant `primary`: `background: var(--blue)`, text `#fff` |
| Hover | `background: var(--blue-h)`, `box-shadow: var(--glow-blue)` |
| Active | `transform: scale(.97)` |
| Focus | `outline: 2px solid var(--blue); outline-offset: 2px` |
| Loading (while DB write is in flight) | `opacity: .7`, `pointer-events: none`, spinner icon replaces left icon |
| Error | Button returns to rest state; error toast fires |

**Note on button variant:** "Add to My Sightings" uses `primary` (blue) not `accent` (pink).
Pink (`accent`) is reserved for adoption/purchase CTAs throughout the app. Blue (`primary`)
signals an informational/tracking action without coin cost. This distinction must be
maintained consistently — it is a semantic signal, not a stylistic preference.

### "Name ideas for [AnimalType]" text link

| State | Treatment |
|-------|-----------|
| Rest | Body Sm (13px), `var(--blue-t)`, no underline |
| Hover | underline, `var(--blue-t)` |
| Active | `opacity: .7` |
| Focus | `outline: 2px solid var(--blue); outline-offset: 2px` |

### Mode selection gate cards (Generate screen)

States defined in Section 4.3 above.

### SightingCard

States defined in Section 5.4 above.

### Section header rows (My Animals)

Not interactive. No hover or active states. `aria-hidden: false` — the text is
meaningful and must be read by screen readers.

### "Learn more about [AnimalType]" button on SightingDetailSheet

| State | Treatment |
|-------|-----------|
| Rest | variant `primary`, size `lg`, full width |
| Hover | `background: var(--blue-h)`, glow |
| Active | `transform: scale(.97)` |
| Focus | `outline: 2px solid var(--blue); outline-offset: 2px` |

---

## 8. What Changes vs What Stays — Component Change Log

### Changes to existing components

**`src/data/animals.ts`**
- ADD: `relationship?: 'adoptable' | 'observable'` to `AnimalEntry` interface
- ADD: `RELATIONSHIP_BY_CATEGORY` constant
- ADD: `getRelationship()` exported helper function

**`src/lib/db.ts`**
- ADD: `ObservedAnimal` interface
- ADD: `observedAnimals` table to Dexie schema (new DB version)

**`src/components/explore/AnimalDetailModal`** (from explore-animal-detail spec)
- CHANGE: Section 8 (CTA) logic — replace rarity-only gate with relationship + rarity gate
- ADD: Secondary "Name ideas for [AnimalType]" text link below primary button
- The rest of the modal (sections 1–7, header strip, hero image, content sections) is unchanged

**`src/components/explore/AnimalProfileSheet`** (existing BottomSheet summary)
- CHANGE: CTA button logic — observable animals get "Add to My Sightings" instead of
  "Generate this animal" / "Find in Marketplace"
- The "Learn More" button, image, facts list, and sheet layout are unchanged

**`src/screens/GenerateScreen.tsx`**
- ADD: Pre-wizard gate screen (mode selection) — rendered when no `mode` param and no
  `type` pre-fill
- ADD: `mode` state variable (`'adopt' | 'explore' | null`)
- CHANGE: Results screen — "Adopt [Name]" button hidden when `mode === 'explore'`
- CHANGE: TraderPuzzle — skipped when `mode === 'explore'`
- The 7-step wizard steps (OptionGrids, WizardHeader, step logic) are unchanged

**`src/screens/MyAnimalsScreen.tsx`**
- CHANGE: Animals tab — replace flat `PetCard` list with two-section layout
  ("In My Care" / "My Sightings")
- ADD: Section header rows
- ADD: `SightingCard` grid below the section header
- The Items tab is unchanged

### New components

**`src/components/my-animals/SightingCard.tsx`** — card component for observed animals
**`src/components/my-animals/SightingDetailSheet.tsx`** — read-only BottomSheet for sightings

### New hooks

**`src/hooks/useObservedAnimals.ts`** — CRUD for `observedAnimals` table:
- `addSighting(animal: AnimalEntry): Promise<void>` — insert or upsert
- `getSightings(): Promise<ObservedAnimal[]>` — all records
- `getSightingByAnimalId(animalId: string): Promise<ObservedAnimal | undefined>`

All async operations must follow the error-handling pattern from CLAUDE.md: `try/catch`
with `toast({ type: 'error', ... })`. No silent swallows.

---

## 9. iPad Layout Decisions

All new UI elements must be designed for iPad Pro 11-inch (820px portrait CSS width)
as the primary device.

**Mode selection gate (GenerateScreen):**
- Content column: `max-w-3xl mx-auto w-full px-6`
- The two mode cards stack vertically on all breakpoints (they are not side-by-side)
- On 820px the cards are `max-w-3xl` wide (768px cap), centred, with 26px margins

**My Animals two-section layout:**
- Section headers: full column width
- "In My Care" pet grid: `grid-cols-1 md:grid-cols-2` — on 820px, two-column grid
- "My Sightings" sighting grid: `grid-cols-1 md:grid-cols-2` — on 820px, two-column grid
- Gap between the two sections: `mt-8` (32px)

**SightingDetailSheet:**
- Follows the same modal sizing as `PetDetailSheet` — glass surface, `max-w-3xl mx-auto`
  on wide viewports

**Content top padding** below `PageHeader`:
- My Animals Animals tab: `px-6 pt-4 pb-24 max-w-3xl mx-auto w-full` — `pt-4` mandatory,
  content must not sit flush against the glass header border

---

## 10. Accessibility

The following requirements are in addition to the base WCAG 2.1 AA requirement.

**Observable vs adoptable distinction:**
- The relationship type must be communicated to screen readers, not implied by visual
  treatment alone
- `SightingCard`: add `aria-label="[AnimalName], observed animal"` to distinguish it
  from pet cards which have `aria-label="[AnimalName], your pet"`
- "Add to My Sightings" button: `aria-label="Add [AnimalName] to My Sightings"` (avoids
  ambiguity about what is being added)

**Mode selection gate:**
- Both cards use `role="button"` with descriptive `aria-label` (see Section 4.3)
- Focus order: Adopt card → Explore card

**SightingDetailSheet:**
- Follows the same focus trap and modal accessibility pattern as `PetDetailSheet`
- Close button: `aria-label="Close [AnimalName] sighting details"`

**Section headers in My Animals:**
- Use `role="heading" aria-level="2"` — they are structural headings within the Animals tab

**Name ideas link:**
- `aria-label="Open name ideas for [AnimalType]"` (Section 3.1)
- Meets 44px touch target minimum despite being a text link — add padding to the link
  container to reach 44px height. The visual appearance is a text link; the touch target
  is padded.

---

## 11. Open Questions for PO

**OQ-1 — Sea animals list:** Which Sea animals should have `relationship: 'observable'`
set explicitly? A data authoring decision is needed before Phase C so the correct CTAs
appear in the build. Suggestion: sharks, whales, dolphins, sea turtles, octopuses,
jellyfish. PO to confirm or revise.

**OQ-2 — Explore mode saved names:** Where do names saved in explore mode live?
  (a) `nameHistory` table — already exists, minimal change
  (b) New `nameIdeas` table — cleanest model, requires DB version bump
  (c) `savedNames` with an `ideaOnly: boolean` flag — shows in My Animals as "idea",
      requires changes to all savedNames queries to filter correctly
  UX preference is (a) — name history is already the lightweight log of generated names.
  Explore mode names go into history the same way adopt mode names do. No new table, no
  new concept. The "Save name idea" button in explore mode is functionally the same as
  "save to history" in adopt mode. PO to confirm.

**OQ-3 — Sighting in My Animals without Explore visit:** Can Harry add an animal to
My Sightings from the AnimalProfileSheet (BottomSheet summary) without viewing the full
detail modal? The spec currently allows this (the CTA is present on the sheet for
observable animals). Is this the right journey, or should we require "Learn More" before
observing? UX position: allow it from the sheet — friction should be minimal. Harry
expressing interest at the sheet level is enough.

**OQ-4 — SightingDetailSheet "learn more" navigation:** Navigating to Explore and
pre-opening an animal's detail modal from a deep link requires the Explore screen to
accept a `?animal=[id]` query param and auto-open the modal on mount. This is new
routing behaviour. Is this in scope for this feature? Alternative: "learn more" navigates
to Explore only (not directly to the modal). UX preference: go direct to the modal — it
is the more useful outcome for Harry. PO to confirm whether the routing change is in
scope or deferred.

**OQ-5 — "In My Care" section when empty:** If Harry has no pets, should the section
header still show? The spec (Section 5.3) says yes, with count "0". The rationale is that
it signals to Harry that pets can be adopted. Confirm this is acceptable or if an empty
section header creates a confusing layout when Harry is new to the app.

---

## 12. Design Rationale — Key Decisions

**Why not a third relationship type (e.g., "rescuable")?**
The owner's brief establishes a binary: Harry can bring it home, or he can only observe
it. Rescue is an existing `source` value on `SavedName` — it is an acquisition path, not
a relationship type. A rescued animal is still an owned pet. Two types is the minimum
necessary model.

**Why "My Sightings" rather than "Observed" or "Bookmarked"?**
"My Sightings" frames the observation as an achievement — Harry has found a creature in
the wild. "Observed" is clinical. "Bookmarked" is a digital metaphor that breaks the
real-world framing. "Sightings" is the term used by real wildlife trackers and is
accessible to an 8–12-year-old.

**Why is "Add to My Sightings" free (no coin cost)?**
Observation is exploration, not acquisition. Charging coins for adding a sighting would
penalise curiosity and create a friction point at exactly the moment Harry is most engaged
with learning. The coin economy is for ownership (pets, items). Discovery has no price.

**Why does the mode gate appear before the wizard, not as a result-screen choice?**
If the gate appeared after the wizard, Harry would complete 7 steps and then be asked
"what do you want to do with this name?". That is the wrong order — the adoption intent
should be declared upfront because it affects the TraderPuzzle (which appears mid-wizard
for adopt mode). Pre-declaring mode also sets Harry's expectation before he invests time
in the wizard.

**Why are mode cards vertical stacks rather than side-by-side on iPad?**
Side-by-side cards would be visually equal-weight. The verbal descriptions ("name an
animal to adopt" vs "just exploring") need to be readable without crowding. On an 820px
screen, two cards at ~380px each would be readable, but the vertical stack is more
scannable and consistent with the rest of the wizard's single-column layout. This is a
considered decision, not a default. PO may override.

**Why does the "Name ideas" affordance appear as a text link rather than a second button?**
A second full-width button below the primary CTA would create ambiguity about which is
the "real" action. The text link is visually subordinate — it is an optional path, not an
equal alternative. This is the correct information hierarchy. Harry's eye goes to the
button first; if he wants name ideas instead, the link is there and findable.
