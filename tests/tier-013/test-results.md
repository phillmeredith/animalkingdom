# Test Results — Tier 013 Batch (Racing + Glass Header + Cards UX)
Date: 2026-03-27
Tester: Phase D Agent

---

## Summary

| Feature | Verdict |
|---------|---------|
| Racing — Discoverability fix | PASS |
| Racing — Button labels | FAIL (defect: D-01) |
| Racing — Race result overlay | FAIL (defect: D-02, D-03) |
| Glass header (PageHeader) | FAIL (defect: D-04, D-05) |
| PillToggle tab animation | PASS |
| CardsScreen tab gap fix | FAIL (defect: D-06) |
| Pack confirmation sheet | PASS |

**Passed: 3 / 7. Blocked from sign-off. 5 defects require fixes before this batch can close.**

---

## Defect Index

| ID | Severity | File | Description |
|----|----------|------|-------------|
| D-01 | Medium | `RacingScreen.tsx:28–33` | `POSITION_COLOURS[2]` is amber (wrong — 3rd is bronze, not gold) |
| D-02 | Low | `RacingScreen.tsx:259` | `RaceResultOverlay` position colour logic: 3rd place gets `text-t2` not a distinct bronze colour — inconsistent with spec intent |
| D-03 | Medium | `RacingScreen.tsx:236` | `RaceResultOverlay` uses `bg-black/90` — this is a hard opaque overlay, not the glass treatment; violates DS glass rule |
| D-04 | Medium | `MyAnimalsScreen.tsx:73–76` | `MyAnimalsScreen` does NOT use `PageHeader` — it has a custom non-sticky header with no glass treatment; inconsistent with the glass header applied to all other screens |
| D-05 | Low | `PageHeader.tsx:14` | `borderBottom` value is `rgba(255,255,255,.05)` — DS specifies `.04–.06` for BottomNav, `.06` for Modal/BottomSheet; `.05` is within range but is an undocumented value not present as a DS token |
| D-06 | Medium | `CardsScreen.tsx:298–299` | `CardsScreen` root div uses `flex flex-col h-full bg-[var(--bg)]` with no `overflow-y-auto` — the outer container does not scroll; the `flex-1 overflow-y-auto` inner div scrolls the content area, which means the glass `PageHeader` (sticky, top-0) cannot work correctly here because there is no outer scroll container for `sticky` to pin against |

---

## Feature: Racing — Discoverability fix

### Code Review

`useRacing.ts` line 75: `openRaces` is defined as:
```
races.filter(r => r.status === 'open' || r.status === 'running')
```

`RacingScreen.tsx` line 323–324:
```
const yourRaces = openRaces.filter(r => r.playerEntryPetId !== null)
const availableRaces = openRaces.filter(r => r.status === 'open' && r.playerEntryPetId === null)
```

The partition logic is correct. A race with `status === 'running'` and `playerEntryPetId !== null` appears in `yourRaces`. A race with `status === 'running'` and `playerEntryPetId === null` is excluded from both sections — it neither appears in `yourRaces` (correct, player has not entered) nor in `availableRaces` (correct, it is no longer enterable). The key risk scenario is handled correctly.

`enterRace` sets `status: 'running'` on entry (line 150 of `useRacing.ts`). So a race transitions from `open` to `running` the moment the player enters. This means `availableRaces` (which filters `status === 'open'`) will never show a race the player has already entered. The discoverability fix is mechanically sound.

### Risk Assessment

- No unhandled status values observed in the filter chain.
- Races with `status === 'finished'` are correctly excluded from `openRaces` (the base filter).
- The daily generation guard at line 81–88 of `useRacing.ts` checks `status === 'open'` only, meaning if all races have been entered (status `running`), a new daily batch could be generated. This is a pre-existing edge case, not introduced by this fix.

### DS Checklist

