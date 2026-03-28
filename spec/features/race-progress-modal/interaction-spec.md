# Interaction Spec — RaceProgressModal

**Feature:** race-progress-modal
**Phase:** A (UX)
**Designer:** UX Designer agent
**Date:** 2026-03-28
**Status:** Draft — awaiting Phase B PO review

---

## 1. Context and purpose

After entering a race, the player sees a `RunningRaceCard` in the Racing tab. It shows the race name, a "Racing" status pill, a countdown, and a "Reveal Result" button. The card is functional but offers nothing to look at while waiting.

This modal gives the player something engaging to open while the race counts down. It is not a progress tracker — results are pre-determined at `resolveRace()` call time (developer finding R-04). The modal's job is to transform a passive wait into an anticipation moment. It must not simulate or imply live race positions.

The modal opens when the player taps anywhere on the `RunningRaceCard` body *except* the "Reveal Result" button. It is a BottomSheet, not a centred modal. On iPad it is constrained in width. It does not replace the reveal flow — it makes the CTA easier to reach.

---

## 2. UR findings applied

From `research/racing-improvements/ur-findings.md`:

- **No deadline framing** — "Ends in" language is prohibited. All time references use reward framing: "Racing now", "Almost there", "Ready to reveal!". (UR findings 3a, 4.)
- **Visual progress over numeric countdown** — a filling bar reads as anticipation, not a draining timer. (UR finding R-02, finding 5.)
- **Redundant status signals** — colour + icon + label for every distinct state. (UR finding 3c.)
- **No simulated positions** — showing position order implies a live race and risks mismatch when the result is revealed. (Developer constraint R-04.)
- **Reward-valence throughout** — this is an exciting waiting moment, not an obligation or a deadline. (UR findings 3a, 3d.)

**Note — UR gap:** `research/race-progress-modal/ur-findings.md` does not exist at spec time. This spec is based on the prior racing-improvements UR findings and code analysis alone. Any finding specific to this modal's engagement pattern (whether the anticipation framing lands with Harry; whether the participant strip adds value or noise; whether the animal hero section motivates return visits) should be gathered post-launch or in a concurrent UR pass and used to refine the design before Phase C if available.

---

## 3. What the modal does NOT show

These are hard constraints and must not be circumvented by "decorative" treatments that imply the same meaning:

- No numbered positions (1st, 2nd, 3rd) during the race
- No movement or animation that suggests one participant is ahead of another (no horse-race bar, no relative position indicators, no staggered reveal of names in position order)
- No language implying the outcome is known: "your animal is leading", "looks good!", "neck and neck"
- No deadline language: "Ends in", "Expires", "Time running out", "Closes in", "Hurry"
- No `finishesAt` time displayed as a raw countdown string

---

## 4. PageHeader slot assignment

This modal renders over the Racing content. It introduces no PageHeader controls. The existing Play hub header (`centre` slot: Games / Racing tab switcher; `trailing` slot: CoinDisplay) is unchanged and is occluded by the modal backdrop while the sheet is open.

---

## 5. Layout structure

### 5.1 Sheet container

```
Type:         BottomSheet (slides up from bottom)
Trigger:      tap RunningRaceCard body (not the "Reveal Result" button)
Dismiss:      tap backdrop, tap close button, tap "Reveal Result" CTA (closes + triggers resolve)
Max height:   80vh (override the default 85vh — this sheet has fixed-height sections)
iPad:         content column constrained to max-w-xl mx-auto w-full (512px max)
Surface:      rgba(13,13,17,.80) + backdrop-filter: blur(24px)
              border-top: 1px solid rgba(255,255,255,.06)
              border-left: 1px solid rgba(255,255,255,.04)
              border-right: 1px solid rgba(255,255,255,.04)
Backdrop:     bg-black/30 (fixed inset-0, z-[1000]) — tap to dismiss
Portal:       must use ReactDOM.createPortal(content, document.body)
Scroll:       internal overflow-y-auto on content area; sheet itself does not scroll
```

