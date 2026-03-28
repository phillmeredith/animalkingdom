// AnimalProfileSheet — BottomSheet showing animal facts + stealth quiz + Generate CTA

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { MapPin, ShoppingBag } from 'lucide-react'
import { BottomSheet } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { AnimalImage } from '@/components/ui/AnimalImage'
import { RarityBadge } from '@/components/ui/Badge'
import { StealthQuiz } from './StealthQuiz'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useProgress } from '@/hooks/useProgress'
import { useWallet } from '@/hooks/useWallet'
import { useToast } from '@/components/ui/Toast'
import type { AnimalEntry } from '@/data/animals'

// Session-level deduplication: don't show same quiz twice per session
const shownQuizIds = new Set<string>()

interface AnimalProfileSheetProps {
  animal: AnimalEntry | null
  onClose: () => void
  /** Called when the user taps "Learn More". The sheet clears its quiz timer and
   *  calls this before calling onClose(). The parent is responsible for mounting
   *  AnimalDetailModal after the 100ms transition overlap delay. */
  onViewMore?: () => void
}

export function AnimalProfileSheet({ animal, onClose, onViewMore }: AnimalProfileSheetProps) {
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()
  const { addXp, recordAnswer } = useProgress()
  const { earn } = useWallet()
  const { toast } = useToast()

  const [quizVisible, setQuizVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset quiz state and set timer whenever a new animal opens
  useEffect(() => {
    if (!animal) return
    setQuizVisible(false)

    if (!animal.quiz) return  // generated catalog entries have no quiz

    const alreadySeen = shownQuizIds.has(animal.quiz.questionId)
    if (alreadySeen) return

    const shouldShow = Math.random() < 0.5
    if (!shouldShow) return

    timerRef.current = setTimeout(() => {
      setQuizVisible(true)
      shownQuizIds.add(animal.quiz!.questionId)
    }, 8000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [animal?.id])

  function handleQuizComplete(correct: boolean) {
    if (!animal || !animal.quiz) return
    const { area, questionId } = animal.quiz
    recordAnswer(area, questionId, 1, correct).catch(() => {
      toast({ type: 'error', title: 'Could not save quiz answer' })
    })
    if (correct) {
      addXp(area, 5).catch(() => {
        toast({ type: 'error', title: 'Could not save XP' })
      })
      earn(5, 'Explore quiz', 'arcade').catch(() => {
        toast({ type: 'error', title: 'Could not award coins' })
      })
    } else {
      earn(1, 'Explore quiz effort', 'arcade').catch(() => {
        toast({ type: 'error', title: 'Could not award coins' })
      })
    }
  }

  function handleViewMore() {
    if (!animal) return
    // Clear the quiz timer so it cannot fire mid-transition or on the detail modal.
    // This is a discard, not a pause — the timer does not resume when the modal closes.
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setQuizVisible(false)
    // Call the parent's onViewMore first, then onClose so the sheet begins its exit.
    // The parent delays mounting AnimalDetailModal by 100ms to create the visual overlap.
    onViewMore?.()
    onClose()
  }

  function handleGenerate() {
    if (!animal) return
    onClose()
    navigate(`/generate?type=${encodeURIComponent(animal.animalType)}&breed=${encodeURIComponent(animal.breed)}`)
  }

  function handleMarketplace() {
    onClose()
    navigate('/shop')
  }

  const isGated =
    animal?.rarity === 'rare' ||
    animal?.rarity === 'epic' ||
    animal?.rarity === 'legendary'

  return (
    <BottomSheet isOpen={!!animal} onClose={onClose}>
      {animal && (
        <div className="pb-6">
          <div className="px-6 pt-4">
            {/* Hero row — thumbnail + name/meta */}
            <div className="flex items-center gap-4 mb-4">
              <AnimalImage
                src={animal.imageUrl}
                alt={animal.name}
                className="w-20 h-20 rounded-xl object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h2 className="text-[20px] font-700 text-t1 leading-tight truncate">{animal.name}</h2>
                  <RarityBadge rarity={animal.rarity} className="shrink-0" />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className="inline-flex items-center px-3 py-1 rounded-pill text-[11px] font-700 uppercase tracking-wide bg-[var(--elev)] border border-[var(--border-s)] text-t3">
                    {animal.category}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats + region row */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              {[
                { label: 'HABITAT', value: animal.habitat },
                { label: 'DIET', value: animal.diet },
                { label: 'LIFESPAN', value: animal.lifespan },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className="text-[10px] font-700 uppercase tracking-wide text-t3">{label}</span>
                  <span className="text-[13px] font-600 text-t1">{value}</span>
                </div>
              ))}
              <span className="inline-flex items-center gap-1 text-[12px] text-t3">
                <MapPin size={12} className="text-[var(--t3)] shrink-0" />
                {animal.region}
              </span>
            </div>

            {/* Facts — only rendered for hand-crafted entries that have fact data */}
            {animal.facts && animal.facts.length > 0 && (
              <div className="mt-6">
                <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--t3)] mb-3">
                  Facts
                </p>
                <ul className="flex flex-col gap-3">
                  {animal.facts.map((fact, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                        style={{ backgroundColor: 'var(--blue)' }}
                      />
                      <span className="text-[13px] text-[var(--t2)] leading-snug">{fact}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Learn More — opens full-screen detail modal (EAD-2 / EAD-3) */}
            <div className="mt-6">
              <Button
                variant="outline"
                size="md"
                className="w-full"
                onClick={handleViewMore}
              >
                Learn More
              </Button>
            </div>

            {/* Stealth Quiz — only for entries with quiz data */}
            <AnimatePresence>
              {quizVisible && animal.quiz && (
                <StealthQuiz
                  key="stealth-quiz"
                  quiz={animal.quiz}
                  onComplete={handleQuizComplete}
                  onDismiss={() => setQuizVisible(false)}
                  reducedMotion={reducedMotion}
                />
              )}
            </AnimatePresence>

            {/* Generate / Marketplace CTA */}
            <div className="mt-8">
              {isGated ? (
                <>
                  <Button
                    variant="accent"
                    size="md"
                    className="w-full"
                    icon={<ShoppingBag size={16} />}
                    onClick={handleMarketplace}
                  >
                    Find in Marketplace
                  </Button>
                  <p className="text-[12px] text-[var(--t3)] text-center mt-2">
                    Common &amp; Uncommon only · Rare and above from marketplace
                  </p>
                </>
              ) : (
                <Button
                  variant="accent"
                  size="lg"
                  className="w-full"
                  onClick={handleGenerate}
                >
                  Generate this animal
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </BottomSheet>
  )
}
