// EmptyState — centred empty content placeholder

import { Button } from './Button'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  cta?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'accent'
  }
}

export function EmptyState({ icon, title, description, cta }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-12">
      <div className="w-12 h-12 flex items-center justify-center text-t4 mb-4 text-3xl">
        {icon}
      </div>
      <h3 className="text-[22px] font-semibold text-t1 mb-2">{title}</h3>
      <p className="text-[15px] text-t3 max-w-[280px] leading-relaxed mb-5">
        {description}
      </p>
      {cta && (
        <Button variant={cta.variant ?? 'primary'} onClick={cta.onClick}>
          {cta.label}
        </Button>
      )}
    </div>
  )
}