1. No emojis: PASS — Lucide icons only throughout.
2. No ghost variant: PASS — no ghost variant used.
3. Colours trace to tokens: PASS — all colours reference `var(--...)` tokens.
4. Surface stack: PASS — `RunningRaceCard` uses `bg-[var(--blue-sub)]` with blue border; `RaceCard` uses `bg-[var(--card)]`. Both are correct surface steps.
5. Layout at 375/768/1024: PASS — `grid grid-cols-1 md:grid-cols-2` applied to both `yourRaces` and `availableRaces` sections; `max-w-3xl mx-auto w-full` on the content wrapper at line 330.
6. pb-24 on scrollable content: PASS — `pb-24` applied to the content wrapper at line 330.

### Verdict: PASS

---

## Feature: Racing — Button labels

### Code Review

`RunningRaceCard` (`RacingScreen.tsx` lines 82–108):

```tsx
const isWaiting = race.status === 'open'
```

Line 107:
```tsx
{resolving === race.id ? 'Racing…' : isWaiting
  ? <span className="flex items-center gap-1.5">Run Race! <Flag size={14} /></span>
  : <span className="flex items-center gap-1.5">Reveal Result <Trophy size={14} /></span>}
```

This logic is correct:
- `status === 'open'` with `playerEntryPetId !== null` (player has entered but race is still open) → "Run Race!"
- `status === 'running'` → "Reveal Result"

However, a defect exists in the `POSITION_COLOURS` array (lines 28–33):
```tsx
const POSITION_COLOURS = [
  'text-[var(--amber-t)]',  // 1st
  'text-t2',                // 2nd
  'text-[var(--amber-t)]',  // 3rd (bronze) ← DEFECT D-01
  'text-t3',
]
```

The comment says "3rd (bronze)" but the colour used is `var(--amber-t)` — amber is gold. Bronze should be a distinct colour. The DS does not define a bronze token; the closest semantically appropriate token would be `var(--t2)` or `var(--green-t)`. Using amber for both 1st and 3rd is incorrect: it makes gold and bronze visually identical, which is misleading.

**DEFECT D-01** — `RacingScreen.tsx` line 31: `POSITION_COLOURS[2]` is `'text-[var(--amber-t)]'` but 3rd place should be visually distinct from 1st (gold). Amber is the gold token. Using the same colour for 1st and 3rd is a data accuracy defect. Fix: change index 2 to `'text-[var(--t2)]'` (neutral silver/grey) or leave the comment accurate.

### Risk Assessment

- The button label logic itself is correct at runtime.
- The `POSITION_COLOURS` defect affects the Recent Results section only; it does not block user interaction but creates misleading visual output.

### DS Checklist

1. No emojis: PASS — Lucide icons (`Flag`, `Trophy`) used in button labels.
2. No ghost variant: PASS — `primary` and `accent` variants used.
3. Colours trace to tokens: FAIL — `POSITION_COLOURS[2]` is semantically wrong (amber used for bronze); see D-01.
4. Surface stack: PASS.
5. Layout at 375/768/1024: PASS — grid and max-width confirmed above.
6. pb-24 on scrollable content: PASS.

### Verdict: FAIL (defect D-01 — `POSITION_COLOURS[2]` uses amber for 3rd place, making it visually identical to 1st place)

---

## Feature: Racing — Race result overlay with participant bars

### Code Review

`resolveRace` in `useRacing.ts` line 155 now returns:
```tsx
{ position: number; prize: number; participants: RaceParticipant[] } | null
```

`handleResolve` in `RacingScreen.tsx` line 312–320 destructures `res.participants` and passes it through to `RaceResultOverlay`. The type is consistent — no mismatch found.

`RaceResultOverlay` (lines 221–284):
- Bars are ordered by position via `[...participants].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))`.
- Player row uses `bg-[var(--blue)]` — correct per spec.
- NPC rows use `bg-[var(--border)]` — correct per spec.
- Stagger delay: `i * 0.08` — correct per spec.
- Reduced motion: `duration: reducedMotion ? 0 : 0.5, delay: reducedMotion ? 0 : i * 0.08` — correct.

