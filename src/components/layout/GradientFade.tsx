// GradientFade — gradient above bottom nav on scrollable pages

export function GradientFade() {
  return (
    <div
      className="fixed bottom-[68px] left-0 right-0 h-8 pointer-events-none z-[899]"
      style={{
        background: 'linear-gradient(to top, #0D0D11, transparent)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    />
  )
}
