# Refined Stories — explore-animal-detail

**Feature:** Full-screen animal profile modal
**Phase B — Product Owner**
**Date:** 2026-03-28
**Status:** Ready for Owner approval before Phase C

---

## Story map

| # | Story | Deliverable | Owner | Depends on | Priority |
|---|-------|-------------|-------|------------|----------|
| EAD-1 | Data model extension | `AnimalEntry` TypeScript interface updated | Dev | — | P0 |
| EAD-2 | Modal shell and transition | `AnimalDetailModal` component, portal, animation | FE + Dev | EAD-1 | P0 |
| EAD-3 | Quiz timer integration | `ExploreScreen` timer pause/discard on modal open | Dev | EAD-2 | P0 |
| EAD-4 | Header strip and hero section | Glass header, close button, name, rarity badge, hero image | FE | EAD-2 | P1 |
| EAD-5 | Superpower callout and quick stats | Aurora callout block, three-stat grid | FE | EAD-4 | P1 |
| EAD-6 | Daily Life and Conservation Status sections | Two always-visible content section cards | FE | EAD-4 | P1 |
| EAD-7 | Social Life, Care Needs / Threats, Fun Facts sections | Three conditional/always content section cards | FE | EAD-6 | P1 |
| EAD-8 | CTA section | Generate / Marketplace button, gating logic | FE | EAD-2 | P1 |
| EAD-9 | Owned-state personalisation | "Your [Name]" heading conditional | FE | EAD-4 | P2 |
| EAD-10 | Graceful degradation | Null-state rendering for all nullable fields | FE | EAD-6, EAD-7 | P1 |

**Sequencing rules:**
- EAD-1 must be merged before any Phase C work begins. Dev cannot start EAD-3 without a compiled interface.
- EAD-2 is the shell story. EAD-4 through EAD-10 are all content within that shell.
- EAD-3 (timer integration) can be built in parallel with EAD-4 onwards once EAD-2 is complete.
- EAD-10 (graceful degradation) acceptance criteria are verified against EAD-6 and EAD-7 output.

---

## EAD-1 — Data model extension

```
As a Developer building the detail modal,
I need the AnimalEntry TypeScript interface to carry the eleven new nullable fields
defined in the interaction spec,
So that I can type the data layer correctly before any UI work begins
and other engineers cannot build against an incomplete interface.
```

**Acceptance criteria:**

- [ ] `AnimalEntry` in `src/data/animals.ts` gains the following optional fields, all nullable:
  `habitatDetail?: string | null`
  `dietDetail?: string | null`
  `lifespanDetail?: string | null`
  `superpower?: string | null`
  `dailyLife?: string[] | null`
  `conservationStatus?: 'LC' | 'NT' | 'VU' | 'EN' | 'CR' | 'EW' | 'EX' | 'DD' | null`
  `conservationStatusDetail?: string | null`
  `socialBehaviour?: string | null`
  `careNeeds?: string[] | null`
  `careDifficulty?: 1 | 2 | 3 | null`
  `habitatThreats?: string[] | null`
- [ ] No existing field is modified or removed.
- [ ] Existing ANIMALS array entries compile without error — all new fields are optional and absent entries are treated as `undefined` (which the UI handles identically to `null`).
- [ ] At least two sample animals in the ANIMALS array are enriched with representative data for each new field so that the FE can build and test against real values without placeholder stubs:
  - One domestic animal (e.g. Beagle) with `careNeeds`, `careDifficulty`, `superpower`, `dailyLife`, `conservationStatus`, `conservationStatusDetail`, `socialBehaviour`.
  - One wild animal (e.g. a Wild or Sea entry) with `habitatThreats`, `superpower`, `dailyLife`, `conservationStatus`, `conservationStatusDetail`, `socialBehaviour`.
- [ ] The `DOMESTIC_CATEGORIES` and `WILD_CATEGORIES` constant arrays are exported from `animals.ts`:
  `export const DOMESTIC_CATEGORIES = ['At Home', 'Stables', 'Farm'] as const`
  `export const WILD_CATEGORIES = ['Wild', 'Sea', 'Lost World'] as const`
