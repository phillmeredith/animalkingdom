// useSpeech — text-to-speech for game questions (accessibility)
// Leaf hook — no dependencies, wraps Web Speech API

import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'ak:speechEnabled'

function getEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'false'
  } catch {
    return true
  }
}

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [enabled, setEnabledState] = useState(getEnabled)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const isSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setEnabledState(getEnabled())
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }, [isSupported])

  const speak = useCallback(
    (text: string) => {
      if (!isSupported || !enabled) return

      stop()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-GB'
      utterance.rate = 0.9
      utterance.pitch = 1.0

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      utteranceRef.current = utterance
      window.speechSynthesis.speak(utterance)
    },
    [isSupported, enabled, stop],
  )

  function setEnabled(value: boolean): void {
    localStorage.setItem(STORAGE_KEY, String(value))
    setEnabledState(value)
    if (!value) stop()
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }))
  }

  // Cleanup on unmount
  useEffect(() => stop, [stop])

  return { speak, stop, isSpeaking, isSupported, enabled, setEnabled }
}
