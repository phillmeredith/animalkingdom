# Tester Brief: Home Screen

## Context

HomeScreen has one write operation (claimDailyBonus) and three reactive reads. The highest risk is the daily bonus idempotency — it must fire exactly once per day and be a no-op on all subsequent mounts. Secondary risk is the reactive display of pet/coin data: stale values would break trust immediately for a child user. Visual risk: broken states (blank screen, spinner forever) are unacceptable.

---

## Test scenarios

### Scenario: First open — daily bonus awarded

```
Given: App opened for the first time today (lastDailyBonusDate !== today or null)
       Player has 500 coins (initial balance)
When:  HomeScreen mounts
Then:
  - claimDailyBonus() is called once
  - coins increases from 500 to 525
  - DailyBonusCard appears with "+25 coins · Day 1"
  - Success toast appears: "Daily bonus! +25 coins"
  - DailyBonusCard disappears after ~2.5s
  - Streak StatCard shows "Day 1"
  - transaction record created: { type: "earn", amount: 25, category: "daily" }

Pass criteria: All five observable effects occur in order within 3s of mount
```

---

### Scenario: Same-day re-open — no duplicate bonus

```
Given: Daily bonus already claimed today (lastDailyBonusDate === today)
       Player has 525 coins
When:  HomeScreen mounts (app re-opened or tab switched back to Home)
Then:
  - claimDailyBonus() returns { awarded: false }
  - No coin change (still 525)
  - No toast fires
  - DailyBonusCard is NOT shown
  - Streak remains unchanged

Pass criteria: Zero visible change to coins, zero toast, zero card
```

---

### Scenario: Populated home — pet shown

```
Given: Player has 3 adopted pets, most recent is "Biscuit the Labrador" (id=3)
When:  HomeScreen renders
Then:
  - FeaturedPetCard shows "Biscuit" with correct name, breed, rarity badge
  - AnimalImage renders (or paw-print fallback if imageUrl missing)
  - Collection stat card shows "3"
  - Tapping FeaturedPetCard navigates to /animals

Pass criteria: Correct pet shown, navigation works
```

---

### Scenario: Empty collection — adopt prompt shown

```
Given: Player has 0 adopted pets
When:  HomeScreen renders
Then:
  - FeaturedPetCard is NOT shown
  - AdoptPromptCard is shown with "No animals yet" and "Go Explore" button
  - Tapping "Go Explore" navigates to /explore
  - Collection stat card shows "0"

Pass criteria: No crash, no blank space, adopt prompt visible and tappable
```

---

### Scenario: Quick actions navigate correctly

```
Given: HomeScreen is rendered
When:  User taps "Explore" button
Then:  URL changes to /explore, Explore tab activates in BottomNav
When:  User taps "Play" button
Then:  URL changes to /play, Play tab activates in BottomNav
When:  User taps "Shop" button
Then:  URL changes to /shop, Shop tab activates in BottomNav

Pass criteria: Each button navigates to correct route, no stale state
```

---

### Scenario: Reactive coin update

```
Given: HomeScreen is open, coins = 525
When:  Coins change (simulated by calling earn() from another hook)
Then:  CoinDisplay in header updates immediately (within one render cycle)
       No page refresh required

Pass criteria: Coin value updates reactively, within < 300ms
```

---

## Integration test scenarios

### Scenario: Daily bonus → coin reactive update

```
Given: HomeScreen mounted fresh, coins = 500, no bonus claimed today
When:  Home mounts
Then (in order):
  1. claimDailyBonus() fires
  2. playerWallet.coins updated to 525 in IndexedDB
  3. useLiveQuery fires, coins reactive value updates
  4. CoinDisplay re-renders showing 525
  5. DailyBonusCard appears
  6. Toast appears
  7. DailyBonusCard disappears after 2.5s

Verify on reload: coins remain 525, no second bonus awarded
```

---

### Scenario: Pet adopted → FeaturedPetCard updates without refresh

```
Given: HomeScreen open with 0 pets (AdoptPromptCard visible)
When:  User navigates to /explore, adopts a pet, returns to /
Then:
  - FeaturedPetCard renders with the new pet
  - AdoptPromptCard is gone
  - Collection stat shows "1"

Verify on reload: pet still shown, count still 1
```

---

## Edge cases

- **Streak = 0**: Streak StatCard shows "Day 0" — not hidden, not crash
- **gamerLevel = 0**: Level StatCard shows "Lv 0" — valid state for new player
- **imageUrl is empty string**: AnimalImage shows paw-print fallback without error
- **claimDailyBonus() called twice simultaneously**: Second call is a no-op (idempotent check in hook)
- **Rapid tab switching back to Home**: useEffect fires once (dependency array is empty []); no duplicate claims
- **App backgrounded during DailyBonusCard animation**: Animation completes or is cleaned up via useEffect cleanup
- **petCount = 1000+**: StatCard renders large number without overflow (check CSS)

---

## State transition coverage

| Transition | Trigger tested | Side effects verified |
|------------|---------------|----------------------|
| No bonus → bonus claimed | Home mount, fresh day | coins+25, streak++, toast, card shown |
| Bonus claimable → no-op | Home mount, same day | zero changes |
| 0 pets → 1 pet | Adopt pet, return to Home | FeaturedPetCard appears |
| coins change | earn() called | CoinDisplay updates reactively |

---

## Accessibility tests

- [ ] All touch targets ≥ 44px (StatCards are display-only — not interactive, no minimum needed)
- [ ] QuickAction buttons ≥ 44px (size="lg" = 48px ✓)
- [ ] FeaturedPetCard tap area covers full card (≥ 44px height ✓)
- [ ] AnimalImage has descriptive alt text: "[Name] the [breed]"
- [ ] Rarity badge has text label (not colour-only)
- [ ] prefers-reduced-motion: DailyBonusCard appears/disappears instantly, no y movement
- [ ] CoinDisplay has aria-label="[n] coins"

---

## Output expected

- All scenarios run and results recorded
- Any defects logged with severity: blocker | major | minor
- Accessibility audit passed
- Sign-off on: daily bonus idempotency, reactive updates, navigation, empty state