- [ ] The data accuracy note for `conservationStatus` from the interaction spec is reproduced as a JSDoc comment on the field: IUCN codes must be verified against the IUCN Red List; "LC" must not be used as a placeholder.
- [ ] TypeScript build (`tsc --noEmit`) passes with no new errors.

**Definition of done:**
TypeScript builds clean. At least two enriched sample animals are present. No existing animal entry is broken.

**Out of scope:**
- Enriching the full catalogue with new field data. This is a separate authoring work stream, not a Phase C deliverable.
- AI-generated content. Out of scope for Phase C entirely.

---

## EAD-2 — Modal shell and transition

```
As Harry browsing an animal's summary sheet,
I need tapping "Learn More" to open a full-screen modal with a smooth upward transition,
So that the shift from summary to detail feels like going deeper into the same animal,
not navigating to a new screen.
```

**Acceptance criteria:**

- [ ] A "Learn More" button exists in `AnimalProfileSheet`. Label is exactly "Learn More". Uses variant `outline`, size `md`. Placed below the facts list, above any quiz component.
- [ ] Tapping "Learn More" triggers the transition sequence:
  1. The sheet begins its exit animation (`y: "100%"`, `opacity: 0`, 200ms ease-in).
  2. After a 100ms delay (overlap), `AnimalDetailModal` mounts and begins its entry animation (`y: "100%" → 0`, `opacity: 0 → 1`, spring stiffness 300 damping 30).
  3. The `AnimalEntry` data is passed to the modal before the sheet exits — no data gap or re-fetch.
- [ ] `AnimalDetailModal` uses `ReactDOM.createPortal(content, document.body)`. The component must not render inside the BottomSheet React subtree.
- [ ] The modal renders `position: fixed; inset: 0` covering the full viewport. The bottom nav is not visible while the modal is open.
- [ ] Closing the modal (via close button) plays the exit animation (`y: "100%"`, `opacity: 0`, 300ms ease-in). The `AnimalProfileSheet` is NOT re-opened. The user returns to the Explore grid.
- [ ] `useReducedMotion` hook is checked. When reduced motion is preferred, all `y` transforms are set to `0` and only opacity transitions are used (150ms fade in, 150ms fade out).
- [ ] The modal mounts with `document.body.style.overflow = 'hidden'` via the project's reference-counted scroll lock mechanism, and releases the lock on unmount.
- [ ] The modal background is `rgba(13,13,17,1)` (full-screen modal sits on top of the backdrop — the backdrop is the existing page content, not an additional overlay).
- [ ] `aria-modal="true"` and `role="dialog"` are set on the modal root element.
- [ ] `aria-label="Animal profile"` is set on the modal root element (updated to the animal name in EAD-4).

**Definition of done:**
Sheet exits down. Modal enters from below. Both animations play simultaneously with 100ms overlap. Portal confirmed by inspecting the DOM — the modal node is a direct child of `document.body`. Scroll lock applied and released correctly.

**Out of scope:**
- Shared element / layoutId morph transition. Rejected in OQ-3; see interaction spec section 1.
- The modal's content sections. Those are EAD-4 through EAD-8.

---

## EAD-3 — Quiz timer integration

```
As a Developer responsible for the ExploreScreen state,
I need the stealth quiz timer to pause when the detail modal opens and discard on modal close,
So that the quiz logic does not fire while Harry is reading the full-screen profile,
and the timer state is cleaned up correctly when he returns to the Explore grid.
```

**Acceptance criteria:**

