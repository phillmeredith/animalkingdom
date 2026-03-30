# Interaction Spec: Educational Games
> Feature: educational-games
> Author: UX Designer
> Status: Phase A revised — ready for Phase B (PO)
> Last updated: 2026-03-29
> Target device: iPad Air (primary — 820px CSS portrait width), phone 375px (secondary)

---

## Overview

Four educational games — Word Safari, Coin Rush, Habitat Builder, World Quest — are
embedded inside the existing Play hub at `/play`. The games deliver the UK National
Curriculum (Years 1–6, English/Maths/Science/Geography) as card-levelling mechanics.
Harry does not see curriculum. He sees a card growing stronger every session.

Every question is generated from the selected card's species data. Playing Word Safari
with a Red Panda card produces questions about conservation vocabulary specific to red
pandas. Playing with a Beagle produces questions about hunting vocabulary. The same
question bank cannot be replayed by swapping cards.

**Harry's context (from user research and product brief):**
Harry is 8–10, autistic, and motivated by visible card power growth and collection
completion — not by school-style metrics. Any UI language that reads as educational
(year levels, score, correct/incorrect, grade) will create resistance. This spec uses
stealth-learning framing throughout. "Challenge level" replaces "year level". "Power up"
replaces "score". "Try that one again" replaces "wrong". No test-style language anywhere
in Harry's UI.

**What already exists (read these before building):**
- `ArcadeShell.tsx` — current shared game wrapper (start / playing / results phases).
  Uses generic MCQ. This spec redesigns the session shell entirely. ArcadeShell is
  replaced, not extended, by the new game session screen described in section 5.
- `CardsScreen.tsx` — Packs and Collection tabs. `CollectedCard` records live in the
  `collectedCards` Dexie table. This is where Harry's card collection lives.
- `CollectedCardDetailSheet.tsx` — the existing card detail sheet pattern. The games
  use card data from `CollectedCard`, not from `SavedName`. PO to confirm this at Phase B.
- `PlayHubScreen.tsx` — Games and Racing tab control. The `GamesContent` component
  renders four `GameCard` buttons navigating directly to game routes. This spec changes
  that behaviour: game card taps now open the card picker sheet first.
- `BottomNav.tsx` — six tabs: Home, Explore, Collection, Figures, Play, Store. The
  World Map feature must fit into this structure without adding a seventh tab (see
  section 16 for the World Map navigation decision).

---

## Mandatory spec requirements checklist (CLAUDE.md)

The following items from CLAUDE.md are explicitly addressed in this spec.
FE must verify all of them before marking Phase C complete.

1. Interaction states — covered per section in section 13
2. Card anatomy — CardPickerTile anatomy in section 3; GameCard anatomy in section 11
3. Overlay surface treatment — glass rule stated in sections 5 and 8;
   SessionCompleteOverlay and XP burst portal surface treatment specified
4. Consistency check — CardPickerTile uses `aspect-square` grid card pattern, matching
   existing CardsScreen CollectionGrid. CollectedCardDetailSheet is the existing detail
   sheet pattern; this spec extends it in section 15. GameCard hover pattern matches the
   existing GameCard pattern in PlayHubScreen.
5. PageHeader slot assignments — covered in section 12
6. Navigation ownership — Games/Racing tab control lives exclusively in PageHeader
   centre slot. No game screen, card picker, or session complete overlay renders a tab
   control. Content components receive active tab as a prop; they do not render navigation.
7. Filter pill style — CategoryPills tint-pair pattern referenced in section 3
8. Filter and sort row layout — section 3 specifies one shared row; category pills
   left-aligned, sort control right-aligned with `ml-auto shrink-0`
9. Content top padding — explicit class string per screen given in section 12

---

## 1. Screen inventory

| Screen / State | Route | Type | Notes |
|---|---|---|---|
| Play hub — Games tab | `/play` (tab=games) | Existing screen, modified | GameCards updated per section 11 |
| Card picker sheet | Triggered from GameCard tap | BottomSheet overlay | Harry picks which card to play with |
| Card picker — empty state | Within card picker sheet | Inline empty state | Harry has no collected cards |
| Challenge level selector | Within card picker sheet, step 2 | Inline step inside same sheet | First play per game only |
| Game session screen | `/play/coin-rush`, `/play/word-safari`, `/play/habitat-builder`, `/play/world-quest` | Full-screen route | Bespoke session shell, replaces ArcadeShell |
| Game session — question active | Within session screen | Primary session state | |
| Game session — correct feedback | Within session screen | Transient question-area state | 800ms, then auto-advance |
| Game session — try-again feedback | Within session screen | Transient question-area state | Hint strip below options |
| Game session — XP burst | Portal overlay, z-1150 | Lightweight particle animation | Does not block session |
| Session complete screen | Portal overlay over session screen | Full-screen portal, z-1200 | Summary of session |
| Quit confirmation | Within session screen | Inline slide-down banner | No modal, no backdrop |
| Habitat Builder — day cycle view | Session screen (Habitat Builder only) | Embedded two-panel layout | 5-day simulation |
| World Quest — map view | Session screen (World Quest only) | Embedded two-panel layout | SVG map panel + question panel |
| World Map screen | `/map` | Full-screen route (new) | Accessed from Explore tab (see section 16) |
| World Map — animal detail panel | Within map screen | Swipe-up bottom panel | Collapsed / expanded states |

---

## 2. Entry flow — from GameCard to session start

### Step 1: Harry taps a GameCard in the Play hub Games tab

The tap opens the card picker BottomSheet. It does NOT navigate to the game route
immediately. The game route is not entered until Harry has selected a card and, on first
play, confirmed a challenge level.

**Why a sheet, not direct navigation:** Harry needs to choose which card to level up.
Jumping straight into a game with the previously-used card — or with no card selected —
would be confusing. The sheet is a deliberate staging point: low commitment, easy to
dismiss, clear about what he is about to do.

### Step 2: Card picker sheet opens

The sheet is a BottomSheet (glass surface, portal-rendered per CLAUDE.md portal rule).
It has two panels stacked vertically inside the sheet body:

**Panel A — Card picker**
Harry browses his `collectedCards` collection and selects one card to play with.

**Panel B — Challenge level (first play of each game only)**
After card selection, Panel B slides in from below (`y: 16px → 0`, 200ms ease-out).
Panel B shows the challenge level selector. On all subsequent sessions, Panel B is
skipped entirely — the most recently confirmed level for this game is used silently.

### Step 3: Confirm

A "Play" primary button at the bottom of the sheet is enabled only when a card is
selected (and challenge level is confirmed on first play). Tapping "Play" navigates to
the game session route, passing the selected `CollectedCard.id` and challenge level as
navigation state (not query params — state is ephemeral and not bookmarkable).

### Step 4: Game session screen

The game session screen is a full-screen route. The existing `ArcadeShell` component is
NOT used on these routes in this new system. The session screen renders the new bespoke
shell (section 5) with the game-specific question component inside the question area.

