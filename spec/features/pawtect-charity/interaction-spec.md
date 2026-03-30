# Interaction Spec: Pawtect Charity

> Feature: pawtect-charity
> Author: UX Designer
> Status: Phase A complete — ready for Phase B (PO)
> Last updated: 2026-03-29

---

## Overview

Pawtect is a fictional in-game charity that Harry can donate coins to in order to help
animals. The feature is narrative and educational in purpose — it teaches the concept of
charitable giving and conservation in a low-stakes, child-appropriate way. It connects
to the broader Animal Kingdom theme of caring for animals.

This feature is primarily motivational and narrative. It does not gate content. Donating
does not unlock features, animals, or items in Tier 3 scope. The reward is intrinsic:
the satisfaction of helping, a visible contribution counter, and a small certificate
moment.

Primary user: Harry, aged 8–10, on iPad Pro 11" (~820px portrait). The experience must
feel warm, positive, and non-pressuring. Harry must never feel that he is being asked to
spend coins he needs for other things.

**Evidence note:** No UR findings file exists for this feature. The design decisions
below are based on the product brief and knowledge of the primary user. User research
should be conducted before Phase C to validate: (a) Harry's understanding of charity as
a concept, (b) whether he finds the coin spend meaningful or confusing, and (c) whether
preset donation amounts or a slider better matches his mental model. Phase B must flag
this gap to the PO.

---

## Mandatory spec requirements checklist

1. Interaction states — covered in section 7
2. Card anatomy — Pawtect entry card anatomy in section 3; donation preset pill anatomy
   in section 4
3. Overlay surface treatment — DonationSheet glass rule stated in section 6
4. Consistency check — reviewed HomeScreen, StoreHubScreen; entry point pattern
   consistent with DailyBonusCard style; see section 3
5. PageHeader slot assignment — no new header controls on existing screens; Home entry
   point is a card in content flow; section 8
6. Navigation ownership — no new bottom nav tab introduced; entry lives in Home content;
   section 8
7. Filter pill style — donation preset pills use tint-pair pattern; section 4
8. Filter and sort row layout — no filter/sort rows introduced
9. Content top padding — explicit class strings in section 5

---

## 1. Feature scope (Tier 3)

**In scope:**
- Pawtect entry card on the Home screen
- Donation BottomSheet: preset amounts, custom input, donate CTA
- Post-donation feedback: success animation + certificate moment + running total counter
- Pawtect total contribution counter (persisted — Harry can see his lifetime total)

**Out of scope (future tiers):**
- Real-world charity integration
- Unlockable animals or cosmetics via Pawtect milestones (may be introduced later)
- Leaderboard or social donation features
- Conservation challenge missions tied to Pawtect

---

## 2. Entry point — Home screen

### Placement

Pawtect lives on the Home screen as a persistent card in the content feed, below the
daily bonus card and above (or alongside) the featured pet section. It is not a tab,
not a bottom nav item, and not a store section. Home is the right anchor because Pawtect
is a daily emotional touchpoint, not a transactional feature.

The card is always visible, not hidden after first donation. Harry's running total is
displayed on the card, which gives him a reason to revisit.

### Entry card anatomy

```
Background:   var(--card)
Border:       1px solid var(--border-s)
Radius:       var(--r-lg)  [16px]
Padding:      20px
```

Layout (flex column):

```
┌─────────────────────────────────────────────┐
│  [Mint gradient band — full width, h-48,    │
│   r-lg top corners, overflow hidden]         │
│   Gradient: linear-gradient(135deg,          │
│   #45B26B, #3772FF)  [--grad-mint]          │
│   [Heart icon, 24px, white, centered]       │
│                                             │
│  PAWTECT                 11px/700 --t3 hairline
│                                             │
│  Help animals in need    17px/600 --t1      │
│  Donate coins to support wildlife           │
│  conservation.           14px/400 --t2 mt-2 │
│                                             │
│  ┌────────────────────────────────────┐    │
│  │  Your total:  [X] coins donated   │    │
│  │  bg: --elev, r-md, p-12, flex row │    │
│  │  Coins icon 16px --amber-t         │    │
│  │  "[X] coins donated" 13px/600 --t2│    │
│  └────────────────────────────────────┘    │
│                                             │
│  [pink accent btn: "Donate coins"]         │
│  h-44, full width, mt-16                   │
└─────────────────────────────────────────────┘
```

The mint gradient band (green-to-blue) evokes conservation and nature — it is
deliberately distinct from the hero (pink-to-blue) used in adoption moments. It is
a brand association: Pawtect = nature = mint.

The Heart icon (`Heart`, Lucide, 24px, white) in the band is the visual anchor. It is
the only icon in the product that represents caring-for-others rather than caring-for-
your-own-animals.