- [ ] The quiz timer in `AnimalProfileSheet` is managed via `timerRef` (already implemented as a `useRef<ReturnType<typeof setTimeout>>`). When "Learn More" is tapped, `clearTimeout(timerRef.current)` is called before the sheet's `onClose()` fires.
- [ ] `setQuizVisible(false)` is called at the same point, ensuring the quiz cannot appear mid-transition.
- [ ] The parent component (`ExploreScreen`) does not attempt to re-open `AnimalProfileSheet` or restore the quiz timer after the detail modal closes. The timer is discarded, not paused and resumed.
- [ ] When the detail modal closes, focus returns to the Explore grid (not to a ghost sheet). The animal that was being viewed remains visible in the grid.
- [ ] No new timer or quiz trigger fires on the `AnimalDetailModal` itself. The detail modal is purely educational — it does not host a quiz.
- [ ] An `onViewMore` callback prop is added to `AnimalProfileSheet` with type `() => void`. The parent passes this handler. The sheet calls it after clearing the timer and before calling `onClose()`.
- [ ] The `ExploreScreen` `onViewMore` handler:
  1. Stores the current `selectedAnimal` reference.
  2. Calls `setSelectedAnimal(null)` (closes the sheet).
  3. Sets `detailAnimal` state to the stored reference (mounts the detail modal after the 100ms delay).
- [ ] `AnimalDetailModal` receives `onClose` prop. When called, it sets `detailAnimal` to `null`.

**Definition of done:**
Timer is cleared before the sheet exits. No quiz fires mid-transition or on the detail modal. On modal close, the user is on the Explore grid with no residual sheet or quiz state. Verified by opening the sheet, waiting 5 seconds, tapping "Learn More", waiting 10 seconds on the detail modal, closing — no quiz appears at any point.

**Out of scope:**
- Triggering a quiz from within the detail modal. Not in scope for this feature.
- Resetting the quiz timer when the sheet re-opens for the same animal. The existing deduplication (`shownQuizIds`) handles this.

---

## EAD-4 — Header strip and hero section

```
As Harry viewing the full-screen animal profile,
I need a clear header with a close button and the animal's name,
and a large hero photograph below it,
So that I immediately recognise which animal I am reading about and can easily exit.
```

**Acceptance criteria:**

- [ ] Glass header strip is sticky within the modal scroll container (`position: sticky; top: 0; z-index: 10`).
- [ ] Header background: `rgba(13,13,17,.80)`, `backdrop-filter: blur(24px)`, `border-bottom: 1px solid rgba(255,255,255,.06)`. Height: 64px. Padding: `0 20px`. Layout: `flex; align-items: center; justify-content: space-between`.
- [ ] Left zone: Close button. Visual: 32px circle, `background: var(--elev)`, Lucide `X` icon at 18px, colour `var(--t3)`. Touch target: 44x44px. `aria-label="Close animal profile"`. Hover: `background: var(--border)`, icon colour `var(--t1)`. Active: `transform: scale(.97)`. Focus: `outline: 2px solid var(--blue); outline-offset: 2px`.
- [ ] Centre zone: Animal name. Typography H4 (22px / 600), colour `var(--t1)`, truncated with ellipsis on overflow. The string is the plain animal name at this stage (owned-state personalisation is EAD-9). Centred between the fixed-width left and right zones.
- [ ] Right zone: `RarityBadge` component using `animal.rarity`. No hover or active state — decorative only.
- [ ] First content element has `pt-4` (16px) clearance below the glass header border. Content column uses `px-6 pt-4 pb-24 max-w-3xl mx-auto w-full`.
- [ ] Hero image: `AnimalImage` component, `aspect-ratio: 16/9`, `border-radius: var(--r-lg)`, `object-fit: cover`, `width: 100%`. Alt text: "[animal name] photograph" (e.g. "Border Collie photograph"). Fallback: paw-print SVG on `var(--elev)` background, maintains 16:9 ratio.
- [ ] No rarity colour overlay on the hero image.
- [ ] At 375px: layout is correct, centre zone truncates gracefully, hero height ~184px.
- [ ] At 820px: hero height ~403px, all three header zones visible without overflow.
- [ ] `aria-label` on the modal root is updated to "Animal profile — [animal name]".

**Definition of done:**
Header strip and hero render at both 375px and 820px. Close button meets touch target minimum. Image fallback tested by breaking `imageUrl`. Sticky header confirmed to remain visible on scroll.

**Out of scope:**
- Content sections below the hero image. Those are EAD-5, EAD-6, EAD-7.
- "Your [Name]" personalisation. That is EAD-9.

