// PageHeader — CSS grid layout: title / centre / trailing
// Optional `below` slot renders search/filter bars inside the same sticky glass surface
// Used on all non-hero pages

interface PageHeaderProps {
  title: string
  centre?: React.ReactNode
  trailing?: React.ReactNode
  below?: React.ReactNode
  className?: string
}

export function PageHeader({ title, centre, trailing, below, className = '' }: PageHeaderProps) {
  return (
    <div
      className={`sticky top-0 z-[100] shrink-0 px-6 pt-6 ${className}`}
      style={{
        background: 'rgba(13,13,17,.72)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,.06)',
      }}
    >
      <div
        className="grid items-center pb-4"
        style={{ gridTemplateColumns: '1fr auto 1fr' }}
      >
        <h1 className="text-2xl font-bold text-t1 leading-tight tracking-tight">
          {title}
        </h1>
        <div className="flex justify-center">{centre}</div>
        <div className="flex justify-end">{trailing}</div>
      </div>
      {below && (
        <div className="flex flex-col gap-3 pb-4">
          {below}
        </div>
      )}
    </div>
  )
}
