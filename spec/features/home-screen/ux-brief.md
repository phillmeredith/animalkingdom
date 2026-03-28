# UX Designer Brief: Home Screen

## Context

Home is the emotional anchor of Animal Kingdom. Every session starts here. It should feel like arriving somewhere familiar and welcoming — Harry's animals are here, his progress is visible, and the next fun thing is one tap away. The experience goal: Harry feels recognised, successful, and excited to play within 3 seconds of opening the app.

---

## Screen inventory

- **HomeScreen** — states: loading, empty (no pets), populated (has pets), first-open (0 pets, no daily bonus ever claimed)
- **GreetingHeader** — states: morning / afternoon / evening (time-of-day greeting), with CoinDisplay
- **DailyBonusCard** — states: claimable, claimed (hidden/collapsed), claiming (brief animation)
- **StatCards row** — always visible; values update reactively
- **FeaturedPetCard** — states: has pets (shows most recent), no pets (shows adopt prompt)
- **QuickActions row** — always visible; 3 buttons: Explore, Play, Shop
- **StreakBadge** — states: streak > 0 (shows day count), streak = 0 (hidden)
- Loading state: skeleton shimmer on StatCards and FeaturedPetCard
- Empty state (no pets): FeaturedPetCard replaced by AdoptPromptCard — "No animals yet — go explore!"

---

## State transitions

```
App opens (Home mounts) -> DailyBonusCard checks claimDailyBonus()
  Trigger: useEffect on mount
  Visual change: if awarded = true → DailyBonusCard expands with coin burst, shows "+25 coins"
  Animation: slide-down 300ms ease-out, coin count ticks up
  Notification: success toast "Daily bonus! +25 coins 🎉" — fires from hook, shown by ToastProvider

DailyBonusCard [claimable] -> [claimed]
  Trigger: auto on mount (claimDailyBonus called automatically, not requiring tap)
  Visual change: card animates in for 2s then slides up and disappears
  Animation: enter slide-down 300ms, auto-exit slide-up 300ms after 2s delay
  Note: No tap required — daily bonus is automatic on mount, not a claim button

No pets [empty] -> has pets [populated]
  Trigger: pet adopted (navigation returns from Generate with new pet)
  Visual change: AdoptPromptCard fades out, FeaturedPetCard fades in with newest pet
  Animation: crossfade 300ms

StatCards — coins value
  Trigger: any wallet change (reactive via useLiveQuery)
  Visual change: coin number ticks up/down with count animation (300ms)
  Animation: number counter, ease-out
```

---

## Integration touchpoints

- After daily bonus claimed: toast fires via ToastProvider — no extra UI needed on Home
- After pet adopted (navigating back from Generate): FeaturedPetCard reactively updates via useSavedNames reactive query
- Tapping quick action "Explore" → navigate to /explore
- Tapping quick action "Play" → navigate to /play
- Tapping quick action "Shop" → navigate to /shop
- Tapping FeaturedPetCard → navigate to /animals (My Animals tab, scrolled to that pet)

---

## Screen layout (top to bottom)

```
[Safe area top]
[GreetingHeader]           — "Good morning, Harry!" left, CoinDisplay right
[DailyBonusCard]           — conditional, auto-dismisses
[StatCards row]            — 3 cards: Collection, Level, Streak
[FeaturedPetCard]          — large card: image + name + rarity + "View collection" button
[QuickActions row]         — 3 pill buttons: Explore, Play, Shop
[Bottom safe area / nav]
```

Page scrolls vertically. Header is NOT sticky. Total content fits iPad without scroll in populated state; scroll available if content grows.

---

## Design system reference

Design system: design-system/DESIGN_SYSTEM.md

Key patterns:
- **GreetingHeader**: uses PageHeader component. Title left-aligned (not centred). CoinDisplay in trailing slot.
- **DailyBonusCard**: Card component with pink border highlight (`--pink` ring-1), pink CTA colour.
- **StatCards**: StatCard component × 3. Grid 3-col, gap-4. Labels with Lucide icon above value.
- **FeaturedPetCard**: Card component, full-width. AnimalImage 160px tall object-cover top. RarityBorder wrapping. Body: name H4, rarity badge, "View collection" ghost button.
- **QuickActions**: 3 Button components in a row. Explore = primary (blue), Play = accent (pink), Shop = outline. All size="lg".
- **Spacing**: px-6 (24px) horizontal page padding. gap-4 (16px) between sections.
- **Typography**: Greeting = H3 (28px/600). Stat values = 28px/700. Stat labels = 11px/700 uppercase (hairline).

---

## Accessibility requirements

- Greeting text must be readable aloud via useSpeech on mount (opt-in via settings)
- All 3 stat cards need icon + label (never label-only at 11px)
- FeaturedPetCard image needs meaningful alt text: "[Name] the [breed]"
- DailyBonusCard animation respects prefers-reduced-motion — instant state if reduced
- QuickAction buttons all ≥ 44px height (using size="lg" = 48px)
- Streak badge: uses icon + number, never colour alone
- Touch targets: entire FeaturedPetCard tappable (not just button)

---

## Output expected

- HomeScreen component with all states
- GreetingHeader, DailyBonusCard, FeaturedPetCard, QuickActions, StatCards all implemented
- All transitions per spec
- Empty state (no pets) handled
- Loading state (skeleton) handled