---

## EAD-5 — Superpower callout and quick stats row

```
As Harry reading an animal's profile,
I need to see the animal's most impressive fact highlighted above the stats,
and a clean row of three stat cards showing habitat, diet, and lifespan,
So that the most engaging information is in the first viewport and I can quickly absorb
the key facts without reading any of the longer sections.
```

**Acceptance criteria:**

- [ ] **Superpower callout** renders when `animal.superpower` is non-null. When `superpower` is null, the block is absent entirely — no empty box, no placeholder.
  - Position: after the category/region row (`mt-4`), before the quick stats row.
  - Background: `linear-gradient(135deg, rgba(151,87,215,.12), rgba(55,114,255,.12) 50%, rgba(69,178,107,.12))`.
  - Border: `1px solid rgba(255,255,255,.08)`. Border-radius: `var(--r-lg)`. Padding: `16px 20px`.
  - Layout: `flex; align-items: flex-start; gap: 12px`.
  - Icon: Lucide `Zap` at 20px. Wrapped in 32x32px circle: `background: var(--amber-sub)`, `border-radius: 100px`. `flex-shrink: 0`.
  - Label above text: "SUPERPOWER", Hairline typography (11px / 700, uppercase, letter-spacing 1.5px), colour `var(--amber-t)`.
  - Content text: `animal.superpower` string. Body Md (16px / 500), colour `var(--t1)`, `leading-snug`. Not wrapped in quotes.
- [ ] **Category badge and region row** renders immediately below the hero image (`mt-4`).
  - Category badge: tint-pair pill — `background: var(--elev)`, `border: 1px solid var(--border-s)`, colour `var(--t3)`. Hairline typography (11px / 700, uppercase, letter-spacing 1.5px). Padding: `4px 10px`, radius 100px. Not interactive.
  - Region: Lucide `MapPin` at 12px, colour `var(--t3)`. Text: Body Sm (13px / 400), colour `var(--t3)`. Gap 4px. Not interactive.
  - Layout: `flex; gap: 8px; flex-wrap: wrap; align-items: center`.
- [ ] **Quick stats row** renders below the superpower callout (or below the category/region row if `superpower` is null). `mt-4`.
  - At 820px and above: `grid grid-cols-3 gap-3`.
  - Below 375px and at 375px: `grid grid-cols-1 gap-3`.
  - Each stat card: `background: var(--card)`, `border: 1px solid var(--border-s)`, `border-radius: var(--r-lg)`, `padding: 16px`. Not interactive.
  - Label: Hairline (11px / 700, uppercase, letter-spacing 1.5px), colour `var(--t3)`, `margin-bottom: 4px`.
  - Value: Body Lg (18px / 600), colour `var(--t1)`. Source: `animal.habitat`, `animal.diet`, `animal.lifespan`.
  - If `habitatDetail` / `dietDetail` / `lifespanDetail` is non-null, the expansion sentence renders below the value: Body Sm (13px / 400), colour `var(--t3)`, `mt-2`. If null, no text, no placeholder, no extra space.
- [ ] At 375px the quick stats grid collapses to single column. Stat values are legible (not truncated).
- [ ] At 820px all three stat cards are visible in one row.
- [ ] The category badge tint-pair does not use solid `var(--blue)` fill. It uses the neutral elev/border-s/t3 treatment specified above.

**Definition of done:**
Superpower callout visible on an enriched animal, absent on an unenriched animal. Quick stats render in 3-column grid at 820px and 1-column at 375px. Expansion sentences visible when data present, absent when null.

**Out of scope:**
- Habitat, Diet, Lifespan content section cards. Those three stats exist only in the Quick Stats Row (no duplication as section cards).
- Authoring `habitatDetail`, `dietDetail`, `lifespanDetail` for the full catalogue.

---

## EAD-6 — Daily Life and Conservation Status sections

```
As Harry reading about an animal,
I need a "Daily Life" section showing what the animal does each day, and a
"Conservation Status" section telling me if the animal is at risk,
So that I learn something genuinely new beyond the sheet summary, and understand
why some animals matter more urgently than others.
```

