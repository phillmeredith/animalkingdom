// GenerateScreen — 7-step wizard controller + state machine
// Steps: Category → Type → Gender → Age → Personality → Breed → Colour
// After step 7: GeneratingOverlay (1.5s) → ResultsScreen

import { useState, useEffect, useCallback } from 'react'
import {
  Home, Building2, Wheat, Dna, Leaf, Waves,
  PawPrint, User, UserRound,
  Baby, Sprout, Zap, Star, GraduationCap,
  Flame, Flower2, Smile, Search, Heart, Skull, Crown, Moon, Sun, Brain, Map,
} from 'lucide-react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

import { WizardHeader } from '@/components/generate/WizardHeader'
import { OptionGrid } from '@/components/generate/OptionGrid'
import { GeneratingOverlay } from '@/components/generate/GeneratingOverlay'
import { ResultsScreen } from '@/components/generate/ResultsScreen'
import { AdoptionOverlay } from '@/components/generate/AdoptionOverlay'
import { TraderPuzzle } from '@/components/generate/TraderPuzzle'

import {
  CATEGORIES,
  TYPES_BY_CATEGORY,
  GENDERS,
  AGES,
  PERSONALITIES,
  BREEDS_BY_TYPE,
  ALL_TYPES,
  generateNames,
  generateNarrative,
  determineRarity,
  getColours,
  TRADER_QUESTIONS,
} from '@/data/generateOptions'
import type { CompleteSelections, TraderQuestion } from '@/data/generateOptions'
import type { AnimalCategory } from '@/data/animals'

import { useSavedNames, useNameHistory, useProgress } from '@/hooks'
import { useReducedMotion } from '@/hooks'
import { useToast } from '@/components/ui/Toast'

// ─── Wizard state ─────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7

interface Selections {
  category: AnimalCategory | null
  animalType: string | null
  gender: 'Male' | 'Female' | null
  age: string | null
  personality: string | null
  breed: string | null
  colour: string | null
}

const EMPTY_SELECTIONS: Selections = {
  category: null,
  animalType: null,
  gender: null,
  age: null,
  personality: null,
  breed: null,
  colour: null,
}

const STEP_KEYS: Record<Step, keyof Selections> = {
  1: 'category',
  2: 'animalType',
  3: 'gender',
  4: 'age',
  5: 'personality',
  6: 'breed',
  7: 'colour',
}

