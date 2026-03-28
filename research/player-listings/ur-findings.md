# UR Findings: Player Listings

> Feature: Player Listings
> Author: UX Designer (covering UR role for this dispatch)
> Date: 2026-03-28
> Status: Phase A — ready to inform interaction spec

---

## Note on evidence basis

This findings note is informed by direct knowledge of the user (Harry, 11, ADHD and autism)
and by established research on children's emotional relationships with digital pets and
virtual collectibles. No formal usability sessions were conducted for this feature. Where
assumptions are made, they are flagged as such. Any finding marked [ASSUMPTION] should be
validated with Harry before Phase B is locked.

---

## Finding 1 — Harry's motivation to sell

Harry collects animals actively. His primary motivation is building out his collection, not
thinning it. Selling will not be an everyday action — it will be a considered decision,
typically motivated by one of three things:

- He has too many animals of the same breed or category and wants to "make space" (practical)
- He wants coins for a specific purchase and is willing to part with a less-favoured animal
  to get there (goal-directed)
- He receives an NPC offer that feels too good to refuse (externally prompted)

[ASSUMPTION] Harry attaches more strongly to named, high-rarity, and cared-for pets. Common
animals with low care streaks are the most likely sell candidates. The design should not
assume selling is emotionally neutral — it should acknowledge the decision without
over-dramatising it.

## Finding 2 — Seller's remorse risk

This is the most significant emotional risk in the feature. Harry may list a pet impulsively,
then regret it when he sees the "For Sale" badge on the card or when he tries to care for it
and finds actions locked. The regret may surface as frustration directed at the app
("it's broken") or as distress if he perceives the pet as "gone" before it has actually sold.

Design response (already reflected in spec):
- Two-step listing flow with explicit warning ("While listed, [Name] cannot be raced or
  cared for") before the final confirm
- Cancel listing is always available before a sale completes — and the delist flow is low-
  friction on purpose. The emotional cost of delisting must be zero.
- The "Listed for sale" state in PetDetailSheet should be clear and non-alarming. The pet
  is not gone. It is waiting. The UI should reflect this by showing the listing card and
  asking price rather than hiding the pet's information.
- [ASSUMPTION] Harry may not read the warning banner carefully. The two-step flow provides
  structural friction (a second screen, a second tap) rather than relying on copy alone.

## Finding 3 — NPC buyer pacing

[ASSUMPTION] Instant NPC responses would feel trivially easy and may reduce the sense that
the price Harry sets matters. Too long (24+ hours) and the "For Sale" state becomes
persistent background noise that Harry stops noticing.

Recommended pacing: NPC offers should arrive within a session-length window. A range of
30 minutes to 4 hours is appropriate for the first offer. This creates:
- A reason to check back (engagement loop)
- A realistic sense that "someone has to find your listing" (narrative plausibility)
- Not so long that Harry forgets he listed the pet

Multiple offers (if any) should be spaced at least 1 hour apart. Maximum 3 offers per
listing. If the listing expires with no accepted offer, that outcome should be communicated
clearly (not silently).

The "Someone's interested in [Name]!" notification toast is critical: it brings Harry back
into the flow at exactly the right moment, rather than requiring him to check proactively.
For ADHD users, ambient notification is more effective than manual polling.

## Finding 4 — Accessibility and neurodivergence considerations (MUST flag to spec)

Harry has ADHD and autism. The following design requirements are non-negotiable for this user:

### Status clarity
Harry must always be able to tell, at a glance, what state his pet is in. Ambiguous states
("is it listed? did it sell? is the offer still there?") will cause anxiety and repeated
tapping. Every state must have a visible, distinct indicator. The amber "For Sale" badge on
the pet card, and the listing card in the My Listings tab, are the primary mechanisms for
this. They must be visible, not subtle.

### Action locking must be explained, not just enforced
If Harry taps a care action on a listed pet and nothing happens, he will not understand why.
The spec must define what happens when a blocked action is triggered:
- Care actions (feed, clean, play): tapping shows an amber inline message "Can't care for
  [Name] while listed — remove the listing first." This message appears inline within the
  CarePanel, not as a toast. The pet is not visually greyed out in the grid (greyout is
  confusing for neurodivergent users — it implies the pet is gone or broken).
- Release: tapping the Release button shows a modal (not a toast) explaining: "[Name] has
  an active listing. Remove the listing before releasing."

### Two-step confirm is protective friction
The two-step listing flow (price step + confirm step) is specifically valuable for ADHD
users who act impulsively. The mandatory "back" path from the confirm step must be
clearly labelled ("Back") and must not feel like an error state.

### Sold celebration must not be alarming
The SoldCelebrationOverlay should feel rewarding, not distressing. Losing a pet from the
collection is a significant event. The overlay must lead with the coins earned (the reward)
before mentioning that the pet is gone. The copy "found a new home" is intentionally
gentle — do not change it to "sold" or "traded".

### Reduced motion
All celebration and entry animations must respect `prefers-reduced-motion`. Harry may have
this setting enabled. Do not assume motion is preferred.

---

## Implications for interaction spec

1. Blocked care actions: spec must define CarePanel behaviour when `pet.status === 'for_sale'`
   — inline amber message, no greyed-out state
2. Blocked release: spec must define Release button behaviour when `pet.status === 'for_sale'`
   — modal with explanation, not silent fail or toast
3. NPC pacing: recommend 30-minute to 4-hour window for first offer; spec this as a
   design-time decision that the Developer hooks into (not left to random)
4. Sold celebration: coins first, pet-leaving second — copy order matters
5. All states must have distinct visual indicators — no ambiguous intermediate states
