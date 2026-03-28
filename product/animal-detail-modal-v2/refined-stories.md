# Refined Stories — Animal Detail Modal v2
## Feature: animal-detail-modal-v2

**Status:** Awaiting [OWNER] Phase B approval before Phase C begins.

**Interaction spec:** `spec/features/animal-detail-modal-v2/interaction-spec.md`

---

## Priority order

The stories below are ordered by user value, highest first.

1. ADM-V2-1 — Habitat image for every animal (highest impact, unblocks most of the page visually)
2. ADM-V2-2 — Diet expanded section
3. ADM-V2-3 — Fun Facts repositioned (code change only, no data work)
4. ADM-V2-4 — Quiz section (new component, conditional on data)

Stories 1–3 are independent and can be built in parallel in Phase C. Story 4 depends on no other story but introduces a new component.

---

## ADM-V2-1 — Habitat image for every animal

```
As a child exploring animal profiles,
I need to see a habitat image for every animal I look at,
So that I can picture where that animal lives in the real world.

Acceptance criteria:
- [ ] The habitat image banner (3:1 aspect ratio, rounded-lg, full content column width)
      renders for every animal whose habitat string has a match in the HABITAT_IMAGE map
      in AnimalDetailContent.tsx.
- [ ] The HABITAT_IMAGE map already covers all habitat strings in the dataset. Verify
      by checking that no animal.habitat value in the production ANIMALS array is absent
      from the map. If any are absent, add the mapping before marking this story complete.
- [ ] The habitat image renders independently of habitatDetail. Removing the outer
      `habitatDetail != null` guard is required. The inner guard on the description
      card (conditional on habitatDetail) must be preserved.
- [ ] When habitatDetail is null and an image exists: only the section heading and image
      banner render. No description card.
- [ ] When habitatDetail is non-null and an image exists: section heading, image banner,
      AND description card all render (current behaviour for the 2 existing rich entries).
- [ ] When no image mapping exists for animal.habitat AND habitatDetail is null: the
      entire Habitat section (heading + image + card) is omitted.
- [ ] When no image mapping exists for animal.habitat but habitatDetail is non-null:
      the section heading and description card render without the image banner.
- [ ] Image uses loading="lazy" attribute.
- [ ] Image alt text is "{animal.habitat} habitat" (e.g. "Savanna habitat").
- [ ] No broken image icons are ever visible. All habitat image filenames in the map
      must exist in /public/Animals/Habitats/. Tester must spot-check 5 animals with
      different habitats and verify the image loads.
- [ ] At 375px (phone): image banner maintains 3:1 ratio, no cropping or distortion.
- [ ] At 1024px (iPad): image banner spans the full max-w-3xl content column at 3:1 ratio.
- [ ] DS check: image container uses border-radius: var(--r-lg). No hardcoded radius.

Out of scope:
- Adding new habitat image files. Only map existing images.
- Populating habitatDetail for catalog entries. That is a content task.
- Any change to the description card anatomy.
```

---

## ADM-V2-2 — Diet expanded section

```
As a child reading about an animal,
I need to understand what the animal actually eats (not just "Carnivore"),
So that I can learn something specific and interesting about how it feeds.

Acceptance criteria:
- [ ] A new "Diet" section renders when animal.dietDetail is non-null.
- [ ] Section is positioned after the Habitat section and before Fun Facts in the
      canonical section order.
- [ ] Section uses the card pattern: padding 20px / background var(--card) /
      border 1px solid var(--border-s) / border-radius var(--r-lg).
- [ ] Section header row: 32px icon circle (background var(--green-sub)) containing
      Lucide UtensilsCrossed icon (size 16, strokeWidth 2, color var(--green-t)),
      followed by hairline heading "DIET" (11px / 700 / uppercase / 1.5px tracking /
      var(--t3)). Row uses flex / gap 10px / align-items center / mb 12px.
- [ ] Body text: animal.dietDetail / 13px / 400 / var(--t2) / line-height 1.5.
- [ ] When dietDetail is null: section is absent entirely. No heading, no card.
- [ ] The Quick Stats stat card continues to show animal.diet (headline value) and
      animal.dietDetail (expansion sentence). Both the stat card and the Diet section
      may show dietDetail — this is intentional per spec Section 4.2.
- [ ] DS check: icon is Lucide (not emoji). Color uses var(--green-t) token only.
      No hardcoded hex.
- [ ] At 375px (phone): card spans full column width.
- [ ] At 1024px (iPad): card spans full max-w-3xl content column (single column —
      no two-column treatment for this section).

Out of scope:
- Populating dietDetail for catalog entries.
- Any change to the Quick Stats stat card layout.
- Any other stat (habitat, lifespan) getting a dedicated section in this iteration.
```

---

## ADM-V2-3 — Fun Facts repositioned

```
As a child reading an animal profile,
I need to encounter the most engaging content early in my reading,
So that I keep scrolling instead of closing the modal.

Acceptance criteria:
- [ ] Fun Facts moves from its current position (after Care Needs / Habitat Threats)
      to the new canonical position: after the Diet section and before Daily Life.
- [ ] The new canonical section order in AnimalDetailContent.tsx matches exactly the
      order in spec Section 3:
      Habitat → Diet → Fun Facts → Daily Life → Conservation Status →
      Social Life → Care Needs/Habitat Threats → Quiz → CTA
- [ ] AnimalFunFacts component anatomy is unchanged. Only its position in the JSX
      render order changes.
- [ ] A hand-crafted animal with all sections populated renders all sections in the
      correct new order.
- [ ] A catalog entry (no facts, no dietDetail) shows: hero, badge+region,
      Quick Stats, habitat image, and nothing else — no empty section gaps.
- [ ] No visual regression on any section. Spacing (mt-6 between sections) is uniform.

Out of scope:
- Any change to AnimalFunFacts component internals.
- Any animation on the reorder.
```

