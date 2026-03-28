# Dev Template

A structured build pipeline for Claude-assisted development projects.

Duplicate this folder for every new project. Fill in the [OWNER] placeholder and start specifying.

---

## How to use this template

### 1. Duplicate the folder
```
cp -r dev-template my-new-project
cd my-new-project
```

### 2. Replace all placeholders
Search for `[OWNER]` and replace with your name or handle throughout.
This is who Claude asks when a decision needs a human.

### 3. Fill in the foundation documents
Before any feature work begins, complete:
- `spec/foundation/ENTITY_MODEL.md` — every data entity with state machines
- `spec/foundation/SYSTEM_ARCHITECTURE.md` — tech stack + hook interfaces
- `spec/foundation/INTEGRATION_MAP.md` — every cross-feature event
- `spec/foundation/BUILD_SEQUENCE.md` — dependency tiers
- `spec/backlog/BACKLOG.md` — feature list with tiers and statuses
- `design-system/DESIGN_SYSTEM.md` — all visual tokens

### 4. Add your design system
Replace `design-system/DESIGN_SYSTEM.md` with your actual design system.
If you use a Claude skill for your DS (NHS, HeroUI, Material, etc.), copy its token definitions here.

### 5. Spec a feature
For each feature, copy `spec/features/_feature-template/` to `spec/features/{feature-name}/`.
Fill in all 7 brief files. Mark the feature as `specified` in BACKLOG.md.
Review and mark as `ready`.

### 6. Start the pipeline
Open Claude and say: "Run .claude/commands/start-feature.md for [feature-name]"
Claude will dispatch the agent team through the phases.

---

## Folder structure

```
dev-template/
  CLAUDE.md                        ← Always loaded. Process rules Claude follows.
  .claude/
    commands/
      start-feature.md             ← Phase A + B launcher
      build-feature.md             ← Phase C launcher
      review-feature.md            ← Phase D launcher
      done-check.md                ← Phase E checklist
    settings.json
  spec/
    foundation/
      ENTITY_MODEL.md              ← All entities + state machines
      SYSTEM_ARCHITECTURE.md       ← Tech stack + hook interfaces
      INTEGRATION_MAP.md           ← All cross-feature events
      BUILD_SEQUENCE.md            ← Dependency tiers
    features/
      _feature-template/           ← Copy this for each feature
        foundation.md              ← Feature-scoped slice of foundation
        ur-brief.md                ← User Researcher brief
        ux-brief.md                ← UX Designer brief
        po-brief.md                ← Product Owner brief
        dev-brief.md               ← Developer brief
        fe-brief.md                ← Frontend Engineer brief
        test-brief.md              ← Tester brief
    backlog/
      BACKLOG.md                   ← Feature status tracker
  design-system/
    DESIGN_SYSTEM.md               ← Visual tokens (fill in or copy from DS skill)
  agents/
    team.md                        ← All role definitions
  research/
    _feature-template/
      ur-findings.md               ← UR agent output template
  design/
    _feature-template/
      interaction-spec.md          ← UX agent output template
  product/
    _feature-template/
      refined-stories.md           ← PO agent output template
  tests/
    _feature-template/
      test-results.md              ← Tester agent output template
  src/
    hooks/
      index.ts
      _hook-template.ts            ← Copy for each new hook
    components/
      _component-template.tsx      ← Copy for each new component
    animations/                    ← FE agent output
    lib/
      db.ts                        ← Database schema
    types/
      index.ts                     ← Shared TypeScript types
```

---

## The pipeline

```
Phase A: Research
  UR validates assumptions → team discussion → briefs amended

Phase B: Design
  UX produces interaction spec → design review (UX + FE + Tester) → PO refines stories
  [OWNER] approves before Phase C

Phase C: Build
  Dev + FE build in parallel → self-review after every component → cross-agent review

Phase D: Verify
  Tester validates all scenarios → visual audit → integration chain test

Phase E: Done
  Definition of Done checklist → every item must pass → feature marked complete
```

---

## Key rules

1. **Read the design system before every visual decision.** No guessing tokens.
2. **Self-review after every component.** Drift happens — catch it early.
3. **No blank or broken states.** Every state in the spec gets a visual.
4. **TypeScript strict mode.** No `any` types, ever.
5. **Every DB write is atomic.** No partial state.
6. **Phase B needs [OWNER] approval before Phase C begins.**
7. **Do not declare done without running the Phase E checklist.**
