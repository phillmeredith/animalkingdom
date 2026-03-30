# Interaction Spec v2 — Rescue Missions, Bounty, Release Celebration, Homepage Indicator, Charity Journey

**Feature:** store-rewards (expanded scope)
**Author:** UX Designer
**Date:** 2026-03-30
**Status:** Draft — supersedes and extends interaction-spec.md for the areas listed below.
**Inputs:** ur-findings.md (all 6 findings), interaction-spec.md (v1), useRescueMissions.ts, HomeScreen.tsx, PawtectCard.tsx, DonationSheet.tsx, usePawtect.ts

---

## What this document covers

This spec adds five new areas that were out of scope in v1:

1. **Mission task redesign** — removing school-subject language; all task descriptions rewritten as conservation/ranger actions
2. **Bounty system** — coin reward awarded at the moment an animal is released to the wild
3. **Release-to-wild celebration** — full-screen overlay replacing the current info toast
4. **Homepage rescue indicator** — card/banner on HomeScreen when a mission is active or an animal is release-ready
5. **Charity journey definition** — what Pawtect is, how it connects to rescue missions, the full flow

Everything in interaction-spec.md v1 (market filter tabs, mission card anatomy, Mission Brief Sheet, rescued card state in My Animals, confirmation modal, edge cases, accessibility) remains valid and is **not replaced** by this document. Read both documents together. Where v2 explicitly contradicts v1, v2 takes precedence.

---

## Part 3: Mission Task Redesign

### 3.1 Rationale

The existing seed missions contain tasks described as "Answer 2 science questions correctly", "Answer 3 geography questions correctly", and "Answer 4 geography questions correctly". These are school-register descriptions. The app's framing is a junior ranger / conservationist carrying out fieldwork — not a student answering a teacher's questions. Every task description must read as an action a ranger would perform, not an answer a pupil would give.

The UR findings (Finding 5) confirm that task descriptions should be task-oriented and concrete ("3 short missions to rescue" not "complete in 3 days"). This applies equally to individual task labels: the description tells Harry exactly what to do, not what he must know.

### 3.2 Replacement task vocabulary

The following vocabulary defines the register for all task descriptions. FE and Developer must not write task descriptions outside this vocabulary in seed data or generated tasks.

| Task type | Old register (prohibited) | New register (required) |
|-----------|--------------------------|-------------------------|
| `knowledge` | "Answer N science questions correctly" | "Study N animal profiles in your ranger log" |
| `knowledge` | "Answer N geography questions correctly" | "Complete N habitat surveys on the World Map" |
| `knowledge` | "Answer N questions correctly in any subject" | "Complete N ranger field notes" |
| `arcade` | "Complete N Word Safari sessions with any card" | "Complete N animal tracking sessions in Word Safari" |
| `arcade` | "Complete N Coin Rush sessions" | "Run N wildlife monitoring rounds in Coin Rush" |
| `care` | "Complete N care actions for any wild animal" | "Carry out N animal welfare checks" |
| `care` | "Complete N care actions for any animal" | "Carry out N welfare checks at the sanctuary" |
| `map` | "Discover N countries in World Quest" | "Survey N new habitats on the World Map" |
| `checkin` | "Visit the app on N separate days" | "Check in to the sanctuary on N separate days" |

### 3.3 Rewritten task descriptions — all 6 seed missions

These are the exact replacement strings that replace the task descriptions in useRescueMissions.ts seed data. Developer must apply these replacements verbatim.

**Grey Wolf:**
- wolf-arcade-1: `"Complete 2 animal tracking sessions in Word Safari"`
- wolf-care-1: `"Carry out 3 welfare checks at the sanctuary"`
- wolf-knowledge-1: `"Study 2 animal profiles in your ranger log"`

**Arctic Fox:**
- fox-arcade-1: `"Complete 2 animal tracking sessions in Word Safari"`
- fox-knowledge-1: `"Study 2 animal profiles in your ranger log"`
- fox-checkin-1: `"Check in to the sanctuary on 2 separate days"`

**Bottlenose Dolphin:**
- dolphin-arcade-1: `"Complete 3 animal tracking sessions in Word Safari"`
- dolphin-knowledge-1: `"Study 3 animal profiles in your ranger log"`
- dolphin-care-1: `"Carry out 4 welfare checks at the sanctuary"`

**Seahorse:**
- seahorse-arcade-1: `"Complete 3 animal tracking sessions in Word Safari"`
- seahorse-knowledge-1: `"Study 3 animal profiles in your ranger log"`
- seahorse-map-1: `"Survey 2 new habitats on the World Map"`

**Koala:**
- koala-arcade-1: `"Complete 4 animal tracking sessions in Word Safari"`
- koala-care-1: `"Carry out 5 welfare checks at the sanctuary"`
- koala-knowledge-1: `"Complete 4 habitat surveys on the World Map"`
- koala-checkin-1: `"Check in to the sanctuary on 3 separate days"`

