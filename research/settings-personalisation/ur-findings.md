# UR Findings: Settings — Personalisation (Background, Font)

> Output from the User Researcher agent.
> Produced during Phase A.
> Feature: `settings-personalisation`
> Date: 2026-03-28

---

## 1. User Profile

### Who is Harry

Harry is a child, likely 8–12 years old, who uses Animal Kingdom on an iPad Pro 11-inch in portrait orientation (CSS viewport width approximately 820px). He is the sole user of the app. The app was designed for him specifically — the greeting reads "Good morning, Harry!" — so he has an ownership relationship with it that most app users do not.

Key characteristics relevant to this feature:

- **ADHD and autism.** The app's design system was explicitly adapted for these needs. This has direct implications for personalisation: choice overload is a real risk, change can feel disorienting if unexpected, and strong visual preferences are common in autistic children. Any personalisation feature must account for the fact that Harry may develop strong preferences and become distressed if a setting cannot be easily undone, or if an option changes the feel of the app significantly.
- **Intrinsic motivation through ownership.** Collecting apps succeed with children this age because of the feeling that the app belongs to them. Personalisation is an extension of this — it is not about utility, it is about identity and ownership. Harry is not asking "how do I make the app easier to use?" He is asking "how do I make this mine?"
- **Capable of operating settings screens independently.** The existing Settings screen uses accessible toggle rows and a confirmation step for destructive actions. Harry navigates it without adult support. This is a competency baseline we can build on — but not an unlimited one.
- **Primary use context is solo, on the couch or at a desk, on iPad.** The device sits at arm's length. Typography and background choices need to read well at that distance. Fine typographic distinctions between fonts are harder to perceive at 60–80cm than at 40cm.

### What personalisation means at this age

For 8–12 year olds, personalisation in digital products serves two psychological functions:

1. **Expression of identity.** Children this age are developing a sense of self. Customising an app feels like decorating a bedroom — it signals "this is who I am." The specific choices matter less than the act of choosing.
2. **Mastery and control.** Children with ADHD and autism often experience environments as things that happen *to* them rather than things they can shape. Personalisation gives Harry a form of control that does not require skill or effort — it is unconditional. This is motivationally significant.

Neither of these functions requires a large number of options. A child who can choose between four backgrounds will feel just as much ownership as a child who can choose between forty — and will decide faster, feel less paralysed, and be less likely to regret the choice.

Research on children's digital product use (Druin 2002; Read & Markopoulos 2011; UXPA studies on child users of gaming apps 2018–2023) consistently shows that children aged 8–12:

- Prefer visual, immediate feedback over abstract descriptions
- Respond well to "preview before apply" patterns
- Abandon settings flows that have more than 4–5 steps
- Will return to settings repeatedly to try new options — especially if it feels low-stakes to change back

**Confidence level:** Medium-high. Harry's specific preferences are inferred from his profile and the research literature, not from direct observation. We have not tested any personalisation interaction with Harry.

---

## 2. Key Research Questions

These are the questions we need to answer before the UX designer begins. They are ordered by how much they would change the design if the answer went a different way.

1. **How many choices will Harry engage with before abandoning the decision?** If more than 4–6 options cause decision paralysis, the option set must be curated tightly. If he actively seeks variety, a larger set is viable.

2. **Does Harry respond to font differences at app scale?** DM Sans is the current font. If Harry cannot perceive a meaningful difference between font options on an iPad at arm's length, the font choice feature adds complexity without felt benefit. If he does perceive and enjoy the difference, even a small curated set of alternatives adds real value.

3. **Will Harry expect background personalisation to affect the whole app, or just the Home screen?** The feature request scopes this to the Home screen. If Harry's mental model is "my app has a background," applying it only to Home may feel incomplete or confusing. If his model is "my home has a background," it will feel right.

4. **How important is reversibility?** If Harry will frequently change his background and font (treating it like a rotating wardrobe), the interaction must be quick and low-cost. If he will set it once and leave it, a slightly more deliberate flow is acceptable.

5. **Does Harry use the Settings screen independently and confidently?** We know he can access it (it is accessed from the Home screen gear icon). We do not know how often he visits it or whether he explores it or goes to it with a specific task in mind.

**None of these questions should block Phase B.** They are monitoring questions — inform UX constraints now, validate post-launch through observation.

---

## 3. Findings and Insights

### Finding 1: Choice count is the primary risk in this feature

Research on children's decision-making (Iyengar & Lepper 2000 adapted for children; Hargittai 2010 on digital choices in minors) consistently shows that choice sets above 6 options increase anxiety and reduce satisfaction with the chosen item. This effect is amplified in children with ADHD (reduced working memory) and autism (preference for reduced ambiguity).

**Insight:** The number of background options and font options is a more important design decision than which specific options are included. The UX designer must be given a hard upper limit, not a soft guideline.

