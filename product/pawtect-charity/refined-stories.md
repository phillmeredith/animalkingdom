# Refined Stories: Pawtect Charity Donation System

> Output from the Product Owner agent.
> Produced during Phase B after UR findings and interaction spec are complete.
> Phase B decisions confirmed by [OWNER] 2026-03-29.
> This is the acceptance criteria the Tester validates against.

---

## Feature goal

Give Harry a positive, voluntary way to spend coins on a conservation cause he can feel
proud of — one that frames donating as generosity and shows him a visible result, not
as losing coins to an abstraction.

---

## Owner's Phase B decisions (binding)

- Proceed on assumption (no blocking UR validation required before Phase C)
- All other details follow the interaction spec

---

## Known risk — UR validation deferred

The UR findings for this feature explicitly flag two unvalidated assumptions that the
owner has accepted as a risk to proceed:

1. **Harry's coin/charity mental model has not been tested.** Whether Harry understands
   and accepts that donating coins (with no item in return) feels generous rather than
   punitive is unknown. The interaction spec addresses this through framing ("earned it"
   language, certificate moment, warm copy), but the framing has not been validated with
   Harry directly.

2. **Donation amounts relative to session earnings are uncalibrated.** The preset amounts
   (5, 10, 25, 50 coins) have not been verified against Harry's typical session earnings.
   If 50 coins represents a large fraction of a session's earnings, it will not feel
   optional. The Developer and PO must sanity-check preset amounts against wallet data
   before Phase C closes.