**Giant Panda:**
- panda-arcade-1: `"Complete 5 animal tracking sessions in Word Safari"`
- panda-care-1: `"Carry out 7 welfare checks at the sanctuary"`
- panda-knowledge-1: `"Complete 5 ranger field notes"`
- panda-map-1: `"Survey 3 new habitats on the World Map"`
- panda-checkin-1: `"Check in to the sanctuary on 5 separate days"`

### 3.4 Task description rules for future missions

Any mission authored after this spec is approved must follow the vocabulary table in §3.2. The rule applies to all three surfaces where task descriptions are visible: the mission card grid (§1.6 of v1), the Mission Brief Sheet (§2.2 of v1), and the mission progress toast (§2.3 of v1).

---

## Part 4: Bounty System

### 4.1 What the bounty is

The bounty is a coin reward awarded to Harry when he releases a rescued animal back to the wild. It is separate from the existing 50 XP award. It acknowledges the sustained effort Harry has put in over the foster period — the harder the rescue, the larger the bounty.

The bounty is not awarded on `claimRescue` (when Harry first gets the animal into care). It is awarded on `releaseToWild` (when the animal is returned). This preserves the forward-looking motivation: Harry knows the bounty is coming when he releases, so releasing is always the right financial move.

### 4.2 Bounty amounts by rarity

| Rarity | Bounty (coins) | Rationale |
|--------|---------------|-----------|
| Common | 50 | One session's baseline earnings; proportionate to 3-task effort |
| Uncommon | 100 | Two sessions' earnings; reflects 3-task + longer foster period |
| Rare | 200 | Reflects 4-task mission and 7-day foster period |
| Epic | 350 | Reflects 5-task mission and 10-day foster period |
| Legendary | 500 | Maximum effort, maximum reward; scarcity drives perceived value |

These amounts are designed against the economy established in usePawtect.ts (starting balance 500 coins, daily bonus ~25 coins, session earnings 25–100 coins). The common bounty (50) is meaningful without being trivial. The legendary bounty (500) is equivalent to a full starting balance, which is appropriate for what will be a rare and significant achievement.

### 4.3 Where the bounty amount is shown — pre-release surfaces

The player must see the bounty before they commit to releasing, so it reads as a reward rather than a surprise tax return. The bounty is displayed:

1. **In the Mission Brief Sheet** — below the rescue missions block, a locked reward row:
   ```
   ── RELEASE REWARD ──
   [Coins icon 14px, var(--amber-t)]  "50 coins bounty on release"
   ```
   This row is always visible regardless of mission progress. Font: `13px / 500, var(--t2)`. Lock icon not used — it is simply informational copy, not interactive.

2. **In the Homing Status block** (§2.5 of v1) — below the progress bar, a single line:
   ```
   [Coins icon 14px, var(--amber-t)]  "50 coin bounty when released"  ← 13px / 400, var(--t2)
   ```

3. **In the Release confirmation modal** (§2.6 of v1) — the modal body copy should be updated from v1 to include the bounty amount explicitly:
   ```
   "[Name] will leave your care. You'll earn [N] coins and a Conservation Hero badge as a thank you for your work."
   ```
   The exact coin amount must be drawn from the mission's rarity tier. This is not a static copy string — it must be dynamic based on `mission.rarity`.

### 4.4 Bounty presentation at the moment of award

The bounty is delivered as part of the release-to-wild celebration overlay (§5 below), not as a standalone toast. The overlay shows the amount prominently. The existing toast in useRescueMissions.ts (`"[Name] has been released! You earned 50 XP."`) should be retired and replaced by the celebration overlay. See §5 for the full overlay spec.

If the celebration overlay is not yet built, a temporary toast is acceptable as an interim state:
```
type: success
title: "[Name] is free! You earned [N] coins."
description: "Well done, ranger. Your coins have been added to your balance."
duration: 6000
```
The word "ranger" is intentional — it reinforces the conservationist identity.

### 4.5 Coin amount display format

Bounty coin amounts are displayed as plain numbers, not abbreviated (e.g. `"50 coins"` not `"50c"`). The Coins Lucide icon (size 14, strokeWidth 2, `var(--amber-t)`) precedes the number. This matches the existing CoinDisplay and DonationSheet coin display pattern.

---

## Part 5: Release-to-Wild Celebration Overlay

### 5.1 Overview

The release-to-wild celebration replaces the current info toast with a full-screen overlay that makes the release feel like a major achievement rather than a deletion. The UR findings (Finding 2, UX implication 4) are explicit: the release animation must come before the card is removed from the collection, and it must look like a celebration of the animal returning to freedom, not a loss.

The overlay is triggered by a confirmed release (`releaseToWild` completing successfully). It is a `createPortal(content, document.body)` full-viewport overlay. Z-index 9999. It dismisses on explicit user action only — no auto-dismiss.

### 5.2 Surface

```
position:   fixed
inset:      0
z-index:    9999
background: var(--grad-mint) — linear-gradient(135deg, #45B26B, #3772FF)
```

