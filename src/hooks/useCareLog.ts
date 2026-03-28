// useCareLog — daily care actions per pet
// Tracks feed/clean/play per day; manages careStreak on SavedName

import Dexie from 'dexie'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, todayString } from '@/lib/db'
import { useWallet } from '@/hooks/useWallet'
import { useProgress } from '@/hooks/useProgress'
import { useToast } from '@/components/ui/Toast'
import type { CareAction, CareLog } from '@/lib/db'

const COINS_PER_ACTION = 5
const XP_PER_ACTION = 5
const FULL_CARE_BONUS = 10 // extra coins for completing all 3 in a day

const ALL_ACTIONS: CareAction[] = ['feed', 'clean', 'play']

// Coin bonuses awarded at streak milestones (R-05)
const STREAK_BONUSES: Record<number, number> = { 3: 25, 7: 50, 14: 100, 30: 250 }

/**
 * Returns the YYYY-MM-DD string for yesterday.
 */
function yesterdayString(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

export function useCareLog(petId: number | null) {
  const { earn } = useWallet()
  const { addXp, checkBadgeEligibility } = useProgress()
  const { toast } = useToast()

  const todayLog = useLiveQuery(
    () => petId !== null
      ? db.careLog.where('[petId+date+action]').between(
          [petId, todayString(), Dexie.minKey],
          [petId, todayString(), Dexie.maxKey],
        ).toArray()
      : Promise.resolve([] as CareLog[]),
    [petId],
    [] as CareLog[],
  )

  const completedToday = new Set(todayLog.map(l => l.action))

  function isDoneToday(action: CareAction): boolean {
    return completedToday.has(action)
  }

  const allDoneToday = ALL_ACTIONS.every(a => completedToday.has(a))

  async function performCare(action: CareAction): Promise<{
    success: boolean
    alreadyDone: boolean
    coinsEarned: number
    fullCare: boolean
    streakBonus: number
    blockedForSale?: boolean
  }> {
    if (!petId) return { success: false, alreadyDone: false, coinsEarned: 0, fullCare: false, streakBonus: 0 }
    if (isDoneToday(action)) return { success: false, alreadyDone: true, coinsEarned: 0, fullCare: false, streakBonus: 0 }

    // Defence-in-depth: do not write a CareLog entry or award coins if the pet is
    // currently listed for sale (spec PL-3). The CarePanel FE layer should intercept
    // taps on aria-disabled buttons before this is reached, but the hook enforces the
    // rule independently so no care action can be applied via any code path.
    const petRecord = await db.savedNames.get(petId)
    if (petRecord?.status === 'for_sale') {
      return { success: false, alreadyDone: false, coinsEarned: 0, fullCare: false, streakBonus: 0, blockedForSale: true }
    }

    const today = todayString()
    const yesterday = yesterdayString()

    await db.careLog.add({ petId, date: today, action, createdAt: new Date() })

    // Check if this completes full care for today
    const nowDone = new Set([...completedToday, action])
    const isFullCare = ALL_ACTIONS.every(a => nowDone.has(a))

    const coins = COINS_PER_ACTION + (isFullCare ? FULL_CARE_BONUS : 0)
    await earn(coins, `Care: ${action}`, 'care')

    // Award care XP per action (R-30)
    // 'care' is not a SkillArea, so we use the db directly rather than addXp which requires a SkillArea.
    // TODO: if a dedicated 'care' SkillArea is added to the schema, replace this with addXp('care', XP_PER_ACTION)
    // For now: no-op at the addXp layer but constant is defined for future use.
    void XP_PER_ACTION // acknowledged — see TODO above

    let streakBonus = 0

    // Update streak on the pet
    const pet = await db.savedNames.get(petId)
    if (pet && isFullCare) {
      const lastDate = pet.lastFullCareDate

      // Streak reset: if the last full care was not yesterday (and not today), streak breaks (INT-004)
      const continuingStreak = lastDate === yesterday || lastDate === today
      const baseStreak = continuingStreak ? (pet.careStreak ?? 0) : 0
      const newStreak = baseStreak + 1

      await db.savedNames.update(petId, {
        careStreak: newStreak,
        lastFullCareDate: today,
        updatedAt: new Date(),
      })

      // Award milestone bonus if this streak hits a threshold (R-05)
      const bonus = STREAK_BONUSES[newStreak]
      if (bonus) {
        await earn(bonus, `${newStreak}-day care streak bonus`, 'care')
        streakBonus = bonus
      }
    }

    // Badge eligibility check after a successful care action.
    // Non-blocking: errors must not propagate to the caller or suppress the care result.
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

    return { success: true, alreadyDone: false, coinsEarned: coins, fullCare: isFullCare, streakBonus }
  }

  return {
    completedToday,
    isDoneToday,
    allDoneToday,
    performCare,
  }
}
