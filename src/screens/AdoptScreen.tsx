// AdoptScreen — 3-step adoption journey for a specific catalog animal
// Steps: Gender → Age → Personality → Name results
// Reached from Explore "Adopt a [name]" — the animal is already chosen.
// Questions are framed as picking details for this specific animal.

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  User, UserRound,
  Baby, Sprout, Zap, Star, GraduationCap,
  Flame, Flower2, Smile, Search, Heart, Skull, Crown, Moon, Sun, Brain, Map,
} from 'lucide-react'

import { WizardHeader } from '@/components/generate/WizardHeader'
import { OptionGrid } from '@/components/generate/OptionGrid'
import { GeneratingOverlay } from '@/components/generate/GeneratingOverlay'
import { ResultsScreen } from '@/components/generate/ResultsScreen'
import { AdoptionOverlay } from '@/components/generate/AdoptionOverlay'
import { TraderPuzzle } from '@/components/generate/TraderPuzzle'

import {
  GENDERS,
  AGES,
  PERSONALITIES,
  BREEDS_BY_TYPE,
  generateNames,
  generateNarrative,
  determineRarity,
  TRADER_QUESTIONS,
} from '@/data/generateOptions'
import type { CompleteSelections, TraderQuestion } from '@/data/generateOptions'
import type { AnimalCategory } from '@/data/animals'

import { useSavedNames, useNameHistory, useProgress } from '@/hooks'
import { useReducedMotion } from '@/hooks'
import { useToast } from '@/components/ui/Toast'

// ─── Types ────────────────────────────────────────────────────────────────────

type AdoptStep = 1 | 2 | 3   // gender | age | personality

interface AdoptSelections {
  gender: 'Male' | 'Female' | null
  age: string | null
  personality: string | null
}

const EMPTY: AdoptSelections = { gender: null, age: null, personality: null }

// ─── Component ────────────────────────────────────────────────────────────────