The close button follows the DS pattern: 32px circle, `bg: var(--elev)`, `color: var(--t3)`, top-right corner, hover: `bg: var(--border), color: var(--t1)`.

The drag handle follows the DS pattern: `width: 40px; height: 4px; background: rgba(255,255,255,.2); border-radius: 9999px; margin: 8px auto 0`.

### 5.2 Content sections (top to bottom)

```
[Drag handle]
[Header row]
[Animal hero section]
[Participants strip]
[Progress / status section]
[Primary CTA]
```

Content padding inside the sheet: `px-6 pt-4 pb-8`.

---

## 6. Section anatomy

### 6.1 Header row

**Content:** race type icon + race name + `RaceStatusLabel` component

```
Layout:       flex items-center gap-3
Icon:         race type icon, 28px, matching RACE_TYPE_ICON map from PlayHubScreen
              sprint → Zap, amber tint
              standard → Flag, blue tint
              endurance → Mountain, green tint
              championship → Crown, purple tint
Race name:    text-[17px] font-700 text-t1, flex-1 min-w-0, truncate
Status pill:  RaceStatusLabel component, status="running", shrink-0
              (reuse existing — do not re-implement)
```

The status pill uses the existing `RaceStatusLabel` component with `status="running"`, which renders "Racing" in pink tint pair with an animated Zap icon. Reduced motion: icon renders statically per that component's existing behaviour.

No sub-header text. No prize pool value in this header — this is an in-race moment, not a decision moment.

### 6.2 Animal hero section

**Purpose:** show the player's entered animal prominently. This is the emotional centre of the sheet — the player sees their animal "in the race".

```
Layout:       flex flex-col items-center gap-3, py-5
Image:        AnimalImage component
              Size: 96px × 96px (w-24 h-24)
              Border radius: 16px (--r-lg)
              Border: 2px solid var(--blue)        ← player highlight
              Box shadow: var(--glow-blue)          ← racing glow
              Animation: gentle vertical bob (see animation table, section 10)
              Reduced motion: image renders statically, no bob
Pet name:     text-[18px] font-700 text-t1, text-center
Breed:        text-[13px] text-t3, text-center
```

**Data source:** `race.playerEntryPetId` is the pet's id. The FE must look up the pet in `useSavedNames()` (the `pets` array) to get `imageUrl`, `name`, and `breed`. If the lookup fails (pet deleted), render a placeholder: `w-24 h-24 rounded-2xl bg-[var(--elev)] border-2 border-[var(--blue)]` with a `Zap` icon (28px, `var(--blue-t)`) centred inside.

**Design rationale:** the animal image is the emotional hook. By making it large, centred, and gently animated, the player feels that *their* animal is the star — not an entry in a list. The blue glow connects to the racing colour scheme without implying live position.

### 6.3 Participants strip

**Purpose:** give a sense of the field — there are other animals in this race. Does not show order or ranking.

```
Layout:       flex flex-col gap-1
Section label: "Racing alongside" — text-[11px] font-700 uppercase tracking-widest text-t3, mb-2
Row per participant (excluding the player's own animal):
  Layout:     flex items-center gap-2, py-1
  Avatar:     w-7 h-7 (28px) rounded-full bg-[var(--elev)]
              Shows a generic silhouette via Zap icon (14px, var(--t4))
              No actual animal images for NPCs — they have no imageUrl
  Name:       text-[13px] font-500 text-t2
  Breed:      text-[12px] text-t3, ml-auto (pushed right)
```

**Participants are shown in their stored array order only** — this is the order they were generated, not a race position. FE must not sort them. The player's own entry is omitted from this strip (they are shown above in the hero section).

**Overflow:** if there are more than 6 NPC participants, show the first 6 and a footer line: `+N more runners` in `text-[12px] text-t3`. Standard races have 6 runners (5 NPCs); endurance and championship have 8 (7 NPCs). Sprint has 4 (3 NPCs). Maximum visible strip rows without the overflow label: 6.

