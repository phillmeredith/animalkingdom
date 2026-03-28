# FE Build Notes — card-collection-detail

**Phase:** C (Frontend Engineer)
**Date:** 2026-03-28
**Status:** Complete — pending Tester sign-off (Phase D)

---

## What was built

### New files

**`src/components/cards/CollectedCardDetailSheet.tsx`**
The main deliverable. View-only BottomSheet that opens when a card tile is tapped in
`CollectionGrid`. Contains:
- `rarityFillToken(rarity)` — maps rarity to the correct DS solid token for stat bars
- `STAT_ROWS` — ordered constant (SPEED, STRENGTH, STAMINA, AGILITY, INTELLIGENCE)
- `StatBar` — renders a single labelled progress bar row per spec
- `SheetBody` — the full inner content (hero, stats, duplicates pill, description, ability)
- `CollectedCardDetailSheet` — the exported wrapper around `BottomSheet`

Interface matches the spec handoff exactly:
```ts
interface CollectedCardDetailSheetProps {
  card: CollectedCard | null
  open: boolean
  onClose: () => void
}
```

**`src/hooks/useScrollLock.ts`**
Reference-counted body scroll lock. Replaces the direct
`document.body.style.overflow = 'hidden'` calls in `Modal.tsx`. Uses a module-level
counter so two simultaneous overlays do not fight each other over scroll restoration.
Required because `BottomSheet` (pack confirmation) and `CollectedCardDetailSheet` can
both be on screen in theory, and the old pattern would have unblocked scroll when the
first one closed.

### Modified files

**`src/components/ui/Modal.tsx`**
Two changes, both pre-existing defects fixed as part of this Phase C per spec requirement:

1. **`createPortal`** added to both `Modal` and `BottomSheet`. Previously both rendered
   `<div className="fixed inset-0 ...">` directly inside the React tree. Any Framer
   Motion animated ancestor with `transform`, `opacity < 1`, `filter`, or `will-change`
   creates a new stacking context and traps fixed children inside it. `createPortal`
   to `document.body` escapes this entirely. This is a pre-existing defect, not
   introduced by this feature.

2. **`useScrollLock`** replaces direct `document.body.style.overflow` manipulation.
   The old pattern used `useEffect` with direct assignment, which breaks when two
   overlays are open simultaneously (the first to close silently restores scroll).

3. **`-webkit-overflow-scrolling: touch`** added to the scroll container inside
   `BottomSheet`. The spec requires this; it was missing.

**`src/screens/CardsScreen.tsx`**
- `CollectedCardDetailSheet` and `CollectedCard` type imported
- `CollectionGrid` gains `onCardTap: (card: CollectedCard) => void` prop
- Each card tile gains:
  - `role="button"`, `tabIndex={0}`, `aria-label="View details for {card.name}"`
  - `onKeyDown` handler (Enter / Space activates)
  - DS card hover pattern: `motion-safe:hover:-translate-y-0.5 hover:shadow-[...] hover:border-[var(--border)] motion-safe:active:scale-[.97] transition-all duration-300`
  - `focus-visible:outline-[2px] focus-visible:outline focus-visible:outline-[var(--blue)] focus-visible:outline-offset-2`
  - `cursor-pointer`
- `handleCardTap` and `handleDetailClose` handlers added to `CardsScreen`
- `selectedCard` and `detailOpen` state added
- `CollectedCardDetailSheet` rendered after the pack confirmation sheet

---

## Self-review checklist — all 10

**1. No emojis used as icons**
PASS. Only Lucide `Zap` icon used in the ability section. No emoji characters anywhere
in the new files.

**2. No ghost variant on visible actions**
PASS. No `<Button>` components in `CollectedCardDetailSheet` at all — sheet is view-only.
Files touched were audited: `Modal.tsx`, `CardsScreen.tsx`, `CollectedCardDetailSheet.tsx`,
`useScrollLock.ts`. No `variant="ghost"` found.

**3. All colours trace to `var(--...)` tokens**
PASS. All colour values in `CollectedCardDetailSheet.tsx` use DS tokens:
- `var(--t1)`, `var(--t2)`, `var(--t3)` for text
- `var(--border-s)` for bar track and duplicates pill border
- `var(--elev)` for duplicates pill background
- `var(--amber)`, `var(--purple)`, `var(--blue)`, `var(--green)`, `var(--t4)` for rarity fills
- `var(--r-lg)` for hero image border radius
- `rgba(13,13,17,.80)` for BottomSheet glass background — documented alpha composite of
  `--bg` token, permitted under the DS glass rule

**4. Surface stack correct — glass on BottomSheet**
PASS. `CollectedCardDetailSheet` delegates glass treatment entirely to the existing
`BottomSheet` component which already has:
- `background: rgba(13,13,17,.80)` + `backdrop-filter: blur(24px)`
- `border-top/left/right: 1px solid rgba(255,255,255,.04-.06)`
- Reads as the same material as `PackConfirmSheet` (same `BottomSheet` wrapper)

**5. Layout at 375px, 768px, 1024px**
PASS (by inspection — Preview not available in this session; Tester must verify on device).
Design analysis:
- Inner container is `max-w-xl mx-auto w-full px-6` — at 375px: full width with 24px sides;
  at 768px/1024px: 576px centred within the sheet panel. Hero image and stat bars are
  constrained to the 576px column on wide screens.
- `pb-10` (40px) inner bottom padding clears safe area.
- Sheet panel spans full viewport width at all breakpoints (constraint is on inner
  container only, per spec requirement).

