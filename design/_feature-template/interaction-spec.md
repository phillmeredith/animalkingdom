# Interaction Spec: [Feature Name]

> Output from the UX Designer agent.
> Produced during Phase B.
> This is the build target for Frontend Engineer and Tester.

---

## Screen inventory

| Screen / Component | States | Notes |
|-------------------|--------|-------|
| [name] | [state1, state2] | [any notes] |

---

## Screen: [Screen Name]

### State: [state name]

**Shown when:** [condition]

**Layout:**
```
[Describe the layout — top to bottom, key elements]
```

**Interactive elements:**
- [Element]: [what it does on tap/interaction]
- [Element]: [what it does]

**Design system tokens applied:**
- Background: [token]
- [Element]: [token]

---

### State: [another state]

**Shown when:** [condition]
**Transition from:** [previous state] via [trigger]
**Animation:** [describe transition]

[Layout description]

---

## Transitions

| From | Trigger | To | Animation |
|------|---------|-----|-----------|
| [state] | [user action] | [state] | [description] |
| [state] | [system event] | [state] | [description] |

---

## Empty states

### [Feature] empty state
**Shown when:** [condition]
**Content:** [heading, body text, CTA if any]
**Illustration:** [icon or image]

---

## Error states

### [Error type]
**Shown when:** [failure condition]
**Content:** [error message, recovery action]
**Toast:** [type]: "[message]"

---

## Loading states

### [Loading scenario]
**Shown when:** [condition]
**Pattern:** [skeleton / spinner / placeholder]
**Duration:** [max duration before timeout error]

---

## Handoff notes for Frontend Engineer

- [Key animation detail FE needs to know]
- [Specific gesture behaviour]
- [Performance concern]
- [Edge case that needs special handling]

---

## Sign-off

Interaction spec complete. Design review passed.
- [ ] UX reviewed
- [ ] FE reviewed (buildable, no ambiguity)
- [ ] Tester reviewed (testable, states are discrete)
- [ ] [OWNER] approved — Phase C may begin
