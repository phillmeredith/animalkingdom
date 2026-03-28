# Frontend Engineer Brief: Home Screen

## Context

HomeScreen should feel warm and immediate — like walking into a familiar room where your things are waiting. The daily bonus moment is the only animation flourish; everything else is clean and calm. Harry needs to understand his status at a glance and feel one confident tap away from the next activity. No clutter, no decision paralysis.

---

## Component breakdown

### HomeScreen

```
Route: /
File: src/screens/HomeScreen.tsx

Layout: vertical scroll, px-6 (24px), pt-6, pb-32 (space above nav)
Sections in order:
  1. GreetingHeader (PageHeader component)
  2. DailyBonusCard (conditional — shows on mount if awarded, auto-dismisses)
  3. HomeStatCards
  4. FeaturedPetCard or AdoptPromptCard
  5. QuickActions

States:
  loading: show skeleton for StatCards and FeaturedPetCard
  populated: all sections visible
  empty: AdoptPromptCard instead of FeaturedPetCard
```

---

### GreetingHeader

```
File: uses existing PageHeader component
Props: none (reads time internally)

Visual:
  Left slot: "Good morning, Harry!" (H3, 28px/600, --t1)
              Greeting changes by time:
                05:00–11:59 → "Good morning"
                12:00–17:59 → "Good afternoon"
                18:00–04:59 → "Good evening"
  Right slot: <CoinDisplay /> (existing component)

No animation. Renders immediately.
```

---

### DailyBonusCard

```
File: src/components/home/DailyBonusCard.tsx
Props:
  amount: number — coins awarded (e.g. 25)
  streak: number — new streak value
  onDismiss: () => void

States:
  visible: full card, slide-down from top
  dismissing: slide-up exit

Visual:
  Card component with ring-1 ring-[var(--pink)] border highlight
  Left: Coins icon (Lucide, amber, 32px) in elev circle
  Right:
    Title: "Daily bonus!" (Body/15px/600, --t1)
    Subtitle: "+25 coins · Day [streak]" (Body-Sm/13px, --amber-t)
  Full card auto-dismisses — no close button needed

Animation:
  Enter: y from -20 to 0, opacity 0→1, duration 300ms, ease-out
  Hold: 2000ms
  Exit: y from 0 to -20, opacity 1→0, duration 300ms, ease-in
  Reduced motion: instant appear, instant disappear after 2000ms delay
```

---

### HomeStatCards

```
File: src/components/home/HomeStatCards.tsx
Props:
  petCount: number
  gamerLevel: number
  streak: number

Visual:
  3-column grid, gap-4 (16px)
  Each uses StatCard component:
    Card 1: label="Collection", value=petCount, icon=<Heart /> (Lucide, pink)
    Card 2: label="Level", value={`Lv ${gamerLevel}`}, icon=<Star /> (Lucide, blue)
    Card 3: label="Streak", value={`Day ${streak}`}, icon=<Flame /> (Lucide, amber)
  Label style: 11px/700/uppercase (hairline) + icon inline before label text
  Value style: 28px/700, --t1

States:
  loading: render 3 skeleton cards (grey shimmer rectangle, same dimensions)
  populated: values shown
  streak = 0: Streak card shows "Day 0" — still visible, not hidden

Animation:
  Value changes: no number ticker animation (keep it simple, no jank risk)
```

---

### FeaturedPetCard

```
File: src/components/home/FeaturedPetCard.tsx
Props:
  pet: SavedName

Visual:
  RarityBorder wrapper (rarity from pet.rarity)
  Card component, full-width, no horizontal margin
  Top: AnimalImage src={pet.imageUrl} alt="{pet.name} the {pet.breed}"
       className="w-full h-[160px] object-cover rounded-t-lg"
  Body (p-5):
    Row: pet.name (H4/22px/600, --t1) + RarityBadge
    Subtitle: pet.breed · pet.category (Body-Sm/13px, --t3)
    Button: "View my animals" (ghost variant, sm, full-width, mt-3) → navigates /animals

Tap behaviour:
  Entire card tappable → /animals (not just the button)
  Button tap is redundant but also navigates /animals

Animation: none (static card)
```