The mint gradient (green → blue) is used here rather than the hero gradient (pink → blue) used in §2.4 of v1 (mission complete overlay). The distinction is intentional: mission complete uses the achievement/reward register (pink); release-to-wild uses the nature/conservation register (green → blue). The two celebrations are visually distinct because they are emotionally different moments.

**Entrance animation:**
```
initial:   { opacity: 0, scale: 0.97 }
animate:   { opacity: 1, scale: 1 }
transition: { type: "spring", stiffness: 280, damping: 28, duration: 0.45 }
```
The overlay itself does not translate on Y — it blooms from near-full-size into full-size. This avoids a "panel sliding up" metaphor and instead reads as the world expanding around Harry.

### 5.3 Layout (centred column, vertically centred, max-w-md on iPad)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│                                                                   │
│              [Particle burst — see §5.5]                         │
│                                                                   │
│         [Animal image — 128×128, rounded-2xl, ring]              │
│                                                                   │
│         "[Animal Name]"                                           │
│         "is free."                                                │
│                                                                   │
│         "Well done, ranger. [Name] is back in the wild           │
│          where they belong."                                      │
│                                                                   │
│         ┌──────────────────────────────────────────────────┐     │
│         │  [Coins icon]  50 coins added to your balance    │     │
│         └──────────────────────────────────────────────────┘     │
│                                                                   │
│         [View on World Map — primary button]                      │
│         [Continue — outline button]                               │
│                                                                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**iPad layout (primary breakpoint, ≥768px):** The content column is `max-w-md mx-auto` (448px). The overlay covers the full viewport but the text and image are centred within a constrained column. This prevents the content from looking lost in the centre of an iPad screen.

**Phone layout (<768px):** Content column is `w-full px-8`.

### 5.4 Element specifications

**Animal image:**
```
width:         128px (w-32)
height:        128px (h-32)
border-radius: 20px (rounded-[20px])
object-fit:    cover
ring:          3px solid rgba(255,255,255,.30)
ring-offset:   3px (ring-offset-0 on the gradient bg — no offset needed)
margin-bottom: 20px
```
The ring uses a translucent white rather than a solid white so it reads as a halo on the gradient background.

**Animal name:**
```
font:         32px / 700 (text-[32px] font-bold)
color:        #FCFCFD (--t1)
text-align:   center
line-height:  1.1
margin-bottom: 4px
```

**"is free." line:**
```
font:         20px / 400 (text-[20px])
color:        rgba(252,252,253,.80)
text-align:   center
font-style:   italic
margin-bottom: 20px
```

**Body copy:**
```
font:         15px / 400 (text-[15px])
color:        rgba(252,252,253,.75)
text-align:   center
line-height:  1.6
max-width:    300px
margin:       0 auto 24px
```
Copy format: `"Well done, ranger. [Name] is back in the wild where they belong."`
The word "ranger" is always used. Do not substitute "Harry" here — "ranger" is the identity Harry is being invited into, and it is more powerful at this celebratory moment.

**Coin bounty strip:**
```
background:   rgba(255,255,255,.12)
border:       1.5px solid rgba(255,255,255,.25)
border-radius: 12px (--r-md)
padding:      14px 20px
display:      flex
align-items:  center
gap:          10px
margin:       0 auto 28px
max-width:    280px
```

Coins icon: `Coins` Lucide, size 20, strokeWidth 2, color `#FCFCFD`.

Coin text:
```
font:   15px / 600
color:  #FCFCFD
```
Copy: `"[N] coins added to your balance"`. N is drawn from the bounty table in §4.2. This is dynamic, not static.

**"View on World Map" button:**
```
variant:      primary (but overridden for the gradient bg context)
surface:      rgba(255,255,255,.18)
border:       1.5px solid rgba(255,255,255,.35)
color:        #FCFCFD
width:        100% (max-w-[280px] mx-auto)
height:       48px
border-radius: 100px (--r-pill)
font:         15px / 600
margin-bottom: 10px
```

Interaction states:
| State | Treatment |
|-------|-----------|
| Default | `rgba(255,255,255,.18)` bg, `rgba(255,255,255,.35)` border, `#FCFCFD` text |
| Hover | `rgba(255,255,255,.26)` bg, border opacity → 60%, 200ms |
| Pressed | `scale(.97)`, 100ms |
| Focus-visible | `outline: 2px solid rgba(255,255,255,.80); outline-offset: 2px` |

**"Continue" button:**
```
variant:      text-only link style — no border, no background
color:        rgba(252,252,253,.65)
font:         14px / 500
width:        100% (max-w-[280px] mx-auto)
height:       44px
text-align:   center
```
The "Continue" button reads as secondary/dismissive. It does not get the same surface treatment as "View on World Map". It should look like a quiet "no thanks" path, not a competing CTA.

Interaction states:
| State | Treatment |
|-------|-----------|
| Default | No border, no bg, `rgba(252,252,253,.65)` text |
| Hover | `rgba(255,255,255,.06)` bg, text opacity → 90%, 200ms |
| Pressed | `scale(.97)` |
| Focus-visible | `outline: 2px solid rgba(255,255,255,.80); outline-offset: 2px` |

