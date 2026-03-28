// AppIcon — renders the correct icon component for the current pack/style selection.
// Use this for any decorative or content icon that should respond to Settings customisation.
// UI/control icons (close X, chevrons, badges) should stay as plain Lucide imports.

import type { CSSProperties } from 'react'
import { usePersonalisation } from '@/hooks/usePersonalisation'
import { resolveIcon } from '@/data/iconPacks'
import type { PreviewConcept } from '@/data/iconPacks'

interface AppIconProps {
  concept: PreviewConcept
  size?: number
  /** strokeWidth for Lucide / Tabler. Phosphor uses weight derived from style. Remix ignores it. */
  strokeWidth?: number
  className?: string
  style?: CSSProperties
  /** Explicit colour — overrides nothing when not provided. Use CSS vars e.g. 'var(--blue)'. */
  color?: string
}

export function AppIcon({ concept, size = 24, strokeWidth = 2, className, style, color }: AppIconProps) {
  const { iconPack, iconStyle } = usePersonalisation()
  const Icon = resolveIcon(concept, iconPack, iconStyle)

  const mergedStyle: CSSProperties = color ? { color, ...style } : { ...style }

  if (iconPack === 'phosphor') {
    // Phosphor drives visual weight via the `weight` prop, not strokeWidth
    const weight = (iconStyle === 'default' ? 'regular' : iconStyle) as string
    return <Icon size={size} weight={weight} className={className} style={mergedStyle} aria-hidden="true" />
  }

  if (iconPack === 'tabler') {
    // Tabler uses `stroke` instead of `strokeWidth`
    return <Icon size={size} stroke={strokeWidth} className={className} style={mergedStyle} aria-hidden="true" />
  }

  // Lucide + Remix
  return <Icon size={size} strokeWidth={strokeWidth} className={className} style={mergedStyle} aria-hidden="true" />
}
