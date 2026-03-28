// HomeScreen — the daily anchor of Animal Kingdom
// Phase C build per spec/features/home-screen/

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Settings } from 'lucide-react'
import { CoinDisplay } from '@/components/ui/CoinDisplay'
import { PageHeader } from '@/components/layout/PageHeader'
import { DailyBonusCard } from '@/components/home/DailyBonusCard'
import { HomeStatCards } from '@/components/home/HomeStatCards'
import { FeaturedPetCard } from '@/components/home/FeaturedPetCard'
import { useWallet } from '@/hooks/useWallet'
import { useSavedNames } from '@/hooks/useSavedNames'
import { useProgress } from '@/hooks/useProgress'
import { usePersonalisation } from '@/hooks/usePersonalisation'

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

  // Reactive readiness: hooks return defaults during init
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

  const featuredPet = pets.length > 0 ? pets[0] : null

  return (
    // relative: required to contain the position:absolute background layer
    <div className="relative flex flex-col h-full bg-[var(--bg)] overflow-y-auto">
      <PageHeader
        title={greeting(playerName)}
        trailing={
          <div className="flex items-center gap-2">
            <CoinDisplay amount={coins} />
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

        {/* Stats */}
        <HomeStatCards
          petCount={petCount}
          gamerLevel={gamerLevel}
          streak={streak}
          loading={loading}
        />

        {/* Featured pet */}
        <FeaturedPetCard pet={featuredPet} loading={loading} />
      </div>
    </div>
  )
}