**Design rationale:** the strip communicates "this is a real race with other entrants" without introducing cognitive load. Plain name + breed in a quiet colour hierarchy keeps the player's attention on their own animal. No rankings, no scores, no indicators of relative speed.

### 6.4 Progress / status section

This section has two states: **racing** (countdown not yet elapsed) and **ready** (countdown has elapsed). The transition between states happens in real time if the modal is open when the race becomes ready.

**Divider above this section:** `border-t border-[var(--border-s)] mt-4 pt-4`

#### State A — Racing (finishesAt in the future)

```
Layout:       flex flex-col gap-2

Label:        "Racing now..." — text-[13px] font-600 text-[var(--blue-t)]
              Icon: Zap 14px, var(--blue-t), inline before label
              Reduced motion: no icon animation

Progress bar:
  Track:      h-2 w-full rounded-full bg-[var(--elev)]
  Fill:       h-full rounded-full
              background: linear-gradient(to right, var(--blue), var(--pink))
              width: animated 0% → computed fill percentage
              Computed fill: ((now - race.startsAt) / (race.finishesAt - race.startsAt)) × 100
              Clamped: min 5% (so the bar is never invisible), max 95% (never full while racing)
              Updates: every 5 seconds (not every second — avoids jank and over-ticking)
              Transition: width ease-out 4s (smooth crawl between 5-second updates)
              Reduced motion: instant jump to computed value, no transition

Sub-label:    "Almost there!" when fill ≥ 80%
              No sub-label when fill < 80%
              text-[12px] text-t3, text-right
```

The label "Racing now..." uses reward framing, not deadline framing. The bar fills (accumulates) rather than drains — consistent with UR finding R-02.

#### State B — Ready (finishesAt has elapsed)

The bar is replaced entirely. The transition is animated when the change happens while the modal is open.

```
Layout:       flex flex-col items-center gap-2 py-2

Icon:         Trophy, 32px, color: var(--amber-t)
              Animation: scale pulse 1.0 → 1.08 → 1.0, 1.5s loop
              Reduced motion: static

Primary text: "Ready to reveal!" — text-[20px] font-700 text-t1, text-center

Sub text:     "Your result is waiting." — text-[13px] text-t3, text-center
```

The CTA button (section 6.5) also becomes more prominent in this state — see below.

**Transition animation (state A → B):**

When `finishesAt` elapses while the modal is open, the progress section cross-fades from state A to state B:

- State A content: `opacity: 1 → 0`, `y: 0 → -8px`, duration 200ms ease-in
- State B content: `opacity: 0 → 1`, `y: 8px → 0`, duration 300ms ease-out, delayed 200ms
- Reduced motion: instant swap, no animation

### 6.5 Primary CTA — Reveal Result

The "Reveal Result" button is always visible in the modal. It is never hidden. Its prominence increases when the race is ready.

```
Layout:       mt-4 (margin above button)
Component:    Button
Icon:         Trophy size={16} inline before label text

State A (racing):
  variant:    "primary"   (blue, --blue bg, white text)
  size:       "lg"        (48px height, 0 28px padding)
  className:  "w-full"
  Label:      "Reveal Result" + Trophy icon
  Behaviour:  tappable (not disabled) — player can reveal early if they choose

State B (ready):
  variant:    "accent"    (pink, --pink bg, white text)
  size:       "lg"
  className:  "w-full"
  Label:      "Reveal Result" + Trophy icon
  Transition: variant change is animated via a short scale pulse on transition
              scale 1.0 → 1.03 → 1.0, 300ms ease-out
              Reduced motion: instant variant change, no pulse
```

**On tap:** the modal closes (exit animation plays) and `onResolve(race)` fires — the same handler used by the "Reveal Result" button on the card. The player arrives at the `RaceResultOverlay` with no extra steps.

