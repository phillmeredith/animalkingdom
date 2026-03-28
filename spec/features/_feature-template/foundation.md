# Feature Foundation: [Feature Name]

> A scoped slice of the system foundation relevant to THIS feature only.
> Copy only the entities, events, hook interfaces, and tokens this feature touches.
> Self-contained — agents should not need to read the root foundation documents.

---

## Entities involved

> Copy from spec/foundation/ENTITY_MODEL.md — only entities this feature reads or writes.

```
Entity: [EntityName]
Fields: [relevant fields only]
States: [states this feature cares about]

Transitions this feature drives:
  [state] -> [state]
    Trigger: [trigger]
    Side effects: [effects]
```

---

## Integration slice

> Copy from spec/foundation/INTEGRATION_MAP.md — only events this feature triggers or responds to.

```
Event: [Event name]
Source: [this feature's hook]
Consequences: [list]
```

---

## Hook interfaces consumed

> Copy from spec/foundation/SYSTEM_ARCHITECTURE.md — only hooks this feature calls.
> Agents must use these exact interfaces — no guessing.

```
Hook: use[Name]

Consumed methods:
  method(param: type): ReturnType
    Behaviour: [what it does]
    Side effects: [what it creates automatically]
    Failure: [what failure looks like]
```

---

## Design system tokens

> Copy from design-system/DESIGN_SYSTEM.md — only tokens this feature uses.

| Token | Value | Used for |
|-------|-------|---------|
| [token] | [value] | [component] |

---

## Build prerequisites

Before this feature can be built, the following must be `complete` in BACKLOG.md:

- [ ] [Prerequisite A]
- [ ] [Prerequisite B]
