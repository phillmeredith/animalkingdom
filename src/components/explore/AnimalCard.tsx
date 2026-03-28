// AnimalCard — compact 2-column grid card for the Explore directory

import { useEffect, useRef, useState, useCallback } from 'react'
import { Pause, Play, SkipForward, Volume2, X } from 'lucide-react'
import { AnimalImage } from '@/components/ui/AnimalImage'
import { RarityBadge } from '@/components/ui/Badge'
import { getSoundUrl } from '@/data/animalSounds'
import type { AnimalEntry } from '@/data/animals'

// Module-level singleton — only one sound plays at a time across all cards.
let activeAudio: HTMLAudioElement | null = null
let activeStop: (() => void) | null = null

interface AnimalCardProps {
  animal: AnimalEntry
  onTap: () => void
}

export function AnimalCard({ animal, onTap }: AnimalCardProps) {
  const soundUrl = getSoundUrl(animal.name)
  const [playing, setPlaying] = useState(false)
  const [showPlayer, setShowPlayer] = useState(false)
  const [progress, setProgress] = useState(0)          // 0–1
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const scrubRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const isDragging = useRef(false)

  // Tick progress every rAF while playing
  const tickProgress = useCallback(() => {
    const audio = audioRef.current
    if (!audio || audio.paused) return
    if (!isDragging.current) {
      setProgress(audio.duration ? audio.currentTime / audio.duration : 0)
    }
    rafRef.current = requestAnimationFrame(tickProgress)
  }, [])

  // Fully release an audio element — pause, clear src, null the ref
  function releaseAudio(audio: HTMLAudioElement) {
    audio.pause()
    audio.src = ''
    audio.load()
  }

  useEffect(() => {
    // Pause audio when tab becomes hidden (handles background tabs and tab close)
    function onVisibilityChange() {
      if (document.hidden && audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause()
        if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
        setPlaying(false)
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      const audio = audioRef.current
      if (audio) {
        releaseAudio(audio)
        if (activeAudio === audio) { activeAudio = null; activeStop = null }
        audioRef.current = null
      }
    }
  }, [])

  function startAudio() {
    if (activeStop) activeStop()

    const audio = new Audio(soundUrl!)
    audioRef.current = audio
    activeAudio = audio

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration || 0)
    })

    activeStop = () => {
      releaseAudio(audio)
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
      setPlaying(false)
    }

    audio.play().catch(() => {
      setPlaying(false)
      setShowPlayer(false)
      activeAudio = null
      activeStop = null
    })

    audio.onended = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      setProgress(1)
      setPlaying(false)
      activeAudio = null
      activeStop = null
    }

    setPlaying(true)
    setProgress(0)
    rafRef.current = requestAnimationFrame(tickProgress)
  }

  function handleSoundClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (!showPlayer) {
      setShowPlayer(true)
      startAudio()
    } else {
      // Badge tap while player open: toggle pause/play
      handleTogglePlay(e)
    }
  }

  function handleTogglePlay(e: React.MouseEvent) {
    e.stopPropagation()
    const audio = audioRef.current
    if (!audio) { startAudio(); return }

    if (audio.paused) {
      audio.play().catch(() => {})
      setPlaying(true)
      rafRef.current = requestAnimationFrame(tickProgress)
    } else {
      audio.pause()
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      setPlaying(false)
    }
  }

  function handleClose(e: React.MouseEvent) {
    e.stopPropagation()
    const audio = audioRef.current
    if (audio) {
      releaseAudio(audio)
      if (activeAudio === audio) { activeAudio = null; activeStop = null }
      audioRef.current = null
    }
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    setPlaying(false)
    setShowPlayer(false)
    setProgress(0)
  }

  function handleSkip(e: React.MouseEvent) {
    e.stopPropagation()
    // Skip = restart from beginning
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = 0
    setProgress(0)
    if (audio.paused) {
      audio.play().catch(() => {})
      setPlaying(true)
      rafRef.current = requestAnimationFrame(tickProgress)
    }
  }

  // Scrub bar pointer interaction
  function scrubAt(clientX: number) {
    const bar = scrubRef.current
    if (!bar || !audioRef.current) return
    const rect = bar.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const audio = audioRef.current
    if (audio.duration) {
      audio.currentTime = ratio * audio.duration
      setProgress(ratio)
    }
  }

  function handleScrubPointerDown(e: React.PointerEvent) {
    e.stopPropagation()
    isDragging.current = true
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    scrubAt(e.clientX)
  }

  function handleScrubPointerMove(e: React.PointerEvent) {
    if (!isDragging.current) return
    e.stopPropagation()
    scrubAt(e.clientX)
  }

  function handleScrubPointerUp(e: React.PointerEvent) {
    e.stopPropagation()
    isDragging.current = false
    scrubAt(e.clientX)
  }

  // Format mm:ss
  function fmt(secs: number) {
    if (!isFinite(secs)) return '0:00'
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const currentTime = duration ? progress * duration : 0

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onTap}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap() } }}
      className={[
        'w-full text-left cursor-pointer select-none',
        'bg-[var(--card)] border border-[var(--border-s)] rounded-[var(--r-lg)] overflow-hidden',
        'hover:border-[var(--border)] motion-safe:hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(0,0,0,.25)] transition-all duration-300 motion-safe:active:scale-[.97]',
        'focus-visible:outline-2 focus-visible:outline-[var(--blue)] focus-visible:outline-offset-2',
      ].join(' ')}
    >
      {/* Image — with optional sound badge overlay, and inline player overlay */}
      <div className="w-full aspect-square bg-[var(--elev)] relative">
        <AnimalImage
          src={animal.imageUrl}
          alt={animal.name}
          className="w-full h-full object-cover"
        />

        {/* Sound badge — always visible when soundUrl exists */}
        {soundUrl && (
          <button
            onClick={handleSoundClick}
            aria-label={playing ? `Pause ${animal.name} sound` : `Play ${animal.name} sound`}
            aria-pressed={playing}
            className="absolute bottom-1.5 right-1.5 flex items-center justify-center w-7 h-7 rounded-full transition-colors duration-150 motion-safe:active:scale-90"
            style={{
              background: playing ? 'var(--blue)' : 'rgba(13,13,17,.70)',
              backdropFilter: 'blur(6px)',
              zIndex: 2,
            }}
          >
            {playing
              ? <Pause size={10} strokeWidth={0} fill="white" aria-hidden="true" />
              : <Volume2 size={12} strokeWidth={2} style={{ color: 'var(--blue-t)' }} aria-hidden="true" />
            }
          </button>
        )}

        {/* Mini player overlay — slides up from the bottom of the image */}
        {showPlayer && (
          <div
            className="absolute inset-x-0 bottom-0"
            style={{
              background: 'rgba(13,13,17,.88)',
              backdropFilter: 'blur(24px)',
              borderTop: '1px solid rgba(255,255,255,.06)',
              padding: '10px 12px 12px',
              zIndex: 3,
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Top row: animal name + close */}
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--t2)', letterSpacing: '0.3px' }}>
                {animal.name}
              </span>
              <button
                onClick={handleClose}
                aria-label="Close player"
                className="flex items-center justify-center w-5 h-5 rounded-full transition-colors duration-150"
                style={{ background: 'rgba(255,255,255,.08)', color: 'var(--t3)' }}
              >
                <X size={10} strokeWidth={2.5} aria-hidden="true" />
              </button>
            </div>

            {/* Scrub bar */}
            <div
              ref={scrubRef}
              role="slider"
              aria-label="Audio progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress * 100)}
              className="relative w-full mb-1 cursor-pointer"
              style={{ height: '20px', display: 'flex', alignItems: 'center' }}
              onPointerDown={handleScrubPointerDown}
              onPointerMove={handleScrubPointerMove}
              onPointerUp={handleScrubPointerUp}
              onPointerCancel={handleScrubPointerUp}
            >
              {/* Track */}
              <div
                className="absolute w-full"
                style={{ height: '3px', borderRadius: '100px', background: 'rgba(255,255,255,.12)' }}
              />
              {/* Filled */}
              <div
                className="absolute"
                style={{
                  height: '3px',
                  borderRadius: '100px',
                  background: 'var(--blue)',
                  width: `${progress * 100}%`,
                  transition: isDragging.current ? 'none' : 'width 0.1s linear',
                }}
              />
              {/* Thumb */}
              <div
                className="absolute"
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '100px',
                  background: 'white',
                  left: `calc(${progress * 100}% - 5px)`,
                  boxShadow: '0 1px 4px rgba(0,0,0,.4)',
                  transition: isDragging.current ? 'none' : 'left 0.1s linear',
                }}
              />
            </div>

            {/* Time labels + controls */}
            <div className="flex items-center justify-between mt-1">
              <span style={{ fontSize: '10px', color: 'var(--t3)', fontVariantNumeric: 'tabular-nums' }}>
                {fmt(currentTime)}
              </span>

              {/* Play/Pause + Skip */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTogglePlay}
                  aria-label={playing ? 'Pause' : 'Play'}
                  className="flex items-center justify-center w-7 h-7 rounded-full transition-colors duration-150"
                  style={{ background: 'var(--blue)' }}
                >
                  {playing
                    ? <Pause size={11} strokeWidth={0} fill="white" aria-hidden="true" />
                    : <Play size={11} strokeWidth={0} fill="white" style={{ marginLeft: '1px' }} aria-hidden="true" />
                  }
                </button>
                <button
                  onClick={handleSkip}
                  aria-label="Restart"
                  className="flex items-center justify-center w-6 h-6 rounded-full transition-colors duration-150"
                  style={{ background: 'rgba(255,255,255,.08)', color: 'var(--t2)' }}
                >
                  <SkipForward size={11} strokeWidth={2} aria-hidden="true" />
                </button>
              </div>

              <span style={{ fontSize: '10px', color: 'var(--t3)', fontVariantNumeric: 'tabular-nums' }}>
                {fmt(duration)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-3">
        <span className="text-[13px] font-semibold text-[var(--t1)] line-clamp-2 leading-tight block mb-1">
          {animal.name}
        </span>
        <div className="flex items-center justify-between gap-1">
          <p className="text-[11px] text-[var(--t3)] leading-none truncate">
            {animal.animalType} · {animal.category}
          </p>
          <RarityBadge rarity={animal.rarity} className="shrink-0" />
        </div>
      </div>
    </div>
  )
}