export function AdoptScreen() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()
  const { adoptPet } = useSavedNames()
  const { addToHistory } = useNameHistory()
  const { getRecentQuestions, checkBadgeEligibility } = useProgress()
  const { toast } = useToast()

  // Animal info from URL params
  const animalName    = searchParams.get('name')     ?? ''
  const animalType    = searchParams.get('animalType') ?? ''
  const animalCategory = (searchParams.get('category') ?? 'Wild') as AnimalCategory
  const animalBreed   = searchParams.get('breed')    ?? animalName
  const animalImageUrl = searchParams.get('imageUrl') ?? ''

  const [step, setStep] = useState<AdoptStep>(1)
  const [selections, setSelections] = useState<AdoptSelections>(EMPTY)

  // Post-wizard state
  const [generating, setGenerating] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [generatedNames, setGeneratedNames] = useState<string[]>([])
  const [generatedNarrative, setGeneratedNarrative] = useState('')
  const [generatedRarity, setGeneratedRarity] = useState<CompleteSelections['rarity']>('common')
  const [adopting, setAdopting] = useState(false)
  const [adoptedName, setAdoptedName] = useState('')
  const [showAdoptionOverlay, setShowAdoptionOverlay] = useState(false)
  const [traderQuestion, setTraderQuestion] = useState<TraderQuestion | null>(null)
  const [showTrader, setShowTrader] = useState(false)

  // Redirect if no animal info provided
  useEffect(() => {
    if (!animalName) navigate('/explore', { replace: true })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Icon maps ──────────────────────────────────────────────────────────────

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

  // ─── Step config ────────────────────────────────────────────────────────────

  const STEP_TITLE: Record<AdoptStep, string> = {
    1: `Is your ${animalName} a boy or a girl?`,
    2: `How old is your ${animalName}?`,
    3: `What's your ${animalName} like?`,
  }

  function buildOptions() {
    switch (step) {
      case 1: return GENDERS.map(g => ({ value: g.value, icon: GENDER_ICONS[g.value], label: g.value }))
      case 2: return AGES.map(a => ({ value: a.value, icon: AGE_ICONS[a.value], label: a.value, description: a.description }))
      case 3: return PERSONALITIES.map(p => ({ value: p.value, icon: PERSONALITY_ICONS[p.value], label: p.value, description: p.description }))
    }
  }

  function getSelectedValue(): string | null {
    if (step === 1) return selections.gender
    if (step === 2) return selections.age
    return selections.personality
  }

  // ─── Handlers ───────────────────────────────────────────────────────────────

  async function handleSelect(value: string) {
    if (step === 1) {
      setSelections(s => ({ ...s, gender: value as 'Male' | 'Female' }))
      setTimeout(() => setStep(2), 150)
    } else if (step === 2) {
      setSelections(s => ({ ...s, age: value }))
      setTimeout(() => setStep(3), 150)
    } else {
      // Step 3 — personality picked, trigger generation
      const finalSelections = { ...selections, personality: value }
      setSelections(finalSelections)
      await triggerGeneration(finalSelections)
    }
  }

  async function triggerGeneration(final: AdoptSelections) {
    if (!final.gender || !final.personality) return

    setGenerating(true)

    const breedData = BREEDS_BY_TYPE[animalType]?.find(b => b.value === animalBreed)
    const rarity = determineRarity(breedData?.rarity ?? 'common')

    const names = generateNames(animalType || animalName, final.gender, final.personality)
    const safeNames = names.length > 0 ? names : ['Buddy', 'Luna', 'Star']

    const complete: CompleteSelections = {
      category: animalCategory,
      animalType: animalType || animalName,
      gender: final.gender,
      age: (final.age ?? 'Young') as CompleteSelections['age'],
      personality: final.personality,
      breed: animalBreed,
      colour: '',
      rarity,
    }
    const narrative = generateNarrative(complete)

    setGeneratedNames(safeNames)
    setGeneratedNarrative(narrative)
    setGeneratedRarity(rarity)

    addToHistory({
      animalType: animalType || animalName,
      breed: animalBreed,
      category: animalCategory,
      gender: final.gender,
      age: final.age ?? 'Young',
      personality: final.personality,
      colour: '',
      suggestedNames: safeNames,
      discoveryNarrative: narrative,
    })

    await new Promise(r => setTimeout(r, reducedMotion ? 0 : 1500))
    setGenerating(false)
    setShowResults(true)
  }

  function handleBack() {
    if (showResults) { setShowResults(false); setStep(3); return }
    if (step === 1) { navigate(-1); return }
    if (step === 2) { setSelections(s => ({ ...s, age: null })); setStep(1); return }
    setSelections(s => ({ ...s, personality: null })); setStep(2)
  }

  async function handleAdopt(name: string) {
    if (!selections.gender) return
    setAdopting(true)
    try {
      await adoptPet({
        name,
        animalType: animalType || animalName,
        breed: animalBreed,
        category: animalCategory as any,
        gender: (selections.gender.toLowerCase()) as 'male' | 'female',
        age: (selections.age ?? 'Young') as any,
        personality: selections.personality ?? '',
        colour: '',
        rarity: generatedRarity,
        imageUrl: animalImageUrl,
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

      checkBadgeEligibility()
        .then(newBadges => {
          newBadges.forEach((badge, i) => {
            setTimeout(() => {
              toast({ type: 'success', title: badge.name, description: 'You earned a badge!', duration: 6000 })
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

  const handleAdoptionDismiss = useCallback(async () => {
    setShowAdoptionOverlay(false)
    if (Math.random() < 0.5) {
      const areas = ['maths', 'spelling', 'science', 'geography'] as const
      const area = areas[Math.floor(Math.random() * areas.length)]
      const recent = await getRecentQuestions(area, 10)
      const available = TRADER_QUESTIONS.filter(q => q.area === area && !recent.includes(q.questionId))
      const pool = available.length > 0 ? available : TRADER_QUESTIONS.filter(q => q.area === area)
      if (pool.length > 0) {
        setTraderQuestion(pool[Math.floor(Math.random() * pool.length)])
        setShowTrader(true)
        return
      }
    }
    navigate('/')
  }, [getRecentQuestions, navigate])

  function handleTraderComplete() { setShowTrader(false); navigate('/') }
  function handleGenerateAgain() { setSelections(EMPTY); setShowResults(false); setGeneratedNames([]); setStep(1) }

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (showAdoptionOverlay || showTrader) {
    return (
      <>
        <AdoptionOverlay visible={showAdoptionOverlay} petName={adoptedName} onDismiss={handleAdoptionDismiss} />
        <TraderPuzzle visible={showTrader} question={traderQuestion} onComplete={handleTraderComplete} />
      </>
    )
  }

  if (showResults && selections.gender && selections.personality) {
    const complete: CompleteSelections = {
      category: animalCategory,
      animalType: animalType || animalName,
      gender: selections.gender,
      age: (selections.age ?? 'Young') as CompleteSelections['age'],
      personality: selections.personality,
      breed: animalBreed,
      colour: '',
      rarity: generatedRarity,
    }
    return (
      <ResultsScreen
        names={generatedNames}
        narrative={generatedNarrative}
        imageUrl={animalImageUrl}
        rarity={generatedRarity}
        selections={complete}
        onAdopt={handleAdopt}
        onGenerateAgain={handleGenerateAgain}
        onStartOver={handleGenerateAgain}
        adopting={adopting}
      />
    )
  }

  const options = buildOptions()

  return (
    <div className="relative flex flex-col h-full bg-[var(--bg)] overflow-hidden">
      <GeneratingOverlay visible={generating} />

      <WizardHeader
        step={step}
        totalSteps={3}
        onBack={handleBack}
        showBack={true}
      />

      {/* Step question */}
      <div className="px-6 pt-4 pb-5 shrink-0 max-w-3xl mx-auto w-full">
        <h2 className="text-[22px] font-600 text-t1">{STEP_TITLE[step]}</h2>
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
          />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