### 5.5 Particle burst animation

The particle burst fires at the moment the overlay opens. Particles originate from the centre of the animal image and scatter outward.

**Particle count:** 18–24 particles. On `prefers-reduced-motion: reduce`, the burst is skipped entirely (particles not rendered).

**Particle shapes:** Mix of small circles (8px diameter) and small squares rotated 45deg (8px). Ratio: 60% circles, 40% squares. Color: white, `rgba(255,255,255,.70)` to `rgba(255,255,255,.30)` (fades across particles).

**Particle initial state (per CLAUDE.md Framer Motion rule §3):**
```javascript
initial: { x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }
```
Never `initial={{ scale: 0 }}` on burst particles. Particles are full-size from frame zero.

**Particle animate state:**
Each particle receives a randomised target:
```javascript
animate: {
  x: randomInRange(-180, 180),    // px
  y: randomInRange(-200, 60),     // px — skewed upward, matching gravity
  opacity: 0,
  rotate: randomInRange(-180, 360),
}
transition: {
  duration: randomInRange(0.9, 1.4),   // seconds
  ease: [0.23, 1, 0.32, 1],           // custom easing: fast start, slow decelerate
}
```

The Y range skews upward (-200 to +60) to make the burst read as particles flying upward from the animal, not equally in all directions. A burst that goes equally in all directions reads as an explosion; a burst that favours upward motion reads as confetti being thrown into the air.

**Particle component note for FE:** Particles must be rendered outside the `<AnimatePresence>` block that controls the overlay entrance animation. See CLAUDE.md Framer Motion rule §1. The overlay entrance and the particle burst are independent animations. Rendering particles as siblings of the overlay inside `mode="wait"` will block the burst until the entrance exits.

**Particle render timing:** The burst fires 200ms after the overlay opacity reaches 1. This gives the animal image time to appear before the particles scatter — the burst originates from a visible image, not from a still-loading placeholder.

### 5.6 Accessibility

- Overlay uses `role="alertdialog"`, `aria-modal="true"`, `aria-label="[Animal Name] released to the wild"`.
- Focus is set on the "View on World Map" button when the overlay mounts.
- Escape key dismisses the overlay (calls the same handler as "Continue").
- `aria-live="assertive"` on the overlay so the animal name and "is free" copy is read by screen readers at the moment of appearance.
- Particles are `aria-hidden="true"`.
- The coin strip has `role="status"` to announce the balance update.

### 5.7 Dismiss behaviour

Tapping "Continue" or pressing Escape closes the overlay. The animal card is removed from My Animals at this point — the card removal happens after the overlay is dismissed, not before. This is required by the UR finding (UX implication 4): the celebration must complete before the card disappears.

Tapping "View on World Map" navigates to `/map` and then closes the overlay. The World Map should have a visible release pin for the animal. If the World Map is not yet built, the button navigates to `/explore` instead as a placeholder, with a toast: `"World Map coming soon — your release has been recorded."` (info, 4s).

Tapping the backdrop (outside the content column) does not dismiss the overlay. This is a modal moment. Harry must make a deliberate choice: celebrate with the map, or continue. Accidental backdrop taps should not cancel the celebration.

---

## Part 6: Homepage Rescue Indicator

### 6.1 Placement and priority

The rescue indicator card(s) appear in HomeScreen between the PawtectCard and the HomeStatCards. Looking at the HomeScreen render order:

```
DailyBonusCard (auto-dismissed, top of list)
PawtectCard (permanent)
[NEW] RescueMissionBanner(s) ← inserted here
HomeStatCards
Care section (FeaturedPetCard list)
```

Placement rationale: PawtectCard is the charity anchor (always visible); rescue missions are an extension of that charitable framing and should sit close to it. They sit above stats because a live rescue is more urgent than a summary number.

### 6.2 States and what triggers each

| State | Trigger | Banner shown |
|-------|---------|--------------|
| No active missions | All missions `available` or `released` | No banner. Silence. |
| Mission in progress | One or more missions with status `in_progress` | "In Progress" banner per mission |
| Animal ready for release | One or more missions with `claimed` status AND `releaseReadyDate` ≤ today | "Ready for release" banner per animal |
| Both states active | Mix of `in_progress` and release-ready | Release-ready banners first (higher urgency), then in-progress banners |

The banner is not shown for `complete` status (between completing all tasks and claiming the rescue). That state is short-lived and the player is typically in the Store flow when it happens. Surfacing it on the home screen would create a confusing double-prompt.

### 6.3 "In progress" mission banner

**Component name:** `RescueMissionBanner` — a new home-screen component in `src/components/home/`.

```
┌──────────────────────────────────────────────────────────────┐
│  [Animal 56×56]   Grey Wolf                  [ChevronRight]  │
│  rounded-xl        Rescue in progress                        │
│                   [Progress bar — 2 of 3 tasks]              │
└──────────────────────────────────────────────────────────────┘
```

**Surface:** `var(--card)`, `border: 1px solid var(--border-s)`, `border-radius: var(--r-lg)` (16px), no shadow at rest.

