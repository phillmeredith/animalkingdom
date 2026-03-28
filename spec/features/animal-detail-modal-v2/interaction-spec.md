# Interaction Spec — Animal Detail Modal v2
## Feature: animal-detail-modal-v2

**Phase A outputs:**
- User Researcher findings integrated below (see Section 1)
- UX Designer spec below (Sections 2–8)

**Status:** Phase A complete. Awaiting Phase B approval before Phase C begins.

---

## Section 1 — User Researcher Findings

### Audience context
The primary user is a child (approx. 7–12 years old) with ADHD and/or autism, using an iPad Pro 11" in portrait or landscape orientation. Key behavioural considerations:

- **Short attention window:** Content must reward rapid scanning. A child who opens "Learn More" and sees a wall of text will close it immediately. Visual anchors (images, icon blocks, coloured pills) break reading into manageable segments.
- **Curiosity-driven engagement:** Children in this age band are strongly motivated by "wow" facts and visual discovery. The habitat image is the highest-engagement hook — it contextualises the animal in its world. Currently this image only appears for 2 of 4500+ animals. This is the single largest gap in the current build.
- **Repetitive use pattern:** Children return to favourite animals many times. Content must not feel "done" after one read. The quiz field (`AnimalEntry.quiz`) is an untapped re-engagement mechanism already in the data model.
- **iPad portrait = primary context:** At 820px CSS width, there is comfortable space for two-column layouts within the `max-w-3xl` content column. Phone (375px) is secondary — all two-column patterns must gracefully collapse to single column.

### Evidence audit

| Finding | Confidence | Source |
|---|---|---|
| Habitat image is the highest-engagement addition | High | Owner brief + existing data — only 2 animals have this section populated despite 20+ habitat images existing in `/public/Animals/Habitats/` |
| Children respond to visual information hierarchy | High | DS is already built for this audience; existing section patterns (icon circles, tint-pair pills) align with known engagement patterns for this age group |
| Diet expansion is valuable to children | Medium | `dietDetail` exists in the data model and is populated for hand-crafted entries; currently rendered only in the Quick Stats row with no dedicated section |
| Quiz as re-engagement driver | Medium | `quiz` field exists and is populated for hand-crafted entries but is entirely absent from the detail modal |
| Sound/audio engagement | Low | `getSoundUrl()` is called by the header; whether children use it repeatedly is unknown. Do not expand audio in this iteration. |

### Knowledge gaps (not blocking this iteration)
- We do not know which sections children scroll past vs. read. Analytics instrumentation would help prioritise in v3.
- We do not know if the quiz in the detail modal would conflict with the quiz flow elsewhere in the app. PO must scope this.

### User need statements
1. A child using Animal Kingdom needs to see a habitat image for every animal, not just two, so that the animal's world feels real and explorable.
2. A child with ADHD needs visual anchors (images, icon blocks, colour) to hold attention through a longer-form content page.
3. A returning child needs a new thing to do or discover on a second visit, so the "Learn More" page does not feel exhausted.
4. A child reading about diet needs more than a single word (e.g. "Carnivore") — they need enough context to understand what that actually means for this specific animal.

---

## Section 2 — UX Decision Record

### Decision 1: Habitat image shows for ALL animals, not just those with `habitatDetail`

**Current behaviour:** Habitat section (image + description card) is gated behind `habitatDetail != null`. Two animals have data. ~4498 do not. This means the habitat image — the most visually impactful element on the page — is invisible to virtually all users.

**New behaviour:** The habitat image banner renders whenever a habitat image mapping exists for `animal.habitat`. The `HABITAT_IMAGE` map already covers all habitat strings in the dataset. There is no animal that cannot show a habitat image. The description card below the image is still conditional on `habitatDetail` — if absent, only the image banner renders.

**Implication for FE:** Remove the `habitatDetail != null` outer guard. Keep the inner `{habitatDetail && <description card>}` guard. The image banner renders independently.

