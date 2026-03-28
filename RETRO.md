# Animal Kingdom — Sprint Retro
**Date:** 2026-03-27
**Scope:** Tier 0 foundations → Tier 1 Home screen (first complete feature)

---

## What was built

| Phase | Deliverable | Status |
|-------|-------------|--------|
| Tier 0 | package.json, design system tokens, entity model, system architecture, integration map, build sequence, backlog | Complete |
| Tier 0 | DB schema (17 tables, Dexie v4), core hooks (useWallet, useReducedMotion, useSpeech), shared UI components, navigation shell | Complete |
| Tier 1 | Home screen feature package (6 briefs) + all components + screen | Complete |

---

## Issues, root causes, and fixes

### Issue 1 — `cn` utility missing at runtime

**What went wrong**
Every UI component imported `cn` from `@/lib/utils` (`import { cn } from '@/lib/utils'`). The file didn't exist. The packages it depended on (`clsx`, `tailwind-merge`) also weren't in `package.json`. This caused a hard compile error on first `npm run dev`.

**Root cause**
The utility was referenced in the design system and component specs as a given, but never scheduled as a build deliverable in its own right. It fell into the gap between "spec defines it" and "build creates it".

**Fix**
Create `src/lib/utils.ts`, add `clsx ^2.1.1` and `tailwind-merge ^2.5.5` to `package.json`, run `npm install`.

**How to avoid next time**
Add `src/lib/utils.ts` (or equivalent) as an explicit Tier 0 deliverable in `BUILD_SEQUENCE.md`. Any utility referenced by shared components must be created before those components.

---

### Issue 2 — Barrel export files missing

**What went wrong**
Components imported from `@/components/ui` (barrel) and hooks imported from `@/hooks` (barrel), but `src/components/ui/index.ts` and `src/hooks/index.ts` didn't exist. TypeScript couldn't resolve the imports.

**Root cause**
Barrel files are a convention-over-configuration pattern. The spec assumed they'd exist because the architecture described them, but no build task created them.

**Fix**
Create both index files with explicit named exports for every component and hook.

**How to avoid next time**
Include barrel file creation in BUILD_SEQUENCE.md as the final step of each component group. Alternatively, use direct path imports (no barrels) until a feature is stable, then add the barrel — this surfaces missing exports immediately.

---

### Issue 3 — Leaf hooks referenced but never created

**What went wrong**
`SYSTEM_ARCHITECTURE.md` defined `useSavedNames` and `useProgress` as leaf hooks. `HomeScreen` imported both. Neither existed in `src/hooks/`.

**Root cause**
Hook interfaces were fully specified in the architecture doc but creating them wasn't explicitly listed in the Tier 0 build checklist. They were assumed to be "part of the spec" rather than a concrete task.

**Fix**
Create `useSavedNames.ts` and `useProgress.ts` from scratch, matching the interfaces defined in the architecture doc.

**How to avoid next time**
Every hook listed in `SYSTEM_ARCHITECTURE.md` must have a corresponding item in BUILD_SEQUENCE.md. The Definition of Done for Tier 0 should include: "Every hook listed in the architecture doc has a file in `src/hooks/`."

---

### Issue 4 — `useWallet` not exposing `streak` as a reactive value

**What went wrong**
`HomeScreen` needed `streak` (daily login streak) from `useWallet`. The hook had `wallet?.dailyLoginStreak` accessible internally but didn't return it. TypeScript caught this as a destructuring error.

**Root cause**
The hook's public interface was partially implemented — the value existed in state but wasn't surfaced in the return object.

**Fix**
Add `const streak = wallet?.dailyLoginStreak ?? 0` and include `streak` in the return object.

**How to avoid next time**
When writing a hook, derive and return ALL values the architecture doc specifies in the public interface, even if no consumer needs them yet. Don't defer return values until a consumer asks for them.

---

### Issue 5 — `ensureSkillProgress` called inside `useLiveQuery` callback

**What went wrong**
Initial implementation of `useProgress` called `ensureSkillProgress()` (a DB write) inside the `useLiveQuery` query function. Dexie's live query system tracks reads during the callback to build subscriptions; writes inside that callback corrupt the subscription tracking.

**Root cause**
The `useLiveQuery` API looks like a data fetcher, but its callback is also a dependency tracker. Mixing side effects (writes) into a read callback breaks the abstraction.

