// SearchBar — shared search input with clear button
// Used by Explore and any future search-enabled screen

import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchBar({ value, onChange, placeholder = 'Search…', className }: SearchBarProps) {
  return (
    <div className={cn('relative flex items-center', className)}>
      <Search
        size={16}
        className="absolute left-3 text-[var(--t3)] pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full h-11 pl-10 pr-10',
          'bg-[var(--elev)] border border-[var(--border-s)]',
          'rounded-[var(--r-md)] text-[15px] text-[var(--t1)]',
          'placeholder:text-[var(--t3)]',
          'focus:border-[var(--blue)] focus:outline-none',
          'focus:ring-2 focus:ring-[var(--blue-sub)]',
          'transition-colors duration-150',
        )}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 text-[var(--t3)] hover:text-[var(--t2)] transition-colors"
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}