**Acceptance criteria:**

- [ ] **Section card pattern** is consistent across both sections:
  - Container: `margin-top: 24px`, `padding: 20px`, `background: var(--card)`, `border: 1px solid var(--border-s)`, `border-radius: var(--r-lg)`.
  - Section header: `display: flex; align-items: center; gap: 10px; margin-bottom: 12px`.
  - Icon circle: 32x32px, `border-radius: 100px`, `display: flex; align-items: center; justify-content: center`. Lucide icon at 16px, stroke-width 2.
  - Heading: Hairline (11px / 700, uppercase, letter-spacing 1.5px), colour `var(--t3)`.

- [ ] **Daily Life section** always renders (with placeholder if `dailyLife` is null — see graceful degradation story EAD-10 for null treatment).
  - Icon: Lucide `Sun`. Icon circle: `background: var(--amber-sub)`, icon colour `var(--amber-t)`.
  - Heading: "DAILY LIFE".
  - Content when `dailyLife` is non-null: bullet list. Each bullet:
    - Bullet marker: 6x6px circle, `background: var(--blue)`, `border-radius: 100px`, `margin-top: 6px`, `flex-shrink: 0`.
    - Text: Body Sm (13px / 400), colour `var(--t2)`, `leading-snug`.
    - Maximum 3 bullets rendered; if the data array contains more, only the first 3 are shown.
  - `dailyLife` field is treated as an array of strings.

- [ ] **Conservation Status section** always renders (with placeholder if both `conservationStatus` and `conservationStatusDetail` are null — see EAD-10).
  - Icon: Lucide `Globe`. Icon circle tint pair determined by `conservationStatus` value per the interaction spec lookup table (Section 7.4b). When status is null, uses `var(--elev)` / `var(--t3)`.
  - Heading: "CONSERVATION STATUS".
  - Status pill: tint-pair (not solid fill), 12px / 600, padding `4px 10px`, radius 100px. Pill background and text colour from the same lookup table. Not interactive.
  - Display label resolved from IUCN code: LC → "Least Concern", NT → "Near Threatened", VU → "Vulnerable", EN → "Endangered", CR → "Critically Endangered", EW → "Extinct in the Wild", EX → "Extinct", DD → "Data Deficient", null → "Not Assessed". The lookup lives in a constant map in the component or a shared util — not inline string literals spread across JSX.
  - Below the pill: `conservationStatusDetail` sentence in Body Sm (13px / 400), colour `var(--t2)`, `mt-2`. If `conservationStatusDetail` is null but the status code is present, show the pill only with no sentence below.
  - Status pill does not use solid colour background with white text. It uses the tint-pair bg + border + text treatment from the lookup.

- [ ] Section order is fixed. Daily Life always appears before Conservation Status.
- [ ] Neither section re-orders based on data availability. If Daily Life data is null, it still appears before Conservation Status.

**Definition of done:**
Both sections render on an enriched animal with correct icon/colour pairs. Bullet list renders up to 3 items. Conservation Status pill colour matches the IUCN code. Section card layout matches the anatomy at 375px and 820px.

**Out of scope:**
- Null/placeholder states. Those are explicitly covered in EAD-10.
- Social Life, Care Needs, Threats, Fun Facts. Those are EAD-7.

---

## EAD-7 — Social Life, Care Needs / Threats, and Fun Facts sections

```
As Harry reading about an animal,
I need to see how it lives with others, what it needs or what threatens it,
and a set of surprising facts,
So that I understand the animal as a complete living thing, not just a set of statistics.
```

**Acceptance criteria:**

- [ ] **Social Life section** renders only when `animal.socialBehaviour` is non-null. When null, the section is absent with no gap or placeholder.
  - Icon: Lucide `Users`. Icon circle: `background: var(--blue-sub)`, icon colour `var(--blue-t)`.
  - Heading: "SOCIAL LIFE".
  - Content: `animal.socialBehaviour` string. Body Sm (13px / 400), colour `var(--t2)`, `leading-snug`. Maximum 2 sentences rendered. No bullet markers (prose, not a list).

