# Full App Audit — 2026-03-28

**Tester sign-off:** BLOCKED — critical and high defects must be resolved first

**Audit scope:** All eight primary screens + four key components + cross-cutting concerns (error boundary, toast wiring, badge system, loading states, silent swallows)

**Auditor:** Tester agent, claude-sonnet-4-6

---

## Critical defects

### CRIT-01 — PlayHubScreen: `navigate` called in component scope where no `navigate` variable exists

**File:** `src/screens/PlayHubScreen.tsx` line 702

**Steps to reproduce:**
1. Open the Play hub (`/play`)
2. Tap the Settings gear icon in the top-right of the header

**Expected:** Navigate to `/settings`

**Actual:** Runtime crash — `ReferenceError: navigate is not defined`. The `useNavigate()` hook is called inside `GamesContent()` (line 392) and its return value bound to a local `navigate`. The parent `PlayHubScreen()` component has no corresponding `useNavigate()` call and no `navigate` in scope. Tapping the Settings button throws an uncaught exception.

**Impact:** The Settings icon is visible on every tab of the Play screen. The crash is immediate and reproducible. Any user who taps Settings from the Play hub will see an unrecoverable blank screen (no error boundary exists — see CRIT-02).

**Fix required:** Add `const navigate = useNavigate()` inside `PlayHubScreen()`, or pass the handler as a prop from `PlayHubScreen` to `GamesContent`.

---

### CRIT-02 — No global error boundary

**Files:** `src/main.tsx`, `src/App.tsx`

**Steps to reproduce:**
- Trigger CRIT-01 (Settings tap on Play hub) or any other unhandled React render error.

**Expected:** A graceful fallback UI that lets the user recover (reload, go home).

**Actual:** The full React tree unmounts with a blank screen and a console error. `main.tsx` wraps `<App />` in `<StrictMode>` only. `App.tsx` has no error boundary. There is no `getDerivedStateFromError`, `componentDidCatch`, or any third-party error boundary in the component tree.

**Impact:** Any unhandled exception in any screen will blank the entire app for the user with no recovery path. This is not an acceptable UX for a PWA where the user has no obvious way to reload other than browser chrome.

**Fix required:** Wrap `<AppRouter />` (or `<App />`) in an `ErrorBoundary` component that renders a user-facing fallback with a "Reload" button.

---

### CRIT-03 — RaceResultOverlay uses `position: fixed` inside a Framer Motion `opacity` ancestor without a portal

**File:** `src/screens/PlayHubScreen.tsx`, `RaceResultOverlay` (line 336–387, rendered at line 640–651)

**Issue:** `RaceResultOverlay` is a `motion.div` with `className="fixed inset-0 ..."`. It is rendered inside `RacingContent()`, which is rendered by `PlayHubScreen()`. The `PlayHubScreen` root div does not apply transforms, but `RaceResultOverlay` itself is a `motion.div` with `initial={{ opacity: 0 }}` — meaning during the enter animation the element has `opacity < 1`, which creates a new stacking context. The element's own `position: fixed` is trapped within itself during this window, and any ancestor `motion.*` subtree that applies transforms at the same time would further break positioning.

More critically: the overlay is not rendered via `createPortal(content, document.body)`. Per CLAUDE.md portal requirement rule, any component that renders with `position: fixed` above page content must use `ReactDOM.createPortal`. The `RaceProgressModal` component (also in this file) explicitly calls this out in a comment ("portal-rendered, outside Framer Motion ancestor tree") and is handled correctly. `RaceResultOverlay` is missing the same treatment.

**Steps to reproduce:**
1. Enter a race and wait for it to be resolvable
2. Tap "Reveal Result"
3. During the overlay's opacity enter animation, observe whether any ancestor transform clips or mispositions the overlay

**Fix required:** Wrap `RaceResultOverlay`'s JSX in `createPortal(content, document.body)`, consistent with the portal pattern documented in `design-system/DESIGN_SYSTEM.md`.

---

## High defects

### HIGH-01 — SettingsScreen: Delete all data catch block silently swallows the error with no user feedback

