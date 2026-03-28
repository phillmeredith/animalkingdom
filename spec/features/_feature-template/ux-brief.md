# UX Designer Brief: [Feature Name]

## Context

[One paragraph: what this feature does, who it is for, and the core experience goal. What should the user feel when using this feature?]

---

## Screen inventory

> Every screen state this feature requires. Be exhaustive — empty states, error states, and loading states count.

- [Screen / component] — states: [state1, state2, state3]
- [Screen / component] — states: [state1, state2]
- [Modal / overlay] — states: [state1, state2]
- Empty state: [when shown, what it says]
- Error state: [when shown, what it says]
- Loading state: [when shown, what it shows]

---

## State transitions

> For each state transition: what the user sees, what changes on screen.
> Copy the relevant state machine from foundation.md.

```
[State A] -> [State B]
  Trigger: [user action or system event]
  Visual change: [what changes on screen]
  Animation: [transition behaviour]
  Notification: [toast or badge if any]
```

---

## Integration touchpoints

> Where this feature connects to other features — what the user experiences at the boundary.

- After [action]: [what happens next, which shared component fires]
- When [condition] while on another screen: [toast / badge behaviour]
- [This feature] reads from: [other feature's state, and how it surfaces]

---

## Design system reference

> Which design system applies and the key tokens/patterns for this feature.

Design system: design-system/DESIGN_SYSTEM.md

Key patterns:
- Cards: [format to use]
- Modals: [format to use]
- Badges: [colours and conditions]
- Typography: [sizes for key text elements]
- Spacing: [key spacing values]

---

## Accessibility requirements

> Feature-specific accessibility needs beyond the baseline.

- [Specific requirement]
- [Specific requirement]
- Touch targets: all interactive elements minimum 44px
- Colour: never the only indicator of state
- Motion: all animations respect prefers-reduced-motion

---

## Output expected

- Screen-by-screen interaction spec covering every state
- Transition definitions for every state change
- Error state designs
- Empty state designs
- Handoff notes for Frontend Engineer
- Save to: design/[feature]/interaction-spec.md
