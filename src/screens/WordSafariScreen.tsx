// WordSafariScreen — Spelling arcade game
// Wraps ArcadeShell with spelling theme + questions

import { useNavigate } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import { ArcadeShell } from '@/components/arcade/ArcadeShell'
import { getArcadeQuestions } from '@/data/arcadeQuestions'

const THEME = {
  accent: 'var(--green)',
  accentSub: 'var(--green-sub)',
  accentText: 'var(--green-t)',
  icon: <Leaf size={40} />,
  title: 'Word Safari',
  subtitle: 'Animal spelling adventure',
}

export function WordSafariScreen() {
  const navigate = useNavigate()
  const questions = getArcadeQuestions('spelling', 10)

  return (
    <ArcadeShell
      area="spelling"
      theme={THEME}
      questions={questions}
      onExit={() => navigate('/play')}
    />
  )
}
