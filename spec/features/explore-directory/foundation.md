# Feature Foundation: Explore / Directory

> Scoped slice of the system foundation for the Explore screen only.
> Explore is read-only — no writes to the DB. The only DB write is stealth quiz XP.

---

## Entities involved

```
Entity: (none stored) — animal catalogue is static data in src/data/animals.ts
Fields: AnimalEntry { id, name, animalType, breed, category, rarity, imageUrl,
        habitat, diet, lifespan, region, facts[], quiz }
States: n/a — static read-only catalogue

Entity: skillProgress (write — stealth quiz only)
Fields: xp, tier, totalCorrect, totalAttempted, currentStreak, bestStreak
Trigger: useProgress.addXp() + recordAnswer() if stealth quiz completed

Entity: puzzleHistory (write — stealth quiz only)
Fields: area, questionId, tier, correct, answeredAt
```

---

## Integration slice

```
Event: Stealth Quiz Completed (Explore)
Source: StealthQuiz component inside AnimalProfileSheet
Trigger: User answers quiz after 8s on animal profile (50% chance)

Consequences:
  Correct:
    1. useProgress.recordAnswer(area, questionId, tier=1, correct=true)
    2. useProgress.addXp(area, 5)
    3. useWallet.earn(5, 'Explore quiz', 'arcade')
    4. Success flash: coin burst + +5 on screen
  Wrong:
    1. useProgress.recordAnswer(area, questionId, tier=1, correct=false)
    2. useWallet.earn(1, 'Explore quiz effort', 'arcade')
    3. Gentle feedback: shows correct answer, no penalty
  Dismissed (X):
    1. No XP, no coins — no penalty
```

---

## Hook interfaces consumed

```
Hook: useProgress (write path — stealth quiz only)
  addXp(area: SkillArea, amount: number): Promise<{ newXp, tierChanged, newTier }>
  recordAnswer(area, questionId, tier, correct): Promise<void>

Hook: useWallet (write path — stealth quiz reward only)
  earn(amount, source, category): Promise<void>

Neither hook is needed for browsing — the directory is static data.
```

---

## Data structure

```typescript
// src/data/animals.ts

export type AnimalCategory = 'At Home' | 'Stables' | 'Farm' | 'Lost World' | 'Wild' | 'Sea'
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
export type SkillArea = 'maths' | 'spelling' | 'science' | 'geography'

export interface AnimalQuiz {
  questionId: string        // unique id, e.g. "bengal-tiger-q1"
  area: SkillArea           // which skill this tests
  question: string
  options: string[]         // 4 options
  correctIndex: number      // 0-3
}

export interface AnimalEntry {
  id: string                // e.g. "bengal-tiger"
  name: string              // e.g. "Bengal Tiger"
  animalType: string        // e.g. "Tiger"
  breed: string             // e.g. "Bengal"
  category: AnimalCategory
  rarity: Rarity
  imageUrl: string          // /animals/{id}.webp — may 404, AnimalImage handles fallback
  habitat: string           // e.g. "Rainforest"
  diet: string              // e.g. "Carnivore"
  lifespan: string          // e.g. "10–15 years"
  region: string            // e.g. "South & Southeast Asia"
  facts: string[]           // exactly 3 short facts
  quiz: AnimalQuiz          // one stealth quiz question per animal
}

export const ANIMALS: AnimalEntry[] = [...]
```

---

## A-Z index structure

```
Derived from ANIMALS at import time:
const INDEX_MAP: Map<string, number> = new Map()
// letter → index of first animal starting with that letter
// Used by AZRail to scroll virtualized list
```

---

## Design system tokens

| Token | Value | Used for |
|-------|-------|---------|
| `--bg` | `#0D0D11` | Page background |
| `--card` | `#18181D` | Animal cards |
| `--elev` | `#23262F` | Search bar background, category pill active |
| `--border-s` | `#2C2F3A` | Card borders, search border at rest |
| `--border` | `#353945` | Search focus border |
| `--blue` | `#3772FF` | Active category pill, search focus ring |
| `--blue-sub` | `rgba(55,114,255,.12)` | Active category pill background |
| `--blue-t` | `#6E9BFF` | Active category pill text |
| `--pink` | `#E8247C` | "Generate" CTA button |
| `--grad-cool` | `135deg, #3772FF → #9757D7` | Explore hero accent |
| `--t1` | `#FCFCFD` | Animal name, headings |
| `--t2` | `#B1B5C4` | Body text, facts |
| `--t3` | `#777E91` | Category label, metadata |
| `--r-lg` | `16px` | Cards, profile sheet corners |
| `--r-pill` | `100px` | Buttons, category pills |
| spacing | `24px` | Page horizontal margin |
| spacing | `12px` | Grid gap between cards |
| spacing | `20px` | Card padding |

---

## Build prerequisites

Before this feature can be built, the following must be `complete` in BACKLOG.md:

- [x] Database schema
- [x] Core hooks (wallet, reducedMotion, speech)
- [x] Notification system (toasts)
- [x] Navigation shell (routing, tabs, overlays)
- [x] Design system implementation (shared components)
- [x] Home screen
