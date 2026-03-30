// HomeScreen — the daily anchor of Animal Kingdom
// Phase C build per spec/features/home-screen/

import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, Sparkles, CheckCircle2 } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { CoinDisplay } from '@/components/ui/CoinDisplay'
import { PageHeader } from '@/components/layout/PageHeader'
import { DailyBonusCard } from '@/components/home/DailyBonusCard'
import { PawtectCard } from '@/components/home/PawtectCard'
import { DonationSheet } from '@/components/home/DonationSheet'
import { HomeStatCards } from '@/components/home/HomeStatCards'
import { FeaturedPetCard } from '@/components/home/FeaturedPetCard'
import { PetDetailSheet } from '@/components/my-animals/PetDetailSheet'
import { useWallet } from '@/hooks/useWallet'
import { useSavedNames } from '@/hooks/useSavedNames'
import { useProgress } from '@/hooks/useProgress'
import { usePersonalisation } from '@/hooks/usePersonalisation'
import { db, todayString } from '@/lib/db'
import type { SavedName } from '@/lib/db'

type BonusResult = { awarded: boolean; amount: number; streak: number }

function greeting(name: string): string {
  const display = name.trim() || 'Explorer'
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return `Good morning, ${display}!`
  if (h >= 12 && h < 18) return `Good afternoon, ${display}!`
  return `Good evening, ${display}!`
}

export function HomeScreen() {
  const navigate = useNavigate()
  const { coins, streak, claimDailyBonus } = useWallet()
  const { pets, petCount } = useSavedNames()
  const { gamerLevel } = useProgress()
  const { playerName } = usePersonalisation()

  const [bonusResult, setBonusResult] = useState<BonusResult | null>(null)
  const [bonusChecked, setBonusChecked] = useState(false)
  const [selectedPet, setSelectedPet] = useState<SavedName | null>(null)
  const [donationSheetOpen, setDonationSheetOpen] = useState(false)
  const donateButtonRef = useRef<HTMLButtonElement>(null)

  // Load today's care logs across all pets in one query
  const todayLogs = useLiveQuery(
    () => db.careLog.toArray().then(logs => logs.filter(l => l.date === todayString())),
    [],
    [],
  )

  // Compute which petIds have all 3 care actions done today
  const fullyCaredPetIds = useMemo(() => {
    const byPet = new Map<number, Set<string>>()
    for (const log of todayLogs) {
      if (!byPet.has(log.petId)) byPet.set(log.petId, new Set())
      byPet.get(log.petId)!.add(log.action)
    }
    const done = new Set<number>()
    for (const [id, actions] of byPet) {
      if (['feed', 'clean', 'play'].every(a => actions.has(a))) done.add(id)
    }
    return done
  }, [todayLogs])

  const loading = !bonusChecked

  useEffect(() => {
    let cancelled = false
    async function handleDailyBonus() {
      try {
        const result = await claimDailyBonus()
        if (!cancelled) {
          if (result.awarded) setBonusResult(result)
        }
      } catch {
        // Bonus claim failed — not fatal, proceed to show the screen (R-14)
      } finally {
        if (!cancelled) setBonusChecked(true)
      }
    }
    handleDailyBonus()
    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Only show pets that still need care today
  const petsNeedingCare = pets.filter(p => p.id != null && !fullyCaredPetIds.has(p.id!))
  const allCaredFor = pets.length > 0 && petsNeedingCare.length === 0

  return (
    <div className="relative flex flex-col h-full bg-[var(--bg)] overflow-y-auto">
      <PageHeader
        title={greeting(playerName)}
        trailing={
          <div className="flex items-center gap-2">
            <CoinDisplay amount={coins} />
            <button
              onClick={() => navigate('/generate')}
              className="w-9 h-9 flex items-center justify-center rounded-full text-[var(--blue-t)] bg-[var(--blue-sub)] hover:bg-[var(--blue)] hover:text-white transition-all"
              aria-label="Generate new animal"
            >
              <Sparkles size={16} strokeWidth={2} />
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="w-9 h-9 flex items-center justify-center rounded-full text-t3 hover:text-t1 hover:bg-white/[.06] transition-all"
            >
              <Settings size={18} />
            </button>
          </div>
        }
      />

      <div className="px-6 pt-4 pb-24 max-w-3xl mx-auto w-full">
        {/* Daily bonus — auto-dismissing */}
        <AnimatePresence>
          {bonusResult?.awarded && (
            <DailyBonusCard
              key="daily-bonus"
              amount={bonusResult.amount}
              streak={bonusResult.streak}
              onDismiss={() => setBonusResult(null)}
            />
          )}
        </AnimatePresence>

        {/* Pawtect charity card — always visible */}
        <PawtectCard
          onDonate={() => setDonationSheetOpen(true)}
          triggerRef={donateButtonRef}
        />

        {/* Stats */}
        <HomeStatCards
          petCount={petCount}
          gamerLevel={gamerLevel}
          streak={streak}
          loading={loading}
        />

        {/* Care section */}
        {loading ? (
          <FeaturedPetCard pet={null} loading={true} />
        ) : pets.length === 0 ? (
          <FeaturedPetCard pet={null} loading={false} />
        ) : (
          <>
            <AnimatePresence mode="popLayout">
              {/* Section heading — only visible while any pet needs care */}
              {petsNeedingCare.length > 0 && (
                <motion.p
                  key="care-heading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[11px] font-700 uppercase tracking-widest text-[var(--t3)] mb-3"
                >
                  Needs care today
                </motion.p>
              )}

              {/* One card per pet that still needs care — exits when care is complete */}
              {petsNeedingCare.map(pet => (
                <motion.div
                  key={pet.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.25 } }}
                >
                  <FeaturedPetCard
                    pet={pet}
                    loading={false}
                    onOpenDetail={() => setSelectedPet(pet)}
                  />
                </motion.div>
              ))}

              {/* All cared for — confirmation message */}
              {allCaredFor && (
                <motion.div
                  key="all-done"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 py-4 text-[13px] font-600 text-[var(--green-t)]"
                >
                  <CheckCircle2 size={16} style={{ color: 'var(--green)' }} />
                  All animals cared for today — check back tomorrow!
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Pet detail sheet — opened from any pet card */}
      <PetDetailSheet
        pet={selectedPet}
        open={selectedPet !== null}
        onClose={() => setSelectedPet(null)}
        onRenamed={() => setSelectedPet(null)}
        onReleased={() => setSelectedPet(null)}
      />

      {/* Pawtect donation sheet — portalled to body */}
      <DonationSheet
        open={donationSheetOpen}
        onClose={() => setDonationSheetOpen(false)}
        triggerRef={donateButtonRef}
      />
    </div>
  )
}