When `totalDonated === 0`, the total row reads: "Nothing donated yet — you could be first!"
(13px/400, var(--t3), italic). This is warmer than showing "0 coins".

The "Donate coins" button uses `variant="accent"` (pink). This is a reward-moment CTA
(Harry is doing something generous) — pink is appropriate here, not blue.

Hover state: standard DS hover pattern for cards —
`motion-safe:hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(0,0,0,.25)]
hover:border-[var(--border)] motion-safe:active:scale-[.97] transition-all duration-300`

---

## 3. Donation BottomSheet

Tapping "Donate coins" on the entry card opens a BottomSheet (slides up from bottom).

### Glass surface treatment

```
Background:   rgba(13,13,17,.88) + backdrop-filter: blur(24px)
Border:       1px solid rgba(255,255,255,.06) (top + sides)
Radius:       16px 16px 0 0
Max height:   85vh
```

Backdrop: `position: fixed, inset-0, background: rgba(0,0,0,.30)`

Must use `ReactDOM.createPortal(content, document.body)` — the Home screen contains
Framer Motion animated parents (DailyBonusCard, FeaturedPetCard use motion), which
would trap a fixed overlay inside their stacking context.

### Sheet layout

```
[Drag handle — 40×4px, rgba(255,255,255,.2), pill, centred, mt-8]

[Section heading "Help Pawtect"]     22px/600 --t1, mt-16, px-6
[Sub-heading "Donate coins to        14px/400 --t2, mt-4, px-6
 support wildlife conservation."]

[Pawtect icon strip — full width,    h-56, r-md, mx-6, mt-16
 grad-mint background, Heart icon    36px white centered, overflow hidden]

[YOUR BALANCE label]                 hairline (11px/700 uppercase tracking --t3), mt-20, px-6
[Balance row]                        flex row, gap-6, align-center, mt-6, px-6
  [Coins icon 16px --amber-t]
  "[X] coins available"              15px/600 --t1

[DONATION AMOUNT label]              hairline, mt-20, px-6

[Preset pills row — see section 4]   mt-8, px-6

[Or enter an amount label]           13px/400 --t3, mt-12, px-6

[Custom input]                       h-44, numeric keyboard, r-md, --card bg,
                                     1.5px solid --border-s, px-6, mt-6
  Placeholder: "Enter coins"
  Focus: 1.5px solid --blue, box-shadow 0 0 0 3px --blue-sub

[Insufficient funds warning]         shown when entered amount > wallet balance
  Background: --red-sub, r-md, p-10, mx-6, mt-8
  Icon: AlertTriangle 14px --red-t
  Text: "Not enough coins" 13px/400 --red-t

[pink btn: "Donate [amount] coins"]  h-48, mx-6, mt-20, mb-6
  Disabled when: no amount selected/entered, or amount > balance, or amount === 0
```

---

## 4. Donation preset pills

Four preset amounts appear in a scrollable horizontal row. These are the primary
input method — Harry is more likely to tap a preset than type a number.

Presets: **5, 10, 25, 50 coins**

Preset pill anatomy (active tint-pair pattern from DS):

**Inactive:**
```
Background:  var(--card)
Border:      1px solid var(--border-s)
Text:        var(--t2)
Font:        13px/600
Padding:     8px 16px
Radius:      100px (pill)
Height:      36px
```

**Active (selected):**
```
Background:  var(--blue-sub)
Border:      1px solid var(--blue)
Text:        var(--blue-t)
```

Active state uses blue tint-pair, not solid blue fill, per CLAUDE.md filter pill rule.

The coin icon (Coins, Lucide, 14px, inline-start, gap-4) appears on each pill:
inactive pills show `var(--t3)` icon; active pills show `var(--blue-t)` icon.

Pill row layout:
```
flex row, gap-8, overflow-x-auto scrollbar-hide, -mx-6 px-6
```

Only one preset can be active at a time. Tapping a preset also populates the custom
input field with that value (so the user sees the amount in both places). If the user
then types in the custom input, the preset selection clears.

Presets are greyed out (opacity .4, pointer-events none) if the amount exceeds the
player's current coin balance. This prevents Harry from selecting amounts he cannot
afford.

---

## 5. Post-donation feedback

### 5a. In-sheet success state

After Harry taps "Donate [X] coins" and the operation completes:

1. The BottomSheet does NOT close immediately.
2. The sheet content transitions to a success state (fade-replace, 200ms):

