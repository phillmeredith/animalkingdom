// CarePanel — daily care actions for a pet
// Feed · Clean · Play — each once per day, coins reward, full-care streak bonus
//
// for_sale locked state (PL-3):
//   When petStatus === 'for_sale', care buttons render with aria-disabled="true"
//   (NOT native disabled — that removes elements from tab order). Tapping shows
//   an inline amber message below the buttons, not a toast. No CareLog entry
//   is created when aria-disabled buttons are tapped.

import { useState } from 'react'
import { Utensils, Droplets, Gamepad2, Flame, Loader2, Check } from 'lucide-react'
import { useCareLog } from '@/hooks/useCareLog'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'
import type { CareAction } from '@/lib/db'

const ACTIONS: { key: CareAction; icon: React.ReactNode; label: string }[] = [
  { key: 'feed',  icon: <Utensils size={22} />, label: 'Feed'  },
  { key: 'clean', icon: <Droplets size={22} />, label: 'Clean' },
  { key: 'play',  icon: <Gamepad2 size={22} />, label: 'Play'  },
]

interface CarePanelProps {
  petId: number
  careStreak: number
  petName?: string
  /** When 'for_sale', buttons are aria-disabled. Tapping shows inline amber message. */
  petStatus?: 'active' | 'for_sale'
}

export function CarePanel({ petId, careStreak, petName, petStatus = 'active' }: CarePanelProps) {
  const { isDoneToday, allDoneToday, performCare } = useCareLog(petId)
  const { toast } = useToast()
  const [loading, setLoading] = useState<CareAction | null>(null)
  // Inline message shown when for_sale care button is tapped
  const [showLockedMessage, setShowLockedMessage] = useState(false)

  const isForSale = petStatus === 'for_sale'

  async function handleCare(action: CareAction) {
    // PL-3: if pet is for_sale, show inline amber message and return without caring
    if (isForSale) {
      setShowLockedMessage(true)
      return
    }
    if (isDoneToday(action) || loading) return
    setLoading(action)
    try {
      const result = await performCare(action)
      if (result.alreadyDone) return
      if (result.fullCare) {
        toast({ type: 'success', title: `Full care day! +${result.coinsEarned} coins` })
      } else {
        toast({ type: 'success', title: `+${result.coinsEarned} coins` })
      }
    } catch {
      toast({ type: 'error', title: 'Care action failed' })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-700 uppercase tracking-[1px] text-t3">
          Daily Care
        </p>
        {careStreak > 0 && (
          <span className="flex items-center gap-1 text-[12px] font-600 text-[var(--amber-t)]">
            <Flame size={12} /> {careStreak} day streak
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div
        className="grid grid-cols-3 gap-2"
        aria-describedby={isForSale && showLockedMessage ? 'care-locked-msg' : undefined}
      >
        {ACTIONS.map(({ key, icon, label }) => {
          const done = isDoneToday(key)
          const busy = loading === key

          if (isForSale) {
            // PL-3: aria-disabled="true" — NOT native disabled (keeps tab order + screen reader access)
            return (
              <button
                key={key}
                aria-disabled="true"
                aria-describedby="care-locked-msg"
                onClick={() => handleCare(key)}
                style={{ opacity: 0.4 }}
                className={cn(
                  'flex flex-col items-center justify-center gap-1.5 py-4 rounded-xl border transition-all',
                  'bg-[var(--elev)] border-[var(--border-s)]',
                )}
              >
                <span className="w-6 h-6 flex items-center justify-center">{icon}</span>
                <span className="text-[11px] font-600 text-t2">{label}</span>
              </button>
            )
          }

          return (
            <button
              key={key}
              onClick={() => handleCare(key)}
              disabled={done || !!loading}
              className={cn(
                'flex flex-col items-center justify-center gap-1.5 py-4 rounded-xl border transition-all',
                done
                  ? 'bg-[var(--green-sub)] border-[var(--green)] opacity-80 cursor-default'
                  : 'bg-[var(--elev)] border-[var(--border-s)] active:scale-[.96]',
              )}
            >
              <span className="w-6 h-6 flex items-center justify-center">
                {busy ? <Loader2 size={16} className="animate-spin" /> : done ? <Check size={16} /> : icon}
              </span>
              <span className={cn(
                'text-[11px] font-600',
                done ? 'text-[var(--green-t)]' : 'text-t2',
              )}>
                {label}
              </span>
            </button>
          )
        })}
      </div>

      {/* PL-3: Inline amber message — shown when for_sale button is tapped. NOT a toast. */}
      {isForSale && showLockedMessage && (
        <p
          id="care-locked-msg"
          role="status"
          className="mt-2 text-[14px] font-400"
          style={{ color: 'var(--amber-t)' }}
        >
          Can't care for {petName ?? 'this pet'} while listed — remove the listing first.
        </p>
      )}

      {!isForSale && allDoneToday && (
        <p className="text-center text-[12px] text-[var(--green-t)] font-600 mt-2">
          All done for today!
        </p>
      )}
    </div>
  )
}