These are known, accepted risks. If post-launch observation shows Harry does not use
the feature or expresses confusion, the first iteration should: (a) add a named animal
rescue outcome per the UR recommendation ("your 50 coins helped rescue Mira the snow
leopard") and (b) recalibrate preset amounts. Both are out of scope for this iteration.

---

## Scope (confirmed)

**In scope:**
- Pawtect entry card on the Home screen (permanent card, below DailyBonusCard)
- `DonationSheet`: BottomSheet with preset pills, custom input, and donate CTA
- Post-donation success state inside the sheet (certificate strip, heart pulse, updated total)
- `usePawtect()` hook: `totalDonated`, `donate(amount)`
- `pawtectDonations` table (or equivalent) in the DB for donation records and lifetime total
- Success toast: "[X] coins donated to Pawtect"
- Reactive total on Home entry card (updates after sheet closes)

**Out of scope (this iteration):**
- Named animal rescue outcome per UR recommendation (deferred — would require integration
  with animal-economy-tiers and pawtect animal pool design; prioritised for follow-on if
  engagement data supports it)
- Conservation record / Pawtect Hall — browsable history of all donations (UR flagged this
  as high-value; deferred for scope; the lifetime total counter on the Home card is the
  minimal viable version)
- Real-world charity integration (confirmed out of scope permanently for this product)
- In-app purchase or real money (confirmed out of scope permanently)
- Social or leaderboard features
- Pawtect narrative introduction (UR flagged cold-introduction risk; mitigated by warm
  copy on the entry card and sheet — a dedicated narrative intro is deferred)

---

## Dependencies

Before Phase C starts, the following must be in place:
- `useWallet` hook with `coins`, `spend()`, and `canAfford()` available (confirmed)
- `HomeScreen` component accessible for card insertion
- `animal-economy-tiers` feature does not block this feature, but donation rewards
  must be framed as conservation-only (non-tradeable) — this is narrative framing only
  at this iteration, not a system dependency
- Developer sanity-checks preset coin amounts (5, 10, 25, 50) against `useWallet`
  telemetry or typical game session data before finalising the component

---

## Refined user stories

### Story 1: Pawtect entry card on the Home screen

As Harry,
I want to see the Pawtect charity card every time I visit the Home screen and know how
much I have donated in total,
So that Pawtect feels like a permanent, trusted part of the game rather than a one-off
pop-up.

**Acceptance criteria:**
- [ ] A Pawtect entry card renders on the Home screen, positioned below `DailyBonusCard`
  in the content feed, and is present on every visit (it does not disappear after the
  first donation).
- [ ] The card is a non-interactive container. The single interactive element inside the
  card is the "Donate coins" button. The card itself is not a button wrapper (no nested
  interactive elements).
- [ ] Card anatomy renders correctly: top mint gradient band (full width, h-48, `linear-
  gradient(135deg, #45B26B, #3772FF)`, `r-lg` top corners, `overflow: hidden`) with a
  `Heart` Lucide icon (24px, white, centred). Below the band: "PAWTECT" label (11px/700,
  `var(--t3)`, uppercase, tracking), heading "Help animals in need" (17px/600, `var(--t1)`),
  sub-text "Donate coins to support wildlife conservation." (14px/400, `var(--t2)`, mt-8).
- [ ] When `totalDonated > 0`: a total row renders inside an elevated strip (background
  `var(--elev)`, `var(--r-md)`, padding 12px, flex row) showing a `Coins` Lucide icon
  (16px, `var(--amber-t)`) and the text "[X] coins donated" (13px/600, `var(--t2)`).
- [ ] When `totalDonated === 0`: the total row renders the text "Nothing donated yet — you
  could be first!" (13px/400, `var(--t3)`, italic).
- [ ] A "Donate coins" button renders at the bottom of the card: `variant="accent"` (pink),
  h-44, full width within the card padding.
- [ ] The total row updates reactively after a successful donation (via `useLiveQuery` or
  equivalent) — no page reload required.
- [ ] Card background: `var(--card)`, border `1px solid var(--border-s)`, radius
  `var(--r-lg)`, padding 20px.
- [ ] At 375px and 1024px the card renders without overflow, clipping, or layout breakage.

**Notes from UX / UR:**
- UR Risk 3 (Pawtect has no established meaning before the donation prompt) is partially
  mitigated by the warm entry card copy. A dedicated narrative introduction is deferred.
  The entry card must do the job of establishing Pawtect's purpose through its copy alone
  in this iteration.

---

### Story 2: Donation BottomSheet — amount selection and validation

As Harry,
I want to choose how many coins to donate — either by tapping a preset amount or typing
a number — and see a clear error if I try to donate more than I have,
So that I always donate the right amount and never accidentally overdraw my wallet.

**Acceptance criteria:**
- [ ] Tapping "Donate coins" on the Home card opens the `DonationSheet` BottomSheet,
  portalled to `document.body` via `ReactDOM.createPortal`.
- [ ] The sheet uses the glass surface: `rgba(13,13,17,.88)` background, `backdrop-filter:
  blur(24px)`, `1px solid rgba(255,255,255,.06)` border (top + sides), 16px 16px 0 0
  radius, max-height 85vh.
- [ ] The backdrop is fixed inset-0, `rgba(0,0,0,.30)`.
- [ ] The sheet has `role="dialog"`, `aria-modal="true"`, `aria-label="Donate to Pawtect"`.
  Focus is trapped inside the sheet while open. On close, focus returns to the "Donate
  coins" button on the Home card.
- [ ] Four preset pills render in a horizontal scrollable row: amounts 5, 10, 25, 50 coins.
- [ ] Each preset pill has `aria-pressed="true/false"` reflecting selected state.
- [ ] Inactive pill: background `var(--card)`, border `1px solid var(--border-s)`, text
  `var(--t2)`, `Coins` Lucide icon 14px `var(--t3)`, font 13px/600, padding 8px 16px,
  pill radius, h-36.
- [ ] Active (selected) pill: background `var(--blue-sub)`, border `1px solid var(--blue)`,
  text `var(--blue-t)`, icon `var(--blue-t)`.
- [ ] Only one preset can be active at a time. Selecting a preset populates the custom
  amount input with that value.
- [ ] Typing in the custom amount input clears the preset selection.
- [ ] A preset pill whose amount exceeds the player's current coin balance renders at
  opacity .4 with `pointer-events: none`. It cannot be selected.
- [ ] The custom input: `type="number"`, `inputMode="numeric"`, `min="1"`,
  `aria-label="Enter donation amount in coins"`. Focus state: `1.5px solid var(--blue)`,
  `box-shadow: 0 0 0 3px var(--blue-sub)`. Error state (amount > balance): `1.5px solid
  var(--red)`, `box-shadow: 0 0 0 3px var(--red-sub)`.
- [ ] When the entered or selected amount exceeds the player's coin balance, an
  insufficient-funds warning renders: background `var(--red-sub)`, `var(--r-md)`, padding
  10px, `AlertTriangle` Lucide icon (14px, `var(--red-t)`), text "Not enough coins"
  (13px/400, `var(--red-t)`). The warning has `role="alert"`.
- [ ] TRANS-6: the "Donate [X] coins" CTA button is disabled (opacity .4, `pointer-events:
  none`) when: no amount is selected or entered, OR the entered amount is 0 or negative,
  OR the entered amount exceeds the player's coin balance.
- [ ] TRANS-5: the CTA is only enabled when a valid, affordable amount is present.
- [ ] The CTA label updates dynamically: "Donate coins" when no amount is selected;
  "Donate [X] coins" when X is the current amount.
- [ ] The player's current coin balance is shown in the sheet: `Coins` icon (16px,
  `var(--amber-t)`) and "[X] coins available" (15px/600, `var(--t1)`).
