// AnimalImage — image with paw-print SVG fallback

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface AnimalImageProps {
  src: string
  alt: string
  className?: string
  fallbackClassName?: string
}

export function AnimalImage({ src, alt, className, fallbackClassName }: AnimalImageProps) {
  const [errored, setErrored] = useState(false)

  if (errored || !src) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-[var(--elev)]',
          fallbackClassName ?? className,
        )}
      >
        {/* Paw print SVG placeholder */}
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          className="text-t4"
        >
          <path
            d="M11 4.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM16 4.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM8 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM19 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM12 10c-2.5 0-5 2-5 5 0 1.5.5 3 1.5 4 .5.5 1 1 1.5 1.5.5.5 1.5.5 2 0 .5-.5 1-1 1.5-1.5 1-1 1.5-2.5 1.5-4 0-3-2.5-5-5-5Z"
            fill="currentColor"
          />
        </svg>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn('object-cover', className)}
      onError={() => setErrored(true)}
    />
  )
}