### Decision 2: Diet Detail gets a dedicated expanded section

**Current behaviour:** `dietDetail` renders as a small expansion sentence inside the Quick Stats stat card. At 13px/`--t3` it is easy to miss.

**New behaviour:** A dedicated "Diet" section is added, positioned after the Habitat section and before Daily Life. It follows the same card pattern as other sections (icon circle + hairline heading + body text). The section is conditional on `dietDetail != null`. The Quick Stats stat card continues to show its headline value; the expansion sentence is moved to the dedicated section (not duplicated).

**Rationale:** Diet is one of the most child-accessible facts about an animal. "What does it eat?" is a primary curiosity driver. Elevating this to a full section with an icon makes it a visual landmark.

### Decision 3: Fun Facts move to position 3 (before Conservation Status)

**Rationale:** Fun Facts is the highest-engagement section and the most accessible to the target age group. Currently it is the last content section before the CTA. Many children may not scroll that far. Moving it earlier increases the chance a child encounters the most delightful content.

**New position:** After Diet section, before Daily Life.

**Constraint:** The "always renders" rule on Fun Facts is preserved. Entries without `facts` silently omit the section (existing behaviour in `AnimalFunFacts`).

### Decision 4: Quiz section added (conditional)

**New section:** A "Test Yourself" quiz card is added as the final content section, immediately before the CTA. This uses the existing `quiz` field on `AnimalEntry`. The section is conditional on `quiz != null`.

**Interaction:** Single-question multiple-choice. User taps an option — correct answer reveals green tint-pair highlight, incorrect reveals red tint-pair highlight with correct answer shown. State is local (no persistence required in this iteration). Replay is available via a "Try Again" reset.

**Accessibility:** Answer options are touch targets minimum 44px tall. Correct/incorrect state is communicated by colour AND a visible label ("Correct!" / "Not quite — the answer is X"), never colour alone.

### Decision 5: No audio section in this iteration

Sound playback is already available via the header sound button. Adding a dedicated audio section would duplicate functionality and add visual noise. Defer to v3 if analytics show the header sound button is underused.

---

## Section 3 — Section Order (v2 canonical)

Section order is fixed. Sections that are null/empty collapse without a gap. The order below is non-negotiable — FE must not reorder based on data availability.

```
1.  Hero image                     (always — 16:9, rounded-lg)
2.  Category badge + region row    (always)
3.  Superpower callout             (conditional — absent when superpower is null)
4.  Quick Stats row                (always — Habitat | Diet | Lifespan; stat cards collapse detail sentence when habitatDetail/dietDetail/lifespanDetail null)
5.  Habitat section                (conditional image — image banner when HABITAT_IMAGE mapping exists; description card conditional on habitatDetail)
6.  Diet section                   (conditional — only when dietDetail is non-null)
7.  Fun Facts                      (conditional — only when facts array non-empty)
8.  Daily Life                     (always — placeholder if dailyLife null)
9.  Conservation Status            (always — "Not Assessed" placeholder if conservationStatus null)
10. Social Life                    (conditional — absent when socialBehaviour null)
11. Care Needs OR Habitat Threats  (conditional, mutually exclusive — domestic shows Care Needs; wild shows Habitat Threats)
12. Quiz                           (conditional — only when quiz non-null)
13. CTA block                      (always)
```

**Change summary from v1:**
- Section 5 (Habitat): image now unconditional (gated only on image map match, not `habitatDetail`)
- Section 6 (Diet): new section, inserted after Habitat
- Section 7 (Fun Facts): promoted from position 5 to position 3 in the body content
- Section 12 (Quiz): new section, inserted before CTA

---

## Section 4 — Section Anatomy

### 4.1 Habitat Section (updated)

