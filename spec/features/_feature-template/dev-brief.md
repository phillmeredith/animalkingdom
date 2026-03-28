# Developer Brief: [Feature Name]

## Context

[One paragraph: what this feature does technically. What data it owns, what it integrates with, what state it manages.]

---

## Data model

### Tables affected

> Copied from entity model — only tables this feature reads or writes.

```typescript
// [TableName]
interface [EntityName] {
  id: number;           // auto-increment
  [field]: [type];
  status: '[state1]' | '[state2]' | '[state3]';
  createdAt: Date;
  updatedAt: Date;
}
```

### Schema changes

> Any new fields, indexes, or tables this feature requires.

- New table: [name] — [purpose]
- New field: [table].[field] — [type, default]
- New index: [table].[field] — [reason]

---

## Hook implementation

### Primary hook: use[FeatureName]

```typescript
// Full interface definition

interface Use[FeatureName]Return {
  // State (reactive)
  [field]: [type];
  
  // Actions
  [method](param: type): Promise<{ success: boolean }>;
  [method](param: type, optional?: type): Promise<ReturnType>;
}

// Internal behaviour notes:
// - [Key rule 1]
// - [Key rule 2]
// - [Atomicity requirements]
```

### Hooks consumed (interfaces only)

> Copied from foundation.md — exact function signatures to call.

```typescript
// use[OtherHook]
[method](param: type): ReturnType
// Creates: [what it creates automatically]
// Failure: [what failure looks like]
```

---

## Integration contracts

### Events this feature emits

> What downstream effects this hook triggers. Every item here must be wired.

| Event | When | Downstream effect |
|-------|------|------------------|
| [event] | [trigger condition] | [what happens, which hook] |

### Events this feature responds to

> What external events or state changes this feature must react to.

| Source | Event | This feature's response |
|--------|-------|------------------------|
| [hook/system] | [event] | [how this feature handles it] |

---

## State management

> How state flows through the feature. Which component holds which state. How updates propagate.

- [State X] lives in: [hook / component]
- [State Y] propagates via: [mechanism]
- On [trigger]: [which state updates, in what order]

---

## Error handling

> Every failure scenario and the expected behaviour.

| Failure | Expected behaviour |
|---------|-------------------|
| [DB write fails] | Retry 3× with exponential backoff, toast error on final failure |
| [Insufficient funds] | Return `{ success: false }`, toast "Not enough [currency]" |
| [Network failure] | [behaviour] |
| [Concurrent operation] | [behaviour] |

---

## Output expected

- Hook implementation with full TypeScript types (strict mode, no `any`)
- Database migration if schema changes needed
- Integration wiring to all consumed hooks
- Error handling for every documented failure scenario
- Tests for all state transitions
- Save to: src/hooks/use[FeatureName].ts