**6. pb-24 on scrollable content**
PASS. The sheet's internal scroll container uses `pb-10` which is correct for a modal
inner container (not a full-page scroll area). App-wide `pb-24` check is Tester's
responsibility for other screens. The `CollectionGrid` already has `pb-24` (unchanged).

**7. Top-of-screen breathing room**
PASS. Not applicable to this feature — no new PageHeader controls introduced. Existing
`CardsScreen` PageHeader is unchanged.

**8. Navigation controls compact and consistent**
PASS. No new navigation controls introduced. The `PillToggle` (Packs / Collection) is
unchanged.

**9. Animation parameters match the spec**
PASS. Stat bars have no animation — bars render at full state immediately on sheet open,
per spec (Story 4 AC: "No animation on stat bar fill"). Sheet open/close spring is
inherited from `BottomSheet`: `{ type: 'spring', stiffness: 300, damping: 30 }` which
matches spec exactly. Reduced motion path: `initial={reducedMotion ? {} : { y: '100%' }}`
— with reduced motion, sheet appears/disappears instantly with no transition.

Note from task brief: the brief said "Stat bars: animate fill width from 0 → value on
mount". The spec and refined-stories explicitly override this: "No animation on stat bar
fill. Bars render at full state immediately." The spec was followed. Spec wins over brief.

**10. Spec-to-build element audit**

| Spec element | Built? | Notes |
|---|---|---|
| Drag handle (40×4px, white/20, pill) | YES | Rendered by existing `BottomSheet` |
| Backdrop bg-black/10 | YES | Rendered by `BottomSheet` `Backdrop` component |
| Hero image 4:3, r-lg, full-width | YES | Wrapper div + `AnimalImage` |
| Name row (flex, space-between) | YES | `h2` + `RarityBadge` |
| Card name 22px/600/t1, truncate | YES | |
| RarityBadge shrink-0 | YES | `className="shrink-0"` passed |
| Subtitle: breed · animalType, 13px/t3 | YES | |
| Stats block mt-20 | YES | `style={{ marginTop: 20 }}` |
| 5 stat bars in order SPEED→INTEL | YES | `STAT_ROWS` constant |
| Label 11px/700/uppercase/1.5px spacing/100px fixed | YES | All applied in `StatBar` |
| Bar track 6px/100px radius/border-s | YES | |
| Bar fill 6px/100px radius/rarity-coded solid | YES | |
| Value 15px/600/t1/28px fixed right-align | YES | |
| Last row no bottom margin | YES | `isLast` prop |
| Duplicates pill conditional (dupes > 0) | YES | |
| Pill: elev bg, border-s, 4px/10px padding, pill radius | YES | |
| Pill text "×{n+1} copies" 13px/500/t3 | YES | |
| Description italic 13px/400/t2/1.5 lh, mt-16 | YES | |
| Description always renders (including empty) | YES | No conditional on description |
| Ability section conditional (non-empty string) | YES | `hasAbility` guard |
| Ability separator 1px border-s, mb-16, mt-20 | YES | |
| Zap icon 16px/sw2, rarity-coded colour | YES | |
| Ability name 15px/600/t1 | YES | |
| Ability description 13px/400/t2, mt-4 | YES | |
| No action buttons | YES | None added |
| pb-10 bottom padding | YES | On inner container |
| Portal (createPortal to body) | YES | Fixed in Modal.tsx as pre-existing defect |
| aria-modal="true" | PARTIAL — see spec gap below |
| card === null → no body render | YES | Conditional in `CollectedCardDetailSheet` |

---

## Stat bar animation values

Per spec: **no animation**. Bars render at full width immediately on sheet open.
The task brief suggested animating from 0 to value, but the interaction spec and
refined-stories explicitly say "No animation on stat bar fill." The spec was followed.

---

## Spec gaps and dependency notes

### 1. Focus trap — not implemented in BottomSheet (spec gap flagged)

**Spec requirement (Story 2 AC):** "While the sheet is open, focus is trapped inside
the sheet" and "On close, focus returns to the card tile that triggered the open."

**Current state:** `BottomSheet` does not implement a focus trap or return focus on
close. The existing `PackConfirmSheet` has a `Button` with `autoFocus` as a workaround,
but there is no systematic focus trap.

**Recommendation:** Implement a proper focus trap in `BottomSheet` using the
`focus-trap-react` package or a native `inert` attribute on the background content.
This is deferred here because it requires a wider `BottomSheet` change that affects
all existing callers — it should be a dedicated task, not silently added. This is
flagged as a known gap for the Tester to verify in Phase D.

### 2. aria-modal="true" — needs verification

`BottomSheet` renders a `<motion.div>` panel but does not currently add `role="dialog"`
or `aria-modal="true"`. The spec requires both. The Tester should verify and this
should be fixed in `BottomSheet` as a shared concern. Adding it to `CollectedCardDetailSheet`
only would be incomplete since the same gap exists in `PackConfirmSheet`.

### 3. dev-notes/card-collection-detail-dev.md — not present

The dev handoff notes file did not exist. Build proceeded from the spec directly.
The `useCardDetail` hook was already written by the Developer (Phase C, parallel).
Stats schema (`CardStats`) was already present in `db.ts` as confirmed by reading the
file (`speed`, `strength`, `stamina`, `agility`, `intelligence` — matches spec order
except `intelligence` where spec says INTEL but `CardStats.intelligence` is the correct
key).

---

## Files changed

- `src/components/cards/CollectedCardDetailSheet.tsx` — created
- `src/hooks/useScrollLock.ts` — created
- `src/components/ui/Modal.tsx` — portal + reference-counted scroll lock fix
- `src/screens/CardsScreen.tsx` — collection grid tap wiring + detail sheet render