**File:** `src/screens/SettingsScreen.tsx` lines 253–256

**Code:**
```tsx
} catch {
  setDeleting(false)
  setShowDeleteModal(false)
}
```

**Issue:** When the delete transaction fails, the modal is closed and state is reset — but no toast is fired. The user has no idea whether deletion succeeded or failed. Per CLAUDE.md: "A `catch` block that only logs to the console without a toast — prohibited for any operation that affects player state (coins, pets, progress)." Deletion is the highest-impact player-state operation in the app.

**Fix required:** Add `toast({ type: 'error', title: 'Could not delete data. Please try again.' })` in the catch block before closing the modal.

---

### HIGH-02 — SettingsScreen: Export failure is fully silent

**File:** `src/screens/SettingsScreen.tsx` lines 299–301

**Code:**
```tsx
} catch {
  // Export failure is non-fatal
}
```

**Issue:** If export fails (e.g. due to a DB error, quota issue, or blob creation failure) the user receives no feedback. They may believe a backup was created when it was not. This affects data integrity confidence.

**Fix required:** Fire an error toast: `toast({ type: 'error', title: 'Export failed. Please try again.' })`

---

### HIGH-03 — RenameInput: catch block resets input but shows no error to the user

**File:** `src/components/my-animals/RenameInput.tsx` lines 38–42

**Code:**
```tsx
} catch {
  setValue(currentName)
}
```

**Issue:** The rename silently reverts. The user sees their input snap back to the original name with no explanation. Per CLAUDE.md rules, no silent swallow is permitted for operations that affect player state (pet names are player state).

**Fix required:** The component has no `useToast` import. Either import and use `useToast` to fire an error toast, or propagate the error and let `PetDetailSheet` handle it (which already has toast wiring).

---

### HIGH-04 — GradientFade: height is 32px (h-8), spec requires 48px; gradient uses opaque `#0D0D11` not `rgba(13,13,17,.85)`

**File:** `src/components/layout/GradientFade.tsx`

**CLAUDE.md spec:** "The BottomNav always has a gradient fade above it (`height: 48px, linear-gradient to top, rgba(13,13,17,.85) → transparent`)."

**Actual:** `h-8` = 32px, and the gradient stop is `#0D0D11` (fully opaque hex) rather than `rgba(13,13,17,.85)`. The result is a slightly shorter, slightly more opaque gradient edge than specified. On a 1024px iPad display with long content lists (Explore, SchleichScreen) this creates a visually heavier transition than the DS intends.

**Fix required:** Change `h-8` to `h-12` (48px) and the gradient stop to `rgba(13,13,17,.85)`.

---

### HIGH-05 — PageHeader glass opacity is `.72`, not `.88` — undershoots the glass rule for no-backdrop overlays

**File:** `src/components/layout/PageHeader.tsx` line 19

**Actual:** `background: 'rgba(13,13,17,.72)'`

**CLAUDE.md glass rule:** BottomNav (no backdrop) = `rgba(13,13,17,.88)`. PageHeader is a `position: sticky` element sitting above scrolling content — it has no backdrop and therefore should use `.88` to match the BottomNav material. At `.72` it reads noticeably lighter than the BottomNav, creating a visual inconsistency between the top and bottom chrome.

**Fix required:** Change PageHeader background to `rgba(13,13,17,.88)`.

---

### HIGH-06 — `You're in! Check Your Races to reveal the result.` toast message does not match screen state

**File:** `src/screens/PlayHubScreen.tsx` line 520

**Issue:** After entering a race, the toast says "Check Your Races to reveal the result." But after entering, the race transitions from `open` to `running` status. The card shown at that point is a `RunningRaceCard` — it displays a countdown timer and a "Reveal Result" button. There is no distinct "Your Races" section with a separate navigation step required; the card is already visible on the same screen. The toast therefore sends the user looking for a UI element ("Your Races") that does not exist as a separate destination.

Per CLAUDE.md: "Any toast that says 'tap X' or 'find X' must be verified against actual post-action screen state. If the referenced UI element is not visible on screen when the toast fires, the message is misleading."