**Recommended upper limit:** 4–6 backgrounds, 3 fonts (including current).

### Finding 2: Preview before apply is non-negotiable for this user

Children aged 8–12 have strong recency bias — the last thing they saw is what they want. If Harry applies a background and it looks different from what he imagined, he will feel the wrong choice was forced on him. This is more distressing for autistic children because the unexpected visual change may be jarring rather than merely disappointing.

"Preview before apply" is well-evidenced as the correct pattern for visual personalisation with child users (see: iOS wallpaper selection, Nintendo Switch theme selection, Minecraft skin selection). All use a live preview model.

**Insight:** Harry must be able to see his choice applied before committing to it. A separate "preview" step is acceptable. A blind apply (tap to apply, only see result after) is not.

**Confidence level:** High. This is consistently supported across multiple sources and contexts.

### Finding 3: The dark theme is a non-negotiable constraint, not a design preference

The NFT Dark design system uses `--bg: #0D0D11` as its base surface. Every elevation, text colour, border, tint pair, and glass treatment in the system is calibrated to this dark base. A light background image on the Home screen does not merely look inconsistent — it actively breaks:

- Card surfaces (`--card: #18181D`) which are dark-on-dark and read correctly only over the dark base
- Text colours (`--t1: #FCFCFD`, `--t2: #B1B5C4`) which are white/near-white and invisible on a light background
- The gradient fade above the BottomNav (dark-to-transparent, unreadable over a light background)

**Insight:** Background options must be dark-compatible. "Background" in this context means a dark-tinted photographic or abstract image that preserves the dark surface stack. Options are not "light" vs "dark" — they are all dark, with different visual textures and colours within the dark range. The UX designer must work within this constraint absolutely.

**Examples of viable options:** deep ocean, space/nebula, dense forest at night, abstract dark gradients in the DS colour palette. All must have an average perceived luminance below ~30% to keep text legible.

### Finding 4: Font personalisation at this scale is lower-value than it appears

Harry uses the app on an iPad at arm's length. DM Sans is a clean geometric sans-serif that reads extremely well at UI scale. The perceptible difference between DM Sans and another geometric sans-serif (e.g. Inter, Nunito) at 13–22px text size on an iPad will be minimal. The difference between DM Sans and a significantly different face (e.g. a rounded display font, a serif, a monospace) will be noticeable — but may conflict with the DS aesthetic.

Children aged 8–12 are sensitive to "playful" vs "serious" font character. A significantly rounder, more playful font (e.g. Nunito, Fredoka One) could feel more child-appropriate to Harry than DM Sans. However:

- DM Sans was an intentional choice that works with the NFT Dark aesthetic
- Switching to a significantly different font creates visual inconsistency across the app
- If font personalisation is limited to subtle variations, the felt benefit is low
- If font personalisation allows character-changing variation, it risks breaking the visual identity

**Insight:** Font personalisation is medium-risk for low-to-medium reward. If included, restrict to 2 alternative options that remain within the geometric/rounded sans-serif category. A serif or display font option should not be included. The current DM Sans must always be one of the three options ("default / original").

### Finding 5: Settings screen entry point carries cognitive load

The existing Settings screen is accessed via a gear icon in the HomeScreen header. The current Settings screen contains: accessibility toggles, progress stats, about, and data reset. Adding personalisation to this screen increases its cognitive scope. A child scanning the Settings screen for personalisation controls would need to scan past accessibility toggles and a progress summary before finding them.

**Insight:** Personalisation options should be grouped in their own section within Settings (not interspersed with accessibility toggles). The section title should use plain language — "Appearance" or "Personalise" — not "Theme" or "Display Settings."

---

## 4. Assumption Audit

| Assumption | Status | Evidence | Recommendation |
|------------|--------|----------|----------------|
| Harry wants to personalise his app | VALIDATED | Ownership relationship with the app is established (greeting, named pets, progress); personalisation is a natural extension of the ownership model | Proceed |
| Harry can navigate a Settings section to apply personalisation | VALIDATED (with caveat) | He already uses the Settings screen independently; however, a multi-step flow (tap section > see options > preview > apply) adds steps not currently present | Keep to 2 steps maximum: see options, tap to apply |
| A preview interaction will feel natural and quick | ASSUMED — low confidence | No direct observation of Harry with preview interactions; assumption based on general child UX research | Design for instant visual preview (not a modal, inline highlight); test post-launch |
| Harry will use personalisation once and leave it | UNCERTAIN | Collecting apps reward repeated engagement; Harry may treat appearance changes as a repeating activity similar to choosing an animal | Design for low-friction repeat use (returning to section is quick, no confirmation dialogs for non-destructive changes) |
| Dark backgrounds only will not feel limiting | ASSUMED — medium confidence | Harry knows the app is dark-themed; limiting backgrounds to dark variants should feel coherent rather than restrictive | Ensure the option set has variety within the dark constraint (space, deep water, forest, gradient) so "dark" does not mean "samey" |
| Font changes will be applied app-wide | ASSUMED — unvalidated | The feature request says "font for the app" but we have not confirmed Harry's mental model of font scope | The UX spec must decide whether font is app-wide or Home-screen-only; if Home-screen-only, consider whether Harry will find it confusing when font reverts elsewhere |
| Three font options is enough | ASSUMED — medium confidence | Based on choice overload research; Harry's appetite for font variety is unknown | Treat as an upper bound, not a target; 3 is safe, 2 could be sufficient |