---

## ADM-V2-4 — Quiz section

```
As a child who has read an animal profile,
I need a quick question to test what I've learned,
So that reading the profile feels rewarding and I want to come back.

Acceptance criteria:
- [ ] A new "Test Yourself" quiz section renders when animal.quiz is non-null.
- [ ] Section is the last content section, immediately before the CTA block.
- [ ] Section uses the card pattern: padding 20px / background var(--card) /
      border 1px solid var(--border-s) / border-radius var(--r-lg).
- [ ] Section header row: 32px icon circle (background var(--amber-sub)) containing
      Lucide Brain icon (size 16, strokeWidth 2, color var(--amber-t)), followed by
      hairline heading "TEST YOURSELF" (11px / 700 / uppercase / 1.5px tracking /
      var(--t3)), followed by a tint-pair skill area badge (see below).
      Row uses flex / gap 10px / align-items center / mb 16px.
- [ ] Skill area badge is a tint-pair pill adjacent to the heading text:
        maths:     bg var(--blue-sub) / text var(--blue-t)
        spelling:  bg var(--pink-sub) / text var(--pink-t)
        science:   bg var(--green-sub) / text var(--green-t)
        geography: bg var(--amber-sub) / text var(--amber-t)
      Font: 11px / 600 / border-radius: var(--r-pill). No border. Padding: 4px 10px.
      Capitalised display (e.g. "Science", not "SCIENCE").
- [ ] Question text: quiz.question / 15px / 500 / var(--t1) / line-height 1.5 / mb 16px.
- [ ] Answer options are rendered as <button> elements. Vertical stack, gap 8px.
- [ ] Each option: min-height 44px / padding 12px 16px / background var(--elev) /
      border 1px solid var(--border-s) / border-radius var(--r-md) /
      font 14px / 400 / var(--t2) / cursor pointer / transition all 0.2s.
- [ ] Idle hover state (before answer selected): border → 1px solid var(--border) /
      background → var(--card).
- [ ] On correct answer selected:
      - Selected option: bg var(--green-sub) / border 1px solid var(--green) /
        color var(--green-t) / font-weight 600.
      - All other options: pointer-events none.
      - Result label appears below options: "Correct!" / 13px / 600 / var(--green-t) / mt 12px.
- [ ] On incorrect answer selected:
      - Selected option: bg var(--red-sub) / border 1px solid var(--red) /
        color var(--red-t) / font-weight 600.
      - Correct option highlighted: bg var(--green-sub) / border var(--green) /
        color var(--green-t).
      - All options: pointer-events none.
      - Result label: "Not quite — the answer was [correct answer text]" /
        13px / 400 / var(--t2) / mt 12px.
        The correct answer text segment is styled var(--green-t) / 600.
- [ ] Try Again button appears after any answer is selected.
      Variant: outline / size sm / mt 12px. Label: "Try Again".
      On press: all options return to idle state. Result label hidden. All options
      become interactive again.
- [ ] When quiz is null: section is absent entirely. No heading, no card.
- [ ] Accessibility:
      - Answer options are <button> elements (keyboard navigable).
      - aria-pressed on the selected option when answered.
      - Result label is role="status" (screen reader announcement, no focus interrupt).
      - Correct/incorrect state communicated by both colour AND visible text.
        Never colour alone.
- [ ] DS check: Brain icon is Lucide. No emoji. Skill badge uses tint-pair only —
      never solid fill with white text.
- [ ] DS check: answer option border-radius is var(--r-md) (12px = input radius).
      Not var(--r-lg) (cards), not var(--r-pill) (buttons).
- [ ] At 375px (phone): options stack correctly, all options fully visible, no truncation.
- [ ] At 1024px (iPad): options span full content column. No two-column layout.

Out of scope:
- Persisting quiz results to any store or database.
- Displaying past quiz scores or streaks.
- Multi-question quizzes.
- Any connection to the quiz flow elsewhere in the app.
- Populating quiz data for catalog entries (content task).
```

---

## Definition of Done — all stories

Before any story is marked complete, all of the following must be true:

- [ ] Tester sign-off exists in `tests/animal-detail-modal-v2/test-results.md`
- [ ] The 10-point DS checklist in the Tester sign-off has been run in full
- [ ] Layout verified at 375px, 768px, and 1024px by FE and confirmed by Tester
- [ ] `spec/features/animal-detail-modal-v2/done-check.md` checklist completed
- [ ] No ghost variant buttons introduced
- [ ] No hardcoded hex colours
- [ ] No emoji used as icons anywhere
- [ ] All new fixed/absolute overlay elements use createPortal (n/a for this feature — no new overlays)
- [ ] Habitat image spot-check: 5 animals with different habitat strings load their image correctly
- [ ] Quiz interaction tested on a real iPad, not DevTools emulation (tap targets, state transitions)