**Fix required:** Rewrite to reflect what the user actually sees: for example `"Race entered — tap Reveal Result when the race ends."` or `"You're in! Wait for the race to end, then reveal your result."`

---

## Medium defects

### MED-01 — AcceptOfferModal: catch block relies on hook to fire toast but that assumption is not verified in this file

**File:** `src/components/player-listings/AcceptOfferModal.tsx` line 66

**Code:**
```tsx
} catch {
  // Error toast fired by hook. Modal stays open for retry.
}
```

**Issue:** The comment assumes `useMarketplace` fires a toast on failure. If the hook was changed to throw without toasting, this would be a silent swallow. The comment is a maintenance hazard. While acceptable as-is if the hook is tested, it cannot be signed off without auditing `useMarketplace` separately.

**Recommendation:** This defect is conditional — mark as medium risk and flag for the Developer to confirm `useMarketplace` always toasts before rethrowing.

---

### MED-02 — ListForSaleSheet: same pattern as MED-01

**File:** `src/components/player-listings/ListForSaleSheet.tsx` line 125

Same issue: catch block defers to hook for the toast but the assumption is undocumented in the hook. Flag for Developer confirmation.

---

### MED-03 — ExploreScreen: grid uses `grid-cols-4` at smallest breakpoint, not `grid-cols-2`

**File:** `src/screens/ExploreScreen.tsx` line 168

**Actual:** `className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 px-6 pt-4 pb-24"`

**Issue:** At 375px (phone), 4 columns produces cards approximately 72px wide each (after padding and gaps). AnimalCard shows `aspect-square` image + name + type/rarity row. At 72px wide these elements are extremely small and the text is functionally unreadable. CLAUDE.md requires `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` minimum for animal/item grids. ExploreScreen's grid starts at 4 columns and goes to 6, skipping the 2-column base.

**Note:** This may be an intentional departure for this specific compact grid — AnimalCard is designed to be a small card with a name strip rather than a content-rich card. If this is a deliberate design decision it must be documented in the interaction spec. As-is, there is no spec justification on file for bypassing the 2-column minimum.

**Recommendation:** Either revert to `grid-cols-2 md:grid-cols-4 lg:grid-cols-6` or add a spec note to `spec/features/explore-directory/interaction-spec.md` documenting the deliberate small-grid approach.

---

### MED-04 — SettingsScreen: missing `pt-4` content padding — content sits flush against sticky-equivalent header

**File:** `src/screens/SettingsScreen.tsx`

**Issue:** SettingsScreen uses a bespoke header row (not `PageHeader`). The content below starts at a `Section` component (`<Section title="Accessibility">`) with `mb-6` on the section wrapper and `px-6` internally — but no `pt-4` on the content container. CLAUDE.md check 7: "scroll to the top and confirm the first content element has at least `pt-4` clearance below the header bottom edge."

SettingsScreen's custom header has `pt-5 pb-4` which adds to the top of the screen, but the first `Section` immediately follows without breathing room. The accessible element (Section label "Accessibility") appears closer to the header border than the 16px minimum.

---

### MED-05 — PlayHubScreen: `overflow-y-auto` on root div but `RacingContent` does not set `overflow-hidden` on wrapper, risking double-scroll at 1024px with tab content

**File:** `src/screens/PlayHubScreen.tsx` line 695

**Issue:** The root div has `overflow-y-auto`, making the entire `PlayHubScreen` the scroll container. However `RacingContent` renders `GamesContent` or `RacingContent` directly as its child — this is correct at phone widths, but at 1024px landscape the content columns within `GamesContent` and `RacingContent` each have `max-w-3xl mx-auto w-full` and `pb-24` which is correct. This pattern is acceptable but the lack of intermediate `overflow: hidden` between the tab switcher and content means the tab switcher also scrolls away on long content — the tab bar is not sticky. This is a UX regression on iPad at 1024px where the user may scroll past the tab switcher.