**Left accent bar:** A 3px vertical bar on the left inner edge of the card, colour `var(--blue)`. This is not a border — it is an inset decoration using `border-left: 3px solid var(--blue)` on the card container, with the container using `border-radius: var(--r-lg)` but the left bar requiring `border-left-radius: 0` technique (use a pseudo-element or a flex inner container to avoid radius conflict). Recommended: nest the content inside a `<div>` that has `padding-left: 16px`; the parent has the left accent bar as an `::before` pseudo or via an explicit left-border with matching radius suppression.

Actually, the cleanest approach: the card has `border: 1px solid var(--border-s)` as its ring. Internally, a 3px left accent sits as a `<div style="width:3px; background: var(--blue); border-radius: 9999px; align-self: stretch; flex-shrink: 0; margin: 8px 0" />` as the first child of the flex container. FE to choose the implementation that best matches the intended visual. Do not use a CSS border for the accent — it will conflict with the card border radius.

**Layout (flex, align-items: center, gap: 12px, padding: 14px 16px):**

Animal image:
```
width:         56px (w-14)
height:        56px (h-14)
border-radius: 12px (--r-md)
object-fit:    cover
flex-shrink:   0
```

Text column (flex-1):

Title: `"[Animal Name]"` — `15px / 600, var(--t1)`, single line, truncated with ellipsis if too long.

Subtitle: `"Rescue in progress"` — `12px / 400, var(--t2)`, margin-bottom 6px.

Progress bar + label:
```
height:           3px
border-radius:    9999px
track:            var(--elev)
fill:             var(--blue)
width:            100%
transition:       width 300ms ease
margin-bottom:    4px
```
Progress label: `"[X] of [Y] tasks complete"` — `11px / 400, var(--t3)`.

`role="progressbar"`, `aria-valuenow={X}`, `aria-valuemin="0"`, `aria-valuemax={Y}`.

Right chevron: `ChevronRight` Lucide, size 16, strokeWidth 2, `var(--t4)`, `flex-shrink: 0`.

**Interaction:**
The banner is fully tappable (the entire card is a button). Tapping navigates to the Store screen with the Rewards tab active and the relevant mission card visible. Navigation: `navigate('/store', { state: { tab: 'marketplace', marketTab: 'rewards', scrollToMission: missionId } })`. The Store and MarketplaceContent must accept this navigation state and scroll to the relevant card on mount.

**Interaction states:**
| State | Treatment |
|-------|-----------|
| Default | `var(--card)` bg, `var(--border-s)` border, no shadow |
| Hover | `border-color: var(--border)`, `translateY(-2px)`, `shadow: var(--sh-card)`, 300ms |
| Pressed | `scale(.97)`, 100ms |
| Focus-visible | `outline: 2px solid var(--blue); outline-offset: 2px` |

### 6.4 "Ready for release" mission banner

The release-ready state is higher urgency. The visual treatment changes to signal action is needed.

```
┌──────────────────────────────────────────────────────────────┐
│  [Animal 56×56]   Grey Wolf                  [ChevronRight]  │
│  rounded-xl        Ready for release!                        │
│                   [Release now — pink accent pill button]    │
└──────────────────────────────────────────────────────────────┘
```

**Left accent bar:** `var(--green)` (not blue — green signals readiness/completion).

**Subtitle:** `"Ready for release!"` — `12px / 600, var(--green-t)`, not `var(--t2)`. The colour change signals this is actionable, not just informational.

**Release now button (inline in banner):**
```
variant:      accent (pink)
size:         xs — height 28px, padding 0 12px
border-radius: 100px (--r-pill)
font:         12px / 600
label:        "Release now"
flex-shrink:  0
```

This button is a shortcut. Tapping it navigates directly to the PetDetailSheet for the rescued animal, opened on the release-ready state. Navigation: `navigate('/my-animals')` and trigger the detail sheet for `mission.rescuedPetId`. The PetDetailSheet opens directly — the player does not need to find the animal in the grid manually.

The banner card is also independently tappable (same navigation as the release shortcut). The ChevronRight indicates the card itself is tappable.

**Interaction states (card):** Same as in-progress banner, but with green left accent.

**Interaction states — "Release now" button:**
| State | Treatment |
|-------|-----------|
| Default | `var(--pink)` bg, white text |
| Hover | `var(--pink-h)` bg, `box-shadow: var(--glow-pink)`, 200ms |
| Pressed | `scale(.97)` |
| Focus-visible | `outline: 2px solid var(--blue); outline-offset: 2px` |

### 6.5 Multiple banners

When multiple missions are active, multiple banners render in sequence. No carousel. No collapse. Each gets its own card.

**Order:** Release-ready banners first (green), then in-progress banners (blue). Within each group, ordered by `releaseReadyDate` ascending (earliest release first) for release-ready; by `updatedAt` descending (most recently updated first) for in-progress.