---

### AdoptPromptCard (empty state)

```
File: inline in FeaturedPetCard.tsx as conditional render, or EmptyState component

Visual:
  EmptyState component:
    icon: <PawPrint /> (Lucide, 32px, --t3)
    title: "No animals yet"
    description: "Head to Explore to find your first animal"
    cta: { label: "Go Explore", onClick: () => navigate('/explore'), variant: 'primary' }
  Wrapped in Card component
```

---

### QuickActions

```
File: src/components/home/QuickActions.tsx
Props: none (uses useNavigate internally)

Visual:
  Row of 3 buttons, gap-3 (12px), each flex-1
  Button 1: variant="primary" size="lg" → "Explore" → navigate('/explore')
  Button 2: variant="accent"  size="lg" → "Play"    → navigate('/play')
  Button 3: variant="outline" size="lg" → "Shop"    → navigate('/shop')

All buttons use full width of their flex cell (w-full)
Each button ≥ 44px (size="lg" = 48px ✓)

Animation: none beyond Button component's built-in hover/press states
```

---

## Design system tokens

| Token | Value | Applied to |
|-------|-------|------------|
| `--bg` | `#0D0D11` | Page background |
| `--card` | `#18181D` | StatCards, FeaturedPetCard, DailyBonusCard |
| `--elev` | `#23262F` | Icon circles inside cards |
| `--border-s` | `#2C2F3A` | Card borders |
| `--pink` | `#E8247C` | DailyBonusCard ring, Play button, Heart icon |
| `--blue` | `#3772FF` | Explore button, Star icon |
| `--amber-t` | `#FCC76E` | DailyBonusCard subtitle text |
| `--amber` | `#F5A623` | Flame icon, CoinDisplay |
| `--t1` | `#FCFCFD` | Greeting, stat values, pet name |
| `--t3` | `#777E91` | Stat labels, pet subtitle |
| `px-6` | `24px` | Page horizontal padding |
| `gap-4` | `16px` | StatCards grid gap |
| `gap-3` | `12px` | QuickActions button gap |
| `pb-32` | `128px` | Bottom padding above nav |

---

## Animation requirements

| Animation | Trigger | Duration | Easing | Notes |
|-----------|---------|----------|--------|-------|
| DailyBonusCard enter | Component mounts | 300ms | ease-out | y: -20→0, opacity 0→1 |
| DailyBonusCard exit | 2000ms after enter | 300ms | ease-in | y: 0→-20, opacity 1→0 |

**Reduced motion:** DailyBonusCard appears/disappears instantly (no y movement, no opacity transition). All other elements have no animation.

---

## Gesture requirements

- Tapping anywhere on FeaturedPetCard navigates to /animals
- No swipe gestures on Home screen
- No long press interactions
- Double-tap prevention: not needed on navigation buttons (navigation is idempotent)

---

## Performance targets

- Target: 60fps on iPad Air (M1)
- HomeScreen initial render: < 100ms (no heavy computation, all reactive queries)
- DailyBonusCard animation: GPU-composited (use `transform` not `top/margin`)
- No virtualisation needed (< 10 elements on screen)
- AnimalImage loads lazily — paw-print fallback shown immediately

---

## States that must be handled

- [x] Loading state — skeleton cards while hooks initialise
- [x] Empty state — no pets → AdoptPromptCard
- [x] Error state — AnimalImage fallback handles image errors
- [x] Daily bonus claimable — DailyBonusCard shown
- [x] Daily bonus already claimed — DailyBonusCard not shown
- [x] streak = 0 — Streak stat shows "Day 0", no crash
- [x] gamerLevel = 0 — Level stat shows "Lv 0", no crash