```
[Large Heart icon — 56px, animated pulse: scale 1→1.1→1, 600ms, 3 pulses]
[Gradient circle behind heart: --grad-mint, 80px circle, opacity .15]

"Thank you, Harry!"                  22px/600 --t1, mt-16, centred
"You donated [X] coins to           15px/400 --t2, mt-8, centred, px-24
 Pawtect. Every coin helps          (uses player name from personalisation hook)
 wildlife."

[Certificate strip — full width,     r-lg, mt-20, mx-6, p-16
 border 1px solid --green,           background: --green-sub]
  [Award icon 16px --green-t]
  "Pawtect Supporter"                13px/600 --green-t
  "Total donated: [lifetime total]   11px/400 --t3
  coins"

[green btn: "Close"]                 h-44, variant outline with green override:
                                     border --green, color --green-t, hover bg --green-sub
                                     mx-6, mt-20, mb-6, full width
```

The pulse animation on Heart: 3 cycles, then rests. Reduces to 0 cycles with
`prefers-reduced-motion`. This is a gentle celebration, not a full confetti burst —
appropriate for a charitable act, not a competitive win.

### 5b. Home screen entry card update

After the sheet closes, the total row on the Home entry card updates reactively
(useLiveQuery or equivalent) to show the new lifetime total. No reload needed.

### 5c. Toast

```
Type:    success
Title:   "Donated [X] coins to Pawtect"
Duration: 4000ms
```

The toast fires as the sheet transitions to its success state, so Harry sees the wallet
balance update and the toast at the same moment.

---

## 6. Overlay surface treatment

The DonationSheet is a standard BottomSheet. Glass rule applies as specified in
section 3. `createPortal` is mandatory (see section 3).

The post-donation certificate strip (section 5a) is an inline element within the sheet
content — it is NOT a separate overlay. It uses the green tint-pair surface
(`var(--green-sub)` background + `1px solid var(--green)` border), which is an elevated
surface within the sheet, not a glass floating element.

---

## 7. Interaction states

### Home entry card

| State | Treatment |
|-------|-----------|
| Default | var(--card) bg, var(--border-s) border, standard card anatomy |
| Hover | -translate-y-0.5, shadow var(--sh-card), border var(--border) |
| Active | scale(.97) |
| Focus | 2px solid var(--blue), outline-offset 2px |

Note: the entry card is a button element (tapping opens the donation sheet). The entire
card is the touch target, not just the "Donate coins" button.

Actually — reconsider: the entry card contains a "Donate coins" button. The card itself
should NOT be a button wrapper (this would nest interactive elements). The correct
pattern is: the card is a non-interactive container; only the "Donate coins" button
within it is interactive. The card gets the hover lift via CSS on the button's focus/
hover state through a parent selector, or the button is styled to fill the relevant
area. FE should confirm this pattern against existing DailyBonusCard implementation.

### "Donate coins" entry button (on Home card)

| State | Treatment |
|-------|-----------|
| Default | Accent (pink) variant, h-44, full width within card |
| Hover | --pink-h bg, glow-pink shadow |
| Active | scale(.97) |
| Focus | 2px solid var(--blue), outline-offset 2px |
| Disabled | Not applicable — always enabled |

### Preset pills

| State | Treatment |
|-------|-----------|
| Default (unselected) | var(--card) bg, var(--border-s) border, var(--t2) text |
| Hover (unselected) | border var(--border), bg rgba(255,255,255,.02) |
| Selected (active) | var(--blue-sub) bg, var(--blue) border, var(--blue-t) text |
| Affordability-disabled (amount > balance) | opacity .4, pointer-events none |
| Active (tap) | scale(.97), 100ms |
| Focus | 2px solid var(--blue), outline-offset 2px |

### Custom amount input

| State | Treatment |
|-------|-----------|
| Default | --card bg, 1.5px solid var(--border-s) |
| Focus | 1.5px solid var(--blue), box-shadow 0 0 0 3px var(--blue-sub) |
| Error (amount > balance) | 1.5px solid var(--red), box-shadow 0 0 0 3px var(--red-sub) |
| Valid | Returns to focus state colours |

### "Donate [X] coins" CTA button

| State | Treatment |
|-------|-----------|
| Disabled (no amount / unaffordable) | opacity .4, pointer-events none |
| Enabled | Accent (pink) variant, h-48 |
| Loading | Loader2 spin icon replaces text, pointer-events none |
| Success | Transitions to success sheet state (section 5a) |

### "Close" button (post-donation success state)

| State | Treatment |
|-------|-----------|
| Default | Outline with green override: border var(--green), color var(--green-t) |
| Hover | bg var(--green-sub), border var(--green) |
| Active | scale(.97) |
| Focus | 2px solid var(--blue), outline-offset 2px |

---

## 8. PageHeader slot assignment

The Pawtect entry card lives in the Home screen content flow — it is not a PageHeader
control. The Home screen's PageHeader is unchanged.

Navigation ownership: Pawtect does not introduce a bottom nav tab, a centre-slot tab
switcher, or any other navigation control. It is a card-in-content entry point only.

The DonationSheet is a BottomSheet — it has a drag handle and close affordance but no
navigation controls.

