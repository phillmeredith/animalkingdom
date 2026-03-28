// PlaceholderScreen — temporary screen until feature is built
// Shows the screen name and confirms routing is working

interface PlaceholderScreenProps {
  name: string
  icon: string
}

export function PlaceholderScreen({ name, icon }: PlaceholderScreenProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 px-6 pb-24">
      <div
        className="w-20 h-20 rounded-xl flex items-center justify-center text-4xl"
        style={{ background: 'var(--grad-hero)' }}
      >
        {icon}
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-t1 mb-1">{name}</h2>
        <p className="text-sm text-t3">Coming soon — Tier 1 feature</p>
      </div>
    </div>
  )
}