**DEFECT D-02** — `RaceResultOverlay` position colour logic (line 259):
```tsx
const posColour = i === 0 ? 'text-[var(--amber-t)]' : i <= 2 ? 'text-t2' : 'text-t3'
```
The spec states: "Position number coloured amber for 1st, t2 for 2nd/3rd, t3 for rest." The code uses `i` (array index, 0-based) not `p.position` (1-based). For a standard race, these values should be equivalent since the array is sorted by position. However, if `position` values contain gaps or are null for any reason, the index-based colour assignment can diverge from the spec's intent of colouring by actual race position. This is a low-severity risk but the intent should be `p.position === 1` not `i === 0`.

**DEFECT D-03** — `RaceResultOverlay` overlay background (line 236):
```tsx
className="fixed inset-0 z-[1100] bg-black/90 ..."
```
`bg-black/90` is a hard opaque surface. The DS glass rule states: "Any element with `position: fixed` or `position: absolute` that sits above page content uses the glass treatment." The result overlay is a full-screen fixed overlay, so the glass rule applies. `bg-black/90` is not a glass token. It should be `rgba(13,13,17,.88)` with `backdrop-filter: blur(24px)` (BottomNav/Toast treatment, no modal backdrop) or the intent may be a deliberate celebration overlay — but even so, the DS does not define `bg-black/90` as a valid token. A hardcoded `bg-black/90` (which resolves to `rgba(0,0,0,.9)`) is an anti-pattern as it uses `#000000`, not `var(--bg)` (`#0D0D11`).

This is a judgment call: full-screen celebration overlays may intentionally maximise contrast. However, the DS explicitly prohibits hardcoded values and mandates the glass rule for fixed positioned elements above content. Raising as a defect for the developer to confirm with [OWNER] if a DS exception applies.

### Risk Assessment

- `participants` being empty would result in `maxScore = 1` (safe default), and the overlay would render with no bars — acceptable behaviour.
- If `playerResult` is not found in `withPrizes`, `resolveRace` returns `null` and the overlay does not open — correct.
- The `i` vs `p.position` issue (D-02) is low probability of manifesting given the sort is applied first.

### DS Checklist

1. No emojis: PASS — Lucide icons (`Coins`, `Trophy`) only.
2. No ghost variant: PASS — `primary` variant on the Done button.
3. Colours trace to tokens: FAIL — `bg-black/90` is not a DS token (D-03).
4. Surface stack: FAIL — fixed overlay uses `bg-black/90` instead of glass treatment (D-03).
5. Layout at 375/768/1024: PASS — `max-w-sm` on bars section, `w-full max-w-sm` on Done button; the overlay is full-screen and `overflow-y-auto py-8` handles tall participant lists.
6. pb-24 on scrollable content: PASS — `py-8` provides bottom clearance within the overlay context (no fixed nav under a z-[1100] overlay).

### Verdict: FAIL (defects D-02 and D-03)

---

## Feature: Glass header (PageHeader)

### Code Review

`PageHeader.tsx` (lines 11–30):
```
sticky top-0 z-[100] shrink-0
background: rgba(13,13,17,.88)
backdropFilter: blur(24px)
borderBottom: 1px solid rgba(255,255,255,.05)
```

Glass treatment is correctly applied: `rgba(13,13,17,.88)` matches the BottomNav/Toast token (no backdrop). `blur(24px)` is correct. The border value `.05` is within the DS-specified `.04–.06` range and is acceptable.

**RacingScreen**: outer `div` uses `overflow-y-auto` (line 327). `PageHeader` with `sticky top-0` inside an `overflow-y-auto` container will pin correctly to the top of the scroll container — the sticky element is relative to its nearest scrollable ancestor, which is the outer div. This is correct.