```
Section heading: Hairline / 11px / 700 / uppercase / --t3 / mb-3
Image banner:    w-full / aspect-ratio 3:1 / rounded-lg (--r-lg) / object-cover / mb-3
                 alt text: "{animal.habitat} habitat"
                 Fallback: if no image mapping → section heading + description card only
                           (no broken-image state — image is omitted, not shown broken)
Description card (conditional — only when habitatDetail non-null):
  background:    var(--card)
  border:        1px solid var(--border-s)
  border-radius: var(--r-lg)
  padding:       16px
  Name:          14px / 600 / --t1 / mb-6px
  Detail text:   13px / 400 / --t2 / line-height 1.6
```

**iPad (1024px) layout:** Full column width within `max-w-3xl`. Image banner spans the full content column (same as current). No two-column treatment — the image is the hero of this section.

**Phone (375px) layout:** Identical. Image banner maintains 3:1 ratio.

**Empty state:** If `animal.habitat` has no match in `HABITAT_IMAGE` and `habitatDetail` is null — section is omitted entirely. There is no "Habitat" heading with nothing below it.

### 4.2 Diet Section (new)

```
Icon circle:     32px / border-radius: 100px / background: var(--green-sub)
Icon:            Lucide UtensilsCrossed / size 16 / strokeWidth 2 / color: var(--green-t)
Heading:         "DIET" / Hairline / 11px / 700 / uppercase / 1.5px tracking / --t3
Body text:       13px / 400 / --t2 / line-height 1.5
Layout:          Same card pattern as AnimalFunFacts / AnimalSocialLife —
                 padding: 20px / background: var(--card) / border: 1px solid var(--border-s) / border-radius: var(--r-lg)
Header row:      flex / gap: 10px / align-items: center / mb: 12px (icon circle + heading)
```

**Content source:** `animal.dietDetail` (the expansion sentence). The Quick Stats stat card continues to show `animal.diet` (headline value) unchanged. The `dietDetail` expansion sentence moves from the stat card to this dedicated section — it is NOT duplicated in both places. Stat card `dietDetail` prop becomes null for entries that have a dedicated section.

Wait — on reflection: the stat card detail and the section detail serve different purposes. The stat card is a compact at-a-glance expansion; the section is the featured read. Both can coexist. The stat card shows the sentence in compact form; the section shows it with full visual weight. No data duplication — it is the same `dietDetail` field rendered twice in different contexts. FE note: this is intentional and spec-mandated.

**Conditional:** Section absent when `dietDetail` is null. No placeholder.

### 4.3 Fun Facts Section (no change to anatomy, position changes only)

See existing `AnimalFunFacts.tsx` — anatomy is correct and carries forward unchanged.

### 4.4 Quiz Section (new)

```
Outer card:      padding: 20px / background: var(--card) / border: 1px solid var(--border-s) / border-radius: var(--r-lg)

Header row:      flex / gap: 10px / align-items: center / mb: 16px
Icon circle:     32px / border-radius: 100px / background: var(--amber-sub)
Icon:            Lucide Brain / size 16 / strokeWidth 2 / color: var(--amber-t)
Heading:         "TEST YOURSELF" / Hairline / 11px / 700 / uppercase / 1.5px tracking / --t3

Skill area badge (inline, adjacent to heading):
  Tint-pair pill based on quiz.area:
    maths:     var(--blue-sub) bg / var(--blue-t) text
    spelling:  var(--pink-sub) bg / var(--pink-t) text
    science:   var(--green-sub) bg / var(--green-t) text
    geography: var(--amber-sub) bg / var(--amber-t) text
  Size: 4px 10px padding / 11px / 600 / --r-pill / no border

Question text:   15px / 500 / --t1 / line-height 1.5 / mb: 16px

Answer options:  vertical stack / gap: 8px
  Each option:
    min-height: 44px (touch target)
    padding: 12px 16px
    background: var(--elev)
    border: 1px solid var(--border-s)
    border-radius: var(--r-md)  (12px — inputs are 12px)
    font: 14px / 400 / --t2
    cursor: pointer
    transition: all 0.2s

  Idle hover state (before answer selected):
    border: 1px solid var(--border)
    background: var(--card)

  Selected correct state:
    background: var(--green-sub)
    border: 1px solid var(--green)
    color: var(--green-t)
    font-weight: 600

  Selected incorrect state:
    background: var(--red-sub)
    border: 1px solid var(--red)
    color: var(--red-t)
    font-weight: 600

  Correct answer revealed (when wrong option chosen):
    The correct option additionally shows:
    background: var(--green-sub) / border: var(--green) / color: var(--green-t)

Result label (appears below options after answer):
  Correct: "Correct!" / 13px / 600 / var(--green-t) / mt: 12px
  Incorrect: "Not quite — the answer was [correct answer text]" / 13px / 400 / var(--t2) / mt: 12px
             Correct answer text segment: var(--green-t) / 600

Try Again button (appears after answer):
  Variant: outline / size: sm / mt: 12px
  Label: "Try Again"
  Action: resets to unanswered state (all options back to idle)
```

