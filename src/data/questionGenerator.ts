// questionGenerator.ts — Card-specific question generation for all 4 educational games
//
// All 4 exports are pure functions (no async, no DB writes). Question text references
// the specific card's name and data so each session is unique to the animal Harry picked.
//
// No emojis are used anywhere in this file — icon names and Lucide components handle
// visual representation in the rendering layer.

import type { CollectedCard, SkillArea } from '@/lib/db'
import { ArcadeQuestion } from '@/data/arcadeQuestions'

// ─── Re-export ArcadeQuestion so callers can import from one place ─────────────
export type { ArcadeQuestion } from '@/data/arcadeQuestions'

// ─── HabitatBuilder-specific types ────────────────────────────────────────────

export interface HabitatOption {
  label: string
  effect: { stamina?: number; food?: number; shelter?: number }
  isCorrect: boolean
}

export interface HabitatDecision {
  day: number
  situation: string
  options: HabitatOption[]
  outcome: {
    correct: string
    incorrect: string
  }
}

// ─── Internal utilities ────────────────────────────────────────────────────────

/** Seeded-ish shuffle — not cryptographic, but deterministic per call site */
function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** Rotate options so the correct answer lands at a random position */
function withShuffledOptions(
  question: string,
  correctAnswer: string,
  wrongAnswers: string[],
  area: SkillArea,
  id: string
): ArcadeQuestion {
  const pool = shuffle([correctAnswer, ...wrongAnswers.slice(0, 3)])
  // Ensure exactly 4 options even if caller supplied fewer wrong answers
  while (pool.length < 4) pool.push(`${pool[pool.length - 1]} (alt)`)
  return {
    id,
    area,
    question,
    options: pool,
    correctIndex: pool.indexOf(correctAnswer),
  }
}

/** Round a number to a sensible display value */
function round(n: number, dp = 0): number {
  const factor = Math.pow(10, dp)
  return Math.round(n * factor) / factor
}

/** Extract only numeric values from coinRushFacts (the DB field allows string values) */
function numericFacts(card: CollectedCard): Record<string, number> {
  const raw = card.coinRushFacts ?? {}
  const result: Record<string, number> = {}
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === 'number' && isFinite(v)) {
      result[k] = v
    }
  }
  return result
}

/** Humanise a camelCase fact key into a readable phrase */
function humaniseKey(key: string): string {
  const MAP: Record<string, string> = {
    topSpeedKph: 'top speed in km/h',
    weightKg: 'weight in kg',
    scentReceptors: 'scent receptors',
    commandsLearned: 'commands it can learn',
    sheepHerdedPerDay: 'sheep herded per day',
    retrieveDistanceM: 'retrieve distance in metres',
    verticalJumpM: 'vertical jump height in metres',
    litterSize: 'typical litter size',
    exerciseMinutesPerDay: 'exercise minutes needed per day',
    lifeExpectancyYears: 'life expectancy in years',
    gestatioNDays: 'gestation period in days',
    gestationDays: 'gestation period in days',
    runningSpeedKph: 'running speed in km/h',
    swimSpeedKph: 'swimming speed in km/h',
    diveDepthM: 'dive depth in metres',
    wingspanCm: 'wingspan in cm',
    eggIncubationDays: 'egg incubation days',
    heightCm: 'height in cm',
    lengthCm: 'length in cm',
    weightTonnes: 'weight in tonnes',
    tuskLengthCm: 'tusk length in cm',
    jumpHeightM: 'jump height in metres',
  }
  return MAP[key] ?? key.replace(/([A-Z])/g, ' $1').trim().toLowerCase()
}

/** Returns 'a' or 'an' based on whether the word starts with a vowel sound */
function article(word: string): 'a' | 'an' {
  return /^[aeiou]/i.test(word.trim()) ? 'an' : 'a'
}

/** Capitalised version of article() for sentence-start positions */
function capArticle(word: string): 'A' | 'An' {
  return article(word) === 'an' ? 'An' : 'A'
}

/** Produce 3 wrong numeric answers that are plausibly wrong but not obviously so */
function wrongNumbers(correct: number, spread: number): string[] {
  const offsets = [-spread * 2, spread, spread * 3]
  return offsets.map(o => String(round(correct + o, correct < 10 ? 1 : 0)))
}

/** Produce 3 misspellings for a vocabulary word */
function misspell(word: string): string[] {
  const variants: string[] = []

  // Strategy 1: double a single consonant (or halve a double)
  const doubled = word.replace(/([bcdfghjklmnpqrstvwxyz])\1/i, '$1')
  if (doubled !== word) variants.push(doubled)

  const singled = word.replace(/([bcdfghjklmnpqrstvwxyz])(?!\1)/i, (m, c) => c + c)
  if (singled !== word && singled !== word) variants.push(singled)

  // Strategy 2: swap adjacent vowels
  const vowelSwapped = word.replace(/([aeiou])([aeiou])/i, (_, a, b) => b + a)
  if (vowelSwapped !== word) variants.push(vowelSwapped)

  // Strategy 3: substitute a vowel
  const vowelSub = word.replace(/[aeiou]/i, m => {
    const vowels = ['a', 'e', 'i', 'o', 'u'].filter(v => v !== m.toLowerCase())
    return vowels[Math.floor(Math.random() * vowels.length)]
  })
  if (vowelSub !== word && !variants.includes(vowelSub)) variants.push(vowelSub)

  // Strategy 4: add a trailing letter
  variants.push(word + 'e')

  // Strategy 5: drop the last letter
  if (word.length > 3) variants.push(word.slice(0, -1))

  // Capitalise to match vocab words
  const capitalised = variants
    .filter(v => v !== word)
    .map(v => v.charAt(0).toUpperCase() + v.slice(1))

  // Deduplicate and return exactly 3
  const unique = [...new Set(capitalised)].slice(0, 3)
  while (unique.length < 3) unique.push(word.slice(0, -1) + 'er')
  return unique
}

