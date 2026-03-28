// Avatar — gradient-filled circle (never solid colour)
// NFT Dark DS: avatars always use gradient fills, never solid

import { cn } from '@/lib/utils'

const GRADIENTS = [
  'linear-gradient(135deg, #E8247C, #3772FF)',   // hero
  'linear-gradient(135deg, #3772FF, #9757D7)',   // cool
  'linear-gradient(135deg, #45B26B, #3772FF)',   // mint
  'linear-gradient(135deg, #F5A623, #E8247C)',   // warm
  'linear-gradient(135deg, #9757D7, #3772FF 50%, #45B26B)', // aurora
]

const SIZE_CLASSES = {
  xs: 'w-7 h-7 text-[11px]',
  sm: 'w-9 h-9 text-[13px]',
  md: 'w-11 h-11 text-[15px]',
  lg: 'w-14 h-14 text-[18px]',
  xl: 'w-[72px] h-[72px] text-[22px]',
}

interface AvatarProps {
  name: string
  size?: keyof typeof SIZE_CLASSES
  gradientIndex?: number
  className?: string
}

export function Avatar({ name, size = 'md', gradientIndex, className }: AvatarProps) {
  const idx = gradientIndex !== undefined
    ? gradientIndex % GRADIENTS.length
    : name.charCodeAt(0) % GRADIENTS.length

  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold text-white flex-shrink-0',
        SIZE_CLASSES[size],
        className,
      )}
      style={{ background: GRADIENTS[idx] }}
      aria-label={name}
    >
      {initials}
    </div>
  )
}