---

## 3. Card picker — UI design

### Layout

The card picker sheet uses the existing shared `BottomSheet` component. It is
`max-h-[85vh]` per DS BottomSheet spec. Inside:

**Sheet header row:**
```
[Game icon, 20px, game accent colour]  [Game title — 17px/700 --t1          ]
                                       [Subtitle — "Choose a card" 13px --t2 ]
                                       [X close — 32px circle, --elev        ]
```
The close button is `position: absolute; top: 16px; right: 16px` per the DS close
button spec.

**Filter row (below header, above card list):**
Single shared row. Left side: category filter pills (All · Mammal · Bird · Reptile ·
Fish · Amphibian). Right side: sort control (`ml-auto shrink-0`) — "Name A–Z" /
"Recently used" / "Highest level".

Pills use the CategoryPills tint-pair pattern (reference: `CategoryPills.tsx` in
ExploreScreen):
- Active: `bg-[var(--blue-sub)] border border-[var(--blue)] text-[var(--blue-t)]`
- Inactive: `bg-[var(--card)] border border-[var(--border-s)] text-[var(--t2)]`

No solid fill on active filter pills. This is categorical filtering — tint-pair only.

The filter row scrolls horizontally on phone (`overflow-x: auto`, no visible scrollbar).
On iPad (820px+) all pills fit without scrolling.

**Card grid:**
`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 px-4 pb-4`

On iPad (820px) this gives a 3-column picker grid inside the sheet. At 1024px: 4 columns.
On phone: 2 columns. The card list scrolls vertically within the sheet body.

### CardPickerTile anatomy

Each tile is a tappable card in the grid:

```
┌─────────────────────────────────────┐
│  [Animal image — w-full aspect-     │
│   square rounded-xl object-cover]   │
│                                     │
│  [Name — 13px/600 --t1, truncate    │
│   mt-2]                             │
│  [RarityBadge — tint-pair per DS]   │
│  [Level pill — "Lv 3" 11px/700      │
│   tint-pair, game-accent colour]    │
└─────────────────────────────────────┘
```