**Fix**
Move `ensureSkillProgress()` to a separate `useEffect(() => { ensureSkillProgress() }, [])`. Keep the `useLiveQuery` callback purely read-only.

**How to avoid next time**
Rule to document in CLAUDE.md: `useLiveQuery` callbacks must be pure reads — no writes, no side effects, no async operations that mutate state. Initialisation always goes in `useEffect`.

---

### Issue 6 — Dexie v4 crash: `applyOptimisticOps` null dereference (the hard one)

**What went wrong**
The app would flash the Home screen for ~200ms then go black. Console showed `TypeError: Cannot read properties of null (reading 'type')` deep inside Dexie's internals at `applyOptimisticOps`.

**Initial false lead: "Invalid hook call"**
Early console reads showed `Invalid hook call — hooks can only be called inside a function component` warnings. This led to investigating multiple React instances and Vite CJS interop issues. Added `resolve.dedupe: ['react', 'react-dom']` and `optimizeDeps.include: ['dexie', 'dexie-react-hooks', 'react', 'react-dom']` to `vite.config.ts`. Neither helped. The "Invalid hook call" was a secondary symptom of React's error boundary unwinding after the real crash — not the root cause.

**Lesson from false lead:** When debugging a crash, always find the *earliest* error in the console, not the most prominent one. React's "Invalid hook call" error fires when React's internals are interrupted mid-render — it's almost always a symptom, not a cause.

**Root cause (three layers)**

Layer 1 — Dexie v4.4.1 bug in `applyOptimisticOps`:

```js
// dexie.mjs line 5185 — the bug
const adjustedReq = adjustOptimisticFromFailures(tblCache, reqWithResolvedKeys, res)
tblCache.optimisticOps.push(adjustedReq)  // NO null check — pushes null!
```

`adjustOptimisticFromFailures` returns `null` when all operations in a bulk write fail. That `null` gets pushed into the `optimisticOps` array. Later, when a live query runs, `applyOptimisticOps` iterates the array and crashes on `null.type`. The same function elsewhere in the codebase has a null check (`if (adjustedReq) { push }`), making this a clear oversight in one specific code path.

Layer 2 — Which code path triggers it:

Dexie only enters the buggy path when writing records with a null primary key (autoincrement `++id` fields), because keys are null before the DB assigns them. This causes Dexie to defer the optimistic update until the promise resolves — the path with the missing null check. Tables with explicit primary keys don't trigger it.

Layer 3 — What triggers the write failure:

React StrictMode (dev only) mounts every component twice — mount, unmount, remount — to detect side effects. Both `useEffect` invocations fire `ensureSkillProgress()`. The first invocation reads the DB (empty), starts adding 4 skill area records. The second invocation reads the DB (reads are non-blocking, records not yet committed), also sees empty, also starts adding the same 4 records. The second batch fails with unique constraint violations on `&area`. Failed writes → `adjustOptimisticFromFailures` returns `null` → null pushed into `optimisticOps` → crash.

**Fix**
Wrap `ensureWallet` and `ensureSkillProgress` in `db.transaction('rw', table, async () => { ... })`. When `trans.explicit === true` (explicit user transaction), Dexie short-circuits at line 5160:

```js
if (trans.explicit) return downTable.mutate(req)  // bypasses optimistic ops entirely
```

The optimistic ops path is never entered, so the null-push bug is never triggered. The operations go directly to IndexedDB, serialised by the transaction, so the race condition between StrictMode's two mounts is also resolved.

**How to avoid next time**

1. **All DB initialisation helpers must use explicit transactions.** Any function that checks existence then writes (`if (!exists) { add(...) }`) is a check-then-act race condition. Wrap the whole thing in `db.transaction('rw', ...)`.

2. **Design initialisation to be idempotent under concurrent calls.** Even outside StrictMode, HMR (Vite hot module replacement) can re-execute module-level code. Either use explicit transactions (as above), a module-level once-promise, or `put` semantics (upsert) instead of `add`.

3. **Note in project rules: React StrictMode double-invokes effects in dev.** Any `useEffect` that runs async DB writes will run twice. The code must be safe under concurrent execution.

4. **When debugging a crash that shows secondary React errors:** Read all console output, find the first error chronologically, and trace from there. Secondary React errors (hook call order, context missing, etc.) are almost always unwinding symptoms.

---

## Patterns to add to CLAUDE.md / project rules for next project

