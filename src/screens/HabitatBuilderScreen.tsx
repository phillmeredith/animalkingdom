// HabitatBuilderScreen — Science educational game
// Renders HabitatBuilderGame (bespoke 5-day simulation) replacing the old GameSessionShell.
// Card and challenge level are passed via navigation state from GameCardPicker.

import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { HabitatBuilderGame } from '@/components/games/HabitatBuilderGame'
import { useCardProgression } from '@/hooks/useCardProgression'
import type { CollectedCard, CardStats } from '@/lib/db'

export function HabitatBuilderScreen() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const state     = location.state as { selectedCard?: CollectedCard; challengeLevel?: 1 | 2 | 3 } | null
  const card      = state?.selectedCard ?? null
  const yearLevel = (state?.challengeLevel ?? (card?.yearLevel as 1 | 2 | 3 | undefined) ?? 1) as 1 | 2 | 3
  const { awardXp, applyStatDelta, recordSession } = useCardProgression()

  useEffect(() => {
    if (!card) {
      navigate('/play', { replace: true })
    }
  }, [card, navigate])

  if (!card) return null

  return (
    <div className="flex flex-col h-full bg-[var(--bg)]">
      <HabitatBuilderGame
        card={card}
        yearLevel={yearLevel}
        onExit={() => navigate('/play')}
        onComplete={(result) => {
          if (!card.id) return
          const cardId = card.id
          awardXp(cardId, result.xpEarned).catch(() => {})
          Object.entries(result.statDeltas).forEach(([stat, delta]) => {
            if (delta > 0) applyStatDelta(cardId, stat as keyof CardStats, delta).catch(() => {})
          })
          recordSession(cardId, 'habitatBuilder').catch(() => {})
        }}
      />
    </div>
  )
}
