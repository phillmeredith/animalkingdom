// SoundButton — play/stop control for BBC animal sound effects
//
// Renders a 32px circle icon button.
// Tap to play; tap again to stop.
// Stops and cleans up Audio on unmount (e.g. modal close).
// If soundUrl is null the button is not rendered (null return).

import { useState, useEffect, useRef } from 'react'
import { Volume2, Square } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SoundButtonProps {
  soundUrl: string | null
  className?: string
}

export function SoundButton({ soundUrl, className }: SoundButtonProps) {
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Stop + clean up when the component unmounts (modal/sheet closed mid-play)
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  // Also stop if soundUrl changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
      setPlaying(false)
    }
  }, [soundUrl])

  if (!soundUrl) return null

  function handleToggle() {
    if (playing) {
      audioRef.current?.pause()
      audioRef.current = null
      setPlaying(false)
    } else {
      const audio = new Audio(soundUrl!)
      audioRef.current = audio
      audio.play().catch(() => {
        // Autoplay blocked or file not found — reset state silently
        audioRef.current = null
        setPlaying(false)
      })
      audio.addEventListener('ended', () => {
        audioRef.current = null
        setPlaying(false)
      })
      setPlaying(true)
    }
  }

  return (
    <button
      type="button"
      aria-label={playing ? 'Stop sound' : 'Play animal sound'}
      onClick={handleToggle}
      className={cn(
        'flex items-center justify-center w-8 h-8 rounded-full shrink-0',
        'transition-colors duration-150',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--blue)] focus-visible:outline-offset-2',
        playing
          ? 'bg-[var(--blue)] text-white'
          : 'bg-[var(--elev)] text-[var(--t3)] hover:text-[var(--t1)] hover:bg-[var(--border)]',
        className,
      )}
    >
      {playing
        ? <Square size={14} strokeWidth={2.5} fill="currentColor" />
        : <Volume2 size={16} strokeWidth={2} />
      }
    </button>
  )
}