**Maximum banners shown:** 3. If Harry has more than 3 active missions, show the top 3 by the ordering rule above and add a quiet summary line below:
```
"+ [N] more missions in progress — view in the Rescue Centre"
```
Font: `12px / 400, var(--t3)`. The entire line is tappable: navigates to Store → Rewards tab.

### 6.6 Animation

Banners enter with:
```javascript
initial:   { opacity: 0, y: 8 }
animate:   { opacity: 1, y: 0 }
transition: { duration: 0.25, ease: "easeOut" }
```

Banners exit with:
```javascript
exit: { opacity: 0, scale: 0.96, transition: { duration: 0.2 } }
```

Banners are wrapped in `<AnimatePresence mode="popLayout">` — the same pattern used for the care section in HomeScreen. Each banner must have a stable `key` prop (the mission id).

### 6.7 Empty state

No banner renders when there are no active missions. The empty state is silence — do not show a prompt like "Start a rescue mission". The PawtectCard serves as the conservation entry point at rest. The rescue banner appears only when there is active state to surface.

### 6.8 Content top padding rule

The insertion of RescueMissionBanner(s) does not change the `px-6 pt-4 pb-24 max-w-3xl mx-auto w-full` content container. The banners are children of that container. The `mb-4` margin-bottom on each banner matches the PawtectCard spacing.

---

## Part 7: Charity Journey — Definition and Full Flow

### 7.1 What "charity" means in this app

The app has two charity surfaces that currently operate independently. This spec defines how they connect and what the complete charity journey is.

**Surface A — Pawtect (existing):** Harry donates in-game coins. These coins are recorded in `db.pawtectDonations`. The total donated is shown on the home screen PawtectCard and in the donation sheet success state. Coins go to "wildlife conservation" — this is deliberately vague because the coins are not real money and cannot be sent anywhere. Pawtect is a motivational mechanic: it gives Harry agency over his coin balance and frames the coin economy as having social purpose.

**Surface B — Rescue missions (existing + this spec):** Harry completes conservation actions to rescue wild animals, fosters them, and releases them. The release earns a coin bounty. This is active charity — doing something for a specific animal, not donating fungible coins.

**The charity journey is the combination of both.** The Pawtect donation and the rescue mission are two ways Harry can express the same value: caring about wildlife. The design must make this connection legible. Currently the two surfaces are visually and narratively disconnected. This spec defines the connecting tissue.

### 7.2 The Pawtect conservation fund — reframing

The DonationSheet currently shows a generic "Donate coins to support wildlife conservation." The rescue mission system gives us specific animals with specific conservation contexts. The two should reference each other.

**Updated PawtectCard copy:**

Current body: `"Donate coins to support wildlife conservation."`

Updated body: `"Donate coins to the Pawtect conservation fund. Every coin helps fund rescue missions for endangered animals."`

This copy is a text-only change. No structural changes to `PawtectCard.tsx`. The heading "Help animals in need" remains unchanged.

**Updated DonationSheet heading block:**

Current: `"Help Pawtect"` / `"Donate coins to support wildlife conservation."`

Updated: `"Pawtect Conservation Fund"` / `"Your coins fund rescue missions for vulnerable animals around the world."`

This change brings Pawtect into the same narrative as the rescue missions. They are part of the same conservation story.

### 7.3 Conservation fund progress display

The Pawtect total donated is currently shown as a bare coin count. It needs to be contextualised so it feels meaningful rather than arbitrary.

**New: Rescue missions funded display**

Each rescue mission has an implied coin cost (the bounty the player receives). When Harry donates coins equal to or exceeding a rescue mission's bounty, the fund has "contributed" to that mission type. This is narrative framing — the coins are not actually spent on missions — but it gives Harry a concrete sense of what his donations add up to.

Display rule: `Math.floor(totalDonated / 50)` = number of common rescue missions symbolically funded. This produces the display copy: `"Your donations have helped fund [N] rescue missions."` If N is 0, show nothing. If N ≥ 1, show the count.

This display appears in:
- PawtectCard, below the existing coin count row (conditional on `N ≥ 1`)
- DonationSheet success state, below the "Pawtect Supporter" certificate strip

### 7.4 Conservation milestone badges

The existing badge system (via `checkBadgeEligibility`) provides the technical foundation. The charity journey needs named milestones that connect donations to rescue actions.

**New badge definitions (UX spec only — for Developer to implement in badge logic):**

| Badge name | Condition | Visual treatment |
|------------|-----------|-----------------|
| Wildlife Friend | First Pawtect donation of any amount | Green tint-pair: `var(--green-sub)` bg, `var(--green)` border, `var(--green-t)` text |
| Conservation Ranger | Release first rescued animal | Green tint-pair (same as Wildlife Friend — same colour family, conservation theme) |
| Conservation Hero | Release 3 rescued animals | Purple tint-pair: `var(--purple-sub)` bg, `var(--purple)` border, `var(--purple-t)` text |
| Fund Keeper | Donate 100 coins total to Pawtect | Amber tint-pair: `var(--amber-sub)` bg, `var(--amber)` border, `var(--amber-t)` text |

