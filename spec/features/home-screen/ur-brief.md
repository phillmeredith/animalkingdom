# User Researcher Brief: Home Screen

## Context

The Home screen is the first thing Harry sees every time he opens Animal Kingdom. It must deliver an immediate sense of warmth and reward — confirming his progress, surfacing his animals, and signposting what to do next. For an 8-year-old with ADHD and autism, the screen must be scannable in under 3 seconds, avoid overwhelming stimuli, and give him a clear "start here" moment every session.

---

## Assumptions to validate

- Harry will understand the coin balance and what it represents without explanation
- The daily bonus is motivating and creates a reason to open the app each day
- Seeing his most recent pet on the home screen reinforces attachment and emotional investment
- Quick action buttons (Explore, Play, Shop) are clear enough without text labels — OR need labels
- The streak counter creates positive motivation rather than anxiety about missing a day
- Harry can read the stat cards (11px labels) given his literacy level and any visual processing needs
- A greeting ("Good morning, Harry!") feels personal and warm, not generic

---

## Evidence sources

**Supporting:**
- ADHD research: clear entry points and immediate positive feedback (daily bonus) support session initiation
- Autism accommodation principle: consistent layout on every open reduces cognitive load and anxiety
- Gamification literature: streak mechanics and daily rewards increase retention in child apps

**Challenging:**
- Streak counters can cause anxiety when broken — Harry may feel bad about missing a day, not motivated to return
- Harry's specific reading level and response to small text is unknown at this stage
- Over-stimulation risk: if too many things animate at once on load, attention may scatter

**Unknown:**
- Whether Harry prefers to see his newest pet or a "featured" pet he interacts with most
- How Harry responds to the greeting text — does personalisation feel good or irrelevant?
- Harry's typical session entry behaviour — does he know what he wants to do, or does he need the screen to suggest it?

---

## Knowledge gaps

- **Harry's literacy level**: Could affect whether stat labels (11px, uppercase) are readable. Design should use icons alongside labels.
- **Response to streak mechanics**: Could lead to anxiety design if streak is too prominent on broken days. Recommend soft language ("You're on a 3-day streak!" not "STREAK BROKEN").
- **Preference for motion on load**: Daily bonus animation fires on mount — could be jarring if Harry is sensitive to unexpected motion. prefers-reduced-motion must be enforced.

---

## User context

- **Age / developmental stage**: 8 years old, UK Reception–Year 4 curriculum range
- **Relevant conditions**: ADHD (short attention, needs clear entry points), Autism (routine, predictability, sensory sensitivity)
- **Known preferences**: Loves animals, responds well to earning/collecting, enjoys recognition ("you did it!")
- **Known friction points**: Walls of text, unclear next actions, unexpected loud stimuli, arbitrary time pressure

---

## Recommendations

- [x] Build and observe — risk is low. Ship a clean, non-overwhelming home screen and watch session-start behaviour.
- [ ] Lightweight test — validate streak mechanic language before Tier 2 (care system adds streak prominence)
- [ ] Full research cycle — not needed at this stage

**Design notes for UX:**
1. Keep the daily bonus moment celebratory but brief — auto-dismiss after 3s or on tap
2. Streak should show "Day 3!" not a number that implies failure when reset
3. Icons must accompany all stat labels — never text-only at small sizes
4. Motion should be gentle: slide-in, not bounce/spin
5. Limit visible interactive elements to 3 max per section to avoid ADHD scatter
