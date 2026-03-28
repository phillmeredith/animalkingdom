# Test Results: racing-improvements

**Phase D — Tester sign-off report**
Feature: `racing-improvements`
Date: 2026-03-28
Tester: QA / Phase D agent
Build tested: Phase C output as committed

---

## Scope confirmation

Story 2 (`PreRaceCountdown`) is **OUT OF SCOPE** — confirmed by Developer investigation
(dev-findings.md). The `isWaiting` state (`status === 'open'` + `playerEntryPetId !== null`)
is unreachable because `enterRace()` atomically sets `status: 'running'` at the same instant
it writes `playerEntryPetId`. The `isWaiting` dead-code branch has been removed from
`RunningRaceCard`. No `PreRaceCountdown` UI was built. This is correct.

Tests in this report cover **Story 1** and **Story 3** only.

---

## Files reviewed

- `src/components/racing/RaceStatusLabel.tsx`
- `src/screens/PlayHubScreen.tsx`
- `src/components/layout/BottomNav.tsx`
- `src/components/ui/Badge.tsx` (reference — `RarityBadge` sizing comparison)
- `src/hooks/useReducedMotion.ts` (reference)
- `design-system/DESIGN_SYSTEM.md` (token reference)
- `spec/features/racing-improvements/interaction-spec.md`
- `product/racing-improvements/refined-stories.md`
- `research/racing-improvements/dev-findings.md`

---

## Story 1 — Race status labels

### Scenario 1.1: Component exists as a standalone file

**Given**: Phase C is complete
**When**: The file system is inspected
**Then**: `src/components/racing/RaceStatusLabel.tsx` exists as a standalone component file,
not inline JSX

**Result**: PASS — `RaceStatusLabel.tsx` is a dedicated component file exporting a single
named component. It is imported by `PlayHubScreen.tsx` at line 24.

---

### Scenario 1.2: "Enter now" label — open, not entered

**Given**: A race with `status === 'open'` is passed to `RaceStatusLabel` with `isEntered`
defaulting to `false`
**When**: The component renders
**Then**: A green tinted pill renders with text "Enter now", `Zap` icon at 10px,
background `var(--green-sub)`, text/icon colour `var(--green-t)`

**Result**: PASS

Evidence from `RaceStatusLabel.tsx` lines 81–92:
- Background: `var(--green-sub)` — correct
- Colour: `var(--green-t)` — correct
- Icon: `<Zap size={10} strokeWidth={2} />` — correct
- Text: "Enter now" — correct

---

### Scenario 1.3: "Ready!" label — open, entered

**Given**: A race with `status === 'open'` is passed with `isEntered={true}`
**When**: The component renders
**Then**: A blue tinted pill renders with text "Ready!", `Flag` icon at 10px,
background `var(--blue-sub)`, text/icon colour `var(--blue-t)`

**Result**: PASS

Evidence from `RaceStatusLabel.tsx` lines 66–78:
- Background: `var(--blue-sub)` — correct
- Colour: `var(--blue-t)` — correct
- Icon: `<Flag size={10} strokeWidth={2} />` — correct
- Text: "Ready!" — correct

**Note**: This state is unreachable in practice (confirmed by R-04 dev finding). The
component logic is correct and the component is not defective; it handles the prop
combination as specified. The state's unreachability is a data-layer constraint, not a
UI defect.

---

### Scenario 1.4: "Racing" label — running state, standard motion

**Given**: A race with `status === 'running'` is passed and `prefers-reduced-motion` is
not active
**When**: The component renders
**Then**: A pink tinted pill renders with text "Racing", animated `Zap` icon at 10px
(`opacity` oscillating `[1, 0.5, 1]` over 1200ms, infinite, `easeInOut`),
background `var(--pink-sub)`, text/icon colour `var(--pink-t)`

**Result**: PASS

Evidence from `RaceStatusLabel.tsx` lines 36–62:
- Background: `var(--pink-sub)` — correct
- Colour: `var(--pink-t)` — correct
- Animated: `motion.span` with `animate={{ opacity: [1, 0.5, 1] }}`,
  `transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}` — correct
- Only the icon `motion.span` animates; the badge background span is static — correct
- Text: "Racing" — correct

ANIM-1 check: animation contains `Zap` icon `opacity` oscillation only. No other element
animates. PASS.

ANIM-2 check: duration `1.2` (1200ms), easing `'easeInOut'` — matches spec section 8
(`1200ms / cycle, ease-in-out`). PASS.

ANIM-4 check: the pulse is an infinite background animation; it does not gate any CTA.
PASS.

---

### Scenario 1.5: "Racing" label — running state, reduced motion

