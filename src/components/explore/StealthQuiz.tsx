// StealthQuiz — gentle in-profile quiz overlay
// Non-punishing: wrong answer shows correct, 1 coin effort reward

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AnimalQuiz } from '@/data/animals'

interface StealthQuizProps {
  quiz: AnimalQuiz
  onComplete: (correct: boolean) => void
  onDismiss: () => void
  reducedMotion: boolean
}

type AnswerState = 'idle' | 'correct' | 'wrong'

export function StealthQuiz({ quiz, onComplete, onDismiss, reducedMotion }: StealthQuizProps) {
  const [answerState, setAnswerState] = useState<AnswerState>('idle')
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [completed, setCompleted] = useState(false)

  function handleAnswer(index: number) {
    if (completed) return
    const correct = index === quiz.correctIndex
    setSelectedIndex(index)
    setAnswerState(correct ? 'correct' : 'wrong')
    setCompleted(true)
    onComplete(correct)

    setTimeout(() => {
      onDismiss()
    }, correct ? 1500 : 2000)
  }

  function optionStyle(index: number): string {
    if (selectedIndex === null) {
      return 'bg-[var(--card)] border-[var(--border-s)] text-[var(--t2)]'
    }
    if (index === quiz.correctIndex) {
      return 'bg-[var(--green-sub)] border-[var(--green)] text-[var(--green-t)]'
    }
    if (index === selectedIndex && answerState === 'wrong') {
      return 'bg-[var(--red-sub)] border-[var(--red)] text-[var(--red-t)]'
    }
    return 'bg-[var(--card)] border-[var(--border-s)] text-[var(--t4)]'
  }

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-[var(--elev)] border border-[var(--border-s)] rounded-[var(--r-lg)] p-4 mt-4"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-[13px] font-semibold text-[var(--t1)]">Quick quiz! 🪙</p>
          <p className="text-[11px] text-[var(--t3)] mt-0.5">
            {answerState === 'idle' ? 'Get it right for +5 coins' : answerState === 'correct' ? '✓ Correct! +5 🪙' : '1 coin for trying!'}
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="w-8 h-8 rounded-full bg-[var(--card)] flex items-center justify-center text-[var(--t3)] hover:text-[var(--t2)] transition-colors flex-shrink-0"
          aria-label="Dismiss quiz"
        >
          <X size={14} />
        </button>
      </div>

      {/* Question */}
      <p className="text-[15px] text-[var(--t2)] mb-3 leading-snug">{quiz.question}</p>

      {/* Options 2×2 grid */}
      <div className="grid grid-cols-2 gap-2">
        {quiz.options.map((option, i) => (
          <button
            key={i}
            onClick={() => handleAnswer(i)}
            disabled={completed}
            className={cn(
              'border rounded-[var(--r-md)] p-3',
              'text-[13px] font-medium text-left leading-snug',
              'transition-colors duration-200',
              optionStyle(i),
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </motion.div>
  )
}