**Recommendation:** Verify at 1024px that the tab switcher (in `PageHeader centre slot`) remains visible when the race list is long. If not, mark as High.

---

### MED-06 — AnimalCard: `audio.play().catch(() => {})` — silent swallow on toggle-play re-entry

**File:** `src/components/explore/AnimalCard.tsx` line 123

**Code:**
```tsx
audio.play().catch(() => {})
```

This occurs in `handleTogglePlay` when re-playing a paused audio. A failure to resume playback is silently swallowed. The user would tap Play and nothing would happen. The same pattern appears at line 86 inside `startAudio` which does at least set `setPlaying(false)` and `setShowPlayer(false)` in its catch.

**Fix:** The `.catch(() => {})` at line 123 should at minimum reset playing state, ideally fire an info toast.

---

### MED-07 — SettingsScreen: body scroll lock not present for ConfirmModal; modal could appear while another overlay is open

**File:** `src/screens/SettingsScreen.tsx`

**Issue:** `ConfirmModal` uses `createPortal(content, document.body)` correctly for the portal requirement. However there is no body scroll lock on the settings screen content while the modal is open. On iPad the user can scroll the settings list behind the modal. This does not cause functional breakage but is a UX defect. CLAUDE.md requires body scroll lock to be reference-counted when two overlays could be open simultaneously.

---

## DS checklist results (per screen)

All ten checks per CLAUDE.md. Checks 7–10 are app-wide.

### HomeScreen

| Check | Result | Notes |
|---|---|---|
| 1. No emojis as icons | PASS | Lucide icons only |
| 2. No ghost variant | PASS | No ghost buttons found |
| 3. All colours are CSS var tokens | PASS | No hardcoded hex found |
| 4. Surface stack / glass rule | PASS | PageHeader uses glass (see HIGH-05 for opacity value) |
| 5. `max-w-3xl mx-auto w-full` on content | PASS | Line 79 |
| 6. `pb-24` on scrollable content | PASS | Line 79 |
| 7. `pt-4` clearance below header | PASS | Line 79 `pt-4` present |
| 8. Navigation controls compact/consistent | PASS | No tab switcher on this screen |
| 9. Animation parameters match spec | CONDITIONAL | `DailyBonusCard` animation not audited in this pass — flag for separate check |
| 10. Spec-to-build element audit | NOT FULLY AUDITED | HomeStatCards, FeaturedPetCard, DailyBonusCard internals not read |

### ExploreScreen

| Check | Result | Notes |
|---|---|---|
| 1. No emojis as icons | PASS | |
| 2. No ghost variant | PASS | `variant="outline"` used on Clear filters button |
| 3. All colours are CSS var tokens | PASS | |
| 4. Surface stack / glass rule | PASS | PageHeader glass applied |
| 5. `max-w-3xl mx-auto w-full` on content | FAIL | Grid div at line 168 has no `max-w-3xl mx-auto` — content can span full width on 1024px iPad |
| 6. `pb-24` on scrollable content | PASS | Line 168 |
| 7. `pt-4` clearance below header | PASS | Line 168 `pt-4` present |
| 8. Navigation controls compact/consistent | PASS | Filter pills use tint-pair pattern; sound toggle matches |
| 9. Animation parameters match spec | NOT AUDITED | AnimalDetailModal animation not read in this pass |
| 10. Spec-to-build element audit | NOT FULLY AUDITED | AZRail, AnimalProfileSheet internals not read |

**Additional defect note (check 5):** `ExploreScreen` grid at line 168 (`className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 px-6 pt-4 pb-24"`) lacks `max-w-3xl mx-auto w-full`. On a 1366px iPad landscape display, the grid will span the full viewport width minus the AZRail column, producing 6-column cards approximately 200px wide each with no centring constraint. This is a layout defect — see MED-03.

### MyAnimalsScreen

