// CoinRushScreen — Maths arcade game
// Wraps ArcadeShell with maths theme + questions

import { useNavigate } from 'react-router-dom'
import { Coins } from 'lucide-react'
import { ArcadeShell } from '@/components/arcade/ArcadeShell'
import { getArcadeQuestions } from '@/data/arcadeQuestions'

const THEME = {
  accent: 'var(--amber)',
  accentSub: 'var(--amber-sub)',
  accentText: 'var(--amber-t)',
  icon: <Coins size={40} />,
  title: 'Coin Rush',
  subtitle: 'Animal maths challenges',
}

export function CoinRushScreen() {
  const navigate = useNavigate()
  const questions = getArcadeQuestions('maths', 10)

  return (
    <ArcadeShell
      area="maths"
      theme={THEME}
      questions={questions}
      onExit={() => navigate('/play')}
    />
  )
}
