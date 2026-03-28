// useReducedMotion — wraps prefers-reduced-motion + manual Settings override
// Leaf hook — no dependencies

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'ak:reducedMotion'

export function useReducedMotion(): boolean {
  const getSystemPreference = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const getStoredOverride = (): boolean | null => {
    try {
      const val = localStorage.getItem(STORAGE_KEY)
      if (val === 'true') return true
      if (val === 'false') return false
    } catch {
      // ignore
    }
    return null
  }

  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    const override = getStoredOverride()
    return override !== null ? override : getSystemPreference()
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    const handleChange = () => {
      const override = getStoredOverride()
      setReducedMotion(override !== null ? override : mediaQuery.matches)
    }

    mediaQuery.addEventListener('change', handleChange)

    // Listen for Settings changes via storage event
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        handleChange()
      }
    }
    window.addEventListener('storage', handleStorage)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  return reducedMotion
}

/** Call from Settings to manually override */
export function setReducedMotionOverride(value: boolean): void {
  localStorage.setItem(STORAGE_KEY, String(value))
  // Trigger storage event for same-tab listeners
  window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }))
}