- [ ] At 375px, the full sheet is scrollable and the "Donate" CTA is visible without being
  hidden behind the keyboard or the bottom nav.
- [ ] At 1024px, the sheet does not stretch uncomfortably wide — max-width 480px on the
  sheet content container.

**Notes from UX / UR:**
- UR finding: small, affordable donations feel voluntary; large amounts feel obligatory.
  Preset amounts must be verified against session earnings before Phase C closes (see
  Dependencies above).
- The active pill uses blue tint-pair (same as CategoryPills in ExploreScreen), not solid
  blue fill. This is a categorical filter interaction, not a primary CTA.

---

### Story 3: Successful donation — transaction integrity and feedback

As Harry,
I want my coins to be deducted correctly when I confirm a donation and to see an
immediate, warm confirmation that my donation made a difference,
So that donating feels like a positive act with a visible outcome, not like losing coins.

**Acceptance criteria:**
- [ ] TRANS-7: tapping "Donate [X] coins" while a donation is in-flight produces no
  additional `spend()` calls. The button enters loading state (`Loader2` spinner replaces
  text, `pointer-events: none`) on first tap.
- [ ] The `donate(amount)` call wraps `spend(amount)` and the donation record DB write in a
  single `db.transaction('rw', ...)`. A `spend()` call outside a transaction boundary is
  a build defect — if the DB write fails, coins must not have been deducted.
- [ ] TRANS-1: after a successful donation, `useWallet().coins` equals the pre-donation
  balance minus the exact donation amount. Record balance before donating and verify after.
- [ ] On success: the sheet transitions to its success state (fade-replace, opacity 0 to 1,
  200ms). With `prefers-reduced-motion`, the transition is instant.
- [ ] ANIM-1: the success state contains exactly: a `Heart` Lucide icon (56px) with a CSS
  pulse animation (scale 1 to 1.1 to 1, 600ms, 3 iterations, forwards), a mint gradient
  circle behind the heart (80px, `linear-gradient(135deg, #45B26B, #3772FF)`, opacity .15),
  heading "Thank you, Harry!" (22px/600, `var(--t1)`, centred), body copy "You donated [X]
  coins to Pawtect. Every coin helps wildlife." (15px/400, `var(--t2)`, centred), a
  certificate strip (background `var(--green-sub)`, border `1px solid var(--green)`,
  `var(--r-lg)`, padding 16px, flex row with `Award` icon 16px `var(--green-t)`,
  "Pawtect Supporter" 13px/600 `var(--green-t)`, "Total donated: [lifetime total] coins"
  11px/400 `var(--t3)`), and a "Close" button.