**Level pill:** Every tile shows the card's current game-specific level for this game
(not an overall level — Coin Rush level and Word Safari level are tracked separately).
The pill uses the game's accent tint-pair: `bg-[var(--X-sub)] border border-[var(--X)]
text-[var(--X-t)]`. If the card has never been played in this game, the pill shows
"New" in neutral styling (`--t3` background, `--t4` border).

**Selection indicator:** When selected, the tile border changes from
`border-[var(--border-s)]` to `border-[var(--blue)]` and background gains
`bg-[var(--blue-sub)]`. A `Check` icon (Lucide, 16px, `--blue-t`) appears inside a
20px solid circle (`bg-[var(--blue)]`) at the top-right corner of the image.
This is a selection marker — it is exempt from the tint-pair badge rule.

**Last-used card:** The most recently played card for this specific game is shown first
in the grid with a hairline label above it: `"Last used"` in
`11px/700 uppercase tracking-widest --t3`. Convenience only, not a mandatory selection.

**Interaction states for CardPickerTile:**
- Default: `border-[var(--border-s)] bg-[var(--card)]`
- Hover: `border-[var(--border)] bg-[var(--card)] translateY(-2px)
  shadow-[0_4px_24px_rgba(0,0,0,.25)]`
- Selected: `border-[var(--blue)] bg-[var(--blue-sub)]`
- Focus: `outline: 2px solid var(--blue); outline-offset: 2px`
- Active/pressed: `scale(.97)`
- Disabled: not applicable — all owned cards are selectable

### Empty state

When Harry has no collected cards (`collectedCards` table is empty):

```
[CreditCard icon — 48px, --t3]
["You need a card to play" — 17px/600 --t1]
["Open a pack in the Collection tab to get your first card." — 14px/400 --t2]
[Button: "Go to Collection" — accent variant, navigates to /cards]
```

The "Go to Collection" button closes the sheet first, then navigates. The filter row is
hidden in the empty state. The empty state is vertically centred in the sheet body.

---

## 4. Challenge level selector

### Framing (stealth learning)

The challenge level selector NEVER uses the words "Year", "Year level", or any
curriculum reference. It never appears in Harry's game session UI. The three levels are:

| Display label | Internal mapping | Caption shown to Harry |
|---|---|---|
| Getting started | Years 1–2 | Simpler challenges, build power fast |
| Going further | Years 3–4 | Trickier challenges, bigger rewards |
| Expert mode | Years 5–6 | The hardest challenges, highest rewards |

"Getting started" is the default on first play. The system's auto-adaptation to ~80%
success rate is invisible (see section 10).

### Where the level is set

**First play of each game:** Panel B of the card picker sheet slides in after card
selection. This is the only time the selector is shown in Harry's flow.

**Subsequent plays:** The level confirmed in the most recent session is reused silently.
Harry does not see the selector again unless he explicitly taps "Change challenge level"
in the session header settings (see section 5).

**Parent route:** Settings → Learning → [game name] → Challenge level. This is a
parent-facing control. Out of scope for this spec.

### Tier selector UI

Three stacked selectable rows (not a segmented control — stacked rows give room for the
explanatory caption):

```
[Radio indicator — 20px circle, --border-s at rest, --blue filled+check when selected]
[Label — 15px/600 --t1]
[Caption — 13px/400 --t2, describing what Harry will encounter]
```

Each row: `p-4 rounded-[var(--r-lg)] border border-[var(--border-s)]`
Selected row: `border-[var(--blue)] bg-[var(--blue-sub)]`
Minimum tap target: 44px height.

**Interaction states:**
- Default: `border-[var(--border-s)] bg-[var(--card)]`
- Hover: `border-[var(--border)]`
- Selected: `border-[var(--blue)] bg-[var(--blue-sub)]`
- Focus: `outline: 2px solid var(--blue); outline-offset: 2px`

---

## 5. Game session screen — shared shell

The session screen is a full-screen route. It replaces the existing `ArcadeShell`
component. The BottomNav is NOT rendered while any session route is active. The existing
router must suppress BottomNav on routes matching `/play/:game` where `:game` is one of
`coin-rush`, `word-safari`, `habitat-builder`, `world-quest`.

### Layout structure

```
+-------------------------------------------+
│  Session header (fixed, glass, portal)    │
│  [CardThumb] [CardName] [GameIcon+Name]   │
│  [Q 3/10] [Settings] [Exit]               │
+-------------------------------------------+
│                                           │
│  Question area (flex-1, overflow-y-auto)  │
│  Top padding: pt-[72px] (clears header)   │
│                                           │
│  [Question text — centred, max-w-lg]      │
│  [Visual aid — game-specific]             │
│  [Answer options — game-specific]         │
│                                           │
+-------------------------------------------+
│  XP progress strip (fixed, glass, bottom) │
│  [Card name] [XP bar] [XP label]          │
+-------------------------------------------+
```

On iPad at 1024px landscape, the question area uses `max-w-2xl mx-auto` to prevent
text stretching to uncomfortable line lengths. The glass header and XP strip span full
width. On phone (375px) the question area fills full width with `px-6` padding.

Habitat Builder and World Quest use a two-panel layout on iPad (see sections 9c and 9d).

### Session header

**Glass treatment:** `position: fixed; top: 0; left: 0; right: 0` rendered via
`createPortal(content, document.body)`. This is mandatory — the session screen is
inside a Framer Motion animated parent and a non-portal fixed element would be trapped
in the wrong stacking context (CLAUDE.md Framer Motion rule 2).

Glass: `rgba(13,13,17,.88)` + `backdrop-filter: blur(24px)` +
`border-bottom: 1px solid rgba(255,255,255,.06)`.
Height: 56px. Safe-area-aware: `padding-top: env(safe-area-inset-top)`.

**Left slot — selected card:**
```
[Animal image — w-10 h-10 rounded-lg object-cover shrink-0]
[Animal name — 14px/600 --t1, max-w-[90px] truncate]
```
Tapping the card thumbnail opens a read-only `CollectedCardDetailSheet` overlay. The
session continues behind it — the detail sheet is informational ("who am I playing with").

**Centre slot — game identity:**
```
[Game icon — 18px, game accent colour --X-t]
[Game name — 13px/600 --t2]
```

**Right slot — progress and exit:**
```
[Settings icon (Lucide) — 18px --t3, 32px tap target — opens level-change popover]
[Q counter — "3 / 10", 13px/600 --t3]
[X icon (Lucide) — 18px --t3, 32px tap target — triggers quit confirmation]
```

The settings icon gives Harry (or a parent) access to "Change challenge level" mid-session.
This immediately re-queues remaining questions at the new level. Changing level during a
session discards the current question; answered questions retain their XP.

**Back gesture:** The browser/OS back gesture triggers the quit confirmation banner.
It does NOT navigate away immediately. The session must not be exitable without
confirmation.

### XP progress strip

Fixed at the bottom of the viewport. Height: 40px. No BottomNav below it during a
session.

Glass: same tokens as session header.

```
[Card name — 11px/700 uppercase tracking-widest --t3]
[XP bar — h-1.5 rounded-full, bg-[var(--border-s)], fill uses game accent --X solid]
[XP label — "240 XP to next level" — 11px/600 --t3]
```

The XP bar shows the selected card's current XP progress toward its next level.
On iPad the strip uses `max-w-3xl mx-auto` so the bar is not a 1366px-wide line.

---

## 6. Quit confirmation

When Harry taps the exit button or triggers the back gesture mid-session, a banner
slides down from the session header:

```
+-------------------------------------------+
│  "Leave this session?"                    │
│  Your cards won't gain XP if you leave.   │
│  [Stay]  [Leave]                          │
+-------------------------------------------+
```

**Banner behaviour:**
- Animates `y: -100% → 0` over 200ms ease-out. Sits below the session header.
- Question content is visible behind the banner but non-interactive while open.
- "Stay" — dismisses banner, resumes session.
- "Leave" — navigates to `/play` (tab=games).
- Auto-dismisses after 8 seconds if no tap (returns to session).

**Why an inline banner, not a modal:** A modal with a dark backdrop creates anxiety for
an autistic child who is mid-flow. The inline banner is contained, low-stakes, and does
not obscure the question. The question being visible is a feature — it anchors Harry in
the session context, making "Stay" the natural response.

**Button treatment:**
- "Stay" — outline variant, size sm
- "Leave" — primary variant, size sm

**No XP or coins deducted for leaving.** XP and coins earned during the abandoned session
are awarded up to the point of exit. Harry is never penalised for stopping.

---

## 7. Question display and feedback

### Question area structure

The question area occupies the space between the fixed header and the fixed XP strip.
It is `overflow-y-auto` — questions with complex visuals (bar models, map panels) may
require scroll on phone.

```
[Question text — 20px/700 --t1, max-w-lg, text-center mx-auto, mt-6]
[Visual aid — game-specific, centred, mt-6]
[Answer options — game-specific, mt-8]
```

On phone, question text reduces to `18px/700`, horizontal padding is `px-5`.
On iPad (≥820px) the question column is `max-w-2xl mx-auto`.

### Correct feedback

When Harry selects a correct answer:

1. The selected option transitions to: `bg-[var(--green-sub)] border-[var(--green)]`
   and a `Check` icon (Lucide, 16px, `--green-t`) is appended inside the option label.
2. A stat-increase badge animates out from the card thumbnail in the session header.
   Example: `"+1 Intelligence"`. Badge uses the game accent tint-pair.
   Animation: `scale(0.8) opacity(0) → scale(1) opacity(1)` at 300ms ease-out, then
   fades out at 1200ms. Rendered via `createPortal` at z-1100 (above session, below
   SessionCompleteOverlay).
3. After 800ms, the next question auto-advances. No explicit "Next" button.
4. The XP bar in the strip increments visibly: `transition: width 400ms ease-out`.
5. Stats in the DB are updated immediately (the stat that increases maps to the game's
   primary stat — see section 11 game accent colours for the stat mapping).

**No audio feedback.** This is an absolute prohibition. Harry uses the app in
environments where audio would be disruptive.

### Try-again feedback

When Harry selects an incorrect answer:

1. The selected option pulses red: `bg-[var(--red-sub)] border-[var(--red)]` for 400ms,
   then returns to default state.
2. A hint strip appears below the answer options:
   ```
   [Lightbulb icon (Lucide) 16px --amber-t]
   ["Try that one again" — 13px/600 --t2]
   [Hint text — 13px/400 --t3, e.g. "Think about where this animal lives"]
   ```
3. Harry can re-select. The incorrect option is NOT greyed out or removed. Harry must
   identify the correct answer himself, not by elimination.
4. After a second wrong attempt, a "Skip this one" link appears:
   `11px/600 --t3 underline`. Skipping advances to the next question with no XP gain
   and no negative message. The word "skip" is used — not "give up" or "pass".

**No "Wrong" copy, no score penalties, no negative animations beyond the 400ms pulse.**
Growth mindset is non-negotiable here — Harry must never feel punished.

### XP burst overlay

At the end of a session (or when a level-up threshold is crossed mid-session), an XP
burst fires. This is a lightweight particle animation rendered via
`createPortal(content, document.body)` at z-1150 (above session screen, below the
SessionCompleteOverlay at z-1200).

The burst uses the game's accent colour particles. It does NOT block interaction — it
plays over the question content and auto-clears after 1.5s.

Particle `initial` state: `scale: 1, opacity: 1, x: 0, y: 0, rotate: 0`. Per CLAUDE.md
Framer Motion rule 3 — particles must NOT start at `scale: 0`. Animate `x`, `y`,
`rotate`, and `opacity` outward from the origin.

`prefers-reduced-motion`: the burst does not fire. The XP bar simply increments.

---

## 8. Session complete screen

Shown when Harry answers all questions in a session (or completes a 5-day cycle in
Habitat Builder). Rendered as a full-screen portal overlay at z-1200.

### Surface treatment

Glass: `rgba(13,13,17,.96)` (near-opaque — this is the celebration moment; game content
behind does not need to show). `backdrop-filter: blur(24px)`. No additional backdrop
scrim. Entrance: `opacity(0) → opacity(1)` over 300ms.

Rendered via `createPortal(content, document.body)` — mandatory per CLAUDE.md portal
rule.

### Layout

```
+-------------------------------------------+
│  [Confetti burst — game accent colour]    │
│  [Card image — w-24 h-24 rounded-xl       │
│   object-cover mx-auto]                   │
│  [Card name — 22px/700 --t1, text-center] │
│  [RarityBadge]                            │
│                                           │
│  ── Session rewards ──                    │
│  [XP gained — green tint-pair badge]      │
│  [Coins earned — amber tint-pair badge]   │
│  [Stat increases — green tint-pair badge] │
│                                           │
│  ── Card progress ──                      │
│  [XP bar — card's current level progress] │
│  [Level label — "Level 3 → 4" if levelled]│
│                                           │
│  ── Session summary ──                    │
│  [Challenges: X / Y]                      │
│  [Best streak: X]                         │
│                                           │
│  [Button: "Play again" — primary]         │
│  [Button: "Change card" — outline]        │
│  [Link: "Back to games" — 14px/600 --t2] │
+-------------------------------------------+
```

"Back to games" is a plain text link (not a ghost button — ghost variant is prohibited).
Use `14px/600 text-[var(--t2)] underline-offset-2`.

On iPad, the rewards and summary rows are displayed in a two-column grid within
`max-w-md mx-auto`. On phone they stack vertically.

**Reward badge anatomy (every reward row):**
```
bg-[var(--X-sub)] border border-[var(--X)] text-[var(--X-t)]
[Icon 14px] [Label 14px/600]
```
X = `green` for XP and stat increases; `amber` for coins. No solid fills on reward
badges. Tint-pair only.

**Level-up treatment:** If the session caused a level increase on the selected card, the
session complete screen shows a level-up celebration — a larger confetti burst and the
text `"[Card name] levelled up! Level 3 → 4"` in `20px/700 --t1` above the rewards.
The level-up message is absent if no level increase occurred.

**Confetti burst:** Same portal pattern and particle rules as section 7 XP burst. Fires
immediately when the overlay enters. Auto-clears after 2.5s.
`prefers-reduced-motion`: burst does not fire.

**"Play again"** restarts the same game with the same card and same challenge level.
The session complete overlay exits and the session begins with a brief `y: 16px → 0,
opacity 0 → 1` entrance (200ms ease-out).

**"Change card"** dismisses the overlay and re-opens the card picker BottomSheet for
this game. Harry returns to the Play hub with the picker already open.

**"Back to games"** navigates to `/play` (tab=games) with no sheet open.

---

## 9. Game-specific question layouts

Each game has distinct question type implementations. These are the components rendered
inside the question area of the shared session shell.

---

### 9a. Word Safari (English)

Word Safari has three question type variants per challenge level. No two consecutive
questions share the same type.

**Variant A — Multiple choice (all levels):**
```
[Question text — centred, 20px/700]
[4 options — 2×2 grid on iPad, vertical stack on phone]
```
Each option is a full-width button with `outline` variant treatment
(`bg-[var(--elev)] border border-[var(--border-s)]`, `p-4 rounded-[var(--r-lg)]`).
On iPad the 2×2 grid gives each option roughly half the `max-w-2xl` content column
width. Each option minimum 44px height. Text wraps — no truncation.

**Variant B — Spelling input (Years 1–2, letter tiles):**
```
[Animal image — w-32 h-32 rounded-xl mx-auto]
[Word prompt — "Spell what Beagle is hunting:" — 16px/600 --t2]
[Letter slot row — one box per letter of the answer word]
[Alphabet picker — A–Z, scrollable two rows on phone, two rows on iPad]
[Delete button + Submit button row]
```

Letter slot boxes: `w-10 h-12 rounded-[var(--r-md)] border border-[var(--border-s)]
bg-[var(--elev)] text-center text-t1 16px/700`. Filled slot: `border-[var(--blue)]`.
`letter-spacing: 0.1em` inside filled slots (dyslexia-friendly).

Alphabet picker buttons: `outline` variant, size `sm` (36px height), `min-w-[32px]`.
On iPad all 26 letters fit in two rows without scroll. On phone: `overflow-x: auto`,
no visible scrollbar.

No native keyboard is triggered. This is a tap-to-fill interface only.

**Variant C — Drag and build (Years 3–4, morphology):**
```
[Root word — 24px/700 --t1, centred]
[Drag zone — dashed border, rounded-xl, min-h-[56px], shows built word as tiles slot in]
[Suffix/prefix tiles — pill buttons, --elev background, draggable]
[Result preview — shows full word as tiles connect]
```

Each morpheme tile: `px-4 py-2 rounded-pill border border-[var(--border)] --t1 16px/600`.
When dragged over the drop zone: zone border transitions to `border-[var(--blue)]`.
On phone, drag-and-drop degrades to a tap-to-select interface: tap a tile to attach it
to the root word.

**Variant D — Rhyme recognition (Years 1–2 only):**
```
[Word displayed — 24px/700 --t1, centred]
[Prompt — "Does [word] rhyme with [word]?" — 16px/400 --t2]
[Yes / No — two large pill buttons, side by side, gap-4, centred]
```
Yes/No buttons: `outline` variant, size `lg` (48px height), minimum 120px wide.
No audio is triggered — rhyme recognition is visual only in this build.

---

### 9b. Coin Rush (Maths)

Coin Rush uses the selected `CollectedCard`'s `stats` object (speed, strength, stamina,
agility, intelligence) as the numbers in maths problems. Default stat value is 50 if
the field is missing.

**Variant A — Dot array / subitising (Years 1–2):**
```
[Dot array — centred, dots in 3×3 or 2×5 arrangement]
[Each dot: 20px circle, bg-[var(--game-accent-sub)]]
[Context sentence — "Beagle can see [N] rabbits. How many?" — 18px/600 --t2]
[Number answer buttons — 2×5 grid, pill outline variant, 40px height min]
```
Dots appear with 50ms stagger, `scale: 0.8 → 1, opacity: 0 → 1`. This is a reveal
(growing into existence) so `initial: scale(0.8)` is appropriate here — it is not a
burst particle.

**Variant B — Bar model (Years 3–4):**
```
[Horizontal bar — full content width, h-8, rounded-pill, bg-[var(--border-s)]]
[Filled segment — e.g. 3/4 of bar, bg-[var(--game-accent)]]
[Fraction labels below each segment]
[4 answer options — pill outline variant]
```

**Variant C — Number line (Years 1–2 counting on/back):**
```
[Number line — horizontal, centred, with visible tick marks and numbers]
[Marker showing start position — filled circle, game accent colour]
[Arrow showing the jump — dashed line above the line]
[4 answer options]
```

**Variant D — Missing number / equation (Years 3–6):**
```
[Equation: "Beagle's speed (50) ÷ ? = 10"]
[Gap box: bg-[var(--blue-sub)] border border-[var(--blue)] px-4 rounded-[var(--r-md)]]
[4 answer options — pill outline variant]
```

**Variant E — Fraction circles (Years 3–4):**
```
[SVG pie chart divided into equal parts, with some segments shaded]
[Prompt — "What fraction is shaded?"]
[4 answer options — fraction notation]
```

---

### 9c. Habitat Builder (Science)

Habitat Builder is the most structurally distinct game. A session is a 5-day simulation
cycle, not a sequence of MCQ questions. Each "day" is one interaction round.

**Day cycle layout — iPad two-panel:**
```
+---------------------------+---------------------------+
│  Habitat view (left, 50%) │  Decision panel           │
│                           │  (right, 50%)             │
│  [Card image w-20 h-20    │                           │
│   rounded-xl]             │  Day 3 of 5               │
│                           │  [5-dot progress row]     │
│  Stat bars:               │                           │
│  [Stamina — green]        │  [Context sentence —      │
│  [Food — amber]           │   "Beagle needs food      │
│  [Shelter — blue]         │   today."]                │
│                           │                           │
│  [Scene context icon set] │  [Decision A]             │
│                           │  [Decision B]             │
│                           │  [Decision C]             │
+---------------------------+---------------------------+
```

On phone: habitat view above (`max-h-[200px]`), decision panel stacked below.

**Stat bars:** Three horizontal bars. Each: `h-2.5 rounded-full`. Colour: Stamina =
`var(--green)`, Food = `var(--amber)`, Shelter = `var(--blue)`. When value drops below
25%, the bar fill transitions to `var(--red)`. After each decision the bars animate
(`transition: width 600ms ease-out`).

**Decision card rows:** Three rows per day, stacked vertically (full-width tap targets):
```
[Icon 20px, game accent colour]  [Decision label — 15px/600 --t1]
                                 [Consequence hint — 13px/400 --t2]
```
Example: `[Leaf] Hunt in the forest / +Food, uses Stamina`

Each row: `p-4 rounded-[var(--r-lg)] border border-[var(--border-s)] bg-[var(--card)]`
Hover: DS card lift pattern. After selection: row transitions to green tint-pair
(`border-[var(--green)] bg-[var(--green-sub)]`) and bars update. Day advances after 600ms.

**Day progress indicator:** `"Day 3 of 5"` in `11px/700 uppercase tracking-widest --t3`.
5-dot progress row below: filled dots (`bg-[var(--blue)]`) for completed days, empty
(`border border-[var(--border-s)]`) for future days. Dot size: 8px circle.

**End of simulation:** After Day 5, the session complete screen fires. The summary shows
final Stamina / Food / Shelter bar values alongside the standard XP and coin rewards.

---

### 9d. World Quest (Geography)

World Quest is map-based. The map is a custom SVG element — NOT a third-party map
library (map API adds complexity and potential cost; a curated SVG for 200 animal
locations is the appropriate scope for Phase 1).

**Two-panel layout on iPad (≥820px):**
```
+--------------------------------------+------------------+
│  Map panel (left, 65%)               │  Question panel  │
│                                      │  (right, 35%)    │
│  [SVG map — flat cartographic style] │                  │
│  [Highlighted region/country]        │  [Question text] │
│  [Tap-to-answer map targets]         │  20px/700 --t1   │
│  [Compass rose — bottom-right]       │                  │
│                                      │  [Answer options │
│                                      │  or tap-map CTA] │
+--------------------------------------+------------------+
```

On phone: map panel fills full width at `aspect-[4/3]` (preserves enough vertical space
for the question below). Question panel sits below the map.

**Map style:** Background `#0D0D11` (matches `--bg`). Country fills `#23262F`
(`--elev`). Country borders `#353945` (`--border`). Highlighted/selected country:
`var(--purple-sub)` fill + `1px stroke var(--purple)`. Active answer target:
`var(--blue-sub)` fill + `1px stroke var(--blue)`.

**Tap-to-answer:** For "tap the country" questions, tappable countries are outlined with
a dashed `var(--border)` stroke as a subtle affordance. Player taps a country. Correct:
country fills `var(--green-sub)` + `var(--green)` border. Incorrect: brief
`var(--red-sub)` fill (400ms) then returns to default.

**Compass rose:** Static SVG at bottom-right of the map panel. `w-12 h-12 text-t3`.
Not interactive. Shown at all challenge levels (Years 1–2 through Years 5–6).

**Map discovery state:** As Harry completes World Quest sessions, answered countries
accumulate a "discovered" visual state: `var(--purple-sub)` fill persisting across
sessions. Stored as `discoveredCountries: string[]` in the `SkillProgress` record for
`area: 'geography'`. The map gradually fills in as Harry learns — the "map fills in"
feature described in the educational spec.

**Session question types:**
- Years 1–2: UK map only. Tap a country/region. Simple compass direction MCQ.
- Years 3–4: UK + Europe. Compass direction + grid reference. Habitat zone MCQ.
- Years 5–6: World map. Latitude/longitude MCQ. Migration route tracing.

---

## 10. Difficulty progression — stealth adaptation

The auto-adjustment to ~80% success rate is entirely invisible to Harry. There is no UI
for it. No indicator, no adaptive message, no label change.

**What IS visible to Harry (consistent with stealth-learning):**
- Questions gradually become more complex over sessions. Harry perceives this as the
  game "getting interesting", not "getting harder".
- Different cards produce different-feeling questions. The stat values change the numbers
  in Coin Rush; the species data changes the context in every game.

**What must NOT appear in Harry's UI:**
- Difficulty percentage
- "Difficulty: Easy/Medium/Hard" labels
- Adaptive messages such as "Great work! Increasing difficulty."
- Accuracy percentage during a session (post-session summary shows "Challenges: X/Y",
  not an accuracy %)

Parent accuracy data is available via Settings → Learning → Stats. Never in Harry's
session screens.

---

## 11. Play hub Games tab — GameCard updates

The existing `GamesContent` component in `PlayHubScreen.tsx` renders four `GameCard`
buttons navigating directly to game routes. This spec changes three things:

**Change 1 — Tap opens card picker, not the game route.**
The entire card body and the new internal "Play" button both open the card picker
BottomSheet (section 3). Direct route navigation on card tap is removed.

**Change 2 — Last-used card thumbnail.**
At the bottom-right corner of the game icon square (`w-14 h-14 rounded-2xl`), a small
circular thumbnail of the most recently used `CollectedCard` for this game overlaps the
icon:
```
[Card image — w-8 h-8 rounded-full object-cover border-2 border-[var(--card)]]
[Positioned: absolute bottom-0 right-0, translate(50%, 50%)]
```
Absent when the game has never been played. No label.

**Change 3 — Context-aware subtitle.**
The existing static subtitle string is replaced with:
- Never played: `"Pick a card to begin"` (13px/400 --t3)
- Played before: `"[Card name] · last played [relative date]"` (13px/400 --t3),
  e.g. "Scout · yesterday"

**Change 4 — Internal "Play" button.**
A small `"Play"` button added at the bottom-right inside the card:
```
[Play icon (Lucide) 12px] ["Play" label — primary variant, size sm]
```
Opens the same card picker sheet as tapping the card body. Reinforces tap affordance
for new users.

**GameCard hover and interaction states (unchanged from existing implementation):**
- Default: `border-[var(--border-s)] bg-[var(--card)]`
- Hover: `motion-safe:hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(0,0,0,.25)]
  hover:border-[var(--border)] motion-safe:active:scale-[.97] transition-all duration-300`
- Focus: `outline: 2px solid var(--blue); outline-offset: 2px`

**Game accent colour and primary stat mapping:**

| Game | Accent token | Primary stat trained |
|---|---|---|
| Coin Rush | `--amber` | Speed (subitising/fluency) |
| Word Safari | `--green` | Intelligence (vocabulary/morphology) |
| Habitat Builder | `--blue` | Stamina (habitat survival) |
| World Quest | `--purple` | Agility (navigation/exploration) |

Secondary stats also increase per correct answer (see section 9 per-game detail).

---

## 12. PageHeader slot assignments

### PlayHubScreen (existing, no change needed)

| Slot | Content |
|---|---|
| `title` | "Play" |
| `centre` | Games / Racing segmented control — `inline-flex`, NOT full-width |
| `trailing` | CoinDisplay + settings icon |
| `below` | Not used |

Content container class string: `px-6 pt-4 pb-24 max-w-3xl mx-auto w-full`
(already implemented — no change)

### Game session screens

Game session screens do NOT use the `PageHeader` component. They use a bespoke fixed
session header (section 5) rendered via portal. The BottomNav is suppressed.

| Slot | Content |
|---|---|
| Session header left | Card thumbnail + card name (tappable → CollectedCardDetailSheet) |
| Session header centre | Game icon + game name |
| Session header right | Settings icon + Q counter + Exit button |

### CardsScreen (World Map integration — see section 16)

| Slot | Content |
|---|---|
| `title` | "Collection" |
| `centre` | Packs / Collection / Map — three-item segmented control, `inline-flex` |
| `trailing` | CoinDisplay |
| `below` | Not used |

Content container class string for each tab: `px-6 pt-4 pb-24 max-w-3xl mx-auto w-full`

### World Map screen (if surfaced as separate route `/map`)

| Slot | Content |
|---|---|
| `title` | "World Map" |
| `centre` | Map / Biomes toggle (two-item control, `inline-flex`) |
| `trailing` | Search icon + Filter icon |
| `below` | Not used |

Content area: full-bleed map, no `max-w-3xl` container (map uses full viewport width).
The PageHeader glass header floats above the map.

**Navigation ownership declaration:** The Games/Racing tab control lives exclusively in
the `centre` slot of `PageHeader` in `PlayHubScreen`. The Packs/Collection/Map control
lives exclusively in the `centre` slot of `PageHeader` in `CardsScreen`. No game screen,
card picker sheet, session complete overlay, or World Map screen renders a copy of these
controls. Content components (`GamesContent`, `CollectionGrid`, `WorldMapView`) receive
the active tab as a prop; they do not render their own navigation.

---

## 13. Interaction states — complete reference

All interactive elements introduced by this spec. FE must implement every state.

| Element | Default | Hover | Focus | Active | Selected | Disabled |
|---|---|---|---|---|---|---|
| GameCard (Play hub) | border-s, bg-card | border, translateY(-2px), shadow-card | outline-blue 2px | scale(.97) | n/a | opacity-40 |
| CardPickerTile | border-s, bg-card | border, translateY(-2px), shadow-card | outline-blue 2px | scale(.97) | border-blue, bg-blue-sub | n/a |
| Level selector row | border-s, bg-card | border | outline-blue 2px | — | border-blue, bg-blue-sub | — |
| Decision card (Habitat) | border-s, bg-card | border, translateY(-2px), shadow-card | outline-blue 2px | scale(.97) | green tint-pair | — |
| MCQ option | elev bg, border-s | border | outline-blue 2px | scale(.97) | green-sub (correct) / red-sub (wrong) | opacity-50 |
| Spelling slot | border-s, bg-elev | — | border-blue | — | filled: border-blue, --t1 text | — |
| Alphabet key | outline variant | bg-white/6 | outline-blue 2px | scale(.97) | n/a | opacity-40 |
| Morpheme drag tile | border, --elev | shadow-card, translateY(-2px) | outline-blue 2px | scale(.97) | border-blue, bg-blue-sub | — |
| Map country (World Quest) | --elev fill, border stroke | dashed border | outline-blue 2px | — | green-sub or red-sub per correctness | — |
| Session header exit button | text-t3 | text-t1, bg-white/6 | outline-blue 2px | scale(.97) | — | — |
| Session header settings button | text-t3 | text-t1, bg-white/6 | outline-blue 2px | scale(.97) | — | — |
| Quit banner "Stay" / "Leave" | per variant | per variant | outline-blue 2px | scale(.97) | — | — |
| Session complete action buttons | per variant | per variant | outline-blue 2px | scale(.97) | — | — |
| World Map marker | per marker type | scale(1.1), shadow | outline-blue 2px | scale(.95) | pulse ring, accent colour | — |

---

## 14. Accessibility requirements

All requirements are in addition to the WCAG 2.1 AA baseline.

**Touch targets:** All interactive elements minimum 44×44px. CardPickerTile minimum
44px in the smaller dimension. On phone, 2-column grid tiles are at least 150px wide.

**Colour:** Never the only state indicator. Selection indicator on CardPickerTile uses
both colour (border + background) AND a Check icon. Correct/incorrect feedback uses
both colour AND an icon.

**Motion:** All animations respect `prefers-reduced-motion`. Confetti and XP bursts do
not fire. Bar and XP bar animations complete instantly (duration: 0). The quit
confirmation banner appears immediately without slide animation.

**Focus management:**
- When card picker sheet opens: focus moves to the first CategoryPill or first
  CardPickerTile.
- When sheet closes: focus returns to the GameCard that triggered it.
- When session complete overlay opens: focus moves to the "Play again" button.
- When quit confirmation banner appears: focus moves to the "Stay" button.

**Reading level:** All Harry-facing copy is plain English, active voice. No educational
jargon. Maximum sentence length: 12 words. Button labels: 2–3 words maximum.

**No audio output.** Absolute prohibition — no correct-answer chimes, wrong-answer
buzzes, background music, or pronunciation audio. All phoneme activity in Word Safari
is visual-only.

**No time pressure.** No countdown timers visible to Harry. "Speed mode" for Years 5–6
Coin Rush is an opt-in parental setting — not a default, not a visible timer. If shown,
a depleting bar (not a numeric countdown) is used.

**Dyslexia-friendly typography:** DM Sans (existing app font). `letter-spacing: 0.1em`
inside filled spelling slots.

---

## 15. CardsScreen — collection tab extensions

The existing `CardsScreen` uses `Packs` and `Collection` tabs. This spec adds a `Map`
tab (see section 16). The `Collection` tab and `CollectedCardDetailSheet` also receive
additions to surface card-game history and progression.

### Collection tab — card tile additions

Each existing card tile in the `CollectionGrid` gains:

**Game session count row (below RarityBadge, above the tile border):**
```
[Game icon pair — Word Safari + Coin Rush icon, 12px each, --t3]
[Session count — "8 sessions" 11px/400 --t3]
```
This is a compact summary. It shows the total sessions played across all four games for
this specific card. Full breakdown is in the detail sheet.

**Level indicator (top-right corner of image):**
```
[Level pill — "Lv 5" — 10px/700, green tint-pair if Lv 4+, amber tint-pair if Lv 7+]
```
Level 1–3: neutral (`--t3` text, `--elev` bg, `--border-s` border)
Level 4–6 (first rarity increase): `var(--green-sub)` bg + `var(--green)` border + `var(--green-t)` text
Level 7–10 (second rarity increase): `var(--amber-sub)` bg + `var(--amber)` border + `var(--amber-t)` text

Tint-pair throughout — no solid fills on level indicators.

### CollectedCardDetailSheet extensions

The existing sheet (section order: Hero row → Stats → Duplicates → Description → Ability)
receives two new sections inserted between Stats and Duplicates:

**New section: Card progression**
```
── Card progression ──
[Overall level: progress bar, Lv X / 10, tint-pair by level as above]
[Next level: "Y sessions to Level X+1" — 13px/400 --t3]
```

**New section: Game history**
```
── Game sessions ──
[Row per game: game icon 16px, game name 14px/600 --t1, session count badge]
```
Session count badge per game uses the game's accent tint-pair:
`bg-[var(--X-sub)] border border-[var(--X)] text-[var(--X-t)] text-[11px]/700`

If a game has never been played with this card, the row shows "Not played yet" in
`--t3` with a muted icon.

Example:
```
[Leaf icon, green-t]    Word Safari   [8 sessions — green tint-pair]
[Coins icon, amber-t]   Coin Rush     [5 sessions — amber tint-pair]
[Microscope, blue-t]    Habitat       [3 sessions — blue tint-pair]
[Globe, purple-t]       World Quest   [0 sessions — "Not played yet" --t3]
```

**Consistency check:** This section uses the same icon sizes and tint-pair pill pattern
as the GameCard in PlayHubScreen. It must visually match that reference.

---

## 16. World Map — navigation placement decision

The World Map is a significant new feature described in Part 5 of the complete spec.
It must fit the existing six-tab navigation without adding a seventh tab. The existing
tabs are: Home, Explore, Collection, Figures, Play, Store.

**Decision: World Map lives inside the Collection tab as a third sub-tab.**

Rationale:
1. The map is fundamentally about Harry's collection — it shows where his 200 cards
   come from and where he has explored.
2. Adding a seventh nav tab at this screen width (Harry's iPad at ~820px) would make
   each tab label barely readable (820px ÷ 7 ≈ 117px per tab is acceptable, but
   introduces compression risk as label count grows).
3. The Collection tab currently has Packs and Collection sub-tabs. Adding Map as a third
   sub-tab is structurally consistent and gives the map a discoverable home.
4. The Play hub's World Quest game drives map discovery — tapping "Open World Map" from
   World Quest navigates to `/cards?tab=map`. This is a coherent cross-feature journey.

**CardsScreen centre-slot control update:**
The existing `PillToggle` or segmented control in CardsScreen's `centre` PageHeader slot
expands from two items (Packs | Collection) to three items (Packs | Collection | Map).
The control remains `inline-flex` and compact. It must not become full-width.

**If a dedicated `/map` route is required later** (e.g. for deep linking from World Quest
sessions), the route exists but redirects into the `/cards?tab=map` view. The map is not
a standalone screen in the primary navigation.

### World Map screen layout

**Full-bleed map on iPad:**
On iPad (≥820px), the map fills the full viewport width below the glass PageHeader.
No `max-w-3xl` container — the map earns the full canvas. The PageHeader floats above
with `position: fixed` glass treatment.

**Two-panel layout on iPad landscape (1024px+):**
```
+-----------------------------------+------------------+
│  Map canvas (left, 65%)           │  Region panel    │
│                                   │  (right, 35%)    │
│  [SVG/canvas world map]           │                  │
│  [Animal markers — collected,     │  [Selected       │
│   discovered, undiscovered]       │   region info,   │
│  [Migration route lines]          │   or selected    │
│  [Range polygon overlays]         │   animal detail] │
│                                   │                  │
+-----------------------------------+------------------+
```

On iPad portrait and phone: the map fills full width. The region/animal panel becomes
the swipe-up bottom panel (see below).

**Single-panel layout on phone / iPad portrait:**
```
[Map canvas — fills full width, scrollable/zoomable]
[Swipe-up panel — collapsed by default, expands on tap]
```

### Map markers

Four marker types — all use tint-pair colours, no solid fills on the markers themselves:

| Marker type | Visual | Tap action |
|---|---|---|
| Collected | Filled circle, `var(--green-sub)` fill + `var(--green)` border, animal thumbnail inside | Opens animal detail panel |
| Discovered (not collected) | Outlined circle, `var(--border)` stroke, `var(--t3)` dashed | Opens preview with "Find this card" CTA |
| Undiscovered | `?` mark, `var(--elev)` circle, `var(--t4)` text | Tap reveals "Explore this region in World Quest" |
| Clustered | Number badge, `var(--blue-sub)` bg + `var(--blue)` border, `var(--blue-t)` text | Tap zooms to cluster |

**Collected marker pulse:** When a card is newly collected (within the same session),
its marker pulses: `scale: 1 → 1.15 → 1` repeating, `var(--green)` ring, 2s period.
`prefers-reduced-motion`: no pulse, marker is simply filled.

**Migration routes:** For migratory species (Monarch Butterfly, Arctic Tern, etc.),
an animated arrow traces the route on the map. Route line: `2px dashed var(--purple)`,
arrow head at `var(--purple-t)`. Animation: dash offset scrolling over 4s, looping.
`prefers-reduced-motion`: static line with no animation.

**Conservation status badge:** Small overlay on the marker (bottom-right corner):
- Stable: `var(--green-sub)` dot (no text — space is too small)
- Vulnerable: `var(--amber-sub)` dot
- Endangered: `var(--red-sub)` dot
- Critically endangered: `var(--red)` dot (solid — this is the severity indicator)

This is the one exception to tint-pair on badges — a critically endangered marker uses
a solid red dot because it must be maximally legible and alarming at small size.

### Animal detail panel (swipe-up / right panel)

**Collapsed state (swipe-up handle visible):**
```
[Animal thumbnail — w-12 h-12 rounded-xl object-cover]
[Animal name — 16px/700 --t1]
[Rarity badge]
["Tap to expand" — 11px/400 --t3]
```

**Expanded state:**
```
[Animal name — 22px/700 --t1]
[Rarity badge + conservation status badge]

── Habitat ──
[Biome — 14px/400 --t2]
[Region — 14px/400 --t2]
[Altitude (if applicable)]

── Your card ──
[Level progress bar — same pattern as section 15]
[Sessions row — same as CollectedCardDetailSheet section 15]

── Conservation ──
[Population estimate — 14px/400 --t2]
[Main threats — comma-separated]

[Button: "Play World Quest with [card name]" — primary variant]
[Button: "Open card details" — outline variant]
```

All buttons use `max-w-sm mx-auto w-full` on phone.
On iPad right-panel, buttons are full-width of the 35% panel.

**Surface treatment:** The expanded panel is a BottomSheet (glass surface, portal).
Glass: `rgba(13,13,17,.80)` + `backdrop-filter: blur(24px)` +
`border-top: 1px solid rgba(255,255,255,.06)`.
Backdrop: `bg-black/10` — not higher.

### Biomes view (Map centre-slot toggle)

When "Biomes" is selected in the Map tab's own two-item toggle:

```
+-------------------------------------------+
│  [6 biome cards — 2-col grid on phone,    │
│   3-col on iPad portrait, 3-col landscape]│
│                                           │
│  [Temperate Forest card]                  │
│  [Tropical Rainforest card]               │
│  [Grassland / Savanna card]               │
│  [Desert card]                            │
│  [Arctic / Polar card]                    │
│  [Aquatic / Wetland card]                 │
└───────────────────────────────────────────┘
```

Each biome card anatomy:
```
[Biome colour band — h-3, full width, solid biome accent]
[Biome icon — 24px, tint-pair]
[Biome name — 16px/700 --t1]
[Collection count — "8 / 15 animals" — 13px/400 --t2]
[Progress bar — h-1.5, biome accent fill]
```

Biome accent colour assignments (use DS tokens closest to biome feel):
- Temperate Forest: `--green`
- Tropical Rainforest: `--green` (same — differentiated by name)
- Grassland/Savanna: `--amber`
- Desert: `--amber`
- Arctic/Polar: `--blue`
- Aquatic/Wetland: `--blue`

Where two biomes share an accent, the Biome icon differentiates them visually.
No new hex values introduced — existing DS tokens only.

Tapping a biome card opens a full-screen sheet listing all animals in that biome
with collection status. The sheet has a "Explore this biome in World Quest" primary
button at the bottom.

---

## 17. Open questions for Product Owner (Phase B)

The following items require PO input before Phase C begins:

1. **Card data source for games:** The educational games spec calls for card-specific
   questions based on species data. `CollectedCard` has `animalType`, `breed`, `name`,
   `stats`, `description`, `ability`. The full per-animal curriculum data (vocabulary
   bank, etymology, maths context, habitat data, map coordinates) described in the
   complete spec does not yet exist in the codebase. PO to confirm: does Phase 1 ship
   with a hand-authored question bank per animal, or a template system that fills stat
   values and generic animal text into question templates?

2. **Card-level tracking:** The spec calls for per-card, per-game level tracking
   (e.g. "Scout: Word Safari Level 3, Coin Rush Level 1"). The current `CollectedCard`
   and `SkillProgress` schemas do not include this. Dev to propose the schema extension.
   PO to confirm scope.

3. **`lastUsedCardId` per game:** GameCard "last played card" thumbnail requires storing
   the `CollectedCard.id` most recently used per game. New field on `SkillProgress` per
   `area`. Confirm scope.

4. **`discoveredCountries`:** World Quest map discovery requires `discoveredCountries:
   string[]` on the `SkillProgress` record for `area: 'geography'`. Confirm scope.

5. **Challenge level persistence:** Where is the per-game challenge level stored? On
   `SkillProgress` per `area`, or a separate settings table? Dev to confirm before
   implementing the first-run level selector.

6. **World Map SVG asset:** The spec calls for a custom SVG world map for World Quest
   and the World Map screen. This is a design asset, not a code deliverable. PO to
   confirm whether a suitable open-licence SVG is available or must be commissioned.
   This may gate World Quest and the World Map screen behind a later phase.

7. **BottomNav suppression on session routes:** The existing `AppRouter` handles nav
   visibility. Dev to confirm the routing pattern for suppressing BottomNav on game
   session routes without duplicating router logic.

8. **Phase 1 game scope:** The complete spec describes Phase 1 as covering Years 1–2
   content for all four games. PO to confirm which games ship in Phase 1 and whether
   World Quest (which requires the SVG asset) can be deferred to Phase 2.

9. **Stat update on correct answer:** The complete spec says stats change in the DB when
   questions are answered correctly. PO to confirm: does a stat increment happen on
   every correct answer, or only on level-up? And which table? (`CollectedCard.stats`
   directly, or a separate card-progress table?)

---

## Appendix A — Consistency check

Before finalising this spec, the following existing patterns were reviewed:

| Pattern | Source | How this spec aligns |
|---|---|---|
| Animal grid card | `CardsScreen.tsx` CollectionGrid | CardPickerTile uses same `aspect-square` pattern and identical hover treatment |
| CollectedCardDetailSheet hero row | `CollectedCardDetailSheet.tsx` | Game history sections added below existing stat block — structure not changed |
| BottomSheet glass | Existing `BottomSheet` component | Card picker and animal detail panel use the existing component unchanged |
| PageHeader glass | `PageHeader.tsx` | Session header uses same glass tokens but is bespoke (different slots) |
| CategoryPills tint-pair | `CategoryPills.tsx` (ExploreScreen) | Card picker filter pills reference this explicitly |
| GamesContent GameCard hover | `PlayHubScreen.tsx` | GameCard hover pattern preserved; only internal content and tap behaviour changed |
| RaceResultOverlay portal | `PlayHubScreen.tsx` | SessionCompleteOverlay follows the same portal pattern at z-1200 |
| Filter pills active state | `ExploreScreen.tsx` | Map biome filter pills and card picker filter pills both use the same tint-pair |
| ArcadeShell quit confirmation | `ArcadeShell.tsx` (existing) | Existing implementation uses a modal with `bg-black/75` — this spec replaces it with the inline banner pattern for the redesigned session shell. ArcadeShell itself is retired in favour of the new game session screen |

---

*End of spec. Proceed to Phase B (PO brief) after owner approval.*