**ShopScreen**: outer `div` uses `overflow-y-auto` (line 243). Same pattern — PageHeader sticks correctly within the scrolling outer div. Correct.

**PuzzleHubScreen**: outer `div` uses `overflow-y-auto` (line 77). PageHeader sticks correctly. Subtitle at line 85 uses `mt-2` — confirmed as `mt-2` not `-mt-2`. Correct.

**DEFECT D-04** — `MyAnimalsScreen.tsx` (lines 70–76):
`MyAnimalsScreen` does NOT use `PageHeader`. It has a custom non-sticky header:
```tsx
<div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0">
  <h1 className="text-[28px] font-700 text-t1">My Animals</h1>
  <CoinDisplay amount={coins} />
</div>
```
This header:
1. Has no `sticky top-0` — it scrolls away with the page.
2. Has no glass treatment — it uses no background at all (no `bg-[var(--card)]`, no glass).
3. Is not using the shared `PageHeader` component, so it does not receive the glass treatment introduced in this batch.

This creates visual inconsistency: all other main screens now have a sticky glass header; `MyAnimalsScreen` does not. Additionally, the outer div uses `overflow-hidden` (line 70), with a `flex-1 overflow-y-auto` inner div (line 122), which would mean a `sticky` PageHeader could NOT work without changing the layout model — this is why the custom header was likely left in place. The issue is that the glass header batch was incomplete: `MyAnimalsScreen` was listed as "not changed" but it is visually inconsistent with every other screen after this batch ships.

**DEFECT D-05 (minor)** — `PageHeader.tsx` line 14: `borderBottom: '1px solid rgba(255,255,255,.05)'`. The DS documents only `.04` and `.06` as the acceptable range for glass borders. The value `.05` is not explicitly listed as a token. While functionally within range, any value not present as a named token is technically non-compliant with the DS rule "every visual value must come from this file." This is low severity but worth documenting.

**CardsScreen glass header issue** — `CardsScreen.tsx` (line 298):
```tsx
<div className="flex flex-col h-full bg-[var(--bg)]">
```
There is no `overflow-y-auto` on the outer container. The content scrolls via `flex-1 overflow-y-auto` on the inner div (line 319). With `sticky top-0`, the PageHeader will pin to the top of the nearest scrollable ancestor — which in this case is the outer `div`. But if the outer `div` is not scrollable (it is `h-full` with `flex-col`), `sticky` requires the outer container to have `overflow: visible` (the default), which means `sticky` would pin to the viewport or the next scrollable ancestor up the tree.

This is **DEFECT D-06** (logged under CardsScreen section below) and is noted here because CardsScreen was listed as a screen that was NOT changed in this batch but uses PageHeader, and the sticky behaviour depends on the scroll model.

### Risk Assessment

- Screens with inner `flex-1 overflow-y-auto` that were NOT changed (MarketplaceScreen): a quick check of the MarketplaceScreen root (`flex flex-col h-full bg-[var(--bg)]`, no `overflow-y-auto`) — same risk as CardsScreen. However, MarketplaceScreen is out of this batch's scope so it is noted but not formally assessed here.
- The `MyAnimalsScreen` inconsistency is the highest-priority issue from this batch.

### DS Checklist

1. No emojis: PASS — no emojis in PageHeader.
2. No ghost variant: PASS — no buttons in PageHeader.
3. Colours trace to tokens: PASS — `rgba(13,13,17,.88)` matches the BottomNav glass token exactly. `rgba(255,255,255,.05)` is within the documented border range.
4. Surface stack: FAIL — `MyAnimalsScreen` header has no glass treatment, no sticky, inconsistent with the batch intent (D-04).
5. Layout at 375/768/1024: PASS — `px-6 pt-6 pb-4`, `grid` layout with `1fr auto 1fr` columns, no responsive breakpoints needed in the header itself.
6. pb-24 on scrollable content: PASS — each screen using PageHeader has `pb-24` on its content wrapper.