// ─── 1. Coin Rush — Maths ─────────────────────────────────────────────────────

/**
 * Generate card-specific maths questions for Coin Rush.
 *
 * Year 1: Simple addition / subtraction using scaled fact values.
 * Year 2: Multiplication, simple fractions on raw fact values.
 * Year 3: Multi-step, percentages, distance/time using raw fact values.
 *
 * Falls back to card.stats if coinRushFacts is empty.
 */
export function generateCoinRushQuestions(
  card: CollectedCard,
  yearLevel: 1 | 2 | 3,
  count: number
): ArcadeQuestion[] {
  const name = card.name
  const facts = numericFacts(card)
  const stats = card.stats

  // Build a working set of numeric values — facts first, then stats as fallback
  const factEntries = Object.entries(facts)
  const statEntries: [string, number][] = [
    ['topSpeedKph', stats.speed],
    ['weightKg', stats.strength],
    ['stamina', stats.stamina],
    ['agility', stats.agility],
    ['intelligence', stats.intelligence],
  ]
  const entries: [string, number][] =
    factEntries.length >= 2 ? factEntries : statEntries

  const questions: ArcadeQuestion[] = []
  let idx = 0

  // Cycle through entries to generate enough questions
  while (questions.length < count * 2) {
    const [key, rawValue] = entries[idx % entries.length]
    idx++

    const label = humaniseKey(key)
    const v = round(rawValue, rawValue < 10 ? 1 : 0)

    if (yearLevel === 1) {
      // Scale very large numbers down so Year 1 arithmetic stays manageable
      const scaled = rawValue > 1000 ? round(rawValue / 1000, 0) : v
      const scaledLabel = rawValue > 1000 ? `${label} (in thousands)` : label

      // Template A: subtraction
      const sub = round(scaled - 10, 0)
      questions.push(
        withShuffledOptions(
          `${capArticle(name)} ${name} has ${article(scaledLabel)} ${scaledLabel} of ${scaled}. If it loses 10, what is left?`,
          String(sub),
          wrongNumbers(sub, 2),
          'maths',
          `cq-${idx}-a`
        )
      )

      // Template B: addition
      const add = round(scaled + 5, 0)
      questions.push(
        withShuffledOptions(
          `${capArticle(name)} ${name} has ${article(scaledLabel)} ${scaledLabel} of ${scaled}. Add 5 more. What is the new total?`,
          String(add),
          wrongNumbers(add, 2),
          'maths',
          `cq-${idx}-b`
        )
      )
    } else if (yearLevel === 2) {
      // Template A: multiply by 3
      const times3 = round(v * 3, 0)
      questions.push(
        withShuffledOptions(
          `${capArticle(name)} ${name} has ${article(label)} ${label} of ${v}. Three of them together have a combined total of what?`,
          String(times3),
          wrongNumbers(times3, v),
          'maths',
          `cq-${idx}-a`
        )
      )

      // Template B: half
      if (v > 2 && v % 2 === 0) {
        const half = v / 2
        questions.push(
          withShuffledOptions(
            `${capArticle(name)} ${name}'s ${label} is ${v}. Half of that is?`,
            String(half),
            wrongNumbers(half, Math.max(1, round(v / 6, 0))),
            'maths',
            `cq-${idx}-b`
          )
        )
      } else {
        // Quarter instead if not evenly halved
        const quarter = round(v / 4, 1)
        questions.push(
          withShuffledOptions(
            `${capArticle(name)} ${name}'s ${label} is ${v}. One quarter of that is?`,
            String(quarter),
            wrongNumbers(quarter, Math.max(0.5, round(v / 8, 1))),
            'maths',
            `cq-${idx}-b`
          )
        )
      }
    } else {
      // Year 3: multi-step / percentage / distance-time

      // Template A: distance in 45 min (speed-based)
      if (key === 'topSpeedKph' || key === 'runningSpeedKph') {
        const dist45 = round(v * 0.75, 1)
        questions.push(
          withShuffledOptions(
            `${capArticle(name)} ${name} runs at ${v} km/h. How far does it travel in 45 minutes?`,
            `${dist45} km`,
            [`${round(v * 0.5, 1)} km`, `${round(v * 1, 1)} km`, `${round(v * 0.25, 1)} km`],
            'maths',
            `cq-${idx}-a`
          )
        )
      } else {
        // Template A fallback: 20% increase
        const increase = round(v * 1.2, 0)
        questions.push(
          withShuffledOptions(
            `${capArticle(name)} ${name}'s ${label} is ${v}. After a 20% increase, what is the new value?`,
            String(increase),
            wrongNumbers(increase, Math.max(1, round(v * 0.1, 0))),
            'maths',
            `cq-${idx}-a`
          )
        )
      }

      // Template B: ratio — how many times bigger
      const [key2, rawValue2] = entries[(idx + 1) % entries.length]
      const v2 = round(rawValue2, rawValue2 < 10 ? 1 : 0)
      if (key2 !== key && v2 > 0 && v > 0) {
        const ratio = round(v / v2, 1)
        questions.push(
          withShuffledOptions(
            `${capArticle(name)} ${name}'s ${humaniseKey(key)} is ${v} and its ${humaniseKey(key2)} is ${v2}. How many times bigger is the first value?`,
            String(ratio),
            [String(round(ratio + 1, 1)), String(round(ratio - 1, 1)), String(round(ratio * 2, 1))],
            'maths',
            `cq-${idx}-b`
          )
        )
      } else {
        // Fallback: percentage of
        const pct = round((v / 100) * 25, 1)
        questions.push(
          withShuffledOptions(
            `25% of a ${name}'s ${label} (${v}) is what value?`,
            String(pct),
            wrongNumbers(pct, Math.max(1, round(v * 0.05, 1))),
            'maths',
            `cq-${idx}-b`
          )
        )
      }
    }
  }

  // Shuffle and deduplicate by question text before returning
  const unique = shuffle(questions).filter(
    (q, i, arr) => arr.findIndex(x => x.question === q.question) === i
  )
  return unique.slice(0, count)
}

