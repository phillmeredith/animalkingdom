// [ComponentName].tsx
// Implements: spec/features/{feature}/fe-brief.md
// Builds against: design/{feature}/interaction-spec.md
// Tokens from: design-system/DESIGN_SYSTEM.md
//
// Self-review checklist (complete before moving to next component):
// [ ] Every state from the interaction spec is handled
// [ ] Every visual token comes from the design system — no hardcoded values
// [ ] All animations match fe-brief timing + easing
// [ ] prefers-reduced-motion handled for every animation
// [ ] All touch targets ≥ 44px
// [ ] No blank or broken states
// [ ] TypeScript strict mode — no `any` types

import { useReducedMotion } from '@/hooks/useReducedMotion'; // adjust import path

// ─── Types ────────────────────────────────────────────────────────────────────

interface [ComponentName]Props {
  // Props defined in fe-brief component breakdown
  onTap?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function [ComponentName]({ onTap }: [ComponentName]Props) {
  const prefersReducedMotion = useReducedMotion();

  // Implementation

  return (
    <div>
      {/* Implementation */}
    </div>
  );
}