| Check | Result | Notes |
|---|---|---|
| 1. No emojis as icons | PASS | |
| 2. No ghost variant | PASS | All filter pills use tint-pair; no ghost |
| 3. All colours are CSS var tokens | PASS | |
| 4. Surface stack / glass rule | PASS | PageHeader glass applied |
| 5. `max-w-3xl mx-auto w-full` on content | PASS | Line 394 |
| 6. `pb-24` on scrollable content | PASS | Line 394 |
| 7. `pt-4` clearance below header | PASS | Line 394 `pt-4` present |
| 8. Navigation controls compact/consistent | PASS | Tab switcher is `inline-flex` compact, `centre` slot |
| 9. Animation parameters match spec | NOT AUDITED | PetDetailSheet internals not read |
| 10. Spec-to-build element audit | NOT FULLY AUDITED | |

### PlayHubScreen

| Check | Result | Notes |
|---|---|---|
| 1. No emojis as icons | PASS | |
| 2. No ghost variant | PASS | |
| 3. All colours are CSS var tokens | PASS | `var(--amber)` etc. used for accent colours on solid bar fills — these are intentional (not filter pill active states) |
| 4. Surface stack / glass rule | FAIL | `RaceResultOverlay` is `position: fixed` without portal — see CRIT-03 |
| 5. `max-w-3xl mx-auto w-full` on content | PASS | `GamesContent` line 396, `RacingContent` line 543 |
| 6. `pb-24` on scrollable content | PASS | Both content components |
| 7. `pt-4` clearance below header | PASS | Both content components |
| 8. Navigation controls compact/consistent | PASS | Tab switcher `inline-flex` compact in `centre` slot |
| 9. Animation parameters match spec | NOT AUDITED | RaceProgressModal not read |
| 10. Spec-to-build element audit | FAIL — CRIT-01 | Settings icon in header crashes on tap |

### StoreHubScreen

Only the first 240 lines were read in this audit pass. Full audit of StoreHubScreen deferred — it is the largest screen file (24k+ tokens). Partial findings below.

| Check | Result | Notes |
|---|---|---|
| 1. No emojis as icons | PASS (partial) | Lucide icons used in first 240 lines |
| 2. No ghost variant | PASS — app-wide grep confirms zero instances of `variant="ghost"` | |
| 3. All colours are CSS var tokens | PASS (partial) | LeMieuxItemCard uses `var(--...)` tokens |
| 4–10 | NOT FULLY AUDITED | Full read required |

**Recommendation:** StoreHubScreen requires a dedicated Phase D pass given its size and complexity.

### SchleichScreen

| Check | Result | Notes |
|---|---|---|
| 1. No emojis as icons | PASS | |
| 2. No ghost variant | PASS | `variant="outline"` and `variant="primary"` used; comments confirm ghost prohibition noted |
| 3. All colours are CSS var tokens | PASS | |
| 4. Surface stack / glass rule | PASS | BottomSheet portal confirmed in comment (Modal.tsx line 201) |
| 5. `max-w-3xl mx-auto w-full` on content | PASS | Both tab motion.div wrappers have this class |
| 6. `pb-24` on scrollable content | PASS | Both tab motion.div wrappers |
| 7. `pt-4` clearance below header | PASS | `pt-4` present on both tab containers |
| 8. Navigation controls compact/consistent | PASS | TabSwitcher is `inline-flex` compact in `centre` slot; SchleichCategoryPills in `below` slot |
| 9. Animation parameters match spec | PASS | 150ms linear opacity cross-fade, matches CLAUDE.md tab cross-fade pattern |
| 10. Spec-to-build element audit | NOT FULLY AUDITED | SchleichDetailSheet internals not read |

### GenerateScreen

| Check | Result | Notes |
|---|---|---|
| 1. No emojis as icons | PASS | All icons are Lucide |
| 2. No ghost variant | PASS | |
| 3. All colours are CSS var tokens | PASS | |
| 4. Surface stack / glass rule | PASS | `GeneratingOverlay`, `AdoptionOverlay`, `TraderPuzzle` are separate components — portal behaviour not confirmed in this pass |
| 5. `max-w-3xl mx-auto w-full` on content | PASS | Line 515 `max-w-3xl mx-auto w-full` |
| 6. `pb-24` on scrollable content | CONDITIONAL | Wizard wrapper has `overflow-hidden` not scrollable content — `pb-24` only required on scrollable areas. ResultsScreen not audited |
| 7. `pt-4` clearance below header | PASS | Line 515 `pt-4` present |
| 8. Navigation controls compact/consistent | PASS | No tab switcher on this screen |
| 9. Animation parameters match spec | PASS | `duration: 0.2`, reducedMotion respected |
| 10. Spec-to-build element audit | NOT FULLY AUDITED | ResultsScreen, AdoptionOverlay, TraderPuzzle not read |

