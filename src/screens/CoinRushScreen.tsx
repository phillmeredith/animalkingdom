// CoinRushScreen — Maths educational game
// Phase 1: uses GameCardPicker + GameSessionShell
// Card is passed via navigation state (collectedCardId, selectedCard, challengeLevel)
// from GameCardPicker. If no card in state, GameSessionShell is not rendered —
// user is directed back to /play via useNavigate.

import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Coins } from 'lucide-react'
import { GameSessionShell } from '@/components/games/GameSessionShell'
import { generateCoinRushQuestions } from '@/data/questionGenerator'
import { useCardProgression } from '@/hooks/useCardProgression'
import type { CollectedCard, CardStats } from '@/lib/db'

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
  const { awardXp, applyStatDelta, recordSession } = useCardProgression()

  // If navigated to without a card (direct URL entry), redirect back to play hub
  useEffect(() => {
    if (!card) {
      navigate('/play', { replace: true })
    }
  }, [card, navigate])

  if (!card) return null

  const challengeLevel = ((state?.challengeLevel ?? card.yearLevel ?? 1) as 1 | 2 | 3)
  const questions = generateCoinRushQuestions(card, challengeLevel, 10)

  return (
    <div className="flex flex-col h-full bg-[var(--bg)]">
      <GameSessionShell
        card={card}
        area="maths"
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
          recordSession(cardId, 'coinRush').catch(() => {})
        }}
      />
    </div>
  )
}