- [ ] **Care Needs section** renders only when `isDomestic(animal)` is true AND `animal.careNeeds` is non-null.
  - Icon: Lucide `Heart`. Icon circle: `background: var(--pink-sub)`, icon colour `var(--pink-t)`.
  - Heading: "CARE NEEDS".
  - Care difficulty indicator row (above the bullets):
    - 3 circles, 10x10px each, gap 4px, `margin-bottom: 8px`.
    - Filled circles (count = `careDifficulty`): `background: var(--pink)`, `border-radius: 100px`.
    - Empty circles (count = 3 minus `careDifficulty`): `background: var(--elev)`, `border: 1px solid var(--border)`, `border-radius: 100px`.
    - Inline level text: Body Sm (13px / 400), colour `var(--t3)`, `margin-left: 8px`. Label: `careDifficulty === 1 → "Easy"`, `2 → "Moderate"`, `3 → "Demanding"`.
    - `aria-label="Care difficulty: [careDifficulty] out of 3"` on the row wrapper.
    - If `careDifficulty` is null, the indicator row is omitted.
  - Bullet list: `animal.careNeeds` array. Same bullet style as Daily Life. Maximum 4 bullets.

- [ ] **Habitat Threats section** renders only when `!isDomestic(animal)` AND `animal.habitatThreats` is non-null.
  - Icon: Lucide `AlertTriangle`. Icon circle: `background: var(--amber-sub)`, icon colour `var(--amber-t)`.
  - Heading: "THREATS".
  - Bullet list: `animal.habitatThreats` array. Same bullet style as Daily Life. Maximum 3 bullets. Maximum 20 words per bullet.

- [ ] A single animal never renders both Care Needs and Habitat Threats sections simultaneously. The category routing logic `isDomestic()` must use the exported `DOMESTIC_CATEGORIES` constant from EAD-1.

- [ ] **Fun Facts section** always renders (the `facts` field is required and never null).
  - Icon: Lucide `Sparkles`. Icon circle: `background: var(--purple-sub)`, icon colour `var(--purple-t)`.
  - Heading: "FUN FACTS".
  - Bullet list: `animal.facts` array (existing 3 facts). Same bullet style as Daily Life.

- [ ] Section order is fixed regardless of which sections are visible: Social Life → Care Needs OR Threats → Fun Facts. Fun Facts is always the last section.

- [ ] Icon circle colours across all five content sections use distinct tint pairs with no collision. Verify:
  - Daily Life: amber
  - Conservation Status: status-driven (green/amber/red/purple/neutral)
  - Social Life: blue
  - Care Needs: pink
  - Habitat Threats: amber (same as Daily Life — these two sections are mutually exclusive on any given animal, so no collision is possible)
  - Fun Facts: purple

**Definition of done:**
Social Life absent on an animal where `socialBehaviour` is null. Care Needs visible on a domestic animal with data, absent on a wild animal. Habitat Threats visible on a wild animal with data, absent on a domestic animal. Fun Facts always renders. Section order is correct at both breakpoints.

**Out of scope:**
- Null/placeholder states for Social Life, Care Needs, Threats. Those sections are hidden entirely when null (not placeholdered). EAD-10 covers only the sections with structural placeholder requirements.

---

## EAD-8 — CTA section

```
As Harry finishing the detail read,
I need a clear call to action at the bottom of the profile that lets me generate or
find this animal,
So that the detail view closes the loop back into the game's collecting mechanic.
```

**Acceptance criteria:**

- [ ] CTA renders at the bottom of the scroll after all content sections (`mt-8`). Not fixed to the bottom of the viewport — it lives in document flow.
- [ ] **Ungated animals** (`rarity === 'common' | 'uncommon'`):
  - Button: variant `accent`, size `lg`, full column width.
  - Label: "Generate this animal".
  - Action: navigate to `/generate?type=...&breed=...` with modal unmounted (same params as `AnimalProfileSheet.handleGenerate()`).
