# Dev Brief: Generate Wizard

---

## File map

```
src/
  data/
    generateOptions.ts    NEW — all wizard step data + name/narrative generators
  hooks/
    useNameHistory.ts     NEW — manages history table
  screens/
    GenerateScreen.tsx    NEW — wizard controller + state machine
  components/
    generate/
      WizardHeader.tsx    NEW — back btn + step dots
      OptionGrid.tsx      NEW — reusable option card grid
      OptionCard.tsx      NEW — single selectable card
      GeneratingOverlay.tsx NEW — loading animation between step 7 and results
      ResultsScreen.tsx   NEW — name selection + narrative + adopt CTA
      AdoptionOverlay.tsx NEW — celebration overlay
      TraderPuzzle.tsx    NEW — post-adoption quiz BottomSheet
```

---

## Wizard state machine

```typescript
interface WizardState {
  step: 1 | 2 | 3 | 4 | 5 | 6 | 7
  selections: {
    category: AnimalCategory | null
    animalType: string | null
    gender: 'Male' | 'Female' | null
    age: Age | null
    personality: string | null
    breed: string | null
    colour: string | null
  }
}

// On mount: check query params, pre-fill selections + advance step
// On option select: set selection + advance step (with 150ms delay for animation)
// After step 7: show GeneratingOverlay (1.5s) → ResultsScreen
// Back: decrement step, clear that step's selection
```

---

## generateOptions.ts structure

```typescript
export interface CategoryOption {
  value: AnimalCategory
  emoji: string
  label: string
}

export interface TypeOption {
  value: string      // e.g. 'Tiger'
  emoji: string
  label: string
  category: AnimalCategory
}

export interface BreedOption {
  value: string      // e.g. 'Bengal'
  label: string
  rarity: Rarity
  imageUrl: string   // from Animals/ folder
}

export interface ColourOption {
  value: string      // e.g. 'Orange and Black'
  label: string
  hex: string        // preview swatch
}

export interface PersonalityOption {
  value: string
  emoji: string
  description: string
}

// Name generation
export function generateNames(
  animalType: string,
  breed: string,
  colour: string,
  gender: 'Male' | 'Female',
  personality: string,
  rarity: Rarity
): string[]   // returns exactly 3 names

// Narrative generation
export function generateNarrative(selections: CompleteSelections): string

// Rarity determination (weighted by breed rarity field)
export function determineRarity(breed: string, animalType: string): Rarity
```

---

## Name generation algorithm

No API. Local templates combining attributes.

Three name styles per generate call:
1. **Classic** — traditional pet name from a curated pool filtered by gender
2. **Nature** — inspired by colour or habitat (e.g., amber, storm, ember)
3. **Personality** — inspired by the personality trait (e.g., Brave → Rex, Fearless → Dash)

Each style: pick from a pool of 20-30 names, filtered/weighted by gender.
Return exactly 3 names, guaranteed unique within the call.

For horses: generate barn name + show name variant.
For dogs: single given name.
For dinosaurs: more dramatic names (Rex, Titan, Ember, Storm).

---

## Discovery narrative template

```typescript
const NARRATIVE_TEMPLATES = [
  "A {rarity} {age} {breed} {type} was discovered sheltering near {habitat}. With a {personality} spirit and {colour} markings, {pronoun} seemed ready for a new home.",
  "Found wandering through {habitat}, this {personality} {age} {breed} {type} caught the attention of an explorer. {pronoun_cap} {colour} coat gleamed in the light.",
  "Deep in {habitat}, a {rarity} {breed} {type} was spotted. {pronoun_cap} {personality} nature made {pronoun} an unforgettable find.",
]
// Pick one randomly, fill in slots
```

---

## TraderPuzzle question bank

Questions stored in generateOptions.ts. Bank of 20 questions across all 4 skill areas.
Pick randomly, avoiding recently seen (use useProgress.getRecentQuestions).
Reward calculation:
  - Correct at first attempt: earn(25, ...), addXp(area, 15)
  - (Only one attempt — no retry in TraderPuzzle)

---

## useNameHistory hook

```typescript
export function useNameHistory() {
  const history = useLiveQuery(
    () => db.history.orderBy('id').reverse().toArray(),
    [],
    [] as HistoryEntry[]
  )

  async function addToHistory(entry: Omit<HistoryEntry, 'id' | 'createdAt'>): Promise<void> {
    await db.transaction('rw', db.history, async () => {
      await db.history.add({ ...entry, createdAt: new Date() })
      const count = await db.history.count()
      if (count > 100) {
        const oldest = await db.history.orderBy('id').first()
        if (oldest?.id) await db.history.delete(oldest.id)
      }
    })
  }

  async function clearHistory(): Promise<void> {
    await db.history.clear()
  }

  return { history, addToHistory, clearHistory }
}
```

---

## Query param handling

```typescript
// In GenerateScreen on mount:
const [searchParams] = useSearchParams()
const typeParam = searchParams.get('type')   // e.g. 'Tiger'
const breedParam = searchParams.get('breed') // e.g. 'Bengal'

useEffect(() => {
  if (typeParam) {
    // Find category for this type
    const typeOption = ALL_TYPES.find(t => t.value === typeParam)
    if (typeOption) {
      setSelections(s => ({ ...s, category: typeOption.category, animalType: typeParam }))
      if (breedParam) {
        setSelections(s => ({ ...s, breed: breedParam }))
        setStep(3)  // skip to gender
      } else {
        setStep(6)  // skip to breed selection
      }
    }
  }
}, [])
```

---

## Image resolution for results

ResultsScreen image = look up breed in BREEDS_BY_TYPE[animalType] → find matching breed → use imageUrl.
If not found: use AnimalImage paw fallback.

---

## Error handling

| Scenario | Handling |
|----------|----------|
| adoptPet() DB write fails | Toast error, stay on ResultsScreen |
| addToHistory() fails | Silently swallow — history is non-critical |
| No names generated | Fallback: ["Buddy", "Luna", "Star"] |
| TraderPuzzle question DB write fails | Silently swallow |
