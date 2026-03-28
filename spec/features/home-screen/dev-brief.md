# Developer Brief: Home Screen

## Context

HomeScreen is a read-mostly feature. It consumes three hooks (useWallet, useSavedNames, useProgress) via reactive queries and fires one write action (claimDailyBonus) on mount. No new tables or schema changes are needed. The only state machine interaction is the idempotent daily bonus claim.

---

## Data model

### Tables affected

```typescript
// playerWallet (read + write via useWallet)
interface PlayerWallet {
  id: number
  coins: number
  totalEarned: number
  totalSpent: number
  dailyLoginStreak: number
  lastDailyBonusDate: string | null   // YYYY-MM-DD
  createdAt: Date
  updatedAt: Date
}

// savedNames (read-only for Home)
interface SavedName {
  id: number
  name: string
  animalType: string
  breed: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  imageUrl: string
  category: string
  createdAt: Date
  // ... other fields not used by Home
}

// skillProgress (read-only for Home)
interface SkillProgress {
  id: number
  area: 'maths' | 'spelling' | 'science' | 'geography'
  xp: number
  tier: number
}
```

### Schema changes

None. All tables already exist.

---

## Hook implementation

Home screen does not own a hook. It composes three existing hooks.

### Hooks consumed

```typescript
// useWallet
const { coins, claimDailyBonus } = useWallet()
// coins: number — reactive via useLiveQuery
// claimDailyBonus(): Promise<{ awarded: boolean, amount: number, streak: number }>
//   — safe to call every mount; idempotent via lastDailyBonusDate check

// useSavedNames
const { pets, petCount } = useSavedNames()
// pets: SavedName[] — reactive, newest first (sort by id desc in component)
// petCount: number — reactive

// useProgress
const { gamerLevel, skills } = useProgress()
// gamerLevel: number — derived from total XP / 100
// skills: SkillProgress[] — all 4 skill areas
```

### Daily bonus sequence (HomeScreen useEffect)

```typescript
useEffect(() => {
  async function handleDailyBonus() {
    const result = await claimDailyBonus()
    if (result.awarded) {
      // Toast is shown by the hook itself — no additional toast call here
      // DailyBonusCard visibility is driven by result.awarded stored in local state
      setBonusResult(result)
      // Auto-dismiss after 2.5s
      setTimeout(() => setBonusResult(null), 2500)
    }
  }
  handleDailyBonus()
}, []) // Run once on mount only
```

**Important:** `claimDailyBonus()` fires the success toast internally. HomeScreen must NOT fire a duplicate toast.

---

## Integration contracts

### Events this feature emits

| Event | When | Downstream effect |
|-------|------|------------------|
| Daily bonus claimed | Home mounts, bonus not yet claimed today | playerWallet.coins +25, streak++, toast queued |

### Events this feature responds to

| Source | Event | This feature's response |
|--------|-------|------------------------|
| useSavedNames | New pet adopted | FeaturedPetCard reactively updates to show newest pet |
| useWallet | Any earn/spend | CoinDisplay in header reactively updates |

---

## State management

- `bonusResult: { awarded: boolean, amount: number, streak: number } | null` — local React state, drives DailyBonusCard visibility
- `pets`, `coins`, `petCount`, `gamerLevel` — all from hooks, all reactive
- Derived: `featuredPet = pets.length > 0 ? pets[0] : null` (useSavedNames returns newest first)
- Derived: `streakCount = wallet.dailyLoginStreak` (read from reactive wallet query)

**Note:** `useWallet()` returns `coins` and `claimDailyBonus` but not `dailyLoginStreak` directly. The streak is embedded in the wallet record — access via `useLiveQuery` in the hook. Confirm the hook exposes `streak` on its return value, or add it. If not available, read the streak from `claimDailyBonus` result and store in local state.

**Resolution:** `useWallet` must expose `streak: number` as a reactive value. Add this to the hook return if not already present.

---

## Error handling

| Failure | Expected behaviour |
|---------|-------------------|
| `claimDailyBonus()` DB write fails | Silently swallows — no coin change, no toast, DailyBonusCard not shown |
| `useSavedNames` query returns undefined during init | Show loading skeleton, not error |
| `useProgress` returns empty skills array | Show gamerLevel = 0, no crash |
| Image load error on FeaturedPetCard | AnimalImage component handles with paw-print fallback — no extra handling needed |

---

## Output expected

- `src/screens/HomeScreen.tsx` — main screen component
- `src/components/home/DailyBonusCard.tsx`
- `src/components/home/FeaturedPetCard.tsx`
- `src/components/home/QuickActions.tsx`
- `src/components/home/HomeStatCards.tsx`
- Update `useWallet` if `streak` is not already exposed as a reactive value