- [ ] ANIM-2: per `pawtect-charity/interaction-spec.md` section 5a.
- [ ] ANIM-3: the `Heart` pulse animation runs 0 cycles when `prefers-reduced-motion:
  reduce` is set. The success state still renders; only the animation is removed.
- [ ] ANIM-4: the success state is fully visible and the "Close" button is tappable within
  400ms of the donation confirming.
- [ ] ANIM-5: the "Close" button is visible and tappable at 375px and 1024px. It is not
  obscured by the heart animation or any overlay layer.
- [ ] The body copy in the success state uses the actual donation amount (e.g. "You donated
  25 coins to Pawtect."). Vague copy is not acceptable.
- [ ] The certificate strip shows the updated lifetime total (post-donation), not the
  pre-donation total.
- [ ] The certificate strip has `role="status"` so screen readers announce the updated total.
- [ ] A success toast fires as the sheet transitions to success state: type `success`,
  title "Donated [X] coins to Pawtect" (exact amount as numeral), duration 4000ms.
- [ ] The "Close" button: `variant="outline"` with green override (`border: var(--green)`,
  `color: var(--green-t)`, hover `bg: var(--green-sub)`), h-44, full width, mx-6, mb-6.
- [ ] After "Close" tapped, the sheet closes and the Home entry card total row updates
  reactively to the new lifetime total.

**Notes from UX / UR:**
- UR Risk 1 (donation feels punitive if framed as spending) is the primary design risk.
  The success state — especially the certificate strip and warm copy — is the primary
  mitigation. If the success state is not warm and visible, the feature fails its goal.
- ANIM-4 and ANIM-5 are mandatory: Harry must never be blocked from closing the sheet.

---

### Story 4: Failed donation — error handling and state recovery

As Harry,
I want to see a clear error message if a donation fails, and for my coins to be
unchanged,
So that a technical failure never leaves me worse off than before I tried to donate.

**Acceptance criteria:**
- [ ] TRANS-2: if the `donate(amount)` call fails or throws, `useWallet().coins` is
  identical to its pre-donation value. The transaction boundary ensures this — coins
  must not have been deducted if the donation record write fails.
- [ ] TRANS-3: when a donation fails, the sheet remains open in its default (amount
  selection) state, not in the success state. Harry can retry.
- [ ] TRANS-4: on error, a toast fires with type `error`, title "Could not donate — please
  try again.", duration 4000ms.
- [ ] The "Donate" CTA button returns from loading state to its enabled default state after
  a failed donation. Harry can attempt to donate again without reopening the sheet.
- [ ] No second `spend()` call is made if the donate button is tapped during the error
  recovery phase (standard disabled pattern while loading applies).

---

## Definition of Done (confirmed)

This feature is complete when:
- [ ] All four stories above pass all acceptance criteria
- [ ] TRANS-1 verified: coin balance decreases by exact donation amount on success
- [ ] TRANS-2 verified: coin balance unchanged on error; transaction boundary confirmed
- [ ] TRANS-3 verified: sheet stays open and actionable on error
- [ ] TRANS-4 verified: error toast copy confirmed
- [ ] TRANS-7 verified: no double submission
- [ ] Transaction boundary confirmed in code review: `spend()` and donation record
  insert are inside same `db.transaction('rw', ...)`
- [ ] `DonationSheet` confirmed to use `ReactDOM.createPortal(content, document.body)`
- [ ] ANIM-1 through ANIM-5 verified for the success state animation
- [ ] Preset pill amounts verified as affordable within a typical session (sanity check
  by Developer before Phase C closes)
- [ ] UR validation deferred risk noted in test-results.md (not a blocker for sign-off,
  but must be logged)
- [ ] Tester has verified all ten DS checklist points in test-results.md
- [ ] Tester sign-off received
- [ ] No disconnected functionality

---

## Sign-off

Refined stories complete. Phase C may begin after [OWNER] approval.