// ─── 2. Word Safari — Spelling / Vocabulary ───────────────────────────────────

/**
 * Distractor words for Year 1 "which word applies to this animal" questions.
 * These are real animal-related words that would not be in the card's own vocab list.
 */
const WORD_SAFARI_DISTRACTORS = [
  'camouflage', 'migration', 'territory', 'nocturnal', 'predator',
  'hibernate', 'venom', 'plumage', 'tusks', 'mane', 'antler',
  'aquatic', 'arboreal', 'diurnal', 'gregarious', 'solitary',
  'domesticated', 'carnivore', 'herbivore', 'omnivore', 'invertebrate',
]

const BIOME_LABELS: Record<string, string> = {
  urban: 'urban / suburban',
  tropical_rainforest: 'tropical rainforest',
  savanna: 'savanna grassland',
  desert: 'desert',
  tundra: 'tundra',
  temperate_forest: 'temperate forest',
  ocean: 'open ocean',
  freshwater: 'freshwater river or lake',
  wetland: 'wetland / marsh',
  alpine: 'alpine mountain',
  coral_reef: 'coral reef',
  boreal_forest: 'boreal / taiga forest',
  shrubland: 'shrubland / chaparral',
  grassland: 'grassland / meadow',
}

/**
 * Generate card-specific vocabulary / spelling questions for Word Safari.
 *
 * Year 1: Correct spelling of vocab words, which word belongs to the animal.
 * Year 2: Morphology — past tense, opposites, definitions.
 * Year 3: Etymology, connotation, conservation / biome vocabulary.
 */