**Badge check:** `checkBadgeEligibility()` is called after adoption (line 384) with proper `.then()` / `.catch()` chaining, and badge toasts are fired with staggered delays. This is correctly implemented.

### SettingsScreen

| Check | Result | Notes |
|---|---|---|
| 1. No emojis as icons | PASS | |
| 2. No ghost variant | PASS | Custom buttons use inline styles only |
| 3. All colours are CSS var tokens | PASS | All vars present; `rgba(55,114,255,.12)` is DS-documented focus ring alpha |
| 4. Surface stack / glass rule | PASS | `ConfirmModal` uses `createPortal(content, document.body)` and glass treatment `rgba(13,13,17,.92)` + `blur(24px)` |
| 5. `max-w-3xl mx-auto w-full` on content | FAIL | Settings uses `mx-6` section containers — no `max-w-3xl` constraint. On a 1366px iPad landscape the sections span almost the full width with only 24px side padding. Content will look stretched |
| 6. `pb-24` on scrollable content | PASS | Root div has `pb-24` line 371 |
| 7. `pt-4` clearance below header | FAIL — see MED-04 | First section follows header without explicit `pt-4` on the content area |
| 8. Navigation controls compact/consistent | PASS | No tab switcher |
| 9. Animation parameters match spec | NOT APPLICABLE | No animations on this screen |
| 10. Spec-to-build element audit | NOT FULLY AUDITED | PersonalisationSection not read |

---

## Component audits

### BottomNav

- Glass rule: PASS — `rgba(13,13,17,.88)` + `blur(24px)` + `border-top: 1px solid rgba(255,255,255,.06)` matches DS spec exactly
- Portal: NOT APPLICABLE — `position: fixed` at body level, not inside a motion tree
- Badge dot animation: PASS — scale 0→1 with correct easings, `AnimatePresence` wraps the dot only (not the tab item), reduced-motion static fallback present
- `aria-hidden` on badge dot: PASS
- Tab label accessibility: PASS — NavLink with label text

### PageHeader

- Glass rule: FAIL — opacity `.72` instead of `.88` (see HIGH-05)
- `centre` slot: PASS — renders with `justify-center`
- `below` slot: PASS — `flex-col gap-3 pb-4`
- Sticky behaviour: PASS — `sticky top-0 z-[100]`
- Safe-area: PASS — `paddingTop: 'calc(24px + env(safe-area-inset-top, 0px))'`

### AnimalDetailContent

- Content column: PASS — `px-6 pt-4 pb-24 max-w-3xl mx-auto w-full`
- `pt-4` breathing room: PASS — documented in comment
- All colours: PASS — `var(--...)` tokens throughout
- No emojis: PASS

### AnimalCard

- Hover pattern: PASS — correct DS hover lift pattern applied
- `pt-1` on parent grid for hover clip: Provided at the `ExploreScreen` grid level — acceptable
- Audio player overlay: glass treatment correct `rgba(13,13,17,.88)` + `blur(24px)`
- Silent swallow on play resume: FAIL — see MED-06
- Accessibility: PASS — `role="button"`, `tabIndex={0}`, `onKeyDown` handler, `aria-label` on sound buttons, `aria-pressed`, scrub bar has `role="slider"` with aria values

---

## Cross-cutting concerns

### Error boundary
FAIL — no error boundary anywhere in the tree. See CRIT-02.

