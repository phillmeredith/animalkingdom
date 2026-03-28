// GradientFade — gradient above bottom nav on scrollable pages

export function GradientFade() {
  return (
    <div
      className="fixed bottom-[68px] left-0 right-0 h-12 pointer-events-none z-[899]"
      style={{
        background: 'linear-gradient(to top, rgba(13,13,17,.85), transparent)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    />
  )
}