**Design rationale:** making the button available in state A means the player is never blocked. The state A → B variant change (blue → pink) is a reward signal: the CTA uses the accent/reward colour only when results are genuinely ready, preventing premature excitement while still allowing early reveals.

---

## 7. Interaction states

### Reveal Result button

| State | Treatment |
|---|---|
| Resting (state A, racing) | `variant="primary"` — `bg: var(--blue)`, white text, no shadow |
| Resting (state B, ready) | `variant="accent"` — `bg: var(--pink)`, white text, no shadow |
| Hover (state A) | `bg: var(--blue-h)` + `box-shadow: var(--glow-blue)` |
| Hover (state B) | `bg: var(--pink-h)` + `box-shadow: var(--glow-pink)` |
| Active (pressed) | `transform: scale(.97)` — both states |
| Focus | `outline: 2px solid var(--blue); outline-offset: 2px` |
| Disabled | `opacity: .4; pointer-events: none` — applies if `resolving === race.id` (resolve already in flight) |
| Resolving | Button shows "Revealing..." text (or spinner), `disabled` state applies |

### Close button (X)

| State | Treatment |
|---|---|
| Resting | `bg: var(--elev)`, `color: var(--t3)`, 32px circle |
| Hover | `bg: var(--border)`, `color: var(--t1)` |
| Active | `transform: scale(.97)` |
| Focus | `outline: 2px solid var(--blue); outline-offset: 2px` |

### Backdrop

| Interaction | Behaviour |
|---|---|
| Tap backdrop | Modal closes (exit animation plays) |
| Tap modal panel | Event stops propagation — does not close |

### Race transitions to "ready" while modal is open

When `finishesAt` elapses while the player has the modal open:
1. Progress section cross-fades from state A to state B (see section 6.4 transition spec)
2. CTA button transitions from `variant="primary"` to `variant="accent"` with a scale pulse
3. No toast or additional notification — the modal itself communicates the state change

---

## 8. Error and edge states

| Scenario | Treatment |
|---|---|
| `playerEntryPetId` cannot be resolved to a pet | Show placeholder avatar (see section 6.2) |
| `race.participants` is empty | Participants strip renders empty with label "No other runners found" in `text-t3` |
| `finishesAt` is already elapsed when modal opens | Modal opens directly in state B (ready) — no state A is shown |
| Resolve is already in flight (`resolving === race.id`) | Button is disabled, shows "Revealing..." text. Modal does not auto-close — player triggered the reveal before opening this modal (unlikely edge case but handled) |
| Modal is open and race is resolved by another action | Modal should close automatically (the `RunningRaceCard` will have unmounted). The parent component manages open state; if the race record transitions to `finished`, `isOpen` becomes `false` |

---

## 9. Page structure diagram