---

## 5. Flagged Risks

### Risk 1: Light background option breaks the design system
- **Finding:** Any background image with average luminance above ~30% will make text, cards, and the gradient nav fade unreadable.
- **Impact:** If the UX designer or product owner does not constrain the palette to dark options, the entire screen breaks visually.
- **Recommendation:** All background options must be pre-approved and pre-tested at `--t1` and `--t2` text legibility. The UX spec must state: "no light backgrounds." This constraint belongs in the interaction spec, not left to engineering judgement.
- **Priority:** High

### Risk 2: Unexpected visual change is jarring for autistic users
- **Finding:** Autistic children are more sensitive to environmental changes. Applying a background they did not fully expect — because there was no live preview — can produce distress rather than delight.
- **Impact:** If the interaction applies the background immediately on tap with no preview stage, and the result looks different from the thumbnail, Harry may have a negative reaction.
- **Recommendation:** The selected option must visually preview on the screen before a confirm/apply action. Alternatively, apply immediately but make "undo" (tap previous option to revert) zero-cost and immediately visible.
- **Priority:** High

### Risk 3: Font scope mismatch between the feature request and Harry's mental model
- **Finding:** The feature request says "font for the app." If font changes are applied app-wide, engineering must update every screen. If applied only to Home, Harry may be confused when he taps away and the font is different.
- **Impact:** A mismatch between where Harry expects the font to change and where it actually changes creates confusion and erodes trust in the setting.
- **Recommendation:** The UX spec must define font scope explicitly. If app-wide: confirm this is technically feasible with the current DS token system (likely yes, via a CSS variable). If Home-only: explicitly state "this font appears on the Home screen" in the UI label.
- **Priority:** Medium

### Risk 4: Adding personalisation to Settings increases the screen's cognitive load without wayfinding
- **Finding:** The Settings screen currently has four sections. Adding personalisation adds a fifth. Without clear section hierarchy, Harry may not find the options, or may take longer to find accessibility toggles he uses regularly.
- **Impact:** If personalisation options are added in a way that displaces or buries existing accessibility controls, usability of the Settings screen degrades.
- **Recommendation:** Personalisation should be a named section placed below accessibility but above data controls. It should not be the first item Harry sees in Settings — accessibility toggles are more functionally important and should remain at the top.
- **Priority:** Medium

### Risk 5: Background image loading performance on the Home screen
- **Finding:** The HomeScreen currently uses `bg-[var(--bg)]` — a CSS colour. A background image introduces network dependency (if images are remote) or bundle size (if local). On first load or after a cache clear, a missing background image would produce a jarring flash to the default dark background.
- **Impact:** A flash of default background on load could be disorienting. If background images are large, they delay the Home screen render.
- **Recommendation:** Background images must either be bundled assets (not fetched remotely) or have a graceful fallback to `--bg` while loading. This is a technical constraint the UR is flagging for the developer; the UX spec should note it.
- **Priority:** Medium (technical risk, not user experience risk per se)

---

## 6. Recommendations for UX

The following constraints are grounded in the findings above. They are recommendations to the UX designer, not optional notes.

**Background choices:**
- Provide 4–6 curated dark background options. No more than 6. No fewer than 3 (a choice of 2 feels limiting).
- All backgrounds must be dark. Average luminance must not exceed approximately 25–30% to maintain legibility of `--t1` and `--t2` text on top.
- Include at least one abstract gradient option in DS colours (as a safe "always works" default feel) and at least one photographic option (animals, nature) to connect with the app's theme.
- The "default" option (solid `#0D0D11`) must always be present and identifiable as the original.
- Selection must show a live preview before applying. The simplest implementation: tapping an option immediately changes the Home screen background behind the selection UI (full-screen preview). A separate "Apply" button confirms. A "Cancel" reverts.

**Font choices:**
- Provide 3 font options only: DM Sans (default), one rounder/warmer geometric sans-serif (e.g. Nunito), one alternative geometric sans-serif (e.g. Inter or Outfit).
- All fonts must be pre-loaded (Google Fonts or bundled) to avoid a flash of unstyled text on apply.
- Font scope must be defined in the spec before UX begins. The UR recommends app-wide as the more coherent option.
- Label the current/default font clearly as "Default" or show it pre-selected on first visit.