const STEP_TITLES: Record<Step, string> = {
  1: 'Where does your animal live?',
  2: 'What kind of animal?',
  3: 'Choose a gender',
  4: 'How old?',
  5: "What's their personality?",
  6: 'Choose a breed',
  7: 'Choose a colour',
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GenerateScreen() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()

  const { adoptPet } = useSavedNames()
  const { addToHistory } = useNameHistory()
  const { getRecentQuestions, checkBadgeEligibility } = useProgress()
  const { toast } = useToast()

  // Wizard state
  const [step, setStep] = useState<Step>(1)
  const [selections, setSelections] = useState<Selections>(EMPTY_SELECTIONS)

  // Post-step-7 state
  const [generating, setGenerating] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [generatedNames, setGeneratedNames] = useState<string[]>([])
  const [generatedNarrative, setGeneratedNarrative] = useState('')
  const [generatedRarity, setGeneratedRarity] = useState<CompleteSelections['rarity']>('common')
  const [adopting, setAdopting] = useState(false)

  // Adoption overlay
  const [adoptedName, setAdoptedName] = useState('')
  const [showAdoptionOverlay, setShowAdoptionOverlay] = useState(false)

  // TraderPuzzle
  const [traderQuestion, setTraderQuestion] = useState<TraderQuestion | null>(null)
  const [showTrader, setShowTrader] = useState(false)

  // ─── Query param pre-fill ─────────────────────────────────────────────────
  useEffect(() => {
    const typeParam = searchParams.get('type')
    const breedParam = searchParams.get('breed')

    if (!typeParam) return

    const typeOption = ALL_TYPES.find(t => t.value === typeParam)
    if (!typeOption) return

    setSelections(s => ({
      ...s,
      category: typeOption.category,
      animalType: typeParam,
      ...(breedParam ? { breed: breedParam } : {}),
    }))

    if (breedParam) {
      // Check if the pre-filled breed is gated — if so, show the locked breed grid
      // instead of auto-advancing past it, so the player sees the locked card.
      const breeds = BREEDS_BY_TYPE[typeParam] ?? []
      const breedData = breeds.find(b => b.value === breedParam)
      const isGated =
        breedData?.rarity === 'rare' ||
        breedData?.rarity === 'epic' ||
        breedData?.rarity === 'legendary'

      if (isGated) {
        setStep(6) // stay on breed step — locked card is visible, breed is NOT selected
        setSelections(s => ({ ...s, breed: null })) // clear the gated breed from selections
      } else {
        setStep(3) // skip to gender for unlocked breeds
      }
    } else {
      setStep(6) // skip to breed
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Icon maps for wizard steps ───────────────────────────────────────────
  const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    'At Home':    <Home size={28} />,
    'Stables':    <Building2 size={28} />,
    'Farm':       <Wheat size={28} />,
    'Lost World': <Dna size={28} />,
    'Wild':       <Leaf size={28} />,
    'Sea':        <Waves size={28} />,
  }
  const GENDER_ICONS: Record<string, React.ReactNode> = {
    'Male':   <User size={28} />,
    'Female': <UserRound size={28} />,
  }
  const AGE_ICONS: Record<string, React.ReactNode> = {
    'Newborn':   <Baby size={28} />,
    'Baby':      <Sprout size={28} />,
    'Young':     <Zap size={28} />,
    'Adult':     <Star size={28} />,
    'Old Timer': <GraduationCap size={28} />,
  }
  const PERSONALITY_ICONS: Record<string, React.ReactNode> = {
    'Brave':       <Flame size={28} />,
    'Gentle':      <Flower2 size={28} />,
    'Playful':     <Smile size={28} />,
    'Curious':     <Search size={28} />,
    'Loyal':       <Heart size={28} />,
    'Mischievous': <Skull size={28} />,
    'Proud':       <Crown size={28} />,
    'Shy':         <Moon size={28} />,
    'Fierce':      <Zap size={28} />,
    'Cheerful':    <Sun size={28} />,
    'Clever':      <Brain size={28} />,
    'Adventurous': <Map size={28} />,
  }

  // ─── Build option list for current step ───────────────────────────────────
  function buildOptions() {
    switch (step) {
      case 1:
        return CATEGORIES.map(c => ({ value: c.value, icon: CATEGORY_ICONS[c.value], label: c.value }))
      case 2: {
        const types = selections.category ? TYPES_BY_CATEGORY[selections.category] : []
        return types.map(t => ({ value: t.value, icon: <PawPrint size={28} />, label: t.value }))
      }
      case 3:
        return GENDERS.map(g => ({ value: g.value, icon: GENDER_ICONS[g.value], label: g.value }))
      case 4:
        return AGES.map(a => ({
          value: a.value,
          icon: AGE_ICONS[a.value],
          label: a.value,
          description: a.description,
        }))
      case 5:
        return PERSONALITIES.map(p => ({
          value: p.value,
          icon: PERSONALITY_ICONS[p.value],
          label: p.value,
          description: p.description,
        }))
      case 6: {
        const breeds = selections.animalType ? (BREEDS_BY_TYPE[selections.animalType] ?? []) : []
        return breeds.map(b => {
          const isLocked = b.rarity === 'rare' || b.rarity === 'epic' || b.rarity === 'legendary'
          return {
            value: b.value,
            imageUrl: b.imageUrl,
            label: b.label,
            description: b.rarity,
            locked: isLocked,
          }
        })
      }
      case 7: {
        const colours = selections.animalType ? getColours(selections.animalType) : []
        return colours.map(c => ({ value: c.value, label: c.label, hex: c.hex }))
      }
    }
  }

  function getSelectedValue(): string | null {
    const key = STEP_KEYS[step]
    const val = selections[key]
    if (!val) return null
    return String(val)
  }

  // ─── Selection handler ────────────────────────────────────────────────────
  async function handleSelect(value: string) {
    const key = STEP_KEYS[step]
    const newSelections = { ...selections, [key]: value }
    setSelections(newSelections)

    // Clear downstream selections when changing early steps
    if (step === 1) {
      newSelections.animalType = null
      newSelections.breed = null
      newSelections.colour = null
    } else if (step === 2) {
      newSelections.breed = null
      newSelections.colour = null
    }

    if (step < 7) {
      setTimeout(() => {
        setStep((step + 1) as Step)
      }, 150)
    } else {
      // Step 7 complete — trigger generation
      await triggerGeneration({ ...newSelections, colour: value })
    }
  }

  async function triggerGeneration(finalSelections: Selections) {
    if (
      !finalSelections.animalType ||
      !finalSelections.gender ||
      !finalSelections.personality ||
      !finalSelections.breed ||
      !finalSelections.colour
    ) return

    setGenerating(true)

    const breedData = BREEDS_BY_TYPE[finalSelections.animalType]?.find(
      b => b.value === finalSelections.breed,
    )
    const rarity = determineRarity(breedData?.rarity ?? 'common')

    const names = generateNames(
      finalSelections.animalType,
      finalSelections.gender,
      finalSelections.personality,
    )
    const safeNames = names.length > 0 ? names : ['Buddy', 'Luna', 'Star']

    const complete: CompleteSelections = {
      category: finalSelections.category!,
      animalType: finalSelections.animalType,
      gender: finalSelections.gender,
      age: finalSelections.age as CompleteSelections['age'],
      personality: finalSelections.personality,
      breed: finalSelections.breed,
      colour: finalSelections.colour,
      rarity,
    }
    const narrative = generateNarrative(complete)

    setGeneratedNames(safeNames)
    setGeneratedNarrative(narrative)
    setGeneratedRarity(rarity)

    // Write history (non-blocking, non-critical)
    addToHistory({
      animalType: finalSelections.animalType,
      breed: finalSelections.breed,
      category: finalSelections.category ?? '',
      gender: finalSelections.gender,
      age: finalSelections.age ?? '',
      personality: finalSelections.personality,
      colour: finalSelections.colour,
      suggestedNames: safeNames,
      discoveryNarrative: narrative,
    })

    // Fake 1.5s delay (reduced motion: instant)
    await new Promise(r => setTimeout(r, reducedMotion ? 0 : 1500))
    setGenerating(false)
    setShowResults(true)
  }

  // ─── Back handler ─────────────────────────────────────────────────────────
  function handleBack() {
    if (showResults) {
      setShowResults(false)
      setStep(7)
      return
    }
    if (step === 1) {
      navigate(-1)
      return
    }
    // Clear this step's selection and go back
    const key = STEP_KEYS[step]
    setSelections(s => ({ ...s, [key]: null }))
    setStep((step - 1) as Step)
  }

  // ─── Adopt handler ────────────────────────────────────────────────────────
  async function handleAdopt(name: string) {
    if (!selections.animalType || !selections.breed || !selections.gender || !selections.category) return

    setAdopting(true)
    try {
      const breedData = BREEDS_BY_TYPE[selections.animalType]?.find(
        b => b.value === selections.breed,
      )

      await adoptPet({
        name,
        animalType: selections.animalType,
        breed: selections.breed,
        category: selections.category as any,
        gender: (selections.gender?.toLowerCase() ?? 'male') as 'male' | 'female',
        age: (selections.age ?? 'Young') as any,
        personality: selections.personality ?? '',
        colour: selections.colour ?? '',
        rarity: generatedRarity,
        imageUrl: breedData?.imageUrl ?? '',
        barnName: null,
        showName: null,
        racingName: null,
        kennelName: null,
        pedigreeName: null,
        speciesName: null,
        discoveryNarrative: generatedNarrative,
        siblings: [],
        source: 'generate',
        status: 'active',
        equippedSaddleId: null,
        careStreak: 0,
        lastFullCareDate: null,
      })

      // Badge eligibility check after a new animal is generated and adopted.
      // Non-blocking: errors must not propagate to the caller or suppress the adoption flow.
      checkBadgeEligibility()
        .then(newBadges => {
          newBadges.forEach((badge, i) => {
            setTimeout(() => {
              toast({
                type:        'success',
                title:       badge.name,
                description: 'You earned a badge!',
                duration:    6000,
              })
            }, i * 400)
          })
        })
        .catch(err =>
          toast({ type: 'error', title: 'Badge check failed', description: (err as Error).message ?? 'Something went wrong' })
        )

      setAdoptedName(name)
      setShowResults(false)
      setShowAdoptionOverlay(true)
    } catch (err) {
      toast({ type: 'error', title: err instanceof Error ? err.message : 'Could not adopt animal. Please try again.' })
    } finally {
      setAdopting(false)
    }
  }

  // ─── Post-adoption flow ───────────────────────────────────────────────────
  const handleAdoptionDismiss = useCallback(async () => {
    setShowAdoptionOverlay(false)

    // 50% chance of TraderPuzzle
    if (Math.random() < 0.5) {
      // Pick a question not recently seen
      const areas = ['maths', 'spelling', 'science', 'geography'] as const
      const area = areas[Math.floor(Math.random() * areas.length)]
      const recent = await getRecentQuestions(area, 10)
      const available = TRADER_QUESTIONS.filter(
        q => q.area === area && !recent.includes(q.questionId),
      )
      const pool = available.length > 0 ? available : TRADER_QUESTIONS.filter(q => q.area === area)
      if (pool.length > 0) {
        setTraderQuestion(pool[Math.floor(Math.random() * pool.length)])
        setShowTrader(true)
        return
      }
    }

    navigate('/')
  }, [getRecentQuestions, navigate])

  function handleTraderComplete() {
    setShowTrader(false)
    navigate('/')
  }

  // ─── Reset ────────────────────────────────────────────────────────────────
  function handleGenerateAgain() {
    setSelections(EMPTY_SELECTIONS)
    setShowResults(false)
    setGeneratedNames([])
    setStep(1)
  }

  // ─── Derive image for results ─────────────────────────────────────────────
  const breedImageUrl = selections.animalType && selections.breed
    ? (BREEDS_BY_TYPE[selections.animalType]?.find(b => b.value === selections.breed)?.imageUrl ?? '')
    : ''

  // ─── Render ───────────────────────────────────────────────────────────────

  // Adoption overlay + TraderPuzzle sit above everything
  if (showAdoptionOverlay || showTrader) {
    return (
      <>
        <AdoptionOverlay
          visible={showAdoptionOverlay}
          petName={adoptedName}
          onDismiss={handleAdoptionDismiss}
        />
        <TraderPuzzle
          visible={showTrader}
          question={traderQuestion}
          onComplete={handleTraderComplete}
        />
      </>
    )
  }

  // Results screen
  if (showResults && selections.animalType && selections.gender && selections.personality && selections.breed && selections.colour && selections.category) {
    const complete: CompleteSelections = {
      category: selections.category,
      animalType: selections.animalType,
      gender: selections.gender,
      age: (selections.age ?? 'Young') as CompleteSelections['age'],
      personality: selections.personality,
      breed: selections.breed,
      colour: selections.colour,
      rarity: generatedRarity,
    }
    return (
      <ResultsScreen
        names={generatedNames}
        narrative={generatedNarrative}
        imageUrl={breedImageUrl}
        rarity={generatedRarity}
        selections={complete}
        onAdopt={handleAdopt}
        onGenerateAgain={handleGenerateAgain}
        onStartOver={handleGenerateAgain}
        adopting={adopting}
      />
    )
  }

  // Wizard steps
  const options = buildOptions()

  return (
    <div className="relative flex flex-col h-full bg-[var(--bg)] overflow-hidden">
      {/* Generating overlay sits on top of wizard */}
      <GeneratingOverlay visible={generating} />

      <WizardHeader
        step={step}
        onBack={handleBack}
        showBack={step > 1}
      />

      {/* Step question */}
      <div className="px-6 pt-4 pb-5 shrink-0 max-w-3xl mx-auto w-full">
        <h2 className="text-[22px] font-600 text-t1">{STEP_TITLES[step]}</h2>
        {step === 2 && selections.animalType && (
          <p className="text-[14px] text-t2 mt-1">living in {selections.category}</p>
        )}
        {step === 3 && selections.animalType && (
          <p className="text-[14px] text-t2 mt-1">for your {selections.animalType}</p>
        )}
        {step === 4 && selections.animalType && (
          <p className="text-[14px] text-t2 mt-1">
            How old is your {selections.animalType}?
          </p>
        )}
      </div>

      {/* Options */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          className="flex-1 overflow-hidden flex flex-col"
          initial={{ opacity: 0, x: reducedMotion ? 0 : 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: reducedMotion ? 0 : -24 }}
          transition={{ duration: reducedMotion ? 0 : 0.2 }}
        >
          <OptionGrid
            options={options}
            selected={getSelectedValue()}
            onSelect={handleSelect}
            columns={step === 6 ? 'responsive-breed' : undefined}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