export function generateWordSafariQuestions(
  card: CollectedCard,
  yearLevel: 1 | 2 | 3,
  count: number
): ArcadeQuestion[] {
  const name = card.name
  const vocab = card.wordSafariVocab ?? []
  const questions: ArcadeQuestion[] = []

  // If the card has no vocab, fall back to the conservation status and biome words
  const usableVocab = vocab.length > 0
    ? vocab
    : ['animal', 'species', 'habitat', 'wild', 'nature']

  let idx = 0

  while (questions.length < count * 2) {
    const word = usableVocab[idx % usableVocab.length]
    idx++

    const capitalised = word.charAt(0).toUpperCase() + word.slice(1)
    const misspellings = misspell(word)

    if (yearLevel === 1) {
      // Template A: correct spelling
      const spellingOptions = shuffle([capitalised, ...misspellings])
      questions.push({
        id: `ws-cq-${idx}-a`,
        area: 'spelling',
        question: `Which of these is the correct spelling of a word used to describe a ${name}?`,
        options: spellingOptions,
        correctIndex: spellingOptions.indexOf(capitalised),
      })

      // Template B: which word belongs to this animal
      const distractors = WORD_SAFARI_DISTRACTORS
        .filter(d => !usableVocab.includes(d))
        .slice(0, 3)
      const vocabOptions = shuffle([capitalised, ...distractors.map(d =>
        d.charAt(0).toUpperCase() + d.slice(1)
      )])
      questions.push({
        id: `ws-cq-${idx}-b`,
        area: 'spelling',
        question: `Which word is associated with how a ${name} finds food or moves?`,
        options: vocabOptions,
        correctIndex: vocabOptions.indexOf(capitalised),
      })
    } else if (yearLevel === 2) {
      // Template A: what does this word mean (definition MCQ)
      const DEFINITIONS: Record<string, [string, string, string, string]> = {
        scent:   ['A smell used for tracking', 'A type of movement', 'A loud call', 'A type of shelter'],
        hound:   ['A type of hunting dog', 'A bird of prey', 'A large cat', 'A river creature'],
        pack:    ['A group of animals that hunt together', 'A single hunter', 'A young animal', 'A type of burrow'],
        trail:   ['A path or track left behind', 'A type of food', 'A sleeping position', 'A mating call'],
        burrow:  ['A hole in the ground used as shelter', 'A type of jump', 'A tree hollow', 'A water source'],
        herding: ['Guiding animals to move in a group', 'Feeding on grass', 'Hunting alone', 'Making a nest'],
        instinct:['A natural behaviour animals are born with', 'A learned skill', 'A type of habitat', 'A season'],
        obedience:['Following commands and instructions', 'Hunting prey', 'A type of territory', 'A colour pattern'],
        hybrid:  ['A mix of two different breeds or species', 'A type of habitat', 'A single pure breed', 'A migration route'],
        rosette: ['A rose-shaped pattern on a coat', 'A type of sound', 'A group of animals', 'A river feature'],
        nocturnal:['Active at night', 'Active during the day', 'Active in winter only', 'Active at dawn only'],
        territorial:['Defending a home area from others', 'Sharing space freely', 'Living in groups', 'Migrating seasonally'],
        retrieve:['To fetch and bring back an object', 'To hide food', 'To chase prey', 'To groom another animal'],
        loyal:   ['Faithful and devoted', 'Aggressive and territorial', 'Solitary and secretive', 'Migratory and fast'],
        guide:   ['To lead or direct', 'To hunt', 'To hibernate', 'To camouflage'],
        crepuscular:['Active at dawn and dusk', 'Active only at night', 'Active all day', 'Active in winter'],
        ticked:  ['Having a coat with multiple colours on each hair', 'Having solid single-colour fur', 'Having spots', 'Having stripes'],
        agile:   ['Able to move quickly and easily', 'Very slow-moving', 'Burrowing underground', 'Able to fly'],
        carnivore:['An animal that eats meat', 'An animal that eats only plants', 'An animal that eats both', 'An insect-eater'],
        companion:['An animal kept for friendship', 'A wild predator', 'A migratory species', 'A burrowing animal'],
        pedigree:['A recorded line of purebred ancestors', 'A type of wild habitat', 'A migratory route', 'A food source'],
        domesticated:['Adapted to live with humans', 'Completely wild', 'Extinct in the wild', 'A newly discovered species'],
        brachycephalic:['Having a short, flat skull shape', 'Having a long narrow skull', 'Having no skull bones', 'Having large ears'],
      }

      const defs = DEFINITIONS[word.toLowerCase()]
      if (defs) {
        const [correct, ...wrongs] = defs
        const options = shuffle([correct, ...wrongs])
        questions.push({
          id: `ws-cq-${idx}-a`,
          area: 'spelling',
          question: `What does the word "${capitalised}" mean in relation to animals like the ${name}?`,
          options,
          correctIndex: options.indexOf(correct),
        })
      } else {
        // Generic: which sentence uses the word correctly
        questions.push(
          withShuffledOptions(
            `Which sentence uses the word "${capitalised}" correctly?`,
            `The ${name} used its ${word} to find its way.`,
            [
              `The ${name} avoided all ${word} carefully.`,
              `${capitalised} is a type of food the ${name} avoids.`,
              `The ${name} lost its ${word} after resting.`,
            ],
            'spelling',
            `ws-cq-${idx}-a`
          )
        )
      }

      // Template B: which word is a synonym / related term
      const nextWord = usableVocab[(idx) % usableVocab.length]
      const nextCap = nextWord.charAt(0).toUpperCase() + nextWord.slice(1)
      questions.push(
        withShuffledOptions(
          `Which of these vocabulary words is most closely connected to the ${name}'s way of life?`,
          nextCap,
          WORD_SAFARI_DISTRACTORS.slice(0, 3).map(d =>
            d.charAt(0).toUpperCase() + d.slice(1)
          ),
          'spelling',
          `ws-cq-${idx}-b`
        )
      )
    } else {
      // Year 3: conservation / biome / advanced vocabulary

      // Template A: conservation status meaning
      const status = card.conservationStatus ?? 'Least Concern'
      const STATUS_MEANINGS: Record<string, string> = {
        'Least Concern':    'The species is widespread and not under immediate threat',
        'Near Threatened':  'The species may soon qualify as threatened if trends continue',
        'Vulnerable':       'The species faces a high risk of extinction in the wild',
        'Endangered':       'The species faces a very high risk of extinction in the wild',
        'Critically Endangered': 'The species faces an extremely high risk of extinction',
        'Extinct in the Wild':   'The species only survives in captivity',
        'Extinct':               'No individuals of this species are known to survive',
      }
      const meaning = STATUS_MEANINGS[status] ?? 'The species is monitored by conservationists'
      const wrongStatuses = Object.entries(STATUS_MEANINGS)
        .filter(([k]) => k !== status)
        .map(([, v]) => v)
        .slice(0, 3)
      const statusOptions = shuffle([meaning, ...wrongStatuses])
      questions.push({
        id: `ws-cq-${idx}-a`,
        area: 'spelling',
        question: `The ${name} is listed as "${status}". What does this classification mean?`,
        options: statusOptions,
        correctIndex: statusOptions.indexOf(meaning),
      })

      // Template B: biome identification
      const biome = card.biome ?? 'urban'
      const biomeLabel = BIOME_LABELS[biome] ?? biome.replace(/_/g, ' ')
      const wrongBiomes = Object.values(BIOME_LABELS)
        .filter(b => b !== biomeLabel)
        .slice(0, 3)
      const biomeOptions = shuffle([biomeLabel, ...wrongBiomes])
      questions.push({
        id: `ws-cq-${idx}-b`,
        area: 'spelling',
        question: `What type of habitat does the ${name} naturally live in?`,
        options: biomeOptions,
        correctIndex: biomeOptions.indexOf(biomeLabel),
      })

      // Template C: vocabulary in context using a vocab word
      questions.push(
        withShuffledOptions(
          `The word "${capitalised}" is used by scientists studying the ${name}. Which field of study uses this word?`,
          'Animal behaviour and ecology',
          ['Astronomy', 'Mathematics', 'Geology'],
          'spelling',
          `ws-cq-${idx}-c`
        )
      )
    }
  }

  const unique = shuffle(questions).filter(
    (q, i, arr) => arr.findIndex(x => x.question === q.question) === i
  )
  return unique.slice(0, count)
}