- [ ] **Gated animals** (`rarity === 'rare' | 'epic' | 'legendary'`):
  - Button: variant `accent`, size `md`, full column width. Lucide `ShoppingBag` icon at 16px.
  - Label: "Find in Marketplace".
  - Action: navigate to `/shop` with modal unmounted.
  - Supporting text below: Body Sm (13px / 400), colour `var(--t3)`, centred. Text: "Common and Uncommon only — Rare and above from the marketplace".
- [ ] On CTA action, the modal unmounts before navigation. No ghost modal visible on the destination screen.
- [ ] Bottom padding on the scroll container is `pb-24` minimum, ensuring the CTA is not obscured by any fixed element.
- [ ] CTA gating logic uses the same `isGated` check already present in `AnimalProfileSheet` — not a new independent implementation. Extract this to a shared constant or utility if it is repeated.

**Definition of done:**
Generate button visible on a common animal, Marketplace button on a rare animal. Tapping either navigates correctly and modal is gone. CTA visible without clipping at 375px.

**Out of scope:**
- Any new purchasing or generation logic. The CTA navigates only — the target screens own their own state.

---

## EAD-9 — Owned-state personalisation

```
As Harry viewing the detail profile of an animal he already owns,
I need the heading to read "Your [Name]" instead of just "[Name]",
So that the profile feels like it is about my animal, reinforcing my sense of ownership
and making the educational content feel personally relevant.
```

**Acceptance criteria:**

- [ ] `AnimalDetailModal` accepts an `isOwned: boolean` prop.
- [ ] When `isOwned` is `true`, the centre zone heading reads "Your [Name]" (e.g. "Your Border Collie"). When `false`, it reads the plain name (e.g. "Border Collie").
- [ ] The string "Your [Name]" is constructed as a template literal — `isOwned ? \`Your ${animal.name}\` : animal.name`. No separate "Your" span with different styling.
- [ ] Full string truncates with ellipsis if it overflows the centre zone. Tested at 375px where the centre zone is narrowest. "Your " (5 characters) is the worst-case addition to the longest animal name in the current catalogue.
- [ ] The `isOwned` prop is passed by `ExploreScreen`. At Phase C launch, `ExploreScreen` determines owned status by checking whether `animal.id` is present in the player's adopted pets collection (via `useProgress` or `usePets` hook — whichever hook owns the owned-animal state). If no such check is available in Phase C, `isOwned` defaults to `false` and this story is partially deferred (the personalisation renders correctly when `true`, but the upstream lookup is a dependency).
- [ ] `AnimalProfileSheet` is also updated to pass `isOwned` to any component that needs it, if the owned state is already determined before the sheet opens. This avoids a flash of the unowned name when the detail modal opens.

**Definition of done:**
"Your [Name]" heading renders when `isOwned` is passed as `true` in a test render. Plain name renders when `false`. Truncation tested at 375px on a long animal name.

**Out of scope:**
- Any visual treatment differences beyond the heading string (no different section content, no "owned" badge on the modal itself — the `RarityBadge` in the header covers the informational badge need).
- Determining whether Harry owns an animal at the data layer — this story covers the rendering contract only. The upstream ownership query is part of the Care or Collection systems.

---

## EAD-10 — Graceful degradation

```
As Harry browsing an animal that has not yet been enriched with detail data,
I need the profile to display as much as is available without showing empty boxes or
broken-looking gaps,
So that the educational experience is not damaged for the majority of the catalogue
that will not have full data at launch.
```

**Acceptance criteria:**

