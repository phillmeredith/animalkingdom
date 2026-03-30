// CoinRushScreen — Maths educational game
// Phase 1: uses GameCardPicker + GameSessionShell
// Card is passed via navigation state (collectedCardId, selectedCard, challengeLevel)
// from GameCardPicker. If no card in state, GameSessionShell is not rendered —
// user is directed back to /play via useNavigate.

import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Coins } from 'lucide-react'
import { GameSessionShell } from '@/components/games/GameSessionShell'
import { getArcadeQuestions } from '@/data/arcadeQuestions'
import type { CollectedCard } from '@/lib/db'

// TODO: When useCardProgression hook is available (Story 7), call
// awardXp(result.xpEarned) and applyStatDelta(result.statDeltas) inside onComplete.

const THEME = {
  accent:     'var(--amber)',
  accentSub:  'var(--amber-sub)',
  accentText: 'var(--amber-t)',
  icon:       <Coins size={20} />,
  title:      'Coin Rush',
}

export function CoinRushScreen() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const state     = location.state as { selectedCard?: CollectedCard; challengeLevel?: number } | null
  const card      = state?.selectedCard ?? null

  // If navigated to without a card (direct URL entry), redirect back to play hub
  useEffect(() => {
    if (!card) {
      navigate('/play', { replace: true })
    }
  }, [card, navigate])

  if (!card) return null

  const questions = getArcadeQuestions('maths', 10)

  return (
    <div className="flex flex-col h-full bg-[var(--bg)]">
      <GameSessionShell
        card={card}
        area="maths"
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
