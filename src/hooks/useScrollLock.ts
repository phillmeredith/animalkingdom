// useScrollLock — reference-counted body scroll lock
//
// Prevents the direct `document.body.style.overflow = 'hidden'` anti-pattern where
// two overlays open simultaneously and the first to close restores scroll while the
// second is still visible.
//
// Uses a module-level counter so every component that calls lock() increments the
// same count, and scroll is only restored when every caller has called unlock().
//
// Usage:
//   const { lock, unlock } = useScrollLock()
//   useEffect(() => {
//     if (isOpen) { lock(); return unlock }
//   }, [isOpen])

let lockCount = 0

function applyLock() {
  if (lockCount === 0) {
    document.body.style.overflow = 'hidden'
  }
  lockCount++
}

function applyUnlock() {
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount === 0) {
    document.body.style.overflow = ''
  }
}

export function useScrollLock() {
  return { lock: applyLock, unlock: applyUnlock }
}