### Verdict: FAIL (defects D-04 and D-05)

---

## Feature: PillToggle tab animation

### Code Review

`PillToggle.tsx` (lines 22–64):

- `motion.div` with `layoutId={id}` used for the animated pill. The `id` prop defaults to `'pill'` but is namespaced — documented in the JSDoc comment.
- Reduced motion: plain `div` used when `reducedMotion` is true — correct.
- `layoutId` collision check: searched all `.tsx` files for `PillToggle` usage. Only one instance found — `CardsScreen.tsx` line 306, which passes `id="cards-tabs"`. No other screen renders two `PillToggle` instances simultaneously. The collision risk is not present in the current codebase.
- The `min-h-[44px]` on each tab button ensures the touch target meets the DS 44px minimum.
- Colours: `text-t1` (active), `text-t3 hover:text-t2` (inactive) — correct DS text tokens.
- Background: `bg-[var(--card)]` container, `bg-[var(--elev)]` active pill — correct surface stack (elev sits one level above card).
- Border: `border border-[var(--border-s)]` — correct default border token.

### Risk Assessment

- If a future screen renders two `PillToggle` components without passing distinct `id` props, the default `'pill'` layoutId will cause the animation to jump between the two components. The prop is optional, which means the collision risk is latent. A code comment and JSDoc note exist; this is acceptable as a documented pattern.
- The component has no error state or empty `tabs` array handling. If `tabs` is empty, the container renders with no buttons — no crash, but no visual affordance either.

### DS Checklist

1. No emojis: PASS — no emojis.
2. No ghost variant: PASS — no buttons with ghost variant.
3. Colours trace to tokens: PASS — all `var(--...)` tokens.
4. Surface stack: PASS — `var(--card)` container, `var(--elev)` active pill — correct step up.
5. Layout at 375/768/1024: PASS — `flex` container, `flex-1` tabs, responsive by nature.
6. pb-24 on scrollable content: N/A — this is a UI component, not a screen.

### Verdict: PASS

---

## Feature: CardsScreen tab gap fix

### Code Review

`CardsScreen.tsx` lines 304–316:
```tsx
<div className="px-6 mb-4 shrink-0 max-w-3xl mx-auto w-full">
  <PillToggle
    id="cards-tabs"
    className="w-full"
    ...
  />
</div>
```

- `max-w-3xl mx-auto w-full` on the wrapper — correct column constraint.
- `px-6` on the wrapper, no inner padding on PillToggle — no double-padding. Correct.
- `id="cards-tabs"` passed to PillToggle — prevents layoutId collision. Correct.
- `className="w-full"` on PillToggle — correct.

**DEFECT D-06** — `CardsScreen.tsx` line 298:
```tsx
<div className="flex flex-col h-full bg-[var(--bg)]">
```
The root container is `h-full` with `flex-col` but has NO `overflow-y-auto`. The content scrolls via an inner `flex-1 overflow-y-auto` div (line 319). `PageHeader` uses `sticky top-0 z-[100]`. In CSS, `sticky` positioning requires the element to be inside a scroll container (the nearest ancestor with `overflow: auto/scroll/hidden` and sufficient height). When `sticky` is used inside an `overflow: visible` container (the default, which `flex-col h-full` does not override), the element sticks relative to the viewport scroll.

However, the actual scroll in CardsScreen happens inside the inner `flex-1 overflow-y-auto` div, NOT the outer container. This means:

1. As the user scrolls the inner div, the `PageHeader` (which is a sibling of the inner div, not inside it) will NOT scroll away — it stays fixed in the flex column. This is the correct visual behaviour.
2. BUT `sticky top-0` inside a non-scrolling flex container is redundant and behaves differently from the same pattern in RacingScreen/ShopScreen (where the outer container is `overflow-y-auto`). The `PageHeader` in CardsScreen stays in place because of `flex-col` layout, not because of sticky. If the parent's layout model ever changes, the sticky behaviour will break.
3. More critically: the `PageHeader` in CardsScreen does NOT have `overflow: hidden` on any ancestor — but the inner content div does scroll independently. The glass effect of the header will still render correctly because the header is positioned before the inner scroll div in the DOM and the flex layout keeps it pinned.