**State machine:**
```
idle → answered (correct) → idle (via Try Again)
idle → answered (incorrect) → idle (via Try Again)
```

Once an answer is selected, all options are non-interactive (pointer-events none) until Try Again is pressed.

**Accessibility:**
- Answer options are `<button>` elements, not divs. Keyboard-navigable.
- Correct/incorrect state communicated by colour AND visible text label. Never colour alone.
- `aria-pressed` on selected option.
- Result label is `role="status"` for screen reader announcement.

**Conditional:** Section absent when `animal.quiz` is null.

---

## Section 5 — Layout Diagrams

### iPad (1024px — content column max-w-3xl = ~768px at 1024px viewport)

```
┌─────────────────────────────────────────────────┐
│  [sticky glass header — animal name + controls]  │
├─────────────────────────────────────────────────┤
│                                                   │
│  ┌─────────────────────────────────────────┐     │
│  │         Hero image (16:9)               │     │
│  └─────────────────────────────────────────┘     │
│                                                   │
│  [category badge]  [mappin icon + region]        │
│                                                   │
│  ┌─────────────────────────────────────────┐     │  ← conditional
│  │  ⚡ Superpower callout (aurora gradient) │     │
│  └─────────────────────────────────────────┘     │
│                                                   │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐          │  ← Quick Stats (3-col grid)
│  │ HABITAT │  │  DIET   │  │LIFESPAN │          │
│  │ Savanna │  │Herbivore│  │ 60–70y  │          │
│  │[detail] │  │[detail] │  │[detail] │          │
│  └─────────┘  └─────────┘  └─────────┘          │
│                                                   │
│  HABITAT                                          │  ← section heading
│  ┌─────────────────────────────────────────┐     │  ← image banner (3:1) — always
│  │          [savanna.jpg]                  │     │
│  └─────────────────────────────────────────┘     │
│  ┌─────────────────────────────────────────┐     │  ← conditional: habitatDetail
│  │ Savanna                                  │     │
│  │ [habitatDetail text]                    │     │
│  └─────────────────────────────────────────┘     │
│                                                   │
│  ┌─────────────────────────────────────────┐     │  ← conditional: dietDetail
│  │  [green icon] DIET                      │     │
│  │  [dietDetail text]                      │     │
│  └─────────────────────────────────────────┘     │
│                                                   │
│  ┌─────────────────────────────────────────┐     │  ← conditional: facts non-empty
│  │  [purple icon] FUN FACTS                │     │
│  │  • Fact 1                               │     │
│  │  • Fact 2                               │     │
│  │  • Fact 3                               │     │
│  └─────────────────────────────────────────┘     │
│                                                   │
│  ┌─────────────────────────────────────────┐     │  ← always
│  │  [blue icon] DAILY LIFE                 │     │
│  │  • Sentence 1                           │     │
│  │  • Sentence 2                           │     │
│  │  • Sentence 3                           │     │
│  └─────────────────────────────────────────┘     │
│                                                   │
│  ┌─────────────────────────────────────────┐     │  ← always
│  │  Conservation Status [VU pill]          │     │
│  │  [conservationStatusDetail]             │     │
│  └─────────────────────────────────────────┘     │
│                                                   │
│  ┌─────────────────────────────────────────┐     │  ← conditional
│  │  [icon] SOCIAL LIFE                     │     │
│  │  [socialBehaviour text]                 │     │
│  └─────────────────────────────────────────┘     │
│                                                   │
│  ┌─────────────────────────────────────────┐     │  ← conditional (domestic OR wild)
│  │  [icon] CARE NEEDS / HABITAT THREATS    │     │
│  │  • Item 1                               │     │
│  └─────────────────────────────────────────┘     │
│                                                   │
│  ┌─────────────────────────────────────────┐     │  ← conditional: quiz non-null
│  │  [amber icon] TEST YOURSELF  [SCIENCE]  │     │
│  │  What is a cat that eats only meat…?    │     │
│  │  ┌────────────────────────────────┐     │     │
│  │  │  Herbivore                     │     │     │
│  │  ├────────────────────────────────┤     │     │
│  │  │  Omnivore                      │     │     │
│  │  ├────────────────────────────────┤     │     │
│  │  │  Carnivore  ✓                  │     │     │
│  │  ├────────────────────────────────┤     │     │
│  │  │  Insectivore                   │     │     │
│  │  └────────────────────────────────┘     │     │
│  └─────────────────────────────────────────┘     │
│                                                   │
│  ┌──────────────────┐  ┌──────────────────┐     │  ← CTA (two buttons side-by-side)
│  │  Generate        │  │  Find on Market  │     │
│  └──────────────────┘  └──────────────────┘     │
│                                                   │
│                                                   │  ← pb-24
└─────────────────────────────────────────────────┘
```