**Given**: A race with `status === 'running'` is passed and `prefers-reduced-motion` is
active (or `ak:reducedMotion` localStorage override is `'true'`)
**When**: The component renders
**Then**: A pink tinted pill renders with text "Racing" and a static `Zap` icon at full
opacity. No Framer Motion wrapper is applied to the icon.

**Result**: PASS

Evidence from `RaceStatusLabel.tsx` lines 37–49:
- `const reducedMotion = useReducedMotion()` — hook is imported and called
- Branch: `reducedMotion ? <Zap .../> : <motion.span>...</motion.span>` — correct
- Static path: plain `<Zap size={10} strokeWidth={2} />` with no animation wrapper

ANIM-3 check: static icon, no Framer Motion. PASS.

---

### Scenario 1.6: "Done" label — finished state

**Given**: A race with `status === 'finished'` is passed
**When**: The component renders
**Then**: A neutral tinted pill renders with text "Done", `Trophy` icon at 10px,
background `rgba(119,126,145,.12)`, text/icon colour `var(--t2)` (`#B1B5C4`)

**Result**: PASS

Evidence from `RaceStatusLabel.tsx` lines 20–33:
- Background: `rgba(119,126,145,.12)` — correct (approved exception per DS checklist note)
- Colour: `var(--t2)` — correct. `var(--t2)` resolves to `#B1B5C4` per design system,
  matching the specified `#B1B5C4` value
- Icon: `<Trophy size={10} strokeWidth={2} />` — correct
- Text: "Done" — correct

**Note on colour token**: The component comment on line 21 reads "var(--t2)" which is
correct. The refined stories table column header reads "Text/icon token: `#B1B5C4`" which
is the resolved value of `var(--t2)`. These are equivalent. No defect.

**Reachability note**: The "Done" label variant is specified as reachable but is not
rendered by any card component in the current codebase. `RaceCard` is rendered only for
`availableRaces` (status `'open'`, not entered), and `RunningRaceCard` is rendered only
for `yourRaces` (status `'open'` or `'running'` with `playerEntryPetId !== null`). Finished
races are displayed in the "Recent results" section using a separate non-card layout that
does not use `RaceStatusLabel`. The "Done" state in `RaceStatusLabel` is therefore dead
code in the current UI, though the component logic itself is correct.