// ─── 3. Habitat Builder — Science decisions ───────────────────────────────────

/**
 * Generate 5 daily habitat decisions for Habitat Builder.
 *
 * Each decision describes a situation the animal faces and presents 3 options.
 * The correct option matches the animal's ecological role (carnivore / herbivore / omnivore).
 *
 * Year 1: Basic needs — food, water, shelter.
 * Year 2: Adds predator avoidance and habitat adaptation.
 * Year 3: Adds energy transfer and conservation awareness.
 */
export function generateHabitatBuilderDecisions(
  card: CollectedCard,
  yearLevel: 1 | 2 | 3
): HabitatDecision[] {
  const name = card.name
  const role = card.habitatBuilderRole ?? 'omnivore'
  const prey = card.habitatBuilderPrey ?? []
  const predators = card.habitatBuilderPredators ?? []

  const preyWord = prey.length > 0 ? prey[0] : 'small animals'
  const predatorWord = predators.length > 0 ? predators[0] : 'a larger predator'
  const plantFood = 'berries and leaves'

  // Determine what "correct action" means per role per context
  function huntSituation(day: number): HabitatDecision {
    const situation =
      role === 'carnivore'
        ? `${name} spots a ${preyWord} nearby in the habitat.`
        : role === 'herbivore'
        ? `${name} finds a patch of ${plantFood} in a sunny clearing.`
        : `${name} sees both a ${preyWord} and some ${plantFood} nearby.`

    const correctLabel =
      role === 'carnivore' ? `Chase and catch the ${preyWord}`
      : role === 'herbivore' ? `Eat the ${plantFood}`
      : `Eat both the ${preyWord} and ${plantFood}`

    const correctEffect: HabitatOption['effect'] = { food: 2, stamina: 1 }
    const wrongA: HabitatOption = {
      label: 'Rest and wait for easier food',
      effect: { stamina: 1 },
      isCorrect: false,
    }
    const wrongB: HabitatOption = {
      label: 'Drink water from the stream instead',
      effect: { stamina: 0 },
      isCorrect: false,
    }

    return {
      day,
      situation,
      options: shuffle([
        { label: correctLabel, effect: correctEffect, isCorrect: true },
        wrongA,
        wrongB,
      ]),
      outcome: {
        correct: `Well done! ${name} found food and gained energy. Food +2, Stamina +1`,
        incorrect: `${name} missed the chance to eat. Keep looking for food!`,
      },
    }
  }

  function shelterSituation(day: number): HabitatDecision {
    return {
      day,
      situation: `A storm is approaching. ${name} needs to find shelter quickly.`,
      options: shuffle([
        {
          label: 'Find a sheltered spot under dense trees',
          effect: { shelter: 2, stamina: 1 },
          isCorrect: true,
        },
        {
          label: 'Stay in the open and keep moving',
          effect: { stamina: -1 },
          isCorrect: false,
        },
        {
          label: 'Climb to the highest point nearby',
          effect: { stamina: -1 },
          isCorrect: false,
        },
      ]),
      outcome: {
        correct: `${name} found shelter and stayed safe. Shelter +2, Stamina +1`,
        incorrect: `${name} got caught in the storm. Try to find cover next time!`,
      },
    }
  }

  function waterSituation(day: number): HabitatDecision {
    return {
      day,
      situation: `${name} is thirsty after a long morning. There are two water sources nearby.`,
      options: shuffle([
        {
          label: 'Drink from the clean flowing stream',
          effect: { stamina: 2 },
          isCorrect: true,
        },
        {
          label: 'Drink from the muddy puddle nearby',
          effect: { stamina: -1 },
          isCorrect: false,
        },
        {
          label: 'Ignore thirst and keep exploring',
          effect: { stamina: 0 },
          isCorrect: false,
        },
      ]),
      outcome: {
        correct: `${name} drank fresh water and feels refreshed. Stamina +2`,
        incorrect: `${name} chose poorly for hydration. Try the clean water source!`,
      },
    }
  }

  function predatorSituation(day: number): HabitatDecision {
    const threat = predatorWord
    return {
      day,
      situation:
        role === 'herbivore' || (role === 'omnivore' && predators.length > 0)
          ? `${name} hears ${threat} approaching through the undergrowth.`
          : `${name} notices another animal approaching its territory.`,
      options: shuffle([
        {
          label:
            role === 'herbivore'
              ? `Stay very still and hide in the vegetation`
              : `Hold ground and signal a warning`,
          effect: { stamina: 1 },
          isCorrect: true,
        },
        {
          label: 'Run in the open where it can be seen',
          effect: { stamina: -2 },
          isCorrect: false,
        },
        {
          label: 'Approach the threat to investigate',
          effect: { stamina: -1 },
          isCorrect: false,
        },
      ]),
      outcome: {
        correct: `${name} stayed safe by using the right survival instinct. Stamina +1`,
        incorrect: `${name} put itself in danger. Think about how this animal stays safe!`,
      },
    }
  }

  function energySituation(day: number): HabitatDecision {
    // Year 2+ — habitat adaptation
    return {
      day,
      situation: `${name} has used a lot of energy today. It needs to decide how to spend the rest of the day.`,
      options: shuffle([
        {
          label: 'Find a safe resting spot and conserve energy',
          effect: { stamina: 2, shelter: 1 },
          isCorrect: true,
        },
        {
          label: 'Keep exploring new territory',
          effect: { stamina: -1 },
          isCorrect: false,
        },
        {
          label: 'Spend time grooming in the open',
          effect: { stamina: 0 },
          isCorrect: false,
        },
      ]),
      outcome: {
        correct: `${name} rested well and recovered energy. Stamina +2, Shelter +1`,
        incorrect: `${name} overexerted itself. Balance activity with rest!`,
      },
    }
  }

  function conservationSituation(day: number): HabitatDecision {
    // Year 3 — conservation awareness
    const status = card.conservationStatus ?? 'Least Concern'
    const isAtRisk =
      status === 'Vulnerable' ||
      status === 'Endangered' ||
      status === 'Critically Endangered'

    return {
      day,
      situation: isAtRisk
        ? `${name} encounters a human-made barrier that blocks its usual route. Conservation volunteers are nearby.`
        : `${name} discovers a new area at the edge of its habitat where humans have been active.`,
      options: shuffle([
        {
          label: isAtRisk
            ? 'Wait near the volunteers who can help remove the barrier'
            : 'Use caution and observe the area from a safe distance',
          effect: { stamina: 1, shelter: 1 },
          isCorrect: true,
        },
        {
          label: 'Try to force through the barrier immediately',
          effect: { stamina: -2 },
          isCorrect: false,
        },
        {
          label: 'Move into the human-active area without checking',
          effect: { stamina: -1 },
          isCorrect: false,
        },
      ]),
      outcome: {
        correct: isAtRisk
          ? `${name} showed smart behaviour near conservationists. Stamina +1, Shelter +1`
          : `${name} stayed safe by being cautious. Stamina +1, Shelter +1`,
        incorrect: `${name} took an unnecessary risk. Wildlife needs to stay safe around human activity!`,
      },
    }
  }

  // Build 5 decisions by day, varying by year level
  const builders: Array<(day: number) => HabitatDecision> =
    yearLevel === 1
      ? [huntSituation, waterSituation, shelterSituation, huntSituation, waterSituation]
      : yearLevel === 2
      ? [huntSituation, waterSituation, predatorSituation, shelterSituation, energySituation]
      : [huntSituation, predatorSituation, energySituation, shelterSituation, conservationSituation]

  return builders.map((build, i) => build(i + 1))
}