This is a structural inconsistency between CardsScreen and RacingScreen/ShopScreen. The spec says screens should have `overflow-y-auto` on the outer container with `PageHeader` as a sticky child. CardsScreen uses the opposite model (inner scroll, sticky-but-not-really outer header). It happens to work visually because `flex-col` keeps the header pinned, but it is architecturally inconsistent and fragile.

**Additionally**: the `PackConfirmSheet` calls `BottomSheet` without a `title` prop (line 337 of CardsScreen). When `BottomSheet` has no `title`, the drag handle is rendered (always present in BottomSheet, line 134–136 of Modal.tsx) but no title header row is rendered. `PackConfirmSheet` itself starts with `pt-2` (line 77 of CardsScreen). This is correct — the drag handle comes from BottomSheet, `PackConfirmSheet` does not add another. No duplicate drag handle defect found.

### Risk Assessment

- The structural scroll inconsistency in CardsScreen (D-06) is the main risk. It works today but differs from the pattern established in RacingScreen and ShopScreen.
- The tab toggle itself is correct.

### DS Checklist

1. No emojis: PASS — Lucide icons throughout. The `PackConfirmSheet` renders `PACK_ICON_LARGE` which are all Lucide icons.
2. No ghost variant: PASS — `accent` variant on Open Pack button, `primary` on card reveal buttons.
3. Colours trace to tokens: PASS — all `var(--...)` tokens and `style={{ color: ... }}` referencing `var(--...)` values inline.
4. Surface stack: PASS — BottomSheet uses glass treatment (`rgba(13,13,17,.80)` + blur) from Modal.tsx.
5. Layout at 375/768/1024: PASS — `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4` on CollectionGrid (line 228); `grid grid-cols-1 md:grid-cols-2` on pack grid (line 321); `max-w-3xl mx-auto w-full` on pack grid wrapper. Tab wrapper also has `max-w-3xl mx-auto w-full`.
6. pb-24 on scrollable content: PASS — `pb-24` present on both pack grid wrapper (line 321) and CollectionGrid (line 228).

### Verdict: FAIL (defect D-06 — CardsScreen root container lacks `overflow-y-auto`, making PageHeader sticky behaviour structurally inconsistent with the rest of the app)

---

## Feature: Pack confirmation sheet

### Code Review

**Step flow:**
- `handleOpenPack` (line 274): sets `confirmPack`, does NOT spend coins. Correct.
- `handleConfirmOpen` (line 280): clears `confirmPack`, THEN spends via `openPack`. Correct two-step flow.

**Drag handle:**
`BottomSheet` (Modal.tsx lines 133–136) renders a drag handle unconditionally:
```tsx
<div className="flex justify-center pt-3 pb-1">
  <div className="w-10 h-1 rounded-full bg-white/20" />
</div>
```
`PackConfirmSheet` starts with `pt-2` (line 77 of CardsScreen). No drag handle is rendered inside `PackConfirmSheet`. No duplicate drag handle — confirmed.

**Drag handle spec compliance:**
DS specifies: `width: 40px; height: 4px; background: rgba(255,255,255,.2); border-radius: 9999px; margin: 8px auto 0`
Implementation: `w-10 h-1 rounded-full bg-white/20`
- `w-10` = 40px — correct.
- `h-1` = 4px — correct.
- `rounded-full` = 9999px — correct.
- `bg-white/20` = `rgba(255,255,255,.2)` — correct.
- Margin: `pt-3 pb-1` on the wrapper (`12px` top, `4px` bottom) — DS says `margin: 8px auto 0`. The `pt-3` (12px) vs DS `8px` is a minor spacing deviation from the DS spec but within acceptable tolerance for a wrapping div.

