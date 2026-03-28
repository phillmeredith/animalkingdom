# Frontend Engineer Brief: [Feature Name]

## Context

[One paragraph: what this feature feels like to use. The emotional quality of the interaction. Key moments that need to feel great.]

---

## Component breakdown

> Every component this feature needs. Props, states, visual description, animations, and tap behaviour.

### [ComponentName]

```
Props:
  [prop]: [type] — [description]
  onTap: () => void
  
States:
  [state1]: [visual description]
  [state2]: [visual description]
  [state3]: [visual description]
  
Visual:
  [Describe layout, key elements, design system patterns to use]
  
Animation:
  [Describe any animation on state change or interaction]
  
Tap behaviour:
  [What happens when the user taps / interacts]
```

---

### [AnotherComponent]

```
Props: ...
States: ...
Visual: ...
Animation: ...
```

---

## Design system tokens

> Copied from design-system/DESIGN_SYSTEM.md — specific tokens for this feature.

| Token | Value | Applied to |
|-------|-------|------------|
| [Background token] | [value] | [component] |
| [Border token] | [value] | [component] |
| [Text token] | [value] | [component] |
| [Spacing token] | [value] | [layout] |

---

## Animation requirements

> Every animation with timing, easing, and trigger. No animation should be invented — they must be specified here.

| Animation | Trigger | Duration | Easing | Notes |
|-----------|---------|----------|--------|-------|
| [name] | [what triggers it] | [ms] | [ease-in/out/spring] | [any special behaviour] |
| [name] | [trigger] | [ms] | [easing] | [notes] |

**Reduced motion:** All animations must check `prefers-reduced-motion`. Fallback: instant state change, no motion.

---

## Gesture requirements

> Any touch/gesture behaviour specific to this feature.

- [Swipe direction]: [what it does]
- [Long press]: [what it does]
- [Drag]: [what it does, drop zones]
- [Double tap]: [prevention or use]

---

## Performance targets

> Frame budget and specific concerns for this feature.

- Target: 60fps on [target device]
- [Specific concern]: [how to handle it]
- [List / grid with N items]: virtualise if > [threshold]
- [Animation X]: must not cause jank during [condition]

---

## States that must be handled

> No blank or broken states allowed. Every state needs a visual.

- [ ] Loading state
- [ ] Empty state
- [ ] Error state
- [ ] [Feature-specific state 1]
- [ ] [Feature-specific state 2]

---

## Output expected

- All components with TypeScript strict mode (no `any`)
- All animations implemented per spec, respecting reduced-motion
- All states handled — no blank or broken states
- Performance validated on [target device]
- Save to: src/components/[feature]/
