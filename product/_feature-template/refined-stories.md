# Refined Stories: [Feature Name]

> Output from the Product Owner agent.
> Produced during Phase B after UR findings and interaction spec are complete.
> This is the acceptance criteria the Tester validates against.

---

## Scope (confirmed)

**In scope:**
- [explicit item]

**Out of scope (this iteration):**
- [explicit item — reason]

---

## Mandatory AC blocks

Before writing story-level AC, check which of the following blocks apply to this feature.
Copy every applicable block verbatim into the relevant story's acceptance criteria.
Do not omit or paraphrase. These blocks exist because post-build fixes traced directly
to their absence.

### Apply to every story involving coin spend, pack opening, or marketplace transaction

- [ ] TRANS-1 — Happy path wallet assertion: after a successful transaction, `useWallet().coins` equals the pre-transaction balance minus the exact spend amount. Record balance before action and compare after. State the expected delta explicitly (e.g. "balance decreases by exactly [pack.price]").
- [ ] TRANS-2 — Error path wallet assertion: when the transaction call returns an error or throws, `useWallet().coins` is identical to the pre-transaction balance. Verifying that an error toast fires is not sufficient — the balance must be checked explicitly in the error path test.
- [ ] TRANS-3 — Error state UI persistence: when a transaction fails, the triggering sheet, modal, or button remains open and in an actionable state. The player is not left on a blank screen or a closed sheet with no recovery path. A sheet or modal that closes on error is a defect.
- [ ] TRANS-4 — Error toast message specificity: the error toast type (`error`) and copy string are named in the AC. Silent failures are prohibited.
- [ ] TRANS-5 — Disabled state before confirmation: the primary CTA is disabled until all pre-conditions are met. Disabled state is communicated via the Button component's existing disabled styles only — no custom disabled styling.
- [ ] TRANS-6 — Cannot-afford guard: when `canAfford(price)` returns false, the CTA is disabled and the label changes. The exact disabled label copy must be stated. The player cannot reach an error state by attempting a transaction they cannot afford.
- [ ] TRANS-7 — Double-submission guard: tapping the CTA while a transaction is in-flight produces no additional calls. The button enters a loading state (spinner, disabled) on first tap. No second `spend()` call is made if the button is tapped during loading.

### Apply to every story introducing tabs, filter pills, segmented controls, or in-page navigation

- [ ] NAV-1 — Host component slot: name the exact host component and slot where the navigation element renders (e.g. "Section tabs render in the PageHeader's filter slot, below the title row, not in the title slot"). If the host component is shared, the Developer confirms the slot name before Phase C begins.
- [ ] NAV-2 — Match existing pattern: if a tab, pill, or filter control of the same type already exists elsewhere in the app, the new instance uses the same component. Name the component explicitly (e.g. "uses the `CategoryPills` component with the same props pattern as ExploreScreen"). "Styled consistently" is not testable.
- [ ] NAV-3 — Default selected state: which tab or filter is active on first render, and what triggers changes to that default (route param, query string, stored preference).
- [ ] NAV-4 — Active indicator: the active state treatment is described in DS tokens (e.g. "`var(--blue)` underline, 2px, full-width of label"). FE must not choose active state styling independently.
- [ ] NAV-5 — Empty state per tab: for each tab that can be empty, specify the icon, copy, and CTA (if any). "Empty state exists" is not testable.
- [ ] NAV-6 — Spacing from header: the first content element below a tab or filter row has `pt-4` minimum between the tab bar and the content. Verified at 375px and 1024px. No content flushes directly against the navigation row.

### Apply to every story introducing a celebration overlay, win moment, reward animation, or particle feedback

- [ ] ANIM-1 — Named visual components: every visual element the celebration must contain is listed by name (e.g. "glow layer behind image, scale spring on image from 0.8 to 1.0, coin particles"). "Animation plays" is not testable.
- [ ] ANIM-2 — Spec section reference: cite the exact interaction spec section that defines the animation (e.g. "per card-reveal-spec.md Section 6.5"). FE must not design celebration animation independently. If no spec section exists, Phase B is incomplete.
- [ ] ANIM-3 — Reduced motion compliance: for every animated element, state the `prefers-reduced-motion` fallback by name ("instant opacity fade only", "static final state", "omit entirely"). "Respects reduced motion" is not testable.
- [ ] ANIM-4 — Duration cap: state the maximum perceived duration from trigger to interactive (e.g. "total duration from overlay open to CTA visible: no more than 900ms"). The player must never be blocked from advancing. An animation that loops indefinitely before the CTA appears is a defect.
- [ ] ANIM-5 — Non-blocking CTA: during the animation, the primary CTA is visible and tappable at 375px and 1024px. The Tester must verify the CTA is not obscured by animation layers (particles, sweep, rays). An unreachable CTA is a defect.
- [ ] ANIM-6 — Rarity tier mapping: if the feature uses a rarity tier system, the AC must name which celebration maps to which tier. Using a lower-rarity animation for a higher-rarity moment is a build defect.

---

## Refined user stories

### Story 1: [Name]

As [user],
I want [action],
So that [outcome].

**Acceptance criteria:**
- [ ] [Specific, binary, testable criterion]
- [ ] [Specific criterion]
- [ ] [Error condition: when X fails, user sees Y — and wallet/state is unchanged]
- [ ] [Edge case: when condition Z, behaviour is W]
- [ ] [Spacing: first content element below header/tabs has pt-4 minimum — no flush content]
- [ ] [Apply mandatory blocks above as applicable: TRANS-1 through TRANS-7, NAV-1 through NAV-6, ANIM-1 through ANIM-6]

**Notes from UX / UR:**
- [Any amendments from Phase A/B that changed this story]

---

### Story 2: [Name]

[Same format]

---

## Definition of Done (confirmed)

This feature is complete when:
- [ ] All stories above pass all acceptance criteria
- [ ] Every applicable mandatory AC block (TRANS / NAV / ANIM) is checked and passed
- [ ] Every entity state machine transition is reachable and tested
- [ ] Every integration event in the integration slice fires correctly
- [ ] Every screen state in the interaction spec is built
- [ ] Tester has verified all six DS checklist points in test-results.md
- [ ] Tester has verified NAV-6 (content spacing from header) at 375px and 1024px
- [ ] Tester has verified TRANS-2 (error path wallet balance) for every transaction story
- [ ] Tester sign-off received
- [ ] No disconnected functionality

---

## Sign-off

Refined stories complete. Phase C may begin after [OWNER] approval.