### Phone (375px)

All sections are identical to iPad but:
- Quick Stats collapses from 3-col grid to 1-col stack (existing behaviour, unchanged)
- All cards span full column width
- CTA buttons remain side-by-side (they are short enough to fit at 375px)

---

## Section 6 — Interaction States

### Hero image
- No interaction. No hover state.

### Quick Stats row stat cards
- No interaction. Display only.

### Habitat image banner
- No interaction. Display only.
- `loading="lazy"` attribute required.
- `alt` text: `"{animal.habitat} habitat"`.

### Diet section card
- No interaction. Display only.

### Fun Facts card
- No interaction. Display only.

### Daily Life card
- No interaction. Display only.

### Conservation Status card
- No interaction. Display only.

### Social Life card
- No interaction. Display only.

### Care Needs / Habitat Threats card
- No interaction. Display only.

### Quiz section
See Section 4.4 for full interaction state spec. Summary:
- Idle: all options at rest (hover: border escalates to `--border`)
- Selected: option locked in correct/incorrect colour state
- Try Again: full reset to idle state

### CTA buttons
- Generate: Primary variant. Hover: `--blue-h` + glow-blue.
- Find on Marketplace: Outline variant. Hover: border → `--t3`, bg → `rgba(255,255,255,.03)`.
- Active: `transform: scale(.97)` on both.
- Focus: `outline: 2px solid var(--blue); outline-offset: 2px` on both.

---

## Section 7 — Overlay and Surface Treatment

The `AnimalDetailModal` is a full-screen overlay rendered via `ReactDOM.createPortal`. This spec introduces no new overlays or modals — the quiz section is inline content within the scrollable page, not a floating overlay.

All section cards use `var(--card)` surface with `1px solid var(--border-s)` border. This is correct — cards sit on the `rgba(13,13,17,1)` fully opaque modal background, which functions as `--bg`. The surface stack is: `--bg` (modal background) → `--card` (section cards) → `--elev` (elements within cards, such as quiz option buttons).