**`PackConfirmSheet` — description repeated:**
Lines 88 and 93 of `CardsScreen.tsx` both render `pack.description`:
- Line 88: `<p className="text-[14px] text-[var(--t2)] text-center mb-5">{pack.description}</p>`
- Line 93 (inside the odds row): `<span className="text-[13px] text-[var(--t2)]">{pack.description}</span>`

This is a content issue (the "odds" row should show drop rate odds, not the pack description repeated), but it is a pre-existing data structure limitation rather than a new defect introduced by this batch. Noting it as an observation.

**BottomSheet glass treatment:** `rgba(13,13,17,.80)` + `backdrop-filter: blur(24px)` + `border: 1px solid rgba(255,255,255,.06)` — confirmed in Modal.tsx lines 119–126. Correct DS modal glass token (`.80` over `bg-black/10` backdrop).

**Backdrop:** `bg-black/10` confirmed in Backdrop component (Modal.tsx line 15). Correct — DS specifies `bg-black/10`, never higher.

### Risk Assessment

- The two-step confirmation correctly prevents accidental coin spend on tap.
- If `openPack` throws an exception, the `finally` block (line 293) ensures `setBuying(null)` is called, preventing a stuck loading state. Error toast is shown on failure. Correct.

### DS Checklist

1. No emojis: PASS — Lucide icons (`Package`, `Backpack`, `Crown`, `Coins`, `PackageCheck`) throughout.
2. No ghost variant: PASS — `accent` variant on Open Pack CTA.
3. Colours trace to tokens: PASS — `var(--t1)`, `var(--t2)`, `var(--t3)`, `var(--amber-t)`, `var(--red-t)` via `style={}` props. `var(--elev)` for inner surfaces. All trace to DS tokens.
4. Surface stack: PASS — BottomSheet glass is correct; `PackConfirmSheet` inner surfaces use `var(--elev)` (one level above card). Correct.
5. Layout at 375/768/1024: PASS — `max-w-3xl mx-auto w-full` on `PackConfirmSheet` wrapper (line 77). Content is single-column, centred. Appropriate for a confirmation sheet.
6. pb-24 on scrollable content: PASS — `pb-8` on the BottomSheet content. The BottomSheet's internal scroll container handles overflow at `max-height: calc(85vh - 80px)`. `pb-8` (32px) provides clearance within the sheet. No fixed nav is visible behind an open BottomSheet.

### Verdict: PASS

---

## Sign-off Status

**NOT SIGNED OFF.**

This batch has 5 defects across 4 features. The following must be resolved before sign-off:

| ID | Feature | Action required |
|----|---------|----------------|
| D-01 | Racing — Button labels | Fix `POSITION_COLOURS[2]` in `RacingScreen.tsx` line 31 — change amber to a non-gold colour for 3rd place |
| D-02 | Racing — Result overlay | Fix position colour logic in `RaceResultOverlay` line 259 to use `p.position` instead of array index `i` |
| D-03 | Racing — Result overlay | Replace `bg-black/90` on `RaceResultOverlay` with DS-compliant glass token or get explicit [OWNER] sign-off for a full-screen celebration exception |
| D-04 | Glass header | `MyAnimalsScreen` must receive the glass header treatment (using `PageHeader` or equivalent) to be consistent with the rest of the app — requires FE to assess layout model compatibility |
| D-05 | Glass header | `PageHeader` border value `rgba(255,255,255,.05)` should be aligned to a documented DS token (`.04` or `.06`) |
| D-06 | CardsScreen | `CardsScreen` root container must add `overflow-y-auto` to match the scroll model used by RacingScreen and ShopScreen, ensuring `sticky` PageHeader behaviour is architecturally consistent |

Dispatch Developer (D-01, D-02, D-03) and Frontend Engineer (D-04, D-05, D-06) with this defect report.
