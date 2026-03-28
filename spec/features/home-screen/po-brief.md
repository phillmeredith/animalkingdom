# Product Owner Brief: Home Screen

## Context

The Home screen is the daily anchor of Animal Kingdom. It delivers the daily bonus, surfaces the player's most recent pet, shows progress at a glance, and provides fast navigation to the three main activities. It must work correctly on first open (no pets, no bonus history) and on every subsequent open.

---

## User stories

### Story 1: Daily bonus

As Harry,
I want to receive my daily coins automatically when I open the app,
So that I feel rewarded for returning and have coins to spend.

Acceptance criteria:
- [ ] On first mount each day, `claimDailyBonus()` is called automatically
- [ ] If awarded, coin balance increases by 25 and the change is visible immediately
- [ ] A success toast appears: "Daily bonus! +25 coins"
- [ ] The DailyBonusCard is visible briefly then disappears within 2–3 seconds
- [ ] If already claimed today, DailyBonusCard is not shown and no toast fires
- [ ] Streak counter increments correctly and is visible in the StatCards

---

### Story 2: At-a-glance progress

As Harry,
I want to see how many animals I have, my level, and my streak,
So that I feel a sense of progress and am motivated to keep playing.

Acceptance criteria:
- [ ] Collection stat card shows correct count of adopted pets
- [ ] Level stat card shows correct gamerLevel from useProgress
- [ ] Streak stat card shows current dailyLoginStreak from playerWallet
- [ ] All three cards have an icon and a label alongside the value
- [ ] Values update reactively — no refresh needed after earning or adopting

---

### Story 3: Featured pet

As Harry,
I want to see my most recent animal on the home screen,
So that I feel connected to my collection and want to care for it.

Acceptance criteria:
- [ ] FeaturedPetCard shows the most recently adopted pet (highest id in savedNames)
- [ ] Card shows: animal image, name, rarity badge, breed
- [ ] Tapping the card navigates to /animals
- [ ] If no pets exist, an adopt prompt card is shown instead: "No animals yet — go explore!"
- [ ] Tapping the adopt prompt navigates to /explore

---

### Story 4: Quick navigation

As Harry,
I want clear buttons to start exploring, playing, or shopping,
So that I can get to the fun in one tap without hunting through menus.

Acceptance criteria:
- [ ] Three quick action buttons present: Explore (blue/primary), Play (pink/accent), Shop (outline)
- [ ] Each button navigates to the correct route: /explore, /play, /shop
- [ ] All buttons are ≥ 44px tall
- [ ] Buttons are labelled with text (not icon-only)

---

## Scope boundary

**In scope:**
- Greeting header with time-of-day text and coin display
- Auto daily bonus claim on mount
- Three stat cards (collection, level, streak)
- Featured pet card (most recent pet or adopt prompt)
- Three quick action navigation buttons
- Loading skeleton state
- Empty state (no pets)

**Out of scope (this iteration):**
- Activity feed (Tier 4 feature)
- Daily quest widget (requires game logic to generate — deferred to Tier 2)
- Care reminder nudge (requires careLog — deferred to Tier 2 care system)
- Notifications or push alerts
- Horizontal carousel of pets
- Personalised recommendations

---

## Definition of done

This feature is complete when:
- [ ] All user stories pass their acceptance criteria
- [ ] Daily bonus auto-claim fires correctly on first mount each day and is a no-op on subsequent mounts
- [ ] All three stat values are reactive (update without page refresh)
- [ ] FeaturedPetCard shows correct most-recent pet
- [ ] Empty state renders correctly with adopt prompt
- [ ] Loading state renders with skeleton (not blank screen)
- [ ] All animations respect prefers-reduced-motion
- [ ] All touch targets ≥ 44px
- [ ] Tester sign-off received
- [ ] Feature status updated to `complete` in BACKLOG.md