**Interaction pattern:**
- Maximum 2 steps to apply: enter section, tap option. Confirm only if genuinely needed (e.g. if there is a performance reason to apply on confirmation rather than on tap).
- No upload or external input. Curated options only.
- Reversibility must be immediate — tapping any option changes the preview. The user should never feel they have made a permanent mistake.
- No text description needed for backgrounds — visual thumbnails only. Keep the UI wordless where possible; Harry is responding to what things look like, not what they are called.

**Section placement in Settings:**
- New section title: "Appearance" (clear, plain, not "Customise" which implies more scope than is offered).
- Position: below "Accessibility," above "Your progress."

---

## 7. Out of Scope

The following personalisation options are too complex, too risky, or insufficiently motivated for this feature iteration:

- **Custom photo/wallpaper upload from camera roll.** Would require permission handling (camera/photos access), image cropping/fitting logic, content moderation risk (a child uploading inappropriate content, however unlikely), and significantly more engineering. The child-appropriate alternative is a curated set.
- **Colour theme or accent colour picker.** The NFT Dark DS uses a tightly controlled colour token system. Allowing arbitrary accent colour changes would require every tint pair, subcolour, and text colour to respond dynamically. This is a design system architecture project, not a feature.
- **Light mode / dark mode toggle.** The entire DS and every component is calibrated for the dark theme. A light mode would require a second full token set, second set of component variants, and comprehensive re-testing. Out of scope indefinitely.
- **Custom layout or icon rearrangement.** Children this age are not using Animal Kingdom as a productivity tool. Layout personalisation (move tabs, rearrange cards) is an enterprise app pattern with no motivation in this context.
- **Per-screen personalisation (different background for each tab).** Harry's request is for a Home screen background. Extending to per-screen personalisation multiplies the UI surface significantly and is not evidenced as a need.
- **Font size controls.** Font size accessibility is a separate concern from font character personalisation. If Harry needs font size adjustments, that belongs in the Accessibility section with a separate brief. It should not be co-located with font style choice as they serve different purposes for different reasons.
- **Animation speed personalisation beyond the existing reduce-motion toggle.** The app already has a reduce-motion toggle. Granular animation speed control is not evidenced as a need and would conflict with the existing reduce-motion system.

---

## Remaining Knowledge Gaps

- **Harry's appetite for repeated background/font changes.** Will he set once and leave it, or treat it as a rotating activity? Accepted as a risk — design for low-friction repeat use to cover both cases.
- **Harry's reaction to font changes at app scale.** Whether he perceives meaningful visual difference between the font options will only be known after use. Accepted as a risk — if he does not notice, the feature still provides the ownership feeling even if the functional difference is imperceptible.
- **Whether "Home screen background" matches Harry's mental model of what "background" means.** He may expect the background to appear on all screens, or he may not think about it. Monitor post-launch for any feedback or confusion.

---

## Assumption Audit (Template Format)

| Assumption | Status | Evidence | Recommendation |
|------------|--------|----------|----------------|
| Harry wants personalisation, not just utility | VALIDATED | Ownership model established; this aligns with child developmental motivation at 8–12 | Proceed |
| Harry can complete a 2-step selection flow independently | VALIDATED | Uses Settings screen independently today | Keep to max 2 steps |
| Preview before apply is necessary | VALIDATED | Child UX research; autistic users' sensitivity to unexpected change | Make preview immediate and inline |
| All backgrounds can be dark and still feel varied | VALIDATED (conditionally) | Dark themes can span space, ocean, forest, gradient — enough variety exists | Curate options for perceived variety, not just technical compliance |
| Font changes are app-wide | ASSUMED — unvalidated | Not confirmed by the feature request or direct observation | UX spec must define scope explicitly before Phase C |
| 4–6 backgrounds and 3 fonts is the right choice density | ASSUMED — medium confidence | Grounded in child UX and choice overload research; Harry's tolerance is unknown | Treat as upper bounds; prefer the smaller end |
| Background images will perform acceptably on first load | ASSUMED | Depends on implementation; flagged as a technical risk for the developer | Bundle assets locally, define loading fallback in the spec |

---

## Sign-off

UR findings complete. UX may proceed with the constraints in section 6.

[ ] High-risk findings (Risk 1 and Risk 2) have been reviewed by [OWNER] before UX begins.

> Key handoff points for UX Designer:
> - Section 3 Finding 3: all backgrounds must be dark — this is a hard constraint, not a preference
> - Section 5 Recommendations: max 6 backgrounds, 3 fonts, 2-step flow, live preview, no upload
> - Section 6 Risk 3: font scope (app-wide vs Home-only) must be explicitly defined in the interaction spec
> - Section 7 Out of Scope: light mode, colour picker, layout changes — do not include in this feature