Note: "Conservation Hero" already appears in v1 §2.6 but was described as triggering on a single release. This spec updates the condition to 3 releases to give it appropriate weight, and introduces "Conservation Ranger" as the first-release badge. Developer should check badge logic and update accordingly.

All badge tint-pair treatments are specified above. None use solid colour with white text.

### 7.5 The complete charity journey — step by step

This is the full sequential journey from first-time player to experienced conservationist.

**Step 1 — Discovery (Home screen)**
Harry opens the app for the first time. He sees the PawtectCard. He taps "Donate coins". He donates 5 coins. He earns the Wildlife Friend badge. The DonationSheet success state shows his first certificate strip. He is now a Pawtect supporter.

**Step 2 — First rescue (Store → Rescue Centre)**
Harry visits the Store, taps the Rewards tab (renamed "Rescue Centre" — see §7.6). He sees the Grey Wolf mission card. He taps "Start Mission". The Mission Brief Sheet opens. He reads that the wolf is in the wild and needs his help. He begins the 3-task mission. Each task is described in conservation language (§3.2). He completes the mission over 2–3 sessions. The mission complete overlay fires.

**Step 3 — Fostering (My Animals)**
Harry claims the rescue. The wolf appears in My Animals with the "In your care" badge. Harry carries out welfare checks (care actions) over the foster period. The Homing Status block shows his progress. The home screen banner (§6.3) reminds him the wolf is in his care each time he visits.

**Step 4 — Release (My Animals → Celebration)**
After 3 days and 5 welfare checks, the wolf is ready for release. The home screen banner changes to release-ready (§6.4). Harry taps "Release now". The PetDetailSheet opens with the "Release to wild" CTA. He taps it. The confirmation modal fires. He confirms. The release-to-wild celebration overlay appears (§5). He reads "Grey Wolf is free." He earns 50 coins. He earns the Conservation Ranger badge. He taps "View on World Map". A pin shows where his wolf was released.

**Step 5 — Continuation and depth**
Harry starts more missions. His PawtectCard shows growing coin totals and missions funded. After 3 releases, he earns Conservation Hero. He donates 100 coins total and earns Fund Keeper. The home screen becomes a dashboard of his active rescues. His World Map fills with release pins — a growing record of his conservation work.

### 7.6 Rescue Centre naming

The v1 spec names the third Store tab "Rewards". The UR findings (Finding 3, Risk 3) flag this as incorrect framing — "Rewards" implies something passive; rescue missions require active effort. The tab label must be changed.

**New tab label:** `"Rescue Centre"` (replacing `"Rewards"`)

This name accurately describes the content (a centre where rescue missions are launched) and matches the narrative register (a junior ranger accessing their mission briefing centre). It does not conflict with the existing section heading HAIRLINE labels inside the mission card ("MISSIONS REQUIRED" etc.).

The tab key in code can remain `rewards` for backwards compatibility with stored state. Only the rendered label changes.

**Updated pill labels for the three-tab row:**

| Tab key | Old label | New label |
|---------|-----------|-----------|
| `market` | Market | Market |
| `for_sale` | For Sale | For Sale |
| `rewards` | Rewards | Rescue Centre |

Everything else in the pill row spec (§1.3 of v1) remains unchanged.

### 7.7 Pawtect and rescue — visual connection

Currently PawtectCard and the rescue mission banners (§6) sit adjacent on the home screen but look unrelated. The connecting visual is the mint gradient (`var(--grad-mint)` — `#45B26B → #3772FF`).

The mint gradient is already used on PawtectCard's header band. The release-to-wild celebration overlay (§5) also uses the mint gradient as its background. This creates a visual through-line: mint = conservation = wildlife = charity. The rescue mission banners (§6.3, §6.4) should use `var(--green)` as their accent bar colour (not blue), which is in the same green family as the mint gradient start colour. This keeps the home screen conservation cluster visually coherent.

---

## Part 8: Updated Edge Cases and Failure States

The following edge cases are additive to §2.7 of v1.

| Scenario | Design treatment |
|----------|-----------------|
| Bounty amount mismatches rarity (data integrity) | If `mission.rarity` is not one of the five defined tiers, default to `common` bounty (50 coins). Log a console warning. Do not silently award 0. |
| Release overlay fires but coin balance update fails | The overlay still shows the intended bounty amount. A separate error toast fires beneath the overlay: `"Your balance could not be updated — please try again."` (red, persistent). The overlay remains dismissible. |
| Harry dismisses release overlay before seeing it fully | "Continue" immediately dismisses. The animal is released. The bounty is already awarded (it was awarded in the transaction). No re-triggering. |
| Home screen has 4+ active missions | Show top 3 banners per §6.5. The "+ N more" line links to Rescue Centre. |
| Home screen viewed while offline | Banners render from cached DB state. No loading state or error shown — the data is local. |
| Release-ready mission but `rescuedPetId` pet no longer exists in savedNames | This is a data inconsistency. The banner should not render for this mission. Log a console warning. If the detail sheet is somehow opened, show an error state: `"This animal's record could not be found — please contact support."` |
| "View on World Map" tapped but World Map is not built | Navigate to `/explore`. Toast: `"World Map coming soon — your release has been recorded."` (info, 4s). |