- [ ] When `superpower` is null: the superpower callout block is absent entirely. The quick stats row follows directly after the category/region row. No empty box, no "coming soon" placeholder.
- [ ] When `dailyLife` is null: the Daily Life section renders its card with the heading and icon, but the content area shows italic placeholder text in Body Sm (13px / 400) colour `var(--t3)`: "Not enough is known about this animal's daily habits yet." No bullet markers around placeholder text.
- [ ] When `conservationStatus` and `conservationStatusDetail` are both null: the Conservation Status section renders its card, shows the "Not Assessed" pill (neutral tint: `var(--elev)` bg, `var(--t3)` text, `1px solid var(--border-s)` border), and the placeholder sentence: "This animal hasn't been formally assessed yet." No status-coloured pill when neither field is populated.
- [ ] When `conservationStatus` is non-null but `conservationStatusDetail` is null: the pill renders (with correct IUCN colour), and no sentence appears below it. No placeholder sentence in this case.
- [ ] When `socialBehaviour` is null: the Social Life section is absent entirely. No placeholder, no gap.
- [ ] When `careNeeds` is null for a domestic animal: the Care Needs section is absent entirely.
- [ ] When `habitatThreats` is null for a wild/sea/lost world animal: the Habitat Threats section is absent entirely.
- [ ] When `habitatDetail`, `dietDetail`, or `lifespanDetail` are null: the quick stats card shows only the headline value (no empty row below it). Card height shrinks to content.
- [ ] A smoke test with an unenriched animal (no new fields populated) verifies: hero renders, quick stats render with headline values only, Daily Life renders with placeholder, Conservation Status renders with "Not Assessed" pill and placeholder, Social Life absent, Care Needs or Threats absent, Fun Facts renders (always present). The layout looks intentional and complete — not broken.
- [ ] The layout is verified at 375px and 820px in the unenriched state. No unexpected gaps, misaligned cards, or layout shifts.

**Definition of done:**
A fully unenriched animal produces a layout that looks complete and intentional. Placeholder text is visually distinguished (italic, `var(--t3)`) but not alarming. All conditional sections are absent rather than empty. Verified at both breakpoints.

**Out of scope:**
- Skeleton loaders or shimmer effects. All data is static — there is no loading state.
- Any UI for data authoring status ("content coming soon" badges on the section card header). The degradation is invisible to Harry.

---

## Out of scope for Phase C

The following items are explicitly excluded from Phase C. They must not be built, stubbed, or deprioritised into Phase C without owner approval.

| Item | Why excluded |
|------|-------------|
| Enriching the full 4,600-animal catalogue with new fields | Authoring work stream, not a build deliverable. Phase C requires only two enriched sample animals (EAD-1 AC). |
| AI-generated content for new fields | Deliberate deferral. Scale strategy to be agreed with owner before any generation is commissioned. Accuracy risk on `conservationStatus` is too high for unreviewed AI output. |
| Animal sharing (social / export) | Not in scope for this feature. No share affordance appears in the interaction spec. |
| Audio / sound effects on the detail modal | Confirmed out of scope by feature brief. No auditory cues. |
| Anti-snipe mechanics | Not applicable to this feature (no bidding or timed actions). |
| Quiz trigger within the detail modal | Confirmed out of scope. The detail modal is a passive educational experience. |
| Two-column layout (hero left, content right) at iPad landscape | The interaction spec confirms single-column `max-w-3xl mx-auto` on all breakpoints. Not deferred — explicitly not in scope. |
| Micro-rewards or read-progress tracking in the detail modal | UR finding OQ-8 flagged this as speculative. Not confirmed by owner for this phase. |
| `funFact4` (an additional fact exclusive to the detail view) | UR identified this as nice-to-have. Not included in the interaction spec. Deferred to a future content authoring pass. |
| Offline or cached profile data | PWA caching strategy is a separate concern. |

---

## Sequencing and parallel work guidance

Dev and FE can work in parallel once EAD-1 is merged:

- **Dev thread:** EAD-1 → EAD-2 (portal + animation) → EAD-3 (timer integration)
- **FE thread:** unblocked after EAD-2 → EAD-4 → EAD-5 → EAD-6 → EAD-7 in sequence, EAD-8 and EAD-9 can slot in alongside EAD-7

EAD-10 (graceful degradation) is tested across EAD-6 and EAD-7 output — it is not a separate build story but an acceptance criteria layer applied during Phase D. Tester must verify degradation states as part of their EAD-6 and EAD-7 checks.

---

*Status: Ready for Owner approval before Phase C*