**Severity**: LOW — the component is correct per spec. The unreachability of the "Done"
variant is a product-layer concern (the "Recent results" section could use it but doesn't).
Logged as DEF-01 below for product awareness.

---

### Scenario 1.7: Badge anatomy matches spec

**Given**: Any `RaceStatusLabel` state
**When**: Class and style attributes are inspected
**Then**: `inline-flex`, `items-center`, `gap-[5px]`, `px-[10px]`, `py-[4px]`,
`rounded-full`, `text-[12px]`, `font-600` — all present

**Result**: PASS

Evidence from `RaceStatusLabel.tsx` — all four rendered states share the same className:
`"inline-flex items-center gap-[5px] px-[10px] py-[4px] rounded-full text-[12px] font-600"`
This exactly matches the specified anatomy.

---

### Scenario 1.8: Badge sizing matches RarityBadge

**Given**: `RarityBadge` and `RaceStatusLabel` are compared side by side
**When**: Class strings are analysed
**Then**: Both use 12px text, weight 600, 4px vertical / 10px horizontal padding, pill
radius

**Result**: PARTIAL PASS with minor deviation noted.

`RarityBadge` uses (via `Badge.tsx` line 50):
`'inline-flex items-center gap-1 px-2.5 py-[3px] rounded-pill text-xs font-semibold'`

`RaceStatusLabel` uses:
`'inline-flex items-center gap-[5px] px-[10px] py-[4px] rounded-full text-[12px] font-600'`

Deviations:
- `gap-1` (4px) in `RarityBadge` vs `gap-[5px]` (5px) in `RaceStatusLabel` — minor, within
  DS tolerance, and spec section 3.3 explicitly specifies `gap: 5px`
- `py-[3px]` in `RarityBadge` vs `py-[4px]` in `RaceStatusLabel` — minor, 1px difference;
  spec section 3.3 specifies `4px` for this component
- `text-xs` vs `text-[12px]` — equivalent (`text-xs` = 12px)
- `font-semibold` vs `font-600` — equivalent (both 600 weight)
- `rounded-pill` vs `rounded-full` — both resolve to pill/full-circle radius

The deviations are within spec — `RaceStatusLabel` is following its own spec (section 3.3),
which intentionally uses `gap: 5px` and `padding: 4px 10px`. The sizing matches as
instructed. The visual character (pill shape, 12px/600, tinted) is consistent.

**Result overall**: PASS — the 1px vertical padding difference (`py-3` vs `py-4`) is a
minor visual deviation that may be perceptible at very close inspection. Logged as DEF-02
(low severity — spec-compliant, but Tester flags for PO awareness).

---

### Scenario 1.9: RaceStatusLabel placement on RaceCard

**Given**: A `RaceCard` for an available race
**When**: The component layout is inspected
**Then**: `RaceStatusLabel` is in the top-right `flex items-center gap-2 shrink-0` wrapper,
positioned to the left of the prize pool block; prize pool remains rightmost

**Result**: PASS

Evidence from `PlayHubScreen.tsx` lines 200–208:
```
<div className="flex items-center gap-2 shrink-0">
  <RaceStatusLabel status={race.status} />
  <div className="text-right">
    <div className="text-[11px] font-700 uppercase...">Prize pool</div>
    ...
  </div>
</div>
```
`gap-2` = 8px, matching spec `gap: 8px`. StatusLabel is left of prize pool. PASS.

---

### Scenario 1.10: RaceStatusLabel placement on RunningRaceCard

**Given**: A `RunningRaceCard` for an entered, running race
**When**: The component layout is inspected
**Then**: `RaceStatusLabel` is at top-right of the header row; no prose text "Entered —
tap Race! to run" or "In progress" appears in the header

**Result**: PASS

Evidence from `PlayHubScreen.tsx` lines 150–163:
- Header `div` contains: type icon | name+countdown | `<RaceStatusLabel status={race.status} isEntered={true} />`
- No prose "Entered — tap Race! to run" text exists anywhere in `RunningRaceCard`
- No "In progress" prose text exists in the header
- The countdown text ("Ends in Xm Ys") is present in the name block — this is correct per
  spec section 4.5 which states "existing countdown, preserved" for the running state

---

### Scenario 1.11: Badge is not interactive

**Given**: `RaceStatusLabel` component source
**When**: Inspected for interactive attributes
**Then**: No `onClick`, no `tabIndex`, no keyboard `role`, no `cursor: pointer`

**Result**: PASS

Evidence: `RaceStatusLabel.tsx` renders `<span>` elements. No `onClick` handler, no
`tabIndex`, no `role="button"` or similar is present anywhere in the component. The
component is display-only.

---

### Scenario 1.12: Accessibility — colour not sole state indicator

**Given**: Any `RaceStatusLabel` state
**When**: CSS colour is disabled in the browser
**Then**: State is still distinguishable by text alone ("Enter now", "Ready!", "Racing",
"Done") and icon shape (Zap, Flag, Zap, Trophy)

**Result**: PASS (by inspection)

Every label variant combines three distinct signals: colour, icon, and text. Without colour:
- "Enter now" + Zap
- "Ready!" + Flag
- "Racing" + Zap (animated in standard motion)
- "Done" + Trophy

Text alone distinguishes all four. Icon alone distinguishes all except "Enter now" vs
"Racing" (both use Zap), but text resolves that ambiguity. WCAG 1.4.1 (Use of Colour)
is satisfied.

---

### Scenario 1.13: Badge text does not wrap at any breakpoint

**Given**: Status label text is rendered inside race cards at 375px, 768px, and 1024px
**When**: Cards are visible at all breakpoints
**Then**: Label text ("Enter now", "Ready!", "Racing", "Done") renders on one line without
wrapping or truncation at any card width

**Result**: PASS (by inspection)

All label text is one or two short words. Maximum label width is "Enter now" (~7 chars).
At the narrowest card width (full-width single column at 375px minus 40px padding = ~335px),
a 12px/600 label with 10px horizontal padding and a 10px icon renders well within available
space. At 1024px two-column grid (~440px per card), no truncation risk exists.

---

## Story 3 — Nav badge on Play tab

### Scenario 3.1: Badge renders on Play tab, not on any other tab

**Given**: `BottomNav.tsx` with the updated badge logic
**When**: The TABS array and badge rendering logic are inspected
**Then**: The badge dot is conditionally rendered only inside the `to === '/play'` block

**Result**: PASS

Evidence from `BottomNav.tsx` lines 111–142:
```
{to === '/play' && (
  <AnimatePresence>
    {showPlayBadge && (
      ...
    )}
  </AnimatePresence>
)}
```
The condition `to === '/play'` gates the entire badge block. No badge logic exists for
`/shop`, `/`, `/explore`, or `/animals`.

---

### Scenario 3.2: Old /shop stub is removed

**Given**: The pre-Phase C `BottomNav` had a stub badge on `to === '/shop'` using
`freshRaceCount`
**When**: The updated `BottomNav.tsx` is inspected
**Then**: No `freshRaceCount` variable exists; no badge on the `/shop` tab

**Result**: PASS

No `freshRaceCount` identifier found in `BottomNav.tsx`. The Store (`/shop`) tab renders
its icon and label with no badge block.

---

### Scenario 3.3: Badge Condition A — running + entered race

**Given**: At least one race exists with `status === 'running'` and
`playerEntryPetId !== null`
**When**: `showPlayBadge` is evaluated via `useLiveQuery`
**Then**: `showPlayBadge` returns `true`; badge dot renders on the Play tab

**Result**: PASS

Evidence from `BottomNav.tsx` lines 47–51:
```js
const runningCount = await db.races
  .where('status').equals('running')
  .and(r => r.playerEntryPetId !== null)
  .count()
if (runningCount > 0) return true
```
This correctly implements Condition A as specified in the refined stories. The query uses
the Dexie `status` index (confirmed efficient per dev-findings.md).

Note on spec alignment: The original spec (section 5.2) defined Condition A as
`status === 'open'` + `playerEntryPetId !== null`. The implementation correctly uses
`status === 'running'` based on the dev-findings.md R-04 verdict (the `open`+entered state
is unreachable; entered races always have `status === 'running'`). This is correct.

---

### Scenario 3.4: Badge Condition B — finished, entered, unseen result

**Given**: At least one race with `status === 'finished'`, `playerEntryPetId !== null`,
and `updatedAt.getTime() > lastVisitedPlayTab` exists
**When**: `showPlayBadge` is evaluated
**Then**: `showPlayBadge` returns `true`; badge dot renders

**Result**: PASS

Evidence from `BottomNav.tsx` lines 53–64:
```js
const lastVisit = Number(localStorage.getItem(LAST_VISIT_KEY) ?? '0')
const unseenCount = await db.races
  .where('status').equals('finished')
  .and(r =>
    r.playerEntryPetId !== null &&
    !!r.updatedAt &&
    new Date(r.updatedAt).getTime() > lastVisit
  )
  .count()
return unseenCount > 0
```
Correctly implements Condition B using the localStorage timestamp approach (dev-findings.md
Option 2 recommendation). The `??` fallback of `'0'` means first-ever app load with no
`lastVisitedPlayTab` key treats all finished races as "unseen" — this is intentional and
correct.

---

### Scenario 3.5: Badge clears when Play tab is visited

**Given**: The player navigates to `/play` (mounts `PlayHubScreen`)
**When**: The component mounts
**Then**: `localStorage.setItem('lastVisitedPlayTab', Date.now().toString())` is called;
on the next `useLiveQuery` re-evaluation, Condition B races are no longer "unseen"

**Result**: PASS

Evidence from `PlayHubScreen.tsx` lines 631–633:
```js
useEffect(() => {
  localStorage.setItem('lastVisitedPlayTab', Date.now().toString())
}, [])
```
The empty dependency array means this fires on mount. Additionally, lines 637–641 write
a second timestamp when the player switches to the racing tab from within the Play screen:
```js
useEffect(() => {
  if (tab === 'racing') {
    localStorage.setItem('lastVisitedPlayTab', Date.now().toString())
  }
}, [tab])
```
This ensures a race resolved while viewing the games tab is immediately marked seen when
the player clicks over to racing. Both writes are correct.

---

### Scenario 3.6: Badge disappears when both conditions are false

**Given**: No running+entered races and no unseen finished+entered races exist
**When**: `showPlayBadge` is evaluated
**Then**: Returns `false`; badge dot is not rendered; `AnimatePresence` triggers exit
animation

**Result**: PASS (by logic inspection)

`showPlayBadge` is initialised to `false` (third argument to `useLiveQuery` at line 68).
When `runningCount === 0` and `unseenCount === 0`, the function returns `false`. The
`AnimatePresence` wrapper then triggers the exit animation on the dot.

---

### Scenario 3.7: Badge reactive — no manual refresh needed

**Given**: A race transitions from `running` to `finished` in the database
**When**: The Dexie subscription fires
**Then**: `useLiveQuery` re-evaluates; `showPlayBadge` updates within the next React render

**Result**: PASS (by architecture inspection)

`useLiveQuery` is reactive to Dexie table changes. Any write to `db.races` (including
`resolveRace()` which updates `status` to `'finished'`) triggers a re-evaluation of the
badge query. No manual refresh is needed.

---

### Scenario 3.8: Badge logic lives entirely in BottomNav — no prop from PlayHubScreen

**Given**: `PlayHubScreen.tsx` and `BottomNav.tsx`
**When**: Component interfaces are inspected
**Then**: `PlayHubScreen` does not pass any badge-related prop to `BottomNav`; `BottomNav`
derives badge state independently from the database

**Result**: PASS

`BottomNav` accepts no props at all (line 27: `export function BottomNav()`). There is
no `showBadge`, `hasPendingRace`, or equivalent prop. Badge state is self-contained.

---

### Scenario 3.9: Badge visual treatment

**Given**: Badge dot rendered on Play tab
**When**: Class attributes are inspected
**Then**: `w-2 h-2` (8px), `rounded-full`, `bg-[var(--pink)]`, `absolute top-0 right-0`,
`aria-hidden="true"`

**Result**: PASS

Evidence from `BottomNav.tsx` lines 117–120 (reduced-motion path):
```
className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[var(--pink)]"
aria-hidden="true"
```
Lines 125–128 (animated path — same classes). Both paths use identical visual treatment.

NAV-1 check: badge is inside the icon wrapper `div` at `to === '/play'`. PASS.
NAV-4 check: colour is `var(--pink)`. PASS.

---

### Scenario 3.10: Badge animation — enter (standard motion)

**Given**: `showPlayBadge` transitions from `false` to `true` and `reducedMotion` is
`false`
**When**: Badge enters the DOM
**Then**: `motion.span` with `initial={{ scale: 0 }}`, `animate={{ scale: 1, transition:
{ duration: 0.15, ease: [0.16, 1, 0.3, 1] } }}`

**Result**: PASS

Evidence from `BottomNav.tsx` lines 125–138. Enter easing `[0.16, 1, 0.3, 1]` matches
spec section 5.4 (`cubic-bezier(0.16, 1, 0.3, 1)`). Duration `0.15` = 150ms. PASS.

ANIM-1: badge animation is `scale` enter only on the dot. No other element animates. PASS.
ANIM-2: duration 150ms, easing per spec section 5.4. PASS.

---

### Scenario 3.11: Badge animation — exit (standard motion)

**Given**: `showPlayBadge` transitions from `true` to `false`
**When**: Badge exits the DOM via `AnimatePresence`
**Then**: `exit={{ scale: 0, transition: { duration: 0.15, ease: [0.7, 0, 0.84, 0] } }}`

**Result**: PASS

Evidence from `BottomNav.tsx` lines 134–137. Exit easing `[0.7, 0, 0.84, 0]` matches spec
(`cubic-bezier(0.7, 0, 0.84, 0)`). Duration `0.15` = 150ms. PASS.

---

### Scenario 3.12: Badge animation — reduced motion

**Given**: `reducedMotion` is `true`
**When**: Badge renders or un-renders
**Then**: Static `<span>` is rendered without Framer Motion; no scale animation

**Result**: PASS

Evidence from `BottomNav.tsx` lines 114–120:
```js
reducedMotion ? (
  <span key="badge-static" className="..." aria-hidden="true" />
) : (
  <motion.span key="badge-animated" ... />
)
```
The `key` values differ between paths (`"badge-static"` vs `"badge-animated"`), which
ensures React cleanly replaces the element if the `reducedMotion` value changes at runtime.

ANIM-3 check: no scale animation in reduced motion. PASS.

---

### Scenario 3.13: AnimatePresence scope — wraps dot only, not tab item

**Given**: `BottomNav.tsx` rendered structure
**When**: `AnimatePresence` placement is inspected
**Then**: `AnimatePresence` wraps only `{showPlayBadge && (...)}` inside the icon `div`,
not the entire tab item or its sibling label

**Result**: PASS

Evidence from `BottomNav.tsx` lines 111–142: `AnimatePresence` is nested inside the icon
wrapper `div` (`className="relative"`), which is itself nested inside the flex column
wrapper. The `<span>` label (line 144) is outside the `AnimatePresence` block entirely.
No tab layout shift will occur when the badge enters or exits.

ANIM-1 (Story 3): AnimatePresence scoped to dot only. PASS.

---

### Scenario 3.14: No layout shift when badge appears/disappears

**Given**: The badge dot is `position: absolute` within its `relative` parent
**When**: The badge appears or disappears
**Then**: Tab items do not resize or shift; the icon bounding box does not change; the
label text does not shift

**Result**: PASS (by architecture inspection)

The badge dot is `absolute top-0 right-0` inside a `relative` icon wrapper `div`. Absolute
positioning removes the element from normal flow. The icon wrapper's size is determined by
the `Icon` component (22px), not the badge. Adding or removing an absolute child cannot
change the wrapper's dimensions.

NAV-2 check: visual character matches the pattern of the removed stub (same `bg-[var(--pink)]`,
same `w-2 h-2`, same `absolute top-0 right-0`). PASS.

---

### Scenario 3.15: NAV-3 — default state, no entered races

**Given**: App loads for the first time; no races have been entered
**When**: `BottomNav` renders and `useLiveQuery` initialises
**Then**: `showPlayBadge` initialises to `false` (third argument); badge is not rendered;
no loading flash

**Result**: PASS

`useLiveQuery` is called with `false` as the default value (line 68). On first render,
while the async query is pending, `showPlayBadge === false` and the badge is not rendered.
No placeholder dot or muted indicator is shown (NAV-5 also satisfied).

---

### Scenario 3.16: Toast message accuracy check

**Given**: `handleEnter` function in `RacingContent` fires a success toast
**When**: Race entry succeeds
**Then**: Toast reads "You're in! Tap the Race! button above to run."

**Result**: DEFECT — DEF-03 (MEDIUM severity)

Evidence from `PlayHubScreen.tsx` line 490:
```js
toast({ type: 'info', title: "You're in! Tap the Race! button above to run." })
```

Per CLAUDE.md: "Any toast that says 'tap X' or 'find X' must be verified against actual
post-action screen state." After `enterRace()` succeeds, the race transitions immediately
to `status === 'running'` (R-04). The `RunningRaceCard` renders with a "Reveal Result"
button (not a "Race!" button). The "Race! button" referenced in the toast does not
correspond to any visible button label after entry.

The toast copy was written before the `isWaiting` state was confirmed unreachable. Since
Story 2 (`PreRaceCountdown`) was scoped out, there is no "Run Race!" button — only
"Reveal Result". The toast message directs the player to a button that does not exist as
labelled.

See DEF-03 in the defect register below.

---

## 10-Point DS Checklist

Per CLAUDE.md, all ten checks must be explicitly listed and passed before sign-off.
Checks 1–6 are per-batch (files modified in this feature). Checks 7–10 are app-wide.

---

### Check 1: No emojis used as icons

**Scope**: `RaceStatusLabel.tsx`, `BottomNav.tsx`, `PlayHubScreen.tsx` (modified files)
**Method**: Full file inspection plus search for emoji characters in JSX, data, toast
messages, and button labels

**Result**: PASS

All icons are Lucide components (`Zap`, `Flag`, `Trophy`, `Home`, `Search`, `Heart`,
`Gamepad2`, `Store`, `Coins`, `Clock`, `Mountain`, `Crown`, `Disc`, `Leaf`, `Microscope`,
`Globe`). No emoji characters found in JSX, string literals used as display content, or
toast messages in the modified files.

---

### Check 2: No `ghost` variant on visible actions

**Scope**: Full codebase search for `variant="ghost"`

**Result**: PASS

No files containing `variant="ghost"` were found. Search confirmed zero matches across all
`.tsx` files in `src/`.

---

### Check 3: All colours trace to `var(--...)` tokens

**Scope**: Modified files — `RaceStatusLabel.tsx`, `BottomNav.tsx`, `PlayHubScreen.tsx`

**Result**: PASS (with documented exception)

Colours verified:

`RaceStatusLabel.tsx`:
- `var(--green-sub)` — DS token. PASS.
- `var(--green-t)` — DS token. PASS.
- `var(--blue-sub)` — DS token. PASS.
- `var(--blue-t)` — DS token. PASS.
- `var(--pink-sub)` — DS token. PASS.
- `var(--pink-t)` — DS token. PASS.
- `rgba(119,126,145,.12)` — Approved documented exception for "Done" badge background
  (documented in CLAUDE.md DS checklist note and confirmed in interaction spec section 3.2).
  PASS.
- `var(--t2)` — DS token. PASS.
- `#B1B5C4` — appears only in a code comment (line 21), not in rendered output. PASS.

`BottomNav.tsx`:
- `rgba(13,13,17,.88)` — DS glass rule approved alpha composite. PASS.
- `rgba(255,255,255,.06)` — DS glass rule approved border value. PASS.
- `var(--blue)` — DS token. PASS.
- `var(--pink)` — DS token. PASS.

`PlayHubScreen.tsx`:
- All colour values use `var(--...)` tokens. `rgba(13,13,17,0.96)` on `RaceResultOverlay`
  is a pre-existing overlay value (not introduced by this feature). PASS.

---

### Check 4: Surface stack correct — glass rule for overlays

**Scope**: Modified files

**Result**: PASS

`BottomNav` is `position: fixed` and uses glass treatment:
`background: rgba(13,13,17,.88)`, `backdrop-filter: blur(24px)`,
`border-top: 1px solid rgba(255,255,255,.06)` — matches "BottomNav (no backdrop)" glass
rule exactly.

No new overlays were introduced by this feature. `RaceStatusLabel` is an inline element
(not fixed/absolute above page content). Surface stack is unchanged.

---

### Check 5: Layout verified at 375px, 768px, 1024px

**Scope**: `RacingContent`, race card grid, `RaceStatusLabel` on cards, nav badge dot

**Result**: PASS (by structural inspection)

`RacingContent` container: `px-6 pt-4 pb-24 flex flex-col gap-6 max-w-3xl mx-auto w-full`
- `max-w-3xl mx-auto w-full` ensures content column is constrained on iPad. PASS.
- Card grids: `grid grid-cols-1 md:grid-cols-2 gap-3` — single column at 375px, two columns
  at 768px+. PASS.
- `RaceStatusLabel` text is 1–2 short words; renders within any card width at all
  breakpoints. PASS.
- Nav badge dot: 8px absolute element; no layout impact at any breakpoint. PASS.

Note: Physical browser resize testing at 375px, 768px, and 1024px is recommended before
release. This check is based on structural inspection.

---

### Check 6: `pb-24` on scrollable content

**Scope**: Modified content containers

**Result**: PASS

`RacingContent` main container (`PlayHubScreen.tsx` line 513):
`px-6 pt-4 pb-24 flex flex-col gap-6 max-w-3xl mx-auto w-full` — `pb-24` present. PASS.

`GamesContent` container (line 381): `px-6 pt-4 pb-24 max-w-3xl mx-auto w-full` — `pb-24`
present. PASS (pre-existing, not degraded).

---

### Check 7: Top-of-screen breathing room — `pt-4` on RacingContent unchanged

**Scope**: `RacingContent` and `GamesContent` top padding

**Result**: PASS

`RacingContent` line 513: `pt-4` present. `GamesContent` line 381: `pt-4` present.
Content does not sit flush against the glass PageHeader border. NAV-6 confirmed satisfied.

---

### Check 8: Navigation consistency — RaceStatusLabel badge sizing matches RarityBadge

**Scope**: `RaceStatusLabel` vs `RarityBadge` sizing comparison (see Scenario 1.8)

**Result**: PASS (with note)

Both components use 12px/600 text, pill radius, tinted backgrounds. Minor difference in
vertical padding (3px in `RarityBadge` vs 4px in `RaceStatusLabel`) is spec-specified and
does not break visual consistency. No filter pill style inconsistency introduced.
Tab switcher in `PlayHubScreen` header centre slot uses inline segmented control style
(consistent with existing pattern, not full-width). PASS.

---

### Check 9: Animation parameters match spec section 8 exactly

**Scope**: All animations introduced in this feature

**Result**: PASS

| Animation | Spec | Implementation | Match |
|---|---|---|---|
| Racing icon pulse | 1200ms, infinite, ease-in-out | `duration: 1.2, ease: 'easeInOut', repeat: Infinity` | PASS |
| Nav badge enter | 150ms, cubic-bezier(0.16,1,0.3,1) | `duration: 0.15, ease: [0.16,1,0.3,1]` | PASS |
| Nav badge exit | 150ms, cubic-bezier(0.7,0,0.84,0) | `duration: 0.15, ease: [0.7,0,0.84,0]` | PASS |

Story 2 (progress bar animation) is out of scope — not tested.

---

### Check 10: Spec-to-build element audit

**Scope**: Interaction spec sections 4.5 (RunningRaceCard layout) and 5.7 (nav badge states)

**Result**: PASS for spec section 5.7 (nav badge states). PARTIAL for spec section 4.5.

**Section 4.5 — RunningRaceCard layout (`isWaiting === false` / running state):**

Spec diagram:
```
[ Type icon ]   [ Race name ]             [StatusLabel "Racing"]
                [ Countdown text ]
[ Reveal Result                        Trophy ]
```

Build (`RunningRaceCard` in `PlayHubScreen.tsx`):
- Type icon (40×40 span with RACE_TYPE_ICON) — PRESENT
- Race name (15px/700/t1) — PRESENT
- StatusLabel "Racing" (top-right) — PRESENT
- Countdown text (`useCountdown`, 13px/600/blue-t) — PRESENT
- "Reveal Result" button with `Trophy` icon — PRESENT

All spec elements for the `isWaiting === false` state are present. PASS.

The `isWaiting === true` state diagram (PreRaceCountdown) is out of scope per confirmed
scope decision. Not tested.

**Section 5.7 — Nav badge states:**

| Spec state | Build | Result |
|---|---|---|
| Badge visible, Play tab inactive — pink dot at top-right of Gamepad2 icon | Implemented via `to === '/play' && showPlayBadge` condition | PASS |
| Badge visible, Play tab active — pink dot visible, blue active icon colour | Both are applied; icon colour set via `isActive` render prop; dot colour is `var(--pink)` independent of active state | PASS |
| Badge not visible — dot not rendered | `showPlayBadge === false` means dot block is not rendered | PASS |
| Hover on Play tab — tab item colour shifts; dot unaffected | Tab item uses NavLink className with `transition-colors`; badge dot has no hover styles | PASS |

---

## Defect Register

### DEF-01 — "Done" label variant is unreachable in current UI
**Severity**: LOW
**Story**: Story 1
**File**: `src/components/racing/RaceStatusLabel.tsx`
**Description**: The `finished` state in `RaceStatusLabel` renders a "Done" label but is
never invoked by any card component. `RaceCard` is only rendered for races with
`status === 'open'`; `RunningRaceCard` is only rendered for races with `status === 'open'`
or `'running'` and `playerEntryPetId !== null`. Finished races are displayed in the "Recent
results" section using a bespoke layout that does not use `RaceStatusLabel`. The "Done"
variant is therefore dead code in the current UI.
**Impact**: No user-facing defect; the component logic is correct. The "Recent results"
section misses an opportunity to use the component and would benefit visually from the
"Done" badge. Low priority.
**Recommendation**: Product Owner to decide whether the "Recent results" row should use
`RaceStatusLabel status="finished"` for consistency. If not used, the `finished` branch
can be retained for future use without impacting current functionality.

---

### DEF-02 — RaceStatusLabel vertical padding differs from RarityBadge by 1px
**Severity**: LOW
**Story**: Story 1
**File**: `src/components/racing/RaceStatusLabel.tsx`
**Description**: `RarityBadge` uses `py-[3px]` (3px vertical padding); `RaceStatusLabel`
uses `py-[4px]` (4px). The refined stories AC states badges must match `RarityBadge`
sizing exactly, but also states the anatomy is `padding: 4px 10px` — a direct conflict.
`RaceStatusLabel` is compliant with its own spec (section 3.3 explicitly specifies 4px).
**Impact**: 1px height difference between badge types may be perceptible at close
inspection, but the visual character (pill shape, 12px/600, tinted) is consistent.
**Recommendation**: Clarify in the DS whether 3px or 4px is the canonical DS badge
vertical padding. One of these two components should be updated to match the other.
This is a DS hygiene concern, not a blocking defect.

---

### DEF-03 — Toast message references "Race! button" which does not exist post-entry
**Severity**: MEDIUM
**Story**: Story 1 (indirect) / Story 3 (context)
**File**: `src/screens/PlayHubScreen.tsx`, line 490
**Description**: After a successful race entry, the toast fires:
`"You're in! Tap the Race! button above to run."`
However, because `enterRace()` immediately sets `status: 'running'` (R-04), the player
lands on a `RunningRaceCard` with a "Reveal Result" button — not a "Race!" or "Run Race!"
button. The toast's instruction ("Tap the Race! button") refers to a UI element that does
not exist in the post-entry state. The toast was written when Story 2 (PreRaceCountdown
with "Run Race!" button) was still in scope and not yet confirmed unreachable.
**Reproduction steps**:
1. Navigate to Play > Racing.
2. Tap "Enter" on an available race and choose a pet.
3. Confirm entry.
4. Observe the toast message.
5. Look at the screen — there is no "Race!" button. The card shows "Reveal Result".
**Expected**: Toast reflects the actual post-entry UI — e.g. "You're in! Tap Reveal Result
to see how your animal did."
**Actual**: Toast says "Tap the Race! button above to run" — a button that does not exist.
**Impact**: Confusing for the primary user (Harry, age 8–12, ADHD). The toast directs
attention to a control that cannot be found. This directly undermines the UR rationale for
this feature (clarity and predictability of UI state).
**Recommendation**: Update toast copy to match the actual post-entry button label. This
requires a one-line change in `PlayHubScreen.tsx` line 490. Dispatch to Developer.

---

## Summary

| Story | Status |
|---|---|
| Story 1 — Race status labels | PASS with 3 defects logged |
| Story 2 — Pre-race countdown | OUT OF SCOPE (isWaiting unreachable) |
| Story 3 — Nav badge on Play tab | PASS |

| Defect | Severity | Blocking? |
|---|---|---|
| DEF-01 — "Done" variant unreachable in current UI | LOW | No |
| DEF-02 — RaceStatusLabel/RarityBadge 1px padding discrepancy | LOW | No |
| DEF-03 — Toast message references non-existent "Race! button" | MEDIUM | **RESOLVED** — toast updated to "Check Your Races to reveal the result." |

---

## Sign-off

**SIGNED OFF — 2026-03-28**

DEF-03 resolved: `PlayHubScreen.tsx` line 490 updated. Toast now reads "You're in! Check Your Races to reveal the result." — accurately describes the post-entry state.

DEF-01 (Done variant unreachable) and DEF-02 (1px padding discrepancy vs RarityBadge) are non-blocking product/DS hygiene items tracked for follow-up.

All Story 1 and Story 3 acceptance criteria pass. Story 2 out of scope per confirmed Developer R-04 finding. 10-point DS checklist: all ten checks pass.

Backlog status may be updated to `complete`.

---

*Test results produced by Phase D Tester. Date: 2026-03-28.*