---

## Part 9: Updated Accessibility Requirements

Additive to §2.8 of v1.

- The release-to-wild overlay is `role="alertdialog"` with `aria-live="assertive"`. The animal name and "is free" are announced on mount.
- The coin bounty strip inside the overlay has `role="status"` to announce the balance change.
- Home screen banners are `<button>` elements (fully tappable, keyboard accessible). `aria-label="[Animal Name] rescue mission, [X] of [Y] tasks complete — tap to view in Rescue Centre"` for in-progress. `aria-label="[Animal Name] is ready for release — tap to view"` for release-ready.
- The "Release now" shortcut button inside the banner has `aria-label="Release [Animal Name] to the wild"`.
- The `"+N more missions"` line is `<button>` with `aria-label="View all [N+current] rescue missions in Rescue Centre"`.
- All particle elements in §5.5 are `aria-hidden="true"`.
- `prefers-reduced-motion: reduce` suppresses the particle burst (§5.5) and reduces overlay entrance to a simple opacity transition (200ms, no scale).

---

## Part 10: Responsive Layout Notes

Additive to §2.9 of v1.

**Homepage banners (§6):**
- Phone (375px): Full-width banner, image 48px (w-12 h-12) to preserve space for text.
- Tablet (768px): Full-width within `max-w-3xl` container, image 56px.
- iPad (1024px): Same as tablet. The `max-w-3xl` constraint means banners do not span the full iPad width. This is correct — they sit in the centred content column.

**Release-to-wild overlay (§5):**
- Phone (375px): Content column `w-full px-8`, animal image 96px (w-24 h-24).
- Tablet (768px): Content column `max-w-sm mx-auto px-6`, image 128px.
- iPad (1024px): Content column `max-w-md mx-auto`, image 128px. The overlay covers the viewport but the content is centred and comfortably proportioned — not a small card floating in a sea of gradient.

**FE must verify at 375px, 768px, and 1024px before marking Phase C complete. The overlay specifically must be checked at 1024px to confirm the content column is not too narrow or too wide.**

---

## Part 11: Design Principles for the Rescue and Charity Journey

These principles guide any design decisions not explicitly covered by this spec. They are derived from the UR findings and should be applied whenever the team encounters an ambiguous case.

1. **Release is the most powerful thing Harry can do — not a loss, a gift.** Every surface leading to release must frame it as an achievement and a positive act for the animal. Language like "ready to go home", "set free", and "back where they belong" is preferred over "removed from collection" or "released from care".

2. **Conservation identity before educational framing.** Harry is a ranger, a carer, a conservationist. He is not a student answering questions. Task descriptions, toasts, and celebration copy must consistently use the ranger/sanctuary register.

3. **Progress must be visible, countable, and honest.** Harry should never have to wonder where he is in a mission. Every surface — home screen banner, mission card, detail sheet, World Map pin — shows the same consistent progress state. The count is always shown as `X of Y`, never "almost there".

4. **Coin economy acknowledges effort.** The bounty scale (50 → 500 by rarity) is a direct acknowledgement that harder rescues deserve larger rewards. Harry should feel the rarity of a legendary release. Do not flatten the reward curve.

5. **The World Map is the memory of the mission journey.** Release pins are permanent. The map accumulates over time into a record of Harry's conservation work. Every design decision about the release flow should ask: does this reinforce the permanence and meaning of Harry's contribution?

---

## Phase C readiness checklist (additions to v1 checklist)

Before Developer and Frontend Engineer begin on any of the new areas in this spec:

- [ ] [OWNER] has reviewed the release-to-wild celebration overlay (§5) before Phase C — per UR risk 1 (over-attachment)
- [ ] [OWNER] has confirmed "Rescue Centre" as the tab label (§7.6)
- [ ] All 6 seed missions have task descriptions updated per §3.3 verbatim
- [ ] Bounty amounts (§4.2) confirmed by [OWNER] against economy balance
- [ ] Homepage banner component (`RescueMissionBanner`) has card anatomy fully defined (done — §6.3, §6.4)
- [ ] Particle burst `initial` state confirmed as `scale: 1, opacity: 1, x: 0, y: 0` (not `scale: 0`) — per CLAUDE.md Framer Motion rule §3
- [ ] Particle burst rendered outside `<AnimatePresence>` block for the overlay entrance — per CLAUDE.md Framer Motion rule §1
- [ ] Release overlay `position: fixed` wrapped in `createPortal(content, document.body)` — per CLAUDE.md portal requirement
- [ ] Conservation badge conditions (§7.4) reviewed against existing badge logic before Developer implements
- [ ] "View on World Map" fallback to `/explore` implemented if World Map not yet built (§5.7)
- [ ] Content top padding `px-6 pt-4 pb-24 max-w-3xl mx-auto w-full` verified on HomeScreen after banner insertion
- [ ] All new copy strings checked: no emojis, no hardcoded hex values, no school-register task descriptions
