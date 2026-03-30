// WordSafariScreen — English / Spelling educational game
// Phase 1: uses GameSessionShell
// Card is passed via navigation state from GameCardPicker.

import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import { GameSessionShell } from '@/components/games/GameSessionShell'
import { getArcadeQuestions } from '@/data/arcadeQuestions'
import type { CollectedCard } from '@/lib/db'

// TODO: When useCardProgression hook is available (Story 7), call
// awardXp(result.xpEarned) and applyStatDelta(result.statDeltas) inside onComplete.

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

  useEffect(() => {
    if (!card) {
      navigate('/play', { replace: true })
    }
  }, [card, navigate])

  if (!card) return null

  const questions = getArcadeQuestions('spelling', 10)

  return (
    <div className="flex flex-col h-full bg-[var(--bg)]">
      <GameSessionShell
        card={card}
        area="spelling"
        theme={THEME}
        questions={questions}
        onExit={() => navigate('/play')}
        onComplete={(result) => {
          // TODO: await awardXp(card.id, result.xpEarned)
          // TODO: await applyStatDelta(card.id, result.statDeltas)
          void result
        }}
      />
    </div>
  )
}
