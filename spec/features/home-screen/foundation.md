# Feature Foundation: Home Screen

> Scoped slice of the system foundation for the Home Screen only.

---

## Entities involved

```
Entity: playerWallet
Fields: coins, totalEarned, dailyLoginStreak, lastDailyBonusDate
States: n/a (no state machine)

Entity: savedNames
Fields: id, name, animalType, breed, rarity, imageUrl, category, createdAt
States: "active" | "for_sale"
Note: Home reads pets to show collection count and most-recent pet preview. No writes.

Entity: skillProgress
Fields: area, xp, tier
States: n/a
Note: Home reads to show gamerLevel badge.

Entity: badges
Fields: badgeId, name, track, rank, awardedAt
Note: Home reads count for profile badge display.
```

---

## Integration slice

```
Event: Daily Login Bonus Claimed
Source: useWallet.claimDailyBonus()
Trigger: Home screen mounts and lastDailyBonusDate !== today
Consequences:
  1. playerWallet.coins += 25
  2. playerWallet.lastDailyBonusDate = today
  3. playerWallet.dailyLoginStreak++
  4. Transaction record: { type: "earn", amount: 25, category: "daily" }
  5. Success toast: "Daily bonus! +25 coins"
  6. Coin display reactive-updates immediately
```

---

## Hook interfaces consumed

```
Hook: useWallet

Consumed:
  coins: number — reactive balance shown in header CoinDisplay
  claimDailyBonus(): Promise<{ awarded: boolean, amount: number, streak: number }>
    Behaviour: Idempotent — safe to call on every mount. Returns { awarded: false } if already claimed.
    Side effects: earn() called internally, transaction created, toast queued by caller
    Failure: If DB write fails, coins not changed, return { awarded: false }

Hook: useSavedNames

Consumed:
  pets: SavedName[] — reactive list; Home uses pets.length and pets[0] (most recent)
  petCount: number — shown in collection stat card

Hook: useProgress

Consumed:
  gamerLevel: number — shown in header as level badge
  skills: SkillProgress[] — used to build per-subject progress bars in stats section
```

---

## Design system tokens

| Token | Value | Used for |
|-------|-------|---------|
| `--bg` | `#0D0D11` | Page background |
| `--card` | `#18181D` | Stat cards, featured pet card |
| `--elev` | `#23262F` | Quick action button backgrounds |
| `--border-s` | `#2C2F3A` | Card borders |
| `--blue` | `#3772FF` | Explore quick action, level badge |
| `--pink` | `#E8247C` | Daily bonus CTA button |
| `--amber` | `#F5A623` | Coin display, streak badge |
| `--amber-sub` | `rgba(245,166,35,.12)` | Coin display background |
| `--amber-t` | `#FCC76E` | Coin display text |
| `--t1` | `#FCFCFD` | Headings, values |
| `--t2` | `#B1B5C4` | Body text, descriptions |
| `--t3` | `#777E91` | Labels, captions |
| `--r-lg` | `16px` | Card radius |
| `--r-pill` | `100px` | Buttons, badges |
| spacing | `24px` | Page horizontal margin |
| spacing | `20px` | Card padding |
| spacing | `16px` | Grid gap |

---

## Build prerequisites

Before this feature can be built, the following must be `complete` in BACKLOG.md:

- [x] Database schema
- [x] Core hooks (wallet, reducedMotion, speech)
- [x] Notification system (toasts)
- [x] Navigation shell (routing, tabs, overlays)
- [x] Design system implementation (shared components)
