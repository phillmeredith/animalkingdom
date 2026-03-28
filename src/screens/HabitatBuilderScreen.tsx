// HabitatBuilderScreen — Science arcade game
// Wraps ArcadeShell with science theme + questions

import { useNavigate } from 'react-router-dom'
import { Microscope } from 'lucide-react'
import { ArcadeShell } from '@/components/arcade/ArcadeShell'
import { getArcadeQuestions } from '@/data/arcadeQuestions'

const THEME = {
  accent: 'var(--blue)',
  accentSub: 'var(--blue-sub)',
  accentText: 'var(--blue-t)',
  icon: <Microscope size={40} />,
  title: 'Habitat Builder',
  subtitle: 'Animal science quiz',
}

export function HabitatBuilderScreen() {
  const navigate = useNavigate()
  const questions = getArcadeQuestions('science', 10)

  return (
    <ArcadeShell
      area="science"
      theme={THEME}
      questions={questions}
      onExit={() => navigate('/play')}
    />
  )
}