The glass rule does not apply to any element introduced in this spec. No new `position: fixed` or `position: absolute` elements are added.

---

## Section 8 — Empty State and Conditional Section Rules

| Section | Condition for render | Empty/null behaviour |
|---|---|---|
| Hero image | Always | AnimalImage component handles missing src with fallback |
| Category badge + region | Always | Both fields are required in AnimalEntry |
| Superpower callout | `superpower != null` | Section absent entirely — no heading, no placeholder |
| Quick Stats | Always | Stat cards with null detail show headline only (no expansion sentence) |
| Habitat image banner | `HABITAT_IMAGE[animal.habitat]` exists | If no mapping: banner absent; heading and description card still possible |
| Habitat description card | `habitatDetail != null` | Card absent — heading still renders if image is present |
| Habitat section heading | Image OR description card renders | If both absent: section heading is also absent |
| Diet section | `dietDetail != null` | Section absent entirely |
| Fun Facts | `facts` non-null and non-empty | Section absent entirely |
| Daily Life | Always | Placeholder text when `dailyLife` null (existing behaviour) |
| Conservation Status | Always | "Not Assessed" placeholder when null (existing behaviour) |
| Social Life | `socialBehaviour != null` | Section absent entirely |
| Care Needs | `careNeeds` non-null AND category in DOMESTIC_CATEGORIES | Section absent otherwise |
| Habitat Threats | `habitatThreats` non-null AND category in WILD_CATEGORIES | Section absent otherwise |
| Quiz | `quiz != null` | Section absent entirely |
| CTA | Always | — |

---

## Section 9 — PageHeader Slot Assignment

This spec introduces no changes to the PageHeader or sticky glass header. The existing `AnimalDetailHeader` component handles the header. No new header-level controls are added.

Content container class string (unchanged from v1):
```
px-6 pt-4 pb-24 max-w-3xl mx-auto w-full
```

- `pt-4` (16px): mandatory clearance below sticky glass header border
- `pb-24` (96px): clears fixed nav
- `max-w-3xl mx-auto w-full`: centres content on iPad

---

## Section 10 — Navigation Ownership

No new navigation controls. No tab controls. No section switchers.

---

## Section 11 — Accessibility Requirements

- All section icon circles are decorative (`aria-hidden="true"`).
- Section headings are `<p>` elements (they are labels, not structural headings). This is consistent with existing sections.
- Quiz answer options are `<button>` elements. Full keyboard navigation required.
- Quiz result label uses `role="status"` for screen reader announcement without focus interrupt.
- Habitat image `alt` text: `"{animal.habitat} habitat"` — descriptive but not redundant with the section heading.
- Diet section body text has no interactive elements.
- All touch targets minimum 44px height (quiz options are spec'd at `min-height: 44px`).

WCAG 2.1 AA: colour contrast for all text tokens against their background surfaces has been verified at source in the design system. No new colour combinations are introduced that would require re-verification.

---

## Section 12 — Data Population Gap (Non-blocking, flagged for future work)

The `habitatDetail`, `dietDetail`, `lifespanDetail`, `socialBehaviour`, `careNeeds`, `habitatThreats`, `conservationStatusDetail`, `dailyLife`, `superpower`, and `quiz` fields are only populated for a small subset of the 4500+ animals in the catalog (hand-crafted entries). The v2 spec makes habitat images unconditional (resolving the largest gap), but the richly-populated sections (Diet, Fun Facts, Daily Life, Quiz) will remain absent for generated catalog entries.

This is acceptable for Phase C. The data population question is a content-authoring task outside the scope of this build. FE and Tester must verify that catalog entries (with minimal data) render cleanly with only: hero image, category badge + region, Quick Stats, and habitat image banner. That is the minimum viable state for a catalog entry.
