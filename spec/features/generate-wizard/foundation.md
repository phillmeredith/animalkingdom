# Feature Foundation: Generate Wizard

> 7-step wizard that creates a unique animal identity and offers adoption.
> This is Animal Kingdom's core creation loop — most other features exist to support or reward this.

---

## Entities involved

```
Entity: savedNames (WRITE — on adoption)
Fields: all fields — this is the full pet creation event
States: created as "active"

Entity: history (WRITE — on every complete generation, regardless of adoption)
Fields: animalType, breed, category, gender, age, personality, colour, suggestedNames[], discoveryNarrative
Purpose: Rolling buffer of last 100 generates. Not adopted = just history.

Entity: playerWallet (WRITE — TraderPuzzle reward)
Fields: coins += 10-25 (correct) or 1 (effort)

Entity: transactions (WRITE — TraderPuzzle reward)
Fields: { type: earn, category: arcade, source: 'Trader puzzle' }

Entity: skillProgress (WRITE — TraderPuzzle)
Fields: xp += variable, tier may change
```

---

## Integration slice

```
Event: Pet Adopted from Generate
Source: useSavedNames.adoptPet()
Trigger: Player taps "Adopt [Name]" on ResultsScreen

Consequences (in order):
  1. savedNames record created with source "generate"
  2. history record created (regardless of adoption — on generate completion)
  3. Adoption celebration overlay: animated heart + "You adopted [Name]!"
  4. On 50% chance — TraderPuzzle overlay:
     a. Quiz question from one of 4 skill areas
     b. Correct: earn(10-25 coins), addXp(area, 15)
     c. Wrong: earn(1, effort), recordAnswer(area, id, tier, false)
  5. Navigate to Home after dismiss

Event: Generation Completed (not adopted)
  1. history record created
  2. User can tap "Generate Again" → resets to step 1
  3. No savedNames write, no wallet write
```

---

## Hook interfaces consumed

```
Hook: useSavedNames
  adoptPet(data): Promise<number> — returns new pet id

Hook: useNameHistory
  addToHistory(entry): Promise<void> — records this generation

Hook: useWallet
  earn(amount, source, category): Promise<void> — TraderPuzzle reward

Hook: useProgress
  addXp(area, amount): Promise<{...}>
  recordAnswer(area, questionId, tier, correct): Promise<void>
  getRecentQuestions(area, limit): Promise<string[]> — avoid repeat questions
```

---

## Data structure

```typescript
// src/data/generateOptions.ts

// Wizard step data — all locally defined, no API calls
export const CATEGORIES: Category[] — 6 items with icon + label
export const TYPES_BY_CATEGORY: Record<Category, TypeOption[]>
export const GENDERS: Gender[] — ['Male', 'Female']
export const AGES: Age[] — ['Newborn', 'Baby', 'Young', 'Adult', 'Old Timer']
export const PERSONALITIES: Personality[] — ~12 traits with emoji
export const BREEDS_BY_TYPE: Record<string, BreedOption[]>
export const COLOURS_BY_TYPE: Record<string, ColourOption[]>

// Name generation — local, no API
function generateNames(selections: WizardSelections): string[]
function generateNarrative(selections: WizardSelections): string
function determineRarity(selections: WizardSelections): Rarity

// TraderPuzzle questions bank
export const TRADER_QUESTIONS: TraderQuestion[]
```

---

## Design system tokens

| Token | Value | Used for |
|-------|-------|---------|
| `--bg` | `#0D0D11` | Wizard background |
| `--card` | `#18181D` | Option cards |
| `--elev` | `#23262F` | Selected option highlight |
| `--blue` | `#3772FF` | Step progress, selected card border |
| `--blue-sub` | `rgba(55,114,255,.12)` | Selected card background |
| `--pink` | `#E8247C` | Adopt CTA button |
| `--grad-hero` | `135deg, #E8247C → #3772FF` | Results celebration |
| `--t1` | `#FCFCFD` | Option labels, headings |
| `--t2` | `#B1B5C4` | Descriptions, step counter |
| `--t3` | `#777E91` | Step labels |
| `--r-lg` | `16px` | Option cards |
| `--r-pill` | `100px` | Buttons, progress dots |
| spacing | `24px` | Page horizontal margin |
| spacing | `12px` | Grid gap |

---

## Build prerequisites

- [x] All Tier 0 complete
- [x] Home screen
- [x] Explore / Directory (animal image paths established)
