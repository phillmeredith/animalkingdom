// WorldQuestScreen — Geography arcade game
// Wraps ArcadeShell with geography theme + questions

import { useNavigate } from 'react-router-dom'
import { Globe } from 'lucide-react'
import { ArcadeShell } from '@/components/arcade/ArcadeShell'
import { getArcadeQuestions } from '@/data/arcadeQuestions'

const THEME = {
  accent: 'var(--purple)',
  accentSub: 'var(--purple-sub)',
  accentText: 'var(--purple-t)',
  icon: <Globe size={40} />,
  title: 'World Quest',
  subtitle: 'Animal geography challenge',
}

export function WorldQuestScreen() {
  const navigate = useNavigate()
  const questions = getArcadeQuestions('geography', 10)

  return (
    <ArcadeShell
      area="geography"
      theme={THEME}
      questions={questions}
      onExit={() => navigate('/play')}
    />
  )
}