### Toast system wiring
PASS — `ToastProvider` wraps `AppRouter` in `App.tsx`. `useToast` is available throughout. Error, success, info, and warning types are implemented. Error toasts are persistent (no auto-dismiss). Max 3 visible with oldest-drop behaviour.

### Badge system (`useProgress.checkBadgeEligibility`)
PASS — NOT a stub. The function contains full logic for 16 badge criteria across five tracks (racing, arcade, care, marketplace, rescue). DB reads are real. Deduplication is implemented. Awards are written to `db.badges`. On error, a toast is fired and an empty array is returned. The function is called after adoption in `GenerateScreen`. It is also called in `useRacing` — confirm this separately. The banner errors reported by the user are likely caused by CRIT-01 (the crash in PlayHubScreen which may cascade into the badge check if `useProgress` is called after the `navigate` crash), not a bug in `checkBadgeEligibility` itself.

### Skeleton loading states
MIXED — `AuctionHubScreen` has `SkeletonCard` components and a loading guard. `HomeScreen` has a `loading` state that is passed to `HomeStatCards` and `FeaturedPetCard` — the internals of those components were not read; confirm they show skeletons not empty content. `ExploreScreen`, `MyAnimalsScreen`, `PlayHubScreen`, `SchleichScreen` show no skeleton loading states — they rely on `useLiveQuery` returning empty arrays as the default, meaning the first render shows empty states rather than loading indicators. This is a medium-risk UX issue on first load.

### Duplicate navigation controls
PASS — no duplicate tab bars found. All screens with tab switchers place them exclusively in the `PageHeader centre` slot. Content components receive active state as props and do not render their own tab controls.

### Silent error swallows
- FAIL (HIGH-01): SettingsScreen delete catch — no toast
- FAIL (HIGH-02): SettingsScreen export catch — no toast
- FAIL (HIGH-03): RenameInput catch — no toast, silently reverts
- FAIL (MED-06): AnimalCard `audio.play().catch(() => {})` — functional silent swallow
- CONDITIONAL (MED-01, MED-02): AcceptOfferModal and ListForSaleSheet defer to hooks — unverified

---

## Recommendations

1. **Fix CRIT-01 immediately** — this is a runtime crash reproducible by any user on Play hub. Add `const navigate = useNavigate()` to `PlayHubScreen()`.

2. **Add an error boundary** — the absence of any error recovery path means any unhandled render error leaves the user with a blank screen and no way to recover without a hard browser reload.

3. **Fix the RaceResultOverlay portal** — the overlay is already inside a `motion.div` with `initial={{ opacity: 0 }}` which creates a stacking context. Move it to a portal.

4. **Address the three silent-swallow catch blocks** in SettingsScreen (delete) and RenameInput. These affect player-state operations and violate CLAUDE.md build defect rules.

5. **Run a dedicated audit of StoreHubScreen** — at 24k tokens it could not be fully read in this pass. It imports the most hooks, has the most tabs, and is the most likely source of additional issues.

6. **Audit TraderPuzzle and AdoptionOverlay** — both are rendered as full-screen overlays from GenerateScreen and their portal usage was not confirmed.

7. **Correct GradientFade** — height (32px → 48px) and gradient stop (`#0D0D11` → `rgba(13,13,17,.85)`).

8. **Correct PageHeader glass opacity** (`.72` → `.88`).

9. **Investigate the reported banner errors** — with CRIT-01 confirmed, errors on the Play hub likely originate from the missing `navigate` reference. After fixing CRIT-01, re-test the badge system to confirm whether the errors clear.

10. **Add `max-w-3xl mx-auto` to ExploreScreen grid and SettingsScreen content** — both are missing the centring constraint which will cause stretched layouts at 1024px iPad landscape.

---

**Tester sign-off:** BLOCKED

Defects that must close before sign-off: CRIT-01, CRIT-02, CRIT-03, HIGH-01, HIGH-02, HIGH-03, HIGH-04, HIGH-05, HIGH-06.

Medium defects (MED-01 through MED-07) may be addressed in a follow-up cycle but must be logged in the backlog.

StoreHubScreen requires a separate, full Phase D pass before it can be signed off independently.