// ─── 4. World Quest — Geography ───────────────────────────────────────────────

/**
 * UK cardinal / compass direction facts used for Year 1 / Year 2 questions.
 * Each entry is [region, direction, explanation].
 */
const UK_REGIONS: Array<[string, string, string]> = [
  ['Scotland', 'North', 'Scotland is in the north of the British Isles'],
  ['Wales', 'West', 'Wales is on the western side of Great Britain'],
  ['England', 'South', 'England covers the southern and central parts of Great Britain'],
  ['Northern Ireland', 'North-West', 'Northern Ireland is in the north-west, on the island of Ireland'],
  ['Cornwall', 'South-West', 'Cornwall is the most south-westerly county in England'],
  ['Yorkshire', 'North', 'Yorkshire is in the north of England'],
  ['London', 'South-East', 'London is in the south-east of England'],
]

/**
 * Biome-to-animal associations used for Year 2 biome-matching questions.
 */
const BIOME_ANIMALS: Record<string, string[]> = {
  urban: ['city pigeon', 'fox', 'rat', 'house sparrow'],
  tropical_rainforest: ['jaguar', 'toucan', 'tree frog', 'sloth'],
  savanna: ['lion', 'elephant', 'zebra', 'giraffe'],
  desert: ['camel', 'fennec fox', 'scorpion', 'roadrunner'],
  tundra: ['arctic fox', 'snowy owl', 'musk ox', 'caribou'],
  temperate_forest: ['deer', 'badger', 'red squirrel', 'woodpecker'],
  ocean: ['blue whale', 'great white shark', 'sea turtle', 'albatross'],
  freshwater: ['otter', 'kingfisher', 'salmon', 'water vole'],
  wetland: ['heron', 'frog', 'moorhen', 'reed warbler'],
  alpine: ['snow leopard', 'ibex', 'golden eagle', 'chamois'],
  coral_reef: ['clownfish', 'parrotfish', 'moray eel', 'sea urchin'],
  boreal_forest: ['wolf', 'moose', 'lynx', 'brown bear'],
}

/**
 * Generate card-specific geography questions for World Quest.
 *
 * Year 1: Country of origin, simple UK cardinal directions.
 * Year 2: Compass bearings, biome matching, regional climate.
 * Year 3: Latitude, migration, conservation status geography.
 */