---

## 9. Screen inventory

| Surface | States |
|---------|--------|
| Home — Pawtect entry card | Default (shows total donated), first-time (zero total, warm prompt copy) |
| DonationSheet | Default (preset + input), amount selected (CTA enabled), amount too high (error state, CTA disabled), loading (CTA spinner), success (certificate state) |
| Post-donation success state | Shown after successful donation; shows certificate strip and updated total |
| Toast — donation confirmed | Success type, 4s |
| Insufficient funds warning | Inline in sheet, shown when input amount > balance |

---

## 10. Data model note (for Developer)

A new `pawtectDonations` table (or field on `playerProfile`) is needed to store:
- Individual donation records (amount, timestamp) — for transaction history if needed later
- Lifetime total donated — for the Home card counter and certificate

The `spend(amount)` hook call must be used for the coin deduction. It must be wrapped
in a `db.transaction('rw', ...)` alongside the donation record write, per CLAUDE.md
spend-before-write rule. If `spend()` succeeds but the donation record write fails,
Harry loses coins with no record of the donation. This is data corruption.

The lifetime total should be a derived value (sum of donation records) or a denormalised
counter. If denormalised, it must be updated inside the same transaction as the donation
record write.

---

## 11. Accessibility

- Pawtect entry card: the "Donate coins" button is the single interactive element in the
  card. It has a visible text label. No `aria-label` needed.
- DonationSheet: `role="dialog"`, `aria-modal="true"`, `aria-label="Donate to Pawtect"`.
  Focus trapped inside sheet while open. On close, focus returns to "Donate coins" button.
- Preset pills: each pill is a `<button>` with `aria-pressed="true/false"` reflecting
  selected state. Screen readers announce "10 coins, selected" or "10 coins".
- Custom input: `<input type="number">`, `aria-label="Enter donation amount in coins"`,
  `inputMode="numeric"` for mobile keyboard.
- Insufficient funds warning: `role="alert"` so screen readers announce it immediately
  when it appears.
- Post-donation success state: the certificate strip has `role="status"` to announce the
  updated total to screen readers without interrupting.
- Heart icon animation (pulse): respects `prefers-reduced-motion` — 0 cycles when reduced
  motion preferred.
- Coin values shown in pill labels and button text must be plain numbers (e.g. "10 coins"),
  not formatted with symbols that screen readers may misread.
- Colour is not the only indicator of state: preset pill active state changes border,
  background, AND text colour (triple signal). Disabled state uses opacity reduction
  (which affects all visual properties, not just colour).

---

## 12. Handoff notes for Frontend Engineer

1. Home screen: add the Pawtect entry card after `DailyBonusCard` in the content flow.
   Use `usePawtect()` hook (new) for `totalDonated`. Card is a non-interactive container;
   only the inner "Donate coins" `<Button>` is the interactive element.

2. `usePawtect()` hook: expose `totalDonated`, `donate(amount)`. `donate()` must use
   `db.transaction('rw', ...)` wrapping both `spend()` and the donation record insert.

3. `DonationSheet` component: BottomSheet, portal to body. Drag handle. Two-part
   content: default (preset + input + CTA) and success state. Use `useState` to track
   `donationState: 'idle' | 'loading' | 'success'`.

4. Preset pills: single-select. Tapping a preset sets `selectedPreset` state AND
   populates the `customAmount` input. Typing in custom input clears `selectedPreset`.
   Use the `CategoryPills`-style tint-pair pattern from ExploreScreen (blue-sub active).

5. Custom input: `type="number"`, `inputMode="numeric"`, `min="1"`. Show insufficient
   funds warning (red-sub banner, section 3) when value > coins balance.

6. "Donate" CTA label updates dynamically: "Donate coins" when no amount; "Donate 10
   coins" when 10 is selected. The amount shown is the currently active amount (preset
   or typed — whichever is most recent).

7. Success state transition: fade-replace (opacity 0 → 1, 200ms). Do NOT slide — sheet
   height changes between states and a slide would cause layout jump. Fade is safer.
   Respect `useReducedMotion` — skip animation if preferred.

8. Heart pulse animation: CSS keyframe `@keyframes heartbeat` scale 1→1.1→1, 600ms,
   3 iterations, `animation-fill-mode: forwards`. Set `animationPlayState: 'paused'`
   when `prefers-reduced-motion`.

9. Certificate strip: green tint-pair inline block (section 5a). Not a portal. Static
   element within sheet content.

10. Self-review gate: open DonationSheet at 375px. Confirm all content is visible and
    the CTA button is not hidden behind the keyboard or nav. `pb-6` at minimum on the
    last element inside the sheet. Check at 1024px that the sheet does not stretch
    uncomfortably wide — max-width 480px on the sheet container.
