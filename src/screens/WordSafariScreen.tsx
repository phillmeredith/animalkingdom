// WordSafariScreen — English / Spelling educational game
// Phase 1: uses GameSessionShell
// Card is passed via navigation state from GameCardPicker.

import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import { GameSessionShell } from '@/components/games/GameSessionShell'
import { generateWordSafariQuestions } from '@/data/questionGenerator'
import { useCardProgression } from '@/hooks/useCardProgression'
import type { CollectedCard, CardStats } from '@/lib/db'

const THEME = {
  accent:     'var(--green)',
  accentSub:  'var(--green-sub)',
  accentText: 'var(--green-t)',
  icon:       <Leaf size={20} />,
  title:      'Word Safari',
}

export function WordSafariScreen() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const state     = location.state as { selectedCard?: CollectedCard; challengeLevel?: number } | null
  const card      = state?.selectedCard ?? null
  const { awardXp, applyStatDelta, recordSession } = useCardProgression()

  useEffect(() => {
    if (!card) {
      navigate('/play', { replace: true })
    }
  }, [card, navigate])

  if (!card) return null

  const challengeLevel = ((state?.challengeLevel ?? card.yearLevel ?? 1) as 1 | 2 | 3)
  const questions = generateWordSafariQuestions(card, challengeLevel, 10)

  return (
    <div className="flex flex-col h-full bg-[var(--bg)]">
      <GameSessionShell
        card={card}
        area="spelling"
        theme={THEME}
        questions={questions}
        onExit={() => navigate('/play')}
        onComplete={(result) => {
          if (!card.id) return
          const cardId = card.id
          awardXp(cardId, result.xpEarned).catch(() => {})
          Object.entries(result.statDeltas).forEach(([stat, delta]) => {
            if (delta > 0) applyStatDelta(cardId, stat as keyof CardStats, delta).catch(() => {})
          })
          recordSession(cardId, 'wordSafari').catch(() => {})
        }}
      />
    </div>
  )
}