export function generateWorldQuestQuestions(
  card: CollectedCard,
  yearLevel: 1 | 2 | 3,
  count: number
): ArcadeQuestion[] {
  const name = card.name
  const countries = card.countries ?? []
  const homeCountry = countries[0] ?? 'the United Kingdom'
  const region = card.worldQuestRegion ?? card.region ?? 'UK & Europe'
  const biome = card.biome ?? 'urban'
  const status = card.conservationStatus ?? 'Least Concern'
  const migrates = card.worldQuestMigrates ?? false
  const lat = card.coordinates?.lat ?? 52

  const questions: ArcadeQuestion[] = []

  if (yearLevel === 1) {
    // Q1: country of origin
    const wrongCountries = ['Australia', 'Brazil', 'Canada', 'Japan', 'Kenya', 'India']
      .filter(c => c !== homeCountry)
      .slice(0, 3)
    questions.push(
      withShuffledOptions(
        `Which country does the ${name} originally come from?`,
        homeCountry,
        wrongCountries,
        'geography',
        'wq-cq-1'
      )
    )

    // Q2-Q5: UK cardinal direction questions
    const ukQuestions = shuffle(UK_REGIONS).slice(0, 4)
    ukQuestions.forEach(([ukRegion, direction, _explanation], i) => {
      const wrongDirs = ['North', 'South', 'East', 'West', 'North-West', 'South-East']
        .filter(d => d !== direction)
        .slice(0, 3)
      questions.push(
        withShuffledOptions(
          `${ukRegion} is found in which part of the British Isles?`,
          direction,
          wrongDirs,
          'geography',
          `wq-cq-uk-${i}`
        )
      )
    })

    // Q6: continent question based on home country
    const COUNTRY_CONTINENTS: Record<string, string> = {
      'United Kingdom': 'Europe',
      'France': 'Europe',
      'Germany': 'Europe',
      'Spain': 'Europe',
      'Australia': 'Oceania',
      'India': 'Asia',
      'China': 'Asia',
      'Japan': 'Asia',
      'Brazil': 'South America',
      'Kenya': 'Africa',
      'South Africa': 'Africa',
      'Ethiopia': 'Africa',
      'Tanzania': 'Africa',
      'Canada': 'North America',
      'USA': 'North America',
      'Mexico': 'North America',
    }
    const continent = COUNTRY_CONTINENTS[homeCountry] ?? 'Europe'
    const wrongContinents = ['Africa', 'Asia', 'Europe', 'South America', 'Oceania', 'North America']
      .filter(c => c !== continent)
      .slice(0, 3)
    questions.push(
      withShuffledOptions(
        `${homeCountry}, where the ${name} comes from, is part of which continent?`,
        continent,
        wrongContinents,
        'geography',
        'wq-cq-continent'
      )
    )

    // Q7-Q10: more country and UK location questions, using region text
    questions.push(
      withShuffledOptions(
        `The ${name}'s home region is described as "${region}". Which country is this in?`,
        homeCountry,
        wrongCountries,
        'geography',
        'wq-cq-region'
      )
    )
  } else if (yearLevel === 2) {
    // Q1: home country
    const wrongCountries = ['Australia', 'Brazil', 'Canada', 'Japan', 'Kenya', 'India']
      .filter(c => c !== homeCountry)
      .slice(0, 3)
    questions.push(
      withShuffledOptions(
        `In which country would you most likely find a wild ${name}?`,
        homeCountry,
        wrongCountries,
        'geography',
        'wq-cq-2-country'
      )
    )

    // Q2: biome matching
    const biomeLabel = BIOME_LABELS[biome] ?? biome.replace(/_/g, ' ')
    const biomeAnimals = BIOME_ANIMALS[biome] ?? ['fox', 'rabbit', 'deer']
    const sharingAnimal = biomeAnimals[0]
    const wrongBiomes = Object.values(BIOME_LABELS).filter(b => b !== biomeLabel).slice(0, 3)
    questions.push(
      withShuffledOptions(
        `${capArticle(name)} ${name} lives in a ${biomeLabel} habitat. Which other animal shares this biome?`,
        sharingAnimal.charAt(0).toUpperCase() + sharingAnimal.slice(1),
        ['Snow leopard', 'Emperor penguin', 'Axolotl'].slice(0, 3),
        'geography',
        'wq-cq-2-biome'
      )
    )

    // Q3: compass bearing between UK regions
    const [ukRegion, direction] = UK_REGIONS[Math.floor(Math.random() * UK_REGIONS.length)]
    const compassDirs = ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West']
    const wrongDirs = compassDirs.filter(d => d !== direction).slice(0, 3)
    questions.push(
      withShuffledOptions(
        `Using compass directions, which way would you travel from London to reach ${ukRegion}?`,
        direction,
        wrongDirs,
        'geography',
        'wq-cq-2-compass'
      )
    )

    // Q4: climate for biome
    const BIOME_CLIMATES: Record<string, string> = {
      urban: 'mild and variable with human-built structures',
      tropical_rainforest: 'hot and very wet all year round',
      savanna: 'warm with distinct wet and dry seasons',
      desert: 'very hot days and cold nights with little rain',
      tundra: 'extremely cold with very little rainfall',
      temperate_forest: 'cool and moist with four seasons',
      ocean: 'cool to warm depending on depth and location',
      freshwater: 'variable, fed by rainfall and snowmelt',
      wetland: 'damp and humid with seasonal flooding',
      alpine: 'cold with heavy snow in winter',
      coral_reef: 'warm tropical waters with high clarity',
      boreal_forest: 'cold winters and short warm summers',
    }
    const climate = BIOME_CLIMATES[biome] ?? 'variable depending on season'
    const wrongClimates = Object.values(BIOME_CLIMATES).filter(c => c !== climate).slice(0, 3)
    questions.push(
      withShuffledOptions(
        `${capArticle(name)} ${name} lives in a ${biomeLabel}. What kind of climate does this habitat have?`,
        climate,
        wrongClimates,
        'geography',
        'wq-cq-2-climate'
      )
    )

    // Q5: conservation status geography
    questions.push(
      withShuffledOptions(
        `The ${name} is listed as "${status}". What does this mean for where it can be found?`,
        status === 'Least Concern'
          ? 'It is found in many places and not at immediate risk'
          : 'Its range is limited and it needs protection',
        [
          'It only lives in one country',
          'It has gone extinct in the wild',
          'It migrates every year without fail',
        ],
        'geography',
        'wq-cq-2-status'
      )
    )

    // Q6-Q10: fill remaining with biome and country questions
    const extraBiomes = Object.entries(BIOME_ANIMALS).filter(([b]) => b !== biome).slice(0, 5)
    extraBiomes.forEach(([b, animals], i) => {
      const bLabel = BIOME_LABELS[b] ?? b
      questions.push(
        withShuffledOptions(
          `The ${animals[0]} lives in a ${bLabel} habitat. What continent most features this biome?`,
          b === 'tropical_rainforest' ? 'South America / Africa'
            : b === 'savanna' ? 'Africa'
            : b === 'tundra' ? 'Arctic regions'
            : b === 'desert' ? 'Africa / Asia'
            : b === 'alpine' ? 'Asia / Europe'
            : 'Worldwide',
          ['Only Antarctica', 'Only Australia', 'Only North America'],
          'geography',
          `wq-cq-2-extra-${i}`
        )
      )
    })
  } else {
    // Year 3: latitude, migration, conservation impact

    // Q1: latitude band
    const latBand =
      lat > 66 ? 'Arctic circle (above 66 degrees north)'
      : lat > 45 ? 'Northern temperate zone (45 to 66 degrees north)'
      : lat > 23 ? 'Northern subtropics (23 to 45 degrees north)'
      : lat > 0  ? 'Northern tropics (0 to 23 degrees north)'
      : lat > -23 ? 'Southern tropics (0 to 23 degrees south)'
      : lat > -45 ? 'Southern subtropics (23 to 45 degrees south)'
      : 'Southern temperate or polar zone (below 45 degrees south)'

    questions.push(
      withShuffledOptions(
        `The ${name} lives at approximately ${round(lat, 1)} degrees latitude. Which latitude band is this?`,
        latBand,
        [
          'Arctic circle (above 66 degrees north)',
          'Southern tropics (0 to 23 degrees south)',
          'Southern temperate or polar zone (below 45 degrees south)',
        ].filter(b => b !== latBand).slice(0, 3),
        'geography',
        'wq-cq-3-lat'
      )
    )

    // Q2: migration
    questions.push(
      withShuffledOptions(
        `Does the ${name} migrate between different regions each year?`,
        migrates ? 'Yes, it migrates seasonally' : 'No, it stays in the same region year-round',
        migrates
          ? ['No, it stays in the same region year-round', 'Only juveniles migrate', 'It migrates every decade']
          : ['Yes, it migrates seasonally', 'Only juveniles migrate', 'It hibernates and migrates'],
        'geography',
        'wq-cq-3-migrate'
      )
    )

    // Q3: conservation status meaning
    const STATUS_GEO: Record<string, string> = {
      'Least Concern':    'Found widely across its natural range',
      'Near Threatened':  'Populations are declining and range is shrinking',
      'Vulnerable':       'Has lost significant habitat and range in recent decades',
      'Endangered':       'Limited to small, fragmented populations in a restricted range',
      'Critically Endangered': 'Reduced to very few individuals in isolated locations',
      'Extinct in the Wild':   'No longer exists in any natural habitat',
    }
    const statusGeo = STATUS_GEO[status] ?? 'Monitored across its natural range'
    const wrongStatusGeo = Object.values(STATUS_GEO).filter(s => s !== statusGeo).slice(0, 3)
    questions.push(
      withShuffledOptions(
        `The ${name} is "${status}". What does this suggest about its geographic range?`,
        statusGeo,
        wrongStatusGeo,
        'geography',
        'wq-cq-3-status'
      )
    )

    // Q4: biome geography
    const biomeLabel = BIOME_LABELS[biome] ?? biome.replace(/_/g, ' ')
    questions.push(
      withShuffledOptions(
        `The ${name} lives in a ${biomeLabel}. How does human activity most often affect this habitat?`,
        biome === 'urban' ? 'Urban expansion creates habitat for some species while displacing others'
          : biome === 'tropical_rainforest' ? 'Deforestation reduces available habitat rapidly'
          : biome === 'ocean' ? 'Pollution and warming waters affect marine ecosystems'
          : biome === 'coral_reef' ? 'Ocean warming causes coral bleaching and loss of reef habitat'
          : 'Land use changes and development reduce available wild habitat',
        [
          'Human activity never affects natural habitats',
          'All habitats are fully protected worldwide',
          'Animals always adapt successfully to human changes',
        ],
        'geography',
        'wq-cq-3-biome'
      )
    )

    // Q5-Q10: latitude and geography fill
    const latQuestions: Array<[number, string]> = [
      [0, 'equator (0 degrees)'],
      [23, 'Tropic of Cancer (23 degrees north)'],
      [45, 'mid-latitudes (45 degrees north)'],
      [66, 'Arctic Circle (66 degrees north)'],
      [-23, 'Tropic of Capricorn (23 degrees south)'],
      [-45, 'mid southern latitudes (45 degrees south)'],
    ]
    latQuestions.forEach(([latVal, desc], i) => {
      questions.push(
        withShuffledOptions(
          `Which major geographic line runs close to ${latVal} degrees latitude?`,
          desc,
          latQuestions.filter(([l]) => l !== latVal).map(([, d]) => d).slice(0, 3),
          'geography',
          `wq-cq-3-latline-${i}`
        )
      )
    })
  }

  const unique = shuffle(questions).filter(
    (q, i, arr) => arr.findIndex(x => x.question === q.question) === i
  )
  return unique.slice(0, count)
}