```
┌──────────────────────────────────────────────────────┐
│  [drag handle — centred, 40×4px, white/20]          │
├──────────────────────────────────────────────────────┤
│  [X close]                                           │
│                                                      │
│  [race icon 28px]  [Race name ───────]  [Racing pill]│
│                                                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│         [animal image 96×96, blue border+glow]       │
│                                                      │
│                 Pet Name (18px/700)                  │
│                   Breed (13px/t3)                    │
│                                                      │
├──────────────────────────────────────────────────────┤
│  RACING ALONGSIDE                                    │
│  [avatar] Runner Name          Breed                 │
│  [avatar] Runner Name          Breed                 │
│  [avatar] Runner Name          Breed                 │
│  …up to 6 rows, then "+N more runners"               │
│                                                      │
├─── divider ──────────────────────────────────────────┤
│                                                      │
│  [Zap icon] Racing now...          (state A label)  │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░   (state A bar)     │
│                       Almost there! (≥80% only)     │
│                                                      │
│  — OR —                                              │
│                                                      │
│         [Trophy 32px, amber, pulsing]                │
│           Ready to reveal! (20px/700)               │
│           Your result is waiting. (13px/t3)         │
│                                                      │
├──────────────────────────────────────────────────────┤
│  [     Reveal Result  (Trophy icon)     ]  ← w-full │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**iPad (≥1024px):** the sheet is full-width but its content column is constrained to `max-w-xl mx-auto w-full`. The backdrop covers the full viewport. The bottom sheet panel fills the full viewport width at all breakpoints (this is correct BottomSheet behaviour); only the inner content is centred within `max-w-xl`.

---

## 10. Animation parameters

All durations and easing values are mandatory. FE must not choose independently.

| Animation | Element | Duration | Easing | Reduced-motion fallback |
|---|---|---|---|---|
| Sheet open | Panel (`y: "100%" → 0`) | spring `stiffness: 300, damping: 30` | spring | instant (no y animation) |
| Sheet close | Panel (`y: 0 → "100%"`) | spring `stiffness: 300, damping: 30` | spring | instant |
| Backdrop fade in | Backdrop div | 200ms | ease-out | instant |
| Backdrop fade out | Backdrop div | 200ms | ease-in | instant |
| Animal bob | Pet image (`y: 0 → -6px → 0`) | 2400ms loop | `easeInOut` | static (no animation) |
| Progress bar fill | Fill track width | `ease-out 4s` (on each 5s tick) | ease-out | instant jump to value |
| State A → B, outgoing | Progress section (`opacity: 1→0, y: 0→-8`) | 200ms | ease-in | instant |
| State A → B, incoming | Ready section (`opacity: 0→1, y: 8→0`) | 300ms, delay 200ms | ease-out | instant |
| Trophy pulse (state B) | Trophy icon (`scale: 1.0→1.08→1.0`) | 1500ms loop | ease-in-out | static |
| CTA variant pulse | Reveal Result button (`scale: 1.0→1.03→1.0`) | 300ms, once | ease-out | instant variant change |
| Racing Zap icon (in status label) | Zap inside `RaceStatusLabel` | 1200ms opacity loop (existing) | easeInOut | static (existing behaviour) |

**Note on the animal bob:** the image bobs on `y` only. No scale or rotation. Amplitude is -6px (moves 6px upward then returns). The loop is continuous while the modal is open. The animation is `motion.div` wrapping the `AnimalImage` component; the wrapper must not introduce layout shift. Use `display: inline-flex` on the wrapper.

---

## 11. Accessibility

- Sheet is rendered via `createPortal(content, document.body)` — required because `RacingContent` contains Framer Motion animated ancestors. Fixed/absolute elements inside animated parents are broken by stacking context.
- `role="dialog"` on the sheet panel, `aria-modal="true"`, `aria-label="Race progress"`.
- Focus is trapped inside the sheet when open. On open, focus moves to the close button. On close, focus returns to the `RunningRaceCard` that triggered the open.
- The close button has `aria-label="Close race progress"`.
- The "Reveal Result" button always has a visible text label — not icon-only. The Trophy icon is `aria-hidden="true"`.
- Progress bar: `role="progressbar"`, `aria-valuenow` bound to the computed fill percentage (0–100), `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-label="Race progress"`. In state B the progress bar is replaced — the Trophy/text state is not a progressbar and needs no ARIA override.
- The participants strip is a visual list. Each row does not need interactive ARIA — it is read-only. A wrapping `<ul>` with `<li>` elements is preferred for assistive technology.
- Colour is never the only signal — every state uses icon + colour + text label.
- `prefers-reduced-motion`: all animations listed in section 10 with "instant" fallback must observe the `useReducedMotion()` hook (already in the codebase). The progress bar still fills; its `transition` is removed. The bob does not play. The Trophy pulse does not play.

---

## 12. Component reuse checklist

| Component | Source | Notes |
|---|---|---|
| `BottomSheet` | `src/components/ui/Modal.tsx` | Use as-is. `maxHeight` needs to be overridden to 80vh — this requires a `className` or `style` prop. Confirm the component supports this before Phase C. |
| `RaceStatusLabel` | `src/components/racing/RaceStatusLabel.tsx` | Pass `status="running"` — renders "Racing" pill with animated Zap. No change needed. |
| `AnimalImage` | `src/components/ui/AnimalImage` | Used in animal hero section for pet image. |
| `Button` | `src/components/ui/Button` | `variant="primary"` (state A) and `variant="accent"` (state B), `size="lg"`, `className="w-full"`. |
| `useReducedMotion` | `src/hooks/useReducedMotion.ts` | All animated elements must observe this. |
| `useRacing` / `useSavedNames` | hooks | Modal receives `race` prop; parent component is responsible for pet lookup via `useSavedNames`. |

**New component:** `RaceProgressModal` lives at `src/components/racing/RaceProgressModal.tsx`. It is not a screen; it is a component consumed by `RacingContent` in `PlayHubScreen.tsx`.

---

## 13. Props interface (for developer handoff)

```typescript
interface RaceProgressModalProps {
  isOpen: boolean
  race: Race                    // the running race record
  pet: SavedName | null         // the player's entered pet (null triggers placeholder)
  resolving: number | null      // from RacingContent — is a resolve in flight?
  onClose: () => void           // dismisses the modal
  onResolve: (race: Race) => void  // triggers the existing handleResolve flow
}
```

The parent (`RacingContent`) owns open/close state. It passes `race`, `pet` (looked up from `useSavedNames` by `race.playerEntryPetId`), and `resolving` down as props. The modal does not call `useRacing` or `useSavedNames` directly — this keeps it a presentational component and simplifies testing.

The parent adds an `onClick` handler to the `RunningRaceCard` wrapper (the outer div) that opens the modal. The "Reveal Result" button inside `RunningRaceCard` must call `e.stopPropagation()` to prevent the card click from also opening the modal.

---

## 14. Consistency check

**Existing patterns this spec aligns with:**

- BottomSheet glass treatment matches `EntrySheet` in `PlayHubScreen.tsx` and `BottomSheet` in `Modal.tsx` — same `rgba(13,13,17,.80)` surface, same border tokens.
- Progress bar gradient (`linear-gradient(to right, var(--blue), var(--pink))`) matches the gradient defined in the DS for racing/warm themes.
- `RaceStatusLabel` is the same component used on `RunningRaceCard` and `RaceCard` — no fork.
- CTA button sizing (`size="lg"`, `w-full`) matches `EntrySheet`'s "Race!" button.
- Participant row avatar size (28px) aligns with the 24–28px icon circle pattern used in `EntrySheet`'s pet selector.
- Tint-pair "Racing now" label (Zap + `--blue-t` text on `--blue-sub` background) is consistent with the blue racing colour language used throughout `RunningRaceCard` and `RaceStatusLabel`.

**Deliberate departure from existing patterns:**

- The sheet `maxHeight` is 80vh rather than the default 85vh. Rationale: this sheet has a richer content hierarchy than the `EntrySheet`. 80vh keeps the bottom CTA visible on smaller phone screens without requiring internal scroll in the majority of cases. FE must verify this on a 375px viewport — if the CTA clips, the internal scroll container is the fallback, not a max-height increase.

---

## 15. Open questions for Phase B (Product Owner)

1. Should the modal be openable when the race is already in the "ready" state (countdown elapsed, result not yet revealed)? The spec assumes yes — the modal opens in state B immediately. If PO wants the card to trigger the reveal directly in this state (bypassing the modal), that is a scope decision.
2. Should the participant strip show NPC breeds? The current spec includes breed as secondary text. If this is considered noise for the target user, remove it and show name only.
3. The `BottomSheet` component's `maxHeight` is currently hardcoded at `max-h-[85vh]` in `Modal.tsx`. Either the component needs a `maxHeight` prop, or `RaceProgressModal` uses a custom BottomSheet implementation. FE feasibility input is needed before Phase C begins.