```markdown
## DB initialisation rules

- All DB init helpers (ensureX functions) must be wrapped in
  `db.transaction('rw', table, async () => { ... })`.
  Reason: explicit transactions bypass Dexie v4's optimistic ops path,
  preventing the null-push bug (applyOptimisticOps) triggered by concurrent
  invocations under React StrictMode.

- useLiveQuery callbacks must be pure reads. Never write to the DB inside
  a useLiveQuery callback. Initialisation goes in useEffect.

- React StrictMode double-invokes useEffect in dev. Any effect that writes
  to the DB must be safe under concurrent execution. Use transactions.

## Build sequence rules

- src/lib/utils.ts (cn helper) is a Tier 0 deliverable, not optional.
  Add it before any UI component is created.

- Barrel files (index.ts) for each component group and the hooks directory
  are Tier 0 deliverables, created immediately after the group is complete.

- Every hook listed in SYSTEM_ARCHITECTURE.md must have a file in src/hooks/
  before Tier 1 features begin. Include in Tier 0 Definition of Done.

- Every public interface value defined in the architecture doc must be
  returned from the hook — don't wait for a consumer to ask for it.

## Debugging rules

- When a crash shows secondary React errors (Invalid hook call, hooks called
  outside component, etc.), those are almost always symptoms. Find the first
  error in the console and trace from there.

- Add resolve.dedupe and optimizeDeps.include to vite.config.ts from the
  start for all Dexie projects — these don't fix the optimisticOps bug but
  are correct practice for CJS/ESM interop with dexie-react-hooks.
```

---

## What went right

- **Feature package discipline held.** All 6 briefs (UR, UX, PO, Dev, FE, Test) were written before any Home screen code was touched. When the build started, every decision was already made.
- **Design system locked values down.** No invented colours, spacing, or radii. Every visual value came from `DESIGN_SYSTEM.md`.
- **The Dexie crash diagnosis was systematic.** Even though the false lead (Invalid hook call) cost time, reading the full 200-line console output revealed the actual stack trace with the exact line number in Dexie's source, making the root cause provable rather than guessed.
- **The fix was targeted.** No workarounds, no version downgrades — one structural change (explicit transactions) that addresses all three layers of the root cause simultaneously.

---

---

# Animal Kingdom — Acceptance Criteria Retro
**Date:** 2026-03-27
**Scope:** Post-build AC review — issues that required [OWNER] manual fixes after Phase D sign-off

---

## What was built

Features reviewed: `pack-confirmation`, `player-listings`, `auctions`, `compare`, `generate-rarity-gate`.
Five categories of manual fix required [OWNER] intervention after the Tester had signed off. All five
trace to gaps in acceptance criteria, not to missing process steps. The process was followed; the
criteria were incomplete.

---

## Issues, root causes, and fixes

### Issue 1 — Navigation placement: section tabs in wrong PageHeader slot

**What went wrong**
Section tabs were placed in the wrong slot of `PageHeader`. The Tester had no written criterion
specifying which slot to use, so they passed the feature when tabs appeared and functioned.
[OWNER] had to manually move them after sign-off.

**Root cause**
No AC pattern required navigation elements to name their insertion point in an existing shared
component. "Tabs are present and interactive" is binary and passable without structural correctness.
The interaction spec named the component but not the slot. The PO stories echoed this omission.

**Fix**
Manual move by [OWNER] post sign-off.

**How to avoid next time**
Every story introducing tabs, pills, or segmented controls must include NAV-1: name the exact host
component and slot. "Tabs render in the PageHeader filter slot, below the title row, not in the
title slot" is testable; "tabs are present" is not.
See mandatory AC block NAV-1 now in `product/_feature-template/refined-stories.md`.

---

### Issue 2 — Visual inconsistency: filter pills styled differently from existing screens

**What went wrong**
New filter pills were built as custom inline elements rather than using the existing `CategoryPills`
component. They were functional and visually similar, but not identical. The Tester had no AC
specifying which component to use, so they passed the feature. [OWNER] identified the inconsistency
after sign-off.

**Root cause**
No AC pattern required new filter/pill components to reference and match an existing equivalent.
Consistency checks were assumed to happen during FE self-review, which is a process step — not an
acceptance criterion. A Tester can only fail what is written down.

**Fix**
Manual restyle by [OWNER] post sign-off.

