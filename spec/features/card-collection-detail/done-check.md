# Definition of Done — card-collection-detail

**Feature:** CollectedCardDetailSheet
**Phase:** E (Done Check)
**Date:** 2026-03-28
**Run by:** Phase E process (automated done-check against test-results.md and refined-stories.md)

---

## Gate criteria

---

### 1. Tester sign-off exists

**PASS**

`tests/card-collection-detail/test-results.md` exists and carries an explicit tester
sign-off:

> "Tester sign-off: GRANTED"
> "The `card-collection-detail` feature meets its acceptance criteria."
> "*Phase D complete. Tester sign-off recorded 2026-03-28.*"

---

### 2. All user stories have passing acceptance criteria

**PASS**

All eight stories verified by the Tester in `test-results.md`:

| Story | Verdict |
|-------|---------|
| Story 1 — Tapping a card tile opens the detail sheet | PASS |
| Story 2 — Sheet open and dismiss behaviour | PASS WITH DEFECTS (DEF-CCD-001, DEF-CCD-002 — both MINOR) |
| Story 3 — Hero area (image, name, rarity badge, subtitle) | PASS |
| Story 4 — Stats block (five labelled progress bars) | PASS |
| Story 5 — Duplicate count pill | PASS |
| Story 6 — Description (flavour text) | PASS |
| Story 7 — Ability section (conditional) | PASS |
| Story 8 — Sheet inner container and iPad layout | PASS |

The two defects in Story 2 are MINOR severity (see criterion 4 below). All functional
acceptance criteria are met.

---

### 3. All 10 DS checklist items pass

**PASS**

All ten checks explicitly verified by the Tester in `test-results.md`:

| Check | Result |
|-------|--------|
| 1. No emojis used as icons | PASS |
| 2. No `ghost` variant on visible actions (app-wide) | PASS |
| 3. All colours trace to `var(--...)` tokens | PASS |
| 4. Surface stack correct; glass rule applied | PASS |
| 5. Layout verified at 375px, 768px, and 1024px | PASS |
| 6. All scrollable content has `pb-24` minimum (app-wide) | PASS |
| 7. Top-of-screen breathing room (app-wide) | PASS |
| 8. Navigation controls compact and consistent | PASS |
| 9. Animation parameters match spec | PASS |
| 10. Spec-to-build element audit | PASS WITH DEFECTS (DEF-CCD-001, DEF-CCD-002 — both MINOR) |

---

### 4. No open BLOCKER or MAJOR defects

**PASS**

Two MINOR defects remain open. Neither is BLOCKER or MAJOR severity.

| ID | Severity | Summary | Impact |
|----|----------|---------|--------|
| DEF-CCD-001 | MINOR | `BottomSheet` panel missing `role="dialog"` and `aria-modal="true"` | WCAG 4.1.2 — screen readers will not announce the sheet as a dialog. Affects all `BottomSheet` callers. No functional regression. |
| DEF-CCD-002 | MINOR | Focus trap absent; focus return on close absent from `BottomSheet` | WCAG 2.1.2 and 2.4.3 — keyboard users can Tab out of the sheet. Mitigated: the sheet contains no interactive elements, so there is nothing to interact with inside the trap boundary. No functional regression. |

**Deferred resolution:** Both defects are in `BottomSheet` (a shared component), not
in `CollectedCardDetailSheet` itself. They were identified and documented by the FE
during Phase C and confirmed by the Tester. Resolution is required before any
interactive elements are added to any `BottomSheet` across the application, and must
be addressed no later than the Tier 2 → Tier 3 retro.

These defects do NOT block completion of this feature.

---

### 5. Spec and stories exist and are consistent

**PASS**

- `spec/features/card-collection-detail/interaction-spec.md` exists and defines all
  sheet anatomy, trigger behaviour, dismissal, animation parameters, and iPad layout.
- `product/card-collection-detail/refined-stories.md` exists with 8 stories that
  directly trace to the interaction spec.
- The two documents are internally consistent. The Tester confirmed no story
  acceptance criterion contradicts the interaction spec.

The one minor discrepancy (drag handle top margin: 12px built vs 8px specified) was
reviewed by the Tester and not raised as a separate defect — it is cosmetically minor
and does not affect the user experience.

---

### 6. `spec/features/card-collection-detail/interaction-spec.md` exists

**PASS**

File confirmed at:
`/Users/phillm/Dev/Animalkingdom/spec/features/card-collection-detail/interaction-spec.md`

---

### 7. `product/card-collection-detail/refined-stories.md` exists

**PASS**

File confirmed at:
`/Users/phillm/Dev/Animalkingdom/product/card-collection-detail/refined-stories.md`

---

### 8. `tests/card-collection-detail/test-results.md` exists

**PASS**

File confirmed at:
`/Users/phillm/Dev/Animalkingdom/tests/card-collection-detail/test-results.md`

---

## Additional DoD items (from refined-stories.md)

| Item | Result |
|------|--------|
| `BottomSheet` uses `ReactDOM.createPortal(content, document.body)` | PASS — fixed as a pre-existing defect during Phase C; confirmed in test-results.md |
| Card tiles carry `role="button"`, `tabIndex={0}`, `aria-label="View details for {card.name}"` | PASS |
| Focus trap confirmed inside sheet | DEFERRED — DEF-CCD-002 (MINOR) |
| Focus returns to triggering tile on close | DEFERRED — DEF-CCD-002 (MINOR) |
| Sheet carries `aria-modal="true"` | DEFERRED — DEF-CCD-001 (MINOR) |
| `CollectionGrid` rarity-coded border colours at rest unchanged | PASS |
| No action buttons exist anywhere in the sheet | PASS |
| No placeholder or "coming soon" ability row exists | PASS |
| `ability` conditional renders correctly with both present and absent data | PASS |
| `duplicateCount === 0` hides pill entirely | PASS |
| `duplicateCount > 0` shows correct `×{duplicateCount + 1} copies` string | PASS |
| `card === null` renders nothing — sheet body absent | PASS |

---

## Known deferred items (not blockers)

The following items are carried forward and must be resolved before any interactive
element is added to `BottomSheet`, or at the Tier 2 → Tier 3 retro (whichever comes
first):

1. **DEF-CCD-001** — Add `role="dialog"` and `aria-modal="true"` (plus
   `aria-labelledby`) to the `BottomSheet` panel element in `src/components/ui/Modal.tsx`.
   Affects all existing callers: `PackConfirmSheet`, `CollectedCardDetailSheet`, and
   any future callers.

2. **DEF-CCD-002** — Implement a focus trap in `BottomSheet` (via `focus-trap-react`
   or the `inert` attribute on background content) and capture / restore the triggering
   element's focus on open/close. This is a shared `BottomSheet` concern, not specific
   to `CollectedCardDetailSheet`.

Neither item affects the functional use of the feature as built.

---

## Overall verdict

**COMPLETE**

All eight gate criteria pass. The two open defects are MINOR severity, are in a shared
component (`BottomSheet`) rather than this feature's own code, and do not affect the
functional delivery of any acceptance criterion. The Tester has explicitly granted
sign-off and confirmed the backlog entry may be updated to `complete`.

The backlog status for `card-collection-detail` is updated to `complete`.

---

*Phase E complete. Done-check recorded 2026-03-28.*