**How to avoid next time**
Every story introducing filter, tab, or pill navigation must include NAV-2: name the specific
component to reuse (e.g. "uses the `CategoryPills` component with the same props pattern as
ExploreScreen"). "Styled consistently" is not testable. A component name is testable.
See mandatory AC block NAV-2 now in `product/_feature-template/refined-stories.md`.

---

### Issue 3 — Error path untested: purchase flow (card packs) had no error path wallet assertion

**What went wrong**
The pack-confirmation stories included an error path criterion: "if `openPack()` returns
`{ success: false }`, error toast fires." The Tester confirmed the toast existed and signed off.
There was no AC requiring the Tester to verify the wallet balance was unchanged in the error path.
A code path existed where coins could be permanently spent without a reveal completing.

**Root cause**
Transaction error path AC required only that a notification mechanism exist. It did not require
the observable financial state — the wallet balance — to be checked. This is a fundamental gap:
the purpose of an error path in a coin spend flow is to protect the user's balance, not to show
a message. The message is the secondary concern.

**Fix**
Manual wallet balance verification and code correction by [OWNER] post sign-off.

**How to avoid next time**
Every transaction story must include TRANS-2: "when the transaction call returns an error or throws,
`useWallet().coins` is identical to the pre-transaction balance. The balance must be explicitly
checked in the error path test — confirming a toast fires is not sufficient."
See mandatory AC block TRANS-2 now in `product/_feature-template/refined-stories.md`.

---

### Issue 4 — Animation quality: confetti was minimal, below the standard the spec implied

**What went wrong**
The celebration animation was built and passed Tester sign-off because it played. No AC specified
what elements a celebration must contain. The implementation used a basic opacity fade. The
card-reveal-spec.md (written for a later phase) established a rarity-tiered system with named
visual components; but the original refined stories for the preceding feature had no AC that
named required animation elements or cited a spec section.

**Root cause**
"Animation plays" is not a testable criterion for quality. Without a named set of required visual
components (glow layer, scale spring, particles, sweep), any animation — including a single-frame
fade — passes. The PO wrote functional criteria but no quality floor.

**Fix**
Manual animation revision by [OWNER] post sign-off.

**How to avoid next time**
Every celebration story must include ANIM-1 (named visual components) and ANIM-2 (spec section
citation). If no interaction spec section defines the animation, Phase B is incomplete and the
feature should not proceed to Phase C. "Animation plays" must never appear as an AC item without
at least one named visual component requirement alongside it.
See mandatory AC blocks ANIM-1 and ANIM-2 now in `product/_feature-template/refined-stories.md`.

---

### Issue 5 — Spacing: pt-4 missing from content area below header/tabs

**What went wrong**
Content flushed directly against the PageHeader with no top padding. The Tester's 6-point DS
checklist covers `pb-24` for bottom padding, but no equivalent check exists for top-of-content
gap. The FE missed it; the Tester had no criterion to catch it.

**Root cause**
Spacing AC and the DS checklist were bottom-focused (`pb-24`). Content flush at the top is
visually as broken as content hidden at the bottom, but the template did not require the top
gap to be verified. The CLAUDE.md responsive layout rules mention `pb-24` explicitly but contain
no equivalent `pt` requirement for content below a header or tab bar.

**Fix**
Manual `pt-4` addition by [OWNER] post sign-off.

**How to avoid next time**
Every story that introduces content rendered below a header or tab bar must include NAV-6:
"the first content element has `pt-4` minimum between the tab bar and the content, verified
at 375px and 1024px." This also applies to any screen not using tabs — content must always
have breathing room below the PageHeader.
See mandatory AC block NAV-6 now in `product/_feature-template/refined-stories.md`.

---

## Changes made to process artefacts

### `product/_feature-template/refined-stories.md` — updated

A new "Mandatory AC blocks" section has been added, containing three blocks:
- **TRANS-1 through TRANS-7** — applies to every purchase/transaction story
- **NAV-1 through NAV-6** — applies to every navigation/tabs/filter story
- **ANIM-1 through ANIM-6** — applies to every animation/celebration story

Each block must be copied verbatim into the relevant story's acceptance criteria. The blocks
are not optional. The Definition of Done in the template now explicitly requires Tester
verification of NAV-6 (content spacing) and TRANS-2 (error path wallet balance) by name.

The PO must check which blocks apply to each feature during Phase B and include them before
writing story-specific criteria. If a story involves a coin spend, NAV placement, or animation,
the corresponding block is not optional — it cannot be deferred to "FE self-review" or "Tester
judgment."

### What was NOT changed

- CLAUDE.md has not been modified. The retro findings are process-level (AC templates), not
  build rules. CLAUDE.md governs how the team builds; the template governs what passes. Both
  layers need to be correct. A CLAUDE.md change would not have prevented these issues — only
  written AC would have.
- Existing refined-stories.md files for shipped features have not been back-filled. The fixes
  are already in production; back-filling closed stories adds no value.

---

## What went right

- **The interaction spec for pack-confirmation and card-reveal was thorough.** Once the card-reveal
  spec was written, it contained everything the FE needed: named components, exact animation
  parameters, reduced-motion fallbacks, rarity tier mappings. The failure was not that the spec
  was weak — it was that the AC did not require the spec to be followed element-by-element.
- **The wallet hold/split pattern in auctions was well-specified.** TRANS-style criteria were
  naturally present in auctions because the bid-hold mechanic demanded explicit before/after
  wallet assertions. That feature had the fewest post-sign-off fixes.
- **Scope decisions were documented clearly.** All five scope decisions across player-listings and
  auctions (preset price tiers, undo window, NPC naming, counter-offer deferral, accessibility mode)
  were written with explicit rationale and not contested at build time.

---

## Running defect log — DS badge pattern violations (2026-03-28)

**Pattern:** Off-spec badge and indicator choices are recurring across multiple features. Three confirmed instances in the Schleich and LeMieux phases alone:

1. **SchleichCard owned indicator** — solid `var(--green)` circle with white `Check` icon. Violated: DS tint-pair rule (badges never solid colour + white text). Fixed to: `var(--green-sub)` bg + `var(--green)` border + `var(--green-t)` text pill.
2. **StoreHubScreen filter pills** — active pills used solid `var(--blue)` fill with white text. Violated: DS tint-pair rule for filter pills. Fixed to: `var(--blue-sub)` bg + `var(--blue)` border + `var(--blue-t)` text.
3. **SchleichDetailSheet info row dividers** — used Tailwind `divide-x` with inline `divideColor` which has no effect in Tailwind; dividers rendered as default black. Fixed to: explicit `border-left: 1px solid var(--border-s)` on middle cell.

**Root cause:** FE agents are applying the 10-point DS checklist as a single end-of-feature pass rather than a per-component gate. By the time the checklist runs, the pattern is already baked in and costs a rework cycle.

**Rule added to CLAUDE.md (effective immediately):**

> **DS badge / indicator gate — per-component, not end-of-feature:**
> Before rendering any badge, pill, dot, icon-in-circle, or status indicator, answer:
> 1. Does it use a solid colour with white/light text? → STOP. Use the tint-pair (sub bg + border + text variant).
> 2. Is the active state of a filter pill using solid fill? → STOP. Use `--blue-sub` bg + `--blue` border + `--blue-t` text.
> This check runs immediately after writing the JSX for that element — not at the end of Phase C.

---

## Defect retrospective — 2026-03-28 (in-session, owner-reported)

### Issue — AuctionDetailSheet: card image pattern used inside a bottom sheet

**What went wrong**
`AuctionDetailSheet` displayed the auction animal image as a full-width `aspect-video` (16:9) hero, filling the entire sheet width. Every other bottom sheet in the app (`PetDetailSheet`, `ListForSaleSheet`, `CollectedCardDetailSheet`) uses a compact `w-20 h-20` thumbnail in a header row alongside the name and metadata. The hero image pushed all bid controls off-screen on phone.

**Root cause**
The FE built the detail sheet after building the grid card. The card correctly uses `aspect-video`. The FE copied the image block from the card into the sheet without checking an existing sheet implementation for the established pattern.

**Fix applied**
Replaced the full-width hero with the compact header row (`w-20 h-20 rounded-xl`) matching `PetDetailSheet`.

**Rule added to CLAUDE.md**
"FE — BottomSheet image pattern check": before building any new BottomSheet, read `PetDetailSheet.tsx` and match its image treatment. `aspect-video` is for cards only, never sheets.

**Prevention going forward**
The Tester's DS checklist item 10 (spec-to-build audit) should explicitly check image sizing against the DS pattern when a detail sheet is under test. If the spec doesn't specify image size for a sheet, the Tester must flag it as a spec gap — not leave it to FE discretion.

